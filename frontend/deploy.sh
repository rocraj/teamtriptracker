#!/bin/bash

# TeamTripTracker Frontend Deployment Script
# Builds and deploys the Angular app to Firebase Hosting

echo "🚀 TeamTripTracker Frontend Deployment"
echo "======================================"

# Check if we're in the frontend directory
if [ ! -f "package.json" ] || [ ! -f "angular.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    echo "   Current directory: $(pwd)"
    exit 1
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building production build..."
npm run build --prod

# Check if build succeeded
if [ ! -d "dist/teamsplit/browser" ]; then
    echo "❌ Build failed! Check the output above."
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Build output: dist/teamsplit/browser"

echo ""
echo "🔥 Deploying to Firebase..."
firebase deploy --only hosting

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app is available at: https://teamsplit.psynik.com"
echo "📚 Backend API: https://teamsplit-api.psynik.com/docs"