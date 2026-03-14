FROM elixir:1.19-otp-27-alpine AS build
RUN apk add --no-cache build-base git nodejs npm
WORKDIR /app
ENV MIX_ENV=prod
COPY mix.exs mix.lock ./
RUN mix local.hex --force && mix local.rebar --force
RUN mix deps.get --only prod
RUN mix deps.compile
COPY config config
COPY lib lib
COPY assets assets
COPY priv priv
RUN mix assets.deploy
RUN mix compile
RUN mix release

FROM alpine:3.20
RUN apk add --no-cache libstdc++ openssl ncurses-libs
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /app/_build/prod/rel/demo_fe_exph ./
USER app
EXPOSE 3301
ENV PORT=3301 PHX_HOST=localhost SECRET_KEY_BASE=placeholder
CMD ["bin/demo_fe_exph", "start"]
