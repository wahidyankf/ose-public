---
title: "Overview"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the Advanced Networking topic: recall first, then
applied judgment, then hands-on repetition, then a checklist, then why/why-not reasoning to confirm
real automaticity, not just recognition. Every answer is hidden in a `<details>` block; try each item
yourself before opening it.

Every item below uses its own mocked, self-contained scenario or input -- different hosts, addresses,
and traffic patterns from anything in the learning track's 62 worked examples -- so recognizing an
answer isn't enough; you have to actually reconstruct the reasoning. Where a kata touches timing or a
live network/kernel capability this topic's own examples needed root or a real host for, the kata is
rebuilt as a deterministic, in-memory simulation instead, so every kata here is runnable anywhere
Python 3.13 is installed, with nothing else to set up and no network access required.

## Recall Q&A

Twenty-nine short-answer questions, one per concept (`co-01` through `co-29`). Answer from memory,
then check.

**Q1 (co-01 -- OSI/TCP-IP layering and encapsulation).** What does encapsulation actually do to a
payload as it moves down the stack at a sending host, and what happens in reverse at the receiver?

<details>
<summary>Answer</summary>

Each descending layer wraps the payload it receives from the layer above in a new header (and
sometimes a trailer) carrying that layer's own addressing/control information, then hands the whole
thing to the layer below. At the receiver, each ascending layer strips off exactly one header,
uses it to decide how to interpret and hand off the remaining payload, and passes what's left up to
the layer above -- OSI's 7 layers and TCP/IP's 4 layers describe the same underlying concerns, just
split at different granularity.

</details>

**Q2 (co-02 -- link-layer addressing and ARP).** Why can't a host send a frame to another host on its
own local segment using only that host's IP address?

<details>
<summary>Answer</summary>

Frames are addressed by MAC address, not IP address -- the link layer has no idea what an IP address
is. ARP resolves an IP address to its MAC address (by broadcasting a request on the local segment and
caching the unicast reply) before a frame carrying that IP packet can actually be put on the wire.

</details>

**Q3 (co-03 -- IPv4/IPv6 addressing).** What's the address-space and notation difference between IPv4
and IPv6, and what does the `::` compression rule allow -- and forbid?

<details>
<summary>Answer</summary>

IPv4 is a 32-bit address written as four dotted decimal octets (~4.3 billion addresses total); IPv6
is a 128-bit address written as eight colon-separated hextets. `::` compresses exactly ONE contiguous
run of all-zero hextets to keep addresses readable -- using it twice in the same address would make
the expansion ambiguous, so it's forbidden.

</details>

**Q4 (co-04 -- CIDR and subnetting).** Given a `/27` block, how many usable host addresses does it
have, and why is that number 2 less than the raw block size?

<details>
<summary>Answer</summary>

`2**(32-27) = 32` raw addresses, of which 30 are usable. The first address in the block is reserved
as the network address (identifies the subnet itself) and the last is reserved as the broadcast
address (targets every host on the subnet) -- neither can be assigned to an individual host.

</details>

**Q5 (co-05 -- routing basics).** What's a default route, and why does a router only fall back to it
after checking every more specific route, never before?

<details>
<summary>Answer</summary>

A default route (`0.0.0.0/0`) matches every possible destination. Routers apply longest-prefix-match
first among ALL routes that match a destination, so any more specific route always wins over the
default -- the default route is deliberately the least specific possible match, used only when
nothing more specific applies.

</details>

**Q6 (co-06 -- NAT).** What fields does a NAT gateway rewrite on an outbound packet, and what must it
remember to correctly rewrite the reply?

<details>
<summary>Answer</summary>

It rewrites the packet's source IP (and usually source port) to its own public IP and a chosen public
port. To handle the reply, it keeps a translation-table entry mapping (private IP, private port) to
(public IP, public port) so an inbound reply to that public IP/port gets rewritten back to the
correct private destination.

</details>

**Q7 (co-07 -- TCP handshake and teardown internals).** Name the three-way handshake and the teardown
segments, and say which side ends up in `TIME_WAIT` and why.

<details>
<summary>Answer</summary>

Handshake: SYN, SYN-ACK, ACK. Teardown: FIN, ACK, FIN, ACK (or an abrupt RST). The side that sends
the FINAL ACK of the teardown enters `TIME_WAIT`, waiting `2 * MSL` to guarantee any duplicate,
delayed segment from this now-closed connection expires in the network before the same 4-tuple could
be reused by a new connection.

</details>

**Q8 (co-08 -- TCP flow control).** What does the receive window actually advertise, and what happens
if a sender ignores it?

<details>
<summary>Answer</summary>

It advertises how many unacknowledged bytes the receiver is currently willing to buffer. A sender
that ignores it and keeps sending anyway risks the receiver dropping the excess -- the window exists
specifically so a fast sender cannot overrun a slower receiver's buffer.

</details>

