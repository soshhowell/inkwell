# Inkwell Development Guide for Claude

This file contains important information for Claude Code when working with the Inkwell project.

## Development vs Production Modes

### 🔧 Development Mode (Preferred for Testing)

**Use `./run.sh` for development testing:**
- Runs on ports 7893 (backend) and 7894 (frontend)
- No pip install required
- Uses separate development database (`.dev_database/`)
- Automatic log rotation and background process management
- Logs stored in `.dev_logs/`

**Development workflow:**
```bash
./run.sh          # Start development servers (exits immediately)
./stop.sh         # Stop development servers
tail -f .dev_logs/backend.log    # Monitor backend logs
tail -f .dev_logs/frontend.log   # Monitor frontend logs
```

### 🚀 Production Mode (Only When Explicitly Requested)

**⚠️ Important: Only test production mode if the user explicitly asks for it.**

**Production setup requires:**
1. Build the frontend first:
   ```bash
   ./build.sh
   ```

2. Install as command-line tool:
   ```bash
   pip install -e .
   ```

3. Initialize and start:
   ```bash
   inkwell init     # First time only
   inkwell start    # Runs on port 7891
   ```

**Production characteristics:**
- Single port 7891 (frontend served as static files from backend)
- Uses `~/.inkwell/` directory for database and config
- Requires pre-built frontend files in `inkwell/frontend/build/`
- Pip-installable command-line tool

## Default Testing Approach

**Always use development mode (`./run.sh`) for testing unless:**
- User explicitly requests production testing
- User asks about pip installation
- User asks about the `inkwell` command specifically
- User mentions production deployment

## Port Configuration

- **Development**: 7893 (backend), 7894 (frontend)
- **Production**: 7891 (unified)

## Key Differences

| Feature | Development (`./run.sh`) | Production (`inkwell start`) |
|---------|-------------------------|------------------------------|
| Installation | None required | `pip install -e .` required |
| Frontend | Live React dev server | Pre-built static files |
| Database | `.dev_database/` | `~/.inkwell/` |
| Ports | 7893 + 7894 | 7891 only |
| Logs | `.dev_logs/` files | Console output |
| Hot reload | ✅ Both services | ✅ Backend only |

## Testing Commands

**For routine testing, use:**
```bash
./run.sh    # Quick development testing
```

**Only when explicitly requested:**
```bash
./build.sh && pip install -e . && inkwell start
```

## Process Management

**Development:**
- Background processes managed by `run.sh`/`stop.sh`
- PID tracking in `.dev_logs/pids.txt`
- Automatic port cleanup

**Production:**
- Manual process management
- Ctrl+C to stop or external process manager
- when I say "push" do a git add . (not just what you think is changed), commit with message, and push
- don't need to make changes backwards compatible