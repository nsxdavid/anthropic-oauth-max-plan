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
 * Test the Anthropic MAX plan OAuth implementation
 *
 * Usage: npm test
 */

import { getValidAccessToken } from './token-manager.js';
import { sendMessage } from './client.js';

async function main() {
  try {
    console.log('🧪 Testing Anthropic MAX Plan OAuth\n');

    // Get valid access token (will refresh if needed)
    console.log('🔑 Getting access token...');
    const accessToken = await getValidAccessToken();
    console.log('✅ Access token obtained\n');

    // Test 1: Simple message
    console.log('📤 Test 1: Simple message to Claude Sonnet 4.5');
    console.log('   Message: "Say hello and confirm you are Claude Code!"\n');

    const response1 = await sendMessage(
      accessToken,
      'Say hello and confirm you are Claude Code!',
      {
        model: 'claude-sonnet-4-5',
        maxTokens: 200
      }
    );

    console.log('📥 Response:');
    console.log(response1);
    console.log('\n' + '='.repeat(70) + '\n');

    // Test 2: With custom system prompt
    console.log('📤 Test 2: Message with custom system prompt');
    console.log('   System: "You are a helpful coding assistant."\n');

    const response2 = await sendMessage(
      accessToken,
      'Write a hello world function in TypeScript',
      {
        model: 'claude-sonnet-4-5',
        maxTokens: 300,
        systemPrompt: 'You are a helpful coding assistant. Always include comments in code examples.'
      }
    );

    console.log('📥 Response:');
    console.log(response2);
    console.log('\n' + '='.repeat(70) + '\n');

    console.log('✅ All tests passed!');
    console.log('\n💰 Billing: These requests are covered by your MAX subscription ($200/month flat rate)');
    console.log('   No per-token charges applied! 🎉\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('\nIf you see "No tokens found", run: npm run oauth\n');
    process.exit(1);
  }
}

main();
