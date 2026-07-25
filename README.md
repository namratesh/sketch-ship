# GhostTrace

Automated leak detection + DMCA takedown filing for creators. Built for a 3-hour hackathon (Track 3: Life Admin — Legal & Compliance Assistance).

*"Every creator has had their work stolen. GhostTrace fingerprints your content, uses Gemini vision (plus a real Google Lens reverse-image search) to spot leaked/re-uploaded copies across platforms, and one click — the Nuke button — files a complete DMCA takedown everywhere at once."*

See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for the original architecture/design doc this was built from (API contract, Gemini prompts, data model). The sections below describe what's actually in the repo today, which has grown a bit past that doc — notably real reverse-image search via SerpApi and S3-compatible object storage for deployment.

## What it does

1. **Upload** a piece of content (`POST /api/assets`) — GhostTrace hashes it (SHA-256) and asks Gemini vision to describe it as a "fingerprint" (subject, colors, distinguishing features). It also auto-generates one synthetic "leaked" variant of your upload so a scan has something of yours to find.
2. **Scan** for leaks two ways:
   - `POST /api/scan` — compares every uploaded asset against a pool of pre-seeded/synthetic "leaked" images using Gemini vision, scores similarity 0–100, and creates an `Incident` at score ≥ 60. This is the always-available demo path (`source: "SYNTHETIC"`).
   - `POST /api/assets/{id}/web-scan` — a **real** reverse-image search against the public web via SerpApi's Google Lens engine (`source: "SERPAPI"`). Requires `SERPAPI_KEY` and a publicly reachable asset URL (see Environment variables below); no-ops safely if not configured.
3. **Incident Room** (`/incidents/:id`) — original vs. leaked image side by side, similarity score + Gemini's reasoning, and a live DMCA notice preview per platform (YouTube, X, Instagram, or the platform the real leak was actually found on).
4. **Nuke** (`POST /api/incidents/{id}/nuke`) — generates and "files" a DMCA notice on every platform in one call, flips the incident to `FILED`, and logs it all to the activity feed.
5. **Activity log** (`/activity`) — full audit trail of uploads, scans, detections, and filings, newest first.

There's a lightweight client-side login gate (`frontend/src/pages/Login.tsx`) backed by a `localStorage` flag — not real auth, just a demo-friendly gate in front of the onboarding flow.

## Run it (one command)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API + docs: http://localhost:8000/docs

Requires `backend/.env` with at least `GOOGLE_API_KEY` (Google AI Studio key). Copy `backend/.env.example` → `backend/.env` and fill in what you have; everything except `GOOGLE_API_KEY` is optional and fails soft.

## Environment variables

See `backend/.env.example` and `frontend/.env.example` for the full annotated list. Summary:

| Var | Required? | Purpose |
|---|---|---|
| `GOOGLE_API_KEY` | Yes | Gemini vision calls (asset fingerprinting, leak comparison, DMCA text generation) |
| `SERPAPI_KEY` | No | Enables real reverse-image `web-scan`; without it that endpoint is a no-op |
| `PUBLIC_BASE_URL` | No (local disk mode only) | Public URL for this backend so SerpApi can fetch your uploaded images — use an `ngrok http 8000` tunnel locally |
| `S3_BUCKET`, `S3_ENDPOINT_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL` | No (required in production/Vercel) | Switch `db.json` + uploaded images from local disk to an S3-compatible bucket (Cloudflare R2 recommended) |
| `ALLOWED_ORIGINS` | No | Extra CORS origins beyond `localhost:5173` (e.g. the deployed frontend URL) |
| `VITE_API_URL` (frontend) | Yes | Base URL the frontend calls for the backend API |

## Tech stack

- **Backend**: Python 3.11, FastAPI + Uvicorn, Pydantic, `google-genai` (Gemini), `boto3` (S3/R2), Pillow. Storage is a single `backend/data/db.json` file plus local disk (or S3 in production) — no real database.
- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS 4, React Router 7, `lucide-react` icons.
- **Containerization**: Docker + docker-compose for one-command local run.

## Deploying to Vercel

Vercel doesn't run `docker-compose` or persistent disks, so deploy as **two separate Vercel projects** from this repo:

- **Backend**: new Vercel project, Root Directory = `backend`. Vercel auto-detects the Python function at `backend/api/index.py`; `backend/vercel.json` routes all paths into it. Set env vars: `GOOGLE_API_KEY`, `SERPAPI_KEY`, `S3_BUCKET`, `S3_ENDPOINT_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL` (see `backend/.env.example`), and `ALLOWED_ORIGINS` set to the frontend project's URL once you have it.
- **Frontend**: new Vercel project, Root Directory = `frontend` (Vite auto-detected). Set `VITE_API_URL` to the backend project's URL.

The `S3_*` vars are required in production — without them the backend falls back to local disk, which doesn't persist across Vercel invocations (uploads/incidents would silently vanish). Any S3-compatible bucket works; Cloudflare R2's free tier is a good fit.

## Repo layout

```
sketch-ship/
├── IMPLEMENTATION.md          # original design doc (architecture, prompts, API contract)
├── README.md                  # this file
├── docker-compose.yml
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, static mounts, router includes
│   │   ├── models.py          # Pydantic models
│   │   ├── storage.py         # db.json + local disk / S3 read-write helpers
│   │   ├── seed.py            # synthetic demo assets + leak generation
│   │   ├── routes/            # profile, assets, incidents, dashboard, activity
│   │   └── services/
│   │       ├── gemini_client.py
│   │       ├── gemini_vision.py        # fingerprinting + image comparison
│   │       ├── serpapi_web_detection.py # real Google Lens reverse-image search
│   │       ├── object_storage.py       # S3/R2 client
│   │       ├── platform_templates.py   # YouTube / X / Instagram DMCA field templates
│   │       └── dmca.py                 # DMCA notice text generation
│   └── data/                  # db.json, uploads/, seed_leaks/ (runtime state)
└── frontend/
    └── src/
        ├── App.tsx             # routes + login gate + profile-driven onboarding redirect
        ├── lib/api.ts
        ├── pages/              # Login, Onboarding, Dashboard, Assets, Incidents, IncidentRoom, Activity
        └── components/         # NavBar, StatCard, NukeButton, DmcaPreview, ScoreRing, PlatformFlipCard, ...
```
