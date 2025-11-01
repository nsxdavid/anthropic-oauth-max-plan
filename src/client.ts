/**
 * EDUCATIONAL AND ENTERTAINMENT PURPOSES ONLY
 *
 * This software is provided for educational, research, and entertainment purposes only.
 * It is not affiliated with, endorsed by, or sponsored by Anthropic PBC.
 * Use at your own risk. No warranties provided. Users are solely responsible for
 * ensuring compliance with Anthropic's Terms of Service and all applicable laws.
 *
 * Copyright (c) 2025 - Licensed under MIT License
 */

/**
 * Anthropic API client with OAuth MAX plan support
 */

import type {
  OAuthTokens,
  AnthropicRequest,
  AnthropicResponse,
  SystemMessage,
  Tool
} from './types.js';

const API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const ANTHROPIC_BETA = 'oauth-2025-04-20,claude-code-20250219,interleaved-thinking-2025-05-14,fine-grained-tool-streaming-2025-05-14';

/**
 * CRITICAL: System prompt required for OAuth with Sonnet/Opus
 * This MUST be the first element in the system array
 */
const REQUIRED_SYSTEM_PROMPT: SystemMessage = {
  type: 'text',
  text: 'You are Claude Code, Anthropic\'s official CLI for Claude.'
};

/**
 * Default tool to satisfy OAuth requirements
 */
const DEFAULT_TOOL: Tool = {
  name: 'bash',
  description: 'Execute bash commands',
  input_schema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The command to run'
      }
    },
    required: ['command']
  }
};

/**
 * Make a request to Anthropic API with OAuth token
 */
export async function makeAnthropicRequest(
  accessToken: string,
  request: AnthropicRequest
): Promise<AnthropicResponse> {
  // CRITICAL: Ensure system prompt starts with required phrase
  const system = request.system || [];
  const systemWithRequired = [
    REQUIRED_SYSTEM_PROMPT,
    ...system
  ];

  // Ensure at least one tool is provided
  const tools = request.tools && request.tools.length > 0
    ? request.tools
    : [DEFAULT_TOOL];

  // Build the request body
  const body: AnthropicRequest = {
    ...request,
    system: systemWithRequired,
    tools,
    tool_choice: request.tool_choice || { type: 'auto' }
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-beta': ANTHROPIC_BETA
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed (${response.status}): ${error}`);
  }

  return await response.json() as AnthropicResponse;
}

/**
 * Simple helper to send a message and get a response
 */
export async function sendMessage(
  accessToken: string,
  userMessage: string,
  options: {
    model?: string;
    maxTokens?: number;
    systemPrompt?: string;
    tools?: Tool[];
  } = {}
): Promise<string> {
  const additionalSystem = options.systemPrompt
    ? [{ type: 'text' as const, text: options.systemPrompt }]
    : [];

  const request: AnthropicRequest = {
    model: options.model || 'claude-sonnet-4-5',
    max_tokens: options.maxTokens || 1000,
    system: additionalSystem,
    messages: [
      {
        role: 'user',
        content: userMessage
      }
    ],
    tools: options.tools
  };

  const response = await makeAnthropicRequest(accessToken, request);

  // Extract text from response
  const textContent = response.content.find(block => block.type === 'text');
  return textContent?.text || '';
}
