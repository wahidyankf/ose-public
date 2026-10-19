# Clojure 1.12.6 on Temurin JDK 25. The three core jars are pinned by SHA-256
# (recorded 2026-10-20 from repo.maven.apache.org, the versions named by
# Clojure 1.12.6's POM) and fetched on Debian, because Temurin ships no
# download tool.
FROM docker.io/library/debian:trixie-slim@sha256:a29215f6a35e51e22adffa17f89e9d2ef06214e64a2bad10d765c46aea49f11f AS fetcher
RUN printf '%s\n' 'Types: deb' 'URIs: http://snapshot.debian.org/archive/debian/20261017T204620Z/' 'Suites: trixie trixie-updates' 'Components: main' 'Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp' '' 'Types: deb' 'URIs: http://snapshot.debian.org/archive/debian-security/20261017T204620Z/' 'Suites: trixie-security' 'Components: main' 'Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp' > /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL -o /tmp/clojure-1.12.6.jar https://repo.maven.apache.org/maven2/org/clojure/clojure/1.12.6/clojure-1.12.6.jar \
    && curl -fsSL -o /tmp/spec.alpha-0.5.238.jar https://repo.maven.apache.org/maven2/org/clojure/spec.alpha/0.5.238/spec.alpha-0.5.238.jar \
    && curl -fsSL -o /tmp/core.specs.alpha-0.4.74.jar https://repo.maven.apache.org/maven2/org/clojure/core.specs.alpha/0.4.74/core.specs.alpha-0.4.74.jar \
    && printf '%s  %s\n' '21b578db389a8e74b286ce79c4a7f86ec641e26d88b12f18d69030916b0e18ca' '/tmp/clojure-1.12.6.jar' \
    && printf '%s  %s\n' '94cd99b6ea639641f37af4860a643b6ed399ee5a8be5d717cff0b663c8d75077' '/tmp/spec.alpha-0.5.238.jar' \
    && printf '%s  %s\n' 'eb73ac08cf49ba840c88ba67beef11336ca554333d9408808d78946e0feb9ddb' '/tmp/core.specs.alpha-0.4.74.jar' > /tmp/clojure.sha256 \
    && sha256sum -c /tmp/clojure.sha256 \
    && rm -f /tmp/clojure.sha256
FROM docker.io/library/eclipse-temurin:25-jdk@sha256:2d5d5e9b533342a565907c84f47a2ec298c40cde7b13a3ca85d4950fa456a641
WORKDIR /opt/clojure
COPY --from=fetcher /tmp/clojure-1.12.6.jar /tmp/spec.alpha-0.5.238.jar /tmp/core.specs.alpha-0.4.74.jar /opt/clojure/
# The wrapper is generated here, not copied: a toolchain build's context holds
# only this Dockerfile, so every file the image needs must be created in it.
RUN printf '%s\n' '#!/bin/sh' '# Clojure entry point: the three core jars only, explicit and ordered, never a wildcard.' 'exec java -XX:+UseSerialGC -Xshare:auto -XX:TieredStopAtLevel=1 -cp /opt/clojure/clojure-1.12.6.jar:/opt/clojure/spec.alpha-0.5.238.jar:/opt/clojure/core.specs.alpha-0.4.74.jar clojure.main "$@"' > /usr/local/bin/clojure \
    && chmod -R a+rX /opt/clojure \
    && chmod +x /usr/local/bin/clojure \
    && clojure -e "(println (clojure-version))"
