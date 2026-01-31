#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WeChat Bot Example with Qwen Code Integration
 * 
 * This is a simple example showing how to integrate Qwen Code with WeChat.
 * For a complete implementation, see docs/examples/wechat-auto-reply.md
 */

import { WechatyBuilder } from 'wechaty';

// Simple example configuration
const BOT_CONFIG = {
  name: 'wechat-qwen-bot-example',
  puppet: 'wechaty-puppet-wechat4u',
};

/**
 * Generate a response using Qwen Code
 * Note: In production, use the Qwen API directly for better performance
 */
async function generateResponse(message, userName) {
  // This is a simplified example
  // In production, integrate with Qwen API as shown in the full documentation
  
  return `Hello ${userName}! This is a demo response. 
For production implementation, please refer to docs/examples/wechat-auto-reply.md
Your message was: ${message}`;
}

/**
 * Handle incoming messages
 */
async function onMessage(msg) {
  // Skip self messages
  if (msg.self()) return;
  
  const contact = msg.talker();
  const text = msg.text();
  
  console.log(`Received: ${text} from ${contact.name()}`);
  
  try {
    // Generate and send response
    const response = await generateResponse(text, contact.name());
    await contact.say(response);
    console.log('Response sent successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Main function to start the bot
 */
async function main() {
  console.log('Starting WeChat Bot Example...');
  console.log('For complete implementation, see: docs/examples/wechat-auto-reply.md');
  
  const bot = WechatyBuilder.build(BOT_CONFIG);

  bot
    .on('scan', (qrcode, status) => {
      console.log(`Scan QR Code: https://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`);
      console.log(`Status: ${status}`);
    })
    .on('login', user => {
      console.log(`✅ Logged in as: ${user.name()}`);
    })
    .on('message', onMessage)
    .on('error', error => {
      console.error('Bot error:', error);
    });

  await bot.start();
  console.log('Bot started! Scan QR code to login.');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

// Only run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { generateResponse, onMessage, main };
