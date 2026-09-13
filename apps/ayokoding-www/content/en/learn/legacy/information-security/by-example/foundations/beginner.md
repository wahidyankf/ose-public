---
title: "Beginner"
weight: 10000001
date: 2026-05-21T00:00:00+07:00
draft: false
description: "IT security beginner examples — network fundamentals, basic hardening, and foundational cryptography (Examples 1–28)"
tags: ["it-security", "beginner", "by-example"]
---

## Example 1: Analyzing Network Traffic with tcpdump

**What this covers:** tcpdump captures raw packets traversing a network interface, printing human-readable summaries of each packet header. Understanding packet captures is foundational to detecting anomalies, diagnosing connectivity issues, and verifying firewall rules work as expected.

**Scenario:** You are a system administrator on an Ubuntu 22.04 server and want to inspect live traffic on the primary ethernet interface to understand what is traversing the network.

```bash
# Capture packets on eth0; -n suppresses DNS resolution for speed
# -v enables verbose output showing TTL, checksum, and options fields
sudo tcpdump -i eth0 -n -v

# => 14:02:31.441892 IP (tos 0x0, ttl 64, id 12345, offset 0, flags [DF], proto TCP (6), length 60)
# =>   10.0.0.5.54312 > 93.184.216.34.443: Flags [S], seq 3221984512, win 64240, length 0
# Above: source 10.0.0.5 port 54312 sending SYN to 93.184.216.34 (example.com) port 443 (HTTPS)
# Flags [S] means SYN — the start of a TCP three-way handshake

# Capture only TCP traffic on port 22 (SSH) — reduces noise significantly
sudo tcpdump -i eth0 -n -v 'tcp port 22'
# => 14:02:45.118934 IP 203.0.113.10.49876 > 10.0.0.5.22: Flags [S], seq 1234567890
# => This shows an inbound SSH connection attempt from 203.0.113.10

# Write capture to file for later offline analysis with Wireshark or tshark
sudo tcpdump -i eth0 -w /tmp/capture.pcap
# => Listening on eth0, link-type EN10MB (Ethernet), snapshot length 262144 bytes
# => (File written silently; press Ctrl+C to stop)

# Read from saved file rather than live interface
sudo tcpdump -r /tmp/capture.pcap -n -A
# -A prints packet payload as ASCII — useful for inspecting unencrypted HTTP bodies
# => 14:02:31.441892 IP 10.0.0.5.54312 > 93.184.216.34.80: Flags [P.], length 78
# =>   GET / HTTP/1.1
# =>   Host: example.com
# =>   (ASCII body of the cleartext HTTP request is visible here)
```

**Key Takeaway:** tcpdump gives you a ground-truth view of what is actually on the wire, independent of application-layer assumptions — make it part of every network troubleshooting and security audit workflow.

**Why It Matters:** Packet capture is the definitive tool for verifying that firewall rules, encryption configurations, and routing changes have the effect you intend. Production incidents involving unexpected traffic flows, port scanning, or data exfiltration are often diagnosed first by capturing a representative traffic sample. A security engineer who can read pcap output can distinguish a legitimate retry storm from a DoS attack, or confirm whether traffic is encrypted before it leaves the host.

---

## Example 2: Reading iptables Firewall Rules

**What this covers:** `iptables -L -v -n` prints the current kernel firewall ruleset with packet counters, byte counters, and interface information. Reading this output correctly lets you audit exactly what traffic the kernel permits or drops without relying on documentation.

**Scenario:** You inherit an Ubuntu 22.04 server with an unknown firewall configuration and need to audit which connections are permitted before making any changes.

```bash
# -L lists all rules in all chains; -v adds packet/byte counters and interface columns
# -n suppresses reverse DNS lookups so output is fast and literal
sudo iptables -L -v -n

# => Chain INPUT (policy DROP 0 packets, 0 bytes)
# => ^--- Default policy is DROP: anything not explicitly matched is dropped
# =>  pkts bytes target     prot opt in     out     source               destination
# =>     8   480 ACCEPT     all  --  lo     *       0.0.0.0/0            0.0.0.0/0
# => ^--- Rule 1: accept all traffic on loopback interface (lo) — critical for localhost
# =>   142 15430 ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0   tcp dpt:22
# => ^--- Rule 2: accept inbound TCP to destination port 22 (SSH); 142 packets matched
# =>     0     0 ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0   tcp dpt:443
# => ^--- Rule 3: accept inbound TCP to port 443 (HTTPS); 0 packets matched yet
# =>  3421  201K ACCEPT     all  --  *      *       0.0.0.0/0            0.0.0.0/0   state RELATED,ESTABLISHED
# => ^--- Rule 4: accept packets belonging to already-established connections (statefull tracking)

# => Chain FORWARD (policy DROP 0 packets, 0 bytes)
# => (empty — this server does not route packets between interfaces)

# => Chain OUTPUT (policy ACCEPT 0 packets, 0 bytes)
# => ^--- Default policy is ACCEPT: all outbound traffic is allowed unless a rule drops it

# Show rules with line numbers — useful before inserting or deleting a specific rule
sudo iptables -L INPUT -v -n --line-numbers
# =>  num  pkts bytes target     prot opt in     out     source               destination
# =>    1     8   480 ACCEPT     all  --  lo     *       0.0.0.0/0            0.0.0.0/0
# =>    2   142 15430 ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0   tcp dpt:22
# => Line numbers allow: iptables -D INPUT 2   ← delete rule at line 2
```

**Key Takeaway:** The default policy printed at the top of each chain (`policy ACCEPT` vs `policy DROP`) is the most important line — it determines fate of all unmatched packets and is the first thing to verify on any new system.

**Why It Matters:** A misconfigured default policy of `ACCEPT` on the INPUT chain effectively disables your firewall for any traffic not explicitly blocked. Reading iptables output correctly prevents the common mistake of believing a firewall is restrictive when it is wide open by default. Auditing packet counters per rule also reveals dead rules (zero counters) that may indicate misconfiguration or outdated policies that can be safely removed.

---

## Example 3: Writing a Basic iptables INPUT Rule Set

**What this covers:** Building a minimal iptables INPUT chain that allows SSH and drops all other inbound traffic demonstrates the allow-list (whitelist) approach to firewall policy, which is far more secure than block-list (blacklist) approaches.

**Scenario:** You are hardening a fresh Ubuntu 22.04 server that should only accept inbound SSH connections; all other inbound traffic must be dropped.

```bash
# Step 1: Flush all existing INPUT rules to start clean
sudo iptables -F INPUT
# => (no output — flush succeeds silently)

# Step 2: Accept all traffic on loopback — processes on this host need localhost
sudo iptables -A INPUT -i lo -j ACCEPT
# => (rule appended silently)

# Step 3: Accept packets belonging to already-established or related connections
# Without this rule, outbound connections would never receive replies
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
# => (rule appended; -m state loads the connection tracking module)

# Step 4: Accept inbound TCP to port 22 (SSH) from any source
# In production, restrict source IP with: -s 203.0.113.0/24
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
# => (rule appended; --dport means destination port)

# Step 5: Set the default policy on INPUT to DROP
# This is the critical step — any packet not matching rules above is dropped
sudo iptables -P INPUT DROP
# => (policy changed silently; verify with iptables -L INPUT -v -n)

# Verify the final ruleset looks correct before saving
sudo iptables -L INPUT -v -n --line-numbers
# => Chain INPUT (policy DROP)
# =>  1:  ACCEPT  all  lo    *   anywhere  anywhere
# =>  2:  ACCEPT  all  *     *   anywhere  anywhere  state RELATED,ESTABLISHED
# =>  3:  ACCEPT  tcp  *     *   anywhere  anywhere  tcp dpt:22

# Persist rules across reboots using iptables-persistent
sudo apt-get install -y iptables-persistent   # install once
sudo netfilter-persistent save                # saves /etc/iptables/rules.v4
# => run-parts: executing /usr/share/netfilter-persistent/plugins.d/15-ip4tables save
# => Saved rules to /etc/iptables/rules.v4
```

**Key Takeaway:** Always add the ESTABLISHED,RELATED rule before setting the default policy to DROP, or your existing SSH session will be severed the moment you apply the policy change.

**Why It Matters:** An allow-list firewall policy is the foundation of network segmentation. In production environments, servers should accept connections only on ports required for their function. Every additional open port is an attack surface. Setting `policy DROP` as the default ensures that forgetting to block a new service does not accidentally expose it — the reverse of a `policy ACCEPT` default, which exposes every service by default.

---

## Example 4: Understanding the TCP Three-Way Handshake

**What this covers:** Every TCP connection begins with a three-packet handshake: SYN, SYN-ACK, ACK. Recognizing this pattern in packet captures is essential for diagnosing connection failures, detecting port scans, and understanding how stateful firewalls track sessions.

**Scenario:** You use tcpdump to capture an SSH connection being established to your server so you can observe the exact handshake sequence on the wire.

```bash
# Terminal 1: Start capture filtering for TCP port 22, -S prints absolute sequence numbers
sudo tcpdump -i eth0 -n -S 'tcp port 22'
# => (listening... waiting for packets)

# Terminal 2: Initiate an SSH connection to trigger the handshake
ssh user@10.0.0.5
# => (SSH login prompt appears after handshake completes)

# Back in Terminal 1, tcpdump prints the three handshake packets:

# Packet 1 — SYN (client → server): client requests connection
# => 14:05:01.112233 IP 203.0.113.10.52100 > 10.0.0.5.22: Flags [S], seq 100000000, win 64240, length 0
# => Flags [S] = SYN bit set; seq 100000000 is client's Initial Sequence Number (ISN)
# => length 0: SYN packets carry no payload data

# Packet 2 — SYN-ACK (server → client): server acknowledges and announces its own ISN
# => 14:05:01.112890 IP 10.0.0.5.22 > 203.0.113.10.52100: Flags [S.], seq 200000000, ack 100000001, win 65160
# => Flags [S.] = SYN + ACK bits set
# => seq 200000000: server's ISN; ack 100000001 = client ISN + 1 (acknowledges receipt of SYN)

# Packet 3 — ACK (client → server): client acknowledges server's SYN-ACK; handshake complete
# => 14:05:01.113001 IP 203.0.113.10.52100 > 10.0.0.5.22: Flags [.], seq 100000001, ack 200000001, length 0
# => Flags [.] = ACK only (period represents ACK in tcpdump shorthand)
# => ack 200000001 = server ISN + 1 (acknowledges receipt of server's SYN)
# => After this packet, the connection is ESTABLISHED; SSH data begins flowing

# A SYN with no SYN-ACK reply indicates: firewall drop, port closed (RST), or host unreachable
# A flood of SYN packets without completions is a SYN flood DoS attack
```

**Key Takeaway:** The handshake sequence SYN → SYN-ACK → ACK is the universal signature of TCP connection establishment — any deviation (missing SYN-ACK, RST instead of SYN-ACK) immediately reveals a firewall drop, port-closed condition, or active attack.

**Why It Matters:** Stateful firewalls track connection state by detecting this exact handshake. A packet with ACK set but no preceding SYN in the state table is a sign of a spoofed or mis-routed packet, and stateful inspection drops it automatically. Understanding the handshake also helps you distinguish a SYN flood attack (millions of SYN packets per second with no completions) from legitimate high-connection-rate traffic, which is a critical distinction for incident response.

---

## Example 5: Scanning Open Ports with ss

**What this covers:** The `ss` command (socket statistics) replaces the older `netstat` on modern Linux systems and reports all listening sockets with process ownership. Auditing open ports with `ss` is the first step in identifying services that should not be internet-accessible.

**Scenario:** You have just deployed an Ubuntu 22.04 server and want to enumerate every service listening for connections before opening firewall rules.

