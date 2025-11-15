# Design: OpenAI API Compatibility

## Context

The router currently exposes only Anthropic's native `/v1/messages` endpoint. Many AI tools and SDKs are built exclusively for OpenAI's Chat Completions API. This design adds a translation layer that accepts OpenAI format and converts it to Anthropic format, enabling zero-code integration with the broader AI tool ecosystem.

### Constraints
- Must maintain backward compatibility (default behavior unchanged)
- Both endpoints must share OAuth authentication and system prompt injection
- Translation must be bidirectional (request: OpenAI → Anthropic, response: Anthropic → OpenAI)
- Streaming must work correctly in both formats

## Goals / Non-Goals

### Goals
- Enable any OpenAI-compatible tool to use MAX Plan billing
- Provide seamless request/response translation
- Support both streaming and non-streaming modes
- Allow flexible endpoint configuration via CLI flags
- Maintain consistent logging across both endpoints

### Non-Goals
- Perfect feature parity (some OpenAI features may not map to Anthropic)
- Supporting legacy OpenAI endpoints (only `/v1/chat/completions`)
- Batch processing or Assistants API
- Fine-tuning APIs

## Decisions

### Decision 1: Translation Layer Architecture
**Choice:** Implement translation as separate middleware modules (`translator.ts`, `model-mapper.ts`)

**Rationale:**
- Keeps translation logic isolated and testable
- Allows reuse across different route handlers
- Makes it easy to update mappings without touching core router logic
- Clear separation of concerns

**Alternatives considered:**
- Inline translation in route handlers: Too coupled, harder to test
- Separate proxy service: Over-engineered for current scope

### Decision 2: Model Mapping Strategy - Pattern-Based Intelligent Mapping

**Choice:** Use pattern-based tier detection instead of hardcoded model lists to future-proof against new model releases.

**Implementation:**
```javascript
function mapOpenAIModel(modelName) {
  // 1. Check user's custom mappings file first (.router-mappings.json)
  const customMappings = loadCustomMappings();
  if (customMappings[modelName]) return customMappings[modelName];

  // 2. Check environment variable override
  if (process.env.ANTHROPIC_DEFAULT_MODEL) {
    return process.env.ANTHROPIC_DEFAULT_MODEL;
  }

  // 3. Pattern-based tier detection
  const model = modelName.toLowerCase();

  // Low-tier patterns → Haiku (fast/cheap models only)
  const lowTierPatterns = ['-nano', 'gpt-3.5', 'gpt-3'];
  if (lowTierPatterns.some(pattern => model.includes(pattern))) {
    return 'claude-haiku-4-5';
  }

  // All other models → Sonnet (best balance for MAX Plan)
  // Includes: gpt-5, gpt-6, gpt-4, o-series, -pro, -mini, -turbo, etc.
  return 'claude-sonnet-4-5';
}
```

**Mapping Rules:**
- **Low-tier only** (nano, gpt-3.5, gpt-3) → `claude-haiku-4-5`
- **Everything else** → `claude-sonnet-4-5` (default for MAX Plan)
- **NO Opus models** - Too expensive for proxy routing

