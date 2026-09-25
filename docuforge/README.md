# DocuCraft — AI Document Automation SaaS

A production-style AI document generation platform. Users select a document type, fill structured inputs, get AI-generated professional documents, refine them, and download as PDF or DOCX.

---

## Architecture

```
docuforge/
├── backend/           # Express.js API (Node.js + TypeScript)
│   └── src/
│       ├── config/    # DB connection, environment config
│       ├── models/    # Mongoose schemas (User, Document, Preferences)
│       ├── routes/    # Express route handlers
│       ├── services/  # AI, file generation, preferences logic
│       └── types/     # Shared TypeScript interfaces
│
└── frontend/          # Next.js 14 App Router (TypeScript + Tailwind)
    ├── app/           # Pages: dashboard, generate, history, templates, settings
    ├── components/
    │   ├── document/  # DocumentPreview (the signature UI element)
    │   ├── forms/     # Per-document-type React Hook Form components
    │   ├── layout/    # Sidebar, TopHeader
    │   └── ui/        # Button, FormField, Badge primitives
    ├── lib/           # API client, constants, utils
    └── types/         # Shared frontend TypeScript types
```

### Strict layer separation

| Layer | Responsibility | What it does NOT do |
|-------|---------------|---------------------|
| Frontend | UI, forms, preview, download triggers | No AI calls, no file generation |
| Backend | AI calls, prompt building, file generation | No UI logic |
| Database | Persistence, history, personalization | No business logic |

AI logic lives exclusively in `backend/src/services/aiService.ts`. The frontend never calls AI APIs directly.

---

## Tech Stack

| Concern | Technology |
|---------|-----------|
| Frontend framework | Next.js 14 (App Router) |
| Frontend language | TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| Forms | React Hook Form |
| Backend framework | Express.js |
| Backend language | TypeScript |
| Database | MongoDB (Mongoose ORM) |
| AI — primary | Google Gemini 1.5 Flash |
| AI — fallback | Groq (llama3-70b-8192) |
| DOCX generation | `docx` npm library |
| PDF generation | Puppeteer (HTML→PDF) with HTML fallback |

---

## AI Integration Design

### Provider chain with automatic fallback

```
Request → Try Gemini → If fails → Try Groq → If fails → Error
```

Both providers use the same `{ systemPrompt, userPrompt }` interface, so adding a third provider is a one-function change in `aiService.ts`.

### Prompt architecture

Each document type has its own **system prompt** in `promptService.ts`. System prompts encode writing persona, document structure, and strict output rules:

```
1. Output ONLY the document body — no preamble, no commentary
2. Plain prose — no markdown, no bullet points, no emojis
3. No placeholder text — use actual values or omit gracefully
4. Dates written as Month DD, YYYY
5. No filler phrases
```

User prompts are structured data injections: field-by-field values from the form, plus personalization context (preferred tone, common names/companies from history).

### Refinement actions

The same AI endpoint handles both fresh generation and refinement. Refinement passes a `refineAction` + `existingContent`, and a specialized prompt rewrites the document according to the action:

- `regenerate` — completely different phrasing, same content
- `shorten` — remove ~35% while preserving all key information  
- `improve_tone` — stronger word choice, better sentence rhythm
- `make_formal` — strict executive-level formal register

---

## Personalization System

Every generation updates `UserPreferences` in MongoDB:

1. **Document type counts** — drives "Suggested for you" ordering
2. **Preferred tone** — defaults forms to the most recently used tone
3. **Common names / companies** — extracted from inputs, surfaced in UI
4. **Last-used inputs per type** — pre-fills forms on return visits

The `GET /api/preferences` endpoint returns a `suggestedTypes` array (top 3 by usage count) used by the Dashboard and Generate pages.

---

## Database Models

### `GeneratedDocument`
```
documentId    String    UUID — stable public ID
userId        String    User identifier
documentType  String    email | cover_letter | leave_letter | ...
title         String    Derived from inputs (e.g. "Email — Q3 Update")
inputs        Mixed     Verbatim form data (enables regeneration)
content       String    Generated text
wordCount     Number    Derived on save
createdAt     Date
updatedAt     Date
```
Indexed on `{ userId, createdAt: -1 }` and `{ userId, documentType, createdAt: -1 }` for efficient history queries.

