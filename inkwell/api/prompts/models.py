"""Pydantic models for prompts endpoints"""

from typing import Optional
from pydantic import BaseModel


class PromptCreate(BaseModel):
    name: str
    status: str = 'draft'
    content: Optional[str] = None
    project_id: Optional[int] = None


class PromptUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    content: Optional[str] = None
    project_id: Optional[int] = None
    order_number: Optional[int] = None


class Prompt(BaseModel):
    id: int
    name: str
    status: str
    content: Optional[str] = None
    project_id: Optional[int] = None
    project_name: Optional[str] = None
    order_number: int = 0
    created_at: str
    updated_at: str