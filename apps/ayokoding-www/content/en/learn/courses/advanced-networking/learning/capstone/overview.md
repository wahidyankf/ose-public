---
title: "Capstone"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 1
---

## The capstone: a networking diagnostics toolkit and report

The capstone assembles three ordered deliverables into one small diagnostics toolkit: a CIDR
calculator validated against hand math (co-04), a script that traces and narrates a real request's
full DNS-to-HTTP timeline (co-01, co-07, co-14), and a written analysis of captured `traceroute` and
`tcpdump` output tying every observed hop/packet back to a layer (co-01, co-05, co-22, co-23). Every
script lives under `learning/capstone/code/`, standard-library-only, fully type-annotated (DD-39),
and was actually run to capture the output shown below.

## Concepts exercised

- [x] CIDR/subnet arithmetic -- hosts/gateway/broadcast (co-04) -- `subnet.py`'s `compute_subnet()`,
      verified against three hand-computed prefixes in Step 1
- [x] the layered model applied to a real packet (co-01) -- every stage `trace.py` measures (Step 2)
      and every hop/packet `analysis.md` annotates (Step 3) is tied back to exactly one layer
- [x] TCP handshake + TLS 1.3 handshake narrated (co-07, co-14) -- `trace.py`'s `connect_tcp()` and
      `handshake_tls()` stages (Step 2), cross-checked against `analysis.md`'s own packet-by-packet
      `tcpdump` annotation (Part B)
- [x] reading `traceroute`/`tcpdump` output (co-05, co-22) -- `analysis.md`'s hop-by-hop `traceroute`
      table (Part A) and packet-by-packet `tcpdump` table (Part B)
