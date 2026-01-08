#!/bin/bash

# Configuration
EXPECT_SCRIPT="./sftp_deploy.expect"
ENV_FILE=".env"

# Check if .env.local exists
if [ -f "$ENV_FILE" ]; then
    echo "Loading credentials from $ENV_FILE..."
    export $(grep -v '^#' $ENV_FILE | xargs)
else
    echo "Error: $ENV_FILE not found. Please create it with SFTP_* variables."
    exit 1
fi

# 1. Ask for Commit Message
if [ -z "$1" ]; then
    echo -n "Enter git commit message: "
    read COMMIT_MSG
else
    COMMIT_MSG="$1"
fi

if [ -z "$COMMIT_MSG" ]; then
    echo "Commit message cannot be empty. Aborting."
    exit 1
fi

# 2. Git Operations
echo "-----------------------------------"
echo "📦 git add . && git commit..."
echo "-----------------------------------"
git add .
git commit -m "$COMMIT_MSG"

echo "-----------------------------------"
echo "🚀 git push..."
echo "-----------------------------------"
git push

# 3. Build Project
echo "-----------------------------------"
echo "🏗️ Building project..."
echo "-----------------------------------"
npm run build

# 4. Deploy using Expect Script
# Arguments: host user password port local_dir remote_dir
# We assume these env vars are set in .env.local:
# SFTP_HOST, SFTP_USER, SFTP_PASS, SFTP_PORT, SFTP_REMOTE_DIR

if [ -z "$SFTP_HOST" ] || [ -z "$SFTP_USER" ] || [ -z "$SFTP_PASS" ]; then
    echo "Error: Missing SFTP credentials in .env.local"
    exit 1
fi

# Next.js 'export' output is in 'out' folder
LOCAL_DIR="$(pwd)/out"
# Default port 22 if not set
PORT=${SFTP_PORT:-22}  

echo "-----------------------------------"
echo "📂 Deploying to $SFTP_HOST..."
echo "-----------------------------------"

# Make sure expect script is executable
chmod +x $EXPECT_SCRIPT

$EXPECT_SCRIPT "$SFTP_HOST" "$SFTP_USER" "$SFTP_PASS" "$PORT" "$LOCAL_DIR" "$SFTP_REMOTE_DIR"

echo "✅ Deployment Complete!"
