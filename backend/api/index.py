"""Vercel Python entrypoint -- exposes the existing FastAPI app.

Deploy this as its own Vercel project with Root Directory set to `backend/`
(separate from the frontend's Vercel project, since they're different
frameworks/runtimes). Vercel auto-detects any file under api/ that exports
an ASGI `app`; see ../vercel.json for the rewrite that sends every path
(not just /api/*) into this function, since main.py defines its own routes
(/health, /api/..., etc.) rather than expecting the Vercel routing layer to
mirror them.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app  # noqa: E402
