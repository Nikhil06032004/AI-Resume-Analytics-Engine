# Resume Analyzer — Backend

FastAPI backend for resume parsing and feature-based scoring.

---

## System Requirements

### Python
Python 3.10 or higher.

### Tesseract OCR *(required for scanned PDFs and image uploads)*

Tesseract must be installed **separately** — it is a native binary, not a Python package.

| Platform | Command |
|---|---|
| **Windows** | Download installer from https://github.com/UB-Mannheim/tesseract/wiki — install it, then add the install directory (e.g. `C:\Program Files\Tesseract-OCR`) to your system `PATH`. |
| **Linux (Debian/Ubuntu)** | `sudo apt install tesseract-ocr` |
| **macOS** | `brew install tesseract` |

Verify the install:
```bash
tesseract --version
```

### Poppler *(required for converting scanned PDFs to images)*

`pdf2image` depends on Poppler's `pdftoppm` utility.

| Platform | Command |
|---|---|
| **Windows** | Download from https://github.com/oschwartz10612/poppler-windows/releases — extract it and add the `bin/` folder to your system `PATH`. |
| **Linux (Debian/Ubuntu)** | `sudo apt install poppler-utils` |
| **macOS** | `brew install poppler` |

---

## Setup

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. (Optional) copy env file
cp .env.example .env

# 3. Start the server
uvicorn app.main:app --reload
```

API is available at: http://127.0.0.1:8000  
Interactive docs: http://127.0.0.1:8000/docs

---

## Supported File Types

| Format | Extraction Method |
|---|---|
| `.pdf` (text-based) | pdfplumber (native text layer) |
| `.pdf` (scanned/image-based) | pdf2image → Tesseract OCR (auto-fallback) |
| `.docx` | python-docx |
| `.txt` | direct UTF-8 / Latin-1 decode |
| `.png` | Pillow → Tesseract OCR |
| `.jpg` / `.jpeg` | Pillow → Tesseract OCR |

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/resume/upload` | Parse file, return text preview |
| `POST` | `/resume/analyze` | Parse file + run full analysis engine |
