# Advanced Networking (Annotated-concept, Python)

**Course ID**: `advanced-networking` · **Format**: Annotated-concept · **Language**: Python.

**Short summary**: Load balancing, proxies, TLS, performance

**Scope note**: the deep networking pass — the OSI/TCP-IP models, addressing/subnetting, transport
internals, the modern application layer (HTTP/1.1→2→3, TLS, WebSockets), diagnostics, and edge/delivery
infrastructure. The practical slice is the prerequisite
[`12-networking-essentials`](./networking-essentials.md); code appears in Python where it fits (`*`),
otherwise annotated diagrams and real tool output.

## Why this exists · the big idea

- **The problem before the solution**: the essentials explain one clean request; production networks fail
  in layered, subtle ways — congestion, MTU, TLS negotiation, a bad subnet — you cannot debug blind.
- **Keep-this-if-you-forget-everything**: the layered model _is_ the debugging tool — every network problem
  localizes to a layer, so you bisect down the stack instead of guessing.
- **Big ideas touched**: `layering-and-leaks` — OSI/TCP-IP layering and exactly where each layer leaks into
  the one above; `consistency-latency-throughput` — latency, bandwidth, and throughput are three different
  things you must stop conflating.

## Prerequisites

- **Prior topics**: [topic 12 Networking Essentials](./networking-essentials.md) (HTTP, DNS, sockets,
  `curl`/`dig`) and [topic 4 Just Enough Python](./just-enough-python.md).
- **Tools & environment**: a macOS/Linux terminal; **Python 3.x**; the diagnostic CLIs **`ping`**,
  **`traceroute`**, **`dig`**, **`netstat`/`ss`**, and **`tcpdump`** (may need `sudo`); network access.
- **Assumed knowledge**: what happens when you hit a URL (topic 12); TCP vs UDP at a glance; reading a
  `curl -v`/`dig` transcript.

## Accuracy notes (web-verified)

> Verified in the pre-authoring `web-researcher` sweep (#48, DD-28) and re-grounded per DD-35 against
> primary sources fetched and read 2026-07-12.

- 2026-07-12 — verified: HTTP/2 = **RFC 9113** (obsoletes RFC 7540), HTTP/3 = **RFC 9114**, QUIC transport
  = **RFC 9000**, QUIC's TLS integration = **RFC 9001**, QUIC loss/congestion control = **RFC 9002**. Fetched
  and read directly (rfc-editor.org).
- 2026-07-12 — **material update (DD-35)**: **TLS 1.3 is now RFC 9846** (July 2026), which **obsoletes
  RFC 8446**. RFC 9846 is a **minor, backward-compatible** revision (same version number, same 1-RTT
  handshake shape and wire compatibility) that tightens requirements (forbids `KeyShare` reuse across
  connections, prohibits negotiating TLS 1.0/1.1, mandates key-usage limits, adds a `general_error` alert).
  Cite RFC 9846 as current; treat any "TLS 1.3 = RFC 8446 (current)" claim as stale. (datatracker.ietf.org/doc/rfc9846/)
- 2026-07-12 — verified: **TCP congestion baseline = RFC 5681** (updated by RFC 9438); **CUBIC = RFC 9438**
  (Aug 2023, the default on Linux/Windows/Apple). **BBR is NOT an RFC** — it is `draft-ietf-ccwg-bbr-05`
  (BBRv3, Experimental, active Internet-Draft); never cite "BBR = RFC NNNN". (datatracker.ietf.org)
- 2026-07-12 — verified: **ARP = RFC 826/STD 37**; **private ranges = RFC 1918**; **traditional NAT = RFC
  3022**; **DNSSEC core = RFC 4033/4034/4035**; **TCP window scale/timestamps = RFC 7323**; delayed-ACK
  requirement is normatively **RFC 1122 §4.2.3.2**. **Nagle's RFC 896 is "Legacy"** (no formal IETF
  standing) — cite it only historically. (rfc-editor.org / datatracker.ietf.org)
- 2026-07-12 — DD-35 primary-source pass for the VPN/overlay rung (co-25..co-29, ex-56..ex-62): **WireGuard**
  is a variant of the Noise-framework IK handshake (Curve25519 + ChaCha20-Poly1305 + BLAKE2s), merged into
  mainline **Linux 5.6** (Jan 2020), kernel module **GPLv2**; `AllowedIPs` is the crypto-routing table and
  `PersistentKeepalive ≈ 25s` maintains the NAT mapping — verified against wireguard.com (`/`, `/protocol/`,
  `/quickstart/`). **OpenVPN** is **GPLv2**; 2.6 adds kernel data-channel-offload (DCO), UDP-only — verified
  against openvpn.net/legal + github.com/openvpn/openvpn + blog.openvpn.net/openvpn-2-6.