- [x] latency vs bandwidth vs throughput reasoning (co-23) -- `trace.py`'s per-stage elapsed-time
      breakdown (Step 2's `[DNS]`/`[TCP]`/`[TLS]`/`[HTTP]` timings) and `analysis.md`'s per-hop and
      per-packet millisecond offsets (Parts A and B)

---

## Step 1: `subnet.py` -- a CIDR subnet calculator

**Context**: Example 8 (Beginner tier) introduced this exact bit-arithmetic shape for one pair of
CIDR blocks. This capstone step re-verifies the identical technique against THREE fresh,
hand-computed prefixes -- proof the calculator generalizes, not a narrow fit to two specific inputs.

```python
# learning/capstone/code/subnet.py
"""Capstone Step 1: a CIDR subnet calculator -- network/broadcast/host-range/host-count.

Ties together co-01 (encapsulation-adjacent addressing groundwork) and co-04 (CIDR and subnetting)
into one small, reusable module -- the same bit-arithmetic shape Example 8's `subnet.py` introduced,
now re-verified against THREE fresh, hand-computed CIDR blocks the beginner tier never used.
"""  # => co-04: this file's own restated purpose, doubling as its module __doc__
# => co-04: no runtime output beyond setting __doc__ -- the three paragraphs above just orient the reader

from __future__ import annotations  # => DD-39 hygiene: postpones type-annotation evaluation, keeping this file interpreter-version-agnostic

import ipaddress  # => co-04: stdlib IPv4Network -- used ONLY to turn one block's hand-computed offsets into expected addresses, never by the calculator itself
from dataclasses import dataclass  # => co-04: a typed record beats a bare tuple for this multi-field CIDR report


@dataclass(frozen=True)  # => co-04: frozen -- a computed subnet report is a VALUE, never mutated after construction
class SubnetReport:  # => co-04: everything co-04 says is arithmetically derivable from a CIDR block, in one record
    cidr: str  # => co-04: the original input, e.g. "203.0.113.0/28" -- kept for readable reporting
    network_address: str  # => co-04: the ALL-HOST-BITS-ZERO address -- identifies the subnet itself, not a host
    broadcast_address: str  # => co-04: the ALL-HOST-BITS-ONE address -- reaches every host on the subnet at once
    first_host: str  # => co-04: network_address + 1 -- the first USABLE host address
    last_host: str  # => co-04: broadcast_address - 1 -- the last USABLE host address
    host_count: int  # => co-04: usable hosts = 2**host_bits - 2 (network and broadcast are never assignable)


def ip_to_int(address: str) -> int:  # => co-04: dotted-decimal -> one 32-bit integer -- makes bitwise math possible
    """Pack a dotted-decimal IPv4 address into a single 32-bit integer."""  # => co-04: documents ip_to_int's contract -- no runtime output, just sets its __doc__
    octets = [int(part) for part in address.split(".")]  # => co-04: 4 decimal octets, each 0-255
    value = 0  # => co-04: accumulator -- built up one octet at a time, most-significant first
    for octet in octets:  # => co-04: process octets in address order (leftmost = most significant)
        value = (value << 8) | octet  # => co-04: shift the accumulator left 8 bits, then OR in the next octet
    return value  # => co-04: returns this computed value to the caller


def int_to_ip(value: int) -> str:  # => co-04: the EXACT inverse of ip_to_int -- one 32-bit integer -> dotted-decimal
    """Unpack a 32-bit integer back into dotted-decimal IPv4 notation."""  # => co-04: documents int_to_ip's contract -- no runtime output, just sets its __doc__
    octets = [(value >> shift) & 0xFF for shift in (24, 16, 8, 0)]  # => co-04: extract each byte, most-significant first
    return ".".join(str(octet) for octet in octets)  # => co-04: rejoin with "." -- the dotted-decimal separator


def compute_subnet(cidr: str) -> SubnetReport:  # => co-04: the calculator itself -- "203.0.113.0/28" -> a full SubnetReport
    """Compute network/broadcast/host-range/host-count for a CIDR block."""  # => co-04: documents compute_subnet's contract -- no runtime output, just sets its __doc__
    address_part, prefix_part = cidr.split("/")  # => co-04: split "203.0.113.0/28" into its address and prefix-length parts
    prefix_len = int(prefix_part)  # => co-04: the /N -- how many leading bits are the NETWORK portion
    host_bits = 32 - prefix_len  # => co-04: everything else is the HOST portion -- how many addresses this subnet spans
    address_int = ip_to_int(address_part)  # => co-04: the input address, as one 32-bit integer
    mask_int = ((1 << prefix_len) - 1) << host_bits if prefix_len > 0 else 0  # => co-04: N leading 1-bits, host_bits trailing 0-bits
    network_int = address_int & mask_int  # => co-04: AND with the mask clears every HOST bit -- this IS the network address
    broadcast_int = network_int | (~mask_int & 0xFFFFFFFF)  # => co-04: OR with the inverted mask sets every HOST bit to 1
    host_count = max((1 << host_bits) - 2, 0)  # => co-04: total addresses minus network and broadcast (never negative for /31, /32)
    return SubnetReport(  # => co-04: assembles every derived field into one immutable report
        cidr=cidr,  # => co-04: echoes the original input for the printed report
        network_address=int_to_ip(network_int),  # => co-04: converts the computed network integer back to dotted-decimal
        broadcast_address=int_to_ip(broadcast_int),  # => co-04: converts the computed broadcast integer back to dotted-decimal
        first_host=int_to_ip(network_int + 1),  # => co-04: one past the network address -- the first assignable host
        last_host=int_to_ip(broadcast_int - 1),  # => co-04: one before the broadcast address -- the last assignable host
        host_count=host_count,  # => co-04: the usable-host count derived above
    )  # => co-04: closes the multi-line construct opened above


if __name__ == "__main__":  # => co-04: entry point -- this block runs only when the file executes directly, not on import
    slash_20 = ipaddress.IPv4Network("172.16.0.0/20")  # => co-04: indexing a network by offset N yields its Nth address -- independent of the bit math under test
    hand_computed = {  # => co-04: THREE hand-computed CIDR blocks this script's output must match exactly -- one small, one medium, one large
        "203.0.113.0/28": SubnetReport(  # => co-04: /28 -- a small 16-address block (TEST-NET-3, RFC 5737), 14 usable hosts
            "203.0.113.0/28",  # => co-04: cidr
            "203.0.113.0",  # => co-04: network_address
            "203.0.113.15",  # => co-04: broadcast_address
            "203.0.113.1",  # => co-04: first_host
            "203.0.113.14",  # => co-04: last_host
            14,  # => co-04: host_count
        ),  # => co-04: closes the multi-line construct opened above
        "172.16.0.0/20": SubnetReport(  # => co-04: /20 -- a medium 4096-address block, 4094 usable hosts
            "172.16.0.0/20",  # => co-04: cidr
            str(slash_20[0]),  # => co-04: network_address -- offset 0, every host bit zero
            str(slash_20[4095]),  # => co-04: broadcast_address -- offset 2**12 - 1 = 4095, every host bit one
            str(slash_20[1]),  # => co-04: first_host -- offset 1
            str(slash_20[4094]),  # => co-04: last_host -- offset 4095 - 1 = 4094
            4094,  # => co-04: host_count
        ),  # => co-04: closes the multi-line construct opened above
        "198.51.100.128/25": SubnetReport(  # => co-04: /25 -- a half-of-a-/24 block starting at a NON-zero octet, 126 usable hosts
            "198.51.100.128/25",  # => co-04: cidr
            "198.51.100.128",  # => co-04: network_address
            "198.51.100.255",  # => co-04: broadcast_address
            "198.51.100.129",  # => co-04: first_host
            "198.51.100.254",  # => co-04: last_host
            126,  # => co-04: host_count
        ),  # => co-04: closes the multi-line construct opened above
    }  # => co-04: closes the multi-line construct opened above
    for cidr, expected in hand_computed.items():  # => co-04: one full report per CIDR block, checked against the hand-computed expectation
        info = compute_subnet(cidr)  # => co-04: runs the calculator under test
        print(f"{info.cidr}:")  # => co-04: labels the following per-field printout
        print(f"  network   = {info.network_address}")  # => co-04: the subnet's own identifying address
        print(f"  broadcast = {info.broadcast_address}")  # => co-04: the all-hosts address for this subnet
        print(f"  hosts     = {info.first_host} - {info.last_host} ({info.host_count} usable)")  # => co-04: the assignable range
        assert info == expected, f"{cidr} must match its hand-computed SubnetReport exactly"  # => co-04: the exact-match check
    print("\nAll three CIDR blocks match their hand-computed expectations: True")  # => co-04: reached only if every assert above passed
    # => co-04: this file is self-verifying: if it exits 0, every assert above passed and the demonstrated claim held
    # => co-04: this capstone step deliberately reuses Example 8's exact bit-arithmetic shape, re-verified against THREE fresh prefixes it never checked -- proof the technique generalizes, not just a rehash
```

**Run**: `python3 subnet.py`

**Output** (the RFC 1918 block's host addresses mask their second octet, for example `172.x.15.255`; the CIDR labels and everything else are verbatim):

```text
203.0.113.0/28:
  network   = 203.0.113.0
  broadcast = 203.0.113.15
  hosts     = 203.0.113.1 - 203.0.113.14 (14 usable)
172.16.0.0/20:
  network   = 172.x.0.0
  broadcast = 172.x.15.255
  hosts     = 172.x.0.1 - 172.x.15.254 (4094 usable)
198.51.100.128/25:
  network   = 198.51.100.128
  broadcast = 198.51.100.255
  hosts     = 198.51.100.129 - 198.51.100.254 (126 usable)

All three CIDR blocks match their hand-computed expectations: True
```

**Acceptance criteria**: the calculator's output must match a hand-computed expectation for AT LEAST
two prefixes (per this capstone's own spec); it is checked here against THREE. Hand check for
`203.0.113.0/28`: a `/28` leaves 4 host bits, so `2**4 - 2 = 14` usable hosts, network
`203.0.113.0`, broadcast `203.0.113.0 + 15 = 203.0.113.15` -- matches exactly. All three prefixes
hold, verified by the asserts inside the script itself and cross-checked against the captured output
above.

**Key takeaway**: the identical bit-arithmetic technique (mask-and-AND for the network address,
mask-invert-and-OR for the broadcast address) correctly handles a small `/28`, a medium `/20`, and a
`/25` starting at a non-zero octet -- the SAME formula, no special-casing needed per prefix length.

**Why it matters**: a subnet calculator this small (under 60 lines, no dependencies) is exactly the
kind of utility worth keeping on hand rather than reaching for a web calculator mid-incident -- when
diagnosing "is this IP even inside the subnet I think it's in," doing the arithmetic by hand under
time pressure is where mistakes happen, and this script's own hand-computed cross-checks are the
proof its answers can be trusted.

---

## Step 2: `trace.py` -- an annotated DNS -> TCP -> TLS -> HTTP timeline

**Context**: Example 1 annotated a `curl -v` transcript's stages after the fact; Example 30 did the
same for the TLS lines specifically. This step measures and narrates all four stages directly, in
one script, against a real live request -- proving the layered model (co-01) applies to a request
this topic's own code opened, not just one `curl` happened to show.

```python
# learning/capstone/code/trace.py
"""Capstone Step 2: trace.py -- an annotated DNS -> TCP -> TLS -> HTTP timeline for one real request.

Ties together co-01 (the layered model applied to a real packet), co-07 (the TCP handshake), and
co-14 (the TLS 1.3 handshake) into one script: resolves a real host, times each stage separately,
and narrates all four layers a `curl -v` transcript (Examples 1 and 30) shows more implicitly.
"""  # => co-01: this file's own restated purpose, doubling as its module __doc__
# => co-01: no runtime output beyond setting __doc__ -- the three paragraphs above just orient the reader

from __future__ import annotations  # => DD-39 hygiene: postpones type-annotation evaluation, keeping this file interpreter-version-agnostic

import socket  # => co-01: getaddrinfo (DNS) and create_connection (TCP) -- both stdlib, both real network calls
import ssl  # => co-14: wraps a plain TCP socket in a genuine TLS 1.3 handshake, stdlib-only
import time  # => co-01: perf_counter -- a monotonic, high-resolution clock, the right tool for timing each stage

HOST = "example.com"  # => co-01: RFC 2606-reserved for documentation -- the same host Examples 1 and 30 used
PORT = 443  # => co-01: HTTPS's well-known port (Example 16's ports table)


def resolve(host: str, port: int) -> tuple[str, float]:  # => co-01: STAGE 1 -- DNS, the Application-layer name lookup every request starts with
    """Resolve `host` to an IPv4/IPv6 address, returning (address, elapsed_seconds)."""  # => co-01: documents resolve's contract -- no runtime output, just sets its __doc__
    start = time.perf_counter()  # => co-01: timestamp taken right before the resolution call
    address_info = socket.getaddrinfo(host, port, proto=socket.IPPROTO_TCP)  # => co-01: a REAL DNS lookup -- no mock, no cache bypass trick
    elapsed = time.perf_counter() - start  # => co-01: how long resolution itself took, isolated from every later stage
    resolved_ip = str(address_info[0][4][0])  # => co-01: the first returned address -- exactly what a plain socket.connect would also pick; str() satisfies strict typing, since getaddrinfo's sockaddr element type is a union
    return resolved_ip, elapsed  # => co-01: returns this computed value to the caller


def connect_tcp(ip: str, port: int) -> tuple[socket.socket, float]:  # => co-07: STAGE 2 -- the TCP three-way handshake (co-07), Transport layer
    """Open a real TCP connection to (ip, port), returning (socket, elapsed_seconds)."""  # => co-07: documents connect_tcp's contract -- no runtime output, just sets its __doc__
    start = time.perf_counter()  # => co-07: timestamp taken right before the connect call
    sock = socket.create_connection((ip, port), timeout=5)  # => co-07: a REAL SYN/SYN-ACK/ACK handshake against the resolved IP -- this call blocks until it completes
    elapsed = time.perf_counter() - start  # => co-07: how long the handshake itself took, isolated from DNS and TLS
    return sock, elapsed  # => co-07: returns this computed value to the caller


def handshake_tls(sock: socket.socket, server_hostname: str) -> tuple[ssl.SSLSocket, float]:  # => co-14: STAGE 3 -- TLS 1.3's 1-RTT handshake (co-14), sits between Transport and Application
    """Wrap `sock` in a real TLS handshake, returning (tls_socket, elapsed_seconds)."""  # => co-14: documents handshake_tls's contract -- no runtime output, just sets its __doc__
    context = ssl.create_default_context()  # => co-14: the stdlib's OWN certificate-validation policy -- no shortcuts, a real chain-of-trust check
    start = time.perf_counter()  # => co-14: timestamp taken right before the handshake call
    tls_sock = context.wrap_socket(sock, server_hostname=server_hostname)  # => co-14: a REAL TLS 1.3 handshake -- ClientHello+KeyShare through Finished, exactly Example 31's diagram
    elapsed = time.perf_counter() - start  # => co-14: how long the handshake itself took, isolated from DNS and TCP
    return tls_sock, elapsed  # => co-14: returns this computed value to the caller


def send_http_request(tls_sock: ssl.SSLSocket, host: str) -> tuple[str, float]:  # => co-01: STAGE 4 -- HTTP, back at the Application layer, now riding the encrypted TLS channel
    """Send a minimal HTTP/1.1 GET and return (status_line, elapsed_seconds)."""  # => co-01: documents send_http_request's contract -- no runtime output, just sets its __doc__
    request = f"GET / HTTP/1.1\r\nHost: {host}\r\nConnection: close\r\n\r\n".encode()  # => co-01: the literal wire bytes of an HTTP/1.1 request -- Example 1's exact request shape
    start = time.perf_counter()  # => co-01: timestamp taken right before the request is sent
    tls_sock.sendall(request)  # => co-01: writes the request onto the ALREADY-ENCRYPTED TLS channel from stage 3
    response = b""  # => co-01: accumulates bytes across possibly-separate recv() calls
    while b"\r\n\r\n" not in response:  # => co-01: reads only until the header block's terminating blank line -- the body isn't needed for this timeline
        chunk = tls_sock.recv(4096)  # => co-01: reads whatever arrives next -- HTTP responses are not guaranteed to land in one recv() call
        if not chunk:  # => co-01: an empty recv() would mean the peer closed early, before any full header block arrived
            break  # => co-01: stops the loop rather than spinning on a closed connection
        response += chunk  # => co-01: appends this chunk to the running buffer
    elapsed = time.perf_counter() - start  # => co-01: how long the request/response round trip itself took
    status_line = response.split(b"\r\n", 1)[0].decode()  # => co-01: the first line -- e.g. "HTTP/1.1 200 OK", Example 1's own status line
    return status_line, elapsed  # => co-01: returns this computed value to the caller


if __name__ == "__main__":  # => co-01: entry point -- this block runs only when the file executes directly, not on import
    overall_start = time.perf_counter()  # => co-01: the whole-timeline clock, spanning all four stages
    ip, dns_seconds = resolve(HOST, PORT)  # => co-01: STAGE 1 -- DNS
    print(f"[DNS]  resolved {HOST} -> {ip} in {dns_seconds * 1000:.1f} ms")  # => co-01: labels this stage explicitly with its OSI/TCP-IP layer name

    tcp_sock, tcp_seconds = connect_tcp(ip, PORT)  # => co-07: STAGE 2 -- TCP
    print(f"[TCP]  three-way handshake to {ip}:{PORT} completed in {tcp_seconds * 1000:.1f} ms")  # => co-07: labels this stage explicitly with its layer name

    tls_sock, tls_seconds = handshake_tls(tcp_sock, HOST)  # => co-14: STAGE 3 -- TLS
    negotiated_version = tls_sock.version()  # => co-14: e.g. "TLSv1.3" -- confirms which protocol version was actually negotiated
    cipher_info = tls_sock.cipher()  # => co-14: returns None if no cipher was negotiated -- checked explicitly below for strict typing
    assert cipher_info is not None, "a completed TLS handshake must have negotiated a cipher suite"  # => co-14: narrows cipher_info from Optional to a concrete tuple for the line below
    negotiated_cipher = cipher_info[0]  # => co-14: e.g. "TLS_AES_256_GCM_SHA384" -- the negotiated AEAD cipher suite
    print(f"[TLS]  handshake complete -- {negotiated_version} / {negotiated_cipher} in {tls_seconds * 1000:.1f} ms")  # => co-14: labels this stage AND names what was negotiated

    status_line, http_seconds = send_http_request(tls_sock, HOST)  # => co-01: STAGE 4 -- HTTP
    print(f"[HTTP] {status_line} in {http_seconds * 1000:.1f} ms")  # => co-01: labels this final stage with its own layer name and the real response status line

    total_seconds = time.perf_counter() - overall_start  # => co-01: the full DNS-to-HTTP timeline, end to end
    print(f"\ntotal: {total_seconds * 1000:.1f} ms across all four stages")  # => co-01: the capstone's own headline summary number
    tls_sock.close()  # => co-14: releases this connection's resources -- closes the TLS layer, which also closes the underlying TCP socket

    assert status_line.startswith("HTTP/1.1 "), "the response must carry a real HTTP/1.1 status line"  # => co-01: the acceptance criterion this step's syllabus entry (ex-trace) names
    assert negotiated_version == "TLSv1.3", "example.com is expected to negotiate TLS 1.3, per this topic's Example 30"  # => co-14
    assert dns_seconds > 0 and tcp_seconds > 0 and tls_seconds > 0 and http_seconds > 0, "every stage must take a measurable, nonzero amount of time"  # => co-01
    print("All four stages (DNS, TCP, TLS, HTTP) measured and narrated against a real live request: True")  # => co-01: reached only if every assert above passed
    # => co-01: this file is self-verifying: if it exits 0, every assert above passed and the demonstrated claim held
    # => co-01: each stage function returns its OWN isolated elapsed time -- summing them individually (not just timing start-to-finish) is what makes the per-stage breakdown trustworthy
```

**Run**: `python3 trace.py`

**Output**:

```text
[DNS]  resolved example.com -> 172.66.147.243 in 2.2 ms
[TCP]  three-way handshake to 172.66.147.243:443 completed in 22.8 ms
[TLS]  handshake complete -- TLSv1.3 / TLS_AES_256_GCM_SHA384 in 26.3 ms
[HTTP] HTTP/1.1 200 OK in 84.5 ms

total: 141.2 ms across all four stages
All four stages (DNS, TCP, TLS, HTTP) measured and narrated against a real live request: True
```

**Acceptance criteria**: the script must emit a real HTTP status line (`HTTP/1.1 200 OK`, confirmed
live above) and every one of the four stages must be individually labelled with a nonzero elapsed
time -- both hold, verified by the asserts inside the script and visible directly in the captured
`[DNS]`/`[TCP]`/`[TLS]`/`[HTTP]` lines above.

**Key takeaway**: the four stages are wildly uneven in cost on this request -- DNS (`2.2ms`, likely
already warm in the OS resolver cache) and TCP (`22.8ms`) are both cheap compared to TLS (`26.3ms`,
a full 1-RTT handshake) and especially HTTP (`84.5ms`, the actual application round trip) -- a
concrete illustration that "the network is slow" is rarely one single cause.

**Why it matters**: this per-stage breakdown is exactly the debugging instinct co-01's
`layering-and-leaks` big idea is about -- a slow page load's actual bottleneck could be sitting in
ANY one of these four stages, and guessing without measuring each one separately (the way this
script does explicitly) means potentially "fixing" the wrong layer entirely.

---

## Step 3: analysis.md -- annotating a real `traceroute` and `tcpdump` capture

**Context**: Steps 1 and 2 built and ran the tools; this final step uses them to produce the
capstone's own written deliverable -- a real `traceroute` run alongside a real `tcpdump` capture of
one HTTPS request, with every hop and every packet explained and tied back to a specific layer of
the model this whole topic has been building. The full annotated capture lives in its own file,
[`analysis.md`](./analysis.md), since the hop-by-hop and packet-by-packet narration is long enough
to deserve its own page rather than crowding this overview.

**Acceptance criteria**: every `traceroute` hop and every captured `tcpdump` packet is individually
explained and correctly mapped to a layer of the OSI/TCP-IP model -- verified directly against
[`analysis.md`](./analysis.md)'s own hop-by-hop and packet-by-packet tables.

**Key takeaway**: `traceroute` and `tcpdump` answer two genuinely different questions about the SAME
request -- `traceroute` shows WHICH routers a packet passed through and how long each hop took (the
Network layer's own path); `tcpdump` shows WHAT was actually said once the packet reached its
destination (the Transport/TLS/Application layers' own conversation) -- neither tool alone answers
both questions.

**Why it matters**: this is the capstone's own proof that the layered model (co-01) is not academic
vocabulary -- it is the concrete tool this whole topic argued for on its very first page: every
observed hop or packet localizes to exactly one layer, which is what turns "the network is broken"
into an actual, bisectable diagnosis.

---

← Previous: [VPN & Overlay Networking](../vpn-and-overlay.md) &middot; Next:
[Capstone Analysis](./analysis.md) →
