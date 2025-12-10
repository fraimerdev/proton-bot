# Proton

A powerful, modular and open-source Discord bot built with Discord.js and Bun. Why MEE6 when you got Proton?

## Features

- ✨ Slash Commands
- 🔘 Button & Select Menu Components
- 📝 Modal Interactions
- 🗄️ PostgreSQL Database with Prisma ORM
- 🔴 Redis Caching
- 🌐 REST API with Hono
- 🐳 Docker
- 📦 TypeScript
- 🧩 Modular

## Modules

Proton features a modular system for organizing bot functionality:

- **Moderation** - Server moderation tools
- **Leveling** - XP and leveling system
- **Logging** - Server activity logging
- **Automod** - Automated moderation
- **Starboard** - Star message board
- **Tickets** - Support ticket system

## Tech Stack

- **Runtime:** [Bun](https://bun.sh) - Fast all-in-one JavaScript runtime
- **Framework:** [Discord.js](https://discord.js.org) v14
- **API:** [Hono](https://hono.dev) - Ultrafast web framework
- **Database:** [PostgreSQL](https://postgresql.org) with [Prisma](https://prisma.io) ORM
- **Cache:** [Redis](https://redis.io) with ioredis client
- **Language:** TypeScript
- **Linting/Formatting:** Biome

## Prerequisites

- [Bun](https://bun.sh) v1.0.0 or higher
- PostgreSQL instance (local or cloud)
- Redis instance (local or cloud)
- Discord Bot Token and Application ID

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/fraimerdev/proton-bot.git
   cd proton-bot
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Set up environment variables:**
   
   Create a `.env` file in the root directory:
   ```env
   # Discord Configuration
   DISCORD_BOT_TOKEN=your_bot_token_here
   DISCORD_CLIENT_ID=your_client_id_here

   # Database Configuration
   DATABASE_URL=postgresql://username:password@localhost:5432/proton?schema=public

   # Redis Configuration (optional for Docker, required for production)
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # API Configuration
   PORT=3000

   # Environment
   NODE_ENV=development

   # Optional: Discord Webhook for Logging
   WEBHOOK_URL=your_webhook_url_here
   ```

4. **Set up the database:**
   ```bash
   # Generate Prisma Client
   bunx prisma generate

   # Run database migrations
   bunx prisma migrate dev
   ```

## Usage

### Development Mode (with hot reload)

```bash
bun run dev
```

### Production Mode

```bash
bun run start
```

### Code Quality

```bash
# Format code
bun run format

# Lint code
bun run lint

# Check all (format + lint)
bun run check
```

### Database Management

```bash
# Open Prisma Studio (Database GUI)
bunx prisma studio

# Create a new migration
bunx prisma migrate dev --name your_migration_name

# Deploy migrations to production
bunx prisma migrate deploy

# Reset database (development only)
bunx prisma migrate reset
```

## Docker Deployment

### Using Docker Compose (Recommended)

The project includes PostgreSQL and Redis in the docker-compose configuration:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f bot

# Stop services
docker-compose down

# Stop services and remove volumes
docker-compose down -v
```

### Using Docker Only

```bash
# Build the image
docker build -t proton-bot .

# Run the container (requires external PostgreSQL and Redis)
docker run -d \
  --env-file .env \
  -p 3000:3000 \
  --name proton-bot \
  proton-bot
```

## Project Structure

```
proton-bot/
├── src/
│   ├── api/                  # REST API endpoints
│   │   └── app.ts           # Hono application
│   ├── base/                # Base classes and builders
│   │   ├── client.ts        # Extended Discord client
│   │   ├── componentCommandBuilder.ts
│   │   └── messageCommandBuilder.ts
│   ├── configs/             # Configuration files
│   ├── generated/           # Generated Prisma client
│   │   └── prisma/          # Prisma client output
│   ├── init/                # Initialization scripts
│   ├── modules/             # Feature modules
│   │   └── module/          # The various modules
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   │   ├── env.ts           # Environment variable handling
│   │   ├── logger.ts        # Logging utility
│   │   ├── webhook.ts       # Discord webhook client
│   │   ├── create.ts        # Command creation utilities
│   │   └── prototype.ts     # Prototype extensions
│   └── index.ts             # Application entry point
├── prisma/                  # Prisma schema and migrations
│   └── schema.prisma        # Database schema
├── .github/                 # GitHub Actions workflows
├── Dockerfile              # Docker configuration
├── docker-compose.yaml     # Docker Compose configuration
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── biome.json              # Biome linter/formatter config
├── prisma.config.ts        # Prisma configuration
└── README.md               # This file
```

## API Endpoints

The bot includes a REST API built with Hono:

- `GET /` - Health check endpoint
- `GET /ready` - Returns bot ready status

Default port: `3000` (configurable via `PORT` environment variable)

## Creating a Module

Modules are organized in `src/modules/`. Each module can contain:

```
module-name/
├── commands/        # Slash commands
├── components/      # Buttons, select menus, modals
└── events/          # Discord events
```

### Example Command

Create a file in `src/modules/your-module/commands/example.ts`:

```typescript
import { SlashCommandBuilder, InteractionContextType } from 'discord.js';
import { CommandTypes } from '../../../types/enums';
import { createCommand } from '../../../utils/create';

export const command = createCommand({
  type: CommandTypes.SlashCommand,
  data: new SlashCommandBuilder()
    .setName('example')
    .setDescription('Example command')
    .setContexts(InteractionContextType.Guild),
  
  execute: async (client, interaction) => {
    await interaction.reply('Hello from Proton!');
    return true;
  },
});
```

### Example Button Component

Create a file in `src/modules/your-module/components/example-button.ts`:

```typescript
import { CommandTypes } from '../../../types/enums';
import { createCommand } from '../../../utils/create';

export const command = createCommand({
  type: CommandTypes.Button,
  data: {
    customId: 'example-button',
  },
  
  execute: async (client, interaction) => {
    await interaction.reply('Button clicked!');
    return true;
  },
});
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_BOT_TOKEN` | ✅ | Your Discord bot token |
| `DISCORD_CLIENT_ID` | ✅ | Your Discord application ID |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_HOST` | ❌ | Redis host (default: localhost) |
| `REDIS_PORT` | ❌ | Redis port (default: 6379) |
| `PORT` | ❌ | API server port (default: 3000) |
| `NODE_ENV` | ✅ | Environment (development/production) |
| `WEBHOOK_URL` | ❌ | Discord webhook URL for logging |

## Scripts

| Command | Description |
|---------|-------------|
| `bun run start` | Start the bot in production mode |
| `bun run dev` | Start the bot with hot reload |
| `bun run format` | Format code with Biome |
| `bun run lint` | Lint code with Biome |
| `bun run check` | Run all checks (format + lint) |
| `bun run clean` | Remove node_modules |

## Why Bun?

This project uses Bun instead of Node.js for several advantages:

- ⚡ **Faster Startup:** Bun starts significantly faster than Node.js
- 📦 **Native TypeScript:** Run TypeScript directly without compilation
- 🔋 **Built-in Tools:** Includes bundler, test runner, and package manager
- 🌍 **Web Standard APIs:** Built on JavaScriptCore with modern standards
- 🔐 **Native .env Support:** Automatically loads environment variables
- 💾 **Lower Memory Usage:** More efficient memory management

## Why Prisma?

- 🎯 **Type Safety:** Auto-generated TypeScript types for your database
- 📝 **Intuitive Schema:** Easy-to-read schema definition language
- 🔄 **Migrations:** Built-in migration system for database changes
- 🎨 **Prisma Studio:** Visual database browser included
- 🔌 **Multiple Databases:** Easy to switch between database providers

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**fraimerdev**

---

Built with ❤️ using Bun, Discord.js, and Prisma