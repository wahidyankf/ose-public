# kubeconform v0.8.0 with offline JSON schemas for the cluster static
# reason. The binary is pinned by SHA-256 per architecture; the schemas are
# the v1.34.12-standalone tree at a pinned commit, fetched by sparse
# checkout. Scratch carries no users, so the harness --user applies at run.
FROM docker.io/library/debian:trixie-slim@sha256:a29215f6a35e51e22adffa17f89e9d2ef06214e64a2bad10d765c46aea49f11f AS fetcher
RUN printf '%s\n' 'Types: deb' 'URIs: http://snapshot.debian.org/archive/debian/20261017T204620Z/' 'Suites: trixie trixie-updates' 'Components: main' 'Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp' '' 'Types: deb' 'URIs: http://snapshot.debian.org/archive/debian-security/20261017T204620Z/' 'Suites: trixie-security' 'Components: main' 'Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp' > /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl git \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /src
RUN git clone --filter=blob:none --no-checkout https://github.com/yannh/kubernetes-json-schema.git schemas
WORKDIR /src/schemas
RUN git sparse-checkout set v1.34.12-standalone v1.34.12-standalone-strict \
    && git checkout 93153a1458e24e93f386c50f9980d584fcba574b \
    && test "$(git rev-parse HEAD)" = 93153a1458e24e93f386c50f9980d584fcba574b
ARG TARGETARCH
RUN if [ "${TARGETARCH}" = "arm64" ]; then printf '%s  %s\n' '1f53fc8e81258197a35e8603054162a5af1de8c5af13746c71ab680d9534ed87' '/tmp/kubeconform.tar.gz' > /tmp/kubeconform.tar.gz.sha256 && curl -fsSL -o /tmp/kubeconform.tar.gz https://github.com/yannh/kubeconform/releases/download/v0.8.0/kubeconform-linux-arm64.tar.gz; else printf '%s  %s\n' '9bc2bffbf71f261128533edaf912153948b7ff238f9a531ae6d34466ec287883' '/tmp/kubeconform.tar.gz' > /tmp/kubeconform.tar.gz.sha256 && curl -fsSL -o /tmp/kubeconform.tar.gz https://github.com/yannh/kubeconform/releases/download/v0.8.0/kubeconform-linux-amd64.tar.gz; fi \
    && sha256sum -c /tmp/kubeconform.tar.gz.sha256 \
    && tar -xzf /tmp/kubeconform.tar.gz -C /tmp kubeconform \
    && rm -f /tmp/kubeconform.tar.gz /tmp/kubeconform.tar.gz.sha256 \
    && /tmp/kubeconform -v
FROM scratch
COPY --from=fetcher /tmp/kubeconform /kubeconform
COPY --from=fetcher /src/schemas/v1.34.12-standalone /schemas/v1.34.12-standalone
COPY --from=fetcher /src/schemas/v1.34.12-standalone-strict /schemas/v1.34.12-standalone-strict
