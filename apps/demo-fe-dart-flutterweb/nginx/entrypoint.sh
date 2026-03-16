#!/bin/sh
set -e

# Substitute environment variables in nginx config
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx in foreground
exec nginx -g 'daemon off;'