**Q9 (co-09 -- TCP congestion control).** What ends slow start's exponential growth, and what's the
qualitative difference in growth rate after that point?

<details>
<summary>Answer</summary>

Reaching `ssthresh` (or a detected loss event) ends slow start. After that, congestion avoidance
grows the congestion window roughly linearly (additive increase) instead of exponentially -- a much
more cautious probe of remaining network capacity.

</details>

**Q10 (co-10 -- Nagle and delayed ACK).** Why can two individually reasonable TCP optimizations
combine into a multi-hundred-millisecond stall?

<details>
<summary>Answer</summary>

Nagle's algorithm withholds a small unacknowledged write, hoping to coalesce it with more data before
sending. Delayed ACK withholds the corresponding ACK for the same reason. If each side is waiting on
the other, nothing moves until delayed ACK's own timer finally fires -- two locally sensible
optimizations deadlocking each other at the interaction boundary.

</details>

**Q11 (co-11 -- socket options and nonblocking I/O).** What does `TCP_NODELAY` do, and how does a
nonblocking socket's `recv()` behave differently from a blocking one's?

<details>
<summary>Answer</summary>

`TCP_NODELAY` disables Nagle's algorithm on that socket, so small writes go out immediately instead
of waiting to coalesce. A nonblocking `recv()` returns immediately (typically with an
`EWOULDBLOCK`/`BlockingIOError`) if no data is ready, instead of blocking the calling thread --
requiring the caller to poll (e.g. via `select()`) for readiness.

</details>

**Q12 (co-12 -- DNS resolution internals).** Walk the referral chain a recursive resolver follows on
a cold cache miss.

<details>
<summary>Answer</summary>

Root server -> TLD server (e.g. the `.com` servers) -> the domain's authoritative nameserver, with
each intermediate step returning a REFERRAL (not the final answer) pointing to the next server down
the chain, until the authoritative server answers directly. Any lookup within the answer's TTL after
that is served straight from cache, skipping the whole walk.

</details>

**Q13 (co-13 -- DNSSEC).** What does an `RRSIG` record prove, and where does the chain of trust
ultimately anchor?

<details>
<summary>Answer</summary>

An `RRSIG` is a cryptographic signature over a record set, verifiable using the zone's own `DNSKEY`.
A `DS` record published in the PARENT zone attests to the child zone's `DNSKEY`, chaining trust
upward zone by zone until it reaches the root zone's built-in, out-of-band trust anchor.

</details>

**Q14 (co-14 -- TLS 1.3 handshake internals).** Why does TLS 1.3 complete in 1-RTT where TLS 1.2
needed 2-RTT?

<details>
<summary>Answer</summary>

TLS 1.3's client sends its key-share GUESSES in the very first flight (the `ClientHello`) instead of
waiting to first learn which group the server prefers. The server can then derive the shared secret
and reply with its own key share, encrypted certificate, and `Finished` message in a single round
trip -- and a resumed session using a PSK can send application data even earlier (0-RTT).

</details>

**Q15 (co-15 -- HTTP/2 multiplexing).** What problem does HTTP/2 multiplexing solve that HTTP/1.1
pipelining could not?

<details>
<summary>Answer</summary>

HTTP/1.1 pipelining still delivers responses in strict request order (head-of-line blocking at the
framing level) even when sent over one connection. HTTP/2 interleaves independent STREAMS' frames on
one TCP connection, so a slow response no longer blocks delivery of a faster response queued behind
it.

</details>

**Q16 (co-16 -- HTTP/3 and QUIC).** Why does QUIC avoid the head-of-line-blocking problem that
TCP-based HTTP/2 still has?

<details>
<summary>Answer</summary>

HTTP/2 multiplexes many streams over ONE TCP connection's single ordered byte stream, so one lost TCP
segment stalls delivery of EVERY stream until it's retransmitted. QUIC runs loss recovery
independently per stream over UDP, so a lost packet only stalls the one stream it belonged to --
QUIC also lets a connection migrate across a network change via a stable connection ID, instead of
requiring a brand-new handshake.

</details>

**Q17 (co-17 -- WebSockets vs. SSE).** What's the fundamental directional difference between a
WebSocket connection and a Server-Sent Events stream?

<details>
<summary>Answer</summary>

A WebSocket connection is full-duplex -- after the upgrade, either side can send at any time. Server-
Sent Events are one-way, server-to-client only, delivered over one ordinary, long-lived HTTP response
(`text/event-stream`) -- there's no channel back to the server on that same connection at all.

</details>

**Q18 (co-18 -- WebTransport and WebRTC).** How does WebTransport's relationship to QUIC differ from
WebRTC's connection model?

<details>
<summary>Answer</summary>

WebTransport exposes QUIC's own multiplexed streams and datagrams directly to the browser -- still a
client-to-server QUIC/UDP connection under the hood. WebRTC instead negotiates (via a signaling
channel plus ICE/STUN/TURN) a DIRECT peer-to-peer path between two browsers, only falling back to a
relay (TURN) when a direct path can't be established.

