# Kotlin 2.4.21 on Temurin JDK 25. The compiler zip is pinned by SHA-256
# and fetched on Debian, because Temurin ships no download tool; the JDK's
# own jar tool unpacks it, so no extra extractor enters the image.
FROM docker.io/library/debian:trixie-slim@sha256:a29215f6a35e51e22adffa17f89e9d2ef06214e64a2bad10d765c46aea49f11f AS fetcher
RUN printf '%s\n' 'Types: deb' 'URIs: http://snapshot.debian.org/archive/debian/20261017T204620Z/' 'Suites: trixie trixie-updates' 'Components: main' 'Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp' '' 'Types: deb' 'URIs: http://snapshot.debian.org/archive/debian-security/20261017T204620Z/' 'Suites: trixie-security' 'Components: main' 'Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp' > /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL -o /tmp/kotlin-compiler-2.4.21.zip https://github.com/JetBrains/kotlin/releases/download/v2.4.21/kotlin-compiler-2.4.21.zip \
    && printf '%s  %s\n' '7cc140e76daf416a0424a5557f99afd7ca89ebd463ea1101261e3e01c33e75cd' '/tmp/kotlin-compiler-2.4.21.zip' > /tmp/kotlin.zip.sha256 \
    && sha256sum -c /tmp/kotlin.zip.sha256 \
    && rm -f /tmp/kotlin.zip.sha256
FROM docker.io/library/eclipse-temurin:25-jdk@sha256:2d5d5e9b533342a565907c84f47a2ec298c40cde7b13a3ca85d4950fa456a641
WORKDIR /opt/kotlin
COPY --from=fetcher /tmp/kotlin-compiler-2.4.21.zip /tmp/kotlin-compiler-2.4.21.zip
RUN jar xf /tmp/kotlin-compiler-2.4.21.zip \
    && rm -f /tmp/kotlin-compiler-2.4.21.zip \
    && chmod -R a+rX /opt/kotlin \
    && chmod +x /opt/kotlin/kotlinc/bin/kotlinc /opt/kotlin/kotlinc/bin/kotlin /opt/kotlin/kotlinc/bin/kapt
ENV PATH="/opt/kotlin/kotlinc/bin:${PATH}"
RUN kotlinc -version
USER ubuntu
