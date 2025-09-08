# Inkwell

A command line tool that launches a local React website with FastAPI backend.

## Features

- 🚀 **Easy Installation**: Install via pip
- 🌐 **Full-Stack**: React frontend with FastAPI backend
- 🗄️ **Database**: SQLite database for data persistence
- 🖥️ **CLI Interface**: Control via command line from any directory  
- 📱 **Web Interface**: Interact through the browser
- 🔧 **Development Mode**: Hot reload during development

## Installation

```bash
# Install directly from GitHub (pre-built)
pip install git+https://github.com/soshhowell/inkwell.git
```

## Quick Start

1. **Initialize** (first time only):
   ```bash
   inkwell init
   ```

2. **Start the application**:
   ```bash
   inkwell start
   ```

3. **Open your browser** to `http://localhost:7891`

## Usage

### Commands

- `inkwell start` - Start the application (backend on port 7891)
- `inkwell start --dev` - Start in development mode
- `inkwell start --no-browser` - Start without opening browser
- `inkwell status` - Show application status
- `inkwell init` - Initialize configuration and database
- `inkwell --help` - Show help

### Ports

- **Backend (Production)**: http://localhost:7891
- **Frontend (Development)**: http://localhost:7892

### API Endpoints

The FastAPI backend provides these endpoints:

- `GET /api/health` - Health check
- `GET /api/items` - Get all items
- `POST /api/items` - Create new item
- `GET /api/items/{id}` - Get specific item
- `PUT /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete item
- `GET /docs` - Interactive API documentation

## Development

### Quick Development Setup (Recommended)

Use the development script to run both frontend and backend without pip install:

```bash
# Start development environment (no pip install needed)
./run.sh
```

This will:
- Install dependencies automatically
- Start backend on port **7893**
- Start frontend on port **7894** 
- Use separate development database (`.dev_database/inkwell_dev.db`)
- Enable hot reload for both frontend and backend
- Handle cleanup on Ctrl+C

**Development URLs:**
- 🌐 **Frontend**: http://localhost:7894
- 🔌 **Backend API**: http://localhost:7893
- 📚 **API Docs**: http://localhost:7893/docs

### Manual Development

#### Frontend Development

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server (runs on port 7892)
npm start
```

#### Backend Development

```bash
# Start backend in development mode
inkwell start --dev
```

### Building

```bash
# Build the React frontend
./build.sh

# The build files will be copied to inkwell/frontend/build/
```

## Configuration

Inkwell stores its configuration and database in `~/.inkwell/`:

- `~/.inkwell/inkwell.db` - SQLite database
- `~/.inkwell/config.json` - Configuration file (future use)

## Architecture

```
inkwell-internal/
├── inkwell/                 # Main Python package
│   ├── cli.py              # Click-based CLI
│   ├── server.py           # FastAPI backend
│   ├── database.py         # SQLite database management
│   ├── config.py           # Configuration
│   └── frontend/build/     # Built React app (generated)
├── frontend/               # React source code
│   ├── src/               # React components
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── build.sh               # Frontend build script
├── pyproject.toml         # Python package config
└── requirements.txt       # Python dependencies
```

## Contributing

1. Make changes to the code
2. If you modify the frontend, run `./build.sh`
3. Test with `pip install -e .` and `inkwell start`

## License

MIT License