#!/bin/bash

echo "Building Coffee Tracker MVP..."

# Build the project
bun run build

# Build and start Docker container
docker-compose up -d --build

echo "Coffee Tracker is now running at http://localhost"
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
