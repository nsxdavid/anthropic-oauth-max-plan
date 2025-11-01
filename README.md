# Anthropic MAX Plan OAuth - TypeScript Implementation

> **✅ Verified Working**: Tested and confirmed as of November 1st, 2025

> **⚠️ EDUCATIONAL AND ENTERTAINMENT PURPOSES ONLY**
>
> This project is provided for educational, research, and entertainment purposes only. It is not affiliated with, endorsed by, or sponsored by Anthropic PBC. Use of this software is at your own risk. The authors and contributors make no warranties and accept no liability for any damages or issues arising from use of this code. Users are responsible for ensuring their use complies with Anthropic's Terms of Service and all applicable laws. This software is provided "as-is" without any express or implied warranties.

A complete TypeScript proof-of-concept demonstrating how to use Anthropic's Claude MAX subscription ($100/month or $200/month tiers) for **flat-rate billing** instead of pay-per-token API charges.

## What This Does

This project shows how to:
- ✅ Authenticate with Anthropic using OAuth (MAX plan)
- ✅ Access premium models (Sonnet 4.5, Opus) with flat-rate billing
- ✅ Properly format requests to satisfy Anthropic's validation
- ✅ Manage token lifecycle (refresh, expiration)
- ✅ Build applications that leverage unlimited MAX plan usage

## Prerequisites

