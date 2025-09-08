"""Auto-discovery system for API endpoints"""

import importlib
import pkgutil
from pathlib import Path
from typing import List
from fastapi import APIRouter, FastAPI


def discover_and_register_routers(app: FastAPI) -> None:
    """
    Automatically discover and register all API routers from subdirectories.
    
    Each subdirectory in the api package should contain a routes.py file
    that exports a router variable (APIRouter instance).
    """
    api_path = Path(__file__).parent
    
    # Find all subdirectories in the api package
    for item in api_path.iterdir():
        if item.is_dir() and not item.name.startswith('_'):
            module_name = item.name
            routes_file = item / 'routes.py'
            
            if routes_file.exists():
                try:
                    # Import the routes module dynamically
                    routes_module_path = f"inkwell.api.{module_name}.routes"
                    routes_module = importlib.import_module(routes_module_path)
                    
                    # Look for a router variable in the module
                    if hasattr(routes_module, 'router'):
                        router = getattr(routes_module, 'router')
                        if isinstance(router, APIRouter):
                            # Register the router with the app
                            app.include_router(router)
                            print(f"✅ Registered API router: {module_name}")
                        else:
                            print(f"⚠️  Warning: {module_name}/routes.py has 'router' but it's not an APIRouter")
                    else:
                        print(f"⚠️  Warning: {module_name}/routes.py doesn't export a 'router' variable")
                        
                except ImportError as e:
                    print(f"❌ Error importing {module_name}/routes.py: {e}")
                except Exception as e:
                    print(f"❌ Error registering router from {module_name}: {e}")


def get_all_routers() -> List[APIRouter]:
    """
    Get all discovered API routers.
    This is an alternative approach that returns routers instead of registering them.
    """
    routers = []
    api_path = Path(__file__).parent
    
    for item in api_path.iterdir():
        if item.is_dir() and not item.name.startswith('_'):
            module_name = item.name
            routes_file = item / 'routes.py'
            
            if routes_file.exists():
                try:
                    routes_module_path = f"inkwell.api.{module_name}.routes"
                    routes_module = importlib.import_module(routes_module_path)
                    
                    if hasattr(routes_module, 'router'):
                        router = getattr(routes_module, 'router')
                        if isinstance(router, APIRouter):
                            routers.append(router)
                            
                except (ImportError, AttributeError) as e:
                    print(f"❌ Error loading router from {module_name}: {e}")
    
    return routers