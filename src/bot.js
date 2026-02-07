const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Bot token from Telegram
const token = '7604717632:AAGSdQjNqLMpsE-Xpk4VNe12CcP3jB-OX1w';

// N8N server configuration (you'll need to update this)
const N8N_SERVER_URL = process.env.N8N_SERVER_URL; // Set this as an environment variable
const N8N_API_KEY = process.env.N8N_API_KEY; // Set this as an environment variable
// OpenAI API key embedded directly in the code
const OPENAI_API_KEY = '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';

// Create bot instance
const bot = new TelegramBot(token, { polling: true });

// Store user sessions
const userSessions = {};

// Track voice mode for users
const voiceModeUsers = new Set();

// Predefined API options are removed as N8N-related workflow creation is no longer needed
const apiOptions = [];

// Start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  const welcomeMessage = `
  🤖 Welcome to the N8N Agent Bot!
  
  I am here to chat, help create documents, talk using your voice, and assist you with AI.
  
  Use the buttons below or commands at any time:
  
  - /start
  - /voice
  - /doc
  - /ai
  - /help
  `;
  
  // Persistent keyboard with buttons
  const keyboard = {
    keyboard: [
      [{ text: '/start' }, { text: '/voice' }],
      [{ text: '/doc' }, { text: '/ai' }],
      [{ text: '/help' }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
  
  bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
});

// Voice toggle command
bot.onText(/\/voice/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  if (voiceModeUsers.has(userId)) {
    voiceModeUsers.delete(userId);
    bot.sendMessage(chatId, '🔇 Voice mode disabled. I will now respond with text only.');
  } else {
    voiceModeUsers.add(userId);
    bot.sendMessage(chatId, '🔊 Voice mode enabled. I will now respond with your voice when possible.');
  }
});

// Document creation command
bot.onText(/\/doc (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const docContent = match[1];
  
  // Create a simple text document
  const docPath = `/tmp/response_${chatId}_${Date.now()}.txt`;
  fs.writeFileSync(docPath, docContent);
  
  // Send the document back to the user
  bot.sendDocument(chatId, docPath).then(() => {
    // Clean up the temporary file after sending
    fs.unlinkSync(docPath);
  });
});

// Document creation command without content
bot.onText(/\/doc/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, '📝 Please provide content for the document. Usage: /doc your content here');
});

// AI conversation command
bot.onText(/\/ai (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userQuery = match[1];
  
  bot.sendMessage(chatId, '🤖 Thinking...');
  
  try {
    const response = await getConversationalAIResponse(userQuery);
    await sendResponseWithPotentialVoice(chatId, response);
  } catch (error) {
    console.error('Error in AI conversation:', error);
    bot.sendMessage(chatId, '❌ Sorry, I had trouble processing your request.');
  }
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

  // Commands are handled separately
  if (text.startsWith('/')) {
    return;
  }

  bot.sendMessage(chatId, '🤖 Thinking...');

  try {
    // Respond conversationally using AI
    const response = await getConversationalAIResponse(text);
    await sendResponseWithPotentialVoice(chatId, response);
  } catch (error) {
    console.error('Error processing message:', error);
    const fallbackResponse = "I'm sorry, I had trouble processing your request. You can try /ai followed by your question for direct AI assistance.";
    await sendResponseWithPotentialVoice(chatId, fallbackResponse);
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

// Function to get conversational AI response (more human-like responses)
async function getConversationalAIResponse(userInput) {
  if (!OPENAI_API_KEY) {
    return "I'm sorry, but I need an OpenAI API key to provide conversational responses.";
  }

  try {
    // Enhanced system prompt to make responses more helpful and conversational
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4', // Using GPT-4 for better intelligence
      messages: [
        {
          role: 'system',
          content: `You are an exceptionally helpful, intelligent, and conversational AI assistant. 
          You engage in natural, friendly conversations while providing accurate and useful information.
          Your responses should be:
          - Clear and informative
          - Friendly and approachable
          - Concise but thorough
          - Helpful in solving the user's actual problem
          - Context-aware of the conversation
          - Proactive in suggesting solutions when appropriate
          
          Always aim to be as helpful as possible, similar to how a knowledgeable human assistant would respond.
          Take initiative to understand the user's real intent and provide the most valuable response.`
        },
        {
          role: 'user',
          content: userInput
        }
      ],
      temperature: 0.7, // Higher temperature for more natural responses
      max_tokens: 500, // Increased for more detailed responses
      presence_penalty: 0.6, // Encourage talking about new topics
      frequency_penalty: 0.5 // Reduce repetitive responses
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error getting conversational AI response:', error.message);
    return "I'm sorry, I had trouble processing your request. Could you try rephrasing?";
  }
}

