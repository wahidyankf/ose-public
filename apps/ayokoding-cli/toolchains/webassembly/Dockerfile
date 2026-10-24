# WebAssembly via the wazero CLI 1.12.0. The release tarball is pinned by
# SHA-256 per architecture (recorded 2026-10-20 from
# github.com/tetratelabs/wazero/releases/download/v1.12.0):
#   linux/arm64  b5e5105a8bc4817a117e52402713f0628ebe13ecec5c4e63d541c430ca9bf259
#   linux/amd64  88019896950340e8839b94af0510b248c3400d8d8f4a9b335dcaad93ac0484ff
FROM docker.io/library/debian:trixie-slim@sha256:a29215f6a35e51e22adffa17f89e9d2ef06214e64a2bad10d765c46aea49f11f AS fetcher
RUN printf '%s\n' 'Types: deb' 'URIs: http://snapshot.debian.org/archive/debian/20261017T204620Z/' 'Suites: trixie trixie-updates' 'Components: main' 'Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp' '' 'Types: deb' 'URIs: http://snapshot.debian.org/archive/debian-security/20261017T204620Z/' 'Suites: trixie-security' 'Components: main' 'Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp' > /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
RUN ARCH="$(uname -m)" \
    && if [ "$ARCH" = "x86_64" ]; then ARCH=amd64; SHA=88019896950340e8839b94af0510b248c3400d8d8f4a9b335dcaad93ac0484ff; \
    elif [ "$ARCH" = "aarch64" ]; then ARCH=arm64; SHA=b5e5105a8bc4817a117e52402713f0628ebe13ecec5c4e63d541c430ca9bf259; \
    else echo "unsupported architecture: $(uname -m)" >&2; exit 1; fi \
    && curl -fsSL -o /tmp/wazero.tar.gz "https://github.com/tetratelabs/wazero/releases/download/v1.12.0/wazero_1.12.0_linux_${ARCH}.tar.gz" \
    && printf '%s  %s\n' "$SHA" /tmp/wazero.tar.gz > /tmp/wazero.sha256 \
    && sha256sum -c /tmp/wazero.sha256 \
    && mkdir -p /opt/wazero \
    && tar -xzf /tmp/wazero.tar.gz -C /opt/wazero \
    && rm -f /tmp/wazero.tar.gz /tmp/wazero.sha256
FROM docker.io/library/debian:trixie-slim@sha256:a29215f6a35e51e22adffa17f89e9d2ef06214e64a2bad10d765c46aea49f11f
COPY --from=fetcher /opt/wazero /opt/wazero
ENV PATH="/opt/wazero:${PATH}"
RUN wazero version