```bash
# -t: TCP sockets only; -l: listening sockets only; -n: numeric ports (no DNS lookup)
# -p: show process name and PID owning the socket (requires root for all processes)
sudo ss -tlnp

# => State    Recv-Q  Send-Q  Local Address:Port   Peer Address:Port  Process
# => LISTEN   0       128     0.0.0.0:22            0.0.0.0:*         users:(("sshd",pid=1234,fd=3))
# => ^--- sshd is listening on all IPv4 interfaces (0.0.0.0) port 22
# => LISTEN   0       128     127.0.0.1:5432        0.0.0.0:*         users:(("postgres",pid=5678,fd=5))
# => ^--- PostgreSQL is ONLY on localhost (127.0.0.1) — correct, not internet-accessible
# => LISTEN   0       4096    0.0.0.0:3306          0.0.0.0:*         users:(("mysqld",pid=9012,fd=12))
# => ^--- MySQL is on 0.0.0.0 — DANGER: listening on all interfaces, likely misconfiguration
# => LISTEN   0       511     0.0.0.0:80            0.0.0.0:*         users:(("nginx",pid=3456,fd=6))
# => LISTEN   0       511     0.0.0.0:443           0.0.0.0:*         users:(("nginx",pid=3456,fd=7))
# => ^--- nginx is serving HTTP and HTTPS on all interfaces — expected for a web server

# Also check IPv6 listeners (replace -4 flag with -6 or omit to see both)
sudo ss -tlnp6
# => LISTEN   0       128     [::]:22               [::]:*            users:(("sshd",pid=1234,fd=4))
# => ^--- sshd is also listening on all IPv6 interfaces; expected

# Find who owns a specific port — useful when ss -p shows no name (permission issue)
sudo ss -tlnp 'sport = :3306'
# => LISTEN   0       4096    0.0.0.0:3306    0.0.0.0:*  users:(("mysqld",pid=9012,fd=12))
# Seeing MySQL on 0.0.0.0: bind-address=127.0.0.1 in /etc/mysql/mysql.conf.d/mysqld.cnf needed
```

**Key Takeaway:** Any service bound to `0.0.0.0` (all interfaces) is network-accessible to anyone who can reach the host — only services explicitly intended to be public should appear in this column.

**Why It Matters:** Database services (MySQL, PostgreSQL, Redis, MongoDB) that bind to all interfaces are one of the most common causes of data breaches. Default installations of many packages bind to all interfaces to make getting started easier, which is catastrophically dangerous in production. Running `ss -tlnp` after every new package install and after every configuration change is a minimal operational hygiene practice that catches this class of misconfiguration before attackers do.

---

## Example 6: Basic nmap Host Discovery and Version Scan

**What this covers:** nmap is the industry-standard network scanner for discovering hosts, open ports, and running service versions. Understanding nmap output lets you assess your own attack surface and replicate what an attacker would see from outside your network.

**Scenario:** You are auditing your lab network (192.168.1.0/24) to discover which hosts are up, then probing one host more deeply to enumerate its services.

```bash
# Phase 1: Host discovery scan — find which IPs respond on the network
# -sn means "ping scan" (no port scan); discovers live hosts without being invasive
sudo nmap -sn 192.168.1.0/24

# => Starting Nmap 7.93 ( https://nmap.org )
# => Nmap scan report for 192.168.1.1
# => Host is up (0.0012s latency).    ← gateway/router is alive
# => MAC Address: AA:BB:CC:DD:EE:01 (Cisco Systems)
# => Nmap scan report for 192.168.1.10
# => Host is up (0.0034s latency).    ← another host is alive
# => MAC Address: AA:BB:CC:DD:EE:02 (Dell)
# => Nmap done: 256 IP addresses (2 hosts up) scanned in 3.14 seconds

# Phase 2: Service version detection on a single host
# -sV probes open ports and detects service name and version
# -p 22,80,443,3306 limits scan to only these ports (faster, less noisy)
sudo nmap -sV -p 22,80,443,3306 192.168.1.10

# => PORT     STATE  SERVICE   VERSION
# => 22/tcp   open   ssh       OpenSSH 8.9p1 Ubuntu 3ubuntu0.6 (Ubuntu Linux; protocol 2.0)
# => ^--- SSH is running OpenSSH 8.9p1; check NVD for CVEs on this specific version
# => 80/tcp   open   http      nginx 1.18.0 (Ubuntu)
# => ^--- HTTP is running nginx 1.18.0; note version for vulnerability lookup
# => 443/tcp  open   ssl/http  nginx 1.18.0 (Ubuntu)
# => ^--- HTTPS on the same nginx instance
# => 3306/tcp open   mysql     MySQL 8.0.32-0ubuntu0.22.04.2
# => ^--- MySQL is open on the network — this should only be 127.0.0.1 in most setups
# =>
# => Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

# -O flag attempts OS detection (requires root and is slightly more invasive)
sudo nmap -O 192.168.1.10
# => OS details: Linux 5.15 - 5.19 (Ubuntu 22.04)
# => ^--- OS fingerprint based on TCP/IP stack behavior; useful for asset inventory
```

**Key Takeaway:** nmap output is what an attacker sees before crafting exploits — running it against your own infrastructure regularly lets you fix exposures before they are discovered by someone with malicious intent.

**Why It Matters:** Version information returned by `-sV` is directly cross-referenceable with the National Vulnerability Database. An attacker who sees `MySQL 8.0.32` can immediately look up whether that exact version has known unauthenticated RCE vulnerabilities. The moment you expose a versioned service to a network, its version becomes your attack surface. Regular self-scanning with nmap and immediate patching of detected outdated versions is a core preventive security practice.

---

## Example 7: TLS Handshake Walkthrough with openssl s_client

**What this covers:** `openssl s_client` connects to a TLS endpoint and prints every step of the handshake — certificate chain, cipher suite negotiated, protocol version, and session details. Reading this output lets you verify encryption configuration without needing a browser.

**Scenario:** You have just configured HTTPS on your web server and want to verify the certificate chain, TLS version, and cipher suite from the command line without relying on a browser's simplified padlock UI.

```bash
# Connect to example.com port 443 and perform a full TLS handshake
# -showcerts shows the full certificate chain instead of just the leaf
openssl s_client -connect example.com:443 -showcerts

# => CONNECTED(00000003)
# => ^--- TCP connection to port 443 succeeded; TLS handshake begins

# => depth=2 C=US, O=DigiCert Inc, CN=DigiCert Global Root CA
# => verify return:1
# => ^--- Root CA (depth 2) is trusted by OpenSSL's CA bundle; verify return:1 = PASS

# => depth=1 C=US, O=DigiCert Inc, CN=DigiCert TLS RSA SHA256 2020 CA1
# => verify return:1
# => ^--- Intermediate CA (depth 1) signed by the root; forming the chain

# => depth=0 CN=www.example.com
# => verify return:1
# => ^--- Leaf certificate (depth 0) for the actual domain; chain is valid

# => Certificate chain
# =>  0 s:CN = www.example.com                  ← subject of leaf cert
# =>    i:C = US, O = DigiCert Inc, CN = DigiCert TLS RSA SHA256 2020 CA1
# =>    ^--- issued by this intermediate CA

# => SSL-Session:
# =>     Protocol  : TLSv1.3              ← TLS 1.3 negotiated — excellent, most secure
# =>     Cipher    : TLS_AES_256_GCM_SHA384  ← strong AEAD cipher suite
# =>     Session-ID: A1B2C3D4...          ← session ID for potential resumption
# =>     TLS session ticket lifetime hint: 7200 (seconds)  ← ticket valid 2 hours

# Check specific TLS protocol support — does server still accept TLS 1.0 (insecure)?
openssl s_client -connect example.com:443 -tls1
# => 139F...error:0A000102:SSL routines::unsupported protocol
# => ^--- Server REJECTED TLS 1.0 — good, older protocols are disabled

# Extract just the certificate without interactive session
echo | openssl s_client -connect example.com:443 2>/dev/null | openssl x509 -noout -dates
# => notBefore=Jan  1 00:00:00 2025 GMT   ← certificate validity start
# => notAfter=Jan  1 00:00:00 2026 GMT    ← certificate expires 2026-01-01; set a renewal reminder
```

**Key Takeaway:** A valid TLS handshake requires three things to be correct simultaneously: a trusted certificate chain, a secure protocol version (TLS 1.2 minimum, TLS 1.3 preferred), and a strong cipher suite — `openssl s_client` verifies all three in one command.

**Why It Matters:** Many production TLS misconfigurations are invisible in browser UIs that show only a green padlock. `openssl s_client` exposes whether a server still accepts TLS 1.0 (deprecated since RFC 8996), whether the certificate chain is complete (incomplete chains break some HTTP clients), and when the certificate expires. Certificate expiry is one of the most common causes of production outages — automating expiry monitoring with this command prevents unexpected downtime.

---

## Example 8: Generating a Self-Signed Certificate with openssl

**What this covers:** Generating a self-signed certificate with `openssl req` and `openssl x509` teaches the mechanics of X.509 PKI — private key generation, certificate signing requests, and certificate issuance — which underpin all TLS deployments.

**Scenario:** You are setting up an internal development server that needs HTTPS but does not yet have a domain with a CA-signed certificate. You generate a self-signed certificate for use in the internal environment.

```bash
# Step 1: Generate a 4096-bit RSA private key
# 4096 bits is recommended for long-lived keys; 2048 bits is minimum acceptable
openssl genrsa -out server.key 4096
# => Generating RSA private key, 4096 bit long modulus (2 primes)
# => ...++++++
# => e is 65537 (0x10001)
# => (server.key created — PROTECT THIS FILE; treat like a password)

# Restrict permissions on the private key immediately — only root should read it
chmod 600 server.key
# => (permission set; ls -la server.key shows -rw------- 1 root root)

# Step 2: Create a Certificate Signing Request (CSR) with subject metadata
# -new: generate new CSR; -key: use our private key; -subj: non-interactive subject fields
openssl req -new -key server.key -out server.csr \
  -subj "/C=US/ST=California/L=San Francisco/O=ACME Corp/CN=dev.internal.example.com"
# => (server.csr created — this is what you send to a CA for signing)
# => /CN= is the Common Name — must match the hostname clients connect to

# Step 3: Self-sign the CSR to create the certificate (valid 365 days)
# In production, you would send server.csr to Let's Encrypt or your internal CA instead
openssl x509 -req -in server.csr -signkey server.key -out server.crt -days 365
# => Certificate request self-signature ok
# => subject=C=US, ST=California, L=San Francisco, O=ACME Corp, CN=dev.internal.example.com
# => (server.crt created)

# Verify the certificate content
openssl x509 -in server.crt -text -noout
# => Certificate:
# =>   Validity
# =>     Not Before: May 21 07:00:00 2026 GMT   ← valid from today
# =>     Not After : May 21 07:00:00 2027 GMT   ← expires in 365 days
# =>   Subject: C=US, ST=California, O=ACME Corp, CN=dev.internal.example.com
# =>   Subject Public Key Info:
# =>     Public Key Algorithm: rsaEncryption
# =>       RSA Public-Key: (4096 bit)            ← matches our genrsa step

# Files created:
# server.key  — private key (keep secret, restrict to root)
# server.csr  — certificate signing request (can be shared with CA)
# server.crt  — signed certificate (can be shared publicly)
```

**Key Takeaway:** A certificate has three distinct components — the private key (secret), the CSR (request with public key and metadata), and the signed certificate (public, presented to clients) — and confusing these three is a common source of TLS configuration errors.

