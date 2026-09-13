---
title: "Overview"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [12 · Networking Essentials](../../networking-essentials/learning/overview.md)
  -- this topic assumes you already know what happens when you hit a URL (DNS, TCP, TLS, HTTP), TCP
  vs. UDP at a glance, and how to read a `curl -v`/`dig` transcript; and
  [4 · Just Enough Python](../../just-enough-python/learning/overview.md) -- every Python script in
  this topic is fully type-annotated, and you should already be comfortable reading functions,
  classes, and `list`/`dict`/`set` literals the way that primer taught them.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.x**; the diagnostic CLIs **`ping`**,
  **`traceroute`**, **`dig`**, **`ss`**/**`ip`**, and **`tcpdump`** (several need `sudo` or a Linux
  kernel -- noted plainly at each example that needs one); **`wg`**/**`wg-quick`**
  (`wireguard-tools`); network access.
- **Assumed knowledge**: what happens when you hit a URL (Networking Essentials); TCP vs. UDP at a
  glance; reading a `curl -v`/`dig` transcript.

## Confirm your toolchain

This topic's tools span macOS's own system utilities, a few that need a real Linux kernel (installed
inside a short-lived Docker container where noted), and a Python version check:

```text
$ curl --version | head -1
curl 8.7.1 (x86_64-apple-darwin24.0) libcurl/8.7.1 (SecureTransport) LibreSSL/3.3.6 zlib/1.2.12 nghttp2/1.64.0
$ dig -v
DiG 9.10.6
$ traceroute --help 2>&1 | head -1
Version 1.4a12+Darwin
$ tcpdump --version
tcpdump version 4.99.1 -- Apple version 148
libpcap version 1.10.1
$ wg --version
wireguard-tools v1.0.20260223 - https://git.zx2c4.com/wireguard-tools/
$ python3 --version
Python 3.13.12

# ip/ss are Linux-only (iproute2) -- verified inside the same Debian container
# this topic's other root-requiring captures used:
$ ip -V
ip utility, iproute2-6.15.0, libbpf 1.5.0
$ ss -V
ss utility, iproute2-6.15.0
```

Every Python script in this topic is standard-library-only, actually run against **Python 3.13.12**
(or, where a genuine Linux kernel behavior is the entire point, **Python 3.13.14** inside a local
Debian Linux container, noted plainly at each example that needs it). Every command-line transcript
is a genuine, captured transcript -- against real hosts where reachable, or, for the handful of
commands needing `sudo`/a Linux kernel this sandbox's macOS host cannot provide directly, inside that
same Debian container, again noted plainly at each example that needs it.

## How this topic's examples are organized

- **[Beginner](./beginner.md)** (Examples 1-16) -- the addressing and connection-lifecycle bedrock:
  OSI/TCP-IP layering and encapsulation, link-layer addressing and ARP, IPv4/IPv6 address anatomy,
  CIDR and subnetting, routing basics, NAT, and the TCP handshake/teardown state machine.
- **[Intermediate](./intermediate.md)** (Examples 17-36) -- TCP flow control and congestion control,
  Nagle/delayed-ACK and socket options, DNS resolution and DNSSEC, and the modern application layer
  -- TLS 1.3, HTTP/2, and HTTP/3/QUIC.
- **[Advanced](./advanced.md)** (Examples 37-55) -- QUIC's structural payoffs, the real-time web
  (WebSockets, SSE, WebTransport, WebRTC), load balancing and edge delivery, Linux network namespaces
  and `tcpdump`'s BPF filter language, latency/throughput measurement discipline, and stateful
  firewalls plus mutual TLS.
- **[VPN & Overlay Networking](./vpn-and-overlay.md)** (Examples 56-62) -- WireGuard's own minimal
  design, brought up as a real two-peer tunnel; the general VPN/tunnel/overlay vocabulary; NAT
  traversal and keepalive; and two decision artifacts -- which point-to-point VPN protocol, and which
  mesh-overlay platform.
- **[Capstone](./capstone/overview.md)** -- a networking diagnostics toolkit and report: a CIDR
  calculator validated against hand math, a script that traces and narrates a real request's full
  DNS-to-HTTP timeline, and a written analysis of captured `traceroute`/`tcpdump` output.

