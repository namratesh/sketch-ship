"""Optional S3-compatible object storage backend (e.g. Cloudflare R2).

Local dev / docker-compose never sets these env vars, so storage.py falls
back to plain local disk there -- this module only takes over on a real
deployment (Vercel) where the filesystem is ephemeral and not shared
between invocations, so db.json and uploaded images have to live somewhere
persistent and publicly fetchable instead.

Uses boto3's S3 client against any S3-compatible endpoint rather than
Vercel Blob's own SDK, because Vercel Blob has no documented REST API and
no official Python client -- boto3 + a real S3-compatible bucket (Cloudflare
R2 recommended) is the well-supported path from Python.
"""
from __future__ import annotations

import os
from functools import lru_cache
from typing import Any


def enabled() -> bool:
    return all(
        os.environ.get(var)
        for var in ("S3_BUCKET", "S3_ENDPOINT_URL", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY")
    )


@lru_cache(maxsize=1)
def _client() -> Any:
    import boto3

    return boto3.client(
        "s3",
        endpoint_url=os.environ["S3_ENDPOINT_URL"],
        aws_access_key_id=os.environ["S3_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["S3_SECRET_ACCESS_KEY"],
    )


def _bucket() -> str:
    return os.environ["S3_BUCKET"]


def _public_url(key: str) -> str:
    base = os.environ.get("S3_PUBLIC_BASE_URL")
    if base:
        return f"{base.rstrip('/')}/{key}"
    return f"{os.environ['S3_ENDPOINT_URL'].rstrip('/')}/{_bucket()}/{key}"


def get_bytes(key: str) -> bytes | None:
    from botocore.exceptions import ClientError

    try:
        resp = _client().get_object(Bucket=_bucket(), Key=key)
        return resp["Body"].read()
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") in ("NoSuchKey", "404"):
            return None
        raise


def put_bytes(key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
    _client().put_object(Bucket=_bucket(), Key=key, Body=data, ContentType=content_type)
    return _public_url(key)


def exists(key: str) -> bool:
    from botocore.exceptions import ClientError

    try:
        _client().head_object(Bucket=_bucket(), Key=key)
        return True
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") in ("404", "NoSuchKey"):
            return False
        raise
