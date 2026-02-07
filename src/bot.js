const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Bot token from Telegram
const token = '7604717632:AAGSdQjNqLMpsE-Xpk4VNe12CcP3jB-OX1w';

// N8N server configuration (you'll need to update this)
const N8N_SERVER_URL = 'http://your-n8n-server-url'; // Replace with your actual N8N server URL
const N8N_API_KEY = process.env.N8N_API_KEY; // Set this as an environment variable

// Create bot instance
const bot = new TelegramBot(token, { polling: true });

// Store user sessions
const userSessions = {};

// Predefined API options for users to choose from
const apiOptions = [
  { id: 'openai', name: 'OpenAI API', description: 'ChatGPT, GPT-4 models' },
  { id: 'gemini', name: 'Google Gemini API', description: 'Gemini models' },
  { id: 'claude', name: 'Anthropic Claude API', description: 'Claude models' },
  { id: 'elevenlabs', name: 'ElevenLabs API', description: 'Text-to-speech' },
  { id: 'whatsapp', name: 'WhatsApp Business API', description: 'Send WhatsApp messages' },
  { id: 'telegram', name: 'Telegram Bot API', description: 'Send notifications to Telegram' },
  { id: 'email', name: 'Email Service', description: 'Send automated emails' },
  { id: 'custom', name: 'Custom API', description: 'Your own API endpoint' }
];