- 2026-07-18 — **V-step re-verification pass** (Phase 32, `web-researcher`), all sources fetched and read
  2026-07-18 unless noted, resolving every prior `[Needs Verification]` line above:
  - **curl HTTP/3**: `--http3` attempts HTTP/3 with fallback to earlier versions on failure; `--http3-only`
    forces QUIC and fails outright with no fallback if unsupported — HTTPS-only. Current stable curl =
    **8.21.0** (2026-06-24). HTTP/3 support is **build-time optional**: the two supported backends are (1)
    **ngtcp2**+nghttp3, needing a QUIC-capable TLS library (OpenSSL **v3.5.0+**, AWS-LC, BoringSSL, LibreSSL,
    quictls, GnuTLS, or wolfSSL — plain/stock OpenSSL without QUIC support does NOT work), or (2) **quiche**
    (still EXPERIMENTAL), needing BoringSSL. **Correction**: curl **removed its standalone OpenSSL-QUIC-fork
    backend as of curl 8.19.0** ("one backend less") — OpenSSL 3.5+ now works only paired with ngtcp2, never
    as a standalone HTTP/3 backend. Verified: curl.se/docs/manpage.html, github.com/curl/curl/blob/master/docs/HTTP3.md,
    daniel.haxx.se/blog/2026/01/17/more-http-3-focus-one-backend-less. The exact string curl's `-v` prints on
    successful HTTP/3 negotiation stays `[Unverified]` — it is a live-transcript detail, not stated in the
    static manpage/HTTP3.md, so it cannot be pinned from primary docs; check for `HTTP/3 200` in the response
    status line and a `Features: HTTP3` line in `curl --version`, and confirm the literal informational-line
    wording against a live `curl -v --http3` transcript when authoring ex-36's real attempt (falling back to
    the documented `[Unverified]` pattern if a live HTTP/3 endpoint isn't reachable from the authoring sandbox).
  - **tcpdump `-v` wscale format**: `[Verified]` shape, `[Unverified]` exact primary wording — the
    documented options-list order is `options [mss 1460,sackOK,TS val ... ecr 0,nop,wscale 7]` (mss first,
    then sackOK, then TS val/ecr, then nop padding, then wscale last), corroborated across secondary technical
    sources; the precise per-field output text is emitted by tcpdump's `print-tcp.c` rather than stated in the
    manpage, so it is not quotable from a primary doc — spot-check a live capture (or
    `tcpdump.org/manpages/tcpdump.1.html`) at authoring time before quoting verbatim. Current
    stable tcpdump = **4.99.6**, libpcap = **1.10.6** (both 2025-12-30). Source: tcpdump.org.
  - **dig / BIND 9**: current stable = **9.20.24**; ESV = 9.18.50; dev = 9.21.23. `+dnssec` is automatically
    implied when `+trace` is used. `+short` output format unchanged (no contrary changelog evidence found).
    Source: isc.org/bind, bind9.readthedocs.io.
  - **iproute2 / `ip` / `ss`**: current stable iproute2 = **7.1.0** (Repology aggregation across
    distros/Homebrew). `ip netns add`/`ip netns exec`, `ip link show`, `ip neigh show`, `ip route`, `ss -tan`,
    `ss -tin` all confirmed unchanged — long-stable base subcommands with no deprecation found. Source:
    man7.org (`ip-netns(8)`, `ss(8)`), repology.org/project/iproute2/versions.
  - **wireguard-tools**: current stable = **v1.0.20260223**. `wg genkey`/`wg pubkey`/`wg-quick up`/`down` and
    the `[Interface]`/`[Peer]` keys (`PrivateKey`, `PublicKey`, `AllowedIPs`, `Endpoint`,
    `PersistentKeepalive`) confirmed unchanged since the WireGuard 1.0 userspace-tools release. Kernel module
    still mainline (Linux 5.6+, no deprecation). Source: git.zx2c4.com/wireguard-tools/refs, wireguard.com/install.
  - **L4/L7 load balancing**: `[Verified]`, no material change — L4 forwards on IP/port/protocol without
    payload inspection; L7 terminates the connection and routes on application content (URL/headers/cookies).
    Source: nginx.com/resources/glossary (Layer 4 and Layer 7 Load Balancing).
  - **CDN cache-status headers**: `[Verified]` — Cloudflare uses `CF-Cache-Status` (`HIT`/`MISS`/`EXPIRED`/
    `STALE`/`BYPASS`/etc.), Fastly uses `X-Cache` (chained per node, e.g. `HIT, HIT`) plus `X-Cache-Hits`; the
    generic `Age` header (RFC 9111) applies across both. Source: developers.cloudflare.com/cache/concepts/cache-responses,
    fastly.com/documentation/reference/http/http-headers/X-Cache.
  - **Mesh VPNs**: `[Verified]` — **Tailscale**'s data plane is WireGuard directly between peers where
    possible, falling back to relay via **DERP** (Designated Encrypted Relay for Packets) servers when direct
    connectivity fails (DERP servers forward already-WireGuard-encrypted traffic and cannot decrypt it); a
    separate coordination/control server handles auth, key distribution, and DERP-map/peer-selection
    coordination. **Headscale** is **BSD-3-Clause** licensed, explicitly "not associated with Tailscale Inc.",
    actively maintained (v0.29.2, 2026-07-01). **Nebula** (Slack) confirms the lighthouse + host-certificate
    model; **license correction**: Nebula is **MIT**, not GPLv3 as this syllabus previously flagged for
    checking — confirmed by directly fetching the raw `LICENSE` file at
    `raw.githubusercontent.com/slackhq/nebula/master/LICENSE` (`MIT License, Copyright (c) 2018-2019 Slack
Technologies, Inc.`), actively maintained (v1.10.3, 2026-02-06). Sources: tailscale.com/docs/reference/derp-servers,
    tailscale.com/docs/concepts/control-data-planes, github.com/juanfont/headscale, github.com/slackhq/nebula
    (repo + raw LICENSE file, both 2026-07-18).
  - **TCP congestion control**: `[Verified]` — **CUBIC** remains the Linux default (since kernel 2.6.19,
    unchanged through current 2026 kernels). **BBRv3 remains an IETF Internet-Draft**
    (`draft-ietf-ccwg-bbr-05`, IETF ccwg, expiring 2026-09-03 under the routine 6-month I-D renewal cycle) —
    still **not an RFC**. Source: datatracker.ietf.org/doc/draft-ietf-ccwg-bbr.
  - **TLS 1.3 = RFC 9846 re-check**: `[Verified]`, skeptically re-confirmed against the raw RFC text itself
    (not just search snippets) — `rfc-editor.org/rfc/rfc9846.txt`'s header block reads `Request for Comments:
