#!/usr/bin/env tsx

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
 * Interactive CLI for Anthropic MAX Plan OAuth
 */

import readline from 'readline';
import { startOAuthFlow, exchangeCodeForTokens, refreshAccessToken } from './oauth.js';
import { loadTokens, saveTokens, isTokenExpired, getValidAccessToken } from './token-manager.js';
import { sendMessage } from './client.js';
import type { OAuthTokens } from './types.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function clearScreen() {
  console.log('\x1Bc'); // Clear screen
}

async function showAuthStatus() {
  console.log('\n' + '='.repeat(70));
  console.log('AUTHENTICATION STATUS');
  console.log('='.repeat(70));

  const tokens = await loadTokens();

  if (!tokens) {
    console.log('❌ Not authenticated');
    console.log('   Use option 1 to authenticate\n');
    return null;
  }

  const expired = isTokenExpired(tokens);
  const expiresIn = tokens.expires_at ? Math.floor((tokens.expires_at - Date.now()) / 1000 / 60) : 0;

  console.log('✅ Authenticated');
  console.log(`   Scope: ${tokens.scope}`);
  console.log(`   Status: ${expired ? '⚠️  EXPIRED' : '✓ Valid'}`);
  if (!expired && expiresIn > 0) {
    console.log(`   Expires in: ${expiresIn} minutes`);
  }
  console.log('');

  return tokens;
}

async function handleAuthenticate() {
  console.log('\n' + '='.repeat(70));
  console.log('AUTHENTICATE WITH ANTHROPIC MAX PLAN');
  console.log('='.repeat(70));
  console.log('\nStarting OAuth flow...');
  console.log('Your browser will open to authorize this application.\n');

  try {
    const { code, verifier, state } = await startOAuthFlow();
    console.log('\n✅ Authorization received');
    console.log('🔄 Exchanging for tokens...\n');

    const tokens = await exchangeCodeForTokens(code, verifier, state);
    await saveTokens(tokens);

    console.log('✅ Authentication successful!\n');
    console.log('Token details:');
    console.log(`  Scope: ${tokens.scope}`);
    console.log(`  Expires in: ${Math.floor(tokens.expires_in / 3600)} hours`);
    console.log('');

    await question('Press ENTER to continue...');
  } catch (error) {
    console.error('\n❌ Authentication failed:', error instanceof Error ? error.message : error);
    await question('\nPress ENTER to continue...');
  }
}

async function handleRefreshToken() {
  console.log('\n' + '='.repeat(70));
  console.log('REFRESH TOKEN');
  console.log('='.repeat(70));

  const tokens = await loadTokens();

  if (!tokens) {
    console.log('\n❌ No tokens found. Please authenticate first (option 1).\n');
    await question('Press ENTER to continue...');
    return;
  }

  try {
    console.log('\n🔄 Refreshing access token...\n');

    const newTokens = await refreshAccessToken(tokens.refresh_token);

    // Preserve refresh token if not returned
    if (!newTokens.refresh_token) {
      newTokens.refresh_token = tokens.refresh_token;
    }

    await saveTokens(newTokens);

    console.log('✅ Token refreshed successfully!\n');
    console.log('New token details:');
    console.log(`  Expires in: ${Math.floor(newTokens.expires_in / 3600)} hours`);
    console.log('');

    await question('Press ENTER to continue...');
  } catch (error) {
    console.error('\n❌ Token refresh failed:', error instanceof Error ? error.message : error);
    console.log('\nYou may need to re-authenticate (option 1).\n');
    await question('Press ENTER to continue...');
  }
}

