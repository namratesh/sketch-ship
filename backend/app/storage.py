"""Tiny JSON-file "database" for GhostTrace.

No real DB for a 3-hour hackathon build — a single JSON file, guarded by an
in-process lock so concurrent requests don't corrupt it. Locally this file
(and uploaded images) live on disk. On a real deployment (Vercel) there's no
persistent/shared disk, so when S3-compatible env vars are configured (see
object_storage.py) the same JSON-file model is backed by object storage
instead -- read the whole thing, write the whole thing, same as today.
"""
from __future__ import annotations

import json
import os
import threading
from typing import Any, Literal

from .services import object_storage

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # backend/
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "db.json")
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
SEED_LEAKS_DIR = os.path.join(DATA_DIR, "seed_leaks")
# sidecar metadata for generated seed leaks (platform tag + fake leak url per
# leak image) -- lives alongside db.json rather than inside seed_leaks/ so it
# never gets served by the static files mount.
SEED_LEAKS_META_PATH = os.path.join(DATA_DIR, "seed_leaks_meta.json")

_lock = threading.Lock()

EMPTY_DB: dict[str, Any] = {
    "profile": None,
    "assets": [],
    "incidents": [],
    "takedowns": [],
    "activity": [],
}


def db_exists() -> bool:
    if object_storage.enabled():
        return object_storage.exists("db.json")
    return os.path.exists(DB_PATH)


def ensure_dirs() -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    os.makedirs(SEED_LEAKS_DIR, exist_ok=True)


def init_db_if_missing() -> None:
    ensure_dirs()
    if not db_exists():
        write_db(dict(EMPTY_DB))


def read_db() -> dict[str, Any]:
    with _lock:
        if object_storage.enabled():
            raw = object_storage.get_bytes("db.json")
            if raw is None:
                write_db_unlocked(dict(EMPTY_DB))
                return dict(EMPTY_DB)
            return json.loads(raw)
        if not db_exists():
            ensure_dirs()
            write_db_unlocked(dict(EMPTY_DB))
        with open(DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)


def write_db_unlocked(data: dict[str, Any]) -> None:
    if object_storage.enabled():
        object_storage.put_bytes(
            "db.json", json.dumps(data, indent=2, default=str).encode("utf-8"), "application/json"
        )
        return
    ensure_dirs()
    tmp_path = DB_PATH + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)
    os.replace(tmp_path, DB_PATH)


def write_db(data: dict[str, Any]) -> None:
    with _lock:
        write_db_unlocked(data)


def read_seed_leaks_meta() -> list[dict[str, Any]]:
    if object_storage.enabled():
        raw = object_storage.get_bytes("seed_leaks_meta.json")
        return json.loads(raw) if raw is not None else []
    if not os.path.exists(SEED_LEAKS_META_PATH):
        return []
    with open(SEED_LEAKS_META_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def append_seed_leak(entry: dict[str, Any]) -> None:
    with _lock:
        existing = read_seed_leaks_meta()
        existing.append(entry)
        if object_storage.enabled():
            object_storage.put_bytes(
                "seed_leaks_meta.json", json.dumps(existing, indent=2).encode("utf-8"), "application/json"
            )
            return
        tmp_path = SEED_LEAKS_META_PATH + ".tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2)
        os.replace(tmp_path, SEED_LEAKS_META_PATH)


ImageKind = Literal["uploads", "seed_leaks"]


def _local_dir_for(kind: ImageKind) -> str:
    return UPLOADS_DIR if kind == "uploads" else SEED_LEAKS_DIR


def write_image_bytes(kind: ImageKind, filename: str, data: bytes, content_type: str = "image/png") -> str:
    """Persists an image and returns the value to store as its `path`/
    `leak_image_path` -- a local `/uploads/...`-style path in local-disk
    mode, or an already-public object storage URL when configured."""
    if object_storage.enabled():
        return object_storage.put_bytes(f"{kind}/{filename}", data, content_type)
    ensure_dirs()
    with open(os.path.join(_local_dir_for(kind), filename), "wb") as f:
        f.write(data)
    return f"/{kind}/{filename}"


def read_image_bytes(kind: ImageKind, filename: str) -> bytes | None:
    if object_storage.enabled():
        return object_storage.get_bytes(f"{kind}/{filename}")
    path = os.path.join(_local_dir_for(kind), filename)
    if not os.path.exists(path):
        return None
    with open(path, "rb") as f:
        return f.read()
