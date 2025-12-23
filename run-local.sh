#!/bin/bash

# Quick start script to run the app locally using Docker (same as Cloud Run)

set -e

echo "🚀 Starting full-stack app locally (Cloud Run environment)..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating one from template..."
    echo "VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here" > .env
    echo "📝 Please edit .env and add your Clerk publishable key"
    echo ""
fi

# Build and run with docker-compose
echo "🔨 Building and starting containers..."
docker-compose up --build

