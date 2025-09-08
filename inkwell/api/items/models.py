"""Pydantic models for items endpoints"""

from typing import Optional
from pydantic import BaseModel


class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class Item(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: str
    updated_at: str