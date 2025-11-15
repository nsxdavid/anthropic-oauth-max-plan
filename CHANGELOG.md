# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.2.1] - 2025-11-15

### Fixed
- **System prompt handling** - Fixed crash when system prompt is a string instead of array
  - Added `normalizeSystemPrompt()` function in middleware to handle both string and array formats
  - Prevents "TypeError: system.map is not a function" error
  - Thanks to @geoh for the contribution (PR #1)
- **PORT variable initialization** - Fixed reference error where PORT was used before initialization
  - Moved PORT declaration before parseArgs() call to ensure proper initialization order
  - Thanks to @geoh for the contribution (PR #1)

## [1.2.0] - 2025-11-15

### Added
- **OpenAI API Compatibility** - Router now supports OpenAI Chat Completions API format
  - New endpoint: `POST /v1/chat/completions`
  - Zero-code integration with tools built for OpenAI (Python SDK, LangChain, etc.)
  - Bidirectional API translation (OpenAI ↔ Anthropic format)
  - Pattern-based model mapping (gpt-4 → claude-sonnet-4-5, etc.)
  - Full streaming support with SSE format translation
  - Tool/function calling translation
  - Configurable via CLI flags (opt-in for backward compatibility)
- **Endpoint Control Flags**
  - Both endpoints enabled by default (Anthropic + OpenAI)
  - `--enable-openai` - Enable OpenAI compatibility endpoint (default: enabled)
  - `--disable-openai` - Disable OpenAI endpoint
  - `--enable-anthropic` - Enable Anthropic endpoint (default: enabled)
  - `--disable-anthropic` - Disable Anthropic endpoint
  - `--enable-all-endpoints` - Enable both endpoints (same as default)
  - Validation ensures at least one endpoint is enabled
- **Model Mapping System** (`src/router/model-mapper.ts`)
  - Pattern-based intelligent mapping (future-proof for new OpenAI models)
  - Low-tier detection (nano, gpt-3.5, gpt-3) → `claude-haiku-4-5`
  - All other models → `claude-sonnet-4-5` (best for MAX Plan)
  - Custom mapping support via `.router-mappings.json` file
  - Environment variable override: `ANTHROPIC_DEFAULT_MODEL`
- **Translation Layer** (`src/router/translator.ts`)
  - Request translation: OpenAI → Anthropic format
    - System message extraction and consolidation
    - Message alternation enforcement (required by Anthropic)
    - Tool definition translation
    - Parameter mapping (temperature, max_tokens, etc.)
  - Response translation: Anthropic → OpenAI format
    - Content block to choices array conversion
    - Token usage mapping (input_tokens → prompt_tokens)
    - Finish reason translation (end_turn → stop, max_tokens → length)
    - Tool use translation
  - Streaming translation with SSE format conversion
  - Request validation with helpful error messages for unsupported features
- **Enhanced Logging** - Logger now distinguishes between Anthropic and OpenAI requests
  - Minimal: `[OpenAI]` / `[Anthropic]` prefix
  - Medium: "Incoming OpenAI request" / "Incoming Anthropic request"
  - Verbose: Full translation details
- **Type Definitions** - Added comprehensive OpenAI types to `src/types.ts`
  - `OpenAIChatCompletionRequest` / `OpenAIChatCompletionResponse`
  - `OpenAIMessage`, `OpenAITool`, `OpenAIToolCall`
  - `OpenAIChatCompletionChunk` for streaming
  - `OpenAIErrorResponse` for error translation

### Changed
- **Help text** - Updated with new endpoint control flags and environment variables
- **Startup logging** - Router now displays which endpoints are enabled
- **README.md** - Extensive documentation of OpenAI compatibility
  - Model mapping table with examples
  - Python and JavaScript usage examples with OpenAI SDK
  - Streaming examples
  - Custom mapping configuration instructions
  - Feature support matrix
  - Troubleshooting section for OpenAI compatibility
- **Command line options table** - Reorganized with endpoint control section
- **Project files structure** - Updated to show new modules

### Features
- ✅ OpenAI Chat Completions API endpoint (`/v1/chat/completions`)
- ✅ Automatic model name translation (gpt-4, gpt-5, o1, o3, etc.)
- ✅ Request/response format translation
- ✅ Streaming support with OpenAI format
- ✅ Tool calling translation
- ✅ Both endpoints enabled by default for maximum compatibility
- ✅ Flexible model mapping (pattern-based + custom overrides)
- ✅ Works with Python OpenAI SDK, JavaScript OpenAI SDK, and any OpenAI-compatible tool

### OpenAI Compatibility Notes
- **Supported**: Messages, streaming, tools, basic parameters
- **Not Supported**: Multiple completions (n > 1), logprobs
- **Ignored with warning**: presence_penalty, frequency_penalty, logit_bias
- Both endpoints enabled by default - use whichever format your tool supports!

## [1.1.4] - 2025-11-08

### Fixed
- **Streaming support** - Router now properly handles streaming responses from Anthropic API
  - Detects `text/event-stream` content type and pipes the stream directly to client
  - Fixes issues with tools that require streaming responses
  - Maintains proper headers and connection handling for SSE

## [1.1.3] - 2025-11-05

### Fixed
- **Payload size limit** - Increased Express body-parser limit from 100kb to 50mb
  - Fixes "PayloadTooLargeError: request entity too large" when handling large API responses
  - Particularly important for requests with extensive accessibility trees or large screenshots
  - Router now handles large payloads from tools like Stagehand without errors

## [1.1.2] - 2025-11-03

### Fixed
- **npx compatibility** - Package now properly compiles TypeScript before publishing
  - Added `build` script to compile TypeScript to `dist/`
  - Added `prepublishOnly` hook to auto-build before publishing
  - Updated `bin` paths to point to compiled `.js` files instead of source `.ts` files
  - Added `files` field to control npm package contents
  - `npx anthropic-max-router` now works correctly

## [1.1.1] - 2025-11-02

### Changed
- Enhanced router startup with ASCII art banner displaying "MAX PLAN" logo
- Added decorative "═══════ Router ═══════" subtitle to startup sequence

## [1.1.0] - 2025-11-02

### Added
- **API Router Application** - Standalone HTTP proxy server that allows any AI tool to use MAX Plan billing
  - Automatic OAuth authentication on first run
  - Transparent system prompt injection
  - Token auto-refresh with 8-hour expiration handling
  - Express-based proxy server on configurable port
- **Command Line Interface** for router
  - `--help` / `-h` - Display usage information
  - `--version` / `-v` - Show version number
  - `--port` / `-p` - Specify custom port (default: 3000)
  - Verbosity levels:
    - `--quiet` / `-q` - No request logging
    - `--minimal` / `-m` - One-line per request
    - Default (medium) - Summary per request
    - `--verbose` / `-V` - Full request/response bodies
- **Smart Logging System** - Verbosity-aware logger with request tracking
  - Request IDs and timestamps
  - Token usage reporting
  - Conditional system prompt injection logging
  - Error handling with detailed messages
- **Health Check Endpoint** - `GET /health` for monitoring router status
- **npx Support** - Can now run directly from GitHub without cloning
  - Added `bin` field to package.json
  - Added shebang to router server
  - Supports both `anthropic-max-router` and `max-router` commands
  - Run with: `npx github:nsxdavid/anthropic-max-router`
- **Comprehensive Documentation**
  - Restructured README to equally highlight CLI, Router, and Implementation Guide
  - Complete command-line options documentation
  - PowerShell and Bash curl test examples
  - Use case examples (JavaScript, Python)
  - API key usage clarification
  - npx installation instructions
  - Troubleshooting guide

### Changed
- **Repository renamed** from `anthropic-oauth-max-plan` to `anthropic-max-router`
  - Package name updated to `anthropic-max-router`
  - Better reflects that router is now the main feature
  - GitHub will auto-redirect old URLs
- README restructured to highlight both educational purpose and practical router application
- Documentation now emphasizes router as main feature while maintaining educational focus
- Improved project structure organization with router as separate application
- Updated description to better reflect router functionality

### Fixed
- TypeScript compilation error in client.ts with unknown type casting

### Features
- ✅ Standalone router - run with `npm run router`
- ✅ Zero-configuration OAuth (prompts on first run)
- ✅ Automatic system prompt injection if missing
- ✅ Works with any tool that supports custom base URLs
- ✅ Live activity monitoring with adjustable verbosity
- ✅ Configurable port via CLI or environment variable

## [1.0.0] - 2025-11-01

### Added
- Initial release of Anthropic MAX Plan OAuth implementation
- Interactive CLI with menu-driven interface
- OAuth authentication flow (PKCE)
- Token management with automatic refresh
- Chat mode for sending messages to Claude
- Proof of MAX Plan validation test feature
- Comprehensive documentation (README + Implementation Guide)
- MIT License
- Security-focused .gitignore

### Features
- ✅ Authenticate with Anthropic MAX Plan OAuth
- ✅ Access premium models (Sonnet 4.5, Opus) with flat-rate billing
- ✅ Automatic token refresh (8-hour expiration)
- ✅ Chat mode with continuous conversation
- ✅ Token storage and management
- ✅ Logout/delete tokens option
- ✅ Educational validation test to prove MAX plan enforcement

### Documentation
- Detailed implementation guide with system prompt validation tests
- Quick start guide in README
- Code examples for basic and advanced usage
- Troubleshooting section
- Security best practices

### Security
- OAuth tokens never committed to git
- Comprehensive .gitignore for secrets, tokens, and sensitive files
- Educational disclaimers throughout
- CSRF protection with state parameter validation

---

## Development Notes

This project demonstrates using Anthropic's official OAuth flow with Claude MAX subscription for flat-rate billing instead of pay-per-token pricing.

Tested and verified working as of November 1st, 2025.
