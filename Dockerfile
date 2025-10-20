FROM oven/bun:1-alpine

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies (production only)
RUN bun install --frozen-lockfile --production

# Copy source code and assets
COPY src ./src
COPY assets ./assets
COPY tsconfig.json ./

# Set environment to production
ENV NODE_ENV=production

# Expose port (default 3000, can be overridden by env)
EXPOSE 3000

# Run the application
CMD ["bun", "run", "src/index.ts"]
