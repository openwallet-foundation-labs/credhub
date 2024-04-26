FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
ARG PROJECT

FROM base AS build
# the downside of this is that is can not cache the node_modules since a change to all elements will trigger a cache invalidation
COPY . /usr/src/app
WORKDIR /usr/src/app
ARG PROJECT
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
# build the project
RUN pnpm --filter=${PROJECT} run build
# deploy the project
RUN pnpm deploy --filter=${PROJECT} --prod /app

FROM base AS deploy
ARG PROJECT
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json
COPY --from=build /usr/src/app/apps/${PROJECT}/dist /app/dist
WORKDIR /app
EXPOSE 3000
CMD [ "node", "dist/main.js" ]
# healthcheck are done via docker compose since curl is not installed