**Why It Matters:** Self-signed certificates are appropriate for internal development and testing but trigger browser warnings in production because no trusted CA has vouched for the server's identity. Understanding the mechanics of key generation, CSR creation, and signing prepares you to use automated certificate authorities (Let's Encrypt via Certbot, ACME protocol) and internal PKI systems confidently. Private key protection is paramount — a leaked private key allows an attacker to impersonate your server for the certificate's entire lifetime.

---

## Example 9: Configuring HTTPS in nginx

**What this covers:** An nginx TLS configuration block links the certificate and private key to a virtual host and controls which TLS protocol versions and cipher suites the server accepts. Getting this configuration right prevents negotiation of insecure protocols like TLS 1.0 and weak ciphers like RC4.

**Scenario:** You are configuring nginx on Ubuntu 22.04 to serve HTTPS traffic using the certificate generated in Example 8, with a secure TLS configuration aligned with Mozilla's Intermediate compatibility profile.

```nginx
# /etc/nginx/sites-available/example.com
# Full HTTPS server block with security-hardened TLS settings

server {
    listen 443 ssl;              # listen on port 443 with SSL/TLS enabled
    listen [::]:443 ssl;         # also listen on IPv6

    server_name dev.internal.example.com;  # must match certificate CN or SAN

    # --- Certificate and key ---
    ssl_certificate     /etc/ssl/certs/server.crt;    # public cert shown to clients
    ssl_certificate_key /etc/ssl/private/server.key;  # private key; never serve this file

    # --- Protocol versions ---
    # Disable TLS 1.0 and 1.1 (deprecated by RFC 8996); allow 1.2 and 1.3 only
    ssl_protocols TLSv1.2 TLSv1.3;

    # --- Cipher suites ---
    # Mozilla Intermediate profile: balances security and broad client compatibility
    # ECDHE provides Perfect Forward Secrecy (PFS); AES-GCM is authenticated encryption
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;

    # Prefer server cipher order over client preference — consistent security posture
    ssl_prefer_server_ciphers off;  # off = TLS 1.3 handles this; on = legacy compatibility

    # --- Session settings ---
    ssl_session_timeout 1d;           # session cache valid for 1 day; reduces handshake overhead
    ssl_session_cache shared:MozSSL:10m;  # 10 MB shared cache — approx 40,000 sessions
    ssl_session_tickets off;          # disable; tickets can leak forward secrecy if key rotated rarely

    # --- HSTS (HTTP Strict Transport Security) ---
    # Tells browsers to always use HTTPS for this domain for 1 year
    # includeSubDomains: enforce on all subdomains; preload: include in browser preload list
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # --- OCSP Stapling --- reduce client latency for certificate revocation check
    ssl_stapling on;           # nginx fetches OCSP response and caches it
    ssl_stapling_verify on;    # nginx verifies the OCSP response before stapling
    resolver 8.8.8.8 8.8.4.4 valid=300s;  # DNS resolver for OCSP endpoint lookup

    # --- Document root ---
    root /var/www/example.com;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}

server {
    # Redirect all HTTP to HTTPS — no mixed-content, no accidental cleartext
    listen 80;
    listen [::]:80;
    server_name dev.internal.example.com;
    return 301 https://$host$request_uri;  # 301 permanent redirect; browsers cache this
}
```

**Key Takeaway:** Specifying `ssl_protocols TLSv1.2 TLSv1.3` and a strong cipher suite list is the minimum required to prevent negotiation of deprecated protocols — the HSTS header then ensures browsers never accidentally connect over HTTP even if they navigate to the HTTP URL.

**Why It Matters:** A server that accepts TLS 1.0 is vulnerable to POODLE and BEAST attacks. A server without HSTS allows a network attacker to intercept the initial HTTP request and strip the TLS redirect (SSL stripping attack). Combining protocol restrictions, strong ciphers, HSTS, and OCSP stapling creates defense-in-depth at the transport layer that protects against downgrade attacks, interception, and certificate revocation bypass simultaneously.

---

## Example 10: Symmetric Encryption with AES Using openssl enc

**What this covers:** `openssl enc` applies symmetric-key encryption using AES-256-CBC, demonstrating the encrypt-then-verify pattern: encrypt a file, then verify decryption produces the original before discarding the plaintext.

**Scenario:** You need to encrypt a sensitive configuration file before storing it in a shared repository, using a strong passphrase and AES-256 encryption.

```bash
# Create a sample sensitive file to encrypt
echo "db_password=S3cr3tP@ssword123" > config.env
# => config.env contains one line of cleartext credentials

# Encrypt config.env using AES-256-CBC mode
# -aes-256-cbc: algorithm and mode; -pbkdf2: use PBKDF2 for key derivation from passphrase
# -iter 600000: 600,000 PBKDF2 iterations (NIST SP 800-132 minimum for SHA-256 is 210,000)
# -salt: prepend random salt to output so same plaintext encrypts differently each time
openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt \
  -in config.env -out config.env.enc
# => enter AES-256-CBC encryption password: (type passphrase, not echoed)
# => Verifying - enter AES-256-CBC encryption password: (confirm passphrase)
# => (config.env.enc created — binary ciphertext file)

# Verify the encrypted file is unreadable ciphertext
file config.env.enc
# => config.env.enc: openssl enc'd data with salted password
# Attempting to read it as text confirms it is encrypted binary data
head -c 50 config.env.enc | od -c | head -2
# => 0000000   S   a   l   t   e   d   _   _  \301  \226 ...
# => ^--- "Salted__" header prefix followed by random salt, then ciphertext

# Decrypt to verify the ciphertext round-trips correctly
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 \
  -in config.env.enc -out config.env.decrypted
# => enter AES-256-CBC decryption password: (same passphrase)
# => (config.env.decrypted created)

# Verify decrypted content matches original
diff config.env config.env.decrypted && echo "MATCH: decryption verified"
# => MATCH: decryption verified  ← files are byte-identical; round-trip succeeded

# Now safe to delete original plaintext (use shred to overwrite before deletion)
shred -u config.env config.env.decrypted
# => (files overwritten with random data then deleted; prevents recovery from disk)
```

**Key Takeaway:** Always specify `-pbkdf2 -iter 600000` when using `openssl enc` — without `-pbkdf2`, openssl uses the ancient EVP_BytesToKey derivation function that a GPU can brute-force millions of times per second, making passphrase-based encryption trivially breakable.

**Why It Matters:** AES-256 is computationally unbreakable when implemented correctly, but symmetric encryption security depends entirely on the key derivation function. Using too few PBKDF2 iterations means the passphrase is the weak link — a 10-character password becomes crackable in hours with modern hardware. The shred step matters too: deleting a file without overwriting leaves the plaintext recoverable from disk until that sector is reused. These details determine whether encryption provides real protection or only the appearance of it.

---

## Example 11: Asymmetric Encryption with RSA Using openssl

**What this covers:** RSA asymmetric encryption uses a key pair — the public key encrypts data, and only the matching private key can decrypt it. This is the mechanism underlying TLS certificate verification, SSH key authentication, and digital signatures.

**Scenario:** You want to encrypt a small secret (like an AES key or API token) so that only the holder of a specific private key can read it — the RSA encrypt/decrypt workflow for small payloads.

```bash
# Step 1: Generate a 4096-bit RSA private key
openssl genrsa -out private.key 4096
# => Generating RSA private key, 4096 bit long modulus (2 primes)
# => (private.key created — the secret component; protect with chmod 600)
chmod 600 private.key

# Step 2: Extract the public key from the private key
# The public key is safe to distribute — anyone can use it to encrypt data for you
openssl rsa -in private.key -pubout -out public.key
# => writing RSA key
# => (public.key created — safe to share publicly)

# Inspect public key modulus size to confirm key strength
openssl rsa -in public.key -pubin -text -noout | grep "RSA Public-Key"
# => RSA Public-Key: (4096 bit)   ← 4096-bit key confirmed

# Step 3: Encrypt a small secret with the public key
# RSA can only encrypt data smaller than the key size; for larger data, encrypt an AES key
echo -n "my-api-token-abc123" > secret.txt
openssl pkeyutl -encrypt -inkey public.key -pubin -in secret.txt -out secret.enc
# => (secret.enc created — binary ciphertext; only holder of private.key can decrypt)

# Verify ciphertext is not plaintext
file secret.enc
# => secret.enc: data   ← binary data, not readable as text

# Step 4: Decrypt with the private key
openssl pkeyutl -decrypt -inkey private.key -in secret.enc -out secret.dec
# => (secret.dec created)

# Verify decryption matches original
cat secret.dec
# => my-api-token-abc123   ← original plaintext recovered; round-trip verified

# Step 5: Verify a digital signature (proves sender has the private key)
# Sign a message with the private key
echo -n "message to authenticate" | openssl dgst -sha256 -sign private.key -out msg.sig
# => (msg.sig created — cryptographic signature)

# Verify signature with the public key — anyone can do this
echo -n "message to authenticate" | openssl dgst -sha256 -verify public.key -signature msg.sig
# => Verified OK   ← signature is valid; message was signed by holder of private.key
```

**Key Takeaway:** In asymmetric cryptography, what the public key locks (encrypts or verifies) only the private key can unlock (decrypt or sign) — never share the private key with anyone, including the party you are communicating with.

**Why It Matters:** RSA is the cryptographic foundation of PKI, TLS certificates, SSH authentication, and PGP email encryption. Understanding that encryption flows public-key → ciphertext and signing flows private-key → signature clarifies why certificate authorities work: a CA signs your certificate with its private key, and browsers verify with the CA's public key built into the OS trust store. Any confusion between these directions leads to security architecture mistakes with real-world consequences.

---

## Example 12: Hashing Files with SHA-256 and Verifying Integrity

**What this covers:** Cryptographic hash functions produce a fixed-length fingerprint of arbitrary data; any modification to the input — even one bit — produces a completely different hash. SHA-256 hashing is used to verify file integrity during download, software distribution, and change detection.

**Scenario:** You have downloaded an OS ISO image and want to verify it has not been corrupted or tampered with before installing it on a production server.

```bash
# Generate a SHA-256 hash of a file
sha256sum ubuntu-22.04.4-live-server-amd64.iso
# => a4acfda10b18da50e2ec50ccaf860d7f20b389df16ec0a9e0de39f4028a75e4c  ubuntu-22.04.4-live-server-amd64.iso
# => ^--- 256-bit (64 hex characters) hash of the entire ISO; deterministic for identical files

# The official Ubuntu download page provides a SHA256SUMS file; download and verify
# Simulating the SHA256SUMS file content:
echo "a4acfda10b18da50e2ec50ccaf860d7f20b389df16ec0a9e0de39f4028a75e4c  ubuntu-22.04.4-live-server-amd64.iso" > SHA256SUMS

# Verify the downloaded ISO against the official hash list in one step
sha256sum --check SHA256SUMS
# => ubuntu-22.04.4-live-server-amd64.iso: OK   ← hash matches; file is intact
# If the file had been modified even by 1 byte:
# => ubuntu-22.04.4-live-server-amd64.iso: FAILED
# => sha256sum: WARNING: 1 computed checksum did NOT match

# Hash a directory of files recursively — useful for detecting unauthorized changes
find /etc/nginx -type f | sort | xargs sha256sum > /tmp/nginx_baseline.sha256
# => /tmp/nginx_baseline.sha256 contains hashes for all nginx config files

# Later, compare current state to baseline to detect any modifications
sha256sum --check /tmp/nginx_baseline.sha256
# => /etc/nginx/nginx.conf: OK
# => /etc/nginx/sites-available/example.com: OK
# => /etc/nginx/mime.types: FAILED   ← this file was modified since baseline was taken

# Quick integrity check of a single string (useful for secrets comparison)
echo -n "my-secret-value" | sha256sum
# => 3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b  -
# The trailing "-" means input came from stdin, not a file
```