</details>

**Q19 (co-19 -- load balancing, L4 vs. L7).** What can an L7 load balancer route on that an L4 load
balancer structurally cannot?

<details>
<summary>Answer</summary>

An L4 load balancer only sees transport-level identifiers (source/destination IP and port) with no
visibility into application content. An L7 load balancer terminates (or inspects) the application
layer, so it can route decisions on HTTP path, header, or cookie value -- content an L4 balancer
never sees at all.

</details>

**Q20 (co-20 -- reverse proxies and CDNs).** What's the structural relationship between a CDN and a
reverse proxy?

<details>
<summary>Answer</summary>

A CDN IS a distributed reverse proxy -- many geographically distributed reverse-proxy caches sitting
between clients and one (or a few) origin servers, each individually capable of serving a cached
response entirely without contacting the origin.

</details>

**Q21 (co-21 -- network namespaces).** What does a Linux network namespace isolate, and why is it the
building block under both containers and `ip netns`?

<details>
<summary>Answer</summary>

An entirely separate copy of the network stack -- its own interfaces (even its own loopback), its own
routing table, and its own firewall rules -- invisible to and independent from every other namespace
on the same kernel. Container runtimes give each container its own network namespace for exactly this
isolation; `ip netns` exposes the same primitive directly.

</details>

**Q22 (co-22 -- packet capture and BPF filters).** What can a BPF filter expression match beyond just
a host and a port?

<details>
<summary>Answer</summary>

Protocol (`tcp`/`udp`/`icmp`), specific TCP flag bits (e.g. `tcp[13] & 2 != 0` isolates SYN packets),
packet direction (`src`/`dst`), and arbitrary byte offsets and bitmasks within a packet's own header
fields -- BPF is a small expression language, not just a host/port matcher.

</details>

**Q23 (co-23 -- latency, jitter, and percentiles).** Why is a single average latency number actively
misleading for a user-facing SLO, and what should replace it?

<details>
<summary>Answer</summary>

An average can be pulled down by a large volume of fast requests while completely hiding a long,
painful tail -- and it can even improve while the actual painful behavior stays exactly the same or
worsens. p95/p99 percentiles, plus jitter (the run-to-run variation between consecutive
measurements), actually reflect what the worst commonly-experienced requests feel like.

</details>

**Q24 (co-24 -- firewalls and mTLS).** How does a stateful firewall decide to permit an inbound reply
packet without an explicit rule allowing that inbound traffic?

<details>
<summary>Answer</summary>

It matches the packet against a connection-tracking table entry created when the ORIGINAL outbound
packet was permitted -- a reply belonging to an already-established, permitted connection is allowed
through automatically, with no separate inbound rule required for it.

</details>

**Q25 (co-25 -- VPN tunnels and overlays).** What's the practical difference between split tunneling
and full tunneling?

<details>
<summary>Answer</summary>

Split tunneling routes only specific subnets through the VPN, leaving everything else on the normal
default route. Full tunneling routes ALL traffic (`0.0.0.0/0`) through the VPN, which needs extra
routing-table and firewall-rule plumbing so the tunnel's own traffic (to the VPN server's real
endpoint) doesn't get routed back into itself.

</details>

**Q26 (co-26 -- WireGuard).** What two jobs does a single WireGuard `AllowedIPs` entry do at once?

<details>
<summary>Answer</summary>

It's simultaneously a crypto-routing rule (only a packet whose SOURCE matches `AllowedIPs` is
accepted as genuinely coming from that peer) and a routing-table entry (an outbound packet to that
DESTINATION gets encrypted and sent to that peer) -- one line does both the authentication-boundary
job and the routing job.

</details>

**Q27 (co-27 -- IPsec vs. OpenVPN vs. WireGuard).** What's the core trade-off separating WireGuard's
minimal codebase from IPsec's much larger one?

<details>
<summary>Answer</summary>

WireGuard fixes ONE modern cryptographic suite with no negotiation and a minimal config surface,
dramatically shrinking both the audit surface and the attack surface at the cost of configurability.
IPsec/IKE supports many negotiable cipher suites and modes for broad, decades-long interoperability,
at the cost of a much larger, harder-to-audit codebase.

</details>

**Q28 (co-28 -- NAT traversal and keepalive).** Why does a peer behind NAT need to send periodic
keepalive packets even with zero application data to send?

<details>
<summary>Answer</summary>

A NAT gateway's translation-table entry for that flow has an idle timeout. Without periodic traffic,
the mapping expires and the gateway silently stops forwarding return traffic to that peer -- breaking
the tunnel until a fresh outbound packet re-creates the mapping (often on a different public port).

</details>

**Q29 (co-29 -- mesh overlay VPNs).** What's the structural difference between Tailscale/Headscale's
coordination model and Nebula's?

<details>
<summary>Answer</summary>

