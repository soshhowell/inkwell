"""API routes for projects management"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from ...database import DatabaseManager
from .models import Project, ProjectCreate, ProjectUpdate

router = APIRouter()


class WhiteboardUpdate(BaseModel):
    whiteboard: str


@router.get("/api/projects", response_model=List[Project])
async def get_projects():
    """Get all projects"""
    try:
        projects = await DatabaseManager.get_projects()
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/projects/{project_id}", response_model=Project)
async def get_project(project_id: int):
    """Get a specific project by ID"""
    try:
        project = await DatabaseManager.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/projects", response_model=Project)
async def create_project(project: ProjectCreate):
    """Create a new project"""
    try:
        created_project = await DatabaseManager.create_project(project.name)
        if not created_project:
            raise HTTPException(status_code=500, detail="Failed to create project")
        return created_project
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/api/projects/{project_id}", response_model=Project)
async def update_project(project_id: int, project: ProjectUpdate):
    """Update a project"""
    try:
        # Check if project exists
        existing_project = await DatabaseManager.get_project(project_id)
        if not existing_project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Update the project
        await DatabaseManager.update_project(project_id, project.name, project.whiteboard)
        
        # Return the updated project
        updated_project = await DatabaseManager.get_project(project_id)
        return updated_project
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/api/projects/{project_id}")
async def delete_project(project_id: int):
    """Delete a project (prompts will be reassigned to Default project)"""
    try:
        # Check if project exists
        existing_project = await DatabaseManager.get_project(project_id)
        if not existing_project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Don't allow deleting the Default project
        if existing_project["name"] == "Default":
            raise HTTPException(status_code=400, detail="Cannot delete the Default project")
        
        await DatabaseManager.delete_project(project_id)
        return {"message": "Project deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/api/projects/{project_id}/whiteboard", response_model=Project)
async def update_project_whiteboard(project_id: int, whiteboard_data: WhiteboardUpdate):
    """Update only the whiteboard content of a project"""
    try:
        # Check if project exists
        existing_project = await DatabaseManager.get_project(project_id)
        if not existing_project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Update only the whiteboard
        await DatabaseManager.update_project(project_id, whiteboard=whiteboard_data.whiteboard)
        
        # Return the updated project
        updated_project = await DatabaseManager.get_project(project_id)
        return updated_project
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))