**Key Takeaway:** A SHA-256 hash is a tamper-evident seal — any modification to the file changes the hash completely, but a matching hash does not prove the hash itself is trustworthy unless you obtained it through a separate verified channel (GPG-signed release page, not the same download server).

**Why It Matters:** Supply chain attacks modify software packages or ISO images to include malware before distribution. Verifying SHA-256 hashes protects against corrupted downloads and mirrors that serve modified files. However, if the SHA256SUMS file itself is on the same compromised server, hash verification provides no protection — this is why Ubuntu GPG-signs their SHA256SUMS files with their release key, providing a cryptographic chain of trust back to a key you trust independently.

---

## Example 13: Password Hashing with bcrypt in Python

**What this covers:** Password storage requires a slow, salted hashing algorithm specifically designed to resist brute-force attacks. bcrypt is a widely adopted adaptive cost factor algorithm that adjusts to hardware improvements by increasing the work factor.

**Scenario:** You are implementing a user authentication system in Python and need to store passwords securely in a database.

```python
# Install passlib with bcrypt backend: pip install passlib[bcrypt]
from passlib.context import CryptContext

# Configure a CryptContext with bcrypt and cost factor (rounds)
# rounds=12 means 2^12 = 4096 internal iterations; typical range is 10–14
# Higher rounds = slower hashing = harder brute force; benchmark on your hardware
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
# => CryptContext configured; "deprecated=auto" will upgrade older hashes on login

# Hash a user's password at registration time
plaintext_password = "MyS3cureP@ssw0rd!"
hashed_password = pwd_context.hash(plaintext_password)
# => hashed_password example:
# => "$2b$12$EXAMPLEsaltEXAMPLEsaltEXAMPLEsal.examplehashexamplehashXXXXXXX"
# => $2b$   = bcrypt algorithm identifier
# => $12$   = cost factor (rounds = 12 → 2^12 iterations)
# => next 22 chars = random 128-bit salt (different every call even same password)
# => remaining 31 chars = the actual password hash

print(f"Hash length: {len(hashed_password)}")
# => Hash length: 60   ← bcrypt hashes are always exactly 60 characters

# Calling hash() again on the same password produces a DIFFERENT hash each time
hashed_password_2 = pwd_context.hash(plaintext_password)
print(f"Same password, different hash: {hashed_password != hashed_password_2}")
# => Same password, different hash: True   ← random salt embedded in each hash

# Verify a password at login time — never compare hashes directly
def verify_login(entered_password: str, stored_hash: str) -> bool:
    # verify() extracts salt from stored_hash, re-hashes entered_password, compares securely
    return pwd_context.verify(entered_password, stored_hash)
    # => passlib uses constant-time comparison internally to prevent timing attacks

# Test correct password
result_correct = verify_login("MyS3cureP@ssw0rd!", hashed_password)
print(f"Correct password: {result_correct}")
# => Correct password: True

# Test wrong password
result_wrong = verify_login("wrong-password", hashed_password)
print(f"Wrong password: {result_wrong}")
# => Wrong password: False

# NEVER do this — direct hash comparison reveals password length via timing
# if stored_hash == new_hash:  ← vulnerable to timing attack; WRONG pattern
# ALWAYS use: pwd_context.verify(entered, stored)  ← constant-time; CORRECT pattern
```

**Key Takeaway:** The cost factor (`rounds=12`) and the random salt embedded in every bcrypt output are what make bcrypt resistant to rainbow tables and GPU-accelerated brute-force — MD5, SHA-1, and even SHA-256 without a salt are not acceptable for password storage.

**Why It Matters:** Plaintext password storage caused the LinkedIn, RockYou, and Adobe mega-breaches that exposed hundreds of millions of users. Unsalted SHA-1 hashes (as used in the LinkedIn breach) can be cracked at billions of attempts per second with a modern GPU. bcrypt with rounds=12 produces approximately 250 hash attempts per second on modern hardware, making a brute-force attack against a full database breach take years rather than hours. Increasing rounds as hardware improves — without requiring users to change passwords — is the adaptive property that makes bcrypt a long-term investment.

---

## Example 14: SSH Key-Based Authentication Setup

**What this covers:** SSH key authentication replaces passwords with asymmetric cryptography — the client proves identity by signing a challenge with a private key that never leaves the client machine. This eliminates password brute-force attacks and phishing of SSH credentials.

**Scenario:** You want to configure SSH key-based login to a remote Ubuntu 22.04 server so that password authentication is no longer needed for your administrative account.

```bash
# Step 1: Generate an Ed25519 key pair on the CLIENT machine
# Ed25519 is preferred over RSA for SSH: shorter keys, faster, more secure
ssh-keygen -t ed25519 -C "admin@mycompany.com" -f ~/.ssh/id_ed25519
# => Generating public/private ed25519 key pair.
# => Enter passphrase (empty for no passphrase): (set a strong passphrase — protects key if stolen)
# => Enter same passphrase again:
# => Your identification has been saved in /home/<user>/.ssh/id_ed25519    ← PRIVATE KEY; never share
# => Your public key has been saved in /home/<user>/.ssh/id_ed25519.pub    ← public key; share freely
# => The key fingerprint is: SHA256:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX admin@mycompany.com

# Examine the public key — this is the string that goes onto the server
cat ~/.ssh/id_ed25519.pub
# => ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIB... admin@mycompany.com
# => ^--- algorithm identifier, followed by base64 public key, followed by comment

# Step 2: Copy the public key to the server using ssh-copy-id
# ssh-copy-id appends the public key to ~/.ssh/authorized_keys on the server
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@10.0.0.5
# => /usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: ~/.ssh/id_ed25519.pub
# => user@10.0.0.5's password: (last time you enter the password; key auth replaces this)
# => Number of key(s) added: 1
# => Now try logging into the machine: ssh user@10.0.0.5

# Step 3: Verify key-based login works BEFORE disabling password auth
ssh -i ~/.ssh/id_ed25519 user@10.0.0.5
# => Enter passphrase for key '/home/<user>/.ssh/id_ed25519': (client-side passphrase, not server password)
# => Last login: Wed May 21 14:00:00 2026 from 203.0.113.10
# => (logged in successfully using key auth)

# Inspect authorized_keys on the server to confirm the key was added
cat ~/.ssh/authorized_keys
# => ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIB... admin@mycompany.com
# => ^--- One line per authorized public key; SSH compares client's proof against this list

# Correct permissions are required — SSH refuses keys if permissions are too open
chmod 700 ~/.ssh             # directory: only owner can read/write/execute
chmod 600 ~/.ssh/authorized_keys  # file: only owner can read/write
# => If permissions are wrong: "WARNING: UNPROTECTED PRIVATE KEY FILE!" and login fails
```

**Key Takeaway:** The private key (`id_ed25519`) never leaves your machine — the server never sees it; SSH proves possession of the private key by having you sign a server-generated challenge, which the server verifies with your public key in `authorized_keys`.

**Why It Matters:** Password-based SSH authentication is vulnerable to brute-force attacks, credential stuffing, and phishing. Fail2ban statistics consistently show that internet-facing SSH servers receive hundreds to thousands of password login attempts per hour from automated bots. Key-based authentication eliminates this entire attack class. The passphrase on the private key provides a second layer: even if an attacker steals your key file, they cannot use it without knowing the passphrase.

---

## Example 15: Hardening sshd_config

**What this covers:** The SSH daemon configuration file (`/etc/ssh/sshd_config`) controls dozens of security-relevant options. Applying a hardened configuration eliminates the most common SSH attack vectors including root login, password brute force, and use of weak algorithms.

**Scenario:** You have enabled key-based SSH authentication (Example 14) and now want to harden the SSH daemon configuration to disable password authentication and root login on a production Ubuntu 22.04 server.

```bash
# Always back up the original before editing
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
# => (backup created at /etc/ssh/sshd_config.bak)

# Edit /etc/ssh/sshd_config with these security settings:
sudo nano /etc/ssh/sshd_config
```

```
# /etc/ssh/sshd_config — hardened configuration for Ubuntu 22.04

# Change the default port from 22 to reduce automated scan noise
# Not a security control, but reduces log noise from bots
Port 2222
# => After change, connect with: ssh -p 2222 user@server

# Disable root login entirely — attackers cannot target root directly
PermitRootLogin no
# => Administrators use a personal account then sudo; root login is unnecessary

# Disable password authentication — only key-based auth is accepted
PasswordAuthentication no
# => Eliminates brute-force and credential-stuffing attacks against SSH

# Disable challenge-response authentication (includes keyboard-interactive)
ChallengeResponseAuthentication no
# => Prevents bypass of PasswordAuthentication no via other auth methods

# Allow only specific users (allow-list beats deny-list)
AllowUsers deployuser adminuser
# => Only users listed here can authenticate; any other account is rejected

# Limit authentication attempts per connection before disconnect
MaxAuthTries 3
# => After 3 failed attempts, connection is closed; limits manual brute force

# Idle session timeout — disconnect inactive sessions after 5 minutes
ClientAliveInterval 300    # send keepalive after 300 seconds of inactivity
ClientAliveCountMax 2      # disconnect after 2 missed keepalives (10 minutes total)
# => Prevents abandoned sessions from remaining open indefinitely

# Disable X11 forwarding — no GUI forwarding needed on server
X11Forwarding no

# Disable TCP port forwarding if not needed (prevents tunnel abuse)
AllowTcpForwarding no
```

```bash
# Validate the configuration before restarting (critical — prevents lockout)
sudo sshd -t
# => (no output = config is valid; any error is printed and reload is aborted)

# Reload sshd to apply changes — reload is safer than restart (existing sessions survive)
sudo systemctl reload sshd
# => (no output; sshd reloads config and applies to new connections)

# Verify the new port is listening before closing your current session
sudo ss -tlnp 'sport = :2222'
# => LISTEN   0   128   0.0.0.0:2222   0.0.0.0:*   users:(("sshd",pid=1234,fd=3))
# => Good: sshd is listening on 2222; open a NEW terminal and test login before closing this one
```

**Key Takeaway:** Run `sudo sshd -t` to validate the configuration file before every reload — a syntax error in sshd_config with an immediate restart can lock you out of the server permanently.

**Why It Matters:** Default SSH configurations are designed for broad compatibility, not security. `PermitRootLogin yes` and `PasswordAuthentication yes` are the defaults on many distributions, meaning a fresh server is immediately targetable by the millions of SSH brute-force bots that scan the internet continuously. Hardening sshd_config within the first hour of provisioning a server dramatically reduces the attack surface and eliminates the most common class of successful Linux server compromises.

---

## Example 16: Linux File Permissions

**What this covers:** Linux file permissions control which users and processes can read, write, or execute each file and directory. Understanding the permission bits, ownership model, and `chmod`/`chown` commands is foundational to the principle of least privilege on Linux systems.

**Scenario:** You are reviewing and correcting file permissions on a web application directory to ensure the web server process can read files but cannot write to them, and that private key files are not world-readable.

