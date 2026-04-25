# Resume Insights

[![CI](https://github.com/Nikhil06032004/AI-Resume-Analytics-Engine/actions/workflows/ci.yml/badge.svg)](https://github.com/Nikhil06032004/AI-Resume-Analytics-Engine/actions/workflows/ci.yml)
[![Deploy](https://github.com/Nikhil06032004/AI-Resume-Analytics-Engine/actions/workflows/deploy.yml/badge.svg)](https://github.com/Nikhil06032004/AI-Resume-Analytics-Engine/actions/workflows/deploy.yml)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://ai-resume-analytics-engine.vercel.app)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://ai-resume-analytics-engine.onrender.com)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?logo=mongodb)](https://www.mongodb.com/atlas)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Live Demo** → [ai-resume-analytics-engine.vercel.app](https://ai-resume-analytics-engine.vercel.app)  
**API Docs** → [ai-resume-analytics-engine.onrender.com/docs](https://ai-resume-analytics-engine.onrender.com/docs)  
**GitHub** → [Nikhil06032004/AI-Resume-Analytics-Engine](https://github.com/Nikhil06032004/AI-Resume-Analytics-Engine)

---

A production-ready full-stack resume analysis platform. Upload any resume — PDF, DOCX, TXT, or image — and receive a real analysis powered by OCR, spaCy NLP, a deterministic scoring engine, and optional Google Gemini AI feedback. Every score and chart is derived from your document. No mock data.

---

## Table of Contents

- [Deployment Architecture](#deployment-architecture)
- [CI/CD Pipeline](#cicd-pipeline)
- [How It Works — System Overview](#how-it-works--system-overview)
- [User Workflow](#user-workflow)
- [Backend Pipeline — Step by Step](#backend-pipeline--step-by-step)
- [Data Flow Diagram](#data-flow-diagram)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Scoring Methodology](#scoring-methodology)
- [AI Insights Layer](#ai-insights-layer)
- [Database — What Gets Stored](#database--what-gets-stored)
- [API Reference](#api-reference)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Production Deployment Guide](#production-deployment-guide)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PRODUCTION INFRASTRUCTURE                           │
└─────────────────────────────────────────────────────────────────────────┘

  Developer Machine
       │
       │  git push origin main
       ▼
  ┌──────────────┐
  │   GitHub     │──── triggers ──────────────────────────────────┐
  │   Repository │                                                │
  └──────────────┘                                                │
       │                                                          │
       │ GitHub Actions CI                                        │ GitHub Actions Deploy
       │ (runs on PR + push)                                      │ (runs on push to main)
       ▼                                                          ▼
  ┌────────────────────────┐              ┌──────────────────────────────────┐
  │  CI Pipeline           │              │  Deploy Pipeline                 │
  │                        │              │                                  │
  │  ✓ Frontend lint/build │              │  Trigger Render deploy hook      │
  │  ✓ Backend lint        │              │  Vercel auto-deploys from GitHub │
  │  ✓ Backend tests       │              │                                  │
  │  ✓ Docker build check  │              └──────────────┬───────────────────┘
  └────────────────────────┘                             │
                                                         │
                              ┌──────────────────────────┼──────────────────────┐
                              │                          │                      │
                              ▼                          ▼                      ▼
                    ┌─────────────────┐      ┌─────────────────┐    ┌──────────────────┐
                    │    VERCEL       │      │    RENDER       │    │  MONGODB ATLAS   │
                    │   (Frontend)    │      │   (Backend)     │    │   (Database)     │
                    │                 │      │                 │    │                  │
                    │  React + Vite   │◀────▶│  FastAPI        │◀──▶│  resumes         │
                    │  Tailwind CSS   │ HTTPS│  Docker image   │    │  resume_files    │
                    │  ECharts        │  API │  Tesseract OCR  │    │  (GridFS)        │
                    │  Auto CDN       │      │  spaCy NLP      │    │                  │
                    │  Edge Network   │      │  Gemini AI      │    │  Free M0 cluster │
                    │                 │      │                 │    │                  │
                    │  FREE tier      │      │  FREE tier      │    │  FREE tier       │
                    └─────────────────┘      └────────────────┘     └──────────────────┘
                                                      │
                                                      ▼
                                             ┌──────────────────┐
                                             │  GOOGLE AI STUDIO│
                                             │  Gemini 2.0 Flash│
                                             │  (AI insights)   │
                                             └──────────────────┘
```

### Why these platforms?

| Platform | Reason |
|---|---|
| **Vercel** | Native Vite support, global edge CDN, automatic preview URLs per PR, zero-config HTTPS |
| **Render** | Docker support on free tier, GitHub auto-deploy, persistent disk option, simple env var management |
| **MongoDB Atlas** | Free 512 MB M0 cluster, built-in GridFS for file storage, connection strings work everywhere |

---

## CI/CD Pipeline

```
Pull Request opened
        │
        ▼
┌─────────────────────────────────────────────────────┐
│  GitHub Actions — CI (.github/workflows/ci.yml)     │
│                                                     │
│  Job 1: Frontend                                    │
│    npm ci → npm run lint → tsc --noEmit → npm build │
│                                                     │
│  Job 2: Backend                                     │
│    pip install → ruff check → pytest tests/         │
│                                                     │
│  Job 3: Docker Build Check (PRs only)               │
│    docker buildx build --no-push                    │
│                                                     │
│  All 3 must pass ✓ before PR can merge              │
└─────────────────────────────────────────────────────┘
        │
        │  PR merged → push to main
        ▼
┌─────────────────────────────────────────────────────┐
│  GitHub Actions — Deploy (.github/workflows/deploy) │
│                                                     │
│  Job 1: curl → RENDER_DEPLOY_HOOK                   │
│    → Render pulls latest main, rebuilds Docker image│
│    → New container deployed with zero-downtime swap │
│                                                     │
│  Job 2: Vercel (automatic)                          │
│    → Detects push to main via GitHub integration    │
│    → Builds Vite app, deploys to edge               │
│                                                     │
│  Job 3: Summary                                     │
│    → Prints deploy status to GitHub Actions log     │
└─────────────────────────────────────────────────────┘
```

**Required GitHub Secrets** (Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `RENDER_DEPLOY_HOOK` | From Render dashboard → your service → Settings → Deploy Hook |

---

## How It Works — System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        RESUME INSIGHTS                              │
│                    Full-Stack Architecture                          │
└─────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────┐          ┌──────────────────────────────┐
  │   React Frontend     │          │     FastAPI Backend           │
  │  (Vite + TypeScript) │          │       (Python 3.11+)         │
  │                      │          │                              │
  │  Step 1: Upload      │─────────▶│  POST /resume/analyze        │
  │  Step 2: Job Match   │  HTTPS   │                              │
  │  Step 3: Loading     │◀─────────│  JSON Response               │
  │  Step 4: Dashboard   │          │                              │
  │                      │          │  ┌──────────────────────┐   │
  │  ECharts Visuals:    │          │  │   parser.py           │   │
  │  • Score Gauge       │          │  │   OCR + text extract  │   │
  │  • Radar Chart       │          │  ├──────────────────────┤   │
  │  • Skill Pie Chart   │          │  │   analyzer.py         │   │
  │  • Keyword Bar Chart │          │  │   feature extraction  │   │
  │                      │          │  │   deterministic score │   │
  │  AI Suggestions      │─────────▶│  ├──────────────────────┤   │
  │  (on-demand button)  │          │  │   nlp_service.py      │   │
  └──────────────────────┘          │  │   spaCy NER           │   │
                                    │  ├──────────────────────┤   │
                                    │  │   ai_service.py       │   │
                                    │  │   Gemini 2.0 Flash    │   │
                                    │  ├──────────────────────┤   │
                                    │  │   db_service.py       │   │
                                    │  │   MongoDB + GridFS    │   │
                                    │  └──────────────────────┘   │
                                    └──────────────────────────────┘
                                                  │
                                    ┌─────────────▼──────────────┐
                                    │      MongoDB Atlas          │
                                    │                            │
                                    │  resumes  (analysis docs)  │
                                    │  resume_files (GridFS)     │
                                    │  Indexes: upload_date,     │
                                    │           user_name, score  │
                                    └────────────────────────────┘
```

---

## User Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│  Step 1 — UPLOAD                                                 │
│                                                                  │
│  • Enter name (optional — stored in MongoDB with analysis)       │
│  • Drag-and-drop or browse: PDF / DOCX / TXT / PNG / JPG        │
│  • Frontend validates: type whitelist + 10 MB limit              │
│  • Click "Continue to Analysis"                                  │
└────────────────────────┬─────────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  Step 2 — JOB MATCH (optional)                                   │
│                                                                  │
│  • Paste a job description for tailored AI feedback              │
│  • Sent to Gemini alongside resume text                          │
│  • Skip to run analysis without job targeting                    │
└────────────────────────┬─────────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  Step 3 — ANALYSING                                              │
│                                                                  │
│  • POST /resume/analyze — file + name + job description          │
│  • 6-step animated progress: Parse → Sections → NLP →           │
│    Skills → Score → AI                                           │
│  • "Generating AI Insights" waiting state if API takes longer    │
└────────────────────────┬─────────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  Step 4 — RESULTS DASHBOARD                                      │
│                                                                  │
│  KPI strip:   Overall Score · Experience · Skills · ATS         │
│  Charts:      Score Gauge · Skill Pie · Radar · Keyword Bar     │
│  Cards:       Strengths · Areas to Improve · Action Plan        │
│  AI section:  Career Profile · Recommended Roles · ATS Tips     │
│               Project Suggestions · Red Flags · Unique Insights │
│                                                                  │
│  Buttons:                                                        │
│  "Get AI Suggestions" — calls Gemini on demand                  │
│  "Analyse Another"    — resets state, returns to Step 1         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Backend Pipeline — Step by Step

### Stage 1 — File Validation & Text Extraction (`parser.py`)

```
Receive UploadFile
    │
    ├─ Validate extension  → {.pdf .docx .txt .png .jpg .jpeg}
    ├─ Validate size       → max 10 MB
    ├─ Validate not empty
    │
    ├─ .pdf  ──▶  pdfplumber extract text
    │                └─ text < 50 chars?
    │                       └─▶ pdf2image convert pages to images
    │                               └─▶ OpenCV adaptive threshold / Otsu
    │                                       └─▶ pytesseract OCR
    │
    ├─ .docx ──▶  python-docx (paragraphs + table cells)
    ├─ .txt  ──▶  UTF-8 decode
    └─ image ──▶  OpenCV adaptive threshold + Otsu binarization
                      └─▶ pytesseract OCR

Returns: (filename, extracted_text, raw_file_bytes)
```

### Stage 2 — Feature Extraction (`analyzer.py`)

Four independent regex-based extractors run on the normalized text:

```
normalized_text
    ├─ extract_experience_features()  → ExperienceFeatures
    │     year ranges, bullet points, action verbs, role types
    │
    ├─ extract_skills_features()      → SkillsFeatures
    │     SKILL_TAXONOMY (6 categories × 10-20 skills each)
    │
    ├─ extract_content_quality()      → ContentQualityFeatures
    │     metrics (%,$,×), sentence length, verb ratio
    │
    └─ extract_ats_features()         → ATSFeatures
          keyword density, section completeness, formatting
```

### Stage 3 — NLP Enrichment (`nlp_service.py`)

```
text ──▶ spaCy en_core_web_sm
    ├─ NER:  ORG → company names   DATE → date strings
    ├─ Noun chunks + ROLE_KEYWORDS → job title phrases (2-6 words)
    └─ build_experience_timeline()
           YEAR_RANGE_RE → [{start, end, duration_months}]
           num_jobs = len(timeline)
           experience_years = sum(months) / 12

Noise filter removes: section headers, phone numbers, purely
numeric strings, < 3-char tokens, 40+ exact noise words.
NLP values override regex values when higher/more precise.
```

### Stage 4 — Scoring (`analyzer.py`)

```
ExperienceFeatures → score_experience()  → 0-100
SkillsFeatures     → score_skills()      → 0-100
ContentFeatures    → score_content()     → 0-100
ATSFeatures        → score_ats()         → 0-100
text               → _score_education_direct() → 0-100

Overall = 0.30×exp + 0.25×skills + 0.20×content
        + 0.15×ats + 0.10×education
```

### Stage 5 — AI Insights (`ai_service.py`)

```
generate_ai_insights(text[:3000], features)
    ├─ Check SDK + API key
    ├─ SHA-256 cache key → cache hit? return cached
    ├─ Build prompt (resume text + skills + roles + job_desc)
    ├─ gemini-2.0-flash → JSON response
    │     temperature=0.3, max_output_tokens=2048
    ├─ Parse + validate JSON
    └─ Cache result, return dict

Error mapping:
  429 → "Gemini free-tier quota exhausted"
  401/403 → "Invalid or revoked API key"
  SDK missing → "google-genai SDK not installed"
```

### Stage 6 — Persistence (`db_service.py`)

```
save_resume_analysis(name, filename, result, file_bytes, jd)
    ├─ GridFS upload  → resume_files bucket
    │     upload_from_stream(filename, BytesIO(bytes))
    │     stores original file with original filename
    │     Returns: file_id (ObjectId string)
    │
    └─ resumes.insert_one(_build_document(...))
          structured nested schema (see Database section)
          meta.file_id links to GridFS entry
          Returns: analysis_id (ObjectId string)

Non-blocking: DB failure never breaks the JSON response.
```

---

## Data Flow Diagram

```
User Browser
    │ FormData {file, user_name?, job_description?}
    ▼
POST /resume/analyze
    │
    ├─ _read_and_parse() ──▶ (filename, text, raw_bytes)
    ├─ analyze_resume()  ──▶ result dict
    └─ save_resume_analysis()
           │
           ├──▶ GridFS "resume_files"
           │      filename: "nikhil_cv.pdf"  ← original preserved
           │      binary: raw_bytes
           │      metadata: {user_name, content_type, upload_date}
           │
           └──▶ "resumes" collection
                  meta:     {user_name, filename, file_id, ...}
                  score:    {overall:74, grade:"B", breakdown:{...}}
                  features: {skills:{...}, experience:{...}, ...}
                  ai_insights: {...} | null
                  insights: {strengths:[...], improvements:[...]}

JSON Response ──▶ React Frontend
    │
    └─ api.ts mapResponse()
           snake_case → camelCase
           derive sectionScores from backend signals
           derive keywordFrequency from skillsByCategory
           │
           └─ Dashboard renders:
                  ScoreGauge    (ECharts gauge)
                  PieChart      (ECharts donut)
                  RadarChart    (ECharts radar)
                  BarChart      (ECharts horizontal bar)
                  AI Career Banner
                  Strengths / Improvements / ATS Tips cards
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React + TypeScript | 18 |
| Build tool | Vite | 5 |
| Styling | Tailwind CSS | 3 |
| Charts | ECharts + echarts-for-react | 6 / 3 |
| Icons | Lucide React | — |
| State | React Context API | — |
| Backend | FastAPI | latest |
| ASGI server | Uvicorn | latest |
| PDF parsing | pdfplumber | latest |
| PDF→image | pdf2image + Poppler | latest |
| OCR | pytesseract + Tesseract | latest |
| Image processing | OpenCV (headless) + Pillow | latest |
| DOCX | python-docx | latest |
| NLP | spaCy (en_core_web_sm) | 3.x |
| AI | Google Gemini 2.0 Flash | via google-genai |
| Database | MongoDB Atlas (Motor async) | latest |
| File storage | MongoDB GridFS | — |
| Rate limiting | slowapi | latest |
| Config | pydantic-settings | v2 |
| Containerisation | Docker (multi-stage) | — |
| CI/CD | GitHub Actions | — |
| Frontend host | Vercel | free tier |
| Backend host | Render | free tier |

---

## Project Structure

```
Resume-Insights/
│
├── .github/
│   └── workflows/
│       ├── ci.yml          # Lint + test + Docker build (PRs + main push)
│       └── deploy.yml      # Trigger Render hook + confirm Vercel (main only)
│
├── backend/
│   ├── Dockerfile          # Multi-stage: builder → slim runtime with OCR deps
│   ├── .dockerignore
│   ├── requirements.txt    # All Python deps including slowapi, pytest, httpx
│   ├── pytest.ini          # asyncio_mode = auto
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_health.py  # Smoke tests: health, empty file, bad type, history
│   │
│   └── app/
│       ├── main.py         # FastAPI app: rate limiter, CORS, timing middleware,
│       │                   # startup banner, /health endpoint
│       ├── config.py       # pydantic-settings: ai_api_key, mongodb_uri,
│       │                   # frontend_url, debug, version
│       ├── limiter.py      # slowapi Limiter singleton (10/min on /analyze)
│       │
│       ├── core/
│       │   └── database.py     # Motor singleton, resumes_col(), get_gridfs_bucket()
│       │
│       ├── models/
│       │   └── resume_model.py # Pydantic schemas for MongoDB documents
│       │
│       ├── routers/
│       │   └── resume.py       # All endpoints — request: Request param for slowapi
│       │
│       └── services/
│           ├── parser.py       # OCR pipeline (pdfplumber → pdf2image → OpenCV → tesseract)
│           ├── analyzer.py     # Feature extraction → NLP → scoring → AI
│           ├── nlp_service.py  # spaCy NER + noise filter + timeline builder
│           ├── ai_service.py   # Gemini integration + SHA-256 cache + error mapping
│           └── db_service.py   # GridFS upload, analysis doc save, history queries,
│                               # ensure_indexes() called at startup
│
├── src/                        # React frontend
│   ├── App.tsx                 # 4-step router (upload → job → analyzing → results)
│   ├── components/
│   │   ├── Upload/ResumeUpload.tsx         # Name input + drag-and-drop zone
│   │   ├── JobMatching/JobDescriptionInput.tsx
│   │   ├── Analysis/LoadingScreen.tsx      # Animated 6-step progress
│   │   ├── Dashboard/Dashboard.tsx         # Full results view
│   │   ├── Charts/{ScoreGauge,RadarChart,PieChart,BarChart}.tsx
│   │   └── Layout/{Header,ProgressTracker}.tsx
│   ├── contexts/
│   │   ├── ResumeContext.tsx   # Global state + API calls + AI loading states
│   │   └── ThemeContext.tsx    # Dark/light mode with localStorage
│   ├── hooks/useFileUpload.ts  # Drag-and-drop + validation + progress sim
│   ├── services/api.ts         # Typed fetch + snake→camelCase + chart data derivation
│   └── types/index.ts          # AnalysisResult, AIFeedback, AnalysisStep etc.
│
├── render.yaml                 # Render Blueprint: Docker web service config
├── vercel.json                 # SPA rewrites + security headers + asset caching
├── .nvmrc                      # Node 20 (used by Vercel + GitHub Actions)
├── vite.config.ts              # Code splitting: vendor-react + vendor-echarts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Scoring Methodology

All scores come from measurable text signals only. No AI, no randomness, no hardcoded bands.

### Experience Score — 30% weight

| Signal | Measurement | Points |
|---|---|---|
| Unique role type words | regex `\b(engineer\|developer\|manager\|...)\b` | 15 each, cap 40 |
| Bullet points | lines starting with `•`, `-`, `*`, `●`, `▪` | 2 each, cap 30 |
| Action verbs | 65-word frozenset (achieved, deployed, led, …) | 2 each, cap 20 |
| Years experience | sum(YYYY–YYYY month spans) ÷ 12 | 2/year, cap 10 |

spaCy NER overrides regex count when higher.

### Skills Score — 25% weight

| Signal | Measurement | Points |
|---|---|---|
| Unique skills matched | SKILL_TAXONOMY word-boundary regex | 4 each, cap 50 |
| Category spread | groups with ≥ 1 skill | 8 each, cap 30 |
| Skill density | skills ÷ total words × 2000 | cap 20 |

Groups: **programming** · **web** · **tools** · **database** · **cloud** · **data**

### Content Quality Score — 20% weight

| Signal | Measurement | Points |
|---|---|---|
| Bullet points | same extractor as experience | 2 each, cap 30 |
| Quantified metrics | `%`, `$`, `×`, `N users/clients` regex | 6 each, cap 30 |
| Action verb ratio | verb count ÷ words × 300 | cap 20 |
| Sentence length | 10–20 words = full score | up to 20 |

### ATS Score — 15% weight

| Signal | Measurement | Points |
|---|---|---|
| Keyword density | ATS vocab hits ÷ total words × 600 | cap 40 |
| Section completeness | Experience + Education + Skills + Summary | 10 each, cap 40 |
| Formatting quality | (bullet ratio + readable line ratio) ÷ 2 | up to 20 |

### Education Signal — 10% weight

| Signal | Points |
|---|---|
| Degree keyword (bachelor, master, phd, b.tech, mba, …) | +50 |
| Institution keyword (university, college, institute, …) | +25 |
| GPA mentioned | +15 |
| Honours / distinction / cum laude | +10 |

### Composite Score & Grade

```
Overall = (0.30 × Experience) + (0.25 × Skills) + (0.20 × Content)
        + (0.15 × ATS)        + (0.10 × Education)
```

| Score | Grade | Label |
|---|---|---|
| 90–100 | A+ | Exceptional |
| 80–89 | A | Strong |
| 70–79 | B | Good |
| 60–69 | C | Average |
| 50–59 | D | Needs Work |
| 0–49 | F | Poor |

---

## AI Insights Layer

AI is an **optional, non-blocking layer**. Scoring always runs. AI is additive.

**When AI runs:**
- Automatically during analysis when a job description is provided
- On demand when user clicks "Get AI Suggestions" in the dashboard

**Input sent to Gemini:**
- First 3 000 chars of resume text
- Detected skills, roles, companies, experience years
- First 1 500 chars of job description (if provided)

**Output fields:**

| Field | Description |
|---|---|
| `summary` | 2–3 sentence professional profile |
| `career_level` | `fresher` · `junior` · `mid-level` · `senior` |
| `strengths` | Resume-specific strengths |
| `weaknesses` | Specific gaps |
| `improvements` | Concrete rewrite suggestions |
| `ats_tips` | ATS keyword and format advice |
| `project_suggestions` | Portfolio ideas for skill gaps |
| `recommended_roles` | Job titles this resume suits |
| `red_flags` | Items a recruiter / ATS would flag |
| `unique_insights` | Observations specific to this resume |

**Reliability:**
- SHA-256 in-memory cache — identical resumes never hit the API twice per session
- HTTP 429 → human-readable "quota exhausted" message
- HTTP 401/403 → "invalid API key" message
- Any error stored in `ai_error` field — analysis result is preserved

---

## Database — What Gets Stored

### Raw File — GridFS (`resume_files` bucket)

Every uploaded file is stored **as-is with its original filename**.

```
resume_files.files
{
  _id        : ObjectId,
  filename   : "nikhil_cv.pdf",       ← original filename, always preserved
  length     : 142080,
  uploadDate : ISODate,
  metadata   : { user_name, content_type, upload_date }
}
resume_files.chunks  ← binary split into 255 KB pieces
```

Download via: `GET /resume/file/{file_id}`

### Analysis Document — `resumes` collection

```json
{
  "_id": "ObjectId",
  "meta": {
    "user_name": "Nikhil",
    "filename": "nikhil_cv.pdf",
    "file_size_bytes": 142080,
    "file_id": "6634abce...",
    "upload_date": "2026-04-25T10:30:00Z",
    "has_ai_insights": true,
    "has_job_description": false
  },
  "score": {
    "overall": 74,
    "grade": "B",
    "breakdown": { "experience": 68, "skills": 80, "content": 72, "ats": 65 }
  },
  "features": {
    "skills":     { "detected": [...], "by_category": {...}, "categories_covered": 4 },
    "experience": { "years": 3.5, "num_jobs": 2, "companies": [...], "roles": [...],
                    "timeline": [{"start":2021,"end":2024,"duration_months":36}] },
    "content":    { "bullet_points": 18, "action_verbs_found": 12,
                    "numeric_metrics": 5, "avg_sentence_length": 15.2,
                    "sections_found": ["experience","skills","education","summary"] },
    "ats":        { "keyword_density": 0.0412, "section_completeness": 0.75 }
  },
  "ai_insights": {
    "summary": "...", "career_level": "mid-level",
    "strengths": [...], "weaknesses": [...], "improvements": [...],
    "ats_tips": [...], "project_suggestions": [...],
    "recommended_roles": [...], "red_flags": [...], "unique_insights": [...]
  },
  "ai_error": null,
  "insights": {
    "strengths": ["Strong technical skill breadth (score: 80/100)"],
    "improvements": ["Add quantified bullet points using action verbs"]
  }
}
```

**Indexes** (created at server startup, idempotent):

| Index | Field(s) | Purpose |
|---|---|---|
| `idx_upload_date` | `meta.upload_date DESC` | Fast recent history |
| `idx_user_history` | `meta.user_name ASC, meta.upload_date DESC` | Fast per-user lookup |
| `idx_score` | `score.overall DESC` | Sort by score |

---

## API Reference

Base URL (dev): `http://localhost:8000`  
Base URL (prod): `https://resume-insights-api.onrender.com`

### `GET /` — Health Check
```json
{ "status": "ok", "version": "5.0.0", "database": "connected", "ai_configured": true }
```

### `GET /health` — Detailed Health (used by Render)
Returns `200` when healthy, `503` when database configured but unreachable.

### `POST /resume/upload`
Preview text extraction only — no DB write.
Form: `file` (required)

### `POST /resume/analyze` ⚡ Rate limited: 10/minute per IP
Full pipeline. Form: `file` (required) · `user_name` · `job_description`
```json
{ "filename": "...", "user_name": "...", "doc_id": "...",
  "overall_score": 74, "scores": {...}, "features": {...},
  "nlp_insights": {...}, "ai_insights": {...}, "ai_error": null,
  "strengths": [...], "improvements": [...] }
```

### `GET /resume/file/{file_id}`
Download original file from GridFS. Returns binary with correct MIME type and `Content-Disposition`.

### `GET /resume/history?limit=20`
Recent analyses — lightweight projection (id, meta, score, grade, career_level).

### `GET /resume/history/user/{user_name}?limit=10`
All analyses for a user (case-insensitive).

### `GET /resume/history/{resume_id}`
Full analysis document by MongoDB id.

---

## Prerequisites

**Tesseract OCR**

| OS | Install |
|---|---|
| Windows | [UB Mannheim installer](https://github.com/UB-Mannheim/tesseract/wiki) → add to `PATH` |
| macOS | `brew install tesseract` |
| Ubuntu | `sudo apt install tesseract-ocr tesseract-ocr-eng` |

**Poppler** (PDF → image conversion)

| OS | Install |
|---|---|
| Windows | [oschwartz10612/poppler-windows](https://github.com/oschwartz10612/poppler-windows/releases) → add `bin/` to `PATH` |
| macOS | `brew install poppler` |
| Ubuntu | `sudo apt install poppler-utils` |

Verify both: `tesseract --version` and `pdftoppm -v`

---

## Local Development Setup

```bash
# 1 — Clone
git clone https://github.com/Nikhil06032004/AI-Resume-Analytics-Engine.git
cd resume-insights

# 2 — Backend
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env              # Fill in AI_API_KEY and MONGODB_URI

# 3 — Frontend
cd ..
npm install
cp .env.example .env              # VITE_API_URL=http://localhost:8000 (default)

# 4 — Run both servers
# Terminal 1
cd backend && uvicorn app.main:app --reload --port 8000
# Terminal 2
npm run dev
```

Open **http://localhost:5173**. API docs at **http://localhost:8000/docs**.

**Run backend tests:**
```bash
cd backend
pytest tests/ -v
```

---

## Production Deployment Guide

### Step 1 — MongoDB Atlas

1. Create free account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free **M0** cluster (any region)
3. **Database Access** → Add user → username + password (note the password)
4. **Network Access** → Add IP → `0.0.0.0/0` (allow all — required for Render)
5. **Connect** → Drivers → Copy the connection string
6. Replace `<password>` with your actual password. URL-encode special chars: `@` → `%40`

```
mongodb+srv://youruser:yourp%40ss@cluster0.xxxxx.mongodb.net/resume_analyzer?appName=Cluster0
```

---

### Step 2 — GitHub Repository

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/Nikhil06032004/AI-Resume-Analytics-Engine.git
git push -u origin main
```

---

### Step 3 — Deploy Backend on Render

1. Sign up at [render.com](https://render.com) → connect GitHub
2. **New** → **Blueprint** → select your repository
3. Render reads `render.yaml` automatically and creates the service
4. In the service → **Environment** tab, add:

| Key | Value |
|---|---|
| `MONGODB_URI` | your Atlas connection string |
| `AI_API_KEY` | your Google AI Studio key |
| `FRONTEND_URL` | leave blank for now (set after Step 4) |

5. Click **Deploy** — first deploy takes ~5–8 minutes (Docker build with OCR deps)
6. Copy your backend URL, e.g. `https://resume-insights-api.onrender.com`

---

### Step 4 — Deploy Frontend on Vercel

1. Sign up at [vercel.com](https://vercel.com) → **Import** GitHub repo
2. Vercel auto-detects Vite. Set:
   - **Root Directory**: `/` (repo root, not `/src`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add environment variable:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://resume-insights-api.onrender.com` |

4. Click **Deploy** — takes ~60 seconds
5. Copy your frontend URL, e.g. `https://resume-insights.vercel.app`

---

### Step 5 — Connect frontend URL to backend CORS

1. In Render → your service → **Environment**:
   - Add `FRONTEND_URL` = `https://resume-insights.vercel.app`
2. **Manual Deploy** → redeploy the backend so CORS picks up the new origin

---

### Step 6 — Set up GitHub Actions secrets

1. GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add secret:

| Secret | Value |
|---|---|
| `RENDER_DEPLOY_HOOK` | Render service → Settings → Deploy Hook → copy URL |

Now every `git push origin main` will:
- ✅ Run CI (lint + tests + Docker build)
- ✅ Trigger Render backend redeploy
- ✅ Trigger Vercel frontend redeploy (automatic via GitHub integration)

---

### Step 7 — Update README badges

Replace `YOUR_USERNAME` in the badge URLs at the top of this file with your GitHub username.

---

## Environment Variables

### `backend/.env`

```env
# AI insights (optional — scoring works without it)
AI_API_KEY=your_google_ai_studio_key

# MongoDB storage (optional — analysis returns results without it)
MONGODB_URI=mongodb+srv://user:p%40ss@cluster0.example.mongodb.net/resume_analyzer?appName=Cluster0

# CORS — set in production to restrict to your Vercel domain
FRONTEND_URL=https://resume-insights.vercel.app

# App settings
APP_VERSION=5.0.0
DEBUG=false
MAX_UPLOAD_SIZE_MB=10
```

### `src/.env` (frontend root)

```env
VITE_API_URL=http://localhost:8000
```

> Never commit `.env` files. Both are in `.gitignore`.

---

## Troubleshooting

### Backend / OCR

**`TesseractNotFoundError`** — Tesseract not on PATH. Install and verify: `tesseract --version`

**`PDFInfoNotInstalledError`** — Poppler not installed. Verify: `pdftoppm -v`

**`ModuleNotFoundError: spacy`** — Run: `pip install -r requirements.txt && python -m spacy download en_core_web_sm`

**`OSError: [E050] Can't find model 'en_core_web_sm'`** — Run: `python -m spacy download en_core_web_sm`

---

### MongoDB

**`MONGODB_URI is not set`** — Add to `backend/.env`, restart server

**`ServerSelectionTimeoutError`** — Atlas cluster not running, or IP `0.0.0.0/0` not in Network Access

**Authentication failed** — Special chars in password not URL-encoded: `@` → `%40`

---

### AI

**`AI_API_KEY is not configured`** — Add to `backend/.env`, restart server

**`Gemini free-tier quota exhausted`** — Wait 24 hours or enable billing in Google AI Studio

**AI shows old result on "Refresh AI Insights"** — SHA-256 cache returns cached result for identical input. Restart server to clear cache.

---

### CI/CD

**Frontend CI fails on `tsc --noEmit`** — Fix TypeScript errors locally: `npx tsc --noEmit`

**Backend CI fails on `ruff check`** — Fix lint issues: `ruff check app/ --fix`

**`RENDER_DEPLOY_HOOK` not set warning** — Add the secret in GitHub repo → Settings → Secrets → Actions

**Render deploy takes too long** — First Docker build installs Tesseract + spaCy (~5 min). Subsequent deploys use Docker layer cache and are faster (~2 min).

---

### Production (Render free tier)

**Service spins down after 15 minutes of inactivity** — Expected on the free tier. First request after idle takes ~30 seconds to spin up. Upgrade to a paid plan to keep it always-on, or use [UptimeRobot](https://uptimerobot.com) to ping `/health` every 5 minutes (free).

**Out of memory** — Free tier has 512 MB RAM. spaCy + OpenCV + the request handler may spike close to this on large PDFs. If you see OOM kills, reduce `MAX_UPLOAD_SIZE_MB` to 5.