## The 29 concepts this topic covers

- **co-01 · OSI/TCP-IP layering and encapsulation** -- the OSI 7-layer and TCP/IP 4-layer models
  name the same stack, and encapsulation wraps a payload in a new header at each layer descending
  (and strips one ascending). Examples 1-2, and the capstone's `trace.py`/`analysis.md`.
- **co-02 · Link-layer addressing and ARP** -- a MAC address identifies a NIC on its local segment,
  and ARP resolves an IP address to a MAC address before a frame can be sent on that segment.
  Examples 3-4.
- **co-03 · IPv4/IPv6 addressing** -- IPv4's 32-bit dotted-decimal and IPv6's 128-bit
  hextet-and-compression addressing are the two address families a stack must parse and normalize.
  Examples 5-6.
- **co-04 · CIDR and subnetting** -- a CIDR prefix (`/24`) splits an address block into network and
  host portions, from which network address, broadcast address, host range, and host count are
  derived arithmetically. Examples 7-8, and the capstone's `subnet.py`.
- **co-05 · Routing basics** -- a routing table maps destination prefixes to a next-hop, and a
  default route (default gateway) catches everything not matched more specifically. Examples 9-10,
  16, and the capstone's `analysis.md`.
- **co-06 · NAT** -- NAT rewrites a private source address/port to a shared public one at a gateway
  so multiple private hosts share one public IP. Examples 11-12, 16.
- **co-07 · TCP handshake and teardown internals** -- TCP opens via a three-way SYN/SYN-ACK/ACK
  handshake and closes via a FIN/ACK exchange (or aborts via RST), each transition moving the
  connection through a defined state machine. Examples 13-15, and the capstone's `analysis.md`.
- **co-08 · TCP flow control** -- the receiver advertises a window (extendable via the RFC 7323
  window-scale option) that caps how much unacknowledged data the sender may have in flight,
  protecting a slow receiver from being overrun. Examples 17-18.
- **co-09 · TCP congestion control** -- the sender paces itself against inferred network capacity --
  slow start, congestion avoidance, and a chosen algorithm (CUBIC by default; BBR as a model-based
  alternative). Examples 19-21.
- **co-10 · Nagle and delayed ACK** -- Nagle's algorithm withholds small writes awaiting an ACK while
  delayed ACK withholds that same ACK awaiting more data or a timeout, and the two together can
  compound into a multi-hundred-millisecond stall. Examples 22-23.
- **co-11 · Socket options and nonblocking I/O** -- socket options (`SO_REUSEADDR`, `TCP_NODELAY`)
  and nonblocking mode (`setblocking(False)`/`select`) change how a socket behaves without changing
  the protocol on the wire. Examples 23-25.
- **co-12 · DNS resolution internals** -- a recursive resolver walks the referral chain from root to
  TLD to authoritative server on a cache miss, and caches the answer for its TTL on a hit. Examples
  26-27.
- **co-13 · DNSSEC** -- DNSSEC signs DNS records (`RRSIG`) and chains trust through `DNSKEY`/`DS`
  records from a trust anchor down to a signed answer, letting a resolver detect tampering. Examples
  28-29.
- **co-14 · TLS 1.3 handshake internals** -- TLS 1.3's handshake exchanges key shares in the first
  flight so the full handshake completes in 1-RTT, and a resumed session using a PSK can send
  application data even earlier. Examples 30-32, 55, and the capstone's `trace.py`.
- **co-15 · HTTP/2 multiplexing** -- HTTP/2 interleaves multiple streams' frames on one TCP
  connection with header compression. Examples 33-35.
- **co-16 · HTTP/3 and QUIC** -- HTTP/3 runs over QUIC (UDP-based, TLS-integrated), giving each
  stream independent loss recovery, and letting a connection migrate across a network change via a
  connection ID. Examples 36-38.
- **co-17 · WebSockets vs. SSE** -- WebSockets upgrade an HTTP connection into a full-duplex,
  bidirectional channel; Server-Sent Events keep one long-lived HTTP response streaming one-way,
  server-to-client only. Examples 39-42.
- **co-18 · WebTransport and WebRTC** -- WebTransport exposes QUIC's multiplexed streams/datagrams to
  the browser; WebRTC negotiates a direct (ICE/STUN/TURN-assisted) peer-to-peer media/data path.
  Examples 42-44.
