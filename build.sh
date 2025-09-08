#!/bin/bash

# Inkwell Frontend Build Script
# This script builds the React frontend and prepares it for distribution

set -e  # Exit on any error

echo "🔨 Building Inkwell Frontend..."

# Check if we're in the correct directory
if [ ! -f "pyproject.toml" ]; then
    echo "❌ Error: Please run this script from the inkwell-internal root directory"
    exit 1
fi

# Navigate to frontend directory
cd frontend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: frontend/package.json not found"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
else
    echo "📦 Dependencies already installed, skipping..."
fi

# Build the React application
echo "⚛️  Building React application..."
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    echo "❌ Error: Build failed - build directory not created"
    exit 1
fi

# Navigate back to root
cd ..

# Create the inkwell/frontend directory if it doesn't exist
mkdir -p inkwell/frontend

# Copy build files to the inkwell package directory
echo "📂 Copying build files to package directory..."
if [ -d "inkwell/frontend/build" ]; then
    rm -rf inkwell/frontend/build
fi

cp -r frontend/build inkwell/frontend/

# Verify the copy was successful
if [ ! -d "inkwell/frontend/build" ]; then
    echo "❌ Error: Failed to copy build files to package directory"
    exit 1
fi

echo "✅ Frontend build completed successfully!"
echo "📁 Build files copied to: inkwell/frontend/build/"
echo ""
echo "Next steps:"
echo "  1. Install the package: pip install -e ."
echo "  2. Start the application: inkwell start"
echo ""