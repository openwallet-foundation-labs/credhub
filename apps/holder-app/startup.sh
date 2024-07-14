#!/bin/sh

# Generate config.json
cat <<EOF > /usr/share/nginx/html/assets/config/config.json
{
  "backendUrl": "${BACKEND_URL}"
}
EOF

# Start Nginx
exec nginx -g 'daemon off;'