```bash
# View permissions on a directory listing
ls -la /var/www/myapp/
# => total 32
# => drwxr-xr-x 3 www-data www-data 4096 May 21 10:00 .          ← directory itself
# => drwxr-xr-x 4 root     root     4096 May 20 09:00 ..         ← parent directory
# => -rw-r--r-- 1 www-data www-data 2048 May 21 10:00 index.html ← regular file
# => -rw------- 1 root     root      512 May 21 10:00 secret.key ← private file
# => -rwsr-xr-x 1 root     root     8192 May 21 10:00 setuid_bin ← DANGER: setuid bit set

# Permission string breakdown for: -rw-r--r--
# Position 1:   '-'     = file type ('-'=file, 'd'=directory, 'l'=symlink)
# Positions 2-4: 'rw-'  = owner permissions (read=yes, write=yes, execute=no)
# Positions 5-7: 'r--'  = group permissions (read=yes, write=no, execute=no)
# Positions 8-10: 'r--' = other permissions (read=yes, write=no, execute=no)

# Change file ownership — make www-data own the web files
sudo chown -R www-data:www-data /var/www/myapp/
# => -R: recursive; owner is changed to www-data user and www-data group

# Set appropriate permissions for web content:
# Directories need execute (x) for traversal; files need read (r) only
sudo chmod 755 /var/www/myapp/              # drwxr-xr-x: owner=rwx, group=r-x, other=r-x
sudo chmod 644 /var/www/myapp/index.html   # -rw-r--r--: owner=rw-, group=r--, other=r--
# => 755 = 7(rwx)+5(r-x)+5(r-x); 644 = 6(rw-)+4(r--)+4(r--)

# Make private key readable only by root
sudo chmod 600 /var/www/myapp/secret.key   # -rw-------: only root can read/write
sudo chown root:root /var/www/myapp/secret.key
# => Now www-data process cannot read the private key even if compromised

# Verify permissions look correct
ls -la /var/www/myapp/secret.key
# => -rw------- 1 root root 512 May 21 10:00 /var/www/myapp/secret.key
# => Permission string confirms: only root has read/write access

# Numeric permission cheat sheet for common patterns:
# 700 → rwx------  owner only, full access (SSH private key directory)
# 600 → rw-------  owner only, read/write (private keys, sensitive config)
# 644 → rw-r--r--  owner rw, everyone else read (web content, public files)
# 755 → rwxr-xr-x  owner full, everyone else read+execute (directories, executables)
# 777 → rwxrwxrwx  DANGEROUS: everyone has full access; almost never correct
```

**Key Takeaway:** The principle of least privilege on Linux is implemented through file ownership and permissions — a process should have read access only where it needs to read, write access only where it must write, and execute access only on actual executables.

**Why It Matters:** World-writable files (`chmod 777`) and world-readable private keys are among the most common findings in Linux security audits. A web server process compromised through an application vulnerability can only access files that the web server's OS user (`www-data`, `nginx`, `apache`) has permission to read or write. Correct file permissions contain a compromise and prevent lateral movement from the web tier to the database or private key material stored on the same host.

---

## Example 17: Understanding setuid and setgid Risk

**What this covers:** The setuid (SUID) bit causes a program to run with the file owner's permissions rather than the executing user's permissions. Finding unexpected SUID binaries is a critical step in privilege escalation auditing, as attackers look for SUID root binaries with exploitable vulnerabilities.

**Scenario:** You are conducting a privilege escalation audit on an Ubuntu 22.04 server by finding all SUID binaries and assessing whether any unexpected or vulnerable programs are in the list.

```bash
# Find all SUID (setuid) files owned by root on the entire filesystem
# -perm -4000: any file with the setuid bit set (4 = setuid in permission octal)
# -type f: regular files only (not directories)
sudo find / -perm -4000 -type f 2>/dev/null
# => /usr/bin/sudo            ← expected: sudo needs root to escalate privileges
# => /usr/bin/passwd          ← expected: passwd modifies /etc/shadow (root-owned)
# => /usr/bin/su              ← expected: su switches user by authenticating via PAM
# => /usr/bin/newgrp          ← expected: changes group membership
# => /usr/bin/chsh            ← expected: allows user to change their own shell
# => /usr/bin/gpasswd         ← expected: administer /etc/group
# => /usr/bin/mount           ← expected: allows mounting with certain restrictions
# => /usr/bin/umount          ← expected: allows unmounting
# => /usr/sbin/pppd           ← expected (if PPP is used): needs raw network access
# => /usr/local/bin/custom_app ← UNEXPECTED: a custom binary with SUID root — investigate

# Inspect the unexpected binary
ls -la /usr/local/bin/custom_app
# => -rwsr-xr-x 1 root root 16384 May 10 08:00 /usr/local/bin/custom_app
# => 's' in owner execute position = setuid bit is set

# Check what the binary does and who installed it
file /usr/local/bin/custom_app
# => /usr/local/bin/custom_app: ELF 64-bit LSB executable, x86-64, dynamically linked

dpkg -S /usr/local/bin/custom_app 2>&1 || echo "Not from a package"
# => Not from a package   ← binary was not installed via apt; installed manually; suspicious

# If the binary is not needed, remove the SUID bit immediately
sudo chmod u-s /usr/local/bin/custom_app
# => SUID bit removed; binary still exists but now runs as the calling user

# Find setgid files (similar risk — runs with group owner's group ID)
sudo find / -perm -2000 -type f 2>/dev/null | head -5
# => /usr/bin/wall     ← expected: needs tty group to write to all terminals
# => /usr/bin/write    ← expected: similar to wall
# => /usr/bin/ssh-agent ← expected: agent needs access to a socket with group permissions

# SUID on directories (sticky bit): find world-writable directories with sticky bit
sudo find / -type d -perm -1777 2>/dev/null
# => /tmp     ← expected: sticky bit prevents users deleting each other's files
# => /var/tmp ← expected: same rationale as /tmp
```

**Key Takeaway:** Any SUID binary that is not part of a standard distribution package or whose SUID bit is not required by a documented, business-justified function should be treated as a finding requiring immediate remediation.

**Why It Matters:** SUID root binaries are the most valuable target for local privilege escalation. A vulnerable SUID binary (e.g., an old version of `sudo`, a misconfigured custom binary, or an unnecessarily SUID-enabled interpreter) allows an unprivileged attacker who has obtained a low-privilege shell to become root. GTFOBins (gtfobins.github.io) documents dozens of standard Unix binaries that can be abused for privilege escalation when given the SUID bit — keeping this list minimal and audited is essential hardening.

---

## Example 18: User and Group Management

**What this covers:** Linux user and group management commands (`useradd`, `usermod`, `groupadd`) create and configure accounts, while the files `/etc/passwd`, `/etc/shadow`, and `/etc/group` store this information. Understanding the structure of these files is necessary for auditing account security.

**Scenario:** You are onboarding a new developer to an Ubuntu 22.04 server, creating an account with the correct group memberships, and auditing existing accounts for security hygiene.

```bash
# Create a new user account for a developer
sudo useradd -m -s /bin/bash -c "Jane Developer" -G sudo,docker janedev
# => -m: create home directory /home/janedev
# => -s /bin/bash: set login shell to bash (not /bin/sh or no shell)
# => -c "Jane Developer": GECOS comment field with full name
# => -G sudo,docker: add to supplemental groups; janedev gets sudo access and docker access

# Set an initial password (developer should change on first login)
sudo passwd janedev
# => New password: (enter a strong temporary password)
# => Retype new password:
# => passwd: password updated successfully

# Force password change on first login
sudo passwd --expire janedev
# => passwd: password expiry information changed.
# => (janedev must change password immediately on first login)

# Inspect /etc/passwd to understand the account structure
grep janedev /etc/passwd
# => janedev:x:1001:1001:Jane Developer:/home/janedev:/bin/bash
# => Fields: username:password_placeholder:UID:GID:comment:home:shell
# => 'x' in password field means actual hash is in /etc/shadow (readable only by root)

# Inspect /etc/shadow for the password hash
sudo grep janedev /etc/shadow
# => janedev:$6$rounds=5000$salt$hashvalue:19137:0:99999:7:::
# => $6$ = SHA-512 algorithm; 19137 = days since epoch when password was last changed

# Review group memberships
groups janedev
# => janedev : janedev sudo docker   ← primary group janedev, supplemental groups sudo and docker

# Audit ALL accounts with a login shell — service accounts should have /sbin/nologin
grep -v '/sbin/nologin\|/bin/false' /etc/passwd | awk -F: '{print $1, $7}'
# => root /bin/bash     ← root needs a shell for emergency console access
# => janedev /bin/bash  ← our new developer account
# => mysql /bin/bash    ← WARNING: service account; should be /sbin/nologin; investigate

# Fix the MySQL service account — it should not have an interactive shell
sudo usermod -s /sbin/nologin mysql
# => (shell changed; mysql service still works but interactive login is now blocked)

# Lock an account when a developer leaves (preserve files but prevent login)
sudo usermod -L formerdev   # -L locks by prepending '!' to the password hash
# => (account locked; formerdev cannot log in but their files and UID are preserved)
```

**Key Takeaway:** Service accounts (database processes, web servers, system daemons) should have `/sbin/nologin` or `/bin/false` as their shell — this blocks interactive login even if an attacker compromises the account credentials.

**Why It Matters:** Default installations of services like MySQL, PostgreSQL, and nginx often create system accounts with no password set but with a valid shell. If an attacker finds a way to execute commands as the `mysql` OS user (e.g., through a SQL injection that writes to disk), a valid shell enables further lateral movement. Auditing `/etc/passwd` for service accounts with valid shells is a quick, high-value hardening step that most administrators overlook.

---

## Example 19: sudo Configuration and Security

**What this covers:** The `/etc/sudoers` file controls which users can execute which commands with elevated privileges. Misconfigured sudo rules — especially `NOPASSWD` combined with broad command patterns — are a common privilege escalation vector.

**Scenario:** You are reviewing and hardening the sudo configuration on a production Ubuntu 22.04 server to follow the principle of least privilege, ensuring each user can only run the specific commands their role requires.

```bash
# Always edit sudoers with visudo — validates syntax before saving (prevents lockout)
sudo visudo
# => (opens /etc/sudoers in the editor defined by EDITOR environment variable)
# NEVER edit /etc/sudoers directly with nano/vim — a syntax error locks everyone out
```

```
# /etc/sudoers — annotated security-focused configuration

# --- User privilege specifications ---

# root can run all commands as all users (necessary default; do not remove)
root    ALL=(ALL:ALL) ALL
# => Syntax: user  MACHINE=(run_as_user:run_as_group) commands

# Members of the sudo group can run any command (standard Ubuntu default)
%sudo   ALL=(ALL:ALL) ALL
# => %sudo means the 'sudo' group; ALL=(ALL:ALL) ALL = any machine, any user, any command

# --- Restricted sudo rules (principle of least privilege) ---

# Developer can restart application services but NOTHING else
# This is correct: specific command, no NOPASSWD
janedev server1=(root) /bin/systemctl restart myapp, /bin/systemctl status myapp
# => janedev can restart and status myapp only; any other sudo command is denied

# DANGEROUS: broad NOPASSWD with wildcard — should not be in production
# operator ALL=(ALL) NOPASSWD: /usr/bin/apt *
# => NOPASSWD skips password prompt; wildcard allows 'apt shell' → full root
# => Correct alternative: list specific apt commands explicitly

# Database admin can run pg_dump without a password (needed for automated backups)
dbadmin ALL=(postgres) NOPASSWD: /usr/bin/pg_dump --no-password *
# => (postgres) means run AS the postgres OS user, not as root
# => NOPASSWD here is justified: automated backup scripts cannot prompt

# --- Drop privileges for high-risk commands ---
# Deny specific commands even for members of sudo group
janedev ALL=(ALL) !NOPASSWD: /bin/bash, !NOPASSWD: /bin/sh, !NOPASSWD: /usr/bin/vim
# => Prevents janedev from escalating via shell escape in NOPASSWD contexts

# --- Defaults security settings ---
Defaults    env_reset              # reset environment on sudo; prevents PATH injection
Defaults    mail_badpass           # email root on bad password attempts
Defaults    secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
# => secure_path: prevents PATH hijacking by ensuring only known-good directories searched
Defaults    logfile="/var/log/sudo.log"  # log all sudo usage to a dedicated file
```

