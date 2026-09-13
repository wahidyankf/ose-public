---
description: How security by-example tutorials differ from SWE by-example in artifact type, self-containment requirements, and annotation semantics.
when_to_use: Use when determining what counts as a self-contained security example or how to annotate tool output with `# =>` comments.
---

# Artifact Type, Self-Containment, and Annotation Semantics

## Artifact type

| SWE By-Example                                    | Security By-Example                                             |
| ------------------------------------------------- | --------------------------------------------------------------- |
| Runnable source code (`go run`, `python`, `java`) | Tool output, shell sessions, configs, SIEM queries, log samples |
| Compile-and-run verification                      | Lab-reproducible with stated prerequisites                      |
| Standard library first                            | Built-in OS tools first                                         |

## Self-containment definition

**SWE by-example**: Copy-paste-runnable with a single command (`go run main.go`).

**Security by-example**: Fully reproducible in a stated lab environment with no hidden steps.
Each example must specify:

- **Lab requirement** — the minimum environment needed (e.g., "Ubuntu 22.04 LTS", "HackTheBox
  VPN connected", "Kali Linux", "local VM running Metasploitable 3")
- **Prerequisites installed** — tools required beyond a base OS install
- **All commands shown** — no "run the previous setup" cross-references

## Annotation semantics (`# =>`)

**SWE by-example**: Annotates variable state and return values.

```go
result := transform(y)  // => result is "20-transformed" (string)
```

**Security by-example**: Annotates what each output field or artifact line means and its
security implication.

```bash
nmap -sV 192.0.2.5
# => -sV: probe open ports to determine service/version info
# Output:
# PORT   STATE SERVICE VERSION
# 22/tcp open  ssh     OpenSSH 7.9 (Debian)
# => Port 22 open: SSH available — test for weak credentials or key reuse
# => OpenSSH 7.9: released 2018, check CVE list for unpatched vulns on this version
# 80/tcp open  http    Apache httpd 2.4.38
# => Port 80 open: HTTP (not HTTPS) — cleartext traffic, potential login form exposure
```
