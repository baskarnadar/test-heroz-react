
#!/bin/bash


# cd /home/ec2-user/heroz-app
# npm run build
# pm2 restart vite-app || pm2 start npm --name "vite-app" -- start

set -e  # Exit immediately on any error

APP_DIR="/home/ec2-user/heroz-app"
APP_NAME="vite-app"

echo "🚀 Starting production deployment for $APP_NAME..."

# Go to app directory
cd $APP_DIR

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps

# Build production bundle
echo "🏗️ Building production bundle..."
npm run build:prod

# Start or restart PM2 using serve:prod
echo "🔄 Starting/Restarting PM2 app in production mode..."
pm2 restart $APP_NAME || pm2 start npm --name "$APP_NAME" -- run serve:prod

# Save PM2 process list for startup
pm2 save

echo "✅ Production deployment complete! App is live."