- **co-19 · Load balancing, L4 vs. L7** -- an L4 load balancer routes by transport-level identifiers
  (IP/port) with no content visibility; an L7 load balancer inspects and routes on application
  content (HTTP path/headers). Examples 45-46.
- **co-20 · Reverse proxies and CDNs** -- a reverse proxy sits in front of one or more origin servers
  and forwards client requests to them; a CDN is a distributed cache of reverse proxies at the
  network edge. Examples 47-48.
- **co-21 · Network namespaces** -- a Linux network namespace is an isolated copy of the network
  stack (its own interfaces, routes, and firewall rules). Example 49.
- **co-22 · Packet capture and BPF filters** -- `tcpdump` captures packets filtered by a BPF
  expression that can match protocols, hosts, ports, and even individual header bits. Examples 50-51,
  and the capstone's `analysis.md`.
- **co-23 · Latency, jitter, and percentiles** -- latency, bandwidth, and throughput are three
  distinct measurements, and latency is best summarized by percentiles (p50/p95/p99) plus jitter, not
  a single average. Examples 52-53.
- **co-24 · Firewalls and mTLS** -- a stateful firewall permits a reply packet by matching it against
  an established connection's state-table entry; mutual TLS extends TLS so both sides present and
  verify a certificate. Examples 54-55.
- **co-25 · VPN tunnels and overlays** -- a VPN encapsulates and encrypts traffic inside an outer
  packet; a site-to-site tunnel joins whole networks, a remote-access tunnel connects a single
  client, and split tunneling routes only chosen subnets through the tunnel. Examples 57-58, 60.
- **co-26 · WireGuard** -- a modern in-kernel VPN built on the Noise-framework IK handshake with a
  fixed cryptographic suite; its config is `[Interface]` + `[Peer]`, with `AllowedIPs` acting as a
  crypto-routing table. Examples 56-57.
- **co-27 · IPsec vs. OpenVPN vs. WireGuard** -- IPsec/IKE is the standards-heavy kernel option,
  OpenVPN the mature TLS-based userspace option, and WireGuard the minimal modern option -- the
  choice trades configurability against codebase size and audit surface. Example 62.
- **co-28 · NAT traversal and keepalive** -- a peer behind NAT keeps its mapping open with periodic
  keepalives; hole-punching/STUN and relay fallbacks let peers connect without a public inbound port.
  Example 59.
- **co-29 · Mesh overlay VPNs** -- mesh VPNs give every node a stable identity on a flat encrypted
  overlay: Tailscale (WireGuard data plane + a coordination plane), Headscale (an open-source
  Tailscale control server), and Nebula (a lighthouse + host certificates). Example 61.

## Examples by level

### Beginner (Examples 1-16)

