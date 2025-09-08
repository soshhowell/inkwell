"""Items CRUD endpoints"""

from typing import List
from fastapi import APIRouter, HTTPException

from ...database import DatabaseManager
from .models import Item, ItemCreate, ItemUpdate

router = APIRouter()


@router.get("/api/items", response_model=List[Item])
async def get_items():
    """Get all items"""
    items = await DatabaseManager.get_items()
    return items


@router.post("/api/items", response_model=Item)
async def create_item(item: ItemCreate):
    """Create a new item"""
    created_item = await DatabaseManager.create_item(
        name=item.name,
        description=item.description
    )
    if not created_item:
        raise HTTPException(status_code=500, detail="Failed to create item")
    return created_item


@router.get("/api/items/{item_id}", response_model=Item)
async def get_item(item_id: int):
    """Get a specific item by ID"""
    item = await DatabaseManager.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.put("/api/items/{item_id}", response_model=dict)
async def update_item(item_id: int, item_update: ItemUpdate):
    """Update an item"""
    # Check if item exists
    existing_item = await DatabaseManager.get_item(item_id)
    if not existing_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Update the item
    await DatabaseManager.update_item(
        item_id=item_id,
        name=item_update.name,
        description=item_update.description
    )
    
    return {"message": "Item updated successfully"}


@router.delete("/api/items/{item_id}")
async def delete_item(item_id: int):
    """Delete an item"""
    # Check if item exists
    existing_item = await DatabaseManager.get_item(item_id)
    if not existing_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    await DatabaseManager.delete_item(item_id)
    return {"message": "Item deleted successfully"}