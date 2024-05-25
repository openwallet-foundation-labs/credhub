# Stage 1: Install dependencies
FROM docker.io/node:lts-alpine AS deps

ARG FOLDER=dist/apps/holder-backend

# Install necessary packages
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /home/node/app

# Copy dependency definitions
COPY ${FOLDER}/package.json ./
COPY pnpm-lock.yaml ./
COPY patches ./patches

# Install pnpm and dependencies
RUN npm install -g pnpm@8.15.8 && \
    pnpm install --prod

# Stage 2: Prepare the runtime image
FROM docker.io/node:lts-alpine AS runner

ARG FOLDER=dist/apps/holder-backend

# Install dumb-init
RUN apk add --no-cache dumb-init

# Set environment variables
ENV NODE_ENV production
ENV PORT 3000

# Set working directory
WORKDIR /home/node/app

# Copy dependencies and production files
COPY --from=deps /home/node/app/node_modules ./node_modules
COPY --from=deps /home/node/app/package.json ./package.json
COPY --chown=node:node ${FOLDER} .

# Set the user to 'node' to avoid permission issues
USER node

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["dumb-init", "node", "main.js"]
