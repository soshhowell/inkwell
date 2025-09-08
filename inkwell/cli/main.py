#!/usr/bin/env python3
"""Inkwell CLI - Command line interface for Inkwell prompt management"""

import asyncio
import click
import aiohttp
import json
from pathlib import Path
from typing import Optional, List, Dict, Any

# Default configuration
DEFAULT_BASE_URL = "http://localhost:7893"
CONFIG_FILE = Path.home() / ".inkwell" / "cli_config.json"


class InkwellConfig:
    """Configuration management for Inkwell CLI"""
    
    def __init__(self):
        self.base_url = DEFAULT_BASE_URL
        self.load_config()
    
    def load_config(self):
        """Load configuration from file"""
        if CONFIG_FILE.exists():
            try:
                with open(CONFIG_FILE) as f:
                    config = json.load(f)
                    self.base_url = config.get('base_url', DEFAULT_BASE_URL)
            except (json.JSONDecodeError, IOError):
                pass  # Use defaults if config is invalid
    
    def save_config(self):
        """Save configuration to file"""
        CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_FILE, 'w') as f:
            json.dump({'base_url': self.base_url}, f, indent=2)


config = InkwellConfig()


class InkwellAPI:
    """API client for Inkwell CLI"""
    
    def __init__(self, base_url: str = None):
        self.base_url = base_url or config.base_url
    
    async def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[Any, Any]:
        """Make HTTP request to Inkwell API"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.request(method, url, **kwargs) as response:
                    if response.status == 404:
                        raise click.ClickException(f"Not found: {endpoint}")
                    elif response.status >= 400:
                        error_text = await response.text()
                        raise click.ClickException(f"API Error {response.status}: {error_text}")
                    
                    return await response.json()
        except aiohttp.ClientError as e:
            raise click.ClickException(f"Connection error: {e}. Is the Inkwell server running at {self.base_url}?")
    
    async def get_projects(self) -> List[Dict[Any, Any]]:
        """Get all projects"""
        return await self._make_request("GET", "/api/projects")
    
    async def get_prompts(self, project_id: Optional[int] = None, status: Optional[str] = None) -> List[Dict[Any, Any]]:
        """Get prompts, optionally filtered by project and status"""
        params = {}
        if project_id is not None:
            params['project_id'] = project_id
        if status is not None:
            params['status'] = status
        
        return await self._make_request("GET", "/api/prompts", params=params)
    
    async def get_prompt(self, prompt_id: int) -> Dict[Any, Any]:
        """Get a specific prompt by ID"""
        return await self._make_request("GET", f"/api/prompts/{prompt_id}")
    
    async def update_prompt_status(self, prompt_id: int, status: str) -> Dict[Any, Any]:
        """Update prompt status"""
        data = {"status": status}
        return await self._make_request("PUT", f"/api/prompts/{prompt_id}", json=data)


def run_async(coro):
    """Run an async coroutine in a sync context"""
    return asyncio.run(coro)


@click.group()
@click.option('--base-url', help='Inkwell server base URL')
@click.option('--config', 'config_flag', is_flag=True, help='Show current configuration')
@click.pass_context
def cli(ctx, base_url, config_flag):
    """Inkwell CLI - Command line interface for prompt management
    
    Interact with your Inkwell server from the command line to manage
    projects and prompts efficiently.
    
    Examples:
      inkwell-cli projects list
      inkwell-cli prompts list --status=draft
      inkwell-cli prompts get 123
      inkwell-cli prompts set-status 123 active
    """
    if config_flag:
        click.echo(f"Current configuration:")
        click.echo(f"  Base URL: {config.base_url}")
        click.echo(f"  Config file: {CONFIG_FILE}")
        ctx.exit()
    
    if base_url:
        config.base_url = base_url
        config.save_config()
        click.echo(f"Updated base URL to: {base_url}")
    
    ctx.ensure_object(dict)
    ctx.obj['api'] = InkwellAPI()


@cli.group()
def projects():
    """Project management commands"""
    pass


@cli.group()
def prompts():
    """Prompt management commands"""
    pass


@projects.command('list')
@click.option('--format', 'output_format', default='table', type=click.Choice(['table', 'json']), 
              help='Output format')
@click.pass_context
def projects_list(ctx, output_format):
    """List all projects
    
    Shows all available projects in your Inkwell instance.
    
    Examples:
      inkwell-cli projects list
      inkwell-cli projects list --format=json
    """
    async def _list_projects():
        api = ctx.obj['api']
        projects = await api.get_projects()
        
        if output_format == 'json':
            click.echo(json.dumps(projects, indent=2))
        else:
            if not projects:
                click.echo("No projects found.")
                return
            
            # Table format
            click.echo(f"{'ID':<4} {'Name':<30} {'Created':<20}")
            click.echo("-" * 54)
            for project in projects:
                created = project['created_at'][:10]  # Just the date part
                click.echo(f"{project['id']:<4} {project['name']:<30} {created:<20}")
    
    run_async(_list_projects())


@prompts.command('list')
@click.option('--project', 'project_id', type=int, help='Filter by project ID')
@click.option('--status', default='draft', help='Filter by status (default: draft)')
@click.option('--format', 'output_format', default='table', type=click.Choice(['table', 'json']), 
              help='Output format')
@click.option('--all-status', is_flag=True, help='Show prompts with all statuses')
@click.pass_context
def prompts_list(ctx, project_id, status, output_format, all_status):
    """List prompts
    
    Shows prompts, by default filtered to 'draft' status only.
    Use --all-status to see prompts with any status.
    
    Examples:
      inkwell-cli prompts list
      inkwell-cli prompts list --status=active
      inkwell-cli prompts list --all-status
      inkwell-cli prompts list --project=1
      inkwell-cli prompts list --format=json
    """
    async def _list_prompts():
        api = ctx.obj['api']
        
        # If all-status is set, don't filter by status
        status_filter = None if all_status else status
        
        prompts = await api.get_prompts(project_id=project_id, status=status_filter)
        
        if output_format == 'json':
            click.echo(json.dumps(prompts, indent=2))
        else:
            if not prompts:
                filter_desc = f"status='{status_filter}'" if status_filter else "any status"
                if project_id:
                    filter_desc += f", project={project_id}"
                click.echo(f"No prompts found with {filter_desc}.")
                return
            
            # Table format - show name only as requested
            click.echo(f"{'ID':<4} {'Name':<40} {'Status':<10} {'Project':<20}")
            click.echo("-" * 74)
            for prompt in prompts:
                project_name = prompt.get('project_name', 'None')
                click.echo(f"{prompt['id']:<4} {prompt['name']:<40} {prompt['status']:<10} {project_name:<20}")
    
    run_async(_list_prompts())


@prompts.command('get')
@click.argument('prompt_id', type=int)
@click.option('--format', 'output_format', default='detailed', type=click.Choice(['detailed', 'json']), 
              help='Output format')
@click.pass_context
def prompts_get(ctx, prompt_id, output_format):
    """Get a specific prompt by ID
    
    Retrieves and displays detailed information about a prompt.
    
    Examples:
      inkwell-cli prompts get 123
      inkwell-cli prompts get 123 --format=json
    """
    async def _get_prompt():
        api = ctx.obj['api']
        prompt = await api.get_prompt(prompt_id)
        
        if output_format == 'json':
            click.echo(json.dumps(prompt, indent=2))
        else:
            # Detailed format
            click.echo(f"Prompt Details:")
            click.echo(f"  ID: {prompt['id']}")
            click.echo(f"  Name: {prompt['name']}")
            click.echo(f"  Status: {prompt['status']}")
            click.echo(f"  Project: {prompt.get('project_name', 'None')} (ID: {prompt.get('project_id', 'None')})")
            click.echo(f"  Created: {prompt['created_at']}")
            click.echo(f"  Updated: {prompt['updated_at']}")
            
            if prompt.get('content'):
                click.echo(f"  Content:")
                click.echo(f"    {prompt['content'][:200]}{'...' if len(prompt['content']) > 200 else ''}")
            else:
                click.echo(f"  Content: (empty)")
    
    run_async(_get_prompt())


@prompts.command('set-status')
@click.argument('prompt_id', type=int)
@click.argument('status', type=click.Choice(['draft', 'active', 'archived']))
@click.option('--format', 'output_format', default='detailed', type=click.Choice(['detailed', 'json']), 
              help='Output format')
@click.pass_context
def prompts_set_status(ctx, prompt_id, status, output_format):
    """Set prompt status
    
    Updates the status of a specific prompt.
    
    Valid statuses: draft, active, archived
    
    Examples:
      inkwell-cli prompts set-status 123 active
      inkwell-cli prompts set-status 123 archived
    """
    async def _set_status():
        api = ctx.obj['api']
        prompt = await api.update_prompt_status(prompt_id, status)
        
        if output_format == 'json':
            click.echo(json.dumps(prompt, indent=2))
        else:
            click.echo(f"✓ Updated prompt {prompt_id} status to '{status}'")
            click.echo(f"  Name: {prompt['name']}")
            click.echo(f"  Project: {prompt.get('project_name', 'None')}")
    
    run_async(_set_status())


if __name__ == '__main__':
    cli()