// Function to send response with potential voice output
async function sendResponseWithPotentialVoice(chatId, text) {
  const userId = chatId; // Using chatId as userId for simplicity
  
  if (voiceModeUsers.has(userId)) {
    // In a real implementation, this would use your voice sample
    // For now, we'll send both text and indicate voice would be used
    await bot.sendMessage(chatId, `🗣️ *Voice Response:* ${text}`, { parse_mode: 'Markdown' });
    
    // In the future, this would generate audio using your voice sample
    // and send it as a voice message
  } else {
    await bot.sendMessage(chatId, text);
  }
}

// Function to analyze user request with AI and determine workflow components
async function analyzeUserRequest(userInput) {
  if (!OPENAI_API_KEY) {
    // Fallback to simple parsing if no OpenAI key
    return simpleParseRequest(userInput);
  }

  try {
    // Enhanced analysis with better context understanding
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4', // Using GPT-4 for better understanding
      messages: [
        {
          role: 'system',
          content: `You are an expert at interpreting user requests for automation and workflow creation. 
          Analyze the user's request and return a JSON object with the following structure:
          {
            "api_choice": "one of: openai, gemini, claude, elevenlabs, whatsapp, telegram, email, custom, or null if it's just a general question",
            "action_description": "what the automation should do",
            "trigger_type": "schedule, webhook, manual, or other appropriate trigger, or null if it's just a general question",
            "trigger_details": "specifics about the trigger (e.g., schedule time, webhook path), or null if it's just a general question",
            "additional_params": "any additional parameters needed for the workflow",
            "intent": "either 'workflow_creation' if clearly requesting automation, or 'general_question' if asking for information or help"
          }
          
          Examples:
          - Input: "Send me a daily summary of my sales at 9am" → 
            {api_choice: "email", action_description: "send daily sales summary", trigger_type: "schedule", trigger_details: "daily at 9am", additional_params: {}, intent: "workflow_creation"}
            
          - Input: "Notify me on Telegram when someone fills out my form" →
            {api_choice: "telegram", action_description: "send notification when form filled", trigger_type: "webhook", trigger_details: "form submission webhook", additional_params: {}, intent: "workflow_creation"}
            
          - Input: "How are you?" →
            {api_choice: null, action_description: "general greeting", trigger_type: null, trigger_details: null, additional_params: {}, intent: "general_question"}
            
          Be concise and accurate. Only return the JSON object.`
        },
        {
          role: 'user',
          content: userInput
        }
      ],
      temperature: 0.3, // Lower temperature for consistent, factual responses
      max_tokens: 400
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });

    const content = response.data.choices[0].message.content.trim();
    // Extract JSON from response (in case it includes additional text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      // Fallback to simple parsing if AI didn't return JSON
      return simpleParseRequest(userInput);
    }
  } catch (error) {
    console.error('Error analyzing user request with AI:', error.message);
    // Fallback to simple parsing
    return simpleParseRequest(userInput);
  }
}

