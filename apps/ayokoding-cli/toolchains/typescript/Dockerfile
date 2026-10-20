# TypeScript 7.0.2 on Node.js 24. The compiler tarball is pinned by SHA-256
# and installed from file, so the toolchain never floats at build time.
FROM docker.io/library/node:24@sha256:14078204b6bb268c107ceff6d3c43f45a888105e5c2b18b14c32b3409d93a1b0
RUN curl -fsSL -o /tmp/typescript-7.0.2.tgz https://registry.npmjs.org/typescript/-/typescript-7.0.2.tgz \
    && printf '%s  %s\n' 'da2513f4b95176d6dde8b51aab7afe8a927656c9d277369793f77f7e59371c08' '/tmp/typescript-7.0.2.tgz' > /tmp/typescript.tgz.sha256 \
    && sha256sum -c /tmp/typescript.tgz.sha256 \
    && npm install --global /tmp/typescript-7.0.2.tgz \
    && rm -f /tmp/typescript-7.0.2.tgz /tmp/typescript.tgz.sha256 \
    && npm cache clean --force \
    && tsc --version
# A node-owned system path for locked-unit installs: the environment
# Dockerfile template carries no USER directive, so the install recipe runs
# as USER node and cannot create root-owned paths. Absolute /home paths are
# barred from committed content, so the writable install root lives here.
RUN mkdir -p /srv/node-deps && chown node:node /srv/node-deps
USER node
