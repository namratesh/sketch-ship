# GhostTrace

Automated leak detection + DMCA takedown filing for creators. Built for a 3-hour hackathon (Track 3: Life Admin — Legal & Compliance Assistance).

See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for the full architecture, API contract, and Gemini vision integration details.

## Run it (one command)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API + docs: http://localhost:8000/docs

Requires `backend/.env` with a `GOOGLE_API_KEY` (Google AI Studio key) — already present locally; use `backend/.env.example` as a template elsewhere.

## Deploying to Vercel

Vercel doesn't run `docker-compose` or persistent disks, so deploy as **two separate Vercel projects** from this repo:

- **Backend**: new Vercel project, Root Directory = `backend`. Vercel auto-detects the Python function at `backend/api/index.py`; `backend/vercel.json` routes all paths into it. Set env vars: `GOOGLE_API_KEY`, `SERPAPI_KEY`, `S3_BUCKET`, `S3_ENDPOINT_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL` (see `backend/.env.example`), and `ALLOWED_ORIGINS` set to the frontend project's URL once you have it.
- **Frontend**: new Vercel project, Root Directory = `frontend` (Vite auto-detected). Set `VITE_API_URL` to the backend project's URL.

The `S3_*` vars are required in production — without them the backend falls back to local disk, which doesn't persist across Vercel invocations (uploads/incidents would silently vanish). Any S3-compatible bucket works; Cloudflare R2's free tier is a good fit.
