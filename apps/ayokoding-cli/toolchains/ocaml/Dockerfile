# OCaml 5.5 without the opam entrypoint: the ocaml/opam project image wraps
# every command in `opam exec`, which exits 50 unless the invoking user owns
# the opam root — the harness runs as the host user, never as opam or root.
# This image copies the prebuilt 5.5 switch onto Debian trixie-slim and runs
# its toplevel directly (OCAMLLIB points at the copied standard library).
FROM docker.io/ocaml/opam:debian-13-ocaml-5.5@sha256:339d51104ae5e460c3fa42439ad2745bd9a42c9fd027d4f5fedd7361dc904584 AS switch
# The opam home is resolved dynamically: absolute home paths must not appear
# in this public repository (public-safety-tree), so it is never written here.
# The switch stage runs as opam, so the copy lands in /tmp; the final stage
# (root) moves it to /opt.
RUN cp -a "$(awk -F: '$1=="opam" {print $6}' /etc/passwd)/.opam/5.5" /tmp/ocaml-5.5
FROM docker.io/library/debian:trixie-slim@sha256:a29215f6a35e51e22adffa17f89e9d2ef06214e64a2bad10d765c46aea49f11f
COPY --from=switch /tmp/ocaml-5.5 /opt/ocaml-5.5
RUN chmod -R a+rX /opt/ocaml-5.5 \
    && /opt/ocaml-5.5/bin/ocaml -version
ENV OCAMLLIB=/opt/ocaml-5.5/lib/ocaml
ENV PATH=/opt/ocaml-5.5/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
RUN useradd --create-home --uid 10000 harness
USER harness
