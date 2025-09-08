"""Pydantic models for projects endpoints"""

from typing import Optional
from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    whiteboard: Optional[str] = None


class Project(BaseModel):
    id: int
    name: str
    whiteboard: str = ""
    created_at: str
    updated_at: str