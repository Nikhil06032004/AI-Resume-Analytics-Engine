# AI Resume Analytics Engine

[![CI](https://github.com/Nikhil06032004/AI-Resume-Analytics-Engine/actions/workflows/ci.yml/badge.svg)](https://github.com/Nikhil06032004/AI-Resume-Analytics-Engine/actions/workflows/ci.yml)
[![Deploy](https://github.com/Nikhil06032004/AI-Resume-Analytics-Engine/actions/workflows/deploy.yml/badge.svg)](https://github.com/Nikhil06032004/AI-Resume-Analytics-Engine/actions/workflows/deploy.yml)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel&logoColor=white)](https://resume-insight-engine.vercel.app)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=white)](https://ai-resume-analytics-engine.onrender.com)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

| | |
|---|---|
| **Live App** | https://resume-insight-engine.vercel.app |
| **API** | https://ai-resume-analytics-engine.onrender.com |
| **API Docs** | https://ai-resume-analytics-engine.onrender.com/docs |
| **Repository** | https://github.com/Nikhil06032004/AI-Resume-Analytics-Engine |

---

A production-deployed, full-stack resume analysis platform. Upload any resume — PDF, DOCX, TXT, or image scan — and receive a structured analysis computed from the document's real content using OCR, NLP, a deterministic scoring engine, and Google Gemini AI feedback. Every score, chart, and recommendation is derived directly from the uploaded file. No mock data. No placeholders.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Live Deployment](#2-live-deployment)
3. [CI/CD Workflows](#3-cicd-workflows)
   - [CI Workflow — ci.yml](#ci-workflow--ciyml)
   - [Deploy Workflow — deploy.yml](#deploy-workflow--deployyml)
   - [GitHub Actions Debugging History](#github-actions-debugging-history)
4. [System Architecture](#4-system-architecture)
5. [User Workflow — Landing Page + 4 Steps](#5-user-workflow--landing-page--4-steps)
6. [File Parsing Pipeline](#6-file-parsing-pipeline)
   - [PDF Parsing](#pdf-parsing)
   - [DOCX Parsing](#docx-parsing)
   - [TXT Parsing](#txt-parsing)
   - [Image OCR Parsing](#image-ocr-parsing)
   - [OCR Preprocessing Detail](#ocr-preprocessing-detail)
7. [Analysis Engine](#7-analysis-engine)
   - [Feature Extraction](#feature-extraction)
   - [NLP Enrichment](#nlp-enrichment)
   - [Scoring Model](#scoring-model)
8. [AI Insights Layer](#8-ai-insights-layer)
9. [Database Storage](#9-database-storage)
10. [API Reference](#10-api-reference)
11. [Tech Stack](#11-tech-stack)
12. [Project Structure](#12-project-structure)
13. [Local Development Setup](#13-local-development-setup)
14. [Production Deployment Guide](#14-production-deployment-guide)
15. [Environment Variables](#15-environment-variables)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Project Overview

### What It Does

The AI Resume Analytics Engine accepts a resume file, extracts its text through OCR and format-specific parsers, runs a multi-stage analysis pipeline, and returns a structured report covering:

- An **overall score** (0–100) with a letter grade (A+ → F)
- Four **component scores** — Experience, Skills, Content Quality, ATS Compatibility
- **Skill detection** across six technology taxonomy categories
- **NLP-extracted entities** — companies, job titles, experience timeline
- **Google Gemini AI feedback** — career level, role recommendations, ATS tips, red flags
- **Raw file storage** in MongoDB GridFS with the original filename preserved

### Key Design Principles

| Principle | Implementation |
|---|---|
| No mock data | Every number derives from the uploaded document |
| Graceful degradation | AI, DB, and OCR failures never crash the analysis |
| Non-blocking storage | MongoDB writes happen after the response is sent |
| Deterministic scoring | Same input always produces the same score |
| Zero credentials in code | All secrets via environment variables only |

---

## 2. Live Deployment

| Layer | Platform | URL | Notes |
|---|---|---|---|
| Frontend | Vercel (free tier) | https://resume-insight-engine.vercel.app | Edge CDN, auto-deploy on push |
| Backend | Render (free tier) | https://ai-resume-analytics-engine.onrender.com | Docker container, spins down after 15 min idle |
| Database | MongoDB Atlas (M0 free) | — | 512 MB, `resume_analyzer` database |
| File Storage | MongoDB GridFS | — | Binary chunks in `resume_files` bucket |
| AI | Google AI Studio | — | Gemini 2.0 Flash, free tier |

### Deployment Flow

```
git push origin main
        │
        ├─▶ GitHub Actions ci.yml
        │         Lint + type-check + build + tests
        │         Must all pass (required checks)
        │
        └─▶ GitHub Actions deploy.yml
                  │
                  ├─▶ curl RENDER_DEPLOY_HOOK → Render rebuilds Docker image
                  └─▶ Vercel auto-detects push → rebuilds Vite app
```

---

## 3. CI/CD Workflows

### CI Workflow — `ci.yml`

**File:** `.github/workflows/ci.yml`  
**Triggers:** Every `push` to `main` AND every `pull_request` targeting `main`

```
On: pull_request → main
On: push → main
```

#### Job 1 — Frontend CI

Runner: `ubuntu-latest`

| Step | Command | Purpose |
|---|---|---|
| Checkout | `actions/checkout@v4` | Clone the repository |
| Setup Node | `actions/setup-node@v4` (reads `.nvmrc` → Node 20) | Install correct Node version with npm cache |
| Install deps | `npm ci` | Clean install from `package-lock.json` |
| Lint | `npm run lint` (= `eslint .`) | ESLint 9 flat config + `@typescript-eslint/recommended` |
| Type check | `npx tsc -p tsconfig.app.json --noEmit` | TypeScript strict mode on `src/` only |
| Build | `npm run build` with `VITE_API_URL=https://api.example.com` | Vite production build |
| Upload artefact | `actions/upload-artifact@v4` (main branch only) | Store `dist/` for 1 day |

**Why `tsconfig.app.json` and not `tsconfig.json`:**  
`tsconfig.json` is a TypeScript project-references wrapper with `"files": []`. Running `tsc --noEmit` against it checks nothing. `tsconfig.app.json` includes `"src"` and runs strict checks on all application source files.

#### Job 2 — Backend CI

Runner: `ubuntu-latest`  
Working directory: `backend/`

| Step | Command | Purpose |
|---|---|---|
| Checkout | `actions/checkout@v4` | Clone the repository |
| Setup Python | `actions/setup-python@v5` (Python 3.11, pip cache keyed on `requirements.txt`) | Install correct Python with dependency cache |
| Install deps | `pip install -r requirements.txt` | All Python packages including spaCy, FastAPI, Motor |
| Install ruff | `pip install ruff` | Fast Python linter (replaces flake8 + isort) |
| Lint | `ruff check app/ --output-format=github` | `E`, `F`, `W`, `I` rules; `github` format annotates PR diffs |
| Download model | `python -m spacy download en_core_web_sm` | NLP model needed for test imports |
| Verify model | `python -c "import spacy; spacy.load('en_core_web_sm')"` | Confirms model is importable before running tests |
| Run tests | `pytest tests/ -v --tb=short` with empty `MONGODB_URI` and `AI_API_KEY` | Smoke tests that run without real credentials |

**`ruff.toml` configuration** (in `backend/`):
```toml
line-length = 100
[lint]
select = ["E", "F", "W", "I"]
ignore = ["E501", "F401", "W293", "E741"]
[lint.per-file-ignores]
"tests/*" = ["F811", "S101"]
```

**`pytest.ini` configuration** (in `backend/`):
```ini
[pytest]
asyncio_mode = auto
testpaths = tests
```
`asyncio_mode = auto` is required for `pytest-asyncio >= 0.21` to automatically handle `async def` test functions.

#### Job 3 — Docker Build Check

Runner: `ubuntu-latest`  
**Condition:** Only runs on `pull_request` events (not on push to main — saves CI minutes)

| Step | Action | Purpose |
|---|---|---|
| Checkout | `actions/checkout@v4` | Clone |
| Setup Buildx | `docker/setup-buildx-action@v3` | Enable multi-platform builds |
| Build image | `docker/build-push-action@v5` (push: false) | Build from `backend/Dockerfile`, no registry push |

Uses GitHub Actions cache (`type=gha`) so subsequent PR builds reuse Docker layers.

---

### Deploy Workflow — `deploy.yml`

**File:** `.github/workflows/deploy.yml`  
**Trigger:** `push` to `main` only (i.e. after a PR is merged)

#### Job 1 — Deploy Backend → Render

```bash
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${{ secrets.RENDER_DEPLOY_HOOK }}")
```

- Calls the Render deploy hook URL stored in GitHub secret `RENDER_DEPLOY_HOOK`
- Render receives the POST, pulls the latest `main` branch, rebuilds the Docker image, and swaps the container
- First build: ~6–8 min (Docker layers not cached). Subsequent builds: ~2–3 min (layers cached)
- Exits with code 1 if Render returns anything other than HTTP 200 or 201
- If `RENDER_DEPLOY_HOOK` is not set, prints a warning but does not fail the job

#### Job 2 — Deploy Frontend → Vercel

- `needs: deploy-backend` — waits for backend deploy to trigger first
- Vercel deploys automatically via its GitHub App integration — no curl needed
- This job only logs confirmation and the Vercel dashboard URL

#### Job 3 — Summary

- `needs: [deploy-backend, deploy-frontend]` with `if: always()`
- Prints the outcome of both deploy jobs regardless of success or failure

---

### GitHub Actions Debugging History

These issues were discovered and fixed during CI setup. Documented here so future contributors understand non-obvious decisions:

| Issue | Root Cause | Fix Applied |
|---|---|---|
| Frontend CI: TypeScript checks nothing | `tsc --noEmit` targets `tsconfig.json` which has `"files":[]` — project references wrapper | Changed to `tsc -p tsconfig.app.json --noEmit` |
| Backend CI: ruff `E701` ×5 | `if score >= 90: return "A+"` — multiple statements on one line | Expanded each `if/return` to two lines in `db_service.py` |
| Backend CI: ruff `I001` ×3 | Import blocks unsorted in `main.py`, `resume.py`, `db_service.py` | `ruff check --fix` auto-sorted all import blocks |
| Frontend CI: ESLint `no-unused-vars` | `nlpInsights` destructured in `Dashboard.tsx` but never referenced | Removed from destructure |
| Frontend CI: ESLint `no-explicit-any` | `skillMatch: any` in `resumeAnalyzer.ts` | Typed as `{ matchPercentage: number; missing: string[] }` |
| Frontend CI: ESLint errors ×3 | `resumeParser.ts` and `resumeAnalyzer.ts` — dead code, no imports | Deleted both files entirely |
| Frontend CI: TypeScript `TS2339` (`never`) | `BackendNLPInsights.experience_timeline: string[]` intersected with `(string \| Entry)[]` → element type resolved to `string` → after string guard, narrowed to `never` | Changed interface declaration to `(string \| BackendNLPExperienceEntry)[]` directly |
| Landing page bypassed — dashboard shown on load | `<script type="module" src="/src/main.tsx">` auto-executed `createRoot().render()` on every page load; `#root { display:none }` hid React visually but it was mounted | Changed `main.tsx` to register `window.mountApp` instead of self-executing; `enterApp()` calls `window.mountApp()` on click. Note: dynamic `import('/src/main.tsx')` inside `<script type="module">` was tried first but breaks in production — Vite compiles TypeScript to hashed filenames, so the path doesn't exist at runtime |

---

## 4. System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       AI RESUME ANALYTICS ENGINE                         │
│                         Production Architecture                          │
└──────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────┐   HTTPS    ┌──────────────────────────────────┐
  │   Vercel (Frontend)     │◀──────────▶│   Render (Backend — Docker)      │
  │                         │            │                                  │
  │   React 18 + Vite       │            │   FastAPI + Uvicorn              │
  │   TypeScript 5.5        │            │   Python 3.11                    │
  │   Tailwind CSS 3        │            │                                  │
  │   ECharts 6             │            │  ┌─────────────────────────┐    │
  │   Lucide React          │            │  │ parser.py               │    │
  │   React Context API     │            │  │  pdfplumber / OCR       │    │
  │                         │            │  │  python-docx            │    │
  │  4-step flow:           │            │  │  OpenCV + Tesseract     │    │
  │   Upload → Job Match    │            │  ├─────────────────────────┤    │
  │   → Analyzing           │            │  │ analyzer.py             │    │
  │   → Dashboard           │            │  │  regex feature extract  │    │
  │                         │            │  │  deterministic scoring  │    │
  │  Charts:                │            │  ├─────────────────────────┤    │
  │   ScoreGauge            │            │  │ nlp_service.py          │    │
  │   RadarChart            │            │  │  spaCy en_core_web_sm   │    │
  │   PieChart              │            │  │  NER + noise filter     │    │
  │   BarChart              │            │  ├─────────────────────────┤    │
  └─────────────────────────┘            │  │ ai_service.py           │    │
                                         │  │  Gemini 2.0 Flash       │    │
                                         │  │  SHA-256 cache          │    │
                                         │  ├─────────────────────────┤    │
                                         │  │ db_service.py           │    │
                                         │  │  Motor async driver     │    │
                                         │  │  GridFS file upload     │    │
                                         │  └─────────────────────────┘    │
                                         └──────────────┬───────────────────┘
                                                        │
                                         ┌──────────────▼───────────────────┐
                                         │         MongoDB Atlas            │
                                         │                                  │
                                         │  Database: resume_analyzer       │
                                         │  ┌────────────────────────────┐  │
                                         │  │ Collection: resumes        │  │
                                         │  │  meta, score, features,    │  │
                                         │  │  ai_insights, insights     │  │
                                         │  ├────────────────────────────┤  │
                                         │  │ GridFS: resume_files       │  │
                                         │  │  .files   (metadata)       │  │
                                         │  │  .chunks  (binary data)    │  │
                                         │  └────────────────────────────┘  │
                                         │  Indexes:                        │
                                         │   idx_upload_date (DESC)         │
                                         │   idx_user_history (user + date) │
                                         │   idx_score (overall DESC)       │
                                         └──────────────────────────────────┘
                                                        │
                                         ┌──────────────▼───────────────────┐
                                         │     Google AI Studio             │
                                         │     Gemini 2.0 Flash             │
                                         │     (optional AI layer)          │
                                         └──────────────────────────────────┘
```

---

## 5. User Workflow — Landing Page + 4 Steps

```
┌───────────────────────────────────────────────────────────────────┐
│  LANDING PAGE  (index.html — pure static HTML, no React)          │
│                                                                   │
│  Shown immediately on every page load. React bundle is fetched    │
│  but does NOT mount until the user clicks "Open Dashboard".       │
│                                                                   │
│  Sections:  Hero · Pipeline overview · Features bento grid        │
│             OCR detail · Scoring model · Tech stack · CTA         │
│                                                                   │
│  [Open Dashboard →]  →  enterApp() called                         │
│       │                                                           │
│       ├─ Sets window.__enterAppCalled = true                       │
│       ├─ Calls window.mountApp() (registered by main.tsx)         │
│       ├─ Shows loading overlay (spinner, 550 ms)                  │
│       └─ Hides #landing, shows #root (React app)                  │
└────────────────────────────┬──────────────────────────────────────┘
                             ▼
┌───────────────────────────────────────────────────────────────────┐
│  STEP 1 — UPLOAD                              ProgressTracker: ●○○○│
│                                                                   │
│  ┌─ Name input (optional) ───────────────────────────────┐        │
│  │  "Enter your name"  →  stored in MongoDB meta         │        │
│  └──────────────────────────────────────────────────────┘        │
│                                                                   │
│  ┌─ Drop Zone ────────────────────────────────────────────┐       │
│  │  Drag & drop  OR  click to browse                      │       │
│  │  Accepted: .pdf .docx .txt .png .jpg .jpeg             │       │
│  │  Max size: 10 MB                                       │       │
│  │  Validates: extension whitelist + empty guard          │       │
│  └──────────────────────────────────────────────────────┘        │
│                                                                   │
│  → File confirmed → [Continue to Analysis]                        │
└────────────────────────────┬──────────────────────────────────────┘
                             ▼
┌───────────────────────────────────────────────────────────────────┐
│  STEP 2 — JOB MATCH (optional)                ProgressTracker: ●●○○│
│                                                                   │
│  Paste job description → sent to Gemini as context               │
│  Improves AI role-match and ATS gap analysis                     │
│  [Skip] → runs analysis without job targeting                    │
│  [Analyze with Job Match] → triggers POST /resume/analyze        │
└────────────────────────────┬──────────────────────────────────────┘
                             ▼
┌───────────────────────────────────────────────────────────────────┐
│  STEP 3 — ANALYSING                           ProgressTracker: ●●●○│
│                                                                   │
│  Animated 6-step progress cards:                                 │
│  [Parsing Resume] → [Content Analysis] → [NLP Processing]        │
│  → [Skill Matching] → [Score Calculation] → [AI Insights]        │
│                                                                   │
│  After animation: if API still running →                         │
│  "Generating AI Insights" waiting state with spinner             │
└────────────────────────────┬──────────────────────────────────────┘
                             ▼
┌───────────────────────────────────────────────────────────────────┐
│  STEP 4 — RESULTS DASHBOARD                   ProgressTracker: ●●●●│
│                                                                   │
│  KPI Strip:   Overall Score │ Experience │ Skills │ ATS          │
│                                                                   │
│  Row 1:  ScoreGauge (ECharts)  │  PieChart skill categories      │
│  Row 2:  RadarChart sections   │  BarChart keyword frequency      │
│                                                                   │
│  AI Cards:  Career Profile  ·  Recommended Roles                 │
│             ATS Tips  ·  Project Suggestions                     │
│             Red Flags  ·  Unique Insights                        │
│                                                                   │
│  Engine Cards:  Strengths  ·  Areas to Improve  ·  Action Plan  │
│                                                                   │
│  [Get AI Suggestions]  →  triggers Gemini on demand              │
│  [Analyse Another]     →  resets all state                       │
└───────────────────────────────────────────────────────────────────┘
```

---

## 6. File Parsing Pipeline

**Entry point:** `backend/app/services/parser.py` → `extract_text(file_bytes, filename)`

The router reads the entire file into memory (`await file.read()`), validates size (10 MB max), then passes `(bytes, filename)` to the parser. The parser dispatches by extension.

### PDF Parsing

```
file_bytes (.pdf)
        │
        ▼
pdfplumber.open(BytesIO(bytes))
        │
        ├─ For each page: page.extract_text()
        ├─ Join pages with "\n\n"
        │
        └─ len(extracted_text.strip()) < 50 characters?
                │                    │
               YES                   NO
                │                    └─▶ return text (native layer)
                ▼
        _pdf_ocr_fallback(file_bytes)
                │
                ▼
        pdf2image.convert_from_bytes(bytes, dpi=300)
                │
                └─▶ _extract_text_from_images(images)
                            │
                            └─▶ per page: preprocess_image() → _ocr_with_confidence()
```

**OCR threshold:** 50 characters. PDFs with fewer than 50 extracted characters are treated as image-based (scanned) and routed through the OCR fallback regardless of whether text was found.

**PDF render DPI:** 300 dots per inch — balances OCR accuracy against memory usage.

### DOCX Parsing

```python
document = Document(io.BytesIO(file_bytes))
paragraphs = [p.text.strip() for p in document.paragraphs if p.text.strip()]
return "\n".join(paragraphs)
```

Extracts all non-empty paragraph objects from the Word XML structure. Joined with single newlines. Note: table cell text is not extracted in the current implementation.

### TXT Parsing

```python
try:
    return file_bytes.decode("utf-8").strip()
except UnicodeDecodeError:
    return file_bytes.decode("latin-1").strip()
```

UTF-8 primary with `latin-1` (ISO 8859-1) fallback — handles legacy Windows-encoded text files.

### Image OCR Parsing

For `.png`, `.jpg`, `.jpeg` files:

```
file_bytes → PIL Image.open()
                │
                ▼
        preprocess_image(image)
                │
                ▼
        _ocr_with_confidence(processed, min_conf=60)
                │
                ▼
        _clean_ocr_text(raw_text)
```

### OCR Preprocessing Detail

Source: `preprocess_image()` in `parser.py`

```
PIL Image (any mode)
        │
        ▼ .convert("RGB") → np.array()
3-channel uint8 NumPy array
        │
        ▼ cv2.cvtColor(RGB → GRAY)
Grayscale
        │
        ▼ cv2.GaussianBlur(kernel=(3,3), sigma=0)
Noise-suppressed grayscale
        │
        ├─────────────────────────────────────────┐
        ▼                                         ▼
cv2.adaptiveThreshold(                    cv2.threshold(
  ADAPTIVE_THRESH_GAUSSIAN_C,              THRESH_BINARY + THRESH_OTSU
  THRESH_BINARY,                         )
  blockSize=15, C=8                       — global threshold, Otsu algorithm
)                                         — best for clean high-contrast images
— local threshold per 15×15 block
— best for scanned uneven-light docs
        │                                         │
        └───────── compare .mean() ───────────────┘
                        │
                        ▼
              Higher mean = more white pixels = cleaner binarisation
              return whichever result has higher mean pixel value
```

**Confidence-filtered OCR** (`_ocr_with_confidence`):

1. Runs `pytesseract.image_to_data()` to get per-word confidence scores (0–100)
2. Discards any word with confidence below **60**
3. Groups accepted words by `(block_num, par_num, line_num)` to preserve spatial structure
4. Falls back to `image_to_string()` if no word passes the threshold (very degraded scans)

**Text cleanup** (`_clean_ocr_text`):
- Collapses multiple horizontal spaces/tabs to single space
- Collapses 3+ consecutive newlines to maximum 2
- Strips leading/trailing whitespace per line

---

## 7. Analysis Engine

**Entry point:** `backend/app/services/analyzer.py` → `analyze_resume(text, job_description=None)`

### Feature Extraction

Four independent extractors run on the normalized text in sequence:

#### Experience Features

```python
# Year range regex — captures YYYY–YYYY and YYYY–present
_YEAR_RANGE_RE = re.compile(
    r"((?:19|20)\d{2})\s*(?:[-–—]+|to)\s*((?:19|20)\d{2}|present|current|now)",
    re.IGNORECASE,
)

# Bullet point regex — line starts with common bullet characters
_BULLET_RE = re.compile(r"^[\s]*[•\-\*•●▪>]\s+\S")
```

| Signal | Method | Value |
|---|---|---|
| Estimated years | Sum all YYYY–YYYY month spans ÷ 12. "present/current/now" = 2025 | `float` |
| Bullet points | Count lines matching `_BULLET_RE` | `int` |
| Action verbs | Match against 65-word frozenset (achieved, deployed, led, optimized, …) | `int` |
| Unique role types | Regex `\b(engineer\|developer\|manager\|analyst\|designer\|…)\b`, deduplicated | `int` |

#### Skills Features

SKILL_TAXONOMY (6 categories, ~90 total skills):

| Category | Sample Skills |
|---|---|
| `programming` | python, javascript, typescript, java, c++, go, rust, ruby, php, swift |
| `web` | react, vue, angular, html, css, tailwind, nextjs, django, flask, fastapi |
| `tools` | git, docker, kubernetes, jenkins, terraform, jira, figma, linux, nginx |
| `database` | mysql, postgresql, mongodb, redis, elasticsearch, firebase, dynamodb |
| `cloud` | aws, azure, gcp, heroku, vercel, netlify, s3, ec2, lambda |
| `data` | pandas, numpy, tensorflow, pytorch, scikit-learn, spark, kafka, tableau |

Each skill is matched with `re.search(r"\b" + re.escape(skill) + r"\b", text.lower())` — word-boundary anchored, case-insensitive.

#### Content Quality Features

```python
# Quantified metric regex — %, $, ×, and headcount patterns
_NUMERIC_METRIC_RE = re.compile(
    r"(\d+\.?\d*\s*%"
    r"|\$\s*[\d,]+"
    r"|\d+[xX]\b"
    r"|\b\d{2,}\+?\s*(?:users|clients|engineers|employees|teams|projects|services|customers))",
    re.IGNORECASE,
)
```

| Signal | Method |
|---|---|
| Bullet point count | Same `_BULLET_RE` as experience |
| Numeric metrics | Count matches of `_NUMERIC_METRIC_RE` |
| Action verb ratio | Action verb count ÷ total word count |
| Avg sentence length | Split on `.!?`, mean word count per sentence |

#### ATS Features

| Signal | Method |
|---|---|
| Keyword density | (action verb + taxonomy skill hits) ÷ total word count |
| Section completeness | Presence of Experience, Education, Skills, Summary headers |
| Formatting quality | (bullet line ratio + readable line ratio) ÷ 2 |

Section detection: each line is checked for < 60 chars AND containing an anchor keyword (e.g. "experience", "work history", "employment" → `experience` section).

---

### NLP Enrichment

**Entry point:** `backend/app/services/nlp_service.py`

spaCy model: `en_core_web_sm`, loaded with `disable=["lemmatizer"]` for speed.

```
text → spacy.load("en_core_web_sm")(text[:nlp.max_length])
            │
            ├─ NER pass
            │     ORG entities  →  potential company names
            │     DATE entities →  date strings
            │
            ├─ Noun chunk pass
            │     chunks containing ROLE_KEYWORDS
            │     (engineer, developer, manager, analyst, …)
            │     length 2–6 words → job title phrases
            │
            └─ _parse_timeline(text)
                    YEAR_RANGE_RE matches → [{start, end, duration_months}]
                    Sorted chronologically
                    Sanity check: duration > 0 and < 480 months (40 years)
```

**Noise filter** — `_is_noise(text)` rejects:

| Rule | Example rejected |
|---|---|
| Length < 3 chars | `"AI"`, `"C"` |
| Purely numeric | `"2019"`, `"123"` |
| Phone-number pattern | `"555-123-4567"` |
| All-caps section header | `"EDUCATION"`, `"SKILLS"` |
| Digit ratio > 55% | `"B2B4E1"` |
| Exact noise word | `"university"`, `"github"`, `"llc"`, `"inc"` (40+ words) |

**`num_jobs` strategy** — avoids inflation:
- Primary: `len(timeline)` — one date range ≈ one job
- Cap by entity count ± 2 to prevent over-counting
- Fallback (no date ranges): `len(companies)` → `len(roles)` → 0

**NLP override:** If spaCy's `experience_years` or `num_jobs` is higher than the regex-derived value, spaCy's value replaces it. If lower, the regex value is kept.

---

### Scoring Model

All scores are capped at 100. No random values. No hardcoded ranges.

#### Experience Score — 30% weight

| Signal | Formula | Cap |
|---|---|---|
| Unique role types | count × 15 | 40 |
| Bullet points | count × 2 | 30 |
| Action verbs | count × 2 | 20 |
| Estimated years | years × 2 | 10 |

#### Skills Score — 25% weight

| Signal | Formula | Cap |
|---|---|---|
| Unique skills matched | count × 4 | 50 |
| Category spread | categories × 8 | 30 |
| Skill density | (skills ÷ words) × 2000 | 20 |

#### Content Quality Score — 20% weight

| Signal | Formula | Cap |
|---|---|---|
| Bullet points | count × 2 | 30 |
| Quantified metrics | count × 6 | 30 |
| Action verb ratio | ratio × 300 | 20 |
| Avg sentence length | 10–20 words = 20 pts; outside range tapers | 20 |

#### ATS Score — 15% weight

| Signal | Formula | Cap |
|---|---|---|
| Keyword density | density × 600 | 40 |
| Section completeness | present ÷ 4 sections × 40 | 40 |
| Formatting quality | quality × 20 | 20 |

#### Education Signal — 10% weight

| Detection | Points |
|---|---|
| Degree keyword (`bachelor`, `master`, `phd`, `b.tech`, `mba`, …) | +50 |
| Institution keyword (`university`, `college`, `institute`, …) | +25 |
| GPA mentioned | +15 |
| Honours (`distinction`, `cum laude`, `dean's list`) | +10 |

#### Composite Score and Grade

```
Overall = (0.30 × Experience)
        + (0.25 × Skills)
        + (0.20 × Content)
        + (0.15 × ATS)
        + (0.10 × Education)
```

| Score Range | Grade | Label |
|---|---|---|
| 90–100 | A+ | Exceptional |
| 80–89 | A | Strong |
| 70–79 | B | Good |
| 60–69 | C | Average |
| 50–59 | D | Needs Work |
| 0–49 | F | Poor |

---

## 8. AI Insights Layer

**Entry point:** `backend/app/services/ai_service.py` → `generate_ai_insights(text, features)`

Model: `gemini-2.0-flash` via the official `google-genai` SDK (`from google import genai`).  
Parameters: `temperature=0.3`, `max_output_tokens=2048`.

### When AI Runs

| Trigger | Mechanism |
|---|---|
| Job description provided | `analyzeResume()` in context calls `POST /resume/analyze` with `job_description` form field |
| "Get AI Suggestions" clicked | `getAISuggestions()` in context calls `POST /resume/analyze` again; only AI fields are used |

### Input Sent to Gemini

```
Resume text      first 3,000 characters of extracted text
Skills           list of detected skills
Roles            NLP-extracted job title phrases
Companies        NLP-extracted organization names
Experience years float from scoring engine
Job description  first 1,500 characters (if provided)
```

### Output Schema

| Field | Type | Description |
|---|---|---|
| `summary` | `string \| null` | 2–3 sentence professional profile |
| `career_level` | `"fresher" \| "junior" \| "mid-level" \| "senior" \| null` | Validated against allowed set |
| `strengths` | `string[]` | Resume-specific strengths |
| `weaknesses` | `string[]` | Specific gaps |
| `improvements` | `string[]` | Concrete rewrite suggestions |
| `ats_tips` | `string[]` | ATS keyword and formatting advice |
| `project_suggestions` | `string[]` | Portfolio project ideas for skill gaps |
| `recommended_roles` | `string[]` | Suitable job titles |
| `red_flags` | `string[]` | Recruiter / ATS rejection triggers |
| `unique_insights` | `string[]` | Observations specific to this resume |

### Caching and Error Handling

**Cache:** SHA-256 hash of `(text[:500], features_dict)` → result stored in process memory. Identical resumes never hit the API twice per server session.

**Error mapping:**

| Condition | Message surfaced to user |
|---|---|
| HTTP 429 / `RESOURCE_EXHAUSTED` | "Gemini free-tier quota exhausted. Wait a minute and try again…" |
| HTTP 401 / 403 / `API_KEY_INVALID` | "Invalid or revoked API key. Generate a new key at aistudio.google.com" |
| SDK not installed | "google-genai SDK not installed. Run: pip install google-genai" |
| `AI_API_KEY` not set | "AI_API_KEY is not configured. Add AI_API_KEY=your_key to backend/.env" |

All errors are stored in the `ai_error` field of the response. The core analysis result is always preserved.

---

## 9. Database Storage

**Driver:** Motor (async MongoDB driver for Python)

### Collection: `resumes`

```json
{
  "_id": "ObjectId",
  "meta": {
    "user_name":           "Nikhil",
    "filename":            "nikhil_cv.pdf",
    "file_size_bytes":     142080,
    "file_id":             "6634abce1234ef567890abce",
    "upload_date":         "2026-04-25T10:30:00Z",
    "has_ai_insights":     true,
    "has_job_description": false
  },
  "score": {
    "overall": 74,
    "grade":   "B",
    "breakdown": {
      "experience": 68,
      "skills":     80,
      "content":    72,
      "ats":        65
    }
  },
  "features": {
    "skills": {
      "detected":           ["python", "react", "docker", "mongodb"],
      "by_category":        { "programming": ["python"], "web": ["react"] },
      "categories_covered": 4
    },
    "experience": {
      "years":     3.5,
      "num_jobs":  2,
      "companies": ["Acme Corp", "StartupXYZ"],
      "roles":     ["Software Engineer", "Backend Developer"],
      "timeline":  [{ "start": 2021, "end": 2024, "duration_months": 36 }]
    },
    "content": {
      "bullet_points":       18,
      "action_verbs_found":  12,
      "numeric_metrics":     5,
      "avg_sentence_length": 15.2,
      "sections_found":      ["experience", "skills", "education", "summary"]
    },
    "ats": {
      "keyword_density":      0.0412,
      "section_completeness": 0.75
    }
  },
  "ai_insights": {
    "summary":             "Experienced software engineer with 3.5 years…",
    "career_level":        "mid-level",
    "strengths":           ["..."],
    "weaknesses":          ["..."],
    "improvements":        ["..."],
    "ats_tips":            ["..."],
    "project_suggestions": ["..."],
    "recommended_roles":   ["Backend Engineer", "DevOps Engineer"],
    "red_flags":           ["..."],
    "unique_insights":     ["..."]
  },
  "ai_error": null,
  "insights": {
    "strengths":    ["Strong technical skill breadth (score: 80/100)"],
    "improvements": ["Add quantified bullet points using action verbs"]
  }
}
```

### GridFS Bucket: `resume_files`

```
resume_files.files
{
  _id:        ObjectId,
  filename:   "nikhil_cv.pdf",      ← original filename preserved
  length:     142080,               ← bytes
  uploadDate: ISODate,
  metadata: {
    user_name:    "Nikhil",
    content_type: "application/pdf",
    upload_date:  ISODate
  }
}
resume_files.chunks
{
  _id:      ObjectId,
  files_id: ObjectId,
  n:        0,         ← chunk index
  data:     BinData    ← 255 KB max per chunk
}
```

### Indexes (created at startup via `ensure_indexes()`)

| Name | Fields | Direction | Purpose |
|---|---|---|---|
| `idx_upload_date` | `meta.upload_date` | DESC | Fast recent history query |
| `idx_user_history` | `meta.user_name`, `meta.upload_date` | ASC, DESC | Fast per-user history |
| `idx_score` | `score.overall` | DESC | Sort by score |

---

## 10. API Reference

**Base URL (dev):** `http://localhost:8000`  
**Base URL (prod):** `https://ai-resume-analytics-engine.onrender.com`  
**Interactive docs:** `/docs` (Swagger UI)

---

### `GET /`
Health check.

```json
{
  "status":        "ok",
  "version":       "5.0.0",
  "database":      "connected",
  "ai_configured": true
}
```

---

### `GET /health`
Detailed health check — used by Render's health check mechanism.  
Returns HTTP `200` when healthy, HTTP `503` when MongoDB is configured but unreachable.

```json
{ "status": "healthy", "version": "5.0.0", "database": "connected", "ai_configured": true }
```

---

### `GET /debug`
Non-secret runtime configuration — use to verify env vars are set on Render.

```json
{
  "version":       "5.0.0",
  "debug":         false,
  "ai_configured": true,
  "db_configured": true,
  "frontend_url":  "(not set — all origins allowed)",
  "cors_mode":     "allow_origins=['*']"
}
```

---

### `POST /resume/upload`
Parse a file and return a text preview. No database write.

**Form:** `file` (required)

```json
{
  "filename":    "nikhil_cv.pdf",
  "text_length": 2841,
  "preview":     "First 500 characters of extracted text…"
}
```

---

### `POST /resume/analyze`
Full pipeline: parse → NLP → score → AI → save to MongoDB.  
**Rate limit: 10 requests per minute per IP** (slowapi)

**Form fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | File | Yes | PDF, DOCX, TXT, PNG, JPG, JPEG. Max 10 MB |
| `user_name` | string | No | Stored in `meta.user_name`. Default: `"Anonymous"` |
| `job_description` | string | No | Passed to Gemini. Also sets `meta.has_job_description: true` |

**Response:**

```json
{
  "filename":      "nikhil_cv.pdf",
  "user_name":     "Nikhil",
  "doc_id":        "6634abcd1234ef567890abcd",
  "overall_score": 74,
  "scores":        { "experience": 68, "skills": 80, "content": 72, "ats": 65 },
  "features":      { "skills_detected": [...], "experience_years": 3.5, "..." },
  "nlp_insights":  { "companies_detected": [...], "experience_timeline": [...] },
  "ai_insights":   { "summary": "...", "career_level": "mid-level", "..." } ,
  "ai_error":      null,
  "strengths":     ["..."],
  "improvements":  ["..."]
}
```

---

### `GET /resume/file/{file_id}`
Download the original uploaded file from GridFS.

`file_id` = `meta.file_id` from any history record.

Response: binary stream with headers:
```
Content-Disposition: attachment; filename="nikhil_cv.pdf"
Content-Type: application/pdf
Content-Length: 142080
```

| Extension | Content-Type |
|---|---|
| `.pdf` | `application/pdf` |
| `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| `.txt` | `text/plain` |
| `.png` | `image/png` |
| `.jpg` / `.jpeg` | `image/jpeg` |

---

### `GET /resume/history?limit=20`
Recent analyses — lightweight projection (no full feature data).  
Max `limit`: 100.

```json
{
  "count": 5,
  "resumes": [
    {
      "id":   "6634abcd...",
      "meta": { "user_name": "Nikhil", "filename": "nikhil_cv.pdf", "file_id": "...", ... },
      "score": { "overall": 74, "grade": "B" },
      "ai_insights": { "career_level": "mid-level" }
    }
  ]
}
```

---

### `GET /resume/history/user/{user_name}?limit=10`
All analyses for a user name — case-insensitive regex match. Max `limit`: 50.

---

### `GET /resume/history/{resume_id}`
Full document for a single analysis by MongoDB ObjectId string.

---

## 11. Tech Stack

### Backend

| Package | Version | Role |
|---|---|---|
| `fastapi` | latest | Web framework, async routing, OpenAPI docs |
| `uvicorn[standard]` | latest | ASGI server (Gunicorn-compatible for production) |
| `python-multipart` | latest | Multipart form-data (file uploads) |
| `pdfplumber` | latest | PDF text-layer extraction |
| `python-docx` | latest | DOCX paragraph extraction |
| `pytesseract` | latest | Python wrapper for Tesseract OCR |
| `pdf2image` | latest | PDF page → PIL Image (requires Poppler) |
| `Pillow` | latest | Image I/O for OCR pipeline |
| `opencv-python-headless` | latest | Image preprocessing (binarisation, blur) |
| `numpy` | latest | OpenCV array operations |
| `spacy` | 3.x | NLP: NER, noun chunks, entity extraction |
| `en_core_web_sm` | 3.x | spaCy English model (NER) |
| `google-genai` | latest | Official Google Gemini SDK |
| `motor` | latest | Async MongoDB driver |
| `pydantic-settings` | v2 | Type-safe `.env` loading via `BaseSettings` |
| `slowapi` | latest | FastAPI rate limiting (based on `limits`) |
| `limits` | latest | Rate limit storage backends for slowapi |
| `pytest` | latest | Test framework |
| `pytest-asyncio` | latest | Async test support (asyncio_mode=auto) |
| `httpx` | latest | Async HTTP client for ASGI testing |

### Frontend

| Package | Version | Role |
|---|---|---|
| `react` | 18.3.1 | UI framework |
| `react-dom` | 18.3.1 | DOM renderer |
| `typescript` | 5.5.3 | Static typing |
| `vite` | 5.4.2 | Build tool, dev server, HMR |
| `tailwindcss` | 3.4.1 | Utility-first CSS |
| `echarts` | 6.0.0 | Chart library (gauge, radar, pie, bar) |
| `echarts-for-react` | 3.0.6 | React wrapper for ECharts |
| `lucide-react` | 0.344.0 | SVG icon set |
| `@typescript-eslint/*` | 8.3.0 | TypeScript linting rules |
| `eslint` | 9.9.1 | Linter (flat config format) |
| `eslint-plugin-react-hooks` | 5.1.0-rc | React hooks rules |

### Infrastructure

| Service | Tier | Purpose |
|---|---|---|
| Vercel | Free | Frontend hosting, edge CDN, preview deployments |
| Render | Free | Backend hosting, Docker support, deploy hooks |
| MongoDB Atlas | M0 Free | Database, GridFS file storage |
| Google AI Studio | Free | Gemini API |
| GitHub Actions | Free | CI/CD automation |

---

## 12. Project Structure

```
AI-Resume-Analytics-Engine/
│
├── .github/
│   └── workflows/
│       ├── ci.yml          ESLint + TSC + ruff + pytest + Docker build check
│       └── deploy.yml      Render deploy hook + Vercel auto-confirm + summary
│
├── backend/
│   ├── Dockerfile          Multi-stage: builder (pip) → runtime (Tesseract + spaCy)
│   ├── .dockerignore       Excludes venv, __pycache__, .env, .git
│   ├── packages.txt        Render apt packages: tesseract-ocr, poppler-utils, libgl1…
│   ├── requirements.txt    All Python deps (prod + dev/test)
│   ├── pytest.ini          asyncio_mode=auto, testpaths=tests
│   ├── ruff.toml           select=E,F,W,I; ignore=E501,F401,W293,E741
│   ├── .env.example        Template — copy to .env, never commit .env
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_health.py  5 smoke tests: health, detailed health, empty file,
│   │                       bad extension, history list
│   │
│   └── app/
│       ├── main.py         FastAPI app, lifespan (indexes + banner), rate limiter,
│       │                   CORS (allow_origins=["*"]), timing middleware,
│       │                   /, /health, /debug endpoints
│       ├── config.py       pydantic-settings: ai_api_key, mongodb_uri, frontend_url
│       ├── limiter.py      slowapi Limiter singleton, key_func=get_remote_address
│       │
│       ├── core/
│       │   └── database.py Motor singleton, resumes_col(), get_gridfs_bucket(), ping()
│       │
│       ├── models/
│       │   └── resume_model.py  ResumeDocument, ResumeSummary Pydantic schemas
│       │
│       ├── routers/
│       │   └── resume.py   POST /upload, POST /analyze (@limiter.limit("10/minute")),
│       │                   GET /file/{id}, GET /history, GET /history/user/{name},
│       │                   GET /history/{id}
│       │
│       └── services/
│           ├── parser.py       extract_text() — PDF/DOCX/TXT/image dispatch,
│           │                   OCR threshold=50, DPI=300, conf_min=60,
│           │                   adaptive vs Otsu binarisation selection
│           ├── analyzer.py     Full pipeline: normalize → detect_sections →
│           │                   4 feature extractors → NLP override → 5 scorers →
│           │                   weighted composite → AI call
│           ├── nlp_service.py  spaCy NER, noise filter (40+ words), role extraction,
│           │                   timeline builder, num_jobs strategy
│           ├── ai_service.py   Gemini 2.0 Flash, SHA-256 cache, prompt builder,
│           │                   JSON parser with fence stripping, error mapper
│           └── db_service.py   GridFS upload (save_resume_file), analysis doc save
│                               (_build_document, _grade), ensure_indexes(),
│                               history queries with projections
│
├── src/
│   ├── App.tsx             Step router: upload → job-matching → analyzing → results
│   ├── main.tsx            React entry — registers window.mountApp(), does NOT
│   │                       auto-call createRoot(). Called only when enterApp()
│   │                       is clicked on the landing page.
│   │
│   ├── components/
│   │   ├── Upload/
│   │   │   └── ResumeUpload.tsx    Name input + drag-and-drop zone + feature cards
│   │   ├── JobMatching/
│   │   │   └── JobDescriptionInput.tsx  Optional textarea, skip button
│   │   ├── Analysis/
│   │   │   └── LoadingScreen.tsx   6-step animated cards + waiting state
│   │   ├── Dashboard/
│   │   │   └── Dashboard.tsx       KPI strip, 4 ECharts, AI cards, engine cards
│   │   ├── Charts/
│   │   │   ├── ScoreGauge.tsx      ECharts gauge (overall score, colour-coded)
│   │   │   ├── RadarChart.tsx      ECharts radar (7 section scores)
│   │   │   ├── PieChart.tsx        ECharts donut (skill category distribution)
│   │   │   └── BarChart.tsx        ECharts horizontal gradient bars (keyword freq)
│   │   └── Layout/
│   │       ├── Header.tsx          Logo + dark/light toggle
│   │       └── ProgressTracker.tsx 4-step breadcrumb with check icons
│   │
│   ├── contexts/
│   │   ├── ResumeContext.tsx   All global state: file, result, steps, loading flags.
│   │   │                      analyzeResume() depends on [resumeFile, userName] —
│   │   │                      both in dependency array to avoid stale closure.
│   │   └── ThemeContext.tsx    dark/light mode, localStorage persistence
│   │
│   ├── hooks/
│   │   └── useFileUpload.ts   Drag-and-drop handlers, extension whitelist,
│   │                          10 MB guard, progress simulation
│   │
│   ├── services/
│   │   └── api.ts             analyzeResume(), fetchAIFeedback(), uploadResumePreview()
│   │                          Snake→camelCase mapping, sectionScores derivation,
│   │                          keywordFrequency from skillsByCategory,
│   │                          BackendNLPExperienceEntry union type (TS fix)
│   │
│   └── types/
│       └── index.ts           AnalysisResult, AIFeedback, AnalysisFeatures,
│                              NLPInsights, ResumeData, AnalysisStep, Theme
│
├── render.yaml             Render Blueprint: Docker web service, /health check
├── vercel.json             SPA rewrites, immutable asset caching, security headers
├── .nvmrc                  Node 20
├── vite.config.ts          manualChunks: vendor-react + vendor-echarts
├── tsconfig.json           Project references wrapper (files: [])
├── tsconfig.app.json       Source check config (strict, noUnusedLocals, src/)
├── tailwind.config.js
└── package.json            scripts: dev, build, lint, preview
```

---

## 13. Local Development Setup

### System Prerequisites

**Tesseract OCR** (required for OCR features):

| OS | Command |
|---|---|
| Windows | Download from [UB Mannheim](https://github.com/UB-Mannheim/tesseract/wiki), add install dir to `PATH` |
| macOS | `brew install tesseract` |
| Ubuntu | `sudo apt install tesseract-ocr tesseract-ocr-eng` |

Verify: `tesseract --version`

**Poppler** (required by pdf2image for scanned PDFs):

| OS | Command |
|---|---|
| Windows | Download from [oschwartz10612/poppler-windows](https://github.com/oschwartz10612/poppler-windows/releases), add `bin/` to `PATH` |
| macOS | `brew install poppler` |
| Ubuntu | `sudo apt install poppler-utils` |

Verify: `pdftoppm -v`

### Installation

```bash
# 1. Clone
git clone https://github.com/Nikhil06032004/AI-Resume-Analytics-Engine.git
cd AI-Resume-Analytics-Engine

# 2. Backend
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env
# Edit .env — add MONGODB_URI and AI_API_KEY

# 3. Frontend
cd ..
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:8000 (already the default)
```

### Running

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Expected startup output:
```
╔══════════════════════════════════════════╗
║       Resume Insights API  v5.0.0        ║
╚══════════════════════════════════════════╝
  AI insights  : ✓ enabled
  MongoDB      : ✓ enabled
  Frontend URL : (all origins allowed)
  Debug mode   : False

[DB] Indexes verified.
INFO: Uvicorn running on http://0.0.0.0:8000
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

Open **http://localhost:5173** · API docs: **http://localhost:8000/docs**

### Running Tests

```bash
cd backend
pytest tests/ -v
```

```
tests/test_health.py::test_root_health_ok              PASSED
tests/test_health.py::test_detailed_health_returns_json PASSED
tests/test_health.py::test_upload_empty_file_rejected  PASSED
tests/test_health.py::test_upload_unsupported_type_rejected PASSED
tests/test_health.py::test_history_returns_list        PASSED
```

---

## 14. Production Deployment Guide

### Step 1 — MongoDB Atlas

1. [mongodb.com/atlas](https://mongodb.com/atlas) → New project → Free M0 cluster
2. **Database Access** → Add database user with password (note the password)
3. **Network Access** → Add IP `0.0.0.0/0` (allow all — required for Render)
4. **Connect** → Drivers → Copy connection string
5. URL-encode special characters in your password: `@` → `%40`, `#` → `%23`

```
mongodb+srv://youruser:yourp%40ss@cluster0.xxxxx.mongodb.net/resume_analyzer?appName=Cluster0
```

---

### Step 2 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/AI-Resume-Analytics-Engine.git
git push -u origin main
```

---

### Step 3 — Deploy Backend on Render

1. [render.com](https://render.com) → sign up with GitHub
2. **New +** → **Blueprint** → connect repository
3. Render reads `render.yaml` automatically:
   - Runtime: Docker
   - Dockerfile: `./backend/Dockerfile`
   - Health check: `/health`
4. **Environment** tab → add:

| Key | Value |
|---|---|
| `MONGODB_URI` | your Atlas connection string |
| `AI_API_KEY` | your Google AI Studio key |

5. **Deploy** — first build ~6–8 min, subsequent ~2–3 min
6. Copy the service URL: `https://your-service.onrender.com`

---

### Step 4 — Deploy Frontend on Vercel

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → import repo
2. Auto-detected as Vite. Settings:
   - **Root Directory:** `/`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add environment variable:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://your-service.onrender.com` |

4. **Deploy** — ~60 seconds
5. Copy the URL: `https://your-project.vercel.app`

---

### Step 5 — Add GitHub Secret for Deploy Hook

1. Render → your service → **Settings** → **Deploy Hook** → copy URL
2. GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
   - Name: `RENDER_DEPLOY_HOOK`
   - Value: the Render deploy hook URL

Every future `git push origin main` now:
- Runs CI (lint + types + tests) via `ci.yml`
- On success, triggers Render redeploy and Vercel redeploy via `deploy.yml`

---

## 15. Environment Variables

### `backend/.env`

```env
# Google AI Studio — enables Gemini AI feedback
# Get free key: https://aistudio.google.com/app/apikey
AI_API_KEY=your_google_ai_studio_api_key

# MongoDB Atlas — enables analysis storage and file storage
# URL-encode special chars in password: @ → %40
MONGODB_URI=mongodb+srv://user:p%40ss@cluster0.xxxxx.mongodb.net/resume_analyzer?appName=Cluster0

# Production CORS — set to your Vercel URL (restricts origins)
# Leave unset in development (all origins allowed automatically)
FRONTEND_URL=https://your-project.vercel.app

# App config (optional — defaults shown)
APP_VERSION=5.0.0
DEBUG=false
MAX_UPLOAD_SIZE_MB=10
```

### `src/.env` (frontend)

```env
# Backend API base URL
VITE_API_URL=http://localhost:8000
```

**Important:** `VITE_API_URL` is baked into the JavaScript bundle at **build time** by Vite. If you change this variable in Vercel after the first deploy, you must trigger a **new build** (Vercel → Deployments → Redeploy without cache) for the change to take effect.

> Never commit `.env` files. Both are excluded by `.gitignore`.

---

## 16. Troubleshooting

### Parsing / OCR

| Error | Cause | Fix |
|---|---|---|
| `TesseractNotFoundError` | Tesseract not in PATH | Install and verify: `tesseract --version` |
| `PDFInfoNotInstalledError` | Poppler not installed | Install and verify: `pdftoppm -v` |
| Empty analysis (score = 0) | File parsed but extracted < 50 chars | Try a text-layer PDF; ensure Tesseract is on PATH for image-based PDFs |
| `UnicodeDecodeError` | `.txt` file not UTF-8 | File is re-decoded as latin-1 automatically; should not reach user |

### Backend

| Error | Cause | Fix |
|---|---|---|
| `ModuleNotFoundError: spacy` | Dependencies not installed | `pip install -r requirements.txt` |
| `OSError: Can't find model 'en_core_web_sm'` | Model not downloaded | `python -m spacy download en_core_web_sm` |
| `MONGODB_URI is not set` | Env var missing | Add to `backend/.env`, restart server |
| `ServerSelectionTimeoutError` | Atlas IP whitelist too restrictive | Add `0.0.0.0/0` in Atlas → Network Access |
| Password authentication fails | Special chars not URL-encoded | `@` → `%40`, `#` → `%23` |

### AI Insights

| Error | Cause | Fix |
|---|---|---|
| `AI_API_KEY is not configured` | Env var missing | Add to `backend/.env`, restart server |
| Gemini quota exhausted | Free-tier daily limit hit | Wait 24 hours or enable billing in Google AI Studio |
| Same result after "Refresh AI Insights" | SHA-256 cache hit | Restart the server to clear the in-process cache |

### Frontend

| Issue | Cause | Fix |
|---|---|---|
| "Failed to fetch" on upload | `VITE_API_URL` not baked into build | Check Network tab in DevTools — if URL is `localhost:8000`, trigger Vercel redeploy with new build |
| Charts blank / no data | API returned error | Check browser Console for CORS errors; verify backend is awake (Render free tier spins down) |
| `tsc --noEmit` fails in CI | Wrong tsconfig target | Always use `npx tsc -p tsconfig.app.json --noEmit` |
| Landing page skipped — dashboard shows on load | Old Vercel deployment cached before `window.mountApp` fix | Hard-refresh (`Ctrl+Shift+R`) to bypass CDN cache; verify Vercel shows the latest commit deployed |
| "Open Dashboard" click does nothing | Race: user clicked before React bundle loaded AND `__enterAppCalled` flag was not set | Should not happen with current code — `window.__enterAppCalled = true` is set before `window.mountApp()` is called; `main.tsx` checks this flag on load and mounts immediately if set |

### Render Free Tier

| Issue | Notes |
|---|---|
| First request takes ~30 seconds | Service spins down after 15 min idle — expected on free tier |
| OOM kills on large PDFs | 512 MB RAM limit; reduce `MAX_UPLOAD_SIZE_MB=5` if needed |
| Build takes 6–8 min | First Docker build pulls Tesseract + spaCy; subsequent builds use layer cache |
