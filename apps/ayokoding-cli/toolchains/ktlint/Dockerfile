# ktlint 1.8.0 on Temurin JDK 25 for the android static reason. The
# single-file release is pinned by SHA-256 and fetched on Debian, because
# Temurin ships no download tool. Standard rules stay off at the run
# invocation, so only parse errors fail.
FROM docker.io/library/debian:trixie-slim@sha256:a29215f6a35e51e22adffa17f89e9d2ef06214e64a2bad10d765c46aea49f11f AS fetcher
RUN printf '%s\n' 'Types: deb' 'URIs: http://snapshot.debian.org/archive/debian/20261025T000000Z/' 'Suites: trixie trixie-updates' 'Components: main' 'Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp' '' 'Types: deb' 'URIs: http://snapshot.debian.org/archive/debian-security/20261025T000000Z/' 'Suites: trixie-security' 'Components: main' 'Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp' > /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL -o /tmp/ktlint https://github.com/pinterest/ktlint/releases/download/1.8.0/ktlint \
    && printf '%s  %s\n' 'a3fd620207d5c40da6ca789b95e7f823c54e854b7fade7f613e91096a3706d75' '/tmp/ktlint' > /tmp/ktlint.sha256 \
    && sha256sum -c /tmp/ktlint.sha256 \
    && rm -f /tmp/ktlint.sha256
FROM docker.io/library/eclipse-temurin:25-jdk@sha256:2d5d5e9b533342a565907c84f47a2ec298c40cde7b13a3ca85d4950fa456a641
COPY --from=fetcher /tmp/ktlint /usr/local/bin/ktlint
RUN chmod 755 /usr/local/bin/ktlint \
    && ktlint --version
USER ubuntu
