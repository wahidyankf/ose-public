# Lua 5.5.1 built from the lua.org tarball. The builder compiles from
# SHA-256-checked sources with Debian packages from a fixed snapshot date;
# the runtime carries only the install tree.
FROM docker.io/library/debian:trixie-slim@sha256:a29215f6a35e51e22adffa17f89e9d2ef06214e64a2bad10d765c46aea49f11f AS builder
RUN printf '%s\n' 'Types: deb' 'URIs: http://snapshot.debian.org/archive/debian/20261017T204620Z/' 'Suites: trixie trixie-updates' 'Components: main' 'Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp' '' 'Types: deb' 'URIs: http://snapshot.debian.org/archive/debian-security/20261017T204620Z/' 'Suites: trixie-security' 'Components: main' 'Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp' > /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends build-essential ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /usr/src
RUN curl -fsSL -o /tmp/lua-5.5.1.tar.gz https://www.lua.org/ftp/lua-5.5.1.tar.gz \
    && printf '%s  %s\n' '1c4b4068d67061f2a2231ad2b5422e77acea1487ea9890f6320af614f4373dce' '/tmp/lua-5.5.1.tar.gz' > /tmp/lua.tar.gz.sha256 \
    && sha256sum -c /tmp/lua.tar.gz.sha256 \
    && tar -xzf /tmp/lua-5.5.1.tar.gz \
    && rm -f /tmp/lua-5.5.1.tar.gz /tmp/lua.tar.gz.sha256
WORKDIR /usr/src/lua-5.5.1
RUN make linux install INSTALL_TOP=/opt/lua
FROM docker.io/library/debian:trixie-slim@sha256:a29215f6a35e51e22adffa17f89e9d2ef06214e64a2bad10d765c46aea49f11f
COPY --from=builder /opt/lua /opt/lua
ENV PATH="/opt/lua/bin:${PATH}"
RUN useradd --create-home --uid 10000 harness \
    && chmod -R a+rX /opt/lua \
    && lua -v
USER harness
