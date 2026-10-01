---
title: "Pooled TCP Frame Exchange"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

Build and run `code/system_component.c`. It creates a loopback TCP server, forks a small client,
serializes a 32-bit value as network-order bytes, and echoes it back. The server uses a fixed memory
pool to allocate the decoded frame; its cleanup label returns that slot and closes each descriptor.

```mermaid
sequenceDiagram
  accTitle: sequenceDiagram diagram
  accDescr: Sequence diagram between parent/server, child/client. Messages: parent/server to parent/server: pool acquire frame; child/client to parent/server: connect send 4 network-order bytes; parent/server to parent/server: recv_all decode into owned frame; parent/server to child/client: encode send_all echo; parent/server to parent/server: pool release close accepted + listener.
  participant P as parent/server
  participant C as child/client
  P->>P: pool acquire frame
  C->>P: connect; send 4 network-order bytes
  P->>P: recv_all; decode into owned frame
  P->>C: encode; send_all echo
  P->>P: pool release; close accepted + listener
```

## Ownership table

| Resource         | Owner while live | Release                       |
| ---------------- | ---------------- | ----------------------------- |
| listening socket | parent           | `close(listen_fd)` in cleanup |
| accepted socket  | parent           | `close(peer_fd)` in cleanup   |
| client socket    | child            | `close(fd)` before child exit |
| frame pool slot  | parent           | `pool_release` in cleanup     |

## Run

```sh
cd code
./run-checks.sh
```

The script builds and runs ASan/UBSan first. On Linux it then builds an unsanitized binary and runs
Valgrind separately. A clean run means no sanitizer report and Valgrind reports zero definite leaks
with exit status zero. Do not run Valgrind on the ASan binary: they instrument the process in
incompatible ways.

The program uses portable `goto cleanup` for resource release. It does not rely on
`__attribute__((cleanup))` because that is a GCC/Clang extension, not ISO C.
