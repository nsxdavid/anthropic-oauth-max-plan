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
 * Token management - save, load, and refresh tokens
 */

import fs from 'fs/promises';
import path from 'path';
import type { OAuthTokens } from './types.js';
import { refreshAccessToken } from './oauth.js';

const TOKEN_FILE = '.oauth-tokens.json';

/**
 * Save tokens to file
 */
export async function saveTokens(tokens: OAuthTokens): Promise<void> {
  await fs.writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2), 'utf-8');
  console.log(`✅ Tokens saved to ${TOKEN_FILE}`);
}

/**
 * Load tokens from file
 */
export async function loadTokens(): Promise<OAuthTokens | null> {
  try {
    const content = await fs.readFile(TOKEN_FILE, 'utf-8');
    return JSON.parse(content) as OAuthTokens;
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired (with 5 minute buffer)
 */
export function isTokenExpired(tokens: OAuthTokens): boolean {
  if (!tokens.expires_at) {
    return true;
  }

  const buffer = 5 * 60 * 1000; // 5 minutes
  return Date.now() >= tokens.expires_at - buffer;
}

/**
 * Get valid access token, refreshing if necessary
 */
export async function getValidAccessToken(): Promise<string> {
  const tokens = await loadTokens();

  if (!tokens) {
    throw new Error('No tokens found. Please run OAuth flow first: npm run oauth');
  }

  if (isTokenExpired(tokens)) {
    console.log('🔄 Token expired, refreshing...');
    const newTokens = await refreshAccessToken(tokens.refresh_token);

    // Preserve refresh token if not returned
    if (!newTokens.refresh_token) {
      newTokens.refresh_token = tokens.refresh_token;
    }

    await saveTokens(newTokens);
    console.log('✅ Token refreshed');
    return newTokens.access_token;
  }

  return tokens.access_token;
}