async function handleSendMessage() {
  console.log('\n' + '='.repeat(70));
  console.log('SEND CHAT MESSAGE');
  console.log('='.repeat(70));

  try {
    // Get valid token (auto-refreshes if needed)
    const accessToken = await getValidAccessToken();

    console.log('\nEnter your message (or press ENTER for a test message):');
    const input = await question('> ');

    const message = input.trim() || 'Say hello and confirm you are Claude Code!';

    console.log(`\n📤 Sending: "${message}"\n`);
    console.log('⏳ Waiting for response...\n');

    const response = await sendMessage(accessToken, message, {
      model: 'claude-sonnet-4-5',
      maxTokens: 500
    });

    console.log('='.repeat(70));
    console.log('📥 RESPONSE:');
    console.log('='.repeat(70));
    console.log(response);
    console.log('='.repeat(70));
    console.log('\n✅ Success! (Flat-rate billing - no per-token charges)\n');

    await question('Press ENTER to continue...');

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    console.log('');

    if (error instanceof Error && error.message.includes('No tokens found')) {
      console.log('Please authenticate first (option 1).\n');
    } else if (error instanceof Error && error.message.includes('expired')) {
      console.log('Token expired. Try option 2 to refresh, or option 1 to re-authenticate.\n');
    }

    await question('Press ENTER to continue...');
  }
}

async function handleLogout() {
  console.log('\n' + '='.repeat(70));
  console.log('LOGOUT');
  console.log('='.repeat(70));

  const tokens = await loadTokens();

  if (!tokens) {
    console.log('\n❌ Not currently authenticated.\n');
    await question('Press ENTER to continue...');
    return;
  }

  console.log('\n⚠️  This will delete your stored tokens.');
  const confirm = await question('Are you sure? (y/N): ');

  if (confirm.toLowerCase() === 'y') {
    try {
      const fs = await import('fs/promises');
      await fs.unlink('.oauth-tokens.json');
      console.log('\n✅ Logged out successfully. Tokens deleted.\n');
    } catch (error) {
      console.error('\n❌ Error deleting tokens:', error instanceof Error ? error.message : error);
    }
  } else {
    console.log('\n❌ Logout cancelled.\n');
  }

  await question('Press ENTER to continue...');
}

async function showMenu(): Promise<string> {
  console.log('='.repeat(70));
  console.log('ANTHROPIC MAX PLAN OAUTH - INTERACTIVE CLI');
  console.log('='.repeat(70));
  console.log('\nOptions:');
  console.log('  1. Authenticate with Anthropic MAX Plan');
  console.log('  2. Refresh Token');
  console.log('  3. Send Chat Message');
  console.log('  4. Logout (Delete Tokens)');
  console.log('  5. Exit\n');

  return await question('Select option (1-5): ');
}

async function main() {
  clearScreen();

  // ASCII Banner
  console.log('\n');
  console.log('███╗   ███╗ █████╗ ██╗  ██╗    ██████╗ ██╗      █████╗ ███╗   ██╗');
  console.log('████╗ ████║██╔══██╗╚██╗██╔╝    ██╔══██╗██║     ██╔══██╗████╗  ██║');
  console.log('██╔████╔██║███████║ ╚███╔╝     ██████╔╝██║     ███████║██╔██╗ ██║');
  console.log('██║╚██╔╝██║██╔══██║ ██╔██╗     ██╔═══╝ ██║     ██╔══██║██║╚██╗██║');
  console.log('██║ ╚═╝ ██║██║  ██║██╔╝ ██╗    ██║     ███████╗██║  ██║██║ ╚████║');
  console.log('╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝    ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝');
  console.log('                        Proof-of-Concept                           ');
  console.log('');

  while (true) {
    await showAuthStatus();

    const choice = await showMenu();

    switch (choice.trim()) {
      case '1':
        await handleAuthenticate();
        clearScreen();
        break;

      case '2':
        await handleRefreshToken();
        clearScreen();
        break;

      case '3':
        await handleSendMessage();
        clearScreen();
        break;

      case '4':
        await handleLogout();
        clearScreen();
        break;

      case '5':
        console.log('\n👋 Goodbye!\n');
        rl.close();
        process.exit(0);

      default:
        console.log('\n❌ Invalid option. Please select 1-5.\n');
        await question('Press ENTER to continue...');
        clearScreen();
    }
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});
