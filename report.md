# AI Resume Analytics Engine — Project Report

**Author:** Nikhil (Nikhil06032004)
**Repository:** https://github.com/Nikhil06032004/AI-Resume-Analytics-Engine
**Live Application:** https://resume-analytics-engine.vercel.app
**API Base URL:** https://ai-resume-analytics-engine.onrender.com
**Report Date:** April 2026

---

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [Problem It Solves](#2-problem-it-solves)
3. [How It Works — Big Picture](#3-how-it-works--big-picture)
4. [Tech Stack](#4-tech-stack)
5. [System Architecture](#5-system-architecture)
6. [User Journey (Step by Step)](#6-user-journey-step-by-step)
7. [Backend Pipeline (Deep Dive)](#7-backend-pipeline-deep-dive)
   - [Stage 1 — File Validation](#stage-1--file-validation)
   - [Stage 2 — Text Extraction & OCR](#stage-2--text-extraction--ocr)
   - [Stage 3 — NLP Enrichment](#stage-3--nlp-enrichment)
   - [Stage 4 — Feature Scoring](#stage-4--feature-scoring)
   - [Stage 5 — AI Insights](#stage-5--ai-insights)
   - [Stage 6 — Database Storage](#stage-6--database-storage)
8. [Scoring Model Explained](#8-scoring-model-explained)
9. [AI Insights Layer](#9-ai-insights-layer)
10. [Database Design](#10-database-design)
11. [API Reference](#11-api-reference)
12. [Frontend Architecture](#12-frontend-architecture)
13. [Landing Page Architecture](#13-landing-page-architecture)
14. [CI/CD Pipeline](#14-cicd-pipeline)
15. [Security Measures](#15-security-measures)
16. [Deployment Guide](#16-deployment-guide)
17. [Project File Structure](#17-project-file-structure)
18. [Key Design Decisions](#18-key-design-decisions)
19. [Known Limitations](#19-known-limitations)
20. [Glossary](#20-glossary)

---

## 1. Project Summary

The **AI Resume Analytics Engine** is a full-stack web application that accepts a resume file uploaded by the user and returns a detailed, structured analysis of it. Every score, chart, and recommendation is computed directly from the document's real content — no templates, no placeholder data, no randomness.

| What | Details |
|---|---|
| Type | Full-stack web application |
| Frontend | React 18 + TypeScript + Vite (hosted on Vercel) |
| Backend | Python 3.11 + FastAPI (hosted on Render, inside Docker) |
| Database | MongoDB Atlas (cloud) + GridFS for file storage |
| AI Layer | Google Gemini 2.0 Flash via official SDK |
| File formats | PDF, DOCX, TXT, PNG, JPG, JPEG |
| Max file size | 10 MB |

---

## 2. Problem It Solves

Most resume checkers online are either:
- Entirely AI-generated with no real document parsing
- Based on rigid templates that give every resume the same generic advice
- Paid tools that give little transparency into how scores are calculated

This project fixes that by:

1. **Actually reading the resume** — using OCR for scanned documents, pdfplumber for native PDFs, and python-docx for Word files
2. **Computing scores deterministically** — the same resume always gets the same score; no randomness
3. **Using real NLP** — spaCy extracts actual company names, job titles, and date ranges from your text
4. **Providing AI feedback that is document-specific** — Gemini reads the real extracted text, not a summary
5. **Being completely transparent** — every score component is visible, with the formula shown

---

## 3. How It Works — Big Picture

```
User opens browser
        │
        ▼
┌─────────────────────┐
│   Landing Page      │  ← Static HTML, loads instantly
│   (index.html)      │  ← Explains the tool, no React yet
└──────────┬──────────┘
           │  User clicks "Open Dashboard"
           ▼
┌─────────────────────┐
│   React Dashboard   │  ← Mounts only on user click
│   (Vite SPA)        │
└──────────┬──────────┘
           │  User uploads resume
           ▼
┌─────────────────────────────────────────────────────┐
│   FastAPI Backend (Render / Docker)                 │
│                                                     │
│  1. Validate file (type + size)                     │
│  2. Extract text (OCR / native / docx / txt)        │
│  3. Run NLP (spaCy: companies, titles, dates)       │
│  4. Score 5 dimensions (regex + formula)            │
│  5. Call Gemini AI (10 structured fields)           │
│  6. Save to MongoDB (async, non-blocking)           │
└──────────┬──────────────────────────────────────────┘
           │  JSON response in <30 seconds
           ▼
┌─────────────────────┐
│   Results Dashboard │
│   4 ECharts graphs  │
│   AI feedback cards │
│   Score breakdown   │
└─────────────────────┘
```

---

## 4. Tech Stack

### Frontend

| Tool | Version | Why Used |
|---|---|---|
| React | 18.3.1 | UI component framework |
| TypeScript | 5.5.3 | Type safety, catches bugs at compile time |
| Vite | 5.4.2 | Fast build tool, instant HMR in dev |
| Tailwind CSS | 3.4.1 | Utility-first styling, no custom CSS needed |
| ECharts | 6.0.0 | Powerful chart library (gauge, radar, pie, bar) |
| Lucide React | 0.344.0 | Clean SVG icon set |
| React Context | built-in | Global state without Redux |

### Backend

| Tool | Version | Why Used |
|---|---|---|
| FastAPI | latest | Modern async Python API framework with auto docs |
| Python | 3.11 | Stable, well-supported for ML/NLP tools |
| pdfplumber | latest | Best library for extracting text from native PDFs |
| pdf2image | latest | Converts PDF pages to images for OCR |
| OpenCV | latest | Image preprocessing before OCR |
| Tesseract | 5.x | Open-source OCR engine |
| Pillow | latest | Image file handling |
| python-docx | latest | Word document paragraph extraction |
| spaCy | 3.x | Production NLP: NER, noun chunks |
| google-genai | latest | Official Gemini SDK |
| Motor | latest | Async MongoDB driver for Python |
| pydantic-settings | v2 | Type-safe environment variable loading |
| slowapi | latest | Rate limiting for FastAPI |
| Uvicorn | latest | ASGI server (runs FastAPI) |

### Infrastructure

| Service | Tier | Role |
|---|---|---|
| Vercel | Free | Frontend hosting, global CDN |
| Render | Free | Backend Docker container hosting |
| MongoDB Atlas | M0 Free (512 MB) | Database + GridFS file storage |
| Google AI Studio | Free | Gemini 2.0 Flash API |
| GitHub Actions | Free | CI/CD automation |
| Docker | — | Backend container for consistent deployment |

---

## 5. System Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    INTERNET / BROWSER                      │
└──────────────────────────┬─────────────────────────────────┘
                           │ HTTPS
          ┌────────────────┴────────────────┐
          ▼                                 ▼
┌─────────────────────┐          ┌──────────────────────────┐
│  Vercel (Frontend)  │          │  Render (Backend)        │
│                     │  HTTPS   │  Docker Container        │
│  React 18 + Vite   │◀────────▶│  FastAPI + Uvicorn       │
│  TypeScript         │          │  Python 3.11             │
│  Tailwind + ECharts │          │                          │
│  Static HTML Landing│          │  ┌──────────────────┐   │
│                     │          │  │ parser.py        │   │
└─────────────────────┘          │  │ analyzer.py      │   │
                                 │  │ nlp_service.py   │   │
                                 │  │ ai_service.py    │   │
                                 │  │ db_service.py    │   │
                                 │  └────────┬─────────┘   │
                                 └───────────┼──────────────┘
                                             │
                    ┌────────────────────────┼────────────────────┐
                    ▼                        ▼                    ▼
          ┌──────────────────┐   ┌──────────────────┐   ┌───────────────┐
          │  MongoDB Atlas   │   │  Google Gemini   │   │   Tesseract   │
          │  resume_analyzer │   │  2.0 Flash API   │   │   OCR Engine  │
          │  + GridFS files  │   │  (AI insights)   │   │   (in Docker) │
          └──────────────────┘   └──────────────────┘   └───────────────┘
```

### Data Flow for One Resume Upload

```
Browser → POST /resume/analyze (multipart/form-data)
       → FastAPI validates file
       → parser.py extracts text
       → nlp_service.py runs spaCy
       → analyzer.py scores 5 dimensions
       → ai_service.py calls Gemini (optional)
       → JSON response → Browser renders dashboard
       → db_service.py saves to MongoDB (async, after response)
```

---

## 6. User Journey (Step by Step)

### Step 0 — Landing Page

The user arrives at the URL and sees a static HTML page. React has **not** loaded yet. The page explains the tool through:
- A hero section with live stats (5 file formats, 90+ skills tracked, etc.)
- A 6-stage pipeline overview
- A features bento grid
- OCR preprocessing detail
- Scoring model visualization
- Technology stack list

When the user clicks **"Open Dashboard →"**, the `enterApp()` function:
1. Shows a loading spinner overlay (550 ms)
2. Calls `window.mountApp()` which triggers React to mount
3. Hides the landing page, shows the React app

This ensures the React bundle (~1 MB) is only fetched when the user actually wants to use the dashboard — improving perceived performance.

---

### Step 1 — Upload (React App)

```
┌──────────────────────────────────────────┐
│  ProgressTracker:  [●]○○○               │
│                                          │
│  Your Name (optional)                    │
│  ┌──────────────────────────────────┐   │
│  │  Enter your name                 │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌─ Drop Zone ──────────────────────┐   │
│  │   Drag & drop  OR  Browse Files  │   │
│  │   PDF · DOCX · TXT · PNG · JPG   │   │
│  │   Max 10 MB                      │   │
│  └──────────────────────────────────┘   │
│                                          │
│         [Continue to Analysis]           │
└──────────────────────────────────────────┘
```

Validation happens client-side first (extension whitelist, size check), then again on the server.

---

### Step 2 — Job Match (Optional)

```
┌──────────────────────────────────────────┐
│  ProgressTracker:  [●][●]○○             │
│                                          │
│  Paste a job description (optional)      │
│  ┌──────────────────────────────────┐   │
│  │  Software Engineer at Acme...    │   │
│  └──────────────────────────────────┘   │
│                                          │
│  [Skip]   [Analyze with Job Match]       │
└──────────────────────────────────────────┘
```

If a job description is provided, it is sent to the backend and used as context for Gemini's AI feedback — improving role matching and ATS gap analysis.

---

### Step 3 — Analysing (Loading Screen)

Six animated step cards show progress:

```
[✓] Parsing Resume     [✓] Content Analysis   [✓] NLP Processing
[✓] Skill Matching     [✓] Score Calculation  [⟳] AI Insights
```

If the API takes longer than the animation (Render free tier cold start: ~30 s), a "Generating AI Insights…" waiting state with a spinner is shown.

---

### Step 4 — Results Dashboard

```
┌─ KPI Strip ────────────────────────────────────────────────┐
│  Overall: 74 B    Experience: 68    Skills: 80    ATS: 65  │
└────────────────────────────────────────────────────────────┘

┌─ Row 1 ──────────────────────────────────────────────────┐
│  ScoreGauge (overall %)  │  PieChart (skill categories)  │
└────────────────────────────────────────────────────────────┘

┌─ Row 2 ──────────────────────────────────────────────────┐
│  RadarChart (7 sections) │  BarChart (keyword frequency) │
└────────────────────────────────────────────────────────────┘

┌─ AI Cards ───────────────────────────────────────────────┐
│  Career Profile · Recommended Roles · ATS Tips           │
│  Project Suggestions · Red Flags · Unique Insights       │
└────────────────────────────────────────────────────────────┘

┌─ Engine Cards ───────────────────────────────────────────┐
│  Strengths · Areas to Improve · Action Plan              │
└────────────────────────────────────────────────────────────┘

  [Get AI Suggestions]   [Analyse Another Resume]
```

---

## 7. Backend Pipeline (Deep Dive)

Entry point: `POST /resume/analyze` in `backend/app/routers/resume.py`

### Stage 1 — File Validation

```python
Accepted extensions: .pdf  .docx  .txt  .png  .jpg  .jpeg
Max size: 10 MB
Empty file: rejected (0 bytes)
```

Errors returned:
- `415 Unsupported Media Type` — wrong extension
- `413 Request Entity Too Large` — over 10 MB
- `400 Bad Request` — empty file

---

### Stage 2 — Text Extraction & OCR

**Source:** `backend/app/services/parser.py` → `extract_text(file_bytes, filename)`

#### PDF Files

```
file_bytes (.pdf)
       │
       ▼
pdfplumber.open() → extract all pages
       │
       └─ < 50 characters extracted?
              │          │
             YES         NO
              │           └──▶ return native text
              ▼
       pdf2image → convert at 300 DPI
              │
              └──▶ per page: preprocess_image() + OCR
```

#### Image Files (.png / .jpg / .jpeg)

```
PIL Image.open()
       │
       ▼ convert("RGB") → numpy array
       │
       ▼ cv2.cvtColor → grayscale
       │
       ▼ cv2.GaussianBlur(kernel 3×3)
       │
       ├──────────────────────────────┐
       ▼                              ▼
 Adaptive Threshold              Otsu Threshold
 (uneven lighting)               (clean scans)
 blockSize=15, C=8               THRESH_OTSU
       │                              │
       └──────────── compare mean ────┘
                           │
                    higher mean wins
                           │
                           ▼
              pytesseract.image_to_data()
              keep words with conf ≥ 60%
              group by (block, paragraph, line)
```

#### DOCX Files

```python
Document(BytesIO(file_bytes))
→ [p.text for p in document.paragraphs if p.text.strip()]
→ "\n".join(paragraphs)
```

#### TXT Files

```python
try:    return file_bytes.decode("utf-8").strip()
except: return file_bytes.decode("latin-1").strip()
```

---

### Stage 3 — NLP Enrichment

**Source:** `backend/app/services/nlp_service.py`

Model: `spaCy en_core_web_sm` (loaded with `disable=["lemmatizer"]` for speed)

```
extracted text
       │
       ▼
spaCy NLP pipeline
       │
       ├─▶ Named Entity Recognition (NER)
       │      ORG  → company names
       │      DATE → date strings
       │
       ├─▶ Noun chunks
       │      filter for ROLE_KEYWORDS (engineer, manager, analyst…)
       │      keep 2–6 word phrases → job titles
       │
       └─▶ _parse_timeline(text)
              YEAR_RANGE regex → [{start, end, duration_months}]
              sanity check: 0 < duration < 480 months
```

**Noise Filter** — rejects false positives:

| Rule | Example Rejected |
|---|---|
| Length < 3 chars | "AI", "IT" |
| Purely numeric | "2019", "123" |
| Phone-number pattern | "555-123-4567" |
| All-caps (section header) | "EDUCATION", "SKILLS" |
| Digit ratio > 55% | "B2B4E1" |
| Exact noise word (40+ list) | "university", "github", "llc" |

---

### Stage 4 — Feature Scoring

**Source:** `backend/app/services/analyzer.py`

Four independent extractors run on the normalized text:

| Extractor | Key Signals |
|---|---|
| Experience | Year ranges, bullet points, action verbs (65-word list), unique role types |
| Skills | 6 taxonomy categories, ~90 technologies, word-boundary regex match |
| Content Quality | Bullet density, quantified metrics (%, $, ×, headcount), action verb ratio |
| ATS Compatibility | Keyword density, section headers detected, formatting quality |

---

### Stage 5 — AI Insights

**Source:** `backend/app/services/ai_service.py`

- Model: `gemini-2.0-flash`
- Parameters: `temperature=0.3`, `max_output_tokens=2048`
- Cache: SHA-256 hash of `(text[:500], features_dict)` → in-process dict
- Failure: graceful — scoring always completes even if Gemini fails

Input sent to Gemini:
```
Resume text:        first 3,000 characters
Skills detected:    list from scoring engine
Roles detected:     NLP-extracted job titles
Companies:          NLP-extracted org names
Experience years:   float from scoring engine
Job description:    first 1,500 chars (if provided)
```

---

### Stage 6 — Database Storage

**Source:** `backend/app/services/db_service.py`

Storage is **non-blocking** — it runs asynchronously after the JSON response is sent to the user. This means a MongoDB failure never delays or breaks the analysis response.

Two writes per analysis:
1. **GridFS** — raw file bytes stored with original filename
2. **resumes collection** — full analysis document (scores, features, NLP, AI insights)

---

## 8. Scoring Model Explained

All scores are 0–100. No randomness. Same input → same output every time.

### Component Weights

```
Overall Score = (0.30 × Experience Score)
              + (0.25 × Skills Score)
              + (0.20 × Content Quality Score)
              + (0.15 × ATS Score)
              + (0.10 × Education Score)
```

### Experience Score (30%)

| Signal | Formula | Max Points |
|---|---|---|
| Unique role types | count × 15 | 40 |
| Bullet points | count × 2 | 30 |
| Action verbs | count × 2 | 20 |
| Estimated years experience | years × 2 | 10 |

### Skills Score (25%)

| Signal | Formula | Max Points |
|---|---|---|
| Unique skills matched | count × 4 | 50 |
| Category spread (of 6) | categories × 8 | 30 |
| Skill density | (skills ÷ words) × 2000 | 20 |

**Skill Taxonomy (6 categories, ~90 technologies):**

| Category | Examples |
|---|---|
| programming | python, javascript, typescript, java, go, rust, c++ |
| web | react, vue, angular, html, css, tailwind, nextjs, django |
| tools | git, docker, kubernetes, jenkins, terraform, linux, figma |
| database | mysql, postgresql, mongodb, redis, elasticsearch, firebase |
| cloud | aws, azure, gcp, heroku, vercel, netlify, s3, lambda |
| data | pandas, numpy, tensorflow, pytorch, scikit-learn, spark |

### Content Quality Score (20%)

| Signal | Formula | Max Points |
|---|---|---|
| Bullet points | count × 2 | 30 |
| Quantified metrics (%, $, ×) | count × 6 | 30 |
| Action verb ratio | ratio × 300 | 20 |
| Avg sentence length | 10–20 words = full marks | 20 |

### ATS Score (15%)

| Signal | Formula | Max Points |
|---|---|---|
| Keyword density | density × 600 | 40 |
| Section completeness | sections_found ÷ 4 × 40 | 40 |
| Formatting quality | quality × 20 | 20 |

### Education Score (10%)

| Detection | Points Added |
|---|---|
| Degree keyword (bachelor, master, phd, mba…) | +50 |
| Institution keyword (university, college…) | +25 |
| GPA mentioned | +15 |
| Honours (distinction, cum laude, dean's list) | +10 |

### Grade Scale

| Score | Grade | Label |
|---|---|---|
| 90–100 | A+ | Exceptional |
| 80–89 | A | Strong |
| 70–79 | B | Good |
| 60–69 | C | Average |
| 50–59 | D | Needs Work |
| 0–49 | F | Poor |

---

## 9. AI Insights Layer

Gemini returns 10 structured fields:

| Field | Type | What It Contains |
|---|---|---|
| `summary` | string | 2–3 sentence professional profile |
| `career_level` | enum | fresher / junior / mid-level / senior |
| `strengths` | string[] | Specific strong points from the resume |
| `weaknesses` | string[] | Identified gaps or weak areas |
| `improvements` | string[] | Concrete rewrite suggestions |
| `ats_tips` | string[] | ATS keyword and format advice |
| `project_suggestions` | string[] | Portfolio project ideas for skill gaps |
| `recommended_roles` | string[] | Suitable job titles to apply for |
| `red_flags` | string[] | Recruiter / ATS rejection triggers |
| `unique_insights` | string[] | Observations specific to this resume |

### Error Handling

| Error | Message Shown to User |
|---|---|
| Quota exhausted (429) | "Gemini free-tier quota exhausted. Wait a minute and try again…" |
| Invalid API key | "Invalid or revoked API key. Generate a new key at aistudio.google.com" |
| SDK not installed | "google-genai SDK not installed. Run: pip install google-genai" |
| AI_API_KEY not set | "AI_API_KEY is not configured. Add AI_API_KEY=your_key to backend/.env" |

---

## 10. Database Design

### Collection: `resumes`

```
{
  _id:        ObjectId,
  meta: {
    user_name:           "Nikhil",
    filename:            "nikhil_cv.pdf",
    file_size_bytes:     142080,
    file_id:             "ObjectId → GridFS",
    upload_date:         ISODate,
    has_ai_insights:     true,
    has_job_description: false
  },
  score: {
    overall: 74,
    grade:   "B",
    breakdown: { experience: 68, skills: 80, content: 72, ats: 65 }
  },
  features: {
    skills:     { detected: [...], by_category: {...} },
    experience: { years: 3.5, num_jobs: 2, companies: [...], timeline: [...] },
    content:    { bullet_points: 18, action_verbs_found: 12, ... },
    ats:        { keyword_density: 0.04, section_completeness: 0.75 }
  },
  ai_insights:   { summary, career_level, strengths, weaknesses, ... },
  ai_error:      null,
  insights:      { strengths: [...], improvements: [...] }
}
```

### GridFS Bucket: `resume_files`

Stores the original uploaded file in binary chunks (255 KB each). The original filename is always preserved.

```
resume_files.files   → metadata (filename, size, upload date)
resume_files.chunks  → binary data split into 255 KB pieces
```

### Indexes

| Index Name | Fields | Purpose |
|---|---|---|
| `idx_upload_date` | `meta.upload_date` DESC | Fast recent history |
| `idx_user_history` | `meta.user_name` + `meta.upload_date` | Per-user history |
| `idx_score` | `score.overall` DESC | Sort by score |

---

## 11. API Reference

Base URL (production): `https://ai-resume-analytics-engine.onrender.com`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Basic health check |
| GET | `/health` | Detailed health (used by Render) |
| GET | `/debug` | Runtime config (CORS, AI, DB status) |
| POST | `/resume/upload` | Parse file, return text preview only |
| POST | `/resume/analyze` | Full pipeline: parse + NLP + score + AI + save |
| GET | `/resume/file/{file_id}` | Download original file from GridFS |
| GET | `/resume/history` | Recent analyses (last 20 by default) |
| GET | `/resume/history/user/{name}` | All analyses for a user |
| GET | `/resume/history/{id}` | Single analysis by MongoDB ObjectId |

### POST /resume/analyze

**Rate limit:** 10 requests per minute per IP

**Form fields:**

| Field | Required | Description |
|---|---|---|
| `file` | Yes | Resume file (PDF, DOCX, TXT, PNG, JPG, JPEG, max 10 MB) |
| `user_name` | No | Stored in database. Default: "Anonymous" |
| `job_description` | No | Used as Gemini context for better AI matching |

**Response (simplified):**
```json
{
  "filename":      "nikhil_cv.pdf",
  "overall_score": 74,
  "scores":        { "experience": 68, "skills": 80, "content": 72, "ats": 65 },
  "features":      { "skills_detected": [...], "experience_years": 3.5 },
  "nlp_insights":  { "companies_detected": [...], "experience_timeline": [...] },
  "ai_insights":   { "summary": "...", "career_level": "mid-level", ... },
  "ai_error":      null,
  "strengths":     ["Strong technical skill breadth"],
  "improvements":  ["Add more quantified achievements"]
}
```

---

## 12. Frontend Architecture

The frontend is a **React 18 Single Page Application** built with Vite. It uses **no React Router** — navigation between steps is managed entirely through React Context state.

### State Flow

```
ResumeContext (global state)
       │
       ├─ currentStep: "upload" | "job-matching" | "analyzing" | "results"
       ├─ resumeFile: File | null
       ├─ userName: string
       ├─ analysisResult: AnalysisResult | null
       ├─ isLoading: boolean
       └─ error: string | null

App.tsx reads currentStep → renders matching component:

  "upload"      → <ResumeUpload />
  "job-matching"→ <JobDescriptionInput />
  "analyzing"   → <LoadingScreen />
  "results"     → <Dashboard />
```

### Chart Components (all use ECharts)

| Component | Chart Type | Data Source |
|---|---|---|
| `ScoreGauge` | Gauge (0–100) | `overall_score` |
| `RadarChart` | Radar (7 axes) | `sectionScores` derived from backend signals |
| `PieChart` | Donut | `skills_by_category` count per category |
| `BarChart` | Horizontal bar | `keywordFrequency` (skill count per category) |

### API Layer (`src/services/api.ts`)

All backend communication goes through `api.ts`. It handles:
- Building `FormData` for file upload
- Mapping snake_case backend fields to camelCase TypeScript types
- Deriving `sectionScores` and `keywordFrequency` from raw backend data
- Supporting both `ai_insights` and `ai_feedback` keys (backward compatibility)

---

## 13. Landing Page Architecture

The landing page (`index.html`) is **pure static HTML with inline CSS** — it does not use React.

### Why This Design

React's bundle is ~1 MB (Tailwind + ECharts). Loading it on page visit would delay the first visible content by 1–2 seconds on slow connections. The static landing page renders immediately (< 50 ms) while the React bundle loads in the background.

### Mount Flow

```
Browser visits URL
       │
       ▼
index.html loads (landing page visible immediately)
       │
       ├─ <script type="module" src="/src/main.tsx"> starts loading
       │    main.tsx registers window.mountApp — does NOT call createRoot()
       │
       └─ User scrolls, reads landing page...
              │
              │ User clicks "Open Dashboard →"
              ▼
       enterApp() runs:
              1. Set window.__enterAppCalled = true
              2. Call window.mountApp() if bundle already loaded
              3. Show loading overlay (spinner, 550 ms)
              4. Hide landing page (#landing display:none)
              5. Show React root (#root display:block !important)

       If user clicked BEFORE bundle loaded:
              → main.tsx checks window.__enterAppCalled on load
              → calls mountApp() automatically
```

### `#root` Protection (3 layers)

```css
/* Layer 1: CSS with !important */
#root { display: none !important; }
```
```html
<!-- Layer 2: Inline style -->
<div id="root" style="display:none">
```
```js
// Layer 3: setProperty with priority
root.style.setProperty('display', 'block', 'important');
```

---

## 14. CI/CD Pipeline

### Overview

```
git push → GitHub
       │
       ├─▶ ci.yml runs (lint + tests)
       │
       └─▶ deploy.yml runs (if on main)
              ├─▶ Render backend redeploy (via deploy hook)
              └─▶ Vercel frontend auto-redeploy (via GitHub App)
```

### ci.yml — Runs on every push and pull request

**Job 1: Frontend CI**

| Step | Command | Purpose |
|---|---|---|
| Install | `npm ci` | Clean install from lockfile |
| Lint | `npm run lint` | ESLint 9 flat config + TypeScript ESLint |
| Type check | `npx tsc -p tsconfig.app.json --noEmit` | Strict TypeScript on all src/ files |
| Build | `npm run build` | Vite production build |
| Upload artifact | `actions/upload-artifact@v4` | Store dist/ for 1 day (main branch only) |

**Job 2: Backend CI**

| Step | Command | Purpose |
|---|---|---|
| Install | `pip install -r requirements.txt` | All Python dependencies |
| Lint | `ruff check app/` | Fast linting (replaces flake8 + isort) |
| Download model | `python -m spacy download en_core_web_sm` | NLP model for tests |
| Test | `pytest tests/ -v` | 5 smoke tests |

**Job 3: Docker Build Check** (PRs only)

Builds the Docker image to catch Dockerfile issues before merging.

### deploy.yml — Runs only on push to main

| Job | What It Does |
|---|---|
| `deploy-backend` | POSTs to Render deploy hook URL → Render pulls latest main + rebuilds Docker |
| `deploy-frontend` | Vercel auto-detects push via GitHub App → rebuilds Vite app |
| `summary` | Prints outcome of both jobs (runs even if they fail) |

---

## 15. Security Measures

| Area | Measure |
|---|---|
| File uploads | Extension whitelist (.pdf .docx .txt .png .jpg .jpeg) + 10 MB size cap |
| Rate limiting | 10 requests/minute per IP on `/resume/analyze` (slowapi) |
| CORS | Restricted to specific Vercel domains + localhost in dev; no wildcard in production |
| Secrets | API keys and DB URI loaded from environment variables only; never in code |
| Version control | `.env` files excluded via `.gitignore`; `.env.example` has no real values |
| Credentials flag | `allow_credentials=False` on CORS — no cookies/sessions needed |
| Security headers (Vercel) | X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy |
| Asset caching (Vercel) | Immutable cache (1 year) on `/assets/*` — hashed filenames prevent stale cache |
| No auth data stored | MongoDB only stores analysis results — no passwords, no user sessions |
| HTTP methods | CORS allows only GET, POST, OPTIONS — no PUT/DELETE/PATCH from browser |

---

## 16. Deployment Guide

### What You Need Before Starting

- GitHub account (free)
- MongoDB Atlas account (free) — for database
- Google AI Studio account (free) — for Gemini API key
- Vercel account (free) — for frontend
- Render account (free) — for backend

### Step 1: MongoDB Atlas

1. Create a free M0 cluster
2. Create a database user with a strong password
3. Network Access → allow `0.0.0.0/0` (required for Render)
4. Get connection string, URL-encode special chars in password (`@` → `%40`)

### Step 2: Push Code to GitHub

```bash
git clone https://github.com/Nikhil06032004/AI-Resume-Analytics-Engine.git
cd AI-Resume-Analytics-Engine
git push origin main
```

### Step 3: Deploy Backend (Render)

1. Render → New → Blueprint → connect repo
2. Render reads `render.yaml` automatically (Docker, /health check)
3. Set environment variables:
   - `MONGODB_URI` = your Atlas connection string
   - `AI_API_KEY` = your Google AI Studio key
   - `FRONTEND_URL` = your Vercel URL (for CORS restriction)
4. First build: ~6–8 minutes. Subsequent: ~2–3 minutes.

### Step 4: Deploy Frontend (Vercel)

1. Vercel → New Project → import GitHub repo
2. Auto-detected as Vite
3. Set environment variable: `VITE_API_URL` = your Render service URL
4. Deploy — ~60 seconds

### Step 5: Wire GitHub Secret for Auto-Deploy

1. Render → Settings → Deploy Hook → copy URL
2. GitHub → Settings → Secrets → New secret → `RENDER_DEPLOY_HOOK`
3. Every future push to main now auto-deploys both frontend and backend

---

## 17. Project File Structure

```
AI-Resume-Analytics-Engine/
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml           Lint + type-check + build + pytest on every PR/push
│   │   └── deploy.yml       Render deploy hook + Vercel auto on push to main
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   └── feature_request.yml
│   └── SECURITY.md          Vulnerability reporting instructions
│
├── backend/
│   ├── Dockerfile           Multi-stage build: pip install → Tesseract + spaCy runtime
│   ├── .dockerignore
│   ├── packages.txt         Render apt deps: tesseract-ocr, poppler-utils, libgl1
│   ├── requirements.txt     All Python production + dev dependencies
│   ├── ruff.toml            Linting rules (select E,F,W,I)
│   ├── pytest.ini           asyncio_mode=auto
│   ├── .env.example         Template — never commit real .env
│   │
│   ├── tests/
│   │   └── test_health.py   5 smoke tests (health, upload validation, history)
│   │
│   └── app/
│       ├── main.py          FastAPI app, CORS, rate limiting, middleware, health routes
│       ├── config.py        pydantic-settings: loads all env vars with types
│       ├── limiter.py       slowapi singleton
│       ├── core/
│       │   └── database.py  Motor client, collection handles, ping(), GridFS bucket
│       ├── models/
│       │   └── resume_model.py  Pydantic response schemas
│       ├── routers/
│       │   └── resume.py    All /resume/* endpoints
│       └── services/
│           ├── parser.py    Text extraction: PDF/DOCX/TXT/image + OCR pipeline
│           ├── analyzer.py  4 feature extractors + 5 scorers + weighted composite
│           ├── nlp_service.py  spaCy NER, noise filter, timeline builder
│           ├── ai_service.py   Gemini call, SHA-256 cache, error mapper
│           └── db_service.py   GridFS upload, analysis doc save, index creation
│
├── src/
│   ├── main.tsx             React entry — registers window.mountApp, deferred mount
│   ├── App.tsx              Step router (no React Router — pure state switching)
│   ├── index.css            Tailwind base/components/utilities
│   │
│   ├── components/
│   │   ├── Upload/
│   │   │   └── ResumeUpload.tsx     Name input + drag-and-drop zone
│   │   ├── JobMatching/
│   │   │   └── JobDescriptionInput.tsx  Optional textarea + skip button
│   │   ├── Analysis/
│   │   │   └── LoadingScreen.tsx    6-step animated cards + waiting spinner
│   │   ├── Dashboard/
│   │   │   └── Dashboard.tsx        Full results view with all charts and cards
│   │   ├── Charts/
│   │   │   ├── ScoreGauge.tsx       ECharts gauge
│   │   │   ├── RadarChart.tsx       ECharts radar (7 axes)
│   │   │   ├── PieChart.tsx         ECharts donut (skill categories)
│   │   │   └── BarChart.tsx         ECharts horizontal bars (keyword frequency)
│   │   └── Layout/
│   │       ├── Header.tsx           Logo + dark/light toggle
│   │       └── ProgressTracker.tsx  4-step breadcrumb
│   │
│   ├── contexts/
│   │   ├── ResumeContext.tsx    All global state + analyzeResume() + getAISuggestions()
│   │   └── ThemeContext.tsx     Dark/light mode + localStorage persistence
│   │
│   ├── hooks/
│   │   └── useFileUpload.ts    Drag-and-drop, extension check, 10 MB guard
│   │
│   ├── services/
│   │   └── api.ts              HTTP calls, snake→camelCase mapping, type guards
│   │
│   └── types/
│       └── index.ts            All TypeScript interfaces (AnalysisResult, AIFeedback…)
│
├── index.html           Landing page (static HTML) + React root + enterApp()
├── package.json         npm scripts: dev / build / lint / preview
├── vite.config.ts       Vite config: React plugin, manual chunks, PostCSS path
├── tsconfig.json        Project references entry (files: [])
├── vercel.json          SPA rewrites + asset caching + security headers
├── render.yaml          Render Blueprint: Docker service + /health check
├── .nvmrc               Node 20
├── LICENSE              MIT
└── README.md            Full developer documentation
```

---

## 18. Key Design Decisions

### Why No React Router?

The app has only 4 steps in a linear flow. React Router adds bundle size and complexity for URL-based navigation that isn't needed here. State-based step switching is simpler, easier to test, and has no URL management overhead.

### Why Deterministic Scoring Instead of AI Scoring?

AI scoring is non-deterministic — the same resume can get different scores on different runs. This makes it hard to give users meaningful feedback ("your ATS score improved by 5 points"). Deterministic scoring with a visible formula is transparent, reproducible, and trustworthy.

### Why spaCy Instead of Pure Regex for NLP?

Regex can find patterns like "2019 – 2022" but cannot identify whether "Google" is a company or "Software Engineer" is a job title without context. spaCy's trained model understands context, making entity extraction significantly more accurate.

### Why MongoDB Instead of PostgreSQL?

Resume analysis results are deeply nested documents (features, NLP entities, AI feedback arrays). Storing these in a document database is natural — no schema migrations needed when adding new fields (like the AI insights added in later phases).

### Why Defer React Bundle Loading?

The landing page is marketing material — it should be instant. The React dashboard is the product — it can take a moment to load. Deferring the 1 MB React bundle until the user actually clicks "Open Dashboard" improves perceived performance for users who just want to read about the tool.

### Why SHA-256 Cache for Gemini?

The Gemini API has a free tier with daily quota limits. If a user re-analyzes the same resume (or triggers "Get AI Suggestions" multiple times), the cache prevents redundant API calls, saving quota and reducing latency.

---

## 19. Known Limitations

| Limitation | Detail | Workaround / Status |
|---|---|---|
| Render free tier cold start | First request after 15 min idle takes ~30 seconds | Loading screen handles this gracefully with a "Generating AI Insights…" waiting state |
| MongoDB Atlas M0 512 MB cap | Large-scale use could hit storage limit | Upgrade to M2 ($9/month) if needed |
| Gemini free tier quota | Daily limit; heavy usage exhausts it | Wait 24 hours or enable billing in Google AI Studio |
| DOCX table content | Table cell text is not extracted (only paragraphs) | Future: add `python-docx` table cell iteration |
| English only | spaCy model is English; other languages unsupported | Future: add multilingual model option |
| No user authentication | Anyone with the URL can use the app | By design — no login friction; history is retrievable by name |
| OCR accuracy on poor scans | Very low-quality or rotated scans may extract garbage text | Deskewing and higher DPI could be added as a future improvement |

---

## 20. Glossary

| Term | Meaning |
|---|---|
| **ATS** | Applicant Tracking System — software recruiters use to filter resumes automatically |
| **OCR** | Optical Character Recognition — converting image pixels to readable text |
| **NER** | Named Entity Recognition — NLP technique to identify real-world entities (people, companies, dates) in text |
| **spaCy** | Open-source Python NLP library used for entity extraction |
| **Gemini** | Google's large language model (LLM) used for AI feedback generation |
| **GridFS** | MongoDB's specification for storing files larger than 16 MB as binary chunks |
| **Motor** | Async Python driver for MongoDB (non-blocking I/O) |
| **Vite** | Modern frontend build tool with instant hot module replacement in dev |
| **Tailwind CSS** | Utility-first CSS framework — styles applied via class names directly in HTML |
| **ECharts** | Apache charting library used for gauge, radar, pie, and bar charts |
| **pdfplumber** | Python library for extracting text from native (text-layer) PDFs |
| **Poppler** | PDF rendering library used by pdf2image to convert PDF pages to images |
| **Tesseract** | Open-source OCR engine developed by Google |
| **ASGI** | Asynchronous Server Gateway Interface — the Python web server standard FastAPI uses |
| **SPA** | Single Page Application — a web app that loads one HTML page and dynamically updates it |
| **CDN** | Content Delivery Network — Vercel's global edge network for fast static file delivery |
| **SHA-256** | Cryptographic hash function used to fingerprint resume text for the Gemini cache |
| **CI/CD** | Continuous Integration / Continuous Deployment — automated testing and deployment pipeline |
| **Hot module replacement** | Vite feature that updates only changed modules during development without full page reload |
| **Deterministic** | Producing the same output for the same input every time, with no randomness |

---

*This report covers the complete AI Resume Analytics Engine as of April 2026. For setup instructions and API documentation, see [README.md](README.md).*
