"""SQLite database management for Inkwell"""

import sqlite3
import aiosqlite
from pathlib import Path
from .config import config


def init_database():
    """Initialize the SQLite database with required tables"""
    # Ensure parent directory exists
    db_path = Path(config.database_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(config.database_path)
    cursor = conn.cursor()
    
    # Create example table - you can modify this based on your needs
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create projects table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            whiteboard TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Insert default project if not exists
    cursor.execute('''
        INSERT OR IGNORE INTO projects (name) VALUES ('Default')
    ''')
    
    # Add whiteboard column to existing projects table (migration)
    try:
        cursor.execute("ALTER TABLE projects ADD COLUMN whiteboard TEXT DEFAULT ''")
    except sqlite3.OperationalError:
        # Column already exists, ignore
        pass
    
    # Create prompts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prompts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'draft',
            content TEXT,
            project_id INTEGER,
            order_number INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects (id)
        )
    ''')
    
    # Add order_number column to existing prompts table (migration)
    try:
        cursor.execute("ALTER TABLE prompts ADD COLUMN order_number INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        # Column already exists, ignore
        pass
    
    # Migrate existing prompts with text project to use project_id
    cursor.execute('''
        UPDATE prompts 
        SET project_id = (SELECT id FROM projects WHERE name = 'Default' LIMIT 1)
        WHERE project_id IS NULL
    ''')
    
    # Create settings table for application configuration
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Insert default settings
    cursor.execute('''
        INSERT OR IGNORE INTO settings (key, value) VALUES ('app_version', '0.1.9')
    ''')
    
    cursor.execute('''
        INSERT OR IGNORE INTO settings (key, value) VALUES ('initialized', 'true')
    ''')
    
    conn.commit()
    conn.close()
    
    return config.database_path


async def get_database():
    """Get async database connection"""
    return await aiosqlite.connect(config.database_path)


class DatabaseManager:
    """Async database manager for Inkwell"""
    
    @staticmethod
    async def get_items():
        """Get all items from the database"""
        async with aiosqlite.connect(config.database_path) as db:
            async with db.execute("SELECT * FROM items ORDER BY created_at DESC") as cursor:
                rows = await cursor.fetchall()
                columns = [description[0] for description in cursor.description]
                return [dict(zip(columns, row)) for row in rows]
    
    @staticmethod
    async def create_item(name: str, description: str = None):
        """Create a new item in the database"""
        async with aiosqlite.connect(config.database_path) as db:
            await db.execute(
                "INSERT INTO items (name, description) VALUES (?, ?)",
                (name, description)
            )
            await db.commit()
            
            # Get the created item
            async with db.execute("SELECT * FROM items WHERE rowid = last_insert_rowid()") as cursor:
                row = await cursor.fetchone()
                if row:
                    columns = [description[0] for description in cursor.description]
                    return dict(zip(columns, row))
    
    @staticmethod
    async def get_item(item_id: int):
        """Get a specific item by ID"""
        async with aiosqlite.connect(config.database_path) as db:
            async with db.execute("SELECT * FROM items WHERE id = ?", (item_id,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    columns = [description[0] for description in cursor.description]
                    return dict(zip(columns, row))
    
    @staticmethod
    async def update_item(item_id: int, name: str = None, description: str = None):
        """Update an item in the database"""
        async with aiosqlite.connect(config.database_path) as db:
            updates = []
            params = []
            
            if name is not None:
                updates.append("name = ?")
                params.append(name)
            
            if description is not None:
                updates.append("description = ?")
                params.append(description)
            
            if updates:
                updates.append("updated_at = CURRENT_TIMESTAMP")
                params.append(item_id)
                
                await db.execute(
                    f"UPDATE items SET {', '.join(updates)} WHERE id = ?",
                    params
                )
                await db.commit()
    
    @staticmethod
    async def delete_item(item_id: int):
        """Delete an item from the database"""
        async with aiosqlite.connect(config.database_path) as db:
            await db.execute("DELETE FROM items WHERE id = ?", (item_id,))
            await db.commit()
    
    @staticmethod
    async def get_setting(key: str):
        """Get a setting value by key"""
        async with aiosqlite.connect(config.database_path) as db:
            async with db.execute("SELECT value FROM settings WHERE key = ?", (key,)) as cursor:
                row = await cursor.fetchone()
                return row[0] if row else None
    
    @staticmethod
    async def set_setting(key: str, value: str):
        """Set a setting value"""
        async with aiosqlite.connect(config.database_path) as db:
            await db.execute(
                "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
                (key, value)
            )
            await db.commit()
    
    # Prompts methods
    @staticmethod
    async def get_prompts(project_id: int = None, status: str = None):
        """Get all prompts from the database, optionally filtered by project_id and status"""
        async with aiosqlite.connect(config.database_path) as db:
            base_query = """
                SELECT p.*, proj.name as project_name 
                FROM prompts p 
                LEFT JOIN projects proj ON p.project_id = proj.id
            """
            
            conditions = []
            params = []
            
            if project_id:
                conditions.append("p.project_id = ?")
                params.append(project_id)
            
            if status:
                conditions.append("p.status = ?")
                params.append(status)
            
            if conditions:
                query = f"{base_query} WHERE {' AND '.join(conditions)} ORDER BY p.order_number ASC, p.created_at DESC"
            else:
                query = f"{base_query} ORDER BY p.order_number ASC, p.created_at DESC"
            
            async with db.execute(query, params) as cursor:
                rows = await cursor.fetchall()
                columns = [description[0] for description in cursor.description]
                return [dict(zip(columns, row)) for row in rows]
    
    @staticmethod
    async def create_prompt(name: str, status: str = 'draft', content: str = None, project_id: int = None):
        """Create a new prompt in the database"""
        async with aiosqlite.connect(config.database_path) as db:
            # If no project_id specified, use the Default project
            if project_id is None:
                async with db.execute("SELECT id FROM projects WHERE name = 'Default' LIMIT 1") as cursor:
                    row = await cursor.fetchone()
                    project_id = row[0] if row else None
            
            # Get the next order_number by finding the max order_number and adding 1
            async with db.execute("SELECT COALESCE(MAX(order_number), 0) + 1 FROM prompts WHERE status = ?", (status,)) as cursor:
                row = await cursor.fetchone()
                next_order_number = row[0] if row else 1
                    
            await db.execute(
                "INSERT INTO prompts (name, status, content, project_id, order_number) VALUES (?, ?, ?, ?, ?)",
                (name, status, content, project_id, next_order_number)
            )
            await db.commit()
            
            # Get the created prompt with project name
            query = """
                SELECT p.*, proj.name as project_name 
                FROM prompts p 
                LEFT JOIN projects proj ON p.project_id = proj.id 
                WHERE p.rowid = last_insert_rowid()
            """
            async with db.execute(query) as cursor:
                row = await cursor.fetchone()
                if row:
                    columns = [description[0] for description in cursor.description]
                    return dict(zip(columns, row))
    
    @staticmethod
    async def get_prompt(prompt_id: int):
        """Get a specific prompt by ID"""
        async with aiosqlite.connect(config.database_path) as db:
            query = """
                SELECT p.*, proj.name as project_name 
                FROM prompts p 
                LEFT JOIN projects proj ON p.project_id = proj.id 
                WHERE p.id = ?
            """
            async with db.execute(query, (prompt_id,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    columns = [description[0] for description in cursor.description]
                    return dict(zip(columns, row))
    
    @staticmethod
    async def update_prompt(prompt_id: int, name: str = None, status: str = None, content: str = None, project_id: int = None, order_number: int = None):
        """Update a prompt in the database"""
        async with aiosqlite.connect(config.database_path) as db:
            updates = []
            params = []
            
            if name is not None:
                updates.append("name = ?")
                params.append(name)
            
            if status is not None:
                updates.append("status = ?")
                params.append(status)
            
            if content is not None:
                updates.append("content = ?")
                params.append(content)
            
            if project_id is not None:
                updates.append("project_id = ?")
                params.append(project_id)
            
            if order_number is not None:
                updates.append("order_number = ?")
                params.append(order_number)
            
            if updates:
                updates.append("updated_at = CURRENT_TIMESTAMP")
                params.append(prompt_id)
                
                await db.execute(
                    f"UPDATE prompts SET {', '.join(updates)} WHERE id = ?",
                    params
                )
                await db.commit()
    
    @staticmethod
    async def delete_prompt(prompt_id: int):
        """Delete a prompt from the database"""
        async with aiosqlite.connect(config.database_path) as db:
            await db.execute("DELETE FROM prompts WHERE id = ?", (prompt_id,))
            await db.commit()
    
    # Projects methods
    @staticmethod
    async def get_projects():
        """Get all projects from the database"""
        async with aiosqlite.connect(config.database_path) as db:
            async with db.execute("SELECT * FROM projects ORDER BY name") as cursor:
                rows = await cursor.fetchall()
                columns = [description[0] for description in cursor.description]
                return [dict(zip(columns, row)) for row in rows]
    
    @staticmethod
    async def create_project(name: str):
        """Create a new project in the database"""
        async with aiosqlite.connect(config.database_path) as db:
            await db.execute(
                "INSERT INTO projects (name) VALUES (?)",
                (name,)
            )
            await db.commit()
            
            # Get the created project
            async with db.execute("SELECT * FROM projects WHERE rowid = last_insert_rowid()") as cursor:
                row = await cursor.fetchone()
                if row:
                    columns = [description[0] for description in cursor.description]
                    return dict(zip(columns, row))
    
    @staticmethod
    async def get_project(project_id: int):
        """Get a specific project by ID"""
        async with aiosqlite.connect(config.database_path) as db:
            async with db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    columns = [description[0] for description in cursor.description]
                    return dict(zip(columns, row))
    
    @staticmethod
    async def update_project(project_id: int, name: str = None, whiteboard: str = None):
        """Update a project in the database"""
        async with aiosqlite.connect(config.database_path) as db:
            updates = []
            params = []
            
            if name is not None:
                updates.append("name = ?")
                params.append(name)
            
            if whiteboard is not None:
                updates.append("whiteboard = ?")
                params.append(whiteboard)
            
            if updates:
                updates.append("updated_at = CURRENT_TIMESTAMP")
                params.append(project_id)
                
                await db.execute(
                    f"UPDATE projects SET {', '.join(updates)} WHERE id = ?",
                    params
                )
                await db.commit()
    
    @staticmethod
    async def delete_project(project_id: int):
        """Delete a project from the database (and reassign its prompts to Default)"""
        async with aiosqlite.connect(config.database_path) as db:
            # Get the Default project ID
            async with db.execute("SELECT id FROM projects WHERE name = 'Default' LIMIT 1") as cursor:
                default_row = await cursor.fetchone()
                default_id = default_row[0] if default_row else None
                
            if default_id:
                # Reassign prompts to Default project
                await db.execute(
                    "UPDATE prompts SET project_id = ? WHERE project_id = ?",
                    (default_id, project_id)
                )
            
            # Delete the project
            await db.execute("DELETE FROM projects WHERE id = ?", (project_id,))
            await db.commit()