// Start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  const welcomeMessage = `
  🤖 Welcome to the N8N Agent Bot!
  
  I'm here to help you create N8N workflows quickly and easily.
  
  Available commands:
  /start - Show this message
  /create - Start creating a new workflow
  /list - List your existing workflows
  /help - Show help information
  
  Send any message to begin creating a workflow!
  `;
  
  bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown'
  });
});

// Create workflow command
bot.onText(/\/create/, (msg) => {
  const chatId = msg.chat.id;
  
  // Initialize user session
  userSessions[chatId] = { step: 'select_api' };
  
  // Send API selection message
  let apiList = "🤖 Please select an API to use in your workflow:\n\n";
  apiOptions.forEach((api, index) => {
    apiList += `${index + 1}. *${api.name}*\n_${api.description}_\n\n`;
  });
  
  bot.sendMessage(chatId, apiList, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: apiOptions.map(api => [`Select ${api.name}`]),
      one_time_keyboard: true
    }
  });
});

// Handle text messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Get user session or create new one
  let session = userSessions[chatId] || { step: 'initial' };
  
  try {
    if (session.step === 'select_api') {
      // Find selected API
      const selectedApi = apiOptions.find(api => 
        text.includes(api.name) || text.toLowerCase().includes(api.id)
      );
      
      if (selectedApi) {
        session.selectedApi = selectedApi;
        session.step = 'define_action';
        
        const actionPrompt = `
        You've selected *${selectedApi.name}*.
        
        What would you like this API to do in your workflow?
        
        Examples:
        - Send a notification when triggered
        - Process incoming data
        - Generate content based on input
        - Respond to specific events
        
        Please describe what you want the ${selectedApi.name} API to do:
        `;
        
        bot.sendMessage(chatId, actionPrompt, { parse_mode: 'Markdown' });
      } else {
        // Show API options again
        let apiList = "Please select a valid API from the list:\n\n";
        apiOptions.forEach((api, index) => {
          apiList += `${index + 1}. *${api.name}*\n_${api.description}_\n\n`;
        });
        
        bot.sendMessage(chatId, apiList, {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: apiOptions.map(api => [`Select ${api.name}`]),
            one_time_keyboard: true
          }
        });
      }
    } 
    else if (session.step === 'define_action') {
      session.actionDescription = text;
      session.step = 'define_trigger';
      
      const triggerPrompt = `
      Great! You want the *${session.selectedApi.name}* to: ${text}
      
      Now, when should this workflow be triggered?
      
      Options:
      - On a schedule (daily, hourly, etc.)
      - When receiving a webhook
      - When a specific event occurs
      - Manually triggered
      
      Please specify when you want this workflow to run:
      `;
      
      bot.sendMessage(chatId, triggerPrompt, { parse_mode: 'Markdown' });
    }
    else if (session.step === 'define_trigger') {
      session.trigger = text;
      session.step = 'confirm';
      
      const confirmation = `
      📋 Workflow Summary:
      
      *API*: ${session.selectedApi.name}
      *Action*: ${session.actionDescription}
      *Trigger*: ${session.trigger}
      
      Does this look correct? Reply with "yes" to create the workflow or "no" to start over.
      `;
      
      bot.sendMessage(chatId, confirmation, { 
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [['Yes', 'No']],
          one_time_keyboard: true
        }
      });
    }
    else if (session.step === 'confirm') {
      if (text.toLowerCase().includes('yes') || text.toLowerCase() === 'yes') {
        // Create the workflow
        bot.sendMessage(chatId, '🔄 Creating your N8N workflow... Please wait.');
        
        try {
          // Here we would call the N8N API to create the workflow
          // This is a placeholder for the actual N8N API call
          const workflowId = await createN8NWorkflow(session);
          
          const successMessage = `
          ✅ Success! Your workflow has been created.
          
          *Workflow ID*: ${workflowId}
          *API*: ${session.selectedApi.name}
          *Action*: ${session.actionDescription}
          *Trigger*: ${session.trigger}
          
          Your workflow is now active and running on your N8N server.
          
          /create - Create another workflow
          /list - View your workflows
          `;
          
          bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
        } catch (error) {
          console.error('Error creating workflow:', error);
          bot.sendMessage(chatId, '❌ Error creating workflow. Please try again.');
        }
        
        // Reset session
        delete userSessions[chatId];
      } else {
        // Reset and start over
        delete userSessions[chatId];
        bot.sendMessage(chatId, '🔄 Starting over. Use /create to begin a new workflow.');
      }
    }
    else {
      // Default message
      const defaultMsg = `
      🤖 Hello! I'm the N8N Agent Bot.
      
      Use /create to start building a new workflow.
      Use /help to see all available commands.
      `;
      
      bot.sendMessage(chatId, defaultMsg, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    bot.sendMessage(chatId, '❌ An error occurred. Please try again.');
  }
});

// Function to create N8N workflow
async function createN8NWorkflow(session) {
  try {
    // This function would call your N8N server API to create a workflow
    // You'll need to configure your N8N server URL and API key
    
    // Construct the workflow based on user input
    const workflowData = constructWorkflow(session);
    
    // Call N8N API to create the workflow
    const response = await axios.post(`${N8N_SERVER_URL}/workflows`, workflowData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${N8N_API_KEY}`
      }
    });
    
    return response.data.id || `wf-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  } catch (error) {
    console.error('Error creating N8N workflow:', error.response?.data || error.message);
    throw error;
  }
}

// Function to construct N8N workflow based on user input
function constructWorkflow(session) {
  // Determine the appropriate N8N node based on the selected API
  let triggerNode, actionNode;
  
  switch(session.selectedApi.id) {
    case 'openai':
      triggerNode = {
        id: "schedule-trigger",
        name: "Schedule Trigger",
        type: "n8n-nodes-base.scheduleTrigger",
        position: [240, 300],
        parameters: {
          triggerTimes: {
            item: [
              {
                hour: 9,
                minute: 0
              }
            ]
          }
        }
      };
      
      actionNode = {
        id: "openai-node",
        name: "OpenAI",
        type: "n8n-nodes-base.openAi",
        position: [460, 300],
        parameters: {
          resource: "completion",
          operation: "create",
          options: {
            model: "gpt-3.5-turbo"
          }
        }
      };
      break;
      
    case 'gemini':
      triggerNode = {
        id: "webhook-trigger",
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        position: [240, 300],
        parameters: {
          httpMethod: "POST",
          path: `gemini-${Date.now() % 10000}`,
          responseMode: "lastNode",
          responseData: "allEntries"
        }
      };
      
      actionNode = {
        id: "gemini-node",
        name: "Google Gemini",
        type: "n8n-nodes-base.googleSheets", // Placeholder - actual Gemini node
        position: [460, 300],
        parameters: {
          resource: "text",
          operation: "generate",
        }
      };
      break;
      
    case 'whatsapp':
      triggerNode = {
        id: "webhook-trigger",
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        position: [240, 300],
        parameters: {
          httpMethod: "POST",
          path: `whatsapp-${Date.now() % 10000}`
        }
      };
      
      actionNode = {
        id: "whatsapp-node",
        name: "WhatsApp",
        type: "n8n-nodes-base.httpRequest", // Using HTTP Request as placeholder
        position: [460, 300],
        parameters: {
          url: "https://graph.facebook.com/v17.0/{{ $json.phoneNumberId }}/messages",
          method: "POST",
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: "{{ $json.to }}",
            text: { body: session.actionDescription }
          })
        }
      };
      break;
      
    case 'telegram':
      triggerNode = {
        id: "schedule-trigger",
        name: "Schedule Trigger",
        type: "n8n-nodes-base.scheduleTrigger",
        position: [240, 300],
        parameters: {
          triggerTimes: {
            item: [
              {
                hour: 8,
                minute: 0
              }
            ]
          }
        }
      };
      
      actionNode = {
        id: "telegram-node",
        name: "Telegram",
        type: "n8n-nodes-base.telegram",
        position: [460, 300],
        parameters: {
          operation: "sendMessage",
          chatId: "YOUR_TELEGRAM_CHAT_ID", // This would be configured
          text: session.actionDescription
        }
      };
      break;
      
    case 'email':
      triggerNode = {
        id: "schedule-trigger",
        name: "Schedule Trigger",
        type: "n8n-nodes-base.scheduleTrigger",
        position: [240, 300],
        parameters: {
          triggerTimes: {
            item: [
              {
                hour: 9,
                minute: 0
              }
            ]
          }
        }
      };
      
      actionNode = {
        id: "email-node",
        name: "Email",
        type: "n8n-nodes-base.gmail",
        position: [460, 300],
        parameters: {
          operation: "send",
          sender: "me",
          to: "recipient@example.com", // This would be configured
          subject: "Business Notification",
          text: session.actionDescription
        }
      };
      break;
      
    default:
      // Default for other APIs
      triggerNode = {
        id: "manual-trigger",
        name: "Manual Trigger",
        type: "n8n-nodes-base.manualTrigger",
        position: [240, 300],
        parameters: {}
      };
      
      actionNode = {
        id: "http-request-node",
        name: "HTTP Request",
        type: "n8n-nodes-base.httpRequest",
        position: [460, 300],
        parameters: {
          url: "", // This would be configured based on the API
          method: "GET"
        }
      };
  }
  
  // Create the workflow structure
  const workflow = {
    name: `Business Workflow: ${session.selectedApi.name} - ${session.actionDescription.substring(0, 30)}`,
    nodes: [triggerNode, actionNode],
    connections: {
      [triggerNode.name]: {
        main: [
          [
            {
              node: actionNode.name,
              type: "main",
              index: 0
            }
          ]
        ]
      }
    },
    settings: {
      saveExecutionProgress: true,
      saveManualExecutions: true,
      executionTimeout: 3600
    },
    staticData: null,
    pinnedData: {}
  };
  
  return workflow;
}

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `
  🤖 N8N Agent Bot Help
  
  I help you create N8N workflows through a simple conversation.
  
  Commands:
  /start - Begin using the bot
  /create - Create a new workflow
  /list - List your existing workflows
  /help - Show this help message
  
  Simply use /create to start building a workflow, and I'll guide you through the process step by step.
  `;
  
  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// List workflows command (placeholder)
bot.onText(/\/list/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, '📋 Your workflows will be listed here. (Feature coming soon)');
});

console.log('N8N Agent Bot is running...');