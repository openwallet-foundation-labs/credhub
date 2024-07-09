#!/bin/sh

# Generate config.json
cat <<EOF > /usr/share/nginx/html/assets/config/config.json
{
  "backendUrl": "${BACKEND_URL}",
  "oidcUrl": "${OIDC_AUTH_URL}",
  "oidcClient": "${OIDC_CLIENT_ID}",
  "oidcAllowHttp": ${OIDC_ALLOW_HTTP}
}
EOF

# Start Nginx
exec nginx -g 'daemon off;'
