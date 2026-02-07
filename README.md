# N8N Agent Telegram Bot

An advanced Telegram bot that helps users create N8N workflows and provides AI-powered assistance with document creation and voice responses.

## Features

- Interactive conversation to create N8N workflows
- Predefined API options (OpenAI, Gemini, Claude, ElevenLabs, etc.)
- Step-by-step workflow creation process
- Ability to specify triggers and actions
- Business-focused workflows for notifications and automation
- **NEW**: Conversational AI assistant mode
- **NEW**: Document creation capabilities
- **NEW**: Voice mode with your personalized voice (coming soon)
- **NEW**: General purpose automation tools

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your credentials in the `.env` file:
   - Rename `.env.example` to `.env`
   - Replace `YOUR_N8N_CLOUD_URL_HERE` with your actual N8N Cloud URL (if using N8N integration)
   - Replace `YOUR_N8N_CLOUD_API_KEY_HERE` with your actual N8N Cloud API key (if using N8N integration)
   - NOTE: Your OpenAI API key is already embedded in the source code for easier deployment

3. Run the bot:
```bash
npm start
```

## Configuration

You need to set up your credentials in the `.env` file:
- `N8N_SERVER_URL`: Your N8N Cloud URL (e.g., https://your-instance.n8n.cloud) - Optional if not using N8N integration
- `N8N_API_KEY`: Your N8N Cloud API key - Optional if not using N8N integration
- `OPENAI_API_KEY`: Your OpenAI API key (already configured)

## Commands

- `/start` - Begin using the bot
- `/create` - Create a new workflow
- `/list` - List your existing workflows
- `/help` - Show help information
- `/voice` - Toggle voice mode (speak responses with your voice)
- `/doc` - Create a document (usage: /doc your content here)
- `/ai` - Chat with AI like a conversational assistant (usage: /ai your question here)

## Usage

### For Workflow Creation:
Simply send `/create` to the bot and follow the prompts to build your N8N workflow. The bot will guide you through selecting an API, defining what you want it to do, and setting up triggers.

### For General Assistance:
Type any question or request, and the bot will use AI to understand and respond appropriately. You can also use `/ai your question` for direct AI assistance.

### For Document Creation:
Use `/doc your content here` to create a text document that the bot will send back to you.

### For Voice Mode:
Use `/voice` to toggle voice mode on/off. When enabled, responses will be synthesized with your voice (requires additional setup).

## Supported Workflows

- **Telegram Notifications**: Schedule business notifications to your Telegram
- **Email Automation**: Send automated emails based on triggers
- **API Integrations**: Connect to OpenAI, Google Gemini, Claude, etc.
- **WhatsApp Messages**: Send automated WhatsApp communications
- **Scheduled Tasks**: Set up recurring business processes

All processing can run on your cloud instance with minimal local processing required.