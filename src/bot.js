// User API key management
const userApiKeys = new Map();

bot.onText(/\/apikey (add|update|remove)\s+@?(\w+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const action = match[1];
  const username = match[2];
  const fromUser = msg.from.username;

  // Admin check
  if (!admins.has(fromUser)) {
    bot.sendMessage(chatId, 'You must be an admin to manage API keys.');
    return;
  }

  if (action === 'add' || action === 'update') {
    bot.sendMessage(chatId, `Please send the API key value for @${username} in the next message.`);
    userApiKeys.set(`expect-api-key-${username}`, true);
  } else if (action === 'remove') {
    userApiKeys.delete(username);
    bot.sendMessage(chatId, `Removed API key for @${username}.`);
  } else {
    bot.sendMessage(chatId, 'Invalid action. Use add, update, or remove.');
  }
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;
  const text = msg.text;

  const expectKey = [...userApiKeys.entries()].find(([key]) => key === `expect-api-key-${username}`);

  if (expectKey && text && !text.startsWith('/')) {
    userApiKeys.set(username, text);
    userApiKeys.delete(`expect-api-key-${username}`);
    bot.sendMessage(chatId, `Stored API key for @${username} successfully.`);
  }
});
