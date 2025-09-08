"""Configuration management for Inkwell"""

import os
from pathlib import Path


class InkwellConfig:
    """Configuration manager for Inkwell application"""
    
    def __init__(self):
        self.home_dir = Path.home()
        self.inkwell_dir = self.home_dir / ".inkwell"
        
        # Allow environment variable override for development database path
        env_db_path = os.getenv('INKWELL_DB_PATH')
        if env_db_path:
            self.database_path = Path(env_db_path)
        else:
            self.database_path = self.inkwell_dir / "inkwell.db"
            
        self.config_file = self.inkwell_dir / "config.json"
        
        # Server configuration
        self.backend_port = 7891
        self.frontend_dev_port = 7892
        self.host = "127.0.0.1"
        
    def ensure_inkwell_directory(self):
        """Ensure the ~/.inkwell directory exists"""
        self.inkwell_dir.mkdir(exist_ok=True)
        return self.inkwell_dir
    
    def get_database_url(self):
        """Get the SQLite database URL"""
        self.ensure_inkwell_directory()
        return f"sqlite:///{self.database_path}"
    
    @property
    def backend_url(self):
        """Get the backend server URL"""
        return f"http://{self.host}:{self.backend_port}"
    
    @property 
    def frontend_dev_url(self):
        """Get the frontend development server URL"""
        return f"http://{self.host}:{self.frontend_dev_port}"


config = InkwellConfig()