# TenderAI – Simple PDF Analyser

Upload any government tender PDF → instant AI analysis.

## Setup (3 steps)

### 1. Install
```bash
npm install
```

### 2. Add your Gemini API key
```bash
# Create .env.local
echo "GEMINI_API_KEY=your_key_here" > .env.local
```
Get a free key at https://aistudio.google.com

### 3. Run
```bash
npm run dev
```
Open http://localhost:3000

## What it does
- Upload any tender PDF (GeM, eProcure, State portals)
- AI reads every page and extracts:
  - **Eligibility** – are you qualified to bid?
  - **Risk level** – LOW / MEDIUM / HIGH
  - **Win probability** – estimated %
  - **Scope of work** – key deliverables
  - **Required documents** – with mandatory/optional flag
  - **Key dates** – submission deadlines, opening dates
  - **Authority contacts** – phone, email
  - **Ask AI** – follow-up chat about the tender
