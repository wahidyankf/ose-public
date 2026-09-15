---
title: "Capstone Analysis"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 2
---

Capstone Step 3's written deliverable: a real `traceroute` to `example.com`, and a real `tcpdump`
capture of one HTTPS request to the same host, each annotated hop by hop and packet by packet, and
tied back to a specific layer of the model this whole topic has been building since Example 1.

## Part A: `traceroute` -- the Network-layer path

```bash
traceroute -m 15 -w 1 example.com
```

**Run**: on this sandbox's macOS host directly (real network path, real routers, no fabrication)

**Output** (the private-range hop addresses are masked, for example `192.168.x.1`; the rest of the capture is verbatim):

```text
traceroute: Warning: example.com has multiple addresses; using 104.20.23.154
traceroute to example.com (104.20.23.154), 15 hops max, 40 byte packets
 1  192.168.x.1 (192.168.x.1)  118.369 ms  3.284 ms  1.616 ms
 2  192.168.y.1 (192.168.y.1)  4.682 ms  138.590 ms  4.476 ms
 3  192.168.z.1 (192.168.z.1)  6.652 ms  6.366 ms  6.493 ms
 4  10.x.y.1 (10.x.y.1)  7.859 ms  10.020 ms  7.670 ms
 5  180.252.1.101 (180.252.1.101)  7.980 ms  7.394 ms  6.711 ms
 6  * * *
 7  10.x.z.5 (10.x.z.5)  6.750 ms  6.412 ms  6.618 ms
 8  180.240.190.77 (180.240.190.77)  19.519 ms  22.740 ms  27.581 ms
 9  180.240.190.77 (180.240.190.77)  22.043 ms  20.925 ms  28.263 ms
10  180.240.190.229 (180.240.190.229)  20.472 ms  20.840 ms *
11  180.240.191.165 (180.240.191.165)  21.457 ms  24.367 ms  22.600 ms
12  172.69.117.60 (172.69.117.60)  21.578 ms  21.793 ms  21.916 ms
13  172.69.117.81 (172.69.117.81)  22.929 ms
    172.69.117.73 (172.69.117.73)  23.973 ms
    172.69.117.59 (172.69.117.59)  25.390 ms
14  104.20.23.154 (104.20.23.154)  21.978 ms  20.458 ms  21.998 ms
```

### Hop-by-hop annotation

| Hop   | Address                                         | Layer tied to            | What it is                                                                                                                                                                                                                                                                                                                    |
| ----- | ----------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `192.168.x.1`                                   | Network (routing, co-05) | The local LAN's own gateway -- an RFC 1918 private address (co-06's classification), the first router any packet leaving this machine passes through.                                                                                                                                                                         |
| 2-3   | `192.168.y.1`, `192.168.z.1`                    | Network                  | Two MORE private-range hops -- a nested/double-NAT setup (a second router, or a local ISP modem/router boundary) before traffic even leaves the premises.                                                                                                                                                                     |
| 4     | `10.x.y.1`                                      | Network                  | The FIRST hop inside the ISP's own network -- ISPs commonly number internal backbone routers from the private `10/8` range (co-06), never exposing them as public addresses.                                                                                                                                                  |
| 5     | `180.252.1.101`                                 | Network                  | The first genuinely PUBLIC address in the path -- the point where traffic actually leaves the ISP's private internal addressing and becomes globally routable.                                                                                                                                                                |
| 6     | `* * *`                                         | Network                  | A hop that never replied within the 1-second timeout -- most commonly a router configured to not send ICMP Time-Exceeded replies, or one that deprioritizes/rate-limits them; NOT necessarily packet loss on the actual forwarding path (the NEXT hop still replied normally, proving traffic kept flowing through this hop). |
| 7     | `10.x.z.5`                                      | Network                  | Back to a PRIVATE address -- common on ISP backbones that use private addressing internally even for routers several hops deep, unrelated to hop 1-3's local-premises private addresses.                                                                                                                                      |
| 8-9   | `180.240.190.77` (twice)                        | Network                  | The SAME router answered for two consecutive TTL values -- happens when a router along the path doesn't decrement TTL in the way `traceroute` expects, or a load-balanced path briefly converges back onto the same device.                                                                                                   |
| 10-11 | `180.240.190.229`, `180.240.191.165`            | Network                  | Two more ISP backbone hops, continuing to move traffic toward the public internet's edge.                                                                                                                                                                                                                                     |
| 12    | `172.69.117.60`                                 | Network                  | The FIRST Cloudflare-owned address in the path (`172.69.0.0/16` is a known Cloudflare anycast range) -- traffic has now reached the CDN's own edge network (co-20).                                                                                                                                                           |
| 13    | THREE different addresses (`.81`, `.73`, `.59`) | Network                  | Each of the 3 probe packets for this ONE hop landed on a DIFFERENT Cloudflare edge node -- anycast routing and ECMP (equal-cost multi-path) load-balancing can send consecutive packets down slightly different paths, which is completely normal this close to an anycast destination.                                       |
| 14    | `104.20.23.154`                                 | Network (destination)    | The actual destination -- `example.com`'s own Cloudflare-fronted address, matching Example 1's own resolved IP.                                                                                                                                                                                                               |