```bash
# Audit current sudo privileges to see what users can do
sudo -l -U janedev
# => Matching Defaults entries for janedev on server1:
# =>     env_reset, secure_path=...
# => User janedev may run the following commands on server1:
# =>     (root) /bin/systemctl restart myapp, /bin/systemctl status myapp
```

**Key Takeaway:** `NOPASSWD` combined with a wildcard (`*`) or a shell-escape-capable program (vim, python, find, awk) effectively grants unrestricted root access — audit every `NOPASSWD` rule and replace wildcards with explicit command paths.

**Why It Matters:** GTFOBins documents how programs like `vim`, `python`, `find`, `awk`, and dozens of others can be used to escape to a root shell when given sudo privileges. A `NOPASSWD: /usr/bin/vim` rule means anyone with that sudo permission can run `:!/bin/bash` inside vim and obtain a root shell with no password and no log entry. Least-privilege sudo configuration is one of the most impactful internal controls against insider threats and post-compromise lateral movement.

---

## Example 20: Finding World-Writable Files

**What this covers:** World-writable files and directories (permissions `o+w`) allow any user on the system to modify them, creating opportunities for privilege escalation, log tampering, and backdoor injection. Auditing for world-writable paths is a standard CIS Benchmark hardening step.

**Scenario:** You are running a security audit of an Ubuntu 22.04 production server to identify any files outside of expected system paths (like `/tmp`) that are writable by all users.

```bash
# Find all world-writable files (excluding /proc and /sys which generate false positives)
# -perm -o+w: files where the "other" write bit is set
sudo find / -perm -o+w -type f \
  ! -path "/proc/*" ! -path "/sys/*" ! -path "/dev/*" \
  2>/dev/null

# => /tmp/session_token_12345         ← /tmp is expected but review sensitive data in /tmp
# => /var/www/html/uploads/shell.php  ← CRITICAL: web-accessible writable file; possible webshell
# => /etc/cron.d/custom_job           ← CRITICAL: cron file writable by all; privilege escalation vector
# => /usr/local/lib/python3.10/site-packages/requests/adapters.py  ← potential library poisoning
# => (expected world-writable files on a typical system include only /tmp, /var/tmp, /dev/null)

# Fix: remove world-write permission from unexpected files
sudo chmod o-w /etc/cron.d/custom_job
# => (world-write removed; only owner can now write to this cron file)

# Find world-writable directories (also a risk — attacker can plant files)
sudo find / -perm -o+w -type d \
  ! -path "/proc/*" ! -path "/sys/*" ! -path "/dev/*" \
  ! -path "/tmp" ! -path "/var/tmp" \
  2>/dev/null

# => /var/www/html/uploads/           ← web upload directory; review if also executable
# => /opt/legacy_app/cache/           ← application cache dir writable by all; review
# => (only /tmp and /var/tmp should normally be world-writable directories)

# Assess the specific risk of the uploads directory
ls -la /var/www/html/uploads/
# => drwxrwxrwx 2 www-data www-data 4096 May 21 10:00 uploads
# => If nginx/PHP executes files from this directory, a user uploading shell.php gets RCE

# Find world-writable files in PATH directories — highest risk for privilege escalation
for dir in $(echo $PATH | tr ':' ' '); do
  sudo find "$dir" -perm -o+w -type f 2>/dev/null && echo "FOUND in $dir"
done
# => (any output here is a critical finding — commands in PATH being writable allows replacement)
# => FOUND in /usr/local/bin   ← a world-writable file in PATH is a critical vulnerability
```

**Key Takeaway:** A world-writable file in a cron directory, a PATH directory, or a location executed by a privileged process is a direct path to privilege escalation — the attacker writes a malicious payload and waits for the privileged process to execute it.

**Why It Matters:** World-writable cron files, configuration files, and library paths are a known privilege escalation technique catalogued in MITRE ATT&CK (T1574.006 — Path Interception by PATH Environment Variable). A compromised low-privilege web server account that can write to `/etc/cron.d/` can inject a cron job that runs as root on the next minute boundary. Regular world-writable file audits — integrated into a weekly cron job that alerts on new findings — prevent this class of misconfiguration from persisting undetected.

---

## Example 21: CVE Lookup and CVSS 4.0 Score Breakdown

**What this covers:** Common Vulnerabilities and Exposures (CVE) entries provide standardized vulnerability identifiers, and the CVSS 4.0 scoring system quantifies severity using base metrics (attack vector, complexity, privileges required, user interaction, impact). Reading a CVE entry correctly lets you triage vulnerabilities for patching priority.

**Scenario:** Your nmap scan (Example 6) found OpenSSH 8.9p1 running on your server. You look up CVEs for this version and walk through scoring a recent finding.

```bash
# Search for CVEs affecting OpenSSH 8.9 using the NVD API
# In production, use: https://nvd.nist.gov/vuln/search
# Simulating the output of an NVD API query for demonstration:

# CVE-2023-38408 — OpenSSH ssh-agent remote code execution
# NVD Entry fields explained:

# CVE ID: CVE-2023-38408
# => Unique identifier; format CVE-YEAR-NNNNNN; used to cross-reference all databases

# Published: 2023-07-20
# => Publication date; patches usually released same day or shortly before

# Description:
# => "The PKCS#11 feature in ssh-agent in OpenSSH before 9.3p2 has an insufficiently
# =>  trustworthy search path, leading to remote code execution if an agent is forwarded
# =>  to an attacker-controlled system."

# Affected versions: OpenSSH < 9.3p2
# => Your version 8.9p1 IS AFFECTED

# CVSS 4.0 Base Score: 9.8 (CRITICAL)
# CVSS Vector: CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H

# CVSS 4.0 metric breakdown:
# AV:N  = Attack Vector: Network    → exploitable remotely over the internet
# AC:L  = Attack Complexity: Low    → no special conditions required
# AT:N  = Attack Requirements: None → no prerequisite access needed
# PR:N  = Privileges Required: None → attacker needs no existing account
# UI:N  = User Interaction: None    → no victim action needed; fully automated exploit
# VC:H  = Confidentiality (Vulnerable System): High  → full info disclosure
# VI:H  = Integrity (Vulnerable System): High        → full data modification
# VA:H  = Availability (Vulnerable System): High     → full service disruption
# SC:H  = Confidentiality (Subsequent System): High  → can pivot to other systems
# SI:H  = Integrity (Subsequent System): High
# SA:H  = Availability (Subsequent System): High

# Risk triage decision based on CVSS 4.0 score:
# 0.0        → None      → informational; fix in next cycle
# 0.1 – 3.9  → Low       → fix within 90 days
# 4.0 – 6.9  → Medium    → fix within 30 days
# 7.0 – 8.9  → High      → fix within 7 days
# 9.0 – 10.0 → Critical  → fix immediately (within 24 hours in most policies)

# This CVE scores 9.8 CRITICAL → immediate patching required

# Check current installed version
ssh -V
# => OpenSSH_8.9p1 Ubuntu-3ubuntu0.6, OpenSSL 3.0.2 15 Mar 2022
# => Version 8.9p1 is vulnerable; upgrade to 9.3p2 or later required
```

**Key Takeaway:** CVSS 4.0 scores above 9.0 with `AV:N/PR:N/UI:N` represent network-exploitable vulnerabilities requiring no privileges and no victim interaction — these are the highest-priority patch targets because automated exploitation frameworks emerge within days of public disclosure.

**Why It Matters:** Not all CVEs are equally urgent. A CVSS 4.0 score of 9.8 with network reachability and no authentication requirement (like CVE-2023-38408) demands immediate patching because weaponized exploits become publicly available within days of CVE publication. A CVSS 2.1 local-only vulnerability with high attack complexity can wait for a scheduled maintenance window. Systematic CVE triage using CVSS scores allows security teams to direct limited patching resources to the vulnerabilities that pose the greatest actual risk.

---

## Example 22: Checking Installed Packages for Known Vulnerabilities

**What this covers:** Ubuntu's `apt` package manager tracks available updates, and the `unattended-upgrades` service can automatically apply security patches. Auditing for pending security updates and enabling automatic security patching reduces the window of vulnerability exposure.

**Scenario:** You are auditing an Ubuntu 22.04 server to identify packages with pending security updates and then configure automatic security patching to prevent future drift.

```bash
# Update the package index to ensure current vulnerability information
sudo apt-get update
# => Hit:1 http://security.ubuntu.com/ubuntu jammy-security InRelease
# => Hit:2 http://archive.ubuntu.com/ubuntu jammy InRelease
# => Reading package lists... Done
# => (package metadata refreshed; local list now reflects current repository state)

# List all packages with available upgrades, including security updates
apt list --upgradable 2>/dev/null
# => Listing... Done
# => libssl3/jammy-security 3.0.2-0ubuntu1.15 amd64 [upgradable from: 3.0.2-0ubuntu1.14]
# => ^--- OpenSSL has a security update available: 3.0.2-0ubuntu1.14 → 3.0.2-0ubuntu1.15
# => openssh-server/jammy-security 1:8.9p1-3ubuntu0.7 amd64 [upgradable from: 1:8.9p1-3ubuntu0.6]
# => ^--- OpenSSH server security update available; addresses CVE-2023-38408
# => nginx/jammy 1.18.0-6ubuntu14.5 amd64 [upgradable from: 1.18.0-6ubuntu14.4]
# => libc6/jammy-security 2.35-0ubuntu3.7 amd64 [upgradable from: 2.35-0ubuntu3.6]
# => ^--- glibc security update; critical library used by virtually all processes

# Apply only security updates (not all upgrades, which might include feature changes)
sudo apt-get install -y --only-upgrade \
  $(apt list --upgradable 2>/dev/null | grep "jammy-security" | cut -d/ -f1)
# => Updating openssh-server, libssl3, libc6 from *-security repositories
# => (packages upgraded to patched versions)

# Configure unattended-upgrades for automatic security patching
sudo apt-get install -y unattended-upgrades
# => (package installed or already present)

# Configure which updates to automatically apply
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

```
// /etc/apt/apt.conf.d/50unattended-upgrades
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";   // Ubuntu security updates only
    // "${distro_id}:${distro_codename}-updates";  // Uncomment for all updates (riskier)
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";   // recover from interrupted installs
Unattended-Upgrade::Remove-Unused-Dependencies "true"; // clean up orphaned packages
Unattended-Upgrade::Automatic-Reboot "false";         // do NOT reboot automatically
Unattended-Upgrade::Mail "security@yourcompany.com";  // email on upgrades performed
```

```bash
# Enable the daily unattended-upgrades timer
sudo systemctl enable --now unattended-upgrades
# => Created symlink /etc/systemd/system/multi-user.target.wants/unattended-upgrades.service
# => (service enabled and started; will run nightly)

# Do a dry run to confirm what would be upgraded automatically
sudo unattended-upgrade --dry-run --debug 2>&1 | grep "Packages that"
# => Packages that will be upgraded: libssl3 openssh-server libc6
# => (confirms the security packages would be patched automatically)
```

**Key Takeaway:** Configure `unattended-upgrades` to apply only packages from the `jammy-security` repository — this patches known CVEs automatically while avoiding the risk of feature-update packages changing application behavior unexpectedly.

**Why It Matters:** The median time from CVE publication to exploit deployment in the wild is decreasing year over year; Rapid7 reported in 2023 that 25% of critical vulnerabilities were exploited within 24 hours of disclosure. Manual patch management cannot close this window for organizations managing many servers. Automated security patching via `unattended-upgrades` — scoped to security repositories only — patches the critical library vulnerabilities (OpenSSL, OpenSSH, glibc) that attackers target first, without the deployment risk of broader package updates.

---

## Example 23: Reading /var/log/auth.log

**What this covers:** `/var/log/auth.log` records all authentication events on a Linux system including SSH login attempts (successful and failed), sudo usage, su commands, and PAM authentication events. Analyzing this log is the first step in detecting brute-force attacks and unauthorized access.

**Scenario:** You notice an alert from your monitoring system about unusual authentication activity and open `/var/log/auth.log` to investigate.

```bash
# View the most recent authentication events
sudo tail -50 /var/log/auth.log

