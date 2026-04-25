"""
MongoDB connection via Motor (async driver).
Exposes the analysis collection and a GridFS bucket for raw file storage.
"""

from __future__ import annotations

from typing import Optional

from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorCollection,
    AsyncIOMotorGridFSBucket,
)

from app.config import settings

_client: Optional[AsyncIOMotorClient] = None


def _get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        uri = settings.mongodb_uri
        if not uri:
            raise RuntimeError("MONGODB_URI is not set. Add it to backend/.env")
        _client = AsyncIOMotorClient(uri)
    return _client


def get_db():
    """Return the 'resume_analyzer' database handle."""
    return _get_client()["resume_analyzer"]


def resumes_col() -> AsyncIOMotorCollection:
    """Return the 'resumes' collection (analysis documents)."""
    return get_db()["resumes"]


def get_gridfs_bucket() -> AsyncIOMotorGridFSBucket:
    """
    Return the GridFS bucket used to store raw resume files.
    Bucket name: 'resume_files'  →  collections: resume_files.files + resume_files.chunks
    """
    return AsyncIOMotorGridFSBucket(get_db(), bucket_name="resume_files")


async def ping() -> bool:
    """Return True if MongoDB is reachable."""
    try:
        await _get_client().admin.command("ping")
        return True
    except Exception:
        return False
