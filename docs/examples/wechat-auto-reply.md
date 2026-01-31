# WeChat Auto-Reply Bot with Qwen Code

This guide shows you how to build an intelligent WeChat auto-reply bot powered by Qwen Code. The bot can understand user messages and generate intelligent responses using Qwen's powerful language models.

## Overview

This example demonstrates:
- Setting up a WeChat bot using Wechaty
- Integrating with Qwen Code API for intelligent responses
- Implementing auto-reply logic with context awareness
- Handling different message types and scenarios

## Prerequisites

Before you start, ensure you have:
- Node.js version 20 or higher installed
- Qwen Code installed (`npm install -g @qwen-code/qwen-code`)
- A WeChat account for testing
- Basic understanding of Node.js and async/await

## Installation

### 1. Create a New Project

```bash
mkdir wechat-qwen-bot
cd wechat-qwen-bot
npm init -y
```

### 2. Install Dependencies

```bash
npm install wechaty wechaty-puppet-wechat4u
npm install dotenv
```

### 3. Set Up Environment Variables

Create a `.env` file in your project root:

```env
# Qwen API Configuration (Choose one method)

# Option 1: Use Qwen OAuth (Recommended - Free 2000 requests/day)
# Just run 'qwen' and authenticate via browser - no additional setup needed!

# Option 2: OpenAI-Compatible API
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_MODEL=qwen3-coder-plus

# Bot Configuration
BOT_NAME=小助手
REPLY_KEYWORDS=help,帮助,hi,hello
```

## Implementation

### Basic WeChat Auto-Reply Bot

Create a file named `wechat-bot.js`:

```javascript
#!/usr/bin/env node

/**
 * WeChat Auto-Reply Bot with Qwen Code Integration
 * This bot uses Qwen's AI models to generate intelligent responses
 */

import { WechatyBuilder } from 'wechaty';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const BOT_NAME = process.env.BOT_NAME || '小助手';
const REPLY_KEYWORDS = (process.env.REPLY_KEYWORDS || 'help,帮助').split(',');

/**
 * Generate AI response using Qwen Code
 * @param {string} message - User's message
 * @param {string} userName - Name of the user
 * @returns {Promise<string>} - AI-generated response
 */
async function generateQwenResponse(message, userName) {
  try {
    // Use Qwen Code via command line for generating responses
    // Note: This requires Qwen Code to be installed and configured
    const prompt = `You are a helpful WeChat assistant named ${BOT_NAME}. 
A user named ${userName} sent you this message: "${message}"
Please provide a helpful, friendly, and concise response in Chinese if the message is in Chinese, otherwise respond in English.
Keep your response under 100 words.`;

    // Execute qwen command with the prompt
    // In production, you would use the Qwen API directly
    const response = execSync(
      `echo "${prompt.replace(/"/g, '\\"')}" | qwen --yolo --no-stream`,
      { 
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30000
      }
    );
    
    return response.trim() || '抱歉，我暂时无法回复。请稍后再试。';
  } catch (error) {
    console.error('Error generating Qwen response:', error.message);
    return '抱歉，我遇到了一些问题。请稍后再试。';
  }
}

/**
 * Check if message contains keywords that trigger auto-reply
 * @param {string} message - Message text
 * @returns {boolean}
 */
function shouldReply(message) {
  const lowerMessage = message.toLowerCase();
  return REPLY_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );
}

/**
 * Handle incoming messages
 */
async function onMessage(msg) {
  const contact = msg.talker();
  const text = msg.text();
  const isRoom = msg.room();
  
  // Skip messages from self
  if (msg.self()) {
    return;
  }
  
  console.log(`Received message from ${contact.name()}: ${text}`);
  
  // Handle room messages (group chats)
  if (isRoom) {
    const room = await msg.room();
    const topic = await room.topic();
    const isMentioned = await msg.mentionSelf();
    
    // Only reply when mentioned in group
    if (isMentioned) {
      console.log(`Mentioned in group ${topic}, generating response...`);
      const response = await generateQwenResponse(text, contact.name());
      await msg.say(response);
    }
    return;
  }
  
  // Handle direct messages
  if (shouldReply(text) || text.includes(BOT_NAME)) {
    console.log('Generating AI response...');
    const response = await generateQwenResponse(text, contact.name());
    await contact.say(response);
  }
}

