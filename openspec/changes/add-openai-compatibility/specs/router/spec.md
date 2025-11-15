# Router Capability Specification

## ADDED Requirements

### Requirement: OpenAI Chat Completions Endpoint
The router SHALL expose a `/v1/chat/completions` endpoint that accepts OpenAI Chat Completions API format and translates requests to Anthropic Messages API format.

#### Scenario: OpenAI request successfully translated
- **WHEN** a POST request is sent to `/v1/chat/completions` with valid OpenAI format
- **THEN** the router translates the request to Anthropic format
- **AND** forwards it to Anthropic API with OAuth authentication
- **AND** returns a response in OpenAI format

#### Scenario: System messages extracted from messages array
- **WHEN** OpenAI request contains `system` role messages in the messages array
- **THEN** the router extracts all system messages and combines them into Anthropic's top-level `system` field
- **AND** removes system messages from the messages array

#### Scenario: Message alternation enforced
- **WHEN** OpenAI request has non-alternating user/assistant messages
- **THEN** the router consolidates consecutive messages from the same role
- **AND** ensures strict user/assistant alternation required by Anthropic

#### Scenario: Streaming response translated
- **WHEN** OpenAI request includes `stream: true`
- **THEN** the router enables streaming on the Anthropic request
- **AND** translates Anthropic SSE events to OpenAI SSE format
- **AND** pipes the stream to the client with correct `data:` prefixes

### Requirement: Request Translation
The router SHALL translate OpenAI Chat Completions request format to Anthropic Messages API format with correct field mappings.

#### Scenario: Model name mapping
- **WHEN** OpenAI request specifies a GPT model (e.g., `gpt-4`, `gpt-4o`)
- **THEN** the router maps it to an appropriate Claude model (e.g., `claude-sonnet-4-5`)

#### Scenario: Tool definitions translated
- **WHEN** OpenAI request includes `tools` array with function definitions
- **THEN** the router translates each tool from OpenAI format to Anthropic format
- **AND** preserves function names, descriptions, and parameter schemas

#### Scenario: Temperature and max_tokens preserved
- **WHEN** OpenAI request includes `temperature` or `max_tokens`
- **THEN** the router passes these parameters unchanged to Anthropic API

### Requirement: Response Translation
The router SHALL translate Anthropic Messages API responses to OpenAI Chat Completions format with correct field mappings.

#### Scenario: Basic response structure
- **WHEN** Anthropic returns a successful response
- **THEN** the router wraps the content in OpenAI's `choices[0].message` structure
- **AND** sets `role: "assistant"` in the message
- **AND** includes `id`, `object: "chat.completion"`, and `created` timestamp

#### Scenario: Token usage mapping
- **WHEN** Anthropic response includes usage statistics
- **THEN** the router maps `input_tokens` to `prompt_tokens`
- **AND** maps `output_tokens` to `completion_tokens`
- **AND** calculates `total_tokens` as the sum

#### Scenario: Tool calls translated
- **WHEN** Anthropic response includes tool use
- **THEN** the router translates to OpenAI's `tool_calls` array format
- **AND** generates unique `id` for each tool call
- **AND** preserves function name and arguments

### Requirement: Endpoint Control CLI Flags
The router SHALL provide command-line flags to enable or disable API endpoints independently.

#### Scenario: Default behavior (backward compatibility)
- **WHEN** router starts with no endpoint flags
- **THEN** only the Anthropic endpoint `/v1/messages` is enabled
- **AND** OpenAI endpoint `/v1/chat/completions` returns 404

#### Scenario: Enable OpenAI endpoint
- **WHEN** router starts with `--enable-openai` flag
- **THEN** both Anthropic and OpenAI endpoints are enabled
- **AND** both endpoints share OAuth authentication

#### Scenario: Disable Anthropic endpoint
- **WHEN** router starts with `--disable-anthropic` flag
- **THEN** only OpenAI endpoint is enabled
- **AND** Anthropic endpoint `/v1/messages` returns 404

#### Scenario: Enable all endpoints
- **WHEN** router starts with `--enable-all-endpoints` flag
- **THEN** both Anthropic and OpenAI endpoints are enabled
- **AND** is equivalent to `--enable-anthropic --enable-openai`

#### Scenario: Both endpoints disabled error
- **WHEN** router starts with `--disable-anthropic --disable-openai`
- **THEN** the router exits with an error message
- **AND** indicates at least one endpoint must be enabled

### Requirement: Error Handling
The router SHALL provide clear error messages when translation fails or unsupported features are requested.

#### Scenario: Unsupported model requested
- **WHEN** OpenAI request specifies a model with no Anthropic equivalent
- **THEN** the router returns 400 Bad Request
- **AND** response includes error message indicating unsupported model
- **AND** lists supported model mappings

#### Scenario: Translation failure
- **WHEN** OpenAI request cannot be translated to valid Anthropic format
- **THEN** the router returns 400 Bad Request
- **AND** response includes specific error about the translation issue

#### Scenario: Anthropic API error
- **WHEN** Anthropic API returns an error
- **THEN** the router translates the error to OpenAI error format
- **AND** preserves the original error message and status code

### Requirement: Logging for Translation
The router SHALL log translation events at appropriate verbosity levels.

#### Scenario: Minimal logging
- **WHEN** router runs with `--minimal` verbosity
- **THEN** logs include endpoint type (Anthropic/OpenAI) in the one-line summary

#### Scenario: Medium logging
- **WHEN** router runs with default (medium) verbosity
- **THEN** logs indicate when translation occurred
- **AND** logs show original model → translated model

#### Scenario: Verbose logging
- **WHEN** router runs with `--verbose` verbosity
- **THEN** logs include full OpenAI request before translation
- **AND** logs include Anthropic request after translation
- **AND** logs include both response formats
