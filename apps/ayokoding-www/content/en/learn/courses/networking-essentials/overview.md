---
title: "Overview"
date: 2026-07-14T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Just Enough Python](../just-enough-python/learning/overview.md) -- every
  socket example in this topic is Python, and this topic assumes you can already read and write
  functions, `list`/`dict` literals, and loops the way that primer taught them.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.x**; the **`curl`**, **`dig`**, and
  **`ping`** CLIs; network access to reach a real URL.
- **Assumed knowledge**: reading/writing basic Python; comfort running terminal commands. No prior
  networking background is required.

## Why this exists -- the big idea

The problem before the solution: your software talks to other machines constantly, and when it
breaks you must know what happens between "hit a URL" and "get a response" -- otherwise every
network bug is magic. The one idea worth keeping if you forget everything else: **the network is a
stack of translations** -- name -> address -> connection -> bytes -> message (DNS -> TCP -> TLS ->
HTTP) -- and you debug by asking which layer failed.

**Cross-cutting big ideas**: `layering-and-leaks` -- each layer hides the one below until it leaks
(a DNS failure surfaces as an HTTP timeout, a TCP failure surfaces as a connection error, and
knowing which layer actually failed is the entire debugging skill this topic builds). And
`abstraction-and-its-cost` -- the tidy `curl` call you run every day hides four separate protocols
(DNS, TCP, TLS, HTTP) that you must be able to peel back by hand the moment something breaks.

This topic covers the **usable slice**: what happens when you hit a URL, HTTP in practice, DNS, and
a sockets introduction, all from the terminal -- verified against Python's `socket` module,
`curl`'s verbose output format, and the current HTTP/TCP/DNS RFCs. Deeper paradigms (OSI layering,
subnetting, congestion control, HTTP/2-3, and `tcpdump`-level packet analysis) are deliberately
deferred to a later, dedicated Advanced Networking topic; this topic's job is the everyday
foundation those build on.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 82 runnable, heavily annotated examples across
  Beginner (Examples 1-28: `curl`, `dig`, `ping`, `nslookup`, and `host` from the terminal),
  Intermediate (Examples 29-60: hand-rolled TCP and UDP sockets in Python, request/response
  framing, a small command protocol, `nc`, and HTTP methods/status codes/headers), and Advanced
  (Examples 61-82: the stdlib `http.client`/`urllib.request` HTTP clients, TLS, redirects, timeouts,
  concurrent servers, and DNS-to-HTTP tracing) -- plus a capstone that assembles a line-based TCP
  command server, its client, and a DNS-to-HTTP explorer script into one runnable program.

Every example is either a real terminal command whose actual output is captured verbatim, or a
complete, self-contained `.py` file colocated under `learning/code/` -- there is no fabricated
output anywhere in this topic.

---

Next: [Learning Overview](./learning/overview.md) →
