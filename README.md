# N8N Agent Telegram Bot

A Telegram bot that helps users create N8N workflows through a simple conversation interface.

## Features

- Interactive conversation to create N8N workflows
- Predefined API options (OpenAI, Gemini, Claude, ElevenLabs, Telegram, Email, etc.)
- Step-by-step workflow creation process
- Ability to specify triggers and actions
- Business-focused workflows for notifications and automation

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your N8N Cloud details in the `.env` file:
   - Rename `.env.example` to `.env`
   - Replace `YOUR_N8N_CLOUD_URL_HERE` with your actual N8N Cloud URL (e.g., https://your-instance.n8n.cloud)
   - Replace `YOUR_N8N_CLOUD_API_KEY_HERE` with your actual N8N Cloud API key

3. Run the bot:
```bash
npm start
```

## Configuration

You need to set up your N8N Cloud credentials in the `.env` file:
- `N8N_SERVER_URL`: Your N8N Cloud URL (e.g., https://your-instance.n8n.cloud)
- `N8N_API_KEY`: Your N8N Cloud API key

## Commands

- `/start` - Begin using the bot
- `/create` - Create a new workflow
- `/list` - List your existing workflows
- `/help` - Show help information

## Usage

Simply send `/create` to the bot and follow the prompts to build your N8N workflow. The bot will guide you through selecting an API, defining what you want it to do, and setting up triggers.

## Supported Workflows

- **Telegram Notifications**: Schedule business notifications to your Telegram
- **Email Automation**: Send automated emails based on triggers
- **API Integrations**: Connect to OpenAI, Google Gemini, Claude, etc.
- **WhatsApp Messages**: Send automated WhatsApp communications
- **Scheduled Tasks**: Set up recurring business processes

All workflows run on your N8N Cloud instance with no local processing required.