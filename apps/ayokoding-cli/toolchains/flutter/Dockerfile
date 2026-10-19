# Flutter 3.41.5, the repository .fvmrc pin. The SDK tarball is
# SHA-256-checked; Debian packages come from a fixed snapshot date. The
# SDK publishes a linux x64 archive only, so the harness always builds and
# runs this image for linux/amd64 (catalog platform) and other hosts run it
# under the platform emulator.
# The harness runs containers with a read-only root, so every path the
# flutter wrapper rewrites on startup is a symlink into /tmp: the image
# keeps the real artifacts, only the rewritten stamp and lock paths move.
# The build precaches the engine artifacts and warms pub for the SDK-only
# fixture pubspec, so `flutter test` needs no network under the harness
# --network none.
FROM docker.io/library/debian:trixie-slim@sha256:a29215f6a35e51e22adffa17f89e9d2ef06214e64a2bad10d765c46aea49f11f
RUN printf '%s\n' 'Types: deb' 'URIs: http://snapshot.debian.org/archive/debian/20261017T204620Z/' 'Suites: trixie trixie-updates' 'Components: main' 'Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp' '' 'Types: deb' 'URIs: http://snapshot.debian.org/archive/debian-security/20261017T204620Z/' 'Suites: trixie-security' 'Components: main' 'Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp' > /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl git unzip xz-utils zip \
    && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL -o /tmp/flutter.tar.xz https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.41.5-stable.tar.xz \
    && printf '%s  %s\n' '18901d456a5e458c4c69fa7859852b64fac29da9f89476a959abfacbac7f4fdb' '/tmp/flutter.tar.xz' > /tmp/flutter.tar.xz.sha256 \
    && sha256sum -c /tmp/flutter.tar.xz.sha256 \
    && mkdir -p /opt \
    && tar -xJf /tmp/flutter.tar.xz -C /opt \
    && rm -f /tmp/flutter.tar.xz /tmp/flutter.tar.xz.sha256
ENV PATH="/opt/flutter/bin:${PATH}"
# The pub package cache lives in the image, so offline resolution reads the
# same bytes the build warmed: runtime HOME (/tmp/home) never carries it.
ENV PUB_CACHE="/opt/pub-cache"
RUN useradd --create-home --uid 10000 harness \
    && chown -R harness:harness /opt/flutter \
    && chmod -R a+rX /opt/flutter \
    && mkdir -p /opt/pub-cache \
    && chown harness:harness /opt/pub-cache
USER harness
# The warm project lives in the working directory (hadolint DL3003 forbids cd).
WORKDIR /tmp/flutter-warm
RUN git config --global --add safe.directory /opt/flutter \
    && if [ "$(uname -m)" = "x86_64" ]; then \
        flutter config --no-analytics \
        && flutter --version \
        && flutter precache \
        && printf '%s\n' 'name: hello' 'environment:' '  sdk: ^3.9.0' 'dependencies:' '  flutter:' '    sdk: flutter' 'dev_dependencies:' '  flutter_test:' '    sdk: flutter' 'flutter:' '  uses-material-design: false' > pubspec.yaml \
        && flutter pub get \
        && rm -rf /tmp/flutter-warm \
        && for name in engine.stamp engine.realm .dartignore lockfile libimobiledevice.stamp libusbmuxd.stamp; do \
            rm -f "/opt/flutter/bin/cache/${name}"; \
            ln -s "/tmp/${name}" "/opt/flutter/bin/cache/${name}"; \
        done \
        && rm -rf /opt/pub-cache/active_roots \
        && ln -s /tmp /opt/pub-cache/active_roots; \
    fi
