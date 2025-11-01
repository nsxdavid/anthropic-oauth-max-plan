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
import http from 'http';
import { URL } from 'url';
import type { OAuthTokens, OAuthConfig } from './types.js';

export const OAUTH_CONFIG: OAuthConfig = {
  client_id: '9d1c250a-e61b-44d9-88ed-5944d1962f5e',
  authorize_url: 'https://claude.ai/oauth/authorize',  // MAX mode
  token_url: 'https://console.anthropic.com/v1/oauth/token',
  redirect_uri: 'http://localhost:8000/callback',
  scope: 'user:inference user:profile'
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
  const response = await fetch(OAUTH_CONFIG.token_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: OAUTH_CONFIG.client_id,
      code,
      redirect_uri: OAUTH_CONFIG.redirect_uri,
      code_verifier: codeVerifier
    })
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
  const response = await fetch(OAUTH_CONFIG.token_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: OAUTH_CONFIG.client_id,
      refresh_token: refreshToken
    })
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
 * Start OAuth flow and wait for callback
 */
export function startOAuthFlow(): Promise<{ code: string; verifier: string }> {
  return new Promise((resolve, reject) => {
    const { verifier, challenge } = generatePKCE();
    const state = generateState();
    const authUrl = getAuthorizationUrl(challenge, state);

    console.log('\n🔐 Starting OAuth flow...\n');
    console.log('Please visit this URL to authorize:\n');
    console.log(authUrl);
    console.log('\nWaiting for callback...\n');

    const server = http.createServer((req, res) => {
      const url = new URL(req.url!, `http://localhost:8000`);

      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<h1>Authorization failed</h1><p>Error: ${error}</p>`);
          server.close();
          reject(new Error(`Authorization failed: ${error}`));
          return;
        }

        // Verify state to prevent CSRF attacks
        if (returnedState !== state) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>State mismatch - possible CSRF attack</h1>');
          server.close();
          reject(new Error('State mismatch - possible CSRF attack'));
          return;
        }

        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <h1>✅ Authorization successful!</h1>
            <p>You can close this window and return to the terminal.</p>
          `);
          server.close();
          resolve({ code, verifier });
          return;
        }

        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<h1>Missing authorization code</h1>');
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(8000, () => {
      console.log('📡 Callback server listening on http://localhost:8000');
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('OAuth flow timed out after 5 minutes'));
    }, 5 * 60 * 1000);
  });
}