// Simple fallback parser when AI is not available
function simpleParseRequest(userInput) {
  const lowerInput = userInput.toLowerCase();
  
  // Determine API based on keywords
  let apiChoice = 'custom';
  if (lowerInput.includes('openai') || lowerInput.includes('chatgpt') || lowerInput.includes('gpt')) {
    apiChoice = 'openai';
  } else if (lowerInput.includes('gemini') || lowerInput.includes('google')) {
    apiChoice = 'gemini';
  } else if (lowerInput.includes('claude') || lowerInput.includes('anthropic')) {
    apiChoice = 'claude';
  } else if (lowerInput.includes('whatsapp')) {
    apiChoice = 'whatsapp';
  } else if (lowerInput.includes('telegram') || lowerInput.includes('notification')) {
    apiChoice = 'telegram';
  } else if (lowerInput.includes('email') || lowerInput.includes('gmail')) {
    apiChoice = 'email';
  } else if (lowerInput.includes('eleven') || lowerInput.includes('voice') || lowerInput.includes('tts')) {
    apiChoice = 'elevenlabs';
  }
  
  // Determine trigger type
  let triggerType = 'manual';
  let triggerDetails = 'manual trigger';
  if (lowerInput.includes('daily') || lowerInput.includes('every day') || lowerInput.includes('day at')) {
    triggerType = 'schedule';
    triggerDetails = 'daily';
  } else if (lowerInput.includes('hourly') || lowerInput.includes('every hour')) {
    triggerType = 'schedule';
    triggerDetails = 'hourly';
  } else if (lowerInput.includes('when') || lowerInput.includes('webhook') || lowerInput.includes('form') || lowerInput.includes('submit')) {
    triggerType = 'webhook';
    triggerDetails = 'webhook trigger';
  }
  
  return {
    api_choice: apiChoice,
    action_description: userInput,
    trigger_type: triggerType,
    trigger_details: triggerDetails,
    additional_params: {}
  };
}

// Function to construct N8N workflow based on AI analysis
function constructWorkflow(session) {
  const analysis = session.analysis || { api_choice: 'custom', action_description: 'default action', trigger_type: 'manual' };
  
  // Determine the appropriate N8N node based on the AI analysis
  let triggerNode, actionNode;
  
  switch(analysis.api_choice) {
    case 'openai':
      triggerNode = createTriggerNode(analysis.trigger_type, analysis.trigger_details);
      
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
      triggerNode = createTriggerNode(analysis.trigger_type, analysis.trigger_details);
      
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
      triggerNode = createTriggerNode(analysis.trigger_type, analysis.trigger_details);
      
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
            text: { body: analysis.action_description }
          })
        }
      };
      break;
      
    case 'telegram':
      triggerNode = createTriggerNode(analysis.trigger_type, analysis.trigger_details);
      
      actionNode = {
        id: "telegram-node",
        name: "Telegram",
        type: "n8n-nodes-base.telegram",
        position: [460, 300],
        parameters: {
          operation: "sendMessage",
          chatId: "YOUR_TELEGRAM_CHAT_ID", // This would be configured
          text: analysis.action_description
        }
      };
      break;
      
    case 'email':
      triggerNode = createTriggerNode(analysis.trigger_type, analysis.trigger_details);
      
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
          text: analysis.action_description
        }
      };
      break;
      
    default:
      // Default for other APIs
      triggerNode = createTriggerNode(analysis.trigger_type, analysis.trigger_details);
      
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
    name: `AI-Generated: ${analysis.api_choice} - ${analysis.action_description.substring(0, 30)}`,
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

// Helper function to create trigger nodes based on type
function createTriggerNode(triggerType, triggerDetails) {
  switch(triggerType) {
    case 'schedule':
      return {
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
    case 'webhook':
      return {
        id: "webhook-trigger",
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        position: [240, 300],
        parameters: {
          httpMethod: "POST",
          path: `webhook-${Date.now() % 10000}`,
          responseMode: "lastNode",
          responseData: "allEntries"
        }
      };
    default:
      return {
        id: "manual-trigger",
        name: "Manual Trigger",
        type: "n8n-nodes-base.manualTrigger",
        position: [240, 300],
        parameters: {}
      };
  }
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