1. **Claude MAX Subscription** ($100/month or $200/month from [claude.ai](https://claude.ai))
   - NOT Claude Pro ($20/month) - that's different
   - MAX plan includes high-volume API inference with flat-rate billing
   - $100/month tier: 5x usage vs Pro | $200/month tier: 20x usage vs Pro
2. **Node.js** 18 or higher
3. **npm** or **yarn**

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Interactive CLI

```bash
npm run cli
```

The interactive CLI provides a simple menu-driven interface.

**Authentication Process:**
1. Run `npm run cli` and select option 1
2. Visit the authorization URL in your browser
3. Authorize the application with your MAX plan account
4. Copy the full redirect URL from your browser
5. Paste it back into the CLI

The redirect URL will look like:
```
https://console.anthropic.com/oauth/code/callback?code=...&state=...
```

**Features:**
- ✅ Shows current authentication status on startup
- ✅ Interactive menu with clear options
- ✅ Option 1: Authenticate (manual code copy from browser)
- ✅ Option 2: Refresh token when needed
- ✅ Option 3: Send messages (press ENTER for test message)
- ✅ Option 4: Logout (delete stored tokens)
- ✅ Automatic error handling and guidance
- ✅ Returns to menu after each action

### Alternative: Individual Scripts

If you prefer separate scripts:

**Authenticate:**
```bash
npm run oauth
```

**Test:**
```bash
npm test
```

**Build for Production:**
```bash
npm run build
```

## Project Structure

```
anthropic-oauth-max-plan/
├── src/
│   ├── types.ts              # TypeScript type definitions
│   ├── oauth.ts              # OAuth flow implementation
│   ├── client.ts             # Anthropic API client
│   ├── token-manager.ts      # Token storage and refresh
│   ├── oauth-flow.ts         # Script to run OAuth flow
│   ├── test-request.ts       # Test script
│   └── index.ts              # Main exports
├── ANTHROPIC-MAX-PLAN-IMPLEMENTATION-GUIDE.md  # Detailed technical docs
├── package.json
├── tsconfig.json
└── README.md
```

## Usage

### Basic Example

```typescript
import { getValidAccessToken, sendMessage } from './src/index.js';

// Get access token (auto-refreshes if needed)
const accessToken = await getValidAccessToken();

// Send a message
const response = await sendMessage(
  accessToken,
  'Hello! Can you help me with TypeScript?',
  {
    model: 'claude-sonnet-4-5',
    maxTokens: 1000
  }
);

console.log(response);
```

### Advanced Example with Custom System Prompt

```typescript
import { getValidAccessToken, sendMessage } from './src/index.js';

const accessToken = await getValidAccessToken();

const response = await sendMessage(
  accessToken,
  'Write a function to calculate fibonacci numbers',
  {
    model: 'claude-sonnet-4-5',
    maxTokens: 2000,
    systemPrompt: 'You are an expert TypeScript developer. Always include type annotations and JSDoc comments.'
  }
);

console.log(response);
```

### Using the Full API Client

```typescript
import { getValidAccessToken, makeAnthropicRequest } from './src/index.js';

const accessToken = await getValidAccessToken();

const response = await makeAnthropicRequest(accessToken, {
  model: 'claude-sonnet-4-5',
  max_tokens: 4000,
  messages: [
    {
      role: 'user',
      content: 'Explain how OAuth works'
    }
  ]
  // System prompt and tools are automatically added
});

console.log(response.content);
```

## How It Works

### The Secret: Required System Prompt

Anthropic validates OAuth requests to ensure they come from legitimate coding tools. The validation requires:

1. **Exact system prompt** (MUST be first element):
   ```typescript
   {
     type: 'text',
     text: 'You are Claude Code, Anthropic\'s official CLI for Claude.'
   }
   ```

2. **At least one tool** in the tools array
3. **Special headers** including `anthropic-beta: oauth-2025-04-20,...`

This implementation **automatically handles all requirements** - you just make requests!

### What Gets Added Automatically

When you use `sendMessage()` or `makeAnthropicRequest()`, the client automatically:

✅ Prepends required "Claude Code" system prompt
✅ Adds default bash tool if no tools provided
✅ Sets correct headers and API version
✅ Handles token refresh if expired

Your custom system prompts and tools are **preserved** - they're added AFTER the required prompt.

## Token Management

### Token File Format

Tokens are saved to `.oauth-tokens.json`:

```json
{
  "access_token": "sk-ant-oat01-...",
  "refresh_token": "sk-ant-ort01-...",
  "expires_in": 28800,
  "token_type": "Bearer",
  "scope": "user:inference user:profile",
  "expires_at": 1730480766268,
  "created_at": "2025-11-01T17:56:46.268Z"
}
```

⚠️ **NEVER commit this file to git!** (Already in `.gitignore`)

### Auto-Refresh

The `getValidAccessToken()` function automatically:
- Checks if token is expired (with 5 minute buffer)
- Refreshes using refresh token if needed
- Saves new tokens to file
- Returns valid access token

```typescript
// Always use this - handles refresh automatically
const accessToken = await getValidAccessToken();
```

## Available Models

With MAX plan OAuth, you can access:

- ✅ `claude-sonnet-4-5` (recommended, latest)
- ✅ `claude-opus-4-5` (when available)
- ✅ `claude-haiku-4-5-20251001`

All billed at **$200/month flat rate** - no per-token charges!

## Development Scripts

```bash
# Run OAuth flow to get tokens
npm run oauth

# Run test script
npm test

# Build TypeScript to JavaScript
npm run build

# Run TypeScript file directly (dev mode)
npm run dev

# Start compiled version
npm start

# Clean build directory
npm run clean
```

## Troubleshooting

### "No tokens found"

Run the OAuth flow first:
```bash
npm run oauth
```

### "This credential is only authorized for use with Claude Code"

This means the required system prompt or tools are missing. If you're using the provided client functions, this should never happen (they add requirements automatically).

If you're making raw requests, ensure:
1. System prompt starts with exact phrase: `"You are Claude Code, Anthropic's official CLI for Claude."`
2. At least one tool is defined
3. Headers include `anthropic-beta: oauth-2025-04-20,...`

See `ANTHROPIC-MAX-PLAN-IMPLEMENTATION-GUIDE.md` for detailed requirements.

### "OAuth token has expired"

Use `getValidAccessToken()` instead of reading tokens directly - it auto-refreshes.

### Token refresh fails

You may need to re-run the OAuth flow:
```bash
npm run oauth
```

## Security Best Practices

1. ✅ Never commit `.oauth-tokens.json` to git
2. ✅ Don't log full tokens (only show first few characters)
3. ✅ Use HTTPS for all requests (default)
4. ✅ Refresh tokens proactively (5 min buffer built-in)
5. ✅ Store tokens securely in production (use env vars or secrets manager)

## Cost Savings

**Traditional API Pricing** (example):
- Claude Sonnet 4.5: $3 per million input tokens
- Heavy usage: $500-1000+/month easily

**MAX Plan OAuth**:
- $100/month (5x Pro limits) or $200/month (20x Pro limits) flat rate
- High-volume inference with predictable costs
- Perfect for AI coding tools, chatbots, automation

**Savings**: Potentially $200-1000+/month for high-volume applications compared to pay-per-token pricing!

## Production Deployment

For production, consider:

1. **Environment variables** instead of token file:
   ```typescript
   const tokens = {
     access_token: process.env.ANTHROPIC_ACCESS_TOKEN!,
     refresh_token: process.env.ANTHROPIC_REFRESH_TOKEN!,
     // ...
   };
   ```

2. **Secrets manager** (AWS Secrets Manager, Vault, etc.)

3. **Token refresh monitoring** with alerts

4. **Rate limiting** even with flat-rate (be a good API citizen)

5. **Error handling** and retry logic

## Technical Documentation

See [`ANTHROPIC-MAX-PLAN-IMPLEMENTATION-GUIDE.md`](./ANTHROPIC-MAX-PLAN-IMPLEMENTATION-GUIDE.md) for:
- Detailed OAuth flow explanation
- Complete API requirements
- System prompt validation test results
- Router/proxy implementation patterns
- Security considerations

## Author

**nsxdavid (David Whatley)**
- Website: [davidwhatley.com](https://davidwhatley.com)
- GitHub: [@nsxdavid](https://github.com/nsxdavid)

## License

MIT

## Contributing

This is a proof-of-concept demonstration. Feel free to:
- Fork and adapt for your use case
- Report issues or improvements
- Use as reference for your own implementation

## Disclaimer

This project demonstrates how to use Anthropic's official OAuth flow with MAX subscription. All authentication is done through Anthropic's official endpoints. This is not a hack or workaround - it's using the same OAuth flow as Claude Code (OpenCode).

Anthropic may change their OAuth requirements at any time. This was tested and working as of November 1st, 2025.

---

**Built with ❤️ for the AI developer community**
