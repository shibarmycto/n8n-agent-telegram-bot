#!/bin/bash

# N8N Agent Telegram Bot Startup Script

echo "Starting N8N Agent Telegram Bot..."

# Set environment variables
export N8N_API_KEY=$(cat .env 2>/dev/null | grep N8N_API_KEY | cut -d '=' -f2)

# Start the bot
node src/bot.js

echo "Bot stopped."