**Examples of automatic mapping (November 2024 models):**
```
// GPT-5.1 series
gpt-5.1                 → claude-sonnet-4-5
gpt-5.1-instant         → claude-sonnet-4-5
gpt-5.1-thinking        → claude-sonnet-4-5
gpt-5.1-codex           → claude-sonnet-4-5
gpt-5.1-codex-mini      → claude-sonnet-4-5

// GPT-5 series
gpt-5                   → claude-sonnet-4-5
gpt-5-mini              → claude-sonnet-4-5
gpt-5-nano              → claude-haiku-4-5

// o-series (reasoning models)
o1                      → claude-sonnet-4-5
o1-mini                 → claude-sonnet-4-5
o1-preview              → claude-sonnet-4-5
o1-pro                  → claude-sonnet-4-5
o3                      → claude-sonnet-4-5
o3-mini                 → claude-sonnet-4-5
o3-pro                  → claude-sonnet-4-5
o3-deep-research        → claude-sonnet-4-5
o4-mini                 → claude-sonnet-4-5
o4-mini-deep-research   → claude-sonnet-4-5

// GPT-4.1 series
gpt-4.1                 → claude-sonnet-4-5
gpt-4.1-mini            → claude-sonnet-4-5
gpt-4.1-nano            → claude-haiku-4-5

// GPT-4o series
gpt-4o                  → claude-sonnet-4-5
gpt-4o-mini             → claude-sonnet-4-5
gpt-realtime            → claude-sonnet-4-5

// Legacy GPT-3.5
gpt-3.5-turbo           → claude-haiku-4-5
gpt-3                   → claude-haiku-4-5

// Unknown/new models default to safe choice
unknown-model           → claude-sonnet-4-5  (safe default)
```

**Configuration Flexibility:**

1. **No config** (most users) - Just works with pattern matching:
   ```bash
   npx anthropic-max-router --enable-openai
   ```

2. **Environment variable** - Override all mappings to one model:
   ```bash
   ANTHROPIC_DEFAULT_MODEL=claude-haiku-4-5 npx anthropic-max-router --enable-openai
   ```

3. **Custom mappings file** - Specific overrides for edge cases:
   ```json
   // .router-mappings.json
   {
     "gpt-5-experimental": "claude-sonnet-4",
     "my-custom-model": "claude-haiku-4-5"
   }
   ```

4. **CLI utility** - See current mapping logic:
   ```bash
   npx anthropic-max-router --list-model-mappings
   # Output:
   # Model Mapping Strategy: Pattern-based
   # - Low tier (nano, 3.5, 3) → claude-haiku-4-5
   # - Default → claude-sonnet-4-5
   # Custom mappings: 2 loaded from .router-mappings.json
   ```

**Rationale:**
- **Future-proof**: Pattern-based matching handles new OpenAI models as they're released without code changes
- **Simple**: Only two outcomes (Sonnet or Haiku) - easy to understand
- **Cost-conscious**: Sonnet 4.5 is best balance for MAX Plan, avoid expensive Opus
- **Zero config**: Works immediately for 99% of users
- **Flexible**: Power users can override via file or env var
- **Maintainable**: Updating patterns is easier than maintaining model lists
- **Transparent**: Logs show which pattern matched

**Claude model reference (used by router):**
- `claude-sonnet-4-5` - Default for all models, best balance of intelligence/speed/cost for MAX Plan
- `claude-haiku-4-5` - Fast/cheap tier for nano and gpt-3.5 models only

### Decision 3: Message Alternation Strategy
**Choice:** Consolidate consecutive same-role messages by joining with newlines

**Example:**
```javascript
// OpenAI input
[
  { role: 'user', content: 'Hello' },
  { role: 'user', content: 'How are you?' }
]

// Anthropic output
[
  { role: 'user', content: 'Hello\n\nHow are you?' }
]
```

**Rationale:**
- Preserves semantic meaning
- Anthropic requires strict alternation
- Simple implementation

**Alternatives considered:**
- Drop extra messages: Loses information
- Error on non-alternation: Too strict, breaks many tools

### Decision 4: System Message Handling
**Choice:** Extract all system messages and combine into single top-level `system` field

**Example:**
```javascript
// OpenAI input
[
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello' },
  { role: 'system', content: 'Be concise.' }
]

// Anthropic output
{
  system: 'You are a helpful assistant.\n\nBe concise.',
  messages: [
    { role: 'user', content: 'Hello' }
  ]
}
```

**Rationale:**
- Anthropic only supports one system prompt
- Combining preserves all system instructions
- Newlines maintain separation

**Note:** Existing system prompt injection middleware runs AFTER translation, so it can still prepend MAX Plan requirement

