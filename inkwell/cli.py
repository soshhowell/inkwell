"""Command line interface for Inkwell"""

import os
import sys
import subprocess
import webbrowser
from pathlib import Path
import click
import uvicorn
from .config import config
from .database import init_database


@click.group()
@click.version_option()
def main():
    """Inkwell - A local React website with FastAPI backend"""
    pass


@main.command()
@click.option('--dev', is_flag=True, help='Start in development mode')
@click.option('--no-browser', is_flag=True, help='Don\'t open browser automatically')
def start(dev, no_browser):
    """Start the Inkwell application"""
    click.echo("Starting Inkwell...")
    
    # Initialize database
    init_database()
    
    # Get the package directory to find frontend files
    package_dir = Path(__file__).parent
    frontend_build_dir = package_dir / "frontend" / "build"
    
    if dev:
        click.echo(f"Development mode - Frontend will be available at {config.frontend_dev_url}")
        click.echo(f"Backend API will be available at {config.backend_url}")
        
        # Check if frontend build exists, if not suggest running build script
        if not frontend_build_dir.exists():
            click.echo("Frontend build not found. You may need to run the build script first.")
        
        if not no_browser:
            # Open the development frontend URL
            webbrowser.open(config.frontend_dev_url)
    else:
        click.echo(f"Production mode - Application will be available at {config.backend_url}")
        
        # Check if frontend build exists
        if not frontend_build_dir.exists():
            click.echo("Error: Frontend build not found. Please run the build script first.")
            click.echo("Try running: ./build.sh")
            sys.exit(1)
        
        if not no_browser:
            # Open the production URL (served by FastAPI)
            webbrowser.open(config.backend_url)
    
    # Start the FastAPI server
    from .server import app
    uvicorn.run(
        "inkwell.server:app",
        host=config.host,
        port=config.backend_port,
        reload=dev,
        access_log=dev
    )


@main.command()
def status():
    """Show Inkwell application status"""
    click.echo("Inkwell Status:")
    click.echo(f"  Config directory: {config.inkwell_dir}")
    click.echo(f"  Database: {config.database_path}")
    click.echo(f"  Backend URL: {config.backend_url}")
    click.echo(f"  Frontend Dev URL: {config.frontend_dev_url}")
    
    # Check if config directory exists
    if config.inkwell_dir.exists():
        click.echo("  ✓ Configuration directory exists")
    else:
        click.echo("  ✗ Configuration directory missing")
    
    # Check if database exists
    if config.database_path.exists():
        click.echo("  ✓ Database exists")
    else:
        click.echo("  ✗ Database not initialized")


@main.command()
def init():
    """Initialize Inkwell configuration and database"""
    click.echo("Initializing Inkwell...")
    
    # Create config directory
    config.ensure_inkwell_directory()
    click.echo(f"Created configuration directory: {config.inkwell_dir}")
    
    # Initialize database
    init_database()
    click.echo("Database initialized successfully")
    
    click.echo("Inkwell initialization complete!")


if __name__ == '__main__':
    main()