Tailscale (and self-hosted Headscale) use a central coordination server that exchanges public keys
and current endpoint info between nodes, and can relay traffic (DERP) when a direct path fails.
Nebula instead uses signed host certificates plus one or more "lighthouse" nodes that only help peers
discover each other's current IP -- trust is rooted in a certificate authority rather than in an
always-available coordination service.

</details>

## Applied problems

Fifteen scenarios spanning addressing through VPN/overlay design. Each describes a realistic
situation without naming the specific concept -- decide what applies and why, then check your
reasoning against the worked solution. Every scenario below is invented for this drill and does not
reuse any host, address, or fixture from the 62 worked examples.

**AP1.** A mobile team reports that image uploads to their API complete quickly on Wi-Fi but stall
for 200-500ms exactly once per request on cellular, then finish instantly. A packet capture shows the
stall is a single gap between two small writes. What's happening, and what's the fix?

<details>
<summary>Worked solution</summary>

Nagle's algorithm and delayed ACK interacting (co-10) -- each small write waits hoping to coalesce
with more data, and each side's delayed ACK is waiting on the other, so nothing moves until delayed
ACK's own timer fires. The fix is setting `TCP_NODELAY` (co-11) on the upload socket so small writes
go out immediately.

</details>

**AP2.** A company rotates its DNSSEC signing key, and shortly afterward external users start
getting `SERVFAIL` when resolving the company's domain through public validating resolvers -- but
employees using the internal, non-validating resolver see no problem at all.

<details>
<summary>Worked solution</summary>

A broken DNSSEC chain of trust (co-13) -- the new `DNSKEY` was rotated in the zone, but the
corresponding `DS` record in the parent zone wasn't updated to match. A validating resolver's
signature check fails and it returns `SERVFAIL`; a non-validating resolver skips DNSSEC verification
entirely and keeps answering normally, which is exactly why the internal resolver hides the problem.

</details>

**AP3.** Two hosts configured with addresses in the same subnet can't reach each other on the same
physical switch. Host A's ARP table shows no entry at all for host B's IP, even after several
attempts.

<details>
<summary>Worked solution</summary>

An ARP resolution failure (co-02) -- most likely because the two hosts are actually on different
broadcast domains (e.g. different VLANs) despite having addresses that LOOK like the same subnet.
Host A's ARP broadcast never reaches host B, so no MAC address is ever learned, and no frame can be
addressed to it.

</details>

**AP4.** After a user's phone switches from Wi-Fi to cellular mid-call, their video call doesn't even
hiccup, but a peer-to-peer file transfer running at the same time drops immediately and must be
manually restarted.

<details>
<summary>Worked solution</summary>

The video call is almost certainly running over QUIC (co-16), whose connection ID lets it survive a
network/IP change via connection migration with no new handshake. The file transfer is plain TCP,
whose connection is identified by the 4-tuple (including source IP) -- the IP change makes every
in-flight packet look like it belongs to a connection that no longer exists.

</details>

**AP5.** Two internal microservices connect fine and exchange data normally, but production logs show
a "connection reset" on that same connection every few minutes during low-traffic periods, even
though nothing changed on either service.

<details>
<summary>Worked solution</summary>

An idle NAT/firewall connection-tracking timeout (co-06, co-28) -- if the connection sits idle longer
than the NAT gateway's or firewall's translation-table timeout, the entry is evicted, and a later
packet on that "dead" mapping gets reset or silently dropped. The fix is enabling TCP keepalive (or
an application-level ping) that fires more often than the idle timeout.

</details>

**AP6.** An ops team wants to load-balance a raw TCP database-replication stream across two
standbys, but their existing load balancer terminates TLS to inspect HTTP headers for routing and
can't be pointed at this non-HTTP protocol at all.

<details>
<summary>Worked solution</summary>

They need an L4 load balancer (co-19), not their existing L7 one -- L7 routing decisions depend on
application content (HTTP headers/paths) that simply doesn't exist in a raw, non-HTTP TCP stream. L4
routes purely on IP/port and has no such dependency.

</details>

**AP7.** A team deploys a critical bug fix to their website, confirms the origin server is serving
the fixed content immediately via a direct request, but users behind the CDN keep seeing the old,
broken version for up to an hour afterward.

<details>
<summary>Worked solution</summary>

The CDN's edge cache (co-20) is still serving a cached copy of the old response until its TTL
expires -- the origin being fixed doesn't retroactively invalidate what's already cached at the edge.
The fix is either a cache purge/invalidation on deploy, or a shorter TTL for content that changes on
deploy.

</details>

**AP8.** A security engineer needs to prove that a recent firewall rule change didn't accidentally
start permitting an entirely new class of inbound connection, without trusting the rule file alone.

<details>
<summary>Worked solution</summary>

