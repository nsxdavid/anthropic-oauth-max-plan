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
 * OAuth utilities for Anthropic MAX plan authentication
 */

import crypto from 'crypto';
import { URL } from 'url';
import type { OAuthTokens, OAuthConfig } from './types.js';

export const OAUTH_CONFIG: OAuthConfig = {
  client_id: '9d1c250a-e61b-44d9-88ed-5944d1962f5e',
  authorize_url: 'https://claude.ai/oauth/authorize',  // MAX mode
  token_url: 'https://console.anthropic.com/v1/oauth/token',
  redirect_uri: 'https://console.anthropic.com/oauth/code/callback',
  scope: 'org:create_api_key user:profile user:inference'
};

/**
 * Generate PKCE code verifier and challenge
 */
export function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');

  return { verifier, challenge };
}

/**
 * Generate random state for CSRF protection
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Build authorization URL for OAuth flow
 */
export function getAuthorizationUrl(codeChallenge: string, state: string): string {
  const url = new URL(OAUTH_CONFIG.authorize_url);
  url.searchParams.set('code', 'true');  // Tell it to return code
  url.searchParams.set('client_id', OAUTH_CONFIG.client_id);
  url.searchParams.set('redirect_uri', OAUTH_CONFIG.redirect_uri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', OAUTH_CONFIG.scope);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);

  return url.toString();
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<OAuthTokens> {
  // OAuth 2.0 spec (RFC 6749) requires application/x-www-form-urlencoded
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: OAUTH_CONFIG.client_id,
    code,
    redirect_uri: OAUTH_CONFIG.redirect_uri,
    code_verifier: codeVerifier
  });

  const response = await fetch(OAUTH_CONFIG.token_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const tokens = await response.json() as OAuthTokens;

  // Add expiration timestamp
  tokens.expires_at = Date.now() + (tokens.expires_in * 1000);
  tokens.created_at = new Date().toISOString();

  return tokens;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
  // OAuth 2.0 spec (RFC 6749) requires application/x-www-form-urlencoded
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: OAUTH_CONFIG.client_id,
    refresh_token: refreshToken
  });

  const response = await fetch(OAUTH_CONFIG.token_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const tokens = await response.json() as OAuthTokens;

  // Add expiration timestamp
  tokens.expires_at = Date.now() + (tokens.expires_in * 1000);
  tokens.created_at = new Date().toISOString();

  return tokens;
}

/**
 * Start OAuth flow - user manually copies code from redirect
 */
export async function startOAuthFlow(): Promise<{ code: string; verifier: string }> {
  const { verifier, challenge } = generatePKCE();
  const state = generateState();
  const authUrl = getAuthorizationUrl(challenge, state);

  console.log('\n🔐 Starting OAuth flow...\n');
  console.log('Please visit this URL to authorize:\n');
  console.log(authUrl);
  console.log('\n' + '='.repeat(70));
  console.log('After authorizing, you will be redirected to a page.');
  console.log('Copy the ENTIRE URL from your browser address bar.');
  console.log('It will look like: https://console.anthropic.com/oauth/code/callback?code=...&state=...');
  console.log('='.repeat(70) + '\n');

  // Import readline dynamically
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve, reject) => {
    rl.question('Paste the redirect URL here: ', (input) => {
      rl.close();

      try {
        const url = new URL(input.trim());
        const code = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        if (error) {
          reject(new Error(`Authorization failed: ${error}`));
          return;
        }

        if (!code) {
          reject(new Error('No authorization code found in URL'));
          return;
        }

        // Verify state to prevent CSRF attacks
        if (returnedState !== state) {
          reject(new Error('State mismatch - possible CSRF attack'));
          return;
        }

        console.log('\n✅ Authorization code received!\n');
        resolve({ code, verifier });
      } catch (err) {
        reject(new Error(`Invalid URL format: ${err}`));
      }
    });
  });
}
