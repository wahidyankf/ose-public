# LuaJIT v2.1 at commit 2a8e017. LuaJIT publishes no tarballs, so the
# recipe fetches the commit archive and pins it by SHA-256, like every
# other download. Debian packages come from a fixed snapshot date.
FROM docker.io/library/debian:trixie-slim@sha256:a29215f6a35e51e22adffa17f89e9d2ef06214e64a2bad10d765c46aea49f11f AS builder
RUN printf '%s\n' 'Types: deb' 'URIs: http://snapshot.debian.org/archive/debian/20261017T204620Z/' 'Suites: trixie trixie-updates' 'Components: main' 'Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp' '' 'Types: deb' 'URIs: http://snapshot.debian.org/archive/debian-security/20261017T204620Z/' 'Suites: trixie-security' 'Components: main' 'Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp' > /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends build-essential ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /usr/src
RUN curl -fsSL -o /tmp/luajit-2a8e017.tar.gz https://github.com/LuaJIT/LuaJIT/archive/2a8e017.tar.gz \
    && printf '%s  %s\n' '54705d4b1de50a9c668539b9cf0dc3170d94ffdad51fafd1cf4477e498be7144' '/tmp/luajit-2a8e017.tar.gz' > /tmp/luajit.tar.gz.sha256 \
    && sha256sum -c /tmp/luajit.tar.gz.sha256 \
    && tar -xzf /tmp/luajit-2a8e017.tar.gz \
    && mv LuaJIT-2a8e017* luajit-src \
    && rm -f /tmp/luajit-2a8e017.tar.gz /tmp/luajit.tar.gz.sha256
WORKDIR /usr/src/luajit-src
RUN make install PREFIX=/opt/luajit
FROM docker.io/library/debian:trixie-slim@sha256:a29215f6a35e51e22adffa17f89e9d2ef06214e64a2bad10d765c46aea49f11f
COPY --from=builder /opt/luajit /opt/luajit
ENV PATH="/opt/luajit/bin:${PATH}"
RUN useradd --create-home --uid 10000 harness \
    && chmod -R a+rX /opt/luajit \
    && luajit -v
USER harness