Capture live traffic with a BPF filter (co-22) isolating just SYN packets destined for the supposedly
restricted port (`tcp[13] & 2 != 0 and dst port N`), and confirm the actual observed sources match
the intended policy -- verifying the stateful firewall's (co-24) real, live behavior instead of only
reading the config that's supposed to produce it.

</details>

**AP9.** A latency dashboard shows p50 = 12ms and looks excellent, but customer complaints about "the
app feels laggy" keep arriving anyway.

<details>
<summary>Worked solution</summary>

p50 hides exactly the tail the complaints are about (co-23) -- check p95/p99 and jitter instead. A
low median with a heavy or highly variable tail is precisely what a human perceives as "laggy," even
while the median-based dashboard looks fine.

</details>

**AP10.** Remote engineers connect to the office over a WireGuard VPN to reach internal services, and
afterward report that their unrelated video-conferencing app also got noticeably slower and now
appears to be routing through the office network.

<details>
<summary>Worked solution</summary>

A full-tunnel `AllowedIPs = 0.0.0.0/0` (co-25, co-26) is routing ALL traffic -- including completely
unrelated internet traffic -- through the tunnel and out through the office's own internet
connection. The fix is switching to split tunneling, limiting `AllowedIPs` to only the internal
subnets that actually need to traverse the VPN.

</details>

**AP11.** A security review flags a WebSocket server for accepting every incoming upgrade request
without checking the `Origin` header at all.

<details>
<summary>Worked solution</summary>

A cross-site WebSocket hijacking risk (co-17) -- unlike `fetch`/XHR, browsers don't enforce
same-origin restrictions on WebSocket connections by default, so any page from any origin can open a
WebSocket to this server and the server has no way to distinguish a legitimate client from an
attacker's page unless it explicitly validates the `Origin` header itself.

</details>

**AP12.** Two teams debate whether a "you have 3 new messages" notification feature needs WebSockets
or Server-Sent Events, given that the feature only ever flows server -> client, with nothing needed in
the other direction on that channel.

<details>
<summary>Worked solution</summary>

SSE (co-17) is the right, simpler fit -- the feature's actual data-flow need is purely one-way, and
SSE runs over plain HTTP infrastructure with automatic reconnection built in. A WebSocket's
full-duplex capability would sit entirely unused, adding complexity (a separate upgrade protocol, a
different proxy/load-balancer configuration story) with no corresponding benefit for this feature.

</details>

**AP13.** A startup wants to connect several hundred IoT devices, each behind a different, often
dynamically-assigned NAT, and is evaluating whether plain WireGuard alone is sufficient.

<details>
<summary>Worked solution</summary>

Plain WireGuard (co-26) requires each `[Peer]` entry to reference a KNOWN endpoint -- it has no
concept of dynamic peer discovery, key distribution, or NAT-traversal coordination built in. At the
scale of hundreds of dynamically-NATed devices, that manual-config model doesn't scale; a mesh
overlay platform (co-29) adds exactly the coordination-plane layer (automatic key exchange, live
endpoint discovery, relay fallback) that plain WireGuard deliberately leaves out.

</details>

**AP14.** A compliance requirement states that an internal payment API must only accept connections
from services that can cryptographically PROVE their own identity, not just connections that
originate from a trusted network location.

<details>
<summary>Worked solution</summary>

Mutual TLS (co-24) -- ordinary TLS only proves the SERVER's identity to the client. mTLS additionally
requires the CLIENT to present its own certificate, which the server verifies before accepting the
connection, which is exactly what "prove your own identity via certificate, not via network location
alone" requires.

</details>

**AP15.** An engineer chooses IPsec for a new site-to-site link "because it's the industry standard,"
but the two sites' router vendors turn out to interoperate poorly, and debugging the resulting
handshake failures costs the team weeks.

<details>
<summary>Worked solution</summary>

The exact trade-off co-27 names explicitly -- IPsec's broad configurability (many negotiable cipher
suites and IKE modes) is precisely what creates cross-vendor interoperability gaps, since two
implementations can each be "spec-compliant" while still failing to agree on a common negotiated
mode. A fixed-suite protocol like WireGuard trades that same flexibility away specifically to avoid
this class of problem -- a real, common reason teams choose it over IPsec despite IPsec's longer
pedigree.

</details>

## Code katas

Ten self-contained exercises. Every kata runs on hand-constructed, in-memory data using only the
Python 3.13 standard library -- no live network, no external service, and no dependency on this
topic's own worked-example files. Where this topic's own examples needed a live kernel or root
privilege to demonstrate a real behavior, the kata below rebuilds that behavior as a deterministic
simulation instead, so every kata is runnable anywhere Python 3.13 is installed.

### Kata 1 -- Subnet calculator on a block of your own choosing

Pick a CIDR block other than any used in this topic's worked examples (e.g. `10.x.y.0/28`). By
hand, compute the network address, broadcast address, first/last usable host, and usable host count.
Then write a small Python function that computes the same four values from the prefix, and confirm
your hand math matches exactly (co-04).

