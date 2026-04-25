# ─────────────────────────────────────────────────────────────────
#  Stage 1 — dependency builder
#  Install Python packages in an isolated layer so the final image
#  only re-runs pip when requirements.txt changes.
# ─────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# System libs needed to compile / link some packages
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        g++ \
        libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ─────────────────────────────────────────────────────────────────
#  Stage 2 — runtime image
# ─────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

# OCR + PDF-to-image + OpenCV runtime deps
RUN apt-get update && apt-get install -y --no-install-recommends \
        tesseract-ocr \
        tesseract-ocr-eng \
        poppler-utils \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender1 \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Copy application source
COPY . .

# Download spaCy English model (cached in image layer — re-downloads only when
# the spacy version in requirements.txt changes)
RUN python -m spacy download en_core_web_sm --no-deps \
    && python -c "import spacy; spacy.load('en_core_web_sm')"

# Runtime environment
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

EXPOSE 8000

# Render / Railway / Fly inject $PORT; fall back to 8000 for local Docker runs
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
