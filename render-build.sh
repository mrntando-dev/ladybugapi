#!/bin/bash

# Build script for Render.com deployment
echo "🚀 Starting Ladybug API deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create production environment file
echo "⚙️ Setting up production environment..."
echo "NODE_ENV=production" > .env
echo "PORT=\$PORT" >> .env
echo "RENDER=true" >> .env

# Start the server
echo "🐞 Starting Ladybug API..."
npm start