- [Example 1: OSI Layer Mapping -- Annotating a curl -v Trace](/en/c/learn/courses/advanced-networking/learning/beginner#example-1-osi-layer-mapping----annotating-a-curl--v-trace)
- [Example 2: Encapsulation -- a Payload Gaining and Shedding Headers](/en/c/learn/courses/advanced-networking/learning/beginner#example-2-encapsulation----a-payload-gaining-and-shedding-headers)
- [Example 3: View the Local Interface's MAC Address](/en/c/learn/courses/advanced-networking/learning/beginner#example-3-view-the-local-interfaces-mac-address)
- [Example 4: Inspect the ARP Cache](/en/c/learn/courses/advanced-networking/learning/beginner#example-4-inspect-the-arp-cache)
- [Example 5: IPv4 Binary Anatomy -- 192.0.2.10, Octet by Octet](/en/c/learn/courses/advanced-networking/learning/beginner#example-5-ipv4-binary-anatomy----1920210-octet-by-octet)
- [Example 6: IPv6 Address Expand/Compress -- 2001:db8::1 Round-Trips](/en/c/learn/courses/advanced-networking/learning/beginner#example-6-ipv6-address-expandcompress----2001db81-round-trips)
- [Example 7: CIDR Prefix to Netmask -- /24, /26, /30 by Hand](/en/c/learn/courses/advanced-networking/learning/beginner#example-7-cidr-prefix-to-netmask----24-26-30-by-hand)
- [Example 8: Subnet Calculator -- Network, Broadcast, Host Range, Host Count](/en/c/learn/courses/advanced-networking/learning/beginner#example-8-subnet-calculator----network-broadcast-host-range-host-count)
- [Example 9: View the Routing Table](/en/c/learn/courses/advanced-networking/learning/beginner#example-9-view-the-routing-table)
- [Example 10: traceroute -- a Numbered Hop List](/en/c/learn/courses/advanced-networking/learning/beginner#example-10-traceroute----a-numbered-hop-list)
- [Example 11: Classify Addresses -- RFC 1918 Private vs. Public](/en/c/learn/courses/advanced-networking/learning/beginner#example-11-classify-addresses----rfc-1918-private-vs-public)
- [Example 12: NAT Translation -- a Packet Crossing the Gateway](/en/c/learn/courses/advanced-networking/learning/beginner#example-12-nat-translation----a-packet-crossing-the-gateway)
- [Example 13: TCP Handshake -- a Genuine tcpdump Capture](/en/c/learn/courses/advanced-networking/learning/beginner#example-13-tcp-handshake----a-genuine-tcpdump-capture)
- [Example 14: TCP Teardown -- the Same Capture's Closing Lines](/en/c/learn/courses/advanced-networking/learning/beginner#example-14-tcp-teardown----the-same-captures-closing-lines)
- [Example 15: ss -tan -- Watching a Connection's State Transition](/en/c/learn/courses/advanced-networking/learning/beginner#example-15-ss--tan----watching-a-connections-state-transition)
- [Example 16: Well-Known Ports Review](/en/c/learn/courses/advanced-networking/learning/beginner#example-16-well-known-ports-review)

### Intermediate (Examples 17-36)

- [Example 17: TCP Window Scaling -- Locating wscale in a Live Capture](/en/c/learn/courses/advanced-networking/learning/intermediate#example-17-tcp-window-scaling----locating-wscale-in-a-live-capture)
- [Example 18: TCP Flow Control -- a Slow Reader Blocks a Fast Writer](/en/c/learn/courses/advanced-networking/learning/intermediate#example-18-tcp-flow-control----a-slow-reader-blocks-a-fast-writer)
- [Example 19: CUBIC's Slow Start Transitioning to Congestion Avoidance](/en/c/learn/courses/advanced-networking/learning/intermediate#example-19-cubics-slow-start-transitioning-to-congestion-avoidance)
- [Example 20: View This Sandbox's Active Congestion-Control Algorithm](/en/c/learn/courses/advanced-networking/learning/intermediate#example-20-view-this-sandboxs-active-congestion-control-algorithm)
- [Example 21: CUBIC vs. BBR -- What Triggers a Rate Change](/en/c/learn/courses/advanced-networking/learning/intermediate#example-21-cubic-vs-bbr----what-triggers-a-rate-change)
- [Example 22: Nagle Meets Delayed ACK -- a Visible Stall](/en/c/learn/courses/advanced-networking/learning/intermediate#example-22-nagle-meets-delayed-ack----a-visible-stall)
- [Example 23: TCP_NODELAY -- Measuring the Nagle/Delayed-ACK Stall](/en/c/learn/courses/advanced-networking/learning/intermediate#example-23-tcp_nodelay----measuring-the-nagledelayed-ack-stall)
- [Example 24: SO_REUSEADDR -- Rebinding a Port Still in TIME-WAIT](/en/c/learn/courses/advanced-networking/learning/intermediate#example-24-so_reuseaddr----rebinding-a-port-still-in-time-wait)
- [Example 25: Nonblocking Sockets -- setblocking(False) Polled with select.select](/en/c/learn/courses/advanced-networking/learning/intermediate#example-25-nonblocking-sockets----setblockingfalse-polled-with-selectselect)
- [Example 26: dig +trace -- the Root-to-Authoritative Referral Chain](/en/c/learn/courses/advanced-networking/learning/intermediate#example-26-dig-trace----the-root-to-authoritative-referral-chain)
- [Example 27: DNS Caching -- Watching the TTL Count Down](/en/c/learn/courses/advanced-networking/learning/intermediate#example-27-dns-caching----watching-the-ttl-count-down)
- [Example 28: DNSSEC -- an RRSIG Record in a Real Answer](/en/c/learn/courses/advanced-networking/learning/intermediate#example-28-dnssec----an-rrsig-record-in-a-real-answer)
- [Example 29: The DNSSEC Chain of Trust](/en/c/learn/courses/advanced-networking/learning/intermediate#example-29-the-dnssec-chain-of-trust)
- [Example 30: TLS 1.3 -- Reading the Negotiation Lines](/en/c/learn/courses/advanced-networking/learning/intermediate#example-30-tls-13----reading-the-negotiation-lines)
- [Example 31: TLS 1.3's Single Round Trip](/en/c/learn/courses/advanced-networking/learning/intermediate#example-31-tls-13s-single-round-trip)
- [Example 32: 0-RTT Session Resumption vs. the Full Handshake](/en/c/learn/courses/advanced-networking/learning/intermediate#example-32-0-rtt-session-resumption-vs-the-full-handshake)
- [Example 33: HTTP/2 -- Frame-Level Indicators in curl -v](/en/c/learn/courses/advanced-networking/learning/intermediate#example-33-http2----frame-level-indicators-in-curl--v)
- [Example 34: HTTP/2 Multiplexing vs. HTTP/1.1's Multiple Connections](/en/c/learn/courses/advanced-networking/learning/intermediate#example-34-http2-multiplexing-vs-http11s-multiple-connections)
- [Example 35: Measuring the Connection-Count Difference](/en/c/learn/courses/advanced-networking/learning/intermediate#example-35-measuring-the-connection-count-difference)
- [Example 36: HTTP/3 -- Attempting QUIC with curl](/en/c/learn/courses/advanced-networking/learning/intermediate#example-36-http3----attempting-quic-with-curl)

### Advanced (Examples 37-55)

- [Example 37: QUIC vs. TCP -- Head-of-Line Blocking, Contrasted Stream by Stream](/en/c/learn/courses/advanced-networking/learning/advanced#example-37-quic-vs-tcp----head-of-line-blocking-contrasted-stream-by-stream)
- [Example 38: QUIC Connection Migration -- Surviving a Network Change Without a New Handshake](/en/c/learn/courses/advanced-networking/learning/advanced#example-38-quic-connection-migration----surviving-a-network-change-without-a-new-handshake)
- [Example 39: The WebSocket Handshake -- a Real Upgrade: websocket / 101 Exchange](/en/c/learn/courses/advanced-networking/learning/advanced#example-39-the-websocket-handshake----a-real-upgrade-websocket--101-exchange)
- [Example 40: WebSockets Are Full-Duplex -- a Minimal Demo on One Open Connection](/en/c/learn/courses/advanced-networking/learning/advanced#example-40-websockets-are-full-duplex----a-minimal-demo-on-one-open-connection)
- [Example 41: Server-Sent Events -- One-Way, Server-to-Client, Over One Long-Lived Response](/en/c/learn/courses/advanced-networking/learning/advanced#example-41-server-sent-events----one-way-server-to-client-over-one-long-lived-response)
- [Example 42: WebSockets vs. SSE vs. WebTransport vs. WebRTC -- a Decision Table](/en/c/learn/courses/advanced-networking/learning/advanced#example-42-websockets-vs-sse-vs-webtransport-vs-webrtc----a-decision-table)
- [Example 43: WebTransport -- QUIC's Multiplexed Streams and Datagrams, Exposed to the Browser](/en/c/learn/courses/advanced-networking/learning/advanced#example-43-webtransport----quics-multiplexed-streams-and-datagrams-exposed-to-the-browser)
- [Example 44: WebRTC -- Signaling, ICE/STUN/TURN, Then a Direct Peer-to-Peer Path](/en/c/learn/courses/advanced-networking/learning/advanced#example-44-webrtc----signaling-icestunturn-then-a-direct-peer-to-peer-path)
- [Example 45: L4 Load Balancing -- Routing by IP/Port, No Content Visibility](/en/c/learn/courses/advanced-networking/learning/advanced#example-45-l4-load-balancing----routing-by-ipport-no-content-visibility)
- [Example 46: L7 Load Balancing -- Routing by HTTP Path/Header Content](/en/c/learn/courses/advanced-networking/learning/advanced#example-46-l7-load-balancing----routing-by-http-pathheader-content)
- [Example 47: A Local Reverse Proxy -- Forwarding a Client Request to a Backend](/en/c/learn/courses/advanced-networking/learning/advanced#example-47-a-local-reverse-proxy----forwarding-a-client-request-to-a-backend)
- [Example 48: CDN Cache Hit vs. Miss -- Reading cf-cache-status and age](/en/c/learn/courses/advanced-networking/learning/advanced#example-48-cdn-cache-hit-vs-miss----reading-cf-cache-status-and-age)
- [Example 49: Linux Network Namespaces -- an Isolated, Independent Network Stack](/en/c/learn/courses/advanced-networking/learning/advanced#example-49-linux-network-namespaces----an-isolated-independent-network-stack)
- [Example 50: BPF Filter -- Isolating Traffic to One Host and Port](/en/c/learn/courses/advanced-networking/learning/advanced#example-50-bpf-filter----isolating-traffic-to-one-host-and-port)
- [Example 51: BPF Filter -- Isolating Only TCP SYN Packets](/en/c/learn/courses/advanced-networking/learning/advanced#example-51-bpf-filter----isolating-only-tcp-syn-packets)
- [Example 52: Latency Percentiles and Jitter -- Computed Against a Known Sample](/en/c/learn/courses/advanced-networking/learning/advanced#example-52-latency-percentiles-and-jitter----computed-against-a-known-sample)
- [Example 53: Latency vs. Bandwidth vs. Throughput -- Three Different Things, One Link](/en/c/learn/courses/advanced-networking/learning/advanced#example-53-latency-vs-bandwidth-vs-throughput----three-different-things-one-link)
- [Example 54: A Stateful Firewall -- Permitting a Reply by Matching Connection State](/en/c/learn/courses/advanced-networking/learning/advanced#example-54-a-stateful-firewall----permitting-a-reply-by-matching-connection-state)
- [Example 55: Mutual TLS -- Both Sides Present and Verify a Certificate](/en/c/learn/courses/advanced-networking/learning/advanced#example-55-mutual-tls----both-sides-present-and-verify-a-certificate)

### VPN & Overlay Networking (Examples 56-62)

- [Example 56: WireGuard -- Generating Keys and Bringing Up a Real Two-Peer Tunnel](/en/c/learn/courses/advanced-networking/learning/vpn-and-overlay#example-56-wireguard----generating-keys-and-bringing-up-a-real-two-peer-tunnel)
- [Example 57: AllowedIPs as a Crypto-Routing Table](/en/c/learn/courses/advanced-networking/learning/vpn-and-overlay#example-57-allowedips-as-a-crypto-routing-table)
- [Example 58: Split Tunnel vs. Full Tunnel -- What AllowedIPs Actually Changes](/en/c/learn/courses/advanced-networking/learning/vpn-and-overlay#example-58-split-tunnel-vs-full-tunnel----what-allowedips-actually-changes)
- [Example 59: PersistentKeepalive -- Refreshing a NAT Mapping With Zero Application Traffic](/en/c/learn/courses/advanced-networking/learning/vpn-and-overlay#example-59-persistentkeepalive----refreshing-a-nat-mapping-with-zero-application-traffic)
- [Example 60: Site-to-Site vs. Remote-Access Tunnels](/en/c/learn/courses/advanced-networking/learning/vpn-and-overlay#example-60-site-to-site-vs-remote-access-tunnels)
- [Example 61: Mesh Overlay VPNs -- Tailscale/Headscale vs. Nebula](/en/c/learn/courses/advanced-networking/learning/vpn-and-overlay#example-61-mesh-overlay-vpns----tailscaleheadscale-vs-nebula)
- [Example 62: WireGuard vs. OpenVPN vs. IPsec -- a Decision Artifact](/en/c/learn/courses/advanced-networking/learning/vpn-and-overlay#example-62-wireguard-vs-openvpn-vs-ipsec----a-decision-artifact)

---

← Previous: [28 · Build Your Own ORM & Query Builder
Drilling](../../build-your-own-orm-and-query-builder/drilling/overview.md) &middot; Next: [Beginner
Examples](./beginner.md) →