### Decision 5: Tool/Function Calling Translation
**OpenAI format:**
```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get weather for a city",
        "parameters": {
          "type": "object",
          "properties": {
            "city": { "type": "string" }
          },
          "required": ["city"]
        }
      }
    }
  ]
}
```

**Anthropic format:**
```json
{
  "tools": [
    {
      "name": "get_weather",
      "description": "Get weather for a city",
      "input_schema": {
        "type": "object",
        "properties": {
          "city": { "type": "string" }
        },
        "required": ["city"]
      }
    }
  ]
}
```

**Translation mapping:**
- `tools[].function.name` → `tools[].name`
- `tools[].function.description` → `tools[].description`
- `tools[].function.parameters` → `tools[].input_schema`

### Decision 6: Response Translation Structure
**Anthropic response:**
```json
{
  "id": "msg_123",
  "type": "message",
  "role": "assistant",
  "content": [
    { "type": "text", "text": "Hello!" }
  ],
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 10,
    "output_tokens": 5
  }
}
```

**OpenAI response:**
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello!"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 5,
    "total_tokens": 15
  }
}
```

**Translation mappings:**
- `id`: Use Anthropic's message ID
- `created`: Current Unix timestamp
- `model`: Original OpenAI model from request
- `choices[0].message.content`: Extract text from Anthropic content array
- `finish_reason`: Map stop_reason (`end_turn` → `stop`, `max_tokens` → `length`)
- `usage.prompt_tokens`: Anthropic's `input_tokens`
- `usage.completion_tokens`: Anthropic's `output_tokens`
- `usage.total_tokens`: Sum of input + output

### Decision 7: Streaming Translation
**Anthropic SSE events:**
```
event: message_start
data: {"type":"message_start",...}

event: content_block_delta
data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}

event: message_delta
data: {"type":"message_delta","usage":{"output_tokens":5}}

event: message_stop
data: {"type":"message_stop"}
```

**OpenAI SSE events:**
```
data: {"id":"chatcmpl-123","choices":[{"delta":{"role":"assistant"},"index":0}]}

data: {"id":"chatcmpl-123","choices":[{"delta":{"content":"Hello"},"index":0}]}

data: {"id":"chatcmpl-123","choices":[{"delta":{},"index":0,"finish_reason":"stop"}],"usage":{"prompt_tokens":10,"completion_tokens":5,"total_tokens":15}}

data: [DONE]
```

**Translation strategy:**
1. Buffer Anthropic events
2. Translate each event to OpenAI format
3. Emit OpenAI SSE with proper `data:` prefix
4. End with `data: [DONE]`

### Decision 8: CLI Flag Defaults
**Default behavior:**
- `--enable-anthropic` (implicit, default: true)
- `--disable-openai` (implicit, default: true)

**Rationale:**
- Maintains backward compatibility
- Existing users see no change
- OpenAI support is opt-in for security/testing purposes

**Flag precedence:**
- `--enable-all-endpoints` enables both
- `--disable-X` overrides `--enable-X`
- Must have at least one endpoint enabled (validation error otherwise)

### Decision 9: Endpoint Registration Logic
```javascript
const config = {
  anthropicEnabled: true,  // default
  openaiEnabled: false     // default
};

// Parse flags
if (args.includes('--enable-all-endpoints')) {
  config.anthropicEnabled = true;
  config.openaiEnabled = true;
}
if (args.includes('--enable-openai')) config.openaiEnabled = true;
if (args.includes('--disable-anthropic')) config.anthropicEnabled = false;
if (args.includes('--disable-openai')) config.openaiEnabled = false;

// Validate
if (!config.anthropicEnabled && !config.openaiEnabled) {
  console.error('Error: At least one endpoint must be enabled');
  process.exit(1);
}

