#!/usr/bin/env node

import express, { Request, Response } from 'express';
import readline from 'readline';
import { getValidAccessToken, loadTokens, saveTokens } from '../token-manager.js';
import { startOAuthFlow, exchangeCodeForTokens } from '../oauth.js';
import { ensureRequiredSystemPrompt } from './middleware.js';
import { AnthropicRequest, AnthropicResponse } from '../types.js';
import { logger, LogLevel } from './logger.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--version' || arg === '-v') {
      console.log(`Anthropic MAX Plan Router v${packageJson.version}`);
      process.exit(0);
    }

    if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }

    if (arg === '--quiet' || arg === '-q') {
      logger.setLevel('quiet');
    } else if (arg === '--minimal' || arg === '-m') {
      logger.setLevel('minimal');
    } else if (arg === '--verbose' || arg === '-V') {
      logger.setLevel('maximum');
    } else if (arg === '--port' || arg === '-p') {
      const portValue = args[i + 1];
      if (portValue && !portValue.startsWith('-')) {
        PORT = parseInt(portValue);
        i++; // Skip next arg since we consumed it
      }
    }
    // medium is default, no flag needed
  }
}

function showHelp() {
  console.log(`
Anthropic MAX Plan Router v${packageJson.version}

Usage: npm run router [options]

Options:
  -h, --help        Show this help message
  -v, --version     Show version number
  -p, --port PORT   Port to listen on (default: 3000)

  Verbosity levels (default: medium):
  -q, --quiet       Quiet mode - no request logging
  -m, --minimal     Minimal logging - one line per request
                    Default: Medium logging - summary per request
  -V, --verbose     Maximum logging - full request/response bodies

Environment variables:
  ROUTER_PORT       Port to listen on (default: 3000)

Examples:
  npm run router                      # Start with medium verbosity on port 3000
  npm run router -- --port 8080       # Start on port 8080
  npm run router -- --minimal         # Start with minimal logging
  npm run router -- --verbose         # Start with full request/response logging
  npm run router -- --quiet           # Start with no request logging
  npm run router -- -p 8080 --verbose # Combine options
  ROUTER_PORT=8080 npm run router     # Alternative: use environment variable

More info: https://github.com/nsxdavid/anthropic-oauth-max-plan
`);
}

parseArgs();

const app = express();
let PORT = process.env.ROUTER_PORT ? parseInt(process.env.ROUTER_PORT) : 3000;

// Anthropic API configuration
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const ANTHROPIC_BETA = 'oauth-2025-04-20,claude-code-20250219,interleaved-thinking-2025-05-14,fine-grained-tool-streaming-2025-05-14';

// Parse JSON request bodies with increased limit for large payloads
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'anthropic-max-plan-router' });
});

// Shared handler for /v1/messages endpoint
const handleMessagesRequest = async (req: Request, res: Response) => {
  const requestId = Math.random().toString(36).substring(7);
  const timestamp = new Date().toISOString();

  try {
    // Get the request body as an AnthropicRequest
    const originalRequest = req.body as AnthropicRequest;

    const hadSystemPrompt = !!(originalRequest.system && originalRequest.system.length > 0);

    // Ensure the required system prompt is present
    const modifiedRequest = ensureRequiredSystemPrompt(originalRequest);

    // Get a valid OAuth access token (auto-refreshes if needed)
    const accessToken = await getValidAccessToken();

    // Forward the request to Anthropic API
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-beta': ANTHROPIC_BETA,
      },
      body: JSON.stringify(modifiedRequest),
    });

    // Get the response data
    const responseData = await response.json() as AnthropicResponse;

    // Log the request
    logger.logRequest(
      requestId,
      timestamp,
      originalRequest,
      hadSystemPrompt,
      { status: response.status, data: responseData }
    );

    // Forward the status code and response
    res.status(response.status).json(responseData);

  } catch (error) {
    // Log the error
    logger.logRequest(
      requestId,
      timestamp,
      req.body as AnthropicRequest,
      false,
      undefined,
      error instanceof Error ? error : new Error('Unknown error')
    );

    // Handle specific error cases
    if (error instanceof Error) {
      res.status(500).json({
        error: {
          type: 'internal_error',
          message: error.message
        }
      });
      return;
    }

    res.status(500).json({
      error: {
        type: 'internal_error',
        message: 'An unexpected error occurred'
      }
    });
  }
};

// Main proxy endpoint
app.post('/v1/messages', handleMessagesRequest);

// Route alias to handle Stagehand v3 SDK bug that doubles the /v1 prefix
app.post('/v1/v1/messages', handleMessagesRequest);

// Startup sequence
async function startRouter() {
  logger.startup('');
  logger.startup('███╗   ███╗ █████╗ ██╗  ██╗    ██████╗ ██╗      █████╗ ███╗   ██╗');
  logger.startup('████╗ ████║██╔══██╗╚██╗██╔╝    ██╔══██╗██║     ██╔══██╗████╗  ██║');
  logger.startup('██╔████╔██║███████║ ╚███╔╝     ██████╔╝██║     ███████║██╔██╗ ██║');
  logger.startup('██║╚██╔╝██║██╔══██║ ██╔██╗     ██╔═══╝ ██║     ██╔══██║██║╚██╗██║');
  logger.startup('██║ ╚═╝ ██║██║  ██║██╔╝ ██╗    ██║     ███████╗██║  ██║██║ ╚████║');
  logger.startup('╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝    ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝');
  logger.startup('                         ═══════ Router ═══════                     ');
  logger.startup('');

  // Check if we have tokens
  let tokens = await loadTokens();

  if (!tokens) {
    logger.startup('No OAuth tokens found. Starting authentication...');
    logger.startup('');

    try {
      const { code, verifier, state } = await startOAuthFlow(askQuestion);
      logger.startup('✅ Authorization received');
      logger.startup('🔄 Exchanging for tokens...\n');

      const newTokens = await exchangeCodeForTokens(code, verifier, state);
      await saveTokens(newTokens);
      tokens = newTokens;

      logger.startup('✅ Authentication successful!');
      logger.startup('');
    } catch (error) {
      logger.error('❌ Authentication failed:', error instanceof Error ? error.message : error);
      rl.close();
      process.exit(1);
    }
  } else {
    logger.startup('✅ OAuth tokens found.');
  }

  // Validate/refresh token
  try {
    await getValidAccessToken();
    logger.startup('✅ Token validated.');
  } catch (error) {
    logger.error('❌ Token validation failed:', error);
    logger.info('Please delete .oauth-tokens.json and restart.');
    rl.close();
    process.exit(1);
  }

  // Close readline interface since we don't need it anymore
  rl.close();

  logger.startup('');

  // Start the server
  app.listen(PORT, () => {
    logger.startup(`🚀 Router running on http://localhost:${PORT}`);
    logger.startup('');
    logger.startup('📋 Endpoints:');
    logger.startup(`   POST http://localhost:${PORT}/v1/messages`);
    logger.startup(`   GET  http://localhost:${PORT}/health`);
    logger.startup('');
    logger.startup('💡 Configure your AI tool to use http://localhost:' + PORT + ' as the base URL');
    logger.startup('');
  });
}

// Start the router
startRouter().catch((error) => {
  logger.error('Failed to start router:', error);
  process.exit(1);
});
