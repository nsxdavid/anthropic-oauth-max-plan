# Anthropic MAX Plan OAuth

<div align="center">

![Anthropic MAX Plan OAuth](assets/screenshot.png)

*Educational proof-of-concept and practical tools for using Anthropic's Claude MAX Plan with OAuth authentication*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/Status-Verified%20Working-brightgreen.svg)](https://github.com/nsxdavid/anthropic-max-router)

</div>

---

## 🎯 Three Things in This Repository

### 🔧 **1. Interactive CLI** - Testing & Learning
A menu-driven tool to test OAuth flows, understand authentication, and experiment with API requests.
```bash
npm start
```

### 🚀 **2. API Router** - Production Ready
A standalone HTTP proxy that lets ANY AI tool use your MAX Plan subscription via `http://localhost:3000`.
```bash
npm run router
```

### 📚 **3. Implementation Guide** - Complete Documentation
Full technical documentation: OAuth PKCE flow, system prompt validation, token management, and API patterns.

[See ANTHROPIC-MAX-PLAN-IMPLEMENTATION-GUIDE.md](./ANTHROPIC-MAX-PLAN-IMPLEMENTATION-GUIDE.md)

---

## About This Repository

This repository provides **both practical tools and complete documentation** for using Anthropic's Claude MAX subscription plans with your own code.

**Why MAX Plan?** Flat-rate billing instead of pay-per-token. Perfect for high-volume AI development.

