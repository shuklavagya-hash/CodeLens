# CodeLens

**See what breaks before you touch it.**

CodeLens is an on-device tool that turns any codebase into a live, explorable dependency graph. Upload a folder, watch its files render as connected nodes, click any file to see its **blast radius** — every file that would be affected if you changed it — and ask a **local AI model** to explain what that file does in plain English. No code ever leaves the machine.

---

## The problem

Every developer has felt this: you open an unfamiliar codebase (or your own, six months later) and you need to change one file. But you don't know:
- What does this file actually do?
- What else in the codebase depends on it?
- How risky is this change, really?

Most of the time you find out the hard way — after something breaks. CodeLens answers both questions **before** you touch a single line.

## What it does

### Visual dependency graph
Upload a repository folder and CodeLens parses every file's imports to build a live, force-directed graph of your entire codebase. Pan, zoom, and click through it like a map of your code.

### Blast radius, on click
Click any file and instantly see exactly how many other files depend on it — directly or transitively — and which ones. This is pure graph traversal (breadth-first search over real import relationships), so the number is always 100% accurate to what's actually in the code. No AI guessing involved here.

### AI explanations that run entirely on your machine
Click "Explain this change" and a local LLM (via [Ollama](https://ollama.com)) reads that file's neighbors and the start of its code, then explains — in 3–4 plain-English sentences — what the file does and how risky it is to change. The AI never sees your whole repository, only the one file's immediate context, which keeps it fast, keeps it from hallucinating, and lets it scale to large codebases.

### Last-edited tracking
Every node quietly remembers when its file was last modified on disk. The single most recently edited file in the graph gets a soft highlight glow, so you can immediately spot what your team has been touching — useful for a quick "what changed recently" sanity check before diving in.

### Safe, real-world uploads
Uploading a real project folder means uploading its `node_modules`, `.git`, and build output too — potentially tens of thousands of irrelevant files. CodeLens filters these out client-side before anything is sent to the backend, so uploads stay fast and the backend never chokes on noise. Every genuine file in your project (code, config, assets, docs) still shows up as a node — nothing is arbitrarily excluded by file type.

---

## How it works

```
┌─────────────┐   upload folder (filtered)    ┌────────────────────┐
│   Frontend   │ ─────────────────────────────▶│  POST /api/analyze  │
│  (Next.js)   │                               └────────────────────┘
│              │                                        │
│              │                          parserService extracts
│              │                          import/require paths per file
│              │                                        │
│              │                          graphService builds
│              │                          { nodes, edges } + caches it
│              │                                        │
│              │ ◀───────────── graph JSON (+ lastModified) ──────┘
│  GraphView   │
│ (d3-force)   │
└──────┬───────┘
       │ click a node
       ▼
┌────────────────────┐        ┌───────────────────────┐
│  GET /api/impact/    │  BFS   │  computeBlastRadius()  │
│      :nodeId         │◀───────│  (graph traversal,     │
└────────────────────┘        │   no AI involved)       │
                               └───────────────────────┘
       │ click "Explain this change"
       ▼
┌─────────────────────┐    only this file's name +     ┌──────────────────────┐
│ POST /api/explain/    │    neighbors + first ~40 ──────▶│  Local Ollama model   │
│      :nodeId          │    lines of code                │  (or NVIDIA backup)   │
└─────────────────────┘                                 └──────────────────────┘
```

### Key design decisions

- **Regex-based import parsing, not a full AST parser.** A real parser (tree-sitter) means native build friction, especially on Windows. A regex that catches `import ... from '...'` and `require('...')` gets the vast majority of real-world code right, with zero install risk.
- **The AI never sees the whole repo.** Every explanation request sends only one file's name, its direct neighbors, and a small code snippet. This keeps the model grounded in facts (no hallucination) and keeps CodeLens usable on large repositories.
- **Blast radius is deterministic, not AI-generated.** It's a breadth-first search over the dependency graph, so "N files depend on this" is always trustworthy.
- **On-device first.** The default AI provider is Ollama, running fully locally — no API key, no code leaving your laptop. A cloud fallback (NVIDIA NIM) exists purely as an emergency backup if Ollama isn't available.
- **Client-side upload filtering.** Ignored directories (`node_modules`, `.git`, `.next`, `dist`, `build`) are stripped out in the browser before the upload even happens, so the backend only ever processes real project files.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, Tailwind CSS |
| Graph rendering | d3-force (force-directed layout), custom pan/zoom SVG |
| Backend | Node.js, Express, Multer |
| AI | Ollama (local inference), OpenAI-compatible NVIDIA NIM (fallback) |

## Project structure

```
CodeLens/
├── backend/
│   ├── server.js                  # Express app, route mounting, health check
│   ├── routes/
│   │   ├── analyze.js             # POST /api/analyze  — upload + build graph
│   │   ├── impact.js              # GET  /api/impact/:nodeId — blast radius
│   │   └── explain.js             # POST /api/explain/:nodeId — AI explanation
│   └── services/
│       ├── parserService.js       # Extracts import/require paths from a file
│       ├── graphService.js        # Builds graph, caches it, BFS for blast radius
│       └── narrationService.js    # Talks to Ollama (or NVIDIA fallback)
└── frontend/
    └── app/
        ├── page.js                 # Top-level state + wiring for the whole flow
        ├── layout.js
        ├── globals.css              # Terminal-themed styling
        └── components/
            ├── UploadRepo.jsx      # Folder-picker with client-side filtering
            ├── GraphView.jsx       # d3-force graph canvas (pan/zoom/click/glow)
            ├── NodeDetailPanel.jsx # Blast-radius facts + last-edited info
            └── ExplainPanel.jsx    # Triggers + displays AI explanation
```

---

## Getting started

### Prerequisites
- Node.js 18+
- [Ollama](https://ollama.com) installed, with a model pulled:
  ```bash
  ollama pull llama3.2:1b
  ```

### 1. Start Ollama
```bash
ollama serve
```

### 2. Start the backend
```bash
cd backend
npm install
npm start          # runs on http://localhost:5000
```

### 3. Start the frontend
```bash
cd frontend
npm install
npm run dev         # runs on http://localhost:3000
```

### 4. Use it
- Open `http://localhost:3000`
- Click **Upload Repository** and select a project folder (or click **Load Demo Graph** to try it instantly, no backend needed)
- Click any node to see its blast radius and when it was last edited
- Click **Explain this change** for a plain-English, locally-generated explanation

---

## Environment variables (`backend/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | Backend port |
| `AI_PROVIDER` | `ollama` | `ollama` (on-device) or `nvidia` (cloud backup) |
| `AI_MODEL` | `llama3.2:1b` | Ollama model name |
| `OLLAMA_BASE_URL` | `http://localhost:11434/v1` | Ollama's OpenAI-compatible endpoint |
| `NVIDIA_API_KEY` | — | Only needed if `AI_PROVIDER=nvidia` |

---

## What's next
- Full-path-aware import resolution (currently resolves by filename, which can occasionally mis-match two files that share a basename in different folders)
- Persisting the graph across backend restarts for multi-session use
- Git-history-aware "last edited" (currently uses the file's OS-level modified timestamp, not commit history)

## Why it matters
Legacy and unfamiliar codebases are one of the biggest sources of wasted developer time and accidental breakage. CodeLens turns "I have no idea what this touches" into a concrete, visual, and instant answer — entirely on-device, with no code ever sent to the cloud.