**Key takeaway**: `traceroute` reveals THREE distinct addressing zones in one path -- this machine's
own local-premises private addresses (hops 1-3), the ISP's internal private backbone addressing
(hops 4, 7), and the public internet plus Cloudflare's anycast edge (hops 5, 8-14) -- each hop is
purely a Network-layer (co-01) observation; nothing here says anything about TCP, TLS, or HTTP,
which is exactly `tcpdump`'s job in Part B.

## Part B: `tcpdump` -- the Transport/TLS/Application-layer conversation

```bash
tcpdump -i eth0 -n 'host 172.66.147.243 and port 443' -c 10
```

**Run**: inside the same Debian Linux container (`python:3.13-slim` + `tcpdump`, `NET_ADMIN`/
`NET_RAW`) this topic's other root-requiring captures used, with a concurrent `curl -s
--resolve example.com:443:172.66.147.243 https://example.com` generating the matching traffic

**Output**:

```text
tcpdump: verbose output suppressed, use -v[v]... for full protocol decode
listening on eth0, link-type EN10MB (Ethernet), snapshot length 262144 bytes
01:40:31.546526 IP 192.0.2.10.41532 > 172.66.147.243.443: Flags [S], seq 3587269151, win 65495, options [mss 65495,sackOK,TS val 2643719913 ecr 0,nop,wscale 7], length 0
01:40:31.574510 IP 172.66.147.243.443 > 192.0.2.10.41532: Flags [S.], seq 614929774, ack 3587269152, win 65408, options [mss 65495,sackOK,TS val 3821377356 ecr 2643719913,nop,wscale 7], length 0
01:40:31.574548 IP 192.0.2.10.41532 > 172.66.147.243.443: Flags [.], ack 1, win 512, options [nop,nop,TS val 2643719941 ecr 3821377356], length 0
01:40:31.577197 IP 192.0.2.10.41532 > 172.66.147.243.443: Flags [P.], seq 1:1569, ack 1, win 512, options [nop,nop,TS val 2643719943 ecr 3821377356], length 1568
01:40:31.577651 IP 172.66.147.243.443 > 192.0.2.10.41532: Flags [.], ack 1569, win 4083, options [nop,nop,TS val 3821377359 ecr 2643719943], length 0
01:40:31.599803 IP 172.66.147.243.443 > 192.0.2.10.41532: Flags [P.], seq 1:5087, ack 1569, win 4096, options [nop,nop,TS val 3821377381 ecr 2643719943], length 5086
01:40:31.599836 IP 192.0.2.10.41532 > 172.66.147.243.443: Flags [.], ack 5087, win 509, options [nop,nop,TS val 2643719966 ecr 3821377381], length 0
01:40:31.602150 IP 192.0.2.10.41532 > 172.66.147.243.443: Flags [P.], seq 1569:1649, ack 5087, win 512, options [nop,nop,TS val 2643719968 ecr 3821377381], length 80
01:40:31.602247 IP 192.0.2.10.41532 > 172.66.147.243.443: Flags [P.], seq 1649:1746, ack 5087, win 512, options [nop,nop,TS val 2643719968 ecr 3821377381], length 97
01:40:31.602336 IP 172.66.147.243.443 > 192.0.2.10.41532: Flags [.], ack 1649, win 4095, options [nop,nop,TS val 3821377384 ecr 2643719968], length 0
```

