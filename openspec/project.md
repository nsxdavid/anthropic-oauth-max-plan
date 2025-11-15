# Project Context

## Purpose

**Anthropic MAX Plan Router** is a dual-purpose project:

1. **Production HTTP Proxy Router** - A standalone Express server that enables ANY AI tool to use Anthropic's Claude MAX Plan subscription (flat-rate billing) via custom base URL configuration
2. **Educational Implementation** - Complete working reference for OAuth PKCE authentication flow with Anthropic's API, including token management and system prompt validation

**Key Goals:**
- Enable high-volume AI development with flat-rate billing instead of pay-per-token
- Provide transparent OAuth authentication and token management
- Automatically inject required system prompts for MAX Plan compliance
- Serve as educational resource for understanding Anthropic's OAuth implementation

## Tech Stack

**Core Technologies:**
- **TypeScript 5.3+** - Strict mode, ES2022 target
- **Node.js 18+** - ES Modules (ESM)
- **Express 4.x** - HTTP proxy server framework

**Key Dependencies:**
- `express` - Web server and routing
- `dotenv` - Environment variable management
- `@types/express` - TypeScript definitions
- `tsx` - TypeScript execution for development

**Build & Tooling:**
- TypeScript compiler with declaration maps and source maps
- npm scripts for CLI and router execution
- Supports both local development (`tsx`) and production (`dist/`)

**Distribution:**
- Published to npm as `anthropic-max-router`
- Supports `npx` execution directly from npm or GitHub
- Dual CLI entry points: `anthropic-max-router` and `max-router`

## Project Conventions

### Code Style

**Module System:**
- ES Modules only (`.js` imports in TypeScript files)
- All imports must include `.js` extension
- `type: "module"` in package.json

**Naming Conventions:**
- Files: kebab-case (`token-manager.ts`, `oauth.ts`)
- Types/Interfaces: PascalCase (`AnthropicRequest`, `OAuthTokens`)
- Functions/variables: camelCase (`getValidAccessToken`, `exchangeCodeForTokens`)
- Constants: SCREAMING_SNAKE_CASE for API endpoints

**TypeScript:**
- Strict mode enabled
- Explicit types required (no implicit `any`)
- Use interfaces for data structures
- Type definitions in `types.ts`

**Comments:**
- Never mention AI assistants in commit messages
- Focus on "why" not "what" in documentation
- Use TSDoc for public API functions

### Architecture Patterns

**Separation of Concerns:**
```
src/
├── cli.ts              # Interactive CLI (menu-driven)
├── oauth.ts            # OAuth PKCE flow implementation
├── client.ts           # API client with validation
├── token-manager.ts    # Token storage/refresh logic
├── types.ts            # Shared TypeScript definitions
└── router/
    ├── server.ts       # Express server + CLI args
    ├── middleware.ts   # System prompt injection
    └── logger.ts       # Verbosity-aware logging
```

**Key Patterns:**
- **Middleware Pattern** - Express middleware for system prompt injection
- **Factory Pattern** - Logger with configurable verbosity levels
- **Promise-based** - All async operations use Promises, not callbacks
- **Single Responsibility** - Each module has one clear purpose
- **Token Management** - Centralized in token-manager with auto-refresh
- **OAuth Flow** - PKCE (Proof Key for Code Exchange) for security

**Configuration:**
- Environment variables via `.env` (optional)
- Command-line arguments for runtime config
- Token persistence in `.oauth-tokens.json`
- Port configurable via `--port` flag or `ROUTER_PORT` env var

### Testing Strategy

**Current State:**
- No automated test suite (v1.x is proof-of-concept)
- Manual testing via interactive CLI menu
- "Proof of MAX Plan validation" feature for manual testing
- Real API testing with Anthropic endpoints

**Manual Test Commands:**
- `npm start` - Interactive CLI for OAuth testing
- `npm run router` - Router server for integration testing
- curl commands in README for API endpoint testing
- Health check endpoint: `GET /health`

**Testing Philosophy:**
- Real-world integration testing preferred over mocks
- Educational focus means actual OAuth flows, not simulated
- Router tested with real AI tools (Python SDK, JavaScript SDK, etc.)