9846 ... Obsoletes: 5077, 5246, 6961, 7627, 8422, 8446 ... July 2026 ... Updates: 5705, 6066 ...
Category: Standards Track`, authored by E. Rescorla; RFC 8446's own datatracker history page confirms
    "Obsoleted by RFC 9846." No correction needed — the prior 2026-07-12 entry was already accurate.
  - No unresolved "to verify" / `[Needs Verification]` line remains blocking authoring: the two residual
    exact-wording items above (curl `-v` HTTP/3 negotiation string; tcpdump `-v` wscale per-field output
    text) are now explicit `[Unverified]` live-transcript spot-checks — neither is quotable from a primary
    static doc — with a documented fallback pattern already specified in this topic's worked examples
    (ex-36, ex-17), not open accuracy gaps.

## Concepts

<!-- co-NN · concept enumeration (DD-34): every concept this topic teaches, 1:1-mirrored to a delivery.md checkbox. Floor ≥ 10 (Annotated-concept). Each example below cites the co-NN it exercises. -->

- **co-01 · osi-tcpip-layering-and-encapsulation** — the OSI 7-layer and TCP/IP 4-layer models name the
  same stack, and encapsulation wraps a payload in a new header at each layer descending (and strips one
  ascending).
- **co-02 · link-layer-addressing-and-arp** — a MAC address identifies a NIC on its local segment, and ARP
  resolves an IP address to a MAC address before a frame can be sent on that segment.
- **co-03 · ipv4-ipv6-addressing** — IPv4's 32-bit dotted-decimal and IPv6's 128-bit hextet-and-compression
  addressing are the two address families a stack must parse and normalize.
- **co-04 · cidr-and-subnetting** — a CIDR prefix (`/24`) splits an address block into network and host
  portions, from which network address, broadcast address, host range, and host count are derived
  arithmetically.
- **co-05 · routing-basics** — a routing table maps destination prefixes to a next-hop, and a default route
  (default gateway) catches everything not matched more specifically.
- **co-06 · nat** — NAT rewrites a private source address/port to a shared public one at a gateway so
  multiple private hosts share one public IP.
- **co-07 · tcp-handshake-and-teardown-internals** — TCP opens via a three-way SYN/SYN-ACK/ACK handshake and
  closes via a FIN/ACK exchange (or aborts via RST), each transition moving the connection through a defined
  state machine.
- **co-08 · tcp-flow-control** — the receiver advertises a window (extendable via the RFC 7323 window-scale
  option) that caps how much unacknowledged data the sender may have in flight, protecting a slow receiver
  from being overrun.
- **co-09 · tcp-congestion-control** — the sender paces itself against inferred network capacity — slow
  start, congestion avoidance, and a chosen algorithm (CUBIC by default on Linux/Windows/Apple; BBR as a
  model-based alternative) — to avoid overwhelming the path.
- **co-10 · nagle-and-delayed-ack** — Nagle's algorithm withholds small writes awaiting an ACK while delayed
  ACK withholds that same ACK awaiting more data or a timeout, and the two together can compound into a
  multi-hundred-millisecond stall.
- **co-11 · socket-options-and-nonblocking-io** — socket options (`SO_REUSEADDR`, `TCP_NODELAY`) and
  nonblocking mode (`setblocking(False)`/`select`/`epoll`) change how a socket behaves without changing the
  protocol on the wire.
- **co-12 · dns-resolution-internals** — a recursive resolver walks the referral chain from root to TLD to
  authoritative server on a cache miss, and caches the answer for its TTL on a hit.
- **co-13 · dnssec** — DNSSEC signs DNS records (`RRSIG`) and chains trust through `DNSKEY`/`DS` records from
  a trust anchor down to a signed answer, letting a resolver detect tampering.
- **co-14 · tls13-handshake-internals** — TLS 1.3's handshake exchanges key shares in the first flight so the
  full handshake completes in 1-RTT, and a resumed session using a PSK can send application data even
  earlier.
- **co-15 · http2-multiplexing** — HTTP/2 interleaves multiple streams' frames on one TCP connection with
  header compression (reducing the multi-connection, serialized-request pattern of HTTP/1.1).
- **co-16 · http3-and-quic** — HTTP/3 runs over QUIC (UDP-based, TLS-integrated), giving each stream
  independent loss recovery so one lost packet no longer stalls unrelated streams, and letting a connection
  migrate across a network change via a connection ID.
- **co-17 · websockets-vs-sse** — WebSockets upgrade an HTTP connection into a full-duplex, bidirectional
  channel; Server-Sent Events keep one long-lived HTTP response streaming one-way, server-to-client only.
- **co-18 · webtransport-and-webrtc** — WebTransport exposes QUIC's multiplexed streams/datagrams to the
  browser as a modern alternative to WebSockets; WebRTC negotiates a direct (ICE/STUN/TURN-assisted)
  peer-to-peer media/data path.
- **co-19 · load-balancing-l4-vs-l7** — an L4 load balancer routes by transport-level identifiers (IP/port)
  with no content visibility; an L7 load balancer inspects and routes on application content (HTTP
  path/headers).
- **co-20 · reverse-proxies-and-cdns** — a reverse proxy sits in front of one or more origin servers and
  forwards client requests to them; a CDN is a distributed cache of reverse proxies at the network edge,
  serving cached content close to the client.
- **co-21 · network-namespaces** — a Linux network namespace is an isolated copy of the network stack (its
  own interfaces, routes, and firewall rules), letting one host run independent network environments.
- **co-22 · packet-capture-and-bpf-filters** — `tcpdump` captures packets on an interface, filtered by a BPF
  (Berkeley Packet Filter) expression that can match protocols, hosts, ports, and even individual header
  bits (e.g. TCP flags).
- **co-23 · latency-jitter-and-percentiles** — latency (delay), bandwidth (capacity), and throughput
  (capacity actually achieved) are three distinct measurements, and latency is best summarized by
  percentiles (p50/p95/p99) plus jitter (variance between consecutive measurements), not a single average.
- **co-24 · firewalls-and-mtls** — a stateful firewall permits a reply packet by matching it against an
  established connection's state-table entry rather than re-evaluating every rule; mutual TLS (mTLS) extends
  TLS so both sides — not just the server — present and verify a certificate.
- **co-25 · vpn-tunnels-and-overlays** — a VPN encapsulates and encrypts traffic inside an outer packet to
  build a virtual private network across an untrusted one; a _site-to-site_ tunnel joins whole networks, a
  _remote-access_ tunnel connects a single client, and _split tunneling_ routes only chosen subnets through
  the tunnel while the rest egress normally.
- **co-26 · wireguard** — a modern in-kernel VPN (mainline Linux since 5.6) built on the Noise-framework IK
  handshake with a fixed cryptographic suite (Curve25519 key exchange, ChaCha20-Poly1305 AEAD, BLAKE2s); its
  whole config is `[Interface]` + `[Peer]` with `AllowedIPs` acting as a crypto-routing table and a small
  auditable codebase (GPLv2 kernel module).
- **co-27 · ipsec-vs-openvpn-vs-wireguard** — IPsec/IKE is the standards-heavy kernel option, OpenVPN (GPLv2)
  the mature TLS-based userspace option (2.6 adds a kernel data-channel-offload path, UDP-only), and WireGuard
  the minimal modern option — the choice trades configurability against codebase size and audit surface.
- **co-28 · nat-traversal-and-keepalive** — a peer behind NAT keeps its mapping open with periodic keepalives
  (WireGuard `PersistentKeepalive ≈ 25s`); hole-punching / STUN and relay fallbacks (e.g. Tailscale's DERP)
  let peers connect without a public inbound port.
- **co-29 · mesh-overlay-vpns** — mesh VPNs give every node a stable identity on a flat encrypted overlay:
  Tailscale (WireGuard data plane + a coordination/control plane), Nebula (Slack; a lighthouse + host
  certificates; GPLv3), and Headscale (an open-source Tailscale control server) — the practical way to wire
  on-prem dev/staging/prod together (ties to [`53-self-managed-kubernetes-and-gitops`](./self-managed-kubernetes-and-gitops.md)).

## Worked examples

Colocated under `advanced-networking/learning/code/`; code where it fits (Python static-typed, or CLI
`dig`/`curl`/`tcpdump`/`ss`/`ip`), else an annotated Mermaid diagram or annotated real tool transcript
(DD-20/DD-30). Contiguous `ex-01..ex-62`. Every example cites the `co-NN` it exercises; every concept above
is exercised by ≥1 example.

### Beginner

- **ex-01 · osi-layer-mapping-curl-trace** — annotate a `curl -v https://example.com` transcript, labeling
  each visible stage (DNS/TCP/TLS/HTTP) with its OSI/TCP-IP layer in a Mermaid sequence diagram — verify
  every stage carries a layer label. (co-01)
