# Proton

A Discord bot built with Discord.js and Bun runtime. Why MEE6 when you got Proton?

## Features

- ✨ Slash Commands
- 💬 Message Commands
- 🖱️ Context Menu Commands
- 🔘 Button Interactions
- 📋 Select Menu Interactions
- 📝 Modal Submissions
- 🗄️ MongoDB Database Integration
- 🌐 REST API with Hono
- 🔥 Hot Reload for Development
- 🐳 Docker Support
- 📦 TypeScript Support

## Tech Stack

- **Runtime:** [Bun](https://bun.sh) - Fast all-in-one JavaScript runtime
- **Framework:** [Discord.js](https://discord.js.org) v14
- **API:** [Hono](https://hono.dev) - Ultrafast web framework
- **Database:** [MongoDB](https://mongodb.com) with Mongoose
- **Language:** TypeScript
- **Linting/Formatting:** Biome

## Prerequisites

- [Bun](https://bun.sh) v1.0.0 or higher
- MongoDB instance (local or cloud)
- Discord Bot Token and Application ID

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
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
   MONGO_URI=mongodb://localhost:27017
   DATABASE_NAME=proton

   # API Configuration
   PORT=3000

   # Environment
   NODE_ENV=development

   # Optional: Discord Webhook for Logging
   WEBHOOK_URL=your_webhook_url_here
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

## Docker Deployment

### Using Docker Compose (Recommended)

The project includes MongoDB in the docker-compose configuration:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f bot

# Stop services
docker-compose down
```

### Using Docker Only

```bash
# Build the image
docker build -t proton-bot .

# Run the container
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
│   ├── commands/            # Bot commands
│   │   ├── application/     # Slash and context menu commands
│   │   ├── components/      # Button, select menu, and modal handlers
│   │   └── messageCommands/ # Prefix-based commands
│   ├── configs/             # Configuration files
│   ├── database/            # Database models and connection
│   │   ├── models/          # Mongoose schemas
│   │   └── main.ts          # Database connection
│   ├── events/              # Discord event handlers
│   │   ├── handlers/        # Interaction handlers
│   │   └── debug/           # Debug events
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   │   ├── env.ts           # Environment variable handling
│   │   ├── logger.ts        # Logging utility
│   │   └── webhook.ts       # Discord webhook client
│   └── index.ts             # Application entry point
├── assets/                  # Static assets
├── .github/                 # GitHub Actions workflows
├── Dockerfile              # Docker configuration
├── docker-compose.yaml     # Docker Compose configuration
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── biome.json              # Biome linter/formatter config
└── README.md               # This file
```

## API Endpoints

The bot includes a REST API built with Hono:

- `GET /` - Health check endpoint
- `GET /ready` - Returns bot ready status

Default port: `3000` (configurable via `PORT` environment variable)

## Adding Commands

### Slash Command

Create a file in `src/commands/application/slash/`:

```typescript
import { SlashCommandBuilder } from 'discord.js';
import { createSlashCommand } from '../../../utils/create';

export default createSlashCommand({
  data: new SlashCommandBuilder()
    .setName('example')
    .setDescription('Example command'),
  
  async execute({ interaction, client }) {
    await interaction.reply('Hello from Proton!');
  }
});
```

### Button Command

Create a file in `src/commands/components/buttons/`:

```typescript
import { createButtonCommand } from '../../../utils/create';

export default createButtonCommand({
  data: {
    customId: 'example-button'
  },
  
  async execute({ interaction, client }) {
    await interaction.reply('Button clicked!');
  }
});
```

## Events

Event handlers are automatically loaded from `src/events/`. Create a new file:

```typescript
import { Events } from 'discord.js';
import type { Event } from '../types/event';

export default {
  name: Events.MessageCreate,
  clientIsReady: true,
  
  async run(client, message) {
    // Your event logic here
  }
} satisfies Event<Events.MessageCreate>;
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_BOT_TOKEN` | ✅ | Your Discord bot token |
| `DISCORD_CLIENT_ID` | ✅ | Your Discord application ID |
| `MONGO_URI` | ✅ | MongoDB connection string |
| `DATABASE_NAME` | ✅ | MongoDB database name |
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

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Author

**fraimerdev**

---

Built with ❤️ using Bun and Discord.js