# Install dependencies only when needed
FROM docker.io/node:lts-alpine as deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app
COPY dist/apps/issuer-backend/package.json ./
COPY pnpm-lock.yaml ./
COPY patches ./patches
RUN npm install -g pnpm@8.15.8
RUN pnpm install --prod

# Production image, copy all the files and run nest
FROM docker.io/node:lts-alpine as runner
RUN apk add --no-cache dumb-init
ENV NODE_ENV production
ENV PORT 3000
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/package.json ./package.json
COPY dist/apps/issuer-backend .
RUN chown -R node:node .
RUN mkdir /usr/src/app/tmp
RUN chmod 777 /usr/src/app/tmp
USER node
EXPOSE 3000
CMD ["dumb-init", "node", "main.js"]