- **ex-02 · encapsulation-headers-diagram** — a Mermaid diagram showing a payload gaining a TCP header, then
  an IP header, then an Ethernet frame header/trailer descending the stack, and shedding them ascending —
  verify each layer's added header is named. (co-01)
- **ex-03 · view-local-mac** — run `ip link show` — verify the local interface's `link/ether` MAC address
  prints. (co-02)
- **ex-04 · arp-cache-inspect** — run `ip neigh show` — verify IP→MAC entries for reachable local hosts
  appear. (co-02)
- **ex-05 · ipv4-binary-anatomy** — convert `192.0.2.10` to its 4 octets in binary by hand — verify the
  binary reconverts to the same decimal address. (co-03)
- **ex-06 · ipv6-address-expand-compress** — expand `2001:db8::1` to its 8 full hextets, then re-compress it
  — verify both forms round-trip to the same address. (co-03)
- **ex-07 · cidr-prefix-to-netmask** — convert `/24`, `/26`, and `/30` to dotted-decimal netmasks by hand —
  verify against a prefix→mask reference table. (co-04)
- **ex-08 · subnet-calculator-script** — `subnet.py` computes network address, broadcast address, host
  range, and host count for a CIDR block — verify its output matches at least two hand-computed prefixes.
  (co-04)
