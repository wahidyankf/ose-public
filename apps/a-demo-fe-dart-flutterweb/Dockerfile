FROM ghcr.io/cirruslabs/flutter:stable AS build
WORKDIR /app
COPY . .
RUN flutter pub get
RUN flutter build web --release

FROM nginx:alpine

LABEL org.opencontainers.image.source="https://github.com/wahidyankf/open-sharia-enterprise"
LABEL org.opencontainers.image.description="Demo frontend built with Dart and Flutter Web"

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY nginx/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
COPY --from=build /app/build/web /usr/share/nginx/html
EXPOSE 3301
ENV BACKEND_URL=http://demo-be:8201
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3301/ || exit 1

ENTRYPOINT ["/entrypoint.sh"]