/**
 * Initialize and start the bot
 */
async function main() {
  console.log('Starting WeChat Auto-Reply Bot with Qwen Code...');
  
  const bot = WechatyBuilder.build({
    name: 'wechat-qwen-bot',
    puppet: 'wechaty-puppet-wechat4u',
  });

  bot
    .on('scan', (qrcode, status) => {
      console.log(`Scan QR Code to login: https://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`);
      console.log(`Status: ${status}`);
    })
    .on('login', user => {
      console.log(`✅ User ${user.name()} logged in`);
    })
    .on('message', onMessage)
    .on('logout', user => {
      console.log(`User ${user.name()} logged out`);
    })
    .on('error', error => {
      console.error('Bot error:', error);
    });

  try {
    await bot.start();
    console.log('Bot started successfully!');
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down bot...');
  process.exit(0);
});

// Start the bot
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

### Advanced Implementation with API Integration

For production use, create a more robust implementation with direct API integration:

Create `wechat-bot-advanced.js`:

```javascript
#!/usr/bin/env node

/**
 * Advanced WeChat Auto-Reply Bot with Direct Qwen API Integration
 */

import { WechatyBuilder } from 'wechaty';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'qwen3-coder-plus';
const BOT_NAME = process.env.BOT_NAME || '小助手';

// Conversation history management (in-memory)
const conversationHistory = new Map();
const MAX_HISTORY_LENGTH = 10;

/**
 * Generate AI response using Qwen API directly
 */
async function generateQwenResponse(message, userId, userName) {
  try {
    // Get or initialize conversation history
    if (!conversationHistory.has(userId)) {
      conversationHistory.set(userId, []);
    }
    
    const history = conversationHistory.get(userId);
    
    // Add user message to history
    history.push({
      role: 'user',
      content: message
    });
    
    // Keep only last MAX_HISTORY_LENGTH messages
    if (history.length > MAX_HISTORY_LENGTH * 2) {
      history.splice(0, history.length - MAX_HISTORY_LENGTH * 2);
    }
    
    // Prepare messages with system prompt
    const messages = [
      {
        role: 'system',
        content: `You are ${BOT_NAME}, a helpful and friendly WeChat assistant. Provide concise, helpful responses. Respond in the same language as the user's message.`
      },
      ...history
    ];
    
    // Call Qwen API
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Add AI response to history
    history.push({
      role: 'assistant',
      content: aiResponse
    });
    
    return aiResponse;
  } catch (error) {
    console.error('Error generating Qwen response:', error);
    return '抱歉，我遇到了一些问题。请稍后再试。(Sorry, I encountered an issue. Please try again later.)';
  }
}

/**
 * Handle incoming messages
 */
async function onMessage(msg) {
  const contact = msg.talker();
  const text = msg.text();
  const isRoom = msg.room();
  
  if (msg.self()) return;
  
  console.log(`📨 Message from ${contact.name()}: ${text}`);
  
  try {
    // Handle group messages
    if (isRoom) {
      const isMentioned = await msg.mentionSelf();
      if (isMentioned) {
        const room = await msg.room();
        const topic = await room.topic();
        console.log(`🎯 Mentioned in ${topic}, generating response...`);
        
        const response = await generateQwenResponse(
          text,
          `${room.id}_${contact.id()}`,
          contact.name()
        );
        await msg.say(response);
      }
      return;
    }
    
    // Handle direct messages - auto reply to all
    console.log('💬 Generating AI response...');
    const response = await generateQwenResponse(
      text,
      contact.id,
      contact.name()
    );
    await contact.say(response);
    console.log(`✅ Sent response to ${contact.name()}`);
  } catch (error) {
    console.error('Error handling message:', error);
  }
}

/**
 * Clear old conversation histories periodically
 */
