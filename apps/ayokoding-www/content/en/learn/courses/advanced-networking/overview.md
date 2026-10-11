---
title: "Overview"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Networking Essentials](../networking-essentials/learning/overview.md) --
  this topic assumes you already know what happens when you hit a URL (DNS, TCP, TLS, HTTP), TCP vs.
  UDP at a glance, and how to read a `curl -v`/`dig` transcript; and
  [Just Enough Python](../just-enough-python/learning/overview.md) -- every Python script in this
  topic is fully type-annotated, and you should already be comfortable reading functions, classes,
  and `list`/`dict`/`set` literals the way that primer taught them.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.13**; the diagnostic CLIs `ping`,
  `traceroute`, `dig`, `ss`/`ip`, and `tcpdump` (several need `sudo` or a Linux kernel -- noted plainly
  at each example that needs one); `wg`/`wg-quick` (`wireguard-tools`); network access.
- **Assumed knowledge**: what happens when you hit a URL; TCP vs. UDP at a glance; reading a
  `curl -v`/`dig` transcript -- all built by Networking Essentials.

## Why this exists -- the big idea

**The problem before the solution**: Networking Essentials gets you through "what happens when you
hit a URL," but the moment something is slow, flaky, or unreachable in a way that single mental model
can't explain, you need the layered model itself as a debugging tool -- not just a fact you memorized.
**The one idea worth keeping if you forget everything else**: every layer exists to solve exactly one
problem the layer below it can't, and every layer leaks its own limitations upward -- congestion
control leaks into apparent "flakiness," NAT leaks into "why can't two peers just connect directly,"
and a VPN's whole design is which layer it re-implements and why.

**Cross-cutting big ideas, taught here and then reused for the rest of this curriculum**:
`layering-and-leaks` -- TCP's flow/congestion control, Nagle's algorithm, and NAT's address rewriting
all look like separate topics until you see them as one layer quietly compensating for, or leaking
into, the layer above or below it; `consistency-latency-throughput` -- almost every advanced
networking decision in this topic (TCP vs. QUIC, WebSockets vs. SSE, split tunnel vs. full tunnel,
WireGuard vs. IPsec) is a trade-off among consistency of behavior, latency, and throughput, not a
strictly-better-or-worse choice.

This topic teaches the mechanisms underneath the request/response model: TCP's flow and congestion
control and the Nagle/delayed-ACK interaction, DNS resolution internals and DNSSEC, the TLS 1.3
handshake, HTTP/2 multiplexing and HTTP/3-over-QUIC, the real-time web (WebSockets, SSE,
WebTransport, WebRTC), load balancing and edge delivery, Linux network namespaces and packet capture,
latency/throughput measurement discipline, stateful firewalls and mutual TLS, and VPN/overlay
networking (WireGuard brought up as a real two-peer tunnel, plus the point-to-point-vs-mesh-overlay
decision space) -- all grounded in 62 worked examples plus an intra-topic capstone.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 62 worked examples across Beginner (Examples 1-16: OSI/
  TCP-IP layering, link-layer addressing and ARP, IPv4/IPv6 addressing, CIDR and subnetting, routing,
  NAT, and the TCP handshake/teardown state machine), Intermediate (Examples 17-36: TCP flow and
  congestion control, Nagle/delayed-ACK, socket options, DNS resolution and DNSSEC, and TLS 1.3/
  HTTP/2/HTTP/3), Advanced (Examples 37-55: QUIC's structural payoffs, the real-time web, load
  balancing and edge delivery, network namespaces and BPF filters, latency measurement discipline,
  and stateful firewalls plus mTLS), and VPN & Overlay Networking (Examples 56-62: a real two-peer
  WireGuard tunnel, NAT traversal and keepalive, site-to-site vs. remote-access tunnels, mesh overlay
  VPNs, and a WireGuard-vs-OpenVPN-vs-IPsec decision artifact) -- plus an intra-topic capstone that
  builds a small networking diagnostics toolkit.
- **[Drilling](./drilling/overview.md)** -- a spaced-repetition companion covering all 29 concepts:
  recall Q&A, scenario-judgment items, hands-on repetition katas, and a self-check checklist.

Every worked example is a genuine, captured transcript or a genuinely-run script -- every printed
value, packet capture, and handshake timing on this topic's pages is real, never fabricated; the rare
case where a genuinely live capture isn't achievable in this environment (a specific root-level
capability, a specific external service) is labeled plainly as a reconstruction, never presented as a
live capture it is not.

---

Next: [Learning Overview](./learning/overview.md) →
