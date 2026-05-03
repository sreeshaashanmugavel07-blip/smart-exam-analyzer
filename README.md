# Smart Exam Analyzer

Production-ready web app that ingests past exam papers (PDF + images), extracts text, and uses **Groq** (`llama3-70b-8192`) to produce structured insights: topic frequency, importance ranking, question patterns, syllabus coverage, study plans, and practice questions.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Prisma](https://img.shields.io/badge/Prisma-5-2D3748)

## Features

- **Multi-file upload** — PDF, PNG, JPG, and TXT with drag-and-drop and file list
- **Text extraction** — `pdf-parse` (PDF) + Tesseract.js (images); text is cleaned and merged
- **AI analysis** — Groq JSON outputs for topics, difficulty, patterns, and more
- **Study plan & practice** — Day-wise plans and generated questions per topic
- **Modern UI** — Sidebar layout, glassmorphism, Framer Motion, Recharts dashboards
- **PostgreSQL + Prisma** — Persists papers, extracted text, and analysis JSON

## Tech Stack

| Layer | Technology |
|--------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Framer Motion, Recharts |
| AI | Groq SDK (`llama3-70b-8192`) |
| OCR | Tesseract.js |
| PDF | pdf-parse (PDF.js-based) |
| Database | PostgreSQL + Prisma ORM |

## Prerequisites

- Node.js 20+
- PostgreSQL instance (local or hosted)
- [Groq API key](https://console.groq.com/)

## Setup Instructions

1. **Clone the repository** (after you publish it to GitHub):

   ```bash
   git clone <your-repo-url>
   cd smart-exam-analyzer
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment variables**

   Copy the example file and fill in values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Description |
   |----------|-------------|
   | `DATABASE_URL` | PostgreSQL connection string |
   | `GROQ_API_KEY` | Your Groq API key |

4. **Database**

   ```bash
   npx prisma db push
   ```

5. **Run locally**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

6. **Production build**

   ```bash
   npm run build
   npm start
   ```

## API Routes

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/upload` | Multipart `files` (multiple) and/or `text`; extracts and stores combined text |
| `POST` | `/api/analyze` | Body: `paperId` or `text`, optional `syllabusText`; runs Groq pipeline |
| `POST` | `/api/generate-plan` | Body: `paperId`, `days` |
| `POST` | `/api/generate-questions` | Body: `paperId`, `topic` |

## Screenshots

_Add screenshots of the Upload view, Dashboard charts, and Study Plan here after deployment._

## Demo Video

_Placeholder: link your Loom / YouTube demo (e.g. `https://youtube.com/watch?v=...`)._

---

## Hosting (recommended)

- **[Vercel](https://vercel.com/)** — Connect your GitHub repo; set `DATABASE_URL` and `GROQ_API_KEY` in Project → Settings → Environment Variables. Use a hosted Postgres (Neon, Supabase, Railway) for production.

## Hackathon tips

- Record a **2–3 minute demo**: upload a PDF, show extraction loading, dashboard, and one generated question set.
- Add screenshots to the README and pin the demo link at the top.

## License

MIT