// Register routes conditionally
if (config.anthropicEnabled) {
  app.post('/v1/messages', handleAnthropicRequest);
}
if (config.openaiEnabled) {
  app.post('/v1/chat/completions', handleOpenAIRequest);
}
```

## Module Structure

```
src/router/
├── server.ts           # Main Express server, route registration, CLI parsing
├── middleware.ts       # System prompt injection (shared by both endpoints)
├── translator.ts       # NEW: Bidirectional API translation
├── model-mapper.ts     # NEW: Model name mapping
└── logger.ts           # Updated: Log endpoint type and translations
```

## Translation Flow Diagram

```
OpenAI Request
    ↓
┌─────────────────────────────────────┐
│ POST /v1/chat/completions           │
│ - Parse OpenAI request              │
│ - Validate format                   │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ translator.translateOpenAIToAnthropic│
│ - Extract system messages           │
│ - Enforce message alternation       │
│ - Translate tools                   │
│ - Map model name                    │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ middleware.ensureRequiredSystemPrompt│
│ - Inject MAX Plan system prompt     │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Anthropic API Request               │
│ - OAuth authentication              │
│ - Forward to api.anthropic.com      │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Anthropic API Response              │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ translator.translateAnthropicToOpenAI│
│ - Create choices array              │
│ - Map usage tokens                  │
│ - Translate tool calls              │
│ - Generate OpenAI metadata          │
└────────────┬────────────────────────┘
             ↓
OpenAI Response (returned to client)
```

## Risks / Trade-offs

### Risk 1: Feature Parity Gaps
**Risk:** Some OpenAI features have no Anthropic equivalent
**Examples:**
- `logprobs`: Anthropic doesn't support
- `n` (multiple completions): Anthropic doesn't support
- `presence_penalty`/`frequency_penalty`: Different implementations

**Mitigation:**
- Document unsupported features clearly
- Return 400 with helpful error messages
- Ignore unsupported params with warning log (for penalty params)

### Risk 2: Tool Calling Differences
**Risk:** Anthropic's tool calling is more rigid than OpenAI's
- Anthropic doesn't support parallel tool calls in single turn
- Different tool call IDs and structure

**Mitigation:**
- Document limitation in README
- Translate as best-effort
- Log warnings when parallel tool calls detected

### Risk 3: Streaming Latency
**Risk:** Buffering and translating SSE events adds latency

**Mitigation:**
- Keep translation logic minimal
- Stream events as soon as translated (don't batch)
- Profile and optimize hot paths

### Risk 4: Model Mapping Confusion
**Risk:** Users may expect exact GPT behavior from mapped Claude models

**Mitigation:**
- Document model mappings clearly
- Log original → translated model at medium verbosity
- Provide override mechanism for custom mappings

## Migration Plan

### Phase 1: Implementation (v1.2.0)
1. Implement translation modules
2. Add OpenAI endpoint (disabled by default)
3. Add CLI flags
4. Update documentation

### Phase 2: Testing (before release)
1. Test with OpenAI Python SDK
2. Test with OpenAI Node SDK
3. Test with popular tools (LangChain, etc.)
4. Validate streaming works correctly

### Phase 3: Release
1. Publish as v1.2.0
2. Announce OpenAI compatibility in README
3. Provide migration examples

### Phase 4: Gather Feedback
1. Monitor GitHub issues for translation problems
2. Improve model mappings based on usage
3. Add requested features (custom mapping config)

### Rollback Plan
- Feature is disabled by default (backward compatible)
- If critical bugs found, document `--disable-openai` workaround
- Fix in patch release

## Open Questions

### Q1: Should we support custom model mappings via config file?
**Initial answer:** No, use hardcoded mappings for v1.2.0
**Future:** Add `.router-config.json` for advanced users in v1.3.0

### Q2: How to handle unsupported parameters gracefully?
**Answer:**
- Ignore with warning log: `temperature`, `frequency_penalty`, `presence_penalty`
- Error with helpful message: `n > 1`, `logprobs`

### Q3: Should we validate OpenAI request schemas strictly?
**Answer:** Basic validation only (required fields present), pass through to Anthropic for deeper validation

### Q4: How to handle model name in response?
**Answer:** Return the original OpenAI model name from the request, not the translated Claude model (maintains client compatibility)