### Packet-by-packet annotation

| #   | Time (offset) | Flags / length   | Layer tied to             | What it is                                                                                                                                                                                                                                                |
| --- | ------------- | ---------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | +0ms          | `[S]`, len 0     | Transport (co-07)         | Client's SYN -- opens the TCP three-way handshake. `wscale 7` (Example 17) is negotiated here, in the SYN, the only place it can be.                                                                                                                      |
| 2   | +28ms         | `[S.]`, len 0    | Transport (co-07)         | Server's SYN-ACK -- acknowledges the client's SYN and sends its own.                                                                                                                                                                                      |
| 3   | +28ms         | `[.]`, len 0     | Transport (co-07)         | Client's final ACK -- the three-way handshake is now complete; the connection is `ESTAB` (Example 15).                                                                                                                                                    |
| 4   | +31ms         | `[P.]`, len 1568 | TLS (co-14)               | Client's `ClientHello` -- 1568 bytes is large because TLS 1.3's `ClientHello` carries the full supported-cipher-suite list, the `KeyShare` extension, and SNI, all in this ONE flight (Example 31's flight 1).                                            |
| 5   | +31ms         | `[.]`, len 0     | Transport                 | Server ACKs the `ClientHello`'s bytes -- a plain TCP-level acknowledgment, not yet a TLS response.                                                                                                                                                        |
| 6   | +53ms         | `[P.]`, len 5086 | TLS (co-14)               | Server's `ServerHello` + `Certificate` + `CertificateVerify` + `Finished`, ALL together -- exactly Example 31's flight 2, and why it is the largest single packet in this capture (the certificate chain alone is several KB).                            |
| 7   | +53ms         | `[.]`, len 0     | Transport                 | Client ACKs that large flight's bytes.                                                                                                                                                                                                                    |
| 8   | +56ms         | `[P.]`, len 80   | TLS (co-14)               | Client's own `Finished` message -- small, since it is just a MAC over the handshake transcript, not new key material -- completing Example 31's flight 3 and finishing the TLS 1.3 handshake.                                                             |
| 9   | +56ms         | `[P.]`, len 97   | Application (co-01, HTTP) | The actual HTTP `GET / HTTP/1.1` request -- riding inside a TLS record, so `tcpdump` (without decryption) can only see its ENCRYPTED length, not its plaintext content; this is Capstone Step 2's own `[HTTP]` stage, happening here at the packet level. |
| 10  | +56ms         | `[.]`, len 0     | Transport                 | Server ACKs the encrypted HTTP request's bytes -- the capture was cut at 10 packets here; the server's own encrypted HTTP response (`HTTP/1.1 200 OK`) would follow immediately after.                                                                    |

**Key takeaway**: packets 1-3 are pure Transport layer (TCP's own handshake, co-07); packets 4-8 are
TLS (co-14) -- visible ONLY as opaque encrypted byte lengths, never plaintext, since this capture had
no decryption key; packet 9 is the Application layer's own HTTP request, likewise encrypted and
opaque to `tcpdump`. Every packet in this 56-millisecond capture maps to exactly one layer, and the
SEQUENCE (TCP, then TLS, then HTTP) matches Capstone Step 2's own measured `trace.py` timeline
exactly.

**Why it matters**: this is the concrete proof the model this entire topic has argued for actually
holds against a real capture -- nothing here is asserted from a textbook diagram; every packet's
byte length, flag combination, and position in the sequence was captured live and independently
matches what co-01's layering, co-07's handshake, and co-14's TLS 1.3 flight structure all predict.
That match -- theory correctly predicting a live, unstaged capture -- is this capstone's actual
deliverable.

---

← Previous: [Capstone Overview](./overview.md) &middot; Next: [Drilling](../../drilling/overview.md) →
