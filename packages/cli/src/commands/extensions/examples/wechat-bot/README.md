# WeChat Auto-Reply Bot Extension

This extension provides guidance and context for building WeChat auto-reply bots with Qwen Code.

## Quick Start

To create a WeChat bot with Qwen Code:

1. Install dependencies:
   ```bash
   npm install wechaty wechaty-puppet-wechat4u dotenv
   ```

2. Create your bot following the [comprehensive guide](../../../../../../../../docs/examples/wechat-auto-reply.md)

3. Configure your environment variables for API access

4. Run your bot and scan the QR code to log in

## Features

- **Intelligent Responses**: Use Qwen's powerful language models for natural conversations
- **Multi-Language Support**: Automatically detect and respond in the user's language
- **Conversation Context**: Maintain conversation history for contextual responses
- **Group Chat Support**: Respond when mentioned in group chats
- **Customizable Triggers**: Define keywords and conditions for auto-replies

## Example Usage

```javascript
import { WechatyBuilder } from 'wechaty';
import { generateQwenResponse } from './qwen-api.js';

const bot = WechatyBuilder.build({
  name: 'my-wechat-bot',
  puppet: 'wechaty-puppet-wechat4u',
});

bot
  .on('message', async (msg) => {
    if (!msg.self()) {
      const response = await generateQwenResponse(msg.text());
      await msg.say(response);
    }
  })
  .start();
```

## Best Practices

1. **Rate Limiting**: Implement rate limiting to avoid overwhelming users
2. **Privacy**: Never log sensitive user information
3. **Error Handling**: Always include proper error handling and fallback responses
4. **Testing**: Test thoroughly in a development environment before production

## Resources

- [Complete Documentation](../../../../../../../../docs/examples/wechat-auto-reply.md)
- [Wechaty Documentation](https://wechaty.js.org/)
- [Qwen Models](https://github.com/QwenLM/Qwen3-Coder)
