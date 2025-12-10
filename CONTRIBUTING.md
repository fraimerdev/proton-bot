# Contributing to Proton

First off, thank you for considering contributing to Proton! It's people like you that make Proton such a great tool for the Discord community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

Before you begin:
- Make sure you have [Bun](https://bun.sh) installed (v1.0.0 or higher)
- Have a Discord account and basic understanding of Discord bots
- Familiarize yourself with TypeScript and Discord.js v14
- Read through the [README.md](README.md) to understand the project

## Development Setup

1. **Fork the repository** on GitHub

2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/proton-bot.git
   cd proton-bot
   ```

3. **Add the upstream repository:**
   ```bash
   git remote add upstream https://github.com/fraimerdev/proton-bot.git
   ```

4. **Install dependencies:**
   ```bash
   bun install
   ```

5. **Set up your environment:**
   - Copy `.env.example` to `.env` (if available) or create a `.env` file
   - Add your Discord bot token and other required variables
   - Set up a local PostgreSQL database
   - Set up a local Redis instance (optional for development)

6. **Set up the database:**
   ```bash
   bunx prisma generate
   bunx prisma migrate dev
   ```

7. **Run the bot in development mode:**
   ```bash
   bun run dev
   ```

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** to demonstrate the steps
- **Describe the behavior you observed** and what you expected
- **Include screenshots or GIFs** if applicable
- **Include your environment details** (OS, Bun version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **List any similar features** in other bots if applicable

### Your First Code Contribution

Unsure where to begin? You can start by looking through issues labeled:
- `good first issue` - Issues that should only require a few lines of code
- `help wanted` - Issues that may be more involved but are great for contributors

### Pull Requests

1. **Create a new branch** for your feature or fix:
   ```bash
   git checkout -b feature/amazing-feature
   # or
   git checkout -b fix/bug-fix
   ```

2. **Make your changes** following our [Coding Standards](#coding-standards)

3. **Test your changes thoroughly**

4. **Commit your changes** with clear, descriptive commit messages:
   ```bash
   git commit -m "Add: New leveling command for rank display"
   # or
   git commit -m "Fix: Starboard duplicate message issue"
   ```

5. **Push to your fork:**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request** on GitHub

## Pull Request Process

1. **Update documentation** if you've made changes that require it
2. **Follow the PR template** if one is provided
3. **Ensure all checks pass** (linting, formatting)
4. **Request review** from maintainers
5. **Address any feedback** from reviewers
6. **Be patient** - maintainers will review your PR as soon as possible

### PR Guidelines

- Keep PRs focused on a single feature or fix
- Write clear PR descriptions explaining what and why
- Reference related issues using `#issue-number`
- Add screenshots/GIFs for UI changes
- Ensure your branch is up to date with `main`

## Coding Standards

### Code Style

We use **Biome** for code formatting and linting:

```bash
# Format code
bun run format

# Lint code
bun run lint

# Run all checks
bun run check
```

**Always run these commands before committing!**

### TypeScript Guidelines

- Use TypeScript's strict mode
- Avoid using `any` - use proper types
- Leverage Prisma's generated types for database operations
- Use enums from `src/types/enums.ts` for command types

### Naming Conventions

- **Files:** Use kebab-case (e.g., `user-profile.ts`)
- **Classes:** Use PascalCase (e.g., `class CommandHandler`)
- **Functions/Variables:** Use camelCase (e.g., `getUserData()`)
- **Constants:** Use UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Interfaces/Types:** Use PascalCase (e.g., `interface UserData`)

### Module Structure

When creating a new module in `src/modules/`, follow this structure:

```
module-name/
├── commands/          # Slash commands
│   └── command.ts
├── components/        # Buttons, select menus, modals
│   └── button.ts
└── events/           # Discord events (optional)
    └── event.ts
```

### Command Structure

```typescript
import { SlashCommandBuilder, InteractionContextType } from 'discord.js';
import { CommandTypes } from '../../../types/enums';
import { createCommand } from '../../../utils/create';

export const command = createCommand({
  type: CommandTypes.SlashCommand,
  data: new SlashCommandBuilder()
    .setName('command-name')
    .setDescription('Command description')
    .setContexts(InteractionContextType.Guild),
  
  execute: async (client, interaction) => {
    // Your command logic here
    await interaction.reply('Response');
    return true;
  },
});
```

### Component Structure

```typescript
import { CommandTypes } from '../../../types/enums';
import { createCommand } from '../../../utils/create';

export const command = createCommand({
  type: CommandTypes.Button, // or Modal, SelectMenu
  data: {
    customId: 'unique-id',
  },
  
  execute: async (client, interaction) => {
    // Your component logic here
    await interaction.reply('Response');
    return true;
  },
});
```

### Database Changes

When making database changes:

1. **Modify the Prisma schema** in `prisma/schema.prisma`
2. **Create a migration:**
   ```bash
   bunx prisma migrate dev --name descriptive_migration_name
   ```
3. **Test the migration** thoroughly
4. **Commit both the schema and migration files**

### Commit Message Guidelines

Follow this format:

```
Type: Brief description

Detailed explanation (if needed)

Closes #issue-number
```

**Types:**
- `Add:` New feature or functionality
- `Fix:` Bug fix
- `Update:` Changes to existing features
- `Refactor:` Code refactoring
- `Docs:` Documentation changes
- `Style:` Code style/formatting changes
- `Test:` Adding or updating tests
- `Chore:` Maintenance tasks

**Examples:**
```
Add: User reputation system with commands

Implements a reputation system allowing users to give
and receive reputation points. Includes /rep command
and leaderboard display.

Closes #42
```

```
Fix: Starboard messages not appearing

Fixed an issue where starboard messages weren't being
posted due to incorrect permission checks.

Closes #78
```

## Testing

### Manual Testing

Before submitting a PR:

1. Test your changes in a development Discord server
2. Try edge cases and error scenarios
3. Verify error messages are helpful and clear
4. Check that logging works correctly
5. Ensure no breaking changes to existing features

### Database Testing

- Test migrations on a fresh database
- Verify data integrity after migrations
- Test rollback if applicable
- Check Prisma Studio displays data correctly

## Community

### Getting Help

- **Discord:** Join our support server (if available)
- **GitHub Issues:** For bugs and feature requests
- **GitHub Discussions:** For questions and community chat

### Recognition

Contributors will be recognized in the project! All contributors are listed in our GitHub contributors page.

## Questions?

Don't hesitate to ask questions! You can:
- Open an issue with the `question` label
- Reach out to maintainers
- Check existing issues and PRs for similar questions

---

Thank you for contributing to Proton! Every contribution, no matter how small, is valued and appreciated. 🎉