**Special thanks to [OpenCode](https://github.com/sst/opencode)** - studying its OAuth implementation made this project possible.

---

> **⚠️ EDUCATIONAL AND RESEARCH PURPOSES**
>
> This project is provided for educational, research, and entertainment purposes only. It is not affiliated with, endorsed by, or sponsored by Anthropic PBC. Use of this software is at your own risk. The authors and contributors make no warranties and accept no liability for any damages or issues arising from use of this code. Users are responsible for ensuring their use complies with Anthropic's Terms of Service and all applicable laws. This software is provided "as-is" without any express or implied warranties.

---

## Requirements

- **Claude MAX Subscription** from [claude.ai](https://claude.ai) - $100/month or $200/month plan
- **Node.js** 18+

---

## Quick Start

### Option 1: Run Directly with npx (No Install)

```bash
# Run the router directly from GitHub
npx github:nsxdavid/anthropic-max-router

# With options
npx github:nsxdavid/anthropic-max-router --help
npx github:nsxdavid/anthropic-max-router --port 8080
npx github:nsxdavid/anthropic-max-router --verbose
```

### Option 2: Clone and Run

```bash
# Clone the repository
git clone https://github.com/nsxdavid/anthropic-max-router
cd anthropic-max-router
npm install

# Run the router
npm run router

# OR run the interactive CLI
npm start
```

---

## 🔧 Interactive CLI

A menu-driven application for testing, learning, and debugging OAuth flows.

### Features
- 🔐 OAuth authentication with step-by-step guidance
- 🔄 Manual token refresh testing
- 💬 Interactive chat mode with Claude
- 🗑️ Token logout/management
- ✅ MAX Plan validation proof test

### Usage

```bash
npm start
```

You'll see an interactive menu:
```
╔════════════════════════════════════════════════════════════╗
║   Anthropic MAX Plan OAuth CLI                             ║
╚════════════════════════════════════════════════════════════╝

1. Authenticate (OAuth flow)
2. Refresh access token
3. Send a chat message
4. Logout (delete tokens)
5. Proof of MAX Plan validation
6. Exit
```

### When to Use the CLI
- 🧪 Testing OAuth flows
- 📖 Learning how authentication works
- 🐛 Debugging API requests
- 🔍 Understanding MAX Plan validation
- 📝 Experimenting with system prompts

### CLI Source Files
```
src/
├── cli.ts           # Interactive menu
├── oauth.ts         # OAuth PKCE flow
├── client.ts        # API client with validation
├── token-manager.ts # Token storage/refresh
└── types.ts         # TypeScript definitions
```

---

## 🚀 API Router

A standalone HTTP proxy server that lets **any AI tool or application** use your MAX Plan subscription. The only requirement is that the tool/app supports setting the Anthropic API base URL.  Most do. If the one you are trying to use this with does not, complain to them... they will probably fix it. :)

### How It Works

```
┌─────────────────────┐
│   Your AI Tool      │
│   (any application) │
└──────────┬──────────┘
           │ http://localhost:3000
           ▼
┌─────────────────────────────────────┐
│  Router (This Application)          │
│  ├─ OAuth authentication            │
│  ├─ System prompt injection         │
│  ├─ Token auto-refresh              │
│  └─ Request logging                 │
└──────────┬──────────────────────────┘
           │ Authenticated requests
           ▼
┌─────────────────────┐
│  Anthropic MAX API  │
│  (Flat-rate billing)│
└─────────────────────┘
```

### Features
- ✅ Automatic OAuth authentication on first run
- ✅ Transparent system prompt injection (required by Anthropic)
- ✅ Token auto-refresh (8-hour expiration handled automatically)
- ✅ Configurable logging levels
- ✅ Works with any tool that supports custom base URLs

### Basic Usage

```bash
# Start router (default: port 3000, medium verbosity)
npm run router

# With options
npm run router -- --port 8080              # Custom port
npm run router -- --verbose                # Full request/response logging
npm run router -- --minimal                # One line per request
npm run router -- --quiet                  # No request logging
npm run router -- -p 8080 --verbose        # Combine options
```

**First run:** Router prompts you to authenticate via OAuth. Follow the instructions.

**Subsequent runs:** Router starts immediately and auto-refreshes tokens.

### Command Line Options

| Option | Short | Description |
|--------|-------|-------------|
| `--help` | `-h` | Show help message |
| `--version` | `-v` | Show version number |
| `--port PORT` | `-p` | Set port (default: 3000) |
| `--quiet` | `-q` | No request logging |
| `--minimal` | `-m` | One line per request |
| (default) | | Medium verbosity - summary per request |
| `--verbose` | `-V` | Full request/response bodies |

**Environment variable:** `ROUTER_PORT=8080 npm run router`

### Verbosity Examples

**Minimal** (`-m`) - One line per request:
```
[10:30:45] ✓ 200 claude-sonnet-4-5 (in:28 out:19)
[10:31:12] ✓ 200 claude-sonnet-4-5 (in:300 out:500)
```

**Medium** (default) - Request summary:
```
[2025-11-02T10:30:45.123Z] [abc123] Incoming request
  Model: claude-sonnet-4-5
  Max tokens: 1000
  ✓ Injected required system prompt
  ✓ OAuth token validated
  → Forwarding to Anthropic API...
  ✓ Success (200)
  Tokens: input=28, output=19
```

**Verbose** (`-V`) - Full JSON request/response bodies for debugging.

**Quiet** (`-q`) - No request logging (only startup messages and errors).

### Router API Endpoints

**`POST /v1/messages`** - Main proxy endpoint (standard Anthropic API format)

**`GET /health`** - Health check
```bash
curl http://localhost:3000/health
# Returns: {"status":"ok","service":"anthropic-max-plan-router"}
```

### Testing the Router

Send a test request:

**PowerShell:**
```powershell
curl -X POST http://localhost:3000/v1/messages `
  -H "Content-Type: application/json" `
  -d '{"model":"claude-sonnet-4-5","max_tokens":50,"messages":[{"role":"user","content":"Say hello in one short sentence."}]}'
```

**Bash/Linux/Mac:**
```bash
curl -X POST http://localhost:3000/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4-5",
    "max_tokens": 50,
    "messages": [
      {"role": "user", "content": "Say hello in one short sentence."}
    ]
  }'
```

You should see the request logged in your router terminal and get a JSON response from Claude.

### Using with AI Tools

Configure any AI tool that supports custom base URLs to point to:
```
http://localhost:3000
```

> **🔑 Important Note About API Keys**
>
> The router handles OAuth authentication, so **the API key doesn't matter**. If your tool requires an API key, use any string it accepts - many tools don't even validate the format. Common values: `"not-used"`, `"dummy"`, `"sk-ant-1234"`, etc.
>
> The key is **never sent to Anthropic** - the router strips it and replaces it with OAuth credentials.

**JavaScript/TypeScript:**
```javascript
const client = new AnthropicClient({
  baseURL: 'http://localhost:3000',
  // No API key needed - router handles authentication
});
```

**Python:**
```python
import anthropic

client = anthropic.Anthropic(
    api_key="not-used",  # Can be anything - router handles auth
    base_url="http://localhost:3000",
)

response = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1000,
    messages=[{"role": "user", "content": "Hello!"}]
)
```

### What Gets Injected

Anthropic's MAX Plan requires this exact system prompt as the first element:
```
"You are Claude Code, Anthropic's official CLI for Claude."
```

The router:
- Checks if this prompt is already present
- Prepends it if missing
- Leaves your request unchanged if already there

### Router Source Files
```
src/router/
├── server.ts        # Express server with CLI argument parsing
├── middleware.ts    # System prompt injection logic
└── logger.ts        # Verbosity-aware logging
```

### Router Troubleshooting

**"No OAuth tokens found"**
→ Router will automatically prompt you to authenticate on first run.

**Port already in use**
→ Use `npm run router -- --port 8080`

**Authentication fails**
→ Delete `.oauth-tokens.json` and restart. Router will re-authenticate.

**Want to see what's happening?**
→ Use `npm run router -- --verbose`

---

## 📚 Implementation Guide

Complete technical documentation covering the internals:

- **OAuth PKCE Flow** - Step-by-step authentication process
- **System Prompt Validation** - How Anthropic enforces MAX Plan restrictions
- **Token Management** - Refresh logic, expiration handling, storage patterns
- **API Request Format** - Required headers, body structure, beta flags
- **Implementation Patterns** - Best practices and production code examples
- **Testing Methodology** - Validation tests and proof of MAX enforcement

📖 **[ANTHROPIC-MAX-PLAN-IMPLEMENTATION-GUIDE.md](./ANTHROPIC-MAX-PLAN-IMPLEMENTATION-GUIDE.md)**

This guide is essential reading for understanding how the system works under the hood.


---

## Authentication Flow

### First Run (CLI and Router)

1. Application detects no OAuth tokens
2. Displays authorization URL
3. You visit the URL and authorize
4. Authorization page shows `code#state`
5. You paste the `code#state` back
6. Application exchanges code for OAuth tokens
7. Tokens saved to `.oauth-tokens.json`

### Subsequent Runs

1. Application loads tokens from `.oauth-tokens.json`
2. Validates and auto-refreshes if expired (8-hour lifetime)
3. Starts immediately

### Re-authenticating

Delete `.oauth-tokens.json` and restart. The application will prompt for re-authentication.

---

## Project Files

```
anthropic-max-router/
├── src/
│   ├── cli.ts                    # Interactive CLI application
│   ├── oauth.ts                  # OAuth PKCE flow implementation
│   ├── client.ts                 # API client with validation
│   ├── token-manager.ts          # Token storage and refresh
│   ├── types.ts                  # TypeScript type definitions
│   └── router/
│       ├── server.ts             # Router with CLI argument parsing
│       ├── middleware.ts         # System prompt injection
│       └── logger.ts             # Verbosity-aware logging
├── examples/
│   └── test-router.js            # Example router usage
├── ANTHROPIC-MAX-PLAN-IMPLEMENTATION-GUIDE.md  # Technical docs
├── CHANGELOG.md
├── README.md                     # This file
└── package.json
```

---

## Author

**nsxdavid (David Whatley)**
- Website: [davidwhatley.com](https://davidwhatley.com)
- GitHub: [@nsxdavid](https://github.com/nsxdavid)

---

## License

MIT

---

## Technical Notes

This demonstrates Anthropic's official OAuth flow with MAX subscription. All authentication uses Anthropic's official endpoints. This is the same OAuth flow used by Claude Code.

Anthropic may change OAuth requirements at any time. Tested and verified working as of November 2nd, 2025.