function cleanupHistories() {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour
  
  for (const [userId, history] of conversationHistory.entries()) {
    if (history.length === 0 || (now - history.lastAccess > maxAge)) {
      conversationHistory.delete(userId);
    }
  }
}

// Clean up every 30 minutes
setInterval(cleanupHistories, 30 * 60 * 1000);

/**
 * Initialize and start the bot
 */
async function main() {
  if (!OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY not set in environment variables');
    console.log('Please set up your API key or use Qwen OAuth authentication');
    process.exit(1);
  }
  
  console.log('🚀 Starting WeChat Auto-Reply Bot with Qwen Code...');
  console.log(`📝 Using model: ${OPENAI_MODEL}`);
  console.log(`🤖 Bot name: ${BOT_NAME}`);
  
  const bot = WechatyBuilder.build({
    name: 'wechat-qwen-bot-advanced',
    puppet: 'wechaty-puppet-wechat4u',
  });

  bot
    .on('scan', (qrcode, status) => {
      console.log(`📱 Scan QR Code: https://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`);
    })
    .on('login', user => {
      console.log(`✅ Logged in as ${user.name()}`);
    })
    .on('message', onMessage)
    .on('logout', user => {
      console.log(`👋 ${user.name()} logged out`);
    })
    .on('error', error => {
      console.error('❌ Bot error:', error);
    });

  await bot.start();
  console.log('✨ Bot is running!');
}

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
```

## Usage

### Running the Bot

#### Option 1: Basic Version (Using CLI)

```bash
node wechat-bot.js
```

This version uses the Qwen Code CLI directly. Make sure `qwen` is installed and configured.

#### Option 2: Advanced Version (Direct API)

```bash
node wechat-bot-advanced.js
```

This version uses the Qwen API directly for better performance and conversation management.

### Scanning QR Code

1. When you start the bot, a QR code URL will be displayed in the console
2. Open the URL in your browser or scan it with WeChat
3. Once scanned, the bot will log in and start responding to messages

### Testing the Bot

1. **Direct Message Test**: Send a message containing "help" or "hi" to the bot
2. **Group Chat Test**: Mention the bot in a group chat by typing `@BotName` followed by your message
3. **Conversation Test**: Have a multi-turn conversation to test context awareness

## Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | Your Qwen API key | - | Yes (for advanced version) |
| `OPENAI_BASE_URL` | API endpoint URL | dashscope URL | No |
| `OPENAI_MODEL` | Model to use | qwen3-coder-plus | No |
| `BOT_NAME` | Bot display name | 小助手 | No |
| `REPLY_KEYWORDS` | Keywords triggering reply | help,帮助 | No |

### Customization

#### Custom Response Logic

You can customize the bot's behavior by modifying the system prompt:

```javascript
const systemPrompt = `You are ${BOT_NAME}, a WeChat assistant.
Your personality: friendly, helpful, and professional.
Guidelines:
- Respond in the same language as the user
- Keep responses under 100 words
- Be polite and respectful
- If you don't know something, admit it`;
```

#### Keyword Filters

Add custom filters to control when the bot responds:

```javascript
function shouldReply(message, contact) {
  // Don't reply to messages from specific users
  if (BLOCKED_USERS.includes(contact.id)) {
    return false;
  }
  
  // Only reply during business hours
  const hour = new Date().getHours();
  if (hour < 9 || hour > 18) {
    return false;
  }
  
  // Check for keywords
  return REPLY_KEYWORDS.some(kw => message.includes(kw));
}
```

## Best Practices

### 1. Rate Limiting

Implement rate limiting to avoid overwhelming users or hitting API limits:

```javascript
const rateLimiter = new Map();
const RATE_LIMIT = 5; // messages per minute

