FROM ghcr.io/cirruslabs/flutter:stable AS build
WORKDIR /app
COPY pubspec.yaml pubspec.lock ./
RUN flutter pub get
COPY . .
RUN flutter build web --release

FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY nginx/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
COPY --from=build /app/build/web /usr/share/nginx/html
EXPOSE 3301
ENV BACKEND_URL=http://demo-be:8201
ENTRYPOINT ["/entrypoint.sh"]
