#!/bin/sh

# Generate config.json
cat <<EOF > /usr/share/nginx/html/assets/config.json
{
  "backendUrl": "${BACKEND_URL}",
  "oidcUrl": "${OIDC_AUTH_URL}",
  "credentialId": "${CREDENTIAL_ID}",
  "oidcClientId": "${OIDC_CLIENT_ID}",
  "oidcClientSecret": "${OIDC_CLIENT_SECRET}"
}
EOF

# Start Nginx
exec nginx -g 'daemon off;'
