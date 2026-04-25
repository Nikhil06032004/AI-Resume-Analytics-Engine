import io
import re
from typing import Dict, List, Tuple

import cv2
import numpy as np
import pdfplumber
import pytesseract
from docx import Document
from pdf2image import convert_from_bytes
from PIL import Image

# PDFs with fewer characters than this threshold are treated as image-based
# and routed through the OCR fallback pipeline.
_OCR_THRESHOLD = 50

IMAGE_EXTENSIONS: frozenset[str] = frozenset({".png", ".jpg", ".jpeg"})


# ---------------------------------------------------------------------------
# OCR helpers
# ---------------------------------------------------------------------------

def _clean_ocr_text(text: str) -> str:
    """Normalize whitespace artifacts that OCR engines commonly produce."""
    text = re.sub(r"[ \t]+", " ", text)       # collapse horizontal runs
    text = re.sub(r"\n{3,}", "\n\n", text)    # at most one blank line
    lines = [line.strip() for line in text.splitlines()]
    return "\n".join(lines).strip()


def preprocess_image(image: Image.Image) -> np.ndarray:
    """
    Convert a PIL image to a binarised OpenCV array optimised for Tesseract.

    Pipeline:
      1. Force RGB so the array is always 3-channel regardless of input mode.
      2. Grayscale conversion.
      3. Light Gaussian blur to suppress JPEG / scanner noise.
      4. Adaptive thresholding — handles uneven lighting in scanned documents
         far better than a global threshold.  Otsu is kept as a fallback for
         high-contrast clean images where adaptive can over-segment.
    """
    rgb     = np.array(image.convert("RGB"))
    gray    = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)

    # Adaptive threshold — best for scanned / uneven-light documents
    adaptive = cv2.adaptiveThreshold(
        blurred, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=15,
        C=8,
    )

    # Otsu — best for clean high-contrast images (digital PDFs rendered to PNG)
    _, otsu = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Pick the result with higher mean pixel value (more white = cleaner page)
    return adaptive if adaptive.mean() >= otsu.mean() else otsu


def _ocr_with_confidence(
    processed: np.ndarray,
    min_conf: int = 60,
) -> str:
    """
    Run Tesseract's detailed data extraction and discard low-confidence words.

    Uses image_to_data to get per-word confidence scores, then reconstructs
    the text line-by-line preserving the original spatial structure.
    Falls back to image_to_string when no word clears the threshold (e.g.
    very degraded scans) so we never silently return empty text.
    """
    data: Dict = pytesseract.image_to_data(
        processed, lang="eng", output_type=pytesseract.Output.DICT
    )

    # Group accepted words by their (block, paragraph, line) address.
    lines: Dict[Tuple[int, int, int], List[str]] = {}
    for i, word in enumerate(data["text"]):
        word = word.strip()
        if not word:
            continue
        conf = int(data["conf"][i])
        if conf < min_conf:
            continue
        key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
        lines.setdefault(key, []).append(word)

    if not lines:
        # No word passed the threshold — fall back to unfiltered output.
        return pytesseract.image_to_string(processed, lang="eng")

    return "\n".join(" ".join(words) for words in lines.values())


def _extract_text_from_images(images: List[Image.Image]) -> str:
    """
    Preprocess each PIL image with OpenCV, then run confidence-filtered OCR.
    """
    pages: List[str] = []
    for image in images:
        processed = preprocess_image(image)
        raw       = _ocr_with_confidence(processed)
        cleaned   = _clean_ocr_text(raw)
        if cleaned:
            pages.append(cleaned)
    return "\n\n".join(pages)


def _pdf_ocr_fallback(file_bytes: bytes) -> str:
    """Convert every PDF page to a 300-dpi image, then OCR each one."""
    try:
        images = convert_from_bytes(file_bytes, dpi=300)
    except Exception as exc:
        raise ValueError(
            f"Could not render PDF pages for OCR (is Poppler installed?): {exc}"
        ) from exc
    return _extract_text_from_images(images)


# ---------------------------------------------------------------------------
# Format-specific extractors
# ---------------------------------------------------------------------------

def _extract_from_pdf(file_bytes: bytes) -> str:
    """
    Try pdfplumber first (native text layer).
    Fall back to Tesseract OCR when the layer is absent or too sparse
    (scanned / image-based PDFs).
    """
    pages: List[str] = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                pages.append(page_text.strip())

    text = "\n\n".join(pages)

    if len(text.strip()) < _OCR_THRESHOLD:
        text = _pdf_ocr_fallback(file_bytes)

    return text


def _extract_from_docx(file_bytes: bytes) -> str:
    document = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text.strip() for p in document.paragraphs if p.text.strip()]
    return "\n".join(paragraphs)


def _extract_from_txt(file_bytes: bytes) -> str:
    try:
        return file_bytes.decode("utf-8").strip()
    except UnicodeDecodeError:
        return file_bytes.decode("latin-1").strip()


def _extract_from_image(file_bytes: bytes) -> str:
    """Open any Pillow-supported image, preprocess with OpenCV, then OCR."""
    try:
        image = Image.open(io.BytesIO(file_bytes))
    except Exception as exc:
        raise ValueError(f"Cannot open image file: {exc}") from exc
    processed = preprocess_image(image)
    raw       = _ocr_with_confidence(processed)
    return _clean_ocr_text(raw)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def extract_text(file_bytes: bytes, filename: str) -> str:
    """
    Dispatch to the correct extractor based on file extension.
    Raises ValueError for unsupported formats, unreadable files,
    or a missing Tesseract installation.
    """
    if not filename or "." not in filename:
        raise ValueError("Filename must include a valid extension.")

    extension = "." + filename.rsplit(".", 1)[-1].lower()

    try:
        if extension == ".pdf":
            text = _extract_from_pdf(file_bytes)
        elif extension == ".docx":
            text = _extract_from_docx(file_bytes)
        elif extension == ".txt":
            text = _extract_from_txt(file_bytes)
        elif extension in IMAGE_EXTENSIONS:
            text = _extract_from_image(file_bytes)
        else:
            raise ValueError(f"Unsupported file extension: '{extension}'")

    except pytesseract.TesseractNotFoundError:
        raise ValueError(
            "Tesseract OCR engine is not installed or not found in PATH. "
            "See README.md for installation instructions."
        )

    if not text or not text.strip():
        raise ValueError(
            "No text could be extracted. "
            "The file may be blank, corrupt, or a purely graphical image."
        )

    return text
