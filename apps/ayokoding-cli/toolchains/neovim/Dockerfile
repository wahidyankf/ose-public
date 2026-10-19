# Neovim 0.12.6 from the release tarball, SHA-256-checked per
# architecture. Runs headless for scripted checks.
FROM docker.io/library/debian:trixie-slim@sha256:a29215f6a35e51e22adffa17f89e9d2ef06214e64a2bad10d765c46aea49f11f
RUN printf '%s\n' 'Types: deb' 'URIs: http://snapshot.debian.org/archive/debian/20261017T204620Z/' 'Suites: trixie trixie-updates' 'Components: main' 'Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp' '' 'Types: deb' 'URIs: http://snapshot.debian.org/archive/debian-security/20261017T204620Z/' 'Suites: trixie-security' 'Components: main' 'Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp' > /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
ARG TARGETARCH
RUN if [ "${TARGETARCH}" = "arm64" ]; then printf '%s  %s\n' '8f1f64a0bdb97247034038c3823c6cbad5bdf9ecd5751b85494b71c3ee04c815' '/tmp/nvim-linux.tar.gz' > /tmp/nvim.tar.gz.sha256 && curl -fsSL -o /tmp/nvim-linux.tar.gz https://github.com/neovim/neovim/releases/download/v0.12.6/nvim-linux-arm64.tar.gz; else printf '%s  %s\n' '474430d53e6264f6d6dd18db42d6dc9df3a1b56ca9e88a325bbf860e1a811d87' '/tmp/nvim-linux.tar.gz' > /tmp/nvim.tar.gz.sha256 && curl -fsSL -o /tmp/nvim-linux.tar.gz https://github.com/neovim/neovim/releases/download/v0.12.6/nvim-linux-x86_64.tar.gz; fi \
    && sha256sum -c /tmp/nvim.tar.gz.sha256 \
    && mkdir -p /opt/neovim \
    && tar -xzf /tmp/nvim-linux.tar.gz -C /opt/neovim --strip-components=1 \
    && rm -f /tmp/nvim-linux.tar.gz /tmp/nvim.tar.gz.sha256
ENV PATH="/opt/neovim/bin:${PATH}"
RUN useradd --create-home --uid 10000 harness \
    && chmod -R a+rX /opt/neovim \
    && nvim --version
USER harness