- **ex-09 · view-routing-table** — run `ip route` — verify the `default via ...` route line appears. (co-05)
- **ex-10 · traceroute-hop-list** — run `traceroute example.com` — verify a numbered hop list with per-hop
  RTTs prints. (co-05)
- **ex-11 · private-vs-public-address-classify** — classify a list of IPs against the RFC 1918 private ranges
  (`10/8`, `172.16/12`, `192.168/16`) — verify each address is correctly labeled private or
  public. (co-06)
- **ex-12 · nat-translation-diagram** — a Mermaid diagram of a private-source packet traversing a NAT gateway
  with its source IP:port rewritten to the gateway's public IP:port — verify the before/after address:port
  pair is labeled. (co-06)
- **ex-13 · tcp-handshake-tcpdump-capture** — run `tcpdump -i any -n tcp and port 443` while opening a
  connection — verify the `[S]`, `[S.]`, `[.]` flag sequence (SYN, SYN-ACK, ACK) appears in order. (co-07)
- **ex-14 · tcp-teardown-tcpdump-capture** — capture a connection close in the same trace — verify `[F.]`/`[.]`
  (FIN/ACK) flags, or a `[R]` (RST), appear. (co-07)
- **ex-15 · ss-show-tcp-states** — run `ss -tan` while a connection is open and again after it closes —
  verify the state transitions from `ESTAB` toward `TIME-WAIT`. (co-07)
- **ex-16 · well-known-ports-review** — a review table tying this topic's protocols (DNS/53, HTTP/80,
  HTTPS/443, SSH/22) to their transport protocol — verify each port/transport mapping. (co-05, co-06)

### Intermediate

- **ex-17 · tcp-window-scaling-tcpdump** — capture a handshake with `tcpdump -v` and locate the `wscale`
  option in the SYN's options list — verify the scale factor is visible alongside `mss`/`sackOK`. (co-08)
- **ex-18 · tcp-flow-control-window-shrink** — a Python socket demo where a slow reader lets the receive
  buffer fill — verify the sender's writes slow or block once the receiver's window shrinks. (co-08)
- **ex-19 · congestion-window-slow-start-diagram** — an annotated diagram of CUBIC's exponential slow-start
  growth transitioning to cubic-function congestion avoidance after a loss event — verify each phase is
  labeled. (co-09)
