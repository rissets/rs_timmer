
# Stage 1: Builder
# Use a specific Node.js LTS version on Alpine for a smaller base image
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
# Copy package.json and package-lock.json (or yarn.lock if you use Yarn)
COPY package*.json ./
# Use --frozen-lockfile for CI/CD to ensure reproducible builds
RUN npm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js application
# The `standalone` output mode will be used due to next.config.js setting
RUN npm run build

# Stage 2: Production Runner
# Use the same Node.js LTS Alpine version for consistency
FROM node:20-alpine AS runner
WORKDIR /app

# Set NODE_ENV to production for security and performance
ENV NODE_ENV production

# Create a non-root user and group for better security
# Running as non-root user is a security best practice
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application artifacts from the builder stage
# These are specifically structured for the 'standalone' output mode
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to the non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Command to run the Next.js application
# This server.js file is part of the 'standalone' output
CMD ["node", "server.js"]
