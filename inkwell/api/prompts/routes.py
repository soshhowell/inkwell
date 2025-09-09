"""Prompts CRUD endpoints"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from ...database import DatabaseManager
from .models import Prompt, PromptCreate, PromptUpdate

router = APIRouter()


class PromptReorderRequest(BaseModel):
    prompt_ids: List[int]


@router.get("/api/{project_id}/prompts", response_model=List[Prompt])
async def get_prompts(
    project_id: int,
    status: Optional[str] = Query(None, description="Filter by status")
):
    """Get prompts for a specific project (project_id=0 means all projects)"""
    # If project_id is 0, get all prompts
    actual_project_id = None if project_id == 0 else project_id
    prompts = await DatabaseManager.get_prompts(project_id=actual_project_id, status=status)
    return prompts


@router.get("/api/prompts", response_model=List[Prompt])
async def get_prompts_legacy(
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    status: Optional[str] = Query(None, description="Filter by status")
):
    """Legacy endpoint - Get all prompts, optionally filtered by project and status"""
    prompts = await DatabaseManager.get_prompts(project_id=project_id, status=status)
    return prompts


@router.post("/api/{project_id}/prompts", response_model=Prompt)
async def create_prompt_for_project(project_id: int, prompt: PromptCreate):
    """Create a new prompt for a specific project"""
    # Override the project_id from URL if it's not 0 (all projects)
    actual_project_id = prompt.project_id if project_id == 0 else project_id
    created_prompt = await DatabaseManager.create_prompt(
        name=prompt.name,
        status=prompt.status,
        content=prompt.content,
        project_id=actual_project_id
    )
    if not created_prompt:
        raise HTTPException(status_code=500, detail="Failed to create prompt")
    return created_prompt


@router.post("/api/prompts", response_model=Prompt)
async def create_prompt(prompt: PromptCreate):
    """Legacy endpoint - Create a new prompt"""
    created_prompt = await DatabaseManager.create_prompt(
        name=prompt.name,
        status=prompt.status,
        content=prompt.content,
        project_id=prompt.project_id
    )
    if not created_prompt:
        raise HTTPException(status_code=500, detail="Failed to create prompt")
    return created_prompt


@router.get("/api/{project_id}/prompt/{prompt_id}", response_model=Prompt)
async def get_prompt_for_project(project_id: int, prompt_id: int):
    """Get a specific prompt by ID for a project"""
    prompt = await DatabaseManager.get_prompt(prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    # If project_id is not 0 (all projects), verify the prompt belongs to this project
    if project_id != 0 and prompt.get('project_id') != project_id:
        raise HTTPException(status_code=404, detail="Prompt not found in this project")
    
    return prompt


@router.get("/api/prompts/{prompt_id}", response_model=Prompt)
async def get_prompt(prompt_id: int):
    """Legacy endpoint - Get a specific prompt by ID"""
    prompt = await DatabaseManager.get_prompt(prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return prompt


@router.put("/api/{project_id}/prompt/{prompt_id}", response_model=Prompt)
async def update_prompt_for_project(project_id: int, prompt_id: int, prompt_update: PromptUpdate):
    """Update a prompt for a specific project"""
    # Check if prompt exists
    existing_prompt = await DatabaseManager.get_prompt(prompt_id)
    if not existing_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    # If project_id is not 0 (all projects), verify the prompt belongs to this project
    if project_id != 0 and existing_prompt.get('project_id') != project_id:
        raise HTTPException(status_code=404, detail="Prompt not found in this project")
    
    # Update the prompt
    await DatabaseManager.update_prompt(
        prompt_id=prompt_id,
        name=prompt_update.name,
        status=prompt_update.status,
        content=prompt_update.content,
        project_id=prompt_update.project_id,
        order_number=prompt_update.order_number
    )
    
    # Return the updated prompt with project information
    updated_prompt = await DatabaseManager.get_prompt(prompt_id)
    if not updated_prompt:
        raise HTTPException(status_code=500, detail="Failed to retrieve updated prompt")
    
    return updated_prompt


@router.put("/api/prompts/{prompt_id}", response_model=Prompt)
async def update_prompt(prompt_id: int, prompt_update: PromptUpdate):
    """Legacy endpoint - Update a prompt"""
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
        project_id=prompt_update.project_id,
        order_number=prompt_update.order_number
    )
    
    # Return the updated prompt with project information
    updated_prompt = await DatabaseManager.get_prompt(prompt_id)
    if not updated_prompt:
        raise HTTPException(status_code=500, detail="Failed to retrieve updated prompt")
    
    return updated_prompt


@router.delete("/api/{project_id}/prompt/{prompt_id}")
async def delete_prompt_for_project(project_id: int, prompt_id: int):
    """Delete a prompt for a specific project"""
    # Check if prompt exists
    existing_prompt = await DatabaseManager.get_prompt(prompt_id)
    if not existing_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    # If project_id is not 0 (all projects), verify the prompt belongs to this project
    if project_id != 0 and existing_prompt.get('project_id') != project_id:
        raise HTTPException(status_code=404, detail="Prompt not found in this project")
    
    await DatabaseManager.delete_prompt(prompt_id)
    return {"message": "Prompt deleted successfully"}


@router.delete("/api/prompts/{prompt_id}")
async def delete_prompt(prompt_id: int):
    """Legacy endpoint - Delete a prompt"""
    # Check if prompt exists
    existing_prompt = await DatabaseManager.get_prompt(prompt_id)
    if not existing_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    await DatabaseManager.delete_prompt(prompt_id)
    return {"message": "Prompt deleted successfully"}


@router.post("/api/{project_id}/prompts/reorder")
async def reorder_prompts_for_project(project_id: int, request: PromptReorderRequest):
    """Reorder prompts for a specific project by updating their order_number field"""
    try:
        for index, prompt_id in enumerate(request.prompt_ids):
            # Check if prompt exists
            existing_prompt = await DatabaseManager.get_prompt(prompt_id)
            if not existing_prompt:
                raise HTTPException(status_code=404, detail=f"Prompt {prompt_id} not found")
            
            # If project_id is not 0 (all projects), verify the prompt belongs to this project
            if project_id != 0 and existing_prompt.get('project_id') != project_id:
                raise HTTPException(status_code=404, detail=f"Prompt {prompt_id} not found in this project")
            
            # Update the order_number to reflect the new position
            await DatabaseManager.update_prompt(
                prompt_id=prompt_id,
                order_number=index + 1
            )
        
        return {"message": "Prompts reordered successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reorder prompts: {str(e)}")


@router.post("/api/prompts/reorder")
async def reorder_prompts(request: PromptReorderRequest):
    """Legacy endpoint - Reorder prompts by updating their order_number field"""
    try:
        for index, prompt_id in enumerate(request.prompt_ids):
            # Check if prompt exists
            existing_prompt = await DatabaseManager.get_prompt(prompt_id)
            if not existing_prompt:
                raise HTTPException(status_code=404, detail=f"Prompt {prompt_id} not found")
            
            # Update the order_number to reflect the new position
            await DatabaseManager.update_prompt(
                prompt_id=prompt_id,
                order_number=index + 1
            )
        
        return {"message": "Prompts reordered successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reorder prompts: {str(e)}")