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
 * OAuth token response from Anthropic
 */
export interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  expires_at?: number;
  created_at?: string;
}

/**
 * Anthropic API request configuration
 */
export interface AnthropicRequest {
  model: string;
  max_tokens: number;
  system?: SystemMessage[];
  messages: Message[];
  tools?: Tool[];
  tool_choice?: ToolChoice;
  stream?: boolean;
}

/**
 * System message structure
 */
export interface SystemMessage {
  type: 'text';
  text: string;
  cache_control?: {
    type: 'ephemeral';
  };
}

/**
 * User/Assistant message
 */
export interface Message {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

/**
 * Content block for messages
 */
export interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  [key: string]: any;
}

/**
 * Tool definition
 */
export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * Tool choice configuration
 */
export interface ToolChoice {
  type: 'auto' | 'any' | 'tool';
  name?: string;
}

/**
 * Anthropic API response
 */
export interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: ContentBlock[];
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

/**
 * OAuth configuration
 */
export interface OAuthConfig {
  client_id: string;
  authorize_url: string;
  token_url: string;
  redirect_uri: string;
  scope: string;
}