- **ex-20 · view-active-congestion-control** — run `sysctl net.ipv4.tcp_congestion_control` (or `ss -tin` on
  an active connection) — verify the active algorithm (e.g. `cubic`) prints. (co-09)
- **ex-21 · bbr-vs-cubic-tradeoff-note** — a short annotated comparison contrasting CUBIC's loss-triggered
  window growth with BBR's bandwidth/RTT-model-based pacing — verify the two algorithms are distinguished by
  what triggers a rate change. (co-09)
- **ex-22 · nagle-delayed-ack-stall-diagram** — a sequence diagram showing Nagle (sender withholds a small
  write awaiting an ACK) meeting delayed ACK (receiver withholds that ACK) and producing a visible stall —
  verify the stall is attributed to both sides' behavior. (co-10)
- **ex-23 · tcp-nodelay-socket-option** — a Python client sets `sock.setsockopt(socket.IPPROTO_TCP,
socket.TCP_NODELAY, 1)` before sending small writes — verify latency drops versus the default
  (Nagle-enabled) socket. (co-10, co-11)
- **ex-24 · so-reuseaddr-restart** — a Python server sets `SO_REUSEADDR` before `bind` — verify an immediate
  restart on the same port succeeds without an "address already in use" error. (co-11)
- **ex-25 · nonblocking-socket-select** — a Python socket set nonblocking via `setblocking(False)`, polled
  with `select.select` — verify a read that would otherwise block instead returns immediately or is correctly
  polled. (co-11)
- **ex-26 · dns-resolution-chain-trace** — run `dig +trace example.com` and annotate the root→TLD→authoritative
  referral chain — verify each hop's server and response are labeled. (co-12)
- **ex-27 · dns-caching-ttl-observe** — run `dig example.com` twice in succession and compare the TTL in the
  ANSWER section — verify the TTL has counted down between the two queries. (co-12)
- **ex-28 · dnssec-validate-with-dig** — run `dig +dnssec example.com` — verify `RRSIG` records appear in the
  ANSWER section. (co-13)
- **ex-29 · dnssec-chain-of-trust-diagram** — an annotated diagram of the DNSSEC trust chain from the root
  zone's trust anchor down through `DS`/`DNSKEY`/`RRSIG` to a signed `A` record — verify each link in the
  chain is labeled. (co-13)
- **ex-30 · tls13-handshake-curl-verbose** — run `curl -v https://example.com` and annotate the `* TLSv1.3`
  negotiation lines — verify the negotiated protocol version and cipher print. (co-14)
- **ex-31 · tls13-1rtt-handshake-diagram** — a sequence diagram of the TLS 1.3 1-RTT handshake
  (`ClientHello`+`KeyShare` → `ServerHello`+`KeyShare`+certificate+`Finished` → client `Finished`) — verify
  each message and the single round trip are labeled. (co-14)
- **ex-32 · tls13-session-resumption-0rtt** — annotate a resumed TLS 1.3 handshake using a PSK, contrasted
  with the full 1-RTT handshake — verify the resumed handshake sends application data before the full
  handshake would complete. (co-14)
- **ex-33 · http2-frame-inspect** — run `curl -v --http2 https://example.com` — verify HTTP/2 frame-level
  indicators (stream negotiation, `h2`) appear alongside a `200` response. (co-15)
- **ex-34 · http2-multiplexed-streams-diagram** — a diagram contrasting two HTTP/2 streams interleaved on one
  TCP connection with two separate HTTP/1.1 connections for the same requests — verify the multiplexing
  difference is labeled. (co-15)
- **ex-35 · http2-vs-http11-connection-count** — compare `curl -v` fetching 3 resources over HTTP/1.1
  (multiple connections/serialized requests) against HTTP/2 (one connection) — verify the connection-count
  difference. (co-15)
- **ex-36 · http3-quic-curl-attempt** — run `curl --http3 -v https://<http3-capable-host>` — verify the
  negotiated protocol reports `h3` where supported (or documents the fallback when the local curl
  build/backend lacks HTTP/3 support). (co-16)

### Advanced

- **ex-37 · quic-udp-vs-tcp-hol-blocking-diagram** — a diagram contrasting TCP head-of-line blocking (one
  lost packet stalls all multiplexed streams) with QUIC's independent per-stream loss recovery — verify the
  contrast is labeled stream-by-stream. (co-16)
- **ex-38 · quic-connection-migration-note** — an annotated note explaining how QUIC's connection ID lets a
  connection survive a network change (e.g. Wi-Fi to cellular) without a new handshake — verify the
  connection ID's role in migration is explained. (co-16)
- **ex-39 · websocket-handshake-upgrade** — capture (or annotate) a WebSocket endpoint's `Upgrade: websocket`
  request and `101 Switching Protocols` response — verify both upgrade-handshake headers appear. (co-17)
