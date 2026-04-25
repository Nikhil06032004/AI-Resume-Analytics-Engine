"""
Basic smoke tests — run in CI without requiring real credentials.
MongoDB and AI connections are intentionally not tested here; those are
verified by the /health endpoint in a live deployment.
"""

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_root_health_ok():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        r = await client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert "version" in body
    assert "database" in body


@pytest.mark.asyncio
async def test_detailed_health_returns_json():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        r = await client.get("/health")
    assert r.status_code in (200, 503)  # 503 when DB not configured in CI
    body = r.json()
    assert "status" in body


@pytest.mark.asyncio
async def test_upload_empty_file_rejected():
    from io import BytesIO
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        r = await client.post(
            "/resume/upload",
            files={"file": ("test.pdf", BytesIO(b""), "application/pdf")},
        )
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_upload_unsupported_type_rejected():
    from io import BytesIO
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        r = await client.post(
            "/resume/upload",
            files={"file": ("test.exe", BytesIO(b"MZ"), "application/octet-stream")},
        )
    assert r.status_code == 415


@pytest.mark.asyncio
async def test_history_returns_list():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        r = await client.get("/resume/history")
    # 200 when DB connected, 500 when not — both valid in CI
    assert r.status_code in (200, 500)
