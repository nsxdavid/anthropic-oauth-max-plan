# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.0] - 2025-11-01

### Added
- Initial release of Anthropic MAX Plan OAuth implementation
- Interactive CLI with menu-driven interface
- OAuth authentication flow (PKCE)
- Token management with automatic refresh
- Chat mode for sending messages to Claude
- Proof of MAX Plan validation test feature
- Comprehensive documentation (README + Implementation Guide)
- MIT License
- Security-focused .gitignore

### Features
- ✅ Authenticate with Anthropic MAX Plan OAuth
- ✅ Access premium models (Sonnet 4.5, Opus) with flat-rate billing
- ✅ Automatic token refresh (8-hour expiration)
- ✅ Chat mode with continuous conversation
- ✅ Token storage and management
- ✅ Logout/delete tokens option
- ✅ Educational validation test to prove MAX plan enforcement

### Documentation
- Detailed implementation guide with system prompt validation tests
- Quick start guide in README
- Code examples for basic and advanced usage
- Troubleshooting section
- Security best practices

### Security
- OAuth tokens never committed to git
- Comprehensive .gitignore for secrets, tokens, and sensitive files
- Educational disclaimers throughout
- CSRF protection with state parameter validation

---

## Development Notes

This project demonstrates using Anthropic's official OAuth flow with Claude MAX subscription for flat-rate billing instead of pay-per-token pricing.

Tested and verified working as of November 1st, 2025.
