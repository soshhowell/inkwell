"""Users endpoint - testing auto-discovery"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/api/users")
async def get_users():
    """Get all users - demo endpoint"""
    return [
        {"id": 1, "name": "Alice", "email": "alice@example.com"},
        {"id": 2, "name": "Bob", "email": "bob@example.com"}
    ]


@router.get("/api/users/{user_id}")
async def get_user(user_id: int):
    """Get a specific user by ID - demo endpoint"""
    return {"id": user_id, "name": f"User {user_id}", "email": f"user{user_id}@example.com"}