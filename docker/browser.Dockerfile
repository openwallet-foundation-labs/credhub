FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
ARG PROJECT

FROM base AS build
# the downside of this is that is can not cache the node_modules since a change to all elements will trigger a cache invalidation
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
# build the project
RUN pnpm --filter=${PROJECT} run build
# deploy the project
RUN pnpm deploy --filter=${PROJECT} --prod /app

FROM georgjung/nginx-brotli:1.23.3
ARG PROJECT
ARG SUB_PROJECT
WORKDIR /usr/share/nginx/html
RUN mkdir -p /etc/nginx && \
    echo 'events {}' > /etc/nginx/nginx.conf && \
    echo 'http {' >> /etc/nginx/nginx.conf && \
    echo '    include /etc/nginx/mime.types;' >> /etc/nginx/nginx.conf && \
    echo '    server {' >> /etc/nginx/nginx.conf && \
    echo '        listen 80;' >> /etc/nginx/nginx.conf && \
    echo '        root /usr/share/nginx/html;' >> /etc/nginx/nginx.conf && \
    echo '        index index.html;' >> /etc/nginx/nginx.conf && \
    echo '        location / {' >> /etc/nginx/nginx.conf && \
    echo '            try_files $uri $uri/ /index.html;' >> /etc/nginx/nginx.conf && \
    echo '        }' >> /etc/nginx/nginx.conf && \
    echo '    }' >> /etc/nginx/nginx.conf && \
    echo '}' >> /etc/nginx/nginx.conf
COPY --from=build /usr/src/app/apps/${PROJECT}/dist/${SUB_PROJECT}/browser .
# remove all map files since we do not want them in production
# RUN rm -f *.map