### Git Workflow

**Branching:**
- `main` branch is production-ready
- Direct commits to `main` for small changes
- Feature branches for significant work

**Commit Conventions:**
- Follow Conventional Commits loosely
- Prefix: `feat:`, `fix:`, `chore:`, `docs:`
- **NEVER mention AI assistants in commit messages**
- Focus on business value and technical changes
- Use heredoc for multi-line commit messages

**Example Commit:**
```bash
git commit -m "$(cat <<'EOF'
feat: add streaming support to router

Router now properly handles streaming responses from Anthropic API.
Detects text/event-stream content type and pipes stream to client.
Maintains proper headers and connection handling for SSE.
EOF
)"
```

**Publishing:**
- `npm version [patch|minor|major]` to bump version
- `prepublishOnly` hook auto-builds TypeScript
- `npm publish` to publish to npm registry
- Update CHANGELOG.md manually before releases

## Domain Context

**Anthropic MAX Plan:**
- Subscription-based pricing ($100 or $200/month)
- Flat-rate billing instead of pay-per-token
- Requires specific system prompt: `"You are Claude Code, Anthropic's official CLI for Claude."`
- Uses OAuth authentication (not API keys)
- Tokens expire after 8 hours and must be refreshed

**OAuth PKCE Flow:**
1. Generate code verifier (random string)
2. Create code challenge (SHA-256 hash of verifier)
3. User authorizes via browser
4. Exchange authorization code + verifier for tokens
5. Use access token for API requests
6. Refresh token when access token expires (8 hours)

**System Prompt Injection:**
- Anthropic's MAX Plan API validates the first system message
- Must be: `"You are Claude Code, Anthropic's official CLI for Claude."`
- Router automatically injects if missing
- Allows any tool to work with MAX Plan without modification

**API Endpoints:**
- OAuth: `https://api.anthropic.com/oauth/*`
- Messages: `https://api.anthropic.com/v1/messages`
- Beta features require `anthropic-beta` header

**Streaming Support:**
- Router detects `text/event-stream` content type
- Pipes streaming responses directly to client
- Maintains SSE (Server-Sent Events) headers
- Critical for tools requiring real-time responses

## Important Constraints

**Legal/Compliance:**
- Educational and research purposes only
- Not affiliated with or endorsed by Anthropic
- Users must comply with Anthropic's Terms of Service
- MIT license - provided "as-is" without warranties

**Technical Constraints:**
- OAuth tokens expire after 8 hours (auto-refresh required)
- System prompt injection is mandatory for MAX Plan
- Cannot bypass Anthropic's validation
- Requires active MAX Plan subscription to function
- Node.js 18+ required (uses ES2022 features)

**API Limitations:**
- 50MB payload size limit (Express body-parser)
- OAuth flow requires browser interaction (first run)
- No streaming token refresh (must complete refresh before streaming)

**Security:**
- Tokens stored in `.oauth-tokens.json` (git-ignored)
- No API keys - OAuth only
- CSRF protection via state parameter
- Code verifier never exposed in browser

## External Dependencies

**Anthropic API:**
- **OAuth endpoints:** `https://api.anthropic.com/oauth/authorize` and `/oauth/token`
- **Messages API:** `https://api.anthropic.com/v1/messages`
- **Rate limits:** Determined by MAX Plan subscription tier
- **Models:** claude-sonnet-4-5, claude-opus-4, etc.

**OAuth Client Details:**
- Client ID: `claudecode-*` (varies by platform/OS)
- Redirect URI: `anthropic://auth`
- Scope: Managed by Anthropic
- Flow: Authorization Code with PKCE

**NPM Registry:**
- Published as `anthropic-max-router`
- Supports `npx` execution
- GitHub-hosted for `npx github:nsxdavid/anthropic-max-router`

**No External Services Required:**
- Router runs entirely locally
- No databases or external caching
- File-based token storage only
- No third-party analytics or tracking

**Inspired By:**
- [OpenCode](https://github.com/sst/opencode) - OAuth implementation reference
- Claude Code official CLI - System prompt requirements