function checkRateLimit(userId) {
  const now = Date.now();
  const userLog = rateLimiter.get(userId) || [];
  
  // Remove entries older than 1 minute
  const recentMessages = userLog.filter(time => now - time < 60000);
  
  if (recentMessages.length >= RATE_LIMIT) {
    return false;
  }
  
  recentMessages.push(now);
  rateLimiter.set(userId, recentMessages);
  return true;
}
```

### 2. Error Handling

Always include proper error handling:

```javascript
async function safeGenerateResponse(message, userId, userName) {
  try {
    return await generateQwenResponse(message, userId, userName);
  } catch (error) {
    console.error('Error:', error);
    return '抱歉，我暂时无法回复。';
  }
}
```

### 3. Logging

Implement comprehensive logging for debugging:

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 4. Privacy & Security

- Never log sensitive user information
- Implement data retention policies
- Clear conversation histories after a certain period
- Use environment variables for all secrets
- Never commit API keys to version control

## Troubleshooting

### Common Issues

#### Bot Not Responding

**Problem**: Bot receives messages but doesn't respond

**Solutions**:
- Check if Qwen Code is properly configured: `qwen --version`
- Verify API credentials in `.env` file
- Check console logs for error messages
- Ensure network connectivity

#### QR Code Scan Fails

**Problem**: Cannot scan QR code to log in

**Solutions**:
- Try a different WeChat puppet: `wechaty-puppet-padlocal`
- Update Wechaty to latest version: `npm update wechaty`
- Check WeChat account status

#### API Rate Limits

**Problem**: Hitting API rate limits

**Solutions**:
- Implement rate limiting (see Best Practices)
- Use caching for common responses
- Switch to a higher-tier API plan
- Optimize prompt length to reduce token usage

#### Memory Issues

**Problem**: Bot crashes with out-of-memory errors

**Solutions**:
- Implement conversation history cleanup
- Limit history length per user
- Use Redis or database for history storage
- Restart bot periodically

## Advanced Features

### 1. Multi-Language Support

```javascript
const LANGUAGE_MAP = {
  'zh': 'Chinese',
  'en': 'English',
  'ja': 'Japanese'
};

function detectLanguage(text) {
  // Simple language detection
  if (/[\u4e00-\u9fa5]/.test(text)) return 'zh';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  return 'en';
}
```

### 2. Rich Media Support

```javascript
async function onMessage(msg) {
  const msgType = msg.type();
  
  switch (msgType) {
    case bot.Message.Type.Image:
      const fileBox = await msg.toFileBox();
      // Process image with vision model
      break;
      
    case bot.Message.Type.Audio:
      // Convert audio to text, then respond
      break;
      
    case bot.Message.Type.Video:
      await msg.say('视频收到了！我会尽快处理。');
      break;
  }
}
```

### 3. Command System

```javascript
const COMMANDS = {
  '/help': () => '可用命令:\n/help - 显示帮助\n/status - 查看状态',
  '/status': () => `运行时间: ${process.uptime()}秒`,
  '/clear': (userId) => {
    conversationHistory.delete(userId);
    return '对话历史已清除';
  }
};

async function handleCommand(msg, text) {
  const [command, ...args] = text.split(' ');
  const handler = COMMANDS[command];
  
  if (handler) {
    const response = handler(msg.talker().id, ...args);
    await msg.say(response);
    return true;
  }
  return false;
}
```

## Production Deployment

### Using PM2

Install PM2 for process management:

```bash
npm install -g pm2
```

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'wechat-qwen-bot',
    script: './wechat-bot-advanced.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

Start the bot:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

CMD ["node", "wechat-bot-advanced.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  wechat-bot:
    build: .
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - ./data:/app/data
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

Run with Docker:

```bash
docker-compose up -d
```

## Contributing

We welcome contributions! Please feel free to submit issues or pull requests.

## License

This example is provided under the same license as Qwen Code. See the LICENSE file for details.

## Resources

- [Qwen Code Documentation](https://github.com/QwenLM/qwen-code)
- [Wechaty Documentation](https://wechaty.js.org/)
- [Qwen Models](https://github.com/QwenLM/Qwen3-Coder)
- [OpenAI Compatible API](https://help.aliyun.com/zh/dashscope/developer-reference/compatibility-of-openai-with-dashscope)

## Support

If you encounter any issues or have questions:
- Check the [Troubleshooting](#troubleshooting) section
- Open an issue on [GitHub](https://github.com/QwenLM/qwen-code/issues)
- Join our community discussions
