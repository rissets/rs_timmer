# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Set NODE_ENV to production for build
ENV NODE_ENV production

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Copy package.json and package-lock.json (or just package.json)
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy built artifacts from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/apphosting.yaml ./apphosting.yaml

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
# npm start is defined in package.json as "next start"
CMD ["npm", "start"]