# --- Failed SSH login attempts (brute force pattern) ---
# => May 21 14:00:01 server sshd[12345]: Failed password for invalid user admin from 198.51.100.10 port 54321 ssh2
# => May 21 14:00:02 server sshd[12346]: Failed password for invalid user root from 198.51.100.10 port 54322 ssh2
# => May 21 14:00:03 server sshd[12347]: Failed password for invalid user oracle from 198.51.100.10 port 54323 ssh2
# => ^--- Three sequential failures within 2 seconds: automated brute-force bot
# => Attacker IP: 198.51.100.10; cycling through common usernames rapidly

# --- Successful SSH login ---
# => May 21 14:05:22 server sshd[13000]: Accepted publickey for janedev from 203.0.113.50 port 44001 ssh2
# => ^--- Key-based login succeeded for janedev from 203.0.113.50 — legitimate admin login

# --- sudo usage ---
# => May 21 14:06:01 server sudo:  janedev : TTY=pts/0 ; PWD=/home/janedev ; USER=root ; COMMAND=/bin/systemctl restart myapp
# => ^--- janedev ran 'systemctl restart myapp' as root via sudo — matches allowed rules

# --- Account lockout (PAM) ---
# => May 21 14:00:10 server sshd[12500]: pam_unix(sshd:auth): authentication failure; logname= uid=0 euid=0 tty=ssh ruser= rhost=198.51.100.10
# => May 21 14:00:11 server sshd[12500]: PAM 3 more authentication failures; rhost=198.51.100.10
# => ^--- Account locked after repeated failures; pam_faillock triggered

# Count failed login attempts per source IP — useful for identifying top offenders
sudo grep "Failed password" /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -10
# => 847  198.51.100.10   ← this IP has made 847 failed attempts — active brute force
# =>  42  203.0.113.20    ← secondary attacker source
# =>   3  203.0.113.50    ← same IP as our legitimate admin; likely a typo on first attempt

# Show all successful logins (for comparison against expected admin IPs)
sudo grep "Accepted" /var/log/auth.log
# => May 21 14:05:22 server sshd[13000]: Accepted publickey for janedev from 203.0.113.50 port 44001 ssh2
# => (only one successful login; pattern is normal)

# Block the brute-force IP with iptables immediately
sudo iptables -I INPUT -s 198.51.100.10 -j DROP
# => (rule inserted at top of INPUT chain; all traffic from this IP now dropped)
# => For persistent blocking, consider fail2ban which automates this response
```

**Key Takeaway:** The pattern of many `Failed password` entries within seconds from a single IP is the unmistakable signature of automated SSH brute-force; cross-reference with `Accepted` entries to confirm no successful logins occurred before taking blocking action.

**Why It Matters:** Auth log analysis is often the first forensic step in a security incident response. The log provides the factual record of what happened: which accounts were targeted, from which IPs, at what times, and whether any attempts succeeded. Security Information and Event Management (SIEM) systems ingest these logs to generate automated alerts and retain evidence for compliance audits. Even without a SIEM, a five-minute manual review of auth.log weekly catches active attacks and suspicious patterns before they escalate.

---

## Example 24: Monitoring System Resources for Anomalies

**What this covers:** Processes consuming unexpected CPU or memory, or running under unusual user accounts, can indicate cryptomining malware, backdoor C2 connections, or data exfiltration scripts. Reading `top` and `ps` output with security intent means looking for outliers, not just performance tuning.

**Scenario:** Your monitoring system alerts on high CPU usage on a production web server. You investigate using `top` and `ps` to determine whether the cause is a legitimate load spike or malware.

```bash
# Interactive top for immediate situational awareness — press 'c' to show full command path
top -b -n 1 -c
# => top - 14:30:00 up 7 days, 2:15,  2 users,  load average: 7.82, 7.65, 6.91
# => ^--- Load average 7.82 on a 4-core server = 195% CPU load; system is overloaded
# => Tasks: 112 total,   3 running,  109 sleeping
# =>
# =>  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
# => 9999 www-data  20   0   85432   9012   2048 R  398.0  0.1   142:33 /tmp/.x/miner -o pool.minexmr.com:4444 -u wallet
# => ^--- SUSPICIOUS: www-data process running a binary from /tmp/.x/ connecting to a crypto mining pool
# => 1234 nginx     20   0  123456  12345   6789 S    1.5  0.1     0:05 nginx: worker process
# => ^--- nginx worker process with low CPU — legitimate

# Get more detail on the suspicious process
ps auxf | grep -A5 -B5 "miner"
# => www-data  9999  398  0.1   85432  9012  ?  R  May21 142:33 /tmp/.x/miner -o pool.minexmr.com:4444
# => ^--- PID 9999, running as www-data, consuming 398% CPU continuously

# Find the process's network connections — confirm C2/mining pool connectivity
sudo ss -tlnp | grep 9999
# => ESTAB   0   0   10.0.0.5:52000   pool.minexmr.com:4444   users:(("miner",pid=9999))
# => ^--- Active outbound connection to a known cryptocurrency mining pool

# Find how the binary got there — check for recently modified files
sudo find /tmp -newer /tmp -type f -ls 2>/dev/null
# => 9999   84 -rwxr-xr-x  1 www-data www-data  83456 May 21 09:15 /tmp/.x/miner
# => ^--- Binary dropped 5 hours ago; attacker likely exploited a web application vulnerability

# Identify parent process — how was the miner launched?
ps -p 9999 -o ppid=
# => 1100
ps -p 1100 -o pid,ppid,cmd=
# => 1100  1099  /usr/bin/php /var/www/html/uploads/shell.php
# => ^--- The miner was launched by a PHP webshell uploaded to the uploads directory

# Immediate containment: kill the process and block the mining pool IP
sudo kill -9 9999
# => (process killed; CPU usage drops immediately)
sudo iptables -I OUTPUT -d pool.minexmr.com -j DROP
# => (outbound connection to mining pool blocked at kernel level)
```

**Key Takeaway:** A process running as a web server user (`www-data`, `nginx`) with a binary path in `/tmp` or any non-standard path is almost certainly malware dropped through a web application vulnerability — the combination of unusual user, unusual path, and high resource usage is a near-definitive malware indicator.

**Why It Matters:** Cryptomining malware is frequently the first payload dropped after initial access via web application vulnerabilities (SQL injection, RFI, unrestricted file upload). While cryptominers are not themselves data-exfiltrating malware, their presence confirms that the attacker has code execution on the server and may have planted additional backdoors. A server with unauthorized processes running is a compromised server regardless of the payload — the investigation must trace how the binary arrived and what data the attacker may have accessed.

---

## Example 25: Basic syslog Forwarding Configuration with rsyslog

**What this covers:** Forwarding system logs to a centralized log server in real time prevents an attacker from destroying evidence by deleting local logs after a compromise. rsyslog is the standard syslog daemon on Ubuntu and supports forwarding over TCP (reliable) or UDP (fire-and-forget).

**Scenario:** You are configuring an Ubuntu 22.04 server to forward its authentication and system logs to a central log management server at 10.0.0.100 over TCP port 514 for retention and SIEM ingestion.

```bash
# rsyslog configuration for centralized log forwarding
# Edit the main configuration file
sudo nano /etc/rsyslog.conf
```

```
# /etc/rsyslog.conf — centralized log forwarding configuration

# --- Module loading ---
module(load="imuxsock")    # provides kernel logging support (from unix socket)
module(load="imklog")      # kernel log messages
# module(load="imudp") ← UDP receiver; only uncomment on the LOG SERVER, not senders

# --- Forward rules ---
# Forward authentication events immediately (security-critical; use TCP for reliability)
# @  = UDP (no guarantee of delivery; faster but messages can be lost)
# @@ = TCP (connection-oriented; messages guaranteed or error reported)
auth,authpriv.*    @@10.0.0.100:514
# => auth: login events (sshd, sudo, su, cron, passwd)
# => authpriv: private auth messages (PAM, password changes)
# => @@: TCP; port 514 is the standard syslog port

# Forward all kernel and daemon messages (includes service starts/stops, errors)
kern.*             @@10.0.0.100:514
daemon.*           @@10.0.0.100:514

# Forward all severity levels for all facilities (belt-and-suspenders)
*.info;mail.none;news.none   @@10.0.0.100:514
# => *.info: all facilities at info severity and above
# => mail.none;news.none: exclude mail/news to avoid volume flooding the SIEM

# --- Queue configuration for reliable delivery ---
# If the log server is temporarily unreachable, queue messages on disk
$ActionQueueType LinkedList          # use an in-memory linked list queue
$ActionQueueFileName fwdRule1        # spill to disk in /var/spool/rsyslog/ when needed
$ActionResumeRetryCount -1           # retry indefinitely until log server is reachable
$ActionQueueSaveOnShutdown on        # save queue to disk on rsyslog shutdown

# --- Local log retention (keep local copy as backup) ---
auth,authpriv.*    /var/log/auth.log   # still write locally AND forward remotely
kern.*             /var/log/kern.log
*.info             /var/log/syslog
```

```bash
# Validate rsyslog configuration syntax
sudo rsyslogd -N1
# => rsyslogd: version 8.2112.0, config validation run (level 1), master config /etc/rsyslog.conf
# => rsyslogd: End of config validation run. Bye.   ← no errors; configuration is valid

# Restart rsyslog to apply changes
sudo systemctl restart rsyslog
# => (service restarted; log forwarding is now active)

# Test that forwarding is working by generating a test log entry
logger -p auth.info "test syslog forwarding from $(hostname)"
# => (log entry generated; should appear on the central log server within seconds)

# Verify the test entry appears locally
grep "test syslog forwarding" /var/log/auth.log
# => May 21 14:45:00 server username: test syslog forwarding from server   ← confirmed locally
# => (verify the same line appears on the remote log server's auth.log)
```

**Key Takeaway:** Centralized real-time log forwarding is essential because an attacker who achieves root access on a server can delete `/var/log/auth.log` to erase evidence — logs shipped to a remote server before the compromise cannot be retroactively deleted.

**Why It Matters:** Log integrity is a regulatory requirement under PCI-DSS (Requirement 10), ISO 27001 (A.12.4), and SOC 2 (CC7.2). Beyond compliance, incident response teams rely on centralized logs to reconstruct attack timelines. A common attacker technique is to clear local logs (via `echo > /var/log/auth.log` or `rm -rf /var/log/`) to cover their tracks — centralized log forwarding makes this evidence destruction futile, preserving the forensic trail needed to understand the scope of a breach and prevent recurrence.

---

## Example 26: Password Policy with PAM pam_pwquality

**What this covers:** PAM (Pluggable Authentication Modules) provides a modular authentication framework that allows enforcement of password quality rules at the OS level. `pam_pwquality` validates new passwords against complexity rules including minimum length, character class requirements, and history checking.

**Scenario:** You are enforcing a NIST SP 800-63B-aligned password policy on Ubuntu 22.04 that requires a minimum length of 15 characters and rejects passwords from a known-bad-password list.

```bash
# Install pam_pwquality if not already present
sudo apt-get install -y libpam-pwquality
# => (package installed or already present)

