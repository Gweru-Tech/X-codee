#!/bin/bash

# X-Coder Platform Startup Script

echo "Starting X-Coder Platform..."

# Set environment variables
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-8080}

# Create uploads directory if it doesn't exist
mkdir -p uploads logs

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --production
fi

# Start the application
echo "Starting server on port $PORT..."
npm start