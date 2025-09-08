"""Prompts CRUD endpoints"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from ...database import DatabaseManager
from .models import Prompt, PromptCreate, PromptUpdate

router = APIRouter()


@router.get("/api/prompts", response_model=List[Prompt])
async def get_prompts(
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    status: Optional[str] = Query(None, description="Filter by status")
):
    """Get all prompts, optionally filtered by project and status"""
    prompts = await DatabaseManager.get_prompts(project_id=project_id, status=status)
    return prompts


@router.post("/api/prompts", response_model=Prompt)
async def create_prompt(prompt: PromptCreate):
    """Create a new prompt"""
    created_prompt = await DatabaseManager.create_prompt(
        name=prompt.name,
        status=prompt.status,
        content=prompt.content,
        project_id=prompt.project_id
    )
    if not created_prompt:
        raise HTTPException(status_code=500, detail="Failed to create prompt")
    return created_prompt


@router.get("/api/prompts/{prompt_id}", response_model=Prompt)
async def get_prompt(prompt_id: int):
    """Get a specific prompt by ID"""
    prompt = await DatabaseManager.get_prompt(prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return prompt


@router.put("/api/prompts/{prompt_id}", response_model=Prompt)
async def update_prompt(prompt_id: int, prompt_update: PromptUpdate):
    """Update a prompt"""
    # Check if prompt exists
    existing_prompt = await DatabaseManager.get_prompt(prompt_id)
    if not existing_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    # Update the prompt
    await DatabaseManager.update_prompt(
        prompt_id=prompt_id,
        name=prompt_update.name,
        status=prompt_update.status,
        content=prompt_update.content,
        project_id=prompt_update.project_id
    )
    
    # Return the updated prompt with project information
    updated_prompt = await DatabaseManager.get_prompt(prompt_id)
    if not updated_prompt:
        raise HTTPException(status_code=500, detail="Failed to retrieve updated prompt")
    
    return updated_prompt


@router.delete("/api/prompts/{prompt_id}")
async def delete_prompt(prompt_id: int):
    """Delete a prompt"""
    # Check if prompt exists
    existing_prompt = await DatabaseManager.get_prompt(prompt_id)
    if not existing_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    await DatabaseManager.delete_prompt(prompt_id)
    return {"message": "Prompt deleted successfully"}