- **ex-40 · websocket-full-duplex-demo** — a small Python WebSocket script sending and receiving concurrently
  on one open connection — verify both directions carry data without issuing a new request. (co-17)
- **ex-41 · sse-one-way-stream** — a Python server streaming `text/event-stream` `data:` lines, consumed with
  `curl -N` — verify events arrive incrementally over one long-lived response. (co-17)
- **ex-42 · websocket-vs-sse-decision-table** — a decision table (chat, live feed, low-latency media) mapping
  each use case to WebSockets, SSE, WebTransport, or WebRTC — verify each use case carries a justified pick.
  (co-17, co-18)
- **ex-43 · webtransport-overview-diagram** — an annotated diagram of a WebTransport session's QUIC-based
  multiplexed streams/datagrams versus a WebSocket's single TCP stream — verify the transport and
  multiplexing differences are labeled. (co-18)
- **ex-44 · webrtc-peer-connection-diagram** — an annotated diagram of a WebRTC peer connection's signaling
  exchange plus ICE/STUN/TURN path leading to a direct peer-to-peer media stream — verify each stage is
  labeled. (co-18)
- **ex-45 · l4-load-balancer-diagram** — an annotated diagram of an L4 load balancer distributing TCP
  connections by IP/port with no visibility into HTTP content — verify the connection-level routing decision
  is labeled. (co-19)
- **ex-46 · l7-load-balancer-diagram** — an annotated diagram of an L7 load balancer routing requests by HTTP
  path/header content — verify a content-based routing rule is labeled. (co-19)
- **ex-47 · reverse-proxy-request-flow** — a small local Python reverse-proxy script forwarding a client
  request to a backend and returning the response — verify the client observes the proxy's address, not the
  backend's. (co-20)
- **ex-48 · cdn-cache-hit-miss-headers** — run `curl -I` against a CDN-fronted URL and read its cache-status
  header (e.g. `Age`, an `X-Cache`/`CF-Cache-Status`-style header) — verify a hit versus a miss is
  distinguishable from the response headers. (co-20)
- **ex-49 · network-namespace-isolated-stack** — create an isolated namespace with `ip netns add demo`, then
  run `ip netns exec demo ip route` — verify the namespace's routing table is independent of (and initially
  empty relative to) the host's. (co-21)
- **ex-50 · bpf-filter-tcpdump-host-port** — run `tcpdump -i any host <ip> and port 443` — verify only
  packets matching both the host and port filter are captured. (co-22)
- **ex-51 · bpf-filter-tcpdump-flags** — run `tcpdump 'tcp[tcpflags] & tcp-syn != 0'` to isolate SYN packets
  — verify only handshake-opening packets are captured. (co-22)
- **ex-52 · latency-jitter-percentiles-measure** — a Python script issuing repeated requests and computing
  p50/p95/p99 latency plus jitter (variance between consecutive RTTs) — verify the percentiles are computed
  correctly against a known sample. (co-23)
- **ex-53 · bandwidth-vs-throughput-vs-latency-diagram** — an annotated diagram distinguishing latency
  (delay), bandwidth (link capacity), and achieved throughput (capacity minus loss/contention) on the same
  scenario — verify each term is defined against the same link. (co-23)
- **ex-54 · firewall-stateful-rule-diagram** — an annotated diagram of a stateful firewall permitting a reply
  packet because it matches an established outbound connection's state-table entry — verify the state-table
  lookup step is labeled. (co-24)
- **ex-55 · mtls-mutual-auth-diagram** — a sequence diagram of a mutual-TLS handshake where both client and
  server present and verify certificates — verify both `CertificateVerify` steps appear, contrasted with a
  one-sided server-only TLS handshake. (co-14, co-24)

### VPN & overlay networking

- **ex-56 · wireguard-two-peer-tunnel** — generate keys with `wg genkey`/`wg pubkey`, write a two-peer
  `[Interface]`/`[Peer]` config, bring up `wg0` with `wg-quick up`, and ping across it — verify the peers
  reach each other over the encrypted link. (co-26)
- **ex-57 · allowedips-crypto-routing** — set a peer's `AllowedIPs` to one subnet and show traffic to that
  subnet routes through the tunnel while other traffic does not — verify `AllowedIPs` acts as the
  crypto-routing table. (co-26, co-25)
- **ex-58 · split-tunnel-vs-full-tunnel** — contrast `AllowedIPs = 0.0.0.0/0` (full tunnel) against a single
  subnet (split tunnel) — verify which destinations egress the tunnel in each case. (co-25)
- **ex-59 · persistentkeepalive-nat** — put one peer behind a simulated NAT and enable
  `PersistentKeepalive = 25` — verify the mapping stays open and the NATed peer keeps receiving packets. (co-28)
