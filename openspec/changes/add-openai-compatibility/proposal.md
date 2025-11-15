# Change: Add OpenAI API Compatibility Endpoint

## Why

Many AI tools and applications are built exclusively for OpenAI's Chat Completions API format (`/v1/chat/completions`). Currently, these tools cannot use the router without significant code modifications. By adding an OpenAI-compatible endpoint that translates requests to Anthropic's format, we enable a much broader ecosystem of tools to leverage MAX Plan billing with zero code changes.

This makes the router a true drop-in replacement for OpenAI's API, expanding its utility from "Anthropic-compatible tools" to "any AI tool that supports custom base URLs."

## What Changes

- **Add new endpoint:** `POST /v1/chat/completions` that accepts OpenAI Chat Completions format
- **Request translation:** Convert OpenAI request format to Anthropic Messages API format
  - Extract `system` messages from messages array into top-level `system` field
  - Ensure strict user/assistant alternation required by Anthropic
  - Map OpenAI tool/function definitions to Anthropic tools format
  - Handle model name mapping (e.g., `gpt-4` → `claude-sonnet-4-5`)
- **Response translation:** Convert Anthropic Messages API response back to OpenAI format
  - Transform `content` to `choices[0].message` structure
  - Map usage tokens (`input_tokens`/`output_tokens` → `prompt_tokens`/`completion_tokens`)
  - Handle streaming responses with proper SSE format translation
- **Add CLI flags** for endpoint control:
  - `--enable-anthropic` / `--disable-anthropic` (default: enabled)
  - `--enable-openai` / `--disable-openai` (default: disabled for backward compatibility)
  - `--enable-all-endpoints` (enable both)
- **Maintain existing behavior:** Default router behavior unchanged (only Anthropic endpoint active)
- **Shared middleware:** Both endpoints use same OAuth authentication and system prompt injection

## Impact

**Affected specs:**
- `router` (new capability spec to be created)

**Affected code:**
- `src/router/server.ts` - Add new route handler and CLI flags
- `src/router/translator.ts` - New module for bidirectional API translation
- `src/router/model-mapper.ts` - New module for model name mapping
- `src/router/logger.ts` - Update to log translation events
- `src/types.ts` - Add OpenAI request/response type definitions

**Breaking changes:**
- None (new feature is opt-in via CLI flags)

**Benefits:**
- Expands compatible tool ecosystem dramatically (Python OpenAI SDK, LangChain, etc.)
- Zero code changes required for tools already using OpenAI API
- Maintains backward compatibility with existing Anthropic-native usage
- Users can run both endpoints simultaneously for maximum flexibility
