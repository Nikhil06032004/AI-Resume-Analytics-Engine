"""
Rate limiter — shared singleton used by all routers.

Usage in a router:
    from fastapi import Request
    from app.limiter import limiter

    @router.post("/analyze")
    @limiter.limit("10/minute")
    async def my_endpoint(request: Request, ...):
        ...

The limiter is attached to app.state in main.py so slowapi's exception
handler can read it.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200/hour"],
)