### Kata 2 -- A toy sliding-window flow-control simulator

Implement a simulator with a fixed receive-window size (e.g. 4KB) and a stream of send requests of
your own choosing (varying sizes). Confirm the simulator never allows more than `window_size` bytes
of unacknowledged data outstanding at once, and that an ACK for the oldest unacknowledged bytes always
advances how much new data may be sent (co-08).

### Kata 3 -- Model the Nagle/delayed-ACK stall as a discrete-event timeline

Build a small state machine with two sides (sender, receiver), each independently choosing to "hold"
a small write/ACK for up to a fixed timeout unless a size or timer threshold is crossed. Run it with a
sequence of small writes of your own choosing and confirm the total simulated delay matches the sum of
each side's hold timeout when both are simultaneously "holding" (co-10).

### Kata 4 -- A DNS resolver cache with TTL countdown

Implement a mock resolver cache keyed by hostname, storing an answer plus a TTL. Confirm a lookup
within the TTL is served from cache with no "network" call, and that a lookup after the TTL expires
triggers a fresh "resolution" (a mocked referral-chain walk) and re-populates the cache with a new TTL
(co-12).

### Kata 5 -- Count the round trips: TLS 1.2 vs. TLS 1.3 vs. 0-RTT resumption

Model each handshake as a list of flights (each flight is one direction of travel), for three
handshake types of your own labeling. Confirm TLS 1.2's flight count implies 2 round trips, TLS 1.3's
implies 1, and a 0-RTT resumption implies application data can be sent in the very first flight
(co-14).

### Kata 6 -- Simulate HTTP/2 multiplexing vs. HTTP/1.1 queuing

Model 4 "requests" with different completion times of your own choosing, one deliberately slow.
Simulate HTTP/1.1's strict in-order delivery (nothing after the slow one can complete first) and
HTTP/2's interleaved delivery (faster ones complete out of order, independent of the slow one), and
confirm the two delivery orders differ (co-15, co-16).

### Kata 7 -- BPF filter construction against a written checklist