- **ex-60 · site-to-site-vs-remote-access-diagram** — an annotated diagram of a site-to-site tunnel joining
  two subnets vs a remote-access client dialing into one network — verify each topology's routed ranges are
  labelled. (co-25)
- **ex-61 · mesh-overlay-tailscale-nebula-contrast** — an annotated comparison of a Tailscale/Headscale
  coordination-plane mesh vs a Nebula lighthouse + host-certificate mesh for wiring on-prem
  dev/staging/prod — verify each design's control-plane and trust model is labelled and its license named. (co-29)
- **ex-62 · wireguard-vs-openvpn-vs-ipsec-decision** — a decision artifact (DD-20) choosing among WireGuard,
  OpenVPN, and IPsec for a stated constraint (codebase size / configurability / kernel offload) — verify each
  option's trade-off and license is recorded. (co-27)

## Capstone spec — intra-topic (subject → full runnable)

- **Goal**: build a networking diagnostics toolkit + report: a Python CIDR/subnet calculator (validated
  against hand math), a script that traces and annotates a real request path (DNS→TCP→TLS→HTTP), and a
  written analysis of captured `traceroute`/`tcpdump` output — a runnable + documented deliverable.
- **Concepts exercised**: [ ] CIDR/subnet arithmetic — hosts/gateway/broadcast (co-04) [ ] the layered
  model applied to a real packet (co-01) [ ] TCP handshake + TLS 1.3 handshake narrated (co-07, co-14)
  [ ] reading `traceroute`/`tcpdump` output (co-05, co-22) [ ] latency vs bandwidth vs throughput reasoning
  (co-23).
- **Ordered steps**:
  1. `.../learning/capstone/code/subnet.py` — a CIDR calculator (network/broadcast/host-range/host-count).
     Verify its output matches a hand-computed example for at least two prefixes.
  2. `trace.py` — resolve a host, open a connection, and print an annotated DNS→TCP→TLS→HTTP timeline.
     Verify it emits a real status line and each stage is labelled.
  3. `analysis.md` — capture and annotate real `traceroute` + `tcpdump` output for one request. Verify each
     hop/packet is explained and tied to a layer.
- **Acceptance criteria**: the subnet calculator is correct on multiple prefixes; the trace narrates all
  four stages against live output; the analysis correctly maps observed traffic to the model.
- **Done bar**: runnable end-to-end (calculator + trace) + produces the analysis + web-verified.

## Read more

**Books**

- **Computer Networking: A Top-Down Approach** — James F. Kurose & Keith W. Ross (2000; multiple editions since). Widely used standard networking textbook covering the protocol stack from application to physical layers.
- **TCP/IP Illustrated, Volume 1: The Protocols** — W. Richard Stevens (1994; 2nd ed. by Kevin R. Fall, 2011). The classic deep-dive reference on TCP/IP internals, including congestion control.
- **High Performance Browser Networking** — Ilya Grigorik (2013). Free, practitioner-focused guide to TCP, TLS, HTTP/2, and modern web performance networking. <https://hpbn.co/>

**Papers & articles**

- **RFC 9846 – The Transport Layer Security (TLS) Protocol Version 1.3** — IETF (2026). The current TLS 1.3 standard; a minor, backward-compatible revision that **obsoletes RFC 8446** (2018) while keeping the same version number and 1-RTT handshake shape. <https://www.rfc-editor.org/rfc/rfc9846>
- **RFC 9113 – HTTP/2** — IETF (2022). The current standard for HTTP/2 framing, multiplexing, and stream prioritization. <https://www.rfc-editor.org/rfc/rfc9113>
- **RFC 9000 – QUIC: A UDP-Based Multiplexed and Secure Transport** — IETF (2021). Defines QUIC, the transport underlying HTTP/3. <https://www.rfc-editor.org/rfc/rfc9000>
- **RFC 9114 – HTTP/3** — IETF (2022). Defines HTTP/3 as a mapping of HTTP semantics onto QUIC streams. <https://www.rfc-editor.org/rfc/rfc9114>
- **RFC 5681 – TCP Congestion Control** — IETF (2009). Defines slow start, congestion avoidance, and fast retransmit/recovery, the algorithms behind TCP's congestion control. <https://www.rfc-editor.org/rfc/rfc5681>

## In which paths

- `interview-ready/software-engineer` — Go deeper · Data depth — optional deepening tail, not in the required spine.
- `immediately-effective/software-engineer` — Deepening band · Data depth — deepening band, deferred out of the early spine.
- `fundamentally-strong/software-engineer` — Stage 7 · Networking, architecture & distributed systems.

> _Content originated in the now-closed FS-SE plan (topic 29); it now lives here in
> full — this course block is self-contained._

---

← Back to the [course library catalog](./README.md)
