FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --ignore-scripts

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine
RUN apk add --no-cache nginx && mkdir -p /run/nginx \
    && sed -i 's|error_log /var/log/nginx/error.log warn;|error_log /dev/stderr warn;|' /etc/nginx/nginx.conf \
    && sed -i 's|access_log  /var/log/nginx/access.log  main;|access_log /dev/stdout;|' /etc/nginx/nginx.conf || true
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY <<EOF /etc/nginx/http.d/default.conf
server {
    listen 3301;

    location /api/ {
        proxy_pass http://demo-be:8201;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /health {
        proxy_pass http://demo-be:8201;
        proxy_set_header Host $host;
    }

    location /.well-known/ {
        proxy_pass http://demo-be:8201;
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://127.0.0.1:3300;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
EXPOSE 3301
ENV PORT=3300 NODE_ENV=production
CMD sh -c "nginx -t 2>&1; node dist/server/server.js & nginx -g 'daemon off;'"
