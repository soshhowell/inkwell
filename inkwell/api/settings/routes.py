"""Settings endpoints"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ...database import DatabaseManager

router = APIRouter()


class Setting(BaseModel):
    key: str
    value: str


@router.get("/api/settings/{key}")
async def get_setting(key: str):
    """Get a setting by key"""
    value = await DatabaseManager.get_setting(key)
    if value is None:
        raise HTTPException(status_code=404, detail="Setting not found")
    return {"key": key, "value": value}


@router.post("/api/settings")
async def set_setting(setting: Setting):
    """Set a setting"""
    await DatabaseManager.set_setting(setting.key, setting.value)
    return {"message": "Setting updated successfully"}