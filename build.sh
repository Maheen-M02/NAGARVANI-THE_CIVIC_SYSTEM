#!/bin/bash

# Set permissions
chmod +x node_modules/.bin/*

# Set environment variables
export CI=false
export NODE_ENV=production

# Run the build
npx react-scripts build