### `UserPreferences`
```
userId                String
preferredTone         String    formal | professional | friendly | ...
mostUsedDocumentType  String
documentTypeCounts    Map<String, Number>
commonNames           String[]
commonCompanies       String[]
lastUsedInputs        Map<String, Mixed>    per-type form pre-fill data
```

---

## File Generation

**DOCX**: The `docx` library builds a proper `.docx` document from parsed paragraphs with configured page margins, font, and spacing. No templating — structure is programmatic.

**PDF**: Puppeteer renders an HTML template to PDF with print-quality typography (`Crimson Pro` serif + `Inter` sans). If Puppeteer is unavailable (no Chrome binary), the server returns the HTML with a `fallback: "html"` flag, and the frontend opens it in a new tab for browser printing. No silent failure.

---

## Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally OR a MongoDB Atlas connection string
- At least one AI API key (Gemini or Groq)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env — add GEMINI_API_KEY and/or GROQ_API_KEY, set MONGODB_URI
npm install
npm run dev
# API runs at http://localhost:4000
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local if backend runs on a different port
npm install
npm run dev
# UI runs at http://localhost:3000
```

### Getting API keys (both free)

| Provider | Link | Free tier |
|----------|------|-----------|
| Google Gemini | https://aistudio.google.com/app/apikey | 60 req/min |
| Groq | https://console.groq.com/keys | 30 req/min |

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/generate` | Generate or refine a document |
| `GET` | `/api/history` | Paginated document history |
| `GET` | `/api/history/recent` | Last N documents |
| `GET` | `/api/documents/:id` | Single document with full content |
| `DELETE` | `/api/documents/:id` | Delete a document |
| `POST` | `/api/download/docx` | Stream DOCX file |
| `POST` | `/api/download/pdf` | Stream PDF or return HTML fallback |
| `GET` | `/api/preferences` | User personalization data |
| `PATCH` | `/api/preferences` | Update preferred tone |
| `GET` | `/health` | Health check with DB status |

### POST /api/generate

```json
{
  "documentType": "email",
  "inputs": {
    "fromName": "Alex Johnson",
    "toName": "Sarah Williams",
    "subject": "Q3 Timeline Extension",
    "purpose": "Request a 2-week extension due to scope changes",
    "tone": "professional",
    "length": "medium"
  },
  "userId": "default-user"
}
```

For refinement, add:
```json
{
  "refineAction": "shorten",
  "existingContent": "Dear Sarah, ..."
}
```

---

## Design Decisions

**Why MongoDB over SQL?** Document inputs vary significantly by type — an email has `fromName/toName/subject`, a resume has `skills/education/experience`. Storing these as `Mixed` in Mongoose avoids a complex multi-table join or a bloated nullable schema. The tradeoff is weaker schema enforcement, mitigated by TypeScript types at the application layer.

**Why a separate Express backend instead of Next.js API routes?** Strict architectural separation. The backend can be deployed, scaled, and tested independently. AI calls, file generation (Puppeteer, docx library), and database operations are heavier concerns that belong on a server process, not mixed with the frontend deployment.

**Why CSS custom properties instead of Tailwind-only?** The dark theme tokens need to cascade correctly across the document preview panel (which uses a `var(--surface-*)` background) and the paper-white inner content. CSS custom properties make this single-source-of-truth without fighting Tailwind's JIT.

**The signature design element:** The document preview renders as a white "paper" with a warm typographic serif font (`Crimson Pro`) floating on the dark background, with a subtle purple glow. This creates a strong visual metaphor — you're looking at a lit document on a desk — and makes the AI output feel tangible and real rather than like UI text.

---

## Non-goals (by design)

- Authentication — single `default-user` for demo purposes
- Payments / subscriptions
- Multi-tenant isolation
- Real-time collaboration
