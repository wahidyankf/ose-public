# Shell on the Debian trixie snapshot: bash, coreutils, git, jq, and
# sqlite3 from a fixed snapshot date.
FROM docker.io/library/debian:trixie-slim@sha256:a29215f6a35e51e22adffa17f89e9d2ef06214e64a2bad10d765c46aea49f11f
RUN printf '%s\n' 'Types: deb' 'URIs: http://snapshot.debian.org/archive/debian/20261017T204620Z/' 'Suites: trixie trixie-updates' 'Components: main' 'Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp' '' 'Types: deb' 'URIs: http://snapshot.debian.org/archive/debian-security/20261017T204620Z/' 'Suites: trixie-security' 'Components: main' 'Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp' > /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends bash coreutils git jq sqlite3 \
    && rm -rf /var/lib/apt/lists/* \
    && bash --version \
    && git --version \
    && jq --version \
    && sqlite3 --version
RUN useradd --create-home --uid 10000 harness
USER harness