Write five BPF filter expressions of your own for five scenarios you invent (e.g. "only SYN packets
to port 443," "only ICMP from a specific host"). For each, write a small Python check confirming your
expression string contains the required substrings (protocol keyword, the right comparison operator,
the right field) -- a self-contained syntax/semantics check that doesn't require a live capture
(co-22).

### Kata 8 -- Latency percentiles and jitter on a sample you construct

Pick 10 latency values of your own choosing (not the sample this topic's own worked example used),
including at least one outlier. Compute p50/p95/p99 by hand using linear interpolation, and jitter as
the mean absolute difference between consecutive values. Confirm your Python implementation matches
your hand computation exactly (co-23).

### Kata 9 -- A WireGuard `AllowedIPs` crypto-routing matcher

Build a table mapping each of 3 peer public keys (any strings you choose) to an `AllowedIPs` list.
Write a function that, given a decrypted packet's claimed peer and its actual source IP, returns
whether that packet should be ACCEPTED (source matches that peer's `AllowedIPs`) or REJECTED (source
does not match) -- confirm it rejects at least one deliberately spoofed source you construct yourself
(co-26).

### Kata 10 -- A NAT table with idle-timeout eviction

Implement a toy NAT translation table keyed by (private IP, private port), each entry carrying a
"last seen" timestamp and a fixed idle timeout. Simulate a connection going quiet past the timeout,
confirm the entry is evicted, and confirm a subsequent packet on that same private IP/port creates a
NEW mapping (a different public port) rather than reusing the evicted one (co-06, co-28).

## Self-check checklist

Confirm each item without checking the learning track first. If you hesitate, that concept needs
another pass.

- [ ] I can explain what encapsulation does to a payload descending the stack and what happens in
      reverse ascending it. (co-01)
- [ ] I can explain why ARP is needed before a frame can be sent to another host on the same segment.
      (co-02)
- [ ] I can state IPv4's and IPv6's address sizes and notations, and the one rule governing `::`
      compression. (co-03)
- [ ] I can compute a `/N` block's usable host count and explain why it's 2 less than the raw block
      size. (co-04)
- [ ] I can explain why a default route always loses to a more specific matching route. (co-05)
- [ ] I can name the fields a NAT gateway rewrites and what it must remember to rewrite a reply
      correctly. (co-06)
- [ ] I can name the TCP handshake and teardown segments and which side ends up in `TIME_WAIT`.
      (co-07)
- [ ] I can explain what the TCP receive window advertises and why a sender must respect it. (co-08)
- [ ] I can explain what ends slow start and how congestion avoidance's growth rate differs from it.
      (co-09)
- [ ] I can explain how Nagle and delayed ACK can combine into a visible stall. (co-10)
- [ ] I can explain what `TCP_NODELAY` does and how a nonblocking socket's `recv()` differs from a
      blocking one's. (co-11)
- [ ] I can walk the referral chain a recursive resolver follows on a cold cache miss. (co-12)
- [ ] I can explain what an `RRSIG` proves and where the DNSSEC chain of trust anchors. (co-13)
- [ ] I can explain why TLS 1.3 completes in 1-RTT where TLS 1.2 needed 2-RTT. (co-14)
- [ ] I can explain what problem HTTP/2 multiplexing solves that HTTP/1.1 pipelining could not.
      (co-15)
- [ ] I can explain why QUIC avoids the head-of-line blocking that TCP-based HTTP/2 still has.
      (co-16)
- [ ] I can state the fundamental directional difference between a WebSocket and an SSE stream.
      (co-17)
- [ ] I can explain how WebTransport's relationship to QUIC differs from WebRTC's peer-to-peer model.
      (co-18)
- [ ] I can explain what an L7 load balancer can route on that an L4 load balancer structurally
      cannot. (co-19)
- [ ] I can explain the structural relationship between a CDN and a reverse proxy. (co-20)
- [ ] I can explain what a Linux network namespace isolates. (co-21)
- [ ] I can name at least three kinds of things a BPF filter expression can match beyond host and
      port. (co-22)
- [ ] I can explain why a single average latency number is misleading for a user-facing SLO. (co-23)
- [ ] I can explain how a stateful firewall permits a reply packet without an explicit inbound rule.
      (co-24)
- [ ] I can explain the practical difference between split tunneling and full tunneling. (co-25)
- [ ] I can explain the two jobs a single WireGuard `AllowedIPs` entry does at once. (co-26)
- [ ] I can state the core trade-off separating WireGuard's codebase size from IPsec's. (co-27)
- [ ] I can explain why a peer behind NAT needs periodic keepalive traffic even with nothing to send.
      (co-28)
- [ ] I can explain the structural difference between Tailscale/Headscale's coordination model and
      Nebula's. (co-29)

## Elaborative interrogation & self-explanation

Ten why/why-not prompts. Answer in your own words before checking -- the goal is explaining the
reasoning, not reciting a definition. All ten trace back to this topic's cross-cutting big ideas,
`layering-and-leaks` and `consistency-latency-throughput`: nearly every mechanism in this topic is
either one layer quietly compensating for a limitation in the layer next to it, or a trade among
consistency of behavior, latency, and throughput -- naming which one explicitly is what turns "this
happens to work" into a defensible engineering decision.

**W1.** Why does this topic insist Nagle and delayed ACK be understood as two INDEPENDENTLY
reasonable optimizations interacting badly, rather than either one simply being "wrong"?

<details>
<summary>Answer</summary>

Each optimization is locally sound on its own side of the connection -- Nagle reduces the sender's
small-packet overhead, delayed ACK reduces the receiver's ACK-traffic overhead. Neither is a bug in
isolation. The stall is a `layering-and-leaks` instance: a behavior that's invisible and reasonable
within one side's own logic leaks into a user-visible pathology only once you look at the
INTERACTION across the send/receive boundary, which is exactly why the fix (`TCP_NODELAY`) targets
the interaction, not either side's individual logic.

</details>

**W2.** Why does this topic treat NAT (co-06) and a stateful firewall (co-24) as needing almost
identical connection-tracking machinery, even though they solve different problems?

<details>
<summary>Answer</summary>

Both need to remember a prior packet of a flow to correctly treat a LATER packet -- NAT needs it to
translate a reply's destination address back correctly; a stateful firewall needs it to decide a
reply is allowed through without a separate inbound rule. The same state-table pattern, invented to
solve one problem, turns out to be the exact mechanism another problem also needs -- a
`layering-and-leaks` case where a technique's structure outlives the specific problem it was first
built for.

</details>

**W3.** Why is "TCP guarantees reliable, in-order delivery" not a satisfying explanation for why
HTTP/2 (co-15) still suffers head-of-line blocking despite multiplexing streams?

<details>
<summary>Answer</summary>

TCP's ordering guarantee applies to the ONE underlying byte stream, not to each application-level
HTTP/2 stream individually. HTTP/2's multiplexing is a layer ABOVE TCP, interleaving multiple logical
streams onto that single ordered byte stream -- so one lost TCP segment still blocks delivery of
EVERYTHING behind it in that byte stream, regardless of which HTTP/2 stream the data belonged to.
QUIC (co-16) fixes this specifically by moving stream-level loss recovery DOWN into the transport
itself, where each stream's ordering is genuinely independent.

</details>

**W4.** Why does moving from split tunnel to full tunnel (co-25) require touching routing tables,
firewall rules, AND (on Linux) fwmark/sysctl settings, instead of just changing one `AllowedIPs`
line?

<details>
<summary>Answer</summary>

"Route everything through the tunnel" creates a bootstrapping problem: the tunnel's OWN traffic (to
the VPN server's real, outside-the-tunnel endpoint) must NOT itself be routed back into the tunnel,
or the connection recurses into itself and never actually reaches the server. A plain routing table
can't express that one specific exception cleanly on its own, so policy routing (a separate routing
table) plus a firewall mark (to tag the tunnel's own packets for the exception) is needed to carve
that traffic out of the "route everything" rule -- a `consistency-latency-throughput` cost paid for
the convenience of "everything just goes through the tunnel."

</details>

**W5.** Why is average latency actively worse than useless for a user-facing SLO, not just "less
precise" than a percentile?

<details>
<summary>Answer</summary>

An average can move in the OPPOSITE direction of the actual painful behavior -- adding a large volume
of fast, cheap requests lowers the average even while the slow tail that's causing complaints stays
exactly the same or worsens. That's not merely imprecise, it's actively misleading: a dashboard that
looks like it's improving while the thing users are complaining about hasn't changed at all. p95/p99
plus jitter (co-23) are needed because they specifically describe the tail, which is the part of the
distribution average latency structurally cannot see.

</details>

**W6.** Why does this topic frame TLS 1.3 (co-14) and QUIC (co-16) as the SAME design lesson learned
twice, rather than two unrelated protocol redesigns?

<details>
<summary>Answer</summary>

Both were redesigned specifically to collapse the number of round trips their predecessor needed
before useful data could flow -- TLS 1.2's 2-RTT became TLS 1.3's 1-RTT (or 0-RTT on resumption); the
combined TCP-plus-TLS handshake latency HTTP/2 still pays became QUIC's integrated single handshake.
The shared lesson, a `consistency-latency-throughput` insight: on most real-world links, ROUND TRIPS
dominate perceived latency far more than raw bandwidth does, so both protocols attack the same
bottleneck by restructuring WHEN cryptographic material is exchanged relative to the handshake's
first flight.

</details>

**W7.** Why does this topic insist a mesh overlay VPN (co-29) is not simply "WireGuard with extra
steps"?

<details>
<summary>Answer</summary>

WireGuard's own protocol has no concept of peer discovery, key distribution, or NAT-traversal
coordination at all -- every `[Peer]` entry is manually configured with a known endpoint by design. A
mesh overlay adds an entire coordination plane (or, for Nebula, a certificate-based PKI plus
lighthouse nodes) that WireGuard deliberately leaves out of scope. The mesh layer solves a genuinely
different problem -- dynamic peer discovery at scale -- than WireGuard's own minimal, static-config
design goal, which is exactly why Tailscale and Nebula still exist as separate projects layered on
top of (or alongside) a WireGuard-style data plane rather than being folded into WireGuard itself.

</details>

**W8.** Why does choosing WireGuard over IPsec (co-27) trade away exactly the property that made
IPsec the safe "standard" choice for years?

<details>
<summary>Answer</summary>

IPsec's configurability -- many negotiable cipher suites and IKE modes -- is precisely what let it
interoperate across decades of vendor equipment and evolving cryptographic recommendations without a
full protocol rewrite. WireGuard's fixed, unnegotiated modern cryptographic suite achieves a
dramatically smaller audit and attack surface specifically BY giving up that same negotiability. It's
a genuine `consistency-latency-throughput`-style trade, not a strict improvement -- less
configurability in exchange for a codebase small enough to actually audit line by line.

</details>

**W9.** Why does an L7 load balancer's extra routing power (co-19) come at the structural cost of
TLS termination, and why does that matter for a security review?

<details>
<summary>Answer</summary>

To inspect HTTP path, header, or cookie content for a routing decision, an L7 load balancer must
first decrypt TLS -- there is no way to read encrypted application content without terminating the
encryption first. That necessarily means the load balancer sees plaintext application traffic and
must re-encrypt (or forward in the clear) to the backend, expanding the trust boundary and the number
of places sensitive data exists unencrypted. An L4 load balancer, blind to application content by
construction, structurally cannot become that kind of trust boundary at all -- the extra routing
power and the extra trust exposure are the same trade-off, not two separate design choices.

</details>

**W10.** Why does the topic call `PersistentKeepalive` (co-28) "refreshing a NAT mapping with zero
application traffic" instead of just calling it "a heartbeat"?

<details>
<summary>Answer</summary>

Calling it a heartbeat implies an application-level liveness check -- but its actual job is narrower
and purely infrastructural: it exists ONLY to keep a NAT or firewall's translation-table entry from
expiring due to idle timeout, is completely invisible to the application layer, and (as this topic's
own live capture showed) does not even reset WireGuard's own handshake state the way a fresh
handshake would -- the byte counters increment while the handshake timestamp stays fixed. Conflating
it with an application heartbeat misses that it's solving the exact same co-06/co-24-style
connection-tracking state-table problem this topic keeps returning to, not a liveness problem at all.

</details>

---

← Previous: [Capstone](../learning/capstone/overview.md) &middot; Next: [30 ·
Software Engineering Practices Learning Overview](../../software-engineering-practices/learning/overview.md) →