# Configure pam_pwquality in the common-password PAM stack
sudo nano /etc/pam.d/common-password
```

```
# /etc/pam.d/common-password — PAM password quality configuration
# This file is included by all services that update passwords

# --- pam_pwquality module settings ---
# retry=3: allow 3 attempts before failing the password change
# minlen=15: NIST SP 800-63B minimum length for memorized secrets is 8; 15 is stronger
# dcredit=0: do NOT require digits (complexity rules add little entropy; length is better)
# ucredit=0: do NOT require uppercase (same rationale: NIST recommends against mandatory complexity)
# lcredit=0: do NOT require lowercase
# ocredit=0: do NOT require special characters
# difok=5: new password must differ from old password in at least 5 characters
# reject_username: reject passwords containing the username
# dictcheck=1: check against cracklib dictionary (common words, keyboard walks)
# enforce_for_root: enforce policy even when root changes another user's password

password  requisite  pam_pwquality.so \
    retry=3 \
    minlen=15 \
    dcredit=0 \
    ucredit=0 \
    lcredit=0 \
    ocredit=0 \
    difok=5 \
    reject_username \
    dictcheck=1 \
    enforce_for_root

# After quality check passes, update the password hash using SHA-512
# remember=5: reject the last 5 passwords (prevents cycling)
# sha512: use SHA-512 algorithm for the password hash in /etc/shadow
password  [success=1 default=ignore]  pam_unix.so \
    obscure \
    use_authtok \
    try_first_pass \
    sha512 \
    remember=5

# Required fallback
password  requisite  pam_deny.so
password  required   pam_permit.so
```

```bash
# Test the password policy by attempting to set a weak password
sudo passwd testuser
# => New password: password123
# => BAD PASSWORD: The password is shorter than 15 characters
# => => pam_pwquality rejected it; retry prompt appears

# => New password: correct-horse-battery-staple-plus
# => Retype new password: correct-horse-battery-staple-plus
# => passwd: password updated successfully
# => ^--- 34-character passphrase passes length requirement and dictionary check
```

**Key Takeaway:** NIST SP 800-63B recommends prioritizing password length (minimum 8 characters, prefer 15+) over mandatory character complexity rules — length provides more entropy than rules that lead users to predictable patterns like `P@ssw0rd1`.

**Why It Matters:** Mandatory complexity rules (must contain uppercase, digit, special character) produce predictable password patterns: users capitalize the first letter, add a digit at the end, and append `!`. This makes passwords easier to crack with rule-based attacks in tools like Hashcat, not harder. NIST's 2017 guidance explicitly recommends against mandatory complexity requirements and expiry policies in favor of length requirements, breach corpus checking, and MFA. Aligning your PAM policy with NIST improves actual security while reducing user friction.

---

## Example 27: Account Lockout Policy with PAM pam_faillock

**What this covers:** `pam_faillock` tracks failed authentication attempts and temporarily locks accounts after a configurable number of consecutive failures. This prevents brute-force attacks against local account passwords and PAM-authenticated services.

**Scenario:** You are configuring Ubuntu 22.04 to lock user accounts for 10 minutes after 5 consecutive failed authentication attempts, and verifying the policy works correctly.

```bash
# pam_faillock replaces pam_tally2 on Ubuntu 22.04 and later (pam_tally2 is deprecated)
# Configure pam_faillock in the common-auth stack
sudo nano /etc/pam.d/common-auth
```

```
# /etc/pam.d/common-auth — account lockout policy using pam_faillock

# pam_faillock preauth: check if the account is already locked BEFORE attempting auth
# silent: don't tell the user why authentication is pre-emptively failing (anti-oracle)
# deny=5: lock account after 5 consecutive failures
# fail_interval=900: count failures within a 900-second (15-minute) window
# unlock_time=600: lock lasts 600 seconds (10 minutes); set 0 for permanent (requires admin unlock)
auth    required    pam_faillock.so preauth silent deny=5 fail_interval=900 unlock_time=600

# pam_unix performs the actual password verification
# [success=1]: if pam_unix succeeds, skip one module (the authfail module below)
auth    [success=1 default=bad]    pam_unix.so

# pam_faillock authfail: record this failure (only reached if pam_unix fails)
auth    [default=die]   pam_faillock.so authfail deny=5 fail_interval=900 unlock_time=600

# pam_faillock authsucc: record successful login to reset the failure counter
auth    sufficient      pam_faillock.so authsucc deny=5 fail_interval=900 unlock_time=600

auth    required    pam_permit.so
```

```bash
# Configure faillock global settings
sudo nano /etc/security/faillock.conf
```

```
# /etc/security/faillock.conf
deny = 5              # lock after 5 failures
fail_interval = 900   # within a 15-minute window
unlock_time = 600     # auto-unlock after 10 minutes (600 seconds)
silent                # do not reveal lockout state to the user
audit                 # log lockout events to audit log (syslog)
```

```bash
# Test the lockout policy (run as a test user who knows their password)
# Intentionally fail 5 times with a wrong password to trigger lockout:
# => 5 attempts → account locked

# Check lockout status for a user
sudo faillock --user testuser
# => testuser:
# => When                Type  Source                           Valid
# => 2026-05-21 14:50:01 RHOST 203.0.113.10                        V
# => 2026-05-21 14:50:02 RHOST 203.0.113.10                        V
# => 2026-05-21 14:50:03 RHOST 203.0.113.10                        V
# => 2026-05-21 14:50:04 RHOST 203.0.113.10                        V
# => 2026-05-21 14:50:05 RHOST 203.0.113.10                        V
# => ^--- 5 failures recorded; account is now locked

# Manually unlock an account before the auto-unlock timer expires (e.g., for a legitimate user)
sudo faillock --user testuser --reset
# => (failure counter cleared; account is immediately unlocked)

# Verify the account is unlocked
sudo faillock --user testuser
# => testuser:
# => When                Type  Source  Valid
# => (empty — no failures recorded; account is unlocked)
```

**Key Takeaway:** Set `unlock_time` to a non-zero value for automatic unlock — a value of `0` (permanent lockout) combined with `deny=5` enables a denial-of-service attack where anyone who knows an account name can permanently lock it with 5 failed login attempts.

**Why It Matters:** Account lockout policies must balance security against DoS risk. Too aggressive (3 failures, permanent lockout) makes your lockout policy into a DoS vector. Too permissive (100 failures before lockout) allows brute-force attacks. The combination of `deny=5` with `fail_interval=900` and `unlock_time=600` creates a practical policy: enough failures to absorb typing mistakes, a window that catches automated attacks, and automatic recovery that prevents lockout-based DoS while still stopping brute-force tools that typically operate at hundreds of attempts per second.

---

## Example 28: Detecting New SUID Binaries After Installation

**What this covers:** Establishing a baseline of SUID binaries and comparing it after package installations or system changes detects unauthorized privilege escalation vectors introduced by new software. Automating this comparison as a post-install check closes the gap between deployment and audit.

**Scenario:** You want to create a SUID binary baseline on a clean Ubuntu 22.04 server and then write a script that can be run after any package installation to detect newly added SUID binaries.

```bash
#!/bin/bash
# suid_baseline.sh — SUID binary baseline and comparison tool
# Usage:
#   ./suid_baseline.sh baseline   → create initial baseline file
#   ./suid_baseline.sh check      → compare current state to baseline and report differences

BASELINE_FILE="/etc/security/suid_baseline.txt"
# Store baseline in /etc/security so it is owned by root and not writable by other users

MODE="${1:-check}"   # default to 'check' if no argument provided

# Function: scan filesystem for SUID and SGID binaries
scan_suid_files() {
    # Find SUID (4000) and SGID (2000) set-ID binaries
    # Exclude /proc and /sys to avoid false positives from kernel virtual filesystems
    # Sort output for deterministic comparison
    sudo find / \( -perm -4000 -o -perm -2000 \) -type f \
        ! -path "/proc/*" ! -path "/sys/*" ! -path "/dev/*" \
        -printf "%p %m %U\n" \
        2>/dev/null | sort
    # => Output format: /path/to/binary  permissions  owner
    # => Example: /usr/bin/sudo 4755 root
}

if [ "$MODE" = "baseline" ]; then
    echo "[*] Creating SUID/SGID baseline..."
    scan_suid_files > "$BASELINE_FILE"
    # => Write all current set-ID binaries to baseline file
    chmod 600 "$BASELINE_FILE"
    # => Only root can read/write the baseline; prevents attacker from modifying it
    wc -l "$BASELINE_FILE"
    # => 23 /etc/security/suid_baseline.txt   ← 23 set-ID binaries on a clean Ubuntu 22.04
    echo "[+] Baseline saved to $BASELINE_FILE"

elif [ "$MODE" = "check" ]; then
    echo "[*] Checking for new SUID/SGID binaries since baseline..."
    CURRENT=$(scan_suid_files)
    # => Capture current scan result in a variable

    # Compare: show lines in current scan that are NOT in the baseline
    NEW_SUID=$(diff <(cat "$BASELINE_FILE") <(echo "$CURRENT") | grep "^>" | sed 's/^> //')
    # => diff outputs: < = only in baseline (removed), > = only in current (new)
    # => We filter for '>' lines (newly appeared binaries)

    if [ -z "$NEW_SUID" ]; then
        echo "[OK] No new SUID/SGID binaries detected."
        # => Clean result: no changes since baseline was taken
    else
        echo "[ALERT] New SUID/SGID binaries detected!"
        echo "$NEW_SUID"
        # => /usr/local/bin/custom_tool 4755 root   ← newly installed SUID binary
        # => This line should trigger a security review before accepting the change
        exit 1
        # => Exit code 1 signals to CI/CD pipelines that human review is required
    fi

    # Also report binaries removed since baseline (could indicate tampering)
    REMOVED_SUID=$(diff <(cat "$BASELINE_FILE") <(echo "$CURRENT") | grep "^<" | sed 's/^< //')
    if [ -n "$REMOVED_SUID" ]; then
        echo "[INFO] SUID/SGID binaries removed since baseline (verify intentional):"
        echo "$REMOVED_SUID"
        # => Removal can also be suspicious if it covers up a previously added binary
    fi
fi
```

```bash
# Create the initial baseline on a clean system
sudo bash suid_baseline.sh baseline
# => [*] Creating SUID/SGID baseline...
# => 23 /etc/security/suid_baseline.txt
# => [+] Baseline saved to /etc/security/suid_baseline.txt

# Simulate installing a package that adds a SUID binary
sudo apt-get install -y at          # 'at' command scheduler adds a SUID binary
# => (package installed; /usr/bin/at gains the SUID bit)

# Run the check to detect the new SUID binary
sudo bash suid_baseline.sh check
# => [*] Checking for new SUID/SGID binaries since baseline...
# => [ALERT] New SUID/SGID binaries detected!
# => /usr/bin/at 2755 daemon   ← detected; decide if this is expected and update baseline

# If the new SUID binary is expected (e.g., from a legitimate package), update the baseline
sudo bash suid_baseline.sh baseline
# => [+] Baseline saved with updated state
```

**Key Takeaway:** A SUID binary audit is only useful when compared against a known-good baseline — a point-in-time scan without comparison cannot distinguish expected SUID binaries from ones an attacker added.

**Why It Matters:** Attackers who achieve temporary root access often install a SUID backdoor to re-enter the system later: a copy of `/bin/bash` with the SUID root bit set allows any user who finds it to run `./bash -p` and get a root shell. Baseline comparison automation catches this immediately after the attacker's access is terminated. Integrating the check script into a CI/CD deployment pipeline or a nightly cron job means SUID changes are reviewed within hours of occurrence, rather than months later during an ad-hoc audit.
