# Contributing

Thanks for your interest in contributing to this project!

## How to Contribute

This is a proof-of-concept demonstration project. Contributions are welcome in the form of:

- **Bug reports** - If something doesn't work as documented
- **Documentation improvements** - Clarifications, corrections, or additions
- **Code improvements** - Bug fixes, refactoring, or enhancements
- **Testing** - Verification on different platforms or configurations

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/anthropic-oauth-max-plan.git`
3. Install dependencies: `npm install`
4. Make your changes
5. Test your changes: `npm run cli`
6. Commit with clear messages
7. Push to your fork
8. Open a Pull Request

## Guidelines

### Code Style
- Use TypeScript
- Follow existing code formatting
- Add types for all functions and variables
- Include comments for complex logic

### Commits
- Use clear, descriptive commit messages
- Reference issues if applicable
- Keep commits focused on a single change

### Pull Requests
- Describe what your PR does and why
- Reference any related issues
- Ensure the CLI still works: `npm run cli`
- Update documentation if needed

### Security
- **Never commit tokens or API keys**
- Check that `.oauth-tokens.json` remains in `.gitignore`
- Verify sensitive data isn't logged

## Questions?

Open an issue for:
- Questions about the implementation
- Feature requests
- Bug reports
- Documentation clarifications

## Disclaimer

This project demonstrates using Anthropic's official OAuth flow for educational purposes. All contributions must maintain:
- Educational/entertainment disclaimers
- Compliance with Anthropic's Terms of Service
- No malicious code or harmful modifications

---

**Thank you for contributing!** 🎉
