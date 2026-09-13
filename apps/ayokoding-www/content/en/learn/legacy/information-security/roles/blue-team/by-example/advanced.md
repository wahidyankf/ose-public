---
title: "Advanced"
weight: 10000003
date: 2026-05-21T00:00:00+07:00
draft: false
description: "Blue team advanced examples — threat hunting, detection engineering, and advanced incident response (Examples 58–85)"
tags: ["blue-team", "advanced", "by-example"]
---

## Example 58: APT Detection with Multi-Stage Correlation

**What this covers:** Advanced persistent threat actors rarely trigger a single alert — they leave a breadcrumb trail across multiple event types separated by hours or days. Chaining correlation searches lets you connect reconnaissance, lateral movement, and exfiltration into a single high-confidence finding. This example shows how to join three independent Splunk saved searches into one APT composite alert.

**Scenario:** Your SOC suspects an APT group has compromised an internal host. You need to correlate port-scanning activity, a new service creation, and outbound data transfer into a single correlated alert with a shared pivot field (`src_ip`).

```splunk
| savedsearch "APT_Stage1_PortScan"
| eval stage="recon"
| append
    [ search index=wineventlog EventCode=7045 earliest=-24h@h
    | eval stage="persistence" ]
| append
    [ search index=proxy_logs bytes_out>5000000 earliest=-24h@h
    | eval stage="exfil" ]
| stats values(stage) as stages, values(dest_ip) as destinations
       dc(stage) as stage_count by src_ip
| where stage_count >= 3
| eval alert_confidence=case(
    stage_count=3, "HIGH",
    stage_count=2, "MEDIUM",
    true(),        "LOW"
  )
| table src_ip, stages, destinations, stage_count, alert_confidence
```

```
| savedsearch "APT_Stage1_PortScan"
```

```
# => Loads results of a pre-built saved search that detected port scans
# => in the last 24 hours; stage-1 recon evidence
```

```
| eval stage="recon"
```

```
# => Tags every row from the port-scan search with stage label "recon"
```

```
| append [ search index=wineventlog EventCode=7045 earliest=-24h@h
```

```
# => EventCode 7045 = new Windows service installed; common persistence mechanism
# => append keeps results from the port-scan search AND adds these rows
```

```
| eval stage="persistence" ]
```

```
# => Tags the service-install events with stage label "persistence"
```

```
| append [ search index=proxy_logs bytes_out>5000000 earliest=-24h@h
```

```
# => Finds large outbound transfers (>5 MB) through the corporate proxy
# => bytes_out>5000000 catches bulk file exfiltration; tune threshold per baseline
```

```
| eval stage="exfil" ]
```

```
# => Tags outbound-transfer events with stage label "exfil"
```

```
| stats values(stage) as stages, values(dest_ip) as destinations
       dc(stage) as stage_count by src_ip
```

```
# => dc(stage) = distinct count of stages seen per source IP
# => Three distinct stages means one host touched recon, persistence, and exfil
```

```
| where stage_count >= 3
```

```
# => Only surface hosts that hit all three APT stages — reduces noise significantly
```

```
| eval alert_confidence=case(stage_count=3,"HIGH",...)
```

```
# => Assigns HIGH confidence only when all three stages are confirmed
```

**Key Takeaway:** Chaining saved searches with `append` and aggregating by a shared pivot field (`src_ip`) lets you build multi-stage APT detections that no single-event rule could produce.

**Why It Matters:** Single-event alerts generate enormous false-positive rates against APT activity because individual behaviors (a port scan, a new service, a large upload) are each common in isolation. Multi-stage correlation drastically raises confidence by requiring an attacker to leave evidence across the full attack chain. This approach also creates a natural severity ladder: two stages triggers a medium alert for analyst review, three stages triggers a high-confidence incident automatically.

---

## Example 59: Detecting Golden Ticket Attack

**What this covers:** A Golden Ticket attack forges a Kerberos TGT using a stolen KRBTGT hash, granting unlimited access to any resource in the domain. Detectors focus on Event ID 4769 (Kerberos service ticket request) with ticket lifetimes that exceed domain policy or use downgraded encryption. This example queries Windows Security logs for exactly those anomalies.

**Scenario:** Your threat intelligence team has flagged KRBTGT hash theft as a risk after a domain controller compromise. You need a KQL query for Microsoft Sentinel that fires when forged tickets appear in your environment.

```kql
SecurityEvent
| where TimeGenerated > ago(1d)
| where EventID == 4769                          // => Kerberos Service Ticket Request
| extend TicketOptions   = tostring(EventData.TicketOptions)
| extend EncryptionType  = tostring(EventData.TicketEncryptionType)
| extend ServiceName     = tostring(EventData.ServiceName)
| extend ClientAddress   = tostring(EventData.IpAddress)
| extend TicketLifetime  = toint(EventData.TransmittedServices)
| where EncryptionType == "0x17"                 // => RC4-HMAC; modern DCs prefer AES
                                                 // => Golden Tickets default to RC4
| where ServiceName !in ("krbtgt", "kadmin")    // => Exclude normal TGT renewals
| where ClientAddress !startswith "::1"          // => Exclude localhost loopback
| summarize
    RequestCount    = count(),
    UniqueServices  = dcount(ServiceName),
    Targets         = make_set(ServiceName, 20)
    by ClientAddress, bin(TimeGenerated, 1h)
| where RequestCount > 10                        // => Burst of RC4 tickets = suspicious
| extend Severity = iff(RequestCount > 50, "Critical", "High")
| project TimeGenerated, ClientAddress, RequestCount,
          UniqueServices, Targets, Severity
| order by RequestCount desc
```

**Key Takeaway:** Golden Tickets are detectable by combining RC4-HMAC encryption type (0x17), high service ticket request volume, and requests for services that legitimate users would not access in bulk.

**Why It Matters:** Without KRBTGT hash rotation and ticket anomaly detection, a Golden Ticket gives an attacker persistent, nearly invisible access that survives password resets. Detecting downgraded encryption is particularly effective because modern Active Directory environments enforce AES by default; any RC4 service ticket request from a modern workstation is suspicious by definition, making it a high signal-to-noise indicator.

---

## Example 60: Detecting Kerberos Delegation Abuse

**What this covers:** Unconstrained and constrained Kerberos delegation allows services to impersonate users by forwarding their tickets. Attackers abuse delegation-enabled accounts to capture TGTs from domain controllers, effectively gaining domain admin credentials. Detection focuses on Event ID 4769 where a workstation account (not a service account) requests forwarded tickets.

**Scenario:** Your AD hardening review found several workstation machine accounts configured for unconstrained delegation — a finding the attacker could abuse. You want a Splunk search that flags ticket forwarding originating from workstation-class accounts.

```splunk
index=wineventlog EventCode=4769 earliest=-4h@h
| eval AccountName = mvindex(split(Account_Name, "@"), 0)
| eval AccountDomain = mvindex(split(Account_Name, "@"), 1)
| where like(AccountName, "%$")                  | eval AccountType="machine"
| where TicketOptions="0x60810010"               | eval DelegationType="Forwarded+Forwardable"
| lookup approved_delegation_accounts AccountName OUTPUT approved
| where isnull(approved) OR approved!="true"     | eval BaselineStatus="NOT_APPROVED"
| stats
    count                    as TicketCount,
    values(ServiceName)      as RequestedServices,
    values(ClientAddress)    as SourceIPs
    by AccountName, AccountDomain, DelegationType, BaselineStatus
| where TicketCount > 0
| eval RiskScore = case(
    TicketCount > 100, 90,
    TicketCount > 10,  70,
    true(),            40
  )
| table AccountName, AccountDomain, TicketCount,
        RequestedServices, DelegationType, RiskScore, BaselineStatus
| sort - RiskScore
```

```
| where like(AccountName, "%$")
```

```
# => Machine accounts end with "$" in AD; workstations should not forward tickets
# => Legitimate delegation actors are usually service accounts without "$" suffix
```

```
| where TicketOptions="0x60810010"
```

```
# => Ticket option flags: Forwardable (0x40000000) + Forwarded (0x20000000) combined
# => This bitmask means the ticket was both marked forwardable AND actively forwarded
```

```
| lookup approved_delegation_accounts AccountName OUTPUT approved
```

```
# => Compares against a CSV lookup of accounts pre-approved for delegation
# => Anything not in that list is treated as anomalous
```

**Key Takeaway:** Restricting detection to machine accounts (ending in `$`) that request forwarded tickets and are absent from an approved-delegation baseline dramatically reduces false positives while catching delegation abuse early.

**Why It Matters:** Kerberos delegation abuse is a favourite lateral movement technique because it requires no malware and leaves minimal artifacts. Attackers compromise a delegation-enabled machine, then use tools like Rubeus to harvest TGTs from any user that authenticates to the machine. A baseline-driven lookup approach means your detection adapts automatically as your environment's legitimate delegation list changes.

---

## Example 61: Detecting ADCS ESC1 Abuse

**What this covers:** Active Directory Certificate Services (ADCS) ESC1 is a misconfiguration where a certificate template allows requesters to supply a Subject Alternative Name (SAN), which attackers use to impersonate any user including domain admins. Event ID 4886 logs certificate requests and includes the template name and SAN field. This example surfaces mismatched SANs that do not match the requester's own identity.

**Scenario:** After reading the SpecterOps ADCS research, your team wants a KQL sentinel alert that fires whenever a certificate is issued with a SAN that does not match the requesting account's UPN.

```kql
SecurityEvent
| where EventID == 4886                                    // => Certificate Services: certificate issued
| extend CertTemplate  = tostring(EventData.CertificateTemplate)
| extend RequesterUPN  = tostring(EventData.RequesterName) // => Who requested the cert (UPN format)
| extend SubjectAltName = tostring(EventData.SubjectAltName)
| extend CommonName     = tostring(EventData.CertificateDNSName)
| where isnotempty(SubjectAltName)                         // => Only care about SAN-bearing certs
| extend SANUser = extract(@"upn=([^,]+)", 1, SubjectAltName)
                                                           // => Pull UPN value from SAN field
| where isnotempty(SANUser)                                // => Only UPN-type SANs are relevant for ESC1
| where SANUser !contains RequesterUPN                     // => SAN UPN differs from requester = ESC1 candidate
| project
    TimeGenerated,
    RequesterUPN,
    SANUser,
    CertTemplate,
    CommonName,
    SubjectAltName
| extend Verdict = "ESC1_CANDIDATE"
| order by TimeGenerated desc
```

```
| where EventID == 4886
```

```
# => Logged by the CA when a certificate is successfully issued
# => Pair with 4887 (request approved) for full audit trail
```

```
| extend SANUser = extract(@"upn=([^,]+)", 1, SubjectAltName)
```

```
# => Regex extracts the UPN value from a multi-value SAN string
# => e.g. "DNS=host.corp.example, upn=admin@corp.example" → "admin@corp.example"
```

```
| where SANUser !contains RequesterUPN
```

```
# => Core ESC1 indicator: requester asked for a cert that impersonates someone else
# => Legitimate templates never require a SAN that differs from the requester
```

**Key Takeaway:** ESC1 abuse is detectable by comparing the SAN UPN in the issued certificate against the requesting account's own UPN — any mismatch is a high-confidence indicator of certificate-based impersonation.

**Why It Matters:** ADCS-based attacks grant attackers Kerberos TGTs and NTLM hashes for any account they choose to impersonate, all without touching LSASS or dropping malware. Certificates are valid for months, making them persistent credentials that survive password resets. Early detection via 4886 monitoring is the primary control point because certificate revocation after the fact is operationally disruptive.

---

## Example 62: Detecting DKOM with Volatility

**What this covers:** Direct Kernel Object Manipulation (DKOM) is a rootkit technique that unlinks a running process from the Windows `_EPROCESS` doubly-linked list, hiding it from tools that walk that list (like Task Manager). Volatility's `pslist` walks the list while `psscan` scans raw memory — processes visible in `psscan` but missing from `pslist` are DKOM-hidden. This example scripts that comparison.

**Scenario:** Memory acquired from a suspected rootkit host needs analysis. You run Volatility3 to identify any DKOM-hidden processes before beginning live response.

```python
#!/usr/bin/env python3
"""
dkom_detector.py  —  Compare pslist vs psscan to find DKOM-hidden processes.
Requires: volatility3 installed and importable; memory image path as argv[1]
"""

import subprocess
import json
import sys

MEMORY_IMAGE = sys.argv[1]                        # => Path to .raw or .mem dump file
VOL3         = "vol"                              # => volatility3 CLI entry point

def run_vol(plugin: str) -> list[dict]:
    """Run a volatility3 plugin and return parsed JSON rows."""
    cmd = [VOL3, "-f", MEMORY_IMAGE, "-r", "json", f"windows.{plugin}"]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return json.loads(result.stdout)              # => Volatility3 -r json emits valid JSON

def extract_pids(rows: list[dict], key: str = "PID") -> set[int]:
    """Return set of PIDs from a volatility result list."""
    return {int(row[key]) for row in rows if key in row}
                                                  # => int() normalises string PIDs

pslist_data = run_vol("pslist")                   # => Walks _EPROCESS ActiveProcessLinks list
psscan_data = run_vol("psscan")                   # => Scans full memory for _EPROCESS signatures

pslist_pids  = extract_pids(pslist_data)          # => PIDs visible via linked list
psscan_pids  = extract_pids(psscan_data)          # => PIDs found in raw memory scan

hidden_pids  = psscan_pids - pslist_pids          # => Set difference = DKOM-hidden processes
                                                  # => These PIDs exist in memory but not in the list

if not hidden_pids:
    print("[OK] No DKOM-hidden processes detected.")
    sys.exit(0)

print(f"[ALERT] {len(hidden_pids)} DKOM-hidden PID(s) detected:")
for row in psscan_data:
    if int(row.get("PID", -1)) in hidden_pids:
        pid  = row.get("PID")
        name = row.get("ImageFileName", "UNKNOWN") # => Process name from _EPROCESS struct
        ppid = row.get("PPID", "?")                # => Parent PID for lineage analysis
        print(f"  PID={pid}  Name={name}  PPID={ppid}")
        # => Each printed line is a candidate for further memory extraction
```

**Key Takeaway:** Set-differencing `psscan` PIDs against `pslist` PIDs is the definitive DKOM detection method — any PID in memory but absent from the kernel's process list has been deliberately hidden.

**Why It Matters:** DKOM is a kernel-level persistence technique used by sophisticated rootkits. Because it operates below the OS process API layer, traditional EDR agents that hook user-mode APIs cannot see hidden processes. Memory forensics is the only reliable detection path, making Volatility analysis a mandatory step during any high-severity host compromise investigation.

---

## Example 63: Detecting Process Hollowing

**What this covers:** Process hollowing starts a legitimate process (like `svchost.exe`) in a suspended state, replaces its memory with malicious code, then resumes execution. The hollowed process shows a legitimate name in process listings but runs adversary code. Sysmon Event ID 8 (CreateRemoteThread) combined with unusual parent-child process relationships is the primary detection signal.

**Scenario:** Your EDR flagged unusual `svchost.exe` behaviour. You want a Splunk query combining Sysmon Event ID 8 with process creation data to identify process hollowing candidates.

```splunk
index=sysmon EventCode=8 earliest=-1h@h
| eval SourceImage     = lower(SourceImage)
| eval TargetImage     = lower(TargetImage)
| eval TargetProcess   = mvindex(split(TargetImage, "\\"), -1)  | comment "basename only"
| where TargetProcess IN ("svchost.exe","lsass.exe","explorer.exe","notepad.exe")
                                                                 | comment "high-value hollow targets"
| join type=left TargetProcessId
    [ search index=sysmon EventCode=1 earliest=-1h@h
    | rename ProcessId as TargetProcessId
    | eval ParentImage = lower(ParentImage)
    | eval ExpectedParent = case(
        like(Image,"%%svchost.exe"), "services.exe",
        like(Image,"%%lsass.exe"),   "wininit.exe",
        like(Image,"%%explorer.exe"),"userinit.exe",
        true(), "unknown"
      )                                                          | comment "known-good parent map"
    | eval ParentAnomaly = if(ParentImage!=ExpectedParent,1,0)   | comment "1 = suspicious parent"
    | fields TargetProcessId, ParentImage, ExpectedParent, ParentAnomaly ]
| where ParentAnomaly=1 OR isnull(ParentAnomaly)
| stats
    count            as InjectionCount,
    values(SourceImage) as Injectors,
    values(ParentImage) as ObservedParents,
    values(ExpectedParent) as KnownGoodParents
    by TargetImage, TargetProcessId
| eval Verdict = if(InjectionCount > 0, "HOLLOW_CANDIDATE", "REVIEW")
| table TargetImage, TargetProcessId, InjectionCount,
        Injectors, ObservedParents, KnownGoodParents, Verdict
```

```
| where TargetProcess IN ("svchost.exe","lsass.exe","explorer.exe","notepad.exe")
```

```
# => Attackers hollow high-trust processes to blend into normal traffic
# => svchost.exe is most common; lsass.exe hollowing grants credential access
```

```
| eval ExpectedParent = case(like(Image,"%%svchost.exe"), "services.exe", ...)
```

```
# => Hard-codes the known-good parent for each target process
# => services.exe always spawns svchost.exe; any other parent is anomalous
```

```
| eval ParentAnomaly = if(ParentImage!=ExpectedParent,1,0)
```

```
# => Binary flag: 1 means the process has a parent that violates the expected chain
# => Combined with CreateRemoteThread (Event 8), this is high-confidence hollowing
```

**Key Takeaway:** Correlating CreateRemoteThread events (Sysmon ID 8) with parent-process anomaly detection surfaces process hollowing that no single event source can reliably detect alone.

**Why It Matters:** Process hollowing is a code-injection technique that evades name-based allowlisting because the hollowed process appears legitimate in every process enumeration API. Defenders must combine injection event data with process lineage analysis to surface anomalies. This detection pattern catches the technique at the injection moment rather than waiting for downstream malicious behaviour.

---

## Example 64: Detecting Fileless Malware

**What this covers:** Fileless malware executes entirely in memory — it downloads and runs shellcode or scripts without writing executables to disk, evading traditional file-based antivirus scanners. PowerShell-based fileless attacks are detectable through Script Block Logging (Event ID 4104), which captures the decoded content of executed scripts including in-memory payloads. This example searches for common fileless indicators in decoded script blocks.

**Scenario:** Your SIEM ingests PowerShell Script Block Logging events. You want a KQL rule that surfaces in-memory download-and-execute patterns characteristic of fileless malware.

```kql
SecurityEvent
| where EventID == 4104                                           // => PowerShell Script Block Logging
| extend ScriptBlock = tostring(EventData.ScriptBlockText)
| extend ScriptPath  = tostring(EventData.Path)
| where isnotempty(ScriptBlock)
| extend IsFileless = (
    ScriptBlock has "IEX"                                         // => Invoke-Expression: execute arbitrary string
    or ScriptBlock has "Invoke-Expression"
    or ScriptBlock has "[System.Reflection.Assembly]::Load("     // => Loads .NET assembly from bytes
    or ScriptBlock has "New-Object Net.WebClient"                 // => Downloads content over HTTP
    or ScriptBlock has "[Convert]::FromBase64String("             // => Decodes base64 payload in-memory
    or ScriptBlock has "VirtualAlloc"                             // => Win32 API: allocate executable memory
  )
| where IsFileless == true
| extend ScriptLength = strlen(ScriptBlock)                       // => Very long single-liners often obfuscated
| extend HasBase64    = ScriptBlock has_any ("AAAA","QQQQ","TVqQ") // => Common base64 PE header fragments
                                                                  // => TVqQ = "MZ" PE magic in base64
| extend RiskScore = case(
    HasBase64 and ScriptLength > 5000, 95,                        // => Long base64 + download = very high
    HasBase64 or ScriptLength > 5000,  70,
    true(),                            40
  )
| project TimeGenerated, Account, Computer,
          ScriptPath, ScriptLength, HasBase64, RiskScore,
          ScriptBlock = substring(ScriptBlock, 0, 500)            // => Truncate for readability in alert
| order by RiskScore desc
```

**Key Takeaway:** Script Block Logging captures decoded PowerShell before execution, making it the most reliable detection surface for fileless attacks — look for `IEX`, `Assembly::Load`, and base64-encoded PE headers.

**Why It Matters:** Fileless malware avoids every file-hash-based detection control. Script Block Logging was introduced specifically to address this gap: PowerShell decodes obfuscation layers and logs the final script text, giving defenders a clear view of attacker intent. Enabling Event ID 4104 logging on all endpoints is a foundational blue team control that pays dividends across multiple attack technique categories.

---

## Example 65: Building a Detection Pipeline

**What this covers:** A detection pipeline ingests raw log data from endpoints, normalises it, enriches it with threat intelligence, and delivers correlated alerts to analysts. This example shows how a Filebeat → Logstash → Elasticsearch → Kibana alert pipeline is configured, with annotated configurations for each stage. The pipeline uses Sysmon logs as the input source.

**Scenario:** You are standing up a new SIEM stack for a mid-size organisation. You need to wire together Filebeat on endpoints, a Logstash enrichment filter, Elasticsearch indexing, and a Kibana alert rule.

```yaml
# filebeat.yml — runs on each Windows endpoint
filebeat.inputs:
  - type: winlog # => Windows Event Log input module
    event_logs:
      - name:
          Microsoft-Windows-Sysmon/Operational
          # => Sysmon channel; requires Sysmon installed
        ignore_older: 72h # => Skip events older than 3 days on restart
output.logstash:
  hosts: ["logstash.corp.example:5044"] # => Send to Logstash for enrichment
  ssl.enabled: true # => Encrypt in-transit; use mutual TLS in prod
  ssl.certificate_authorities: ["/etc/filebeat/ca.crt"]
```

```yaml
# logstash.conf — enrichment and normalisation filter
filter {
  if [winlog][channel] =~ "Sysmon" {
    mutate {
      rename => { "[winlog][event_data][Image]" => "[process][executable]" }
                                        # => Normalise field names to ECS schema
      rename => { "[winlog][event_data][CommandLine]" => "[process][command_line]" }
    }
    geoip {
      source => "[source][ip]"          # => Enrich external IPs with geo location
      target => "[source][geo]"
    }
    translate {
      field       => "[winlog][event_id]"
      destination => "[event][action]"
      dictionary  => {                  # => Human-readable event action labels
        "1"  => "process_creation"
        "3"  => "network_connection"
        "8"  => "create_remote_thread"
        "11" => "file_created"
      }
    }
  }
}
output {
  elasticsearch {
    hosts     => ["https://es01.corp.example:9200"]
    index     => "sysmon-%{+YYYY.MM.dd}"  # => Daily index rotation for retention mgmt
    user      => "logstash_writer"
    password  => "${LOGSTASH_ES_PASS}"    # => Read from environment; never hardcode
  }
}
```

```
# Kibana alert rule (KQL detection rule — created via API or Stack Management UI)
# POST kbn:/api/alerting/rule
{
  "name": "Sysmon CreateRemoteThread to lsass",
  "rule_type_id": ".es-query",          # => Elasticsearch query rule type
  "schedule": { "interval": "5m" },    # => Evaluate every 5 minutes
  "params": {
    "index": ["sysmon-*"],
    "body": {
      "query": {
        "bool": {
          "must": [
            { "term": { "winlog.event_id": "8" } },
                                        # => CreateRemoteThread event
            { "term": { "winlog.event_data.TargetImage.keyword":
                        "C:\\Windows\\System32\\lsass.exe" } }
                                        # => Target is LSASS — credential theft indicator
          ]
        }
      }
    },
    "threshold": 1,                     # => Alert on first occurrence (zero tolerance)
    "threshold_comparator": ">="
  }
}
```

**Key Takeaway:** A three-stage pipeline (collect → enrich → alert) with ECS normalisation at the Logstash stage enables consistent detection rules regardless of which endpoint agent collected the data.

**Why It Matters:** Without normalisation, every detection rule must account for field-name variations across agents, OS versions, and log sources — multiplying rule maintenance costs. ECS normalisation at ingest time is a force multiplier: a single detection rule written against ECS fields works across Windows, Linux, and cloud sources simultaneously, reducing the total rule estate and improving coverage consistency.

---

## Example 66: SOAR Playbook Design

**What this covers:** Security Orchestration, Automation, and Response (SOAR) platforms automate repetitive analyst tasks like phishing email triage. This example shows a Cortex XSOAR playbook pseudocode that ingests a phishing alert, extracts IOCs, enriches them, quarantines the sender, and notifies the affected user — all without manual intervention for clear-cut cases.

**Scenario:** Your SOC receives 50-100 phishing reports per day. You want a SOAR playbook that handles triage automatically, escalating only ambiguous cases to analysts.

```python
# cortex_xsoar_phishing_playbook.py  (pseudocode representation of XSOAR playbook tasks)
# Actual XSOAR playbooks are YAML-defined; this mirrors the task logic for documentation.

def playbook_phishing_triage(incident: dict) -> dict:
    """
    Automated phishing triage playbook.
    Returns disposition: AUTO_CLOSED | ESCALATED | QUARANTINED
    """
    # Task 1: Extract email artefacts
    email_body    = incident["email"]["body"]              # => Raw email content from mail gateway
    sender        = incident["email"]["from"]              # => Sender address (may be spoofed)
    attachments   = incident["email"]["attachments"]       # => List of attachment metadata dicts
    urls          = extract_urls(email_body)               # => Regex + URL decoder; expands short URLs
    hashes        = [a["sha256"] for a in attachments]     # => SHA256 per attachment for TI lookup

    # Task 2: Threat intelligence enrichment
    url_verdicts  = virustotal.lookup_urls(urls)           # => VT API; >=3 detections = malicious
    hash_verdicts = virustotal.lookup_hashes(hashes)       # => Same threshold: >=3 engines = malicious
    sender_rep    = proofpoint_tap.get_sender_score(sender)
                                                           # => 0-100 score; >75 = known phishing sender

    # Task 3: Disposition logic
    malicious_urls    = [u for u,v in url_verdicts.items()  if v["positives"] >= 3]
    malicious_hashes  = [h for h,v in hash_verdicts.items() if v["positives"] >= 3]
    is_high_risk      = bool(malicious_urls or malicious_hashes or sender_rep > 75)
                                                           # => Any confirmed IOC = high risk

    if not is_high_risk:
        close_incident(incident, reason="No malicious indicators found")
        return {"disposition": "AUTO_CLOSED"}              # => Low-risk: analyst time saved

    # Task 4: Automated containment
    quarantine_email(incident["email"]["message_id"])      # => Removes from all mailboxes via API
    block_sender(sender, policy="spam_filter")             # => Adds to gateway blocklist
    for url in malicious_urls:
        block_url(url, policy="proxy_blocklist")           # => Blocks at proxy for all users

    # Task 5: Notification and evidence collection
    notify_user(
        recipient = incident["email"]["to"],
        template  = "phishing_confirmed_user_notice",      # => Pre-approved email template
        evidence  = {"urls": malicious_urls, "sender": sender}
    )
    attach_evidence(incident, {                            # => Attach artefacts to incident for audit
        "malicious_urls": malicious_urls,
        "malicious_hashes": malicious_hashes,
        "sender_score": sender_rep
    })

    # Task 6: Escalation decision
    if len(malicious_urls) > 5 or any(v["positives"] >= 40 for v in hash_verdicts.values()):
        escalate_to_analyst(incident, priority="HIGH")     # => Widespread campaign or weaponised attachment
        return {"disposition": "ESCALATED"}

    close_incident(incident, reason="Contained automatically")
    return {"disposition": "QUARANTINED"}                  # => Contained without analyst touch
```

**Key Takeaway:** A SOAR playbook automates the repetitive enrichment-and-containment loop, reserving analyst time for genuinely ambiguous or high-severity cases that require human judgment.

**Why It Matters:** Phishing is the most common initial access vector and volume-overwhelms manual triage. SOAR automation reduces mean-time-to-contain from hours (manual queue) to minutes (automated), dramatically shrinking the window between email delivery and credential harvest or malware execution. The escalation logic ensures automation never silently fails on high-severity campaigns.

---

## Example 67: Writing a Detection-as-Code Test

**What this covers:** Detection-as-code treats detection rules as software artefacts with version control, automated testing, and CI pipelines. This example shows how to write a Python unit test using `sigma-cli` to validate that a Sigma YAML rule compiles to valid Splunk SPL and produces the expected query structure — catching regressions before rules reach production.

**Scenario:** Your team maintains a Sigma rule library. You want a pytest test that validates a specific rule compiles correctly and contains required field references.

```python
# test_sigma_lsass_dump.py
import subprocess
import pytest
import yaml
from pathlib import Path

RULE_PATH   = Path("rules/credential_access/lsass_memory_dump.yml")
                                        # => Path to the Sigma rule under test
BACKEND     = "splunk"                  # => Target SIEM backend for compilation
PIPELINE    = "splunk_windows_sysmon"   # => Field-mapping pipeline for Sysmon events

@pytest.fixture
def rule_content() -> dict:
    """Load and parse the Sigma rule YAML."""
    return yaml.safe_load(RULE_PATH.read_text())
                                        # => Parsed as dict; validates YAML syntax on load

def test_rule_metadata_complete(rule_content: dict):
    """Verify required Sigma rule fields are present."""
    assert "title"       in rule_content,  "Rule must have a title"
    assert "description" in rule_content,  "Rule must have a description"
    assert "tags"        in rule_content,  "Rule must have ATT&CK tags"
    assert "level"       in rule_content,  "Rule must have a severity level"
                                           # => Ensures rule is catalogued for coverage mapping

def test_rule_compiles_to_splunk():
    """Compile the Sigma rule to Splunk SPL and verify output is non-empty."""
    result = subprocess.run(
        ["sigma", "convert", "-t", BACKEND, "-p", PIPELINE, str(RULE_PATH)],
                                           # => sigma-cli convert command
        capture_output=True,
        text=True
    )
    assert result.returncode == 0,     f"Compilation failed: {result.stderr}"
                                           # => Non-zero exit = syntax error in rule
    assert len(result.stdout.strip()) > 0, "Compiled SPL must not be empty"
    return result.stdout                   # => SPL string for further assertion

def test_compiled_query_references_lsass():
    """Verify compiled SPL references the key indicator field."""
    result = subprocess.run(
        ["sigma", "convert", "-t", BACKEND, "-p", PIPELINE, str(RULE_PATH)],
        capture_output=True, text=True
    )
    spl = result.stdout.lower()
    assert "lsass" in spl,       "SPL must reference lsass process name"
                                           # => Core indicator must survive pipeline translation
    assert "eventcode" in spl or "event_id" in spl,
                                 "SPL must reference event ID field"
                                           # => Field must map correctly through pipeline

@pytest.mark.parametrize("required_tag", [
    "attack.credential_access",            # => ATT&CK tactic tag
    "attack.t1003.001",                    # => LSASS Memory sub-technique
])
def test_rule_has_attack_tags(rule_content: dict, required_tag: str):
    """Verify the rule maps to the correct ATT&CK technique."""
    tags = rule_content.get("tags", [])
    assert required_tag in tags, f"Rule must include ATT&CK tag: {required_tag}"
                                           # => Missing tag breaks coverage mapping in navigator
```

**Key Takeaway:** Treating Sigma rules as testable code — with metadata validation, compilation checks, and field-reference assertions — prevents silent rule breakage when pipelines or backends change.

**Why It Matters:** Detection rules are code: they have bugs, they break when field mappings change, and they accumulate technical debt. A CI pipeline that runs detection unit tests before merging rule changes catches regressions in seconds rather than discovering them during an active incident. This practice, called detection-as-code, is the difference between a detection library that improves over time and one that quietly degrades.

---

## Example 68: Detection Rule Lifecycle

**What this covers:** Detection rules are not static artifacts — they follow a lifecycle from initial write through testing, production tuning, and eventual retirement. This example shows an annotated shell workflow that automates each lifecycle stage using sigma-cli, a staging Splunk instance, and a Git-based rule registry.

**Scenario:** Your detection engineering team wants a documented, automatable lifecycle for managing detection rules from authorship to retirement.

```bash
#!/usr/bin/env bash
# detection_lifecycle.sh  — Automate detection rule lifecycle stages
# Usage: ./detection_lifecycle.sh <rule.yml> <stage>
# Stages: write | test | tune | retire

set -euo pipefail
RULE="$1"                                          # => Sigma YAML rule file path
STAGE="${2:-test}"                                 # => Default to test stage if not specified
REGISTRY_DIR="./rules"                             # => Git-tracked rule registry directory
STAGING_URL="https://splunk-staging.corp.example"    # => Staging SIEM; never run new rules on prod first

case "$STAGE" in
  write)
    # Stage 1: Validate rule YAML schema before committing
    sigma check "$RULE"                            # => Validates against Sigma schema; exits non-zero on error
    yamllint -d relaxed "$RULE"                    # => Additional YAML linting for style consistency
    echo "[WRITE] Rule schema valid: $RULE"
    ;;

  test)
    # Stage 2: Compile to backend and run against staging data
    sigma convert -t splunk -p splunk_windows_sysmon "$RULE" \
      > /tmp/rule_spl.txt                          # => Compile Sigma → Splunk SPL
    SPL=$(cat /tmp/rule_spl.txt)
    # Run against staging via Splunk REST API and capture hit count
    HIT_COUNT=$(curl -sk -u admin:"$SPLUNK_PASS" \
      "$STAGING_URL/services/search/jobs/export" \
      --data-urlencode "search=$SPL earliest=-7d latest=now" \
      -d output_mode=json |                        # => 7-day lookback on staging data
      python3 -c "import sys,json; [print(r['result'].get('count',0))
                  for l in sys.stdin for r in [json.loads(l)]
                  if r.get('result')]" | tail -1)
    echo "[TEST] Hit count on staging (7d): $HIT_COUNT"
    ;;

  tune)
    # Stage 3: Compute false positive rate against known-good baseline
    TOTAL_EVENTS=10000                             # => Approximate baseline event volume
    FP_RATE=$(echo "scale=2; $HIT_COUNT / $TOTAL_EVENTS * 100" | bc)
                                                   # => FP rate as percentage
    if (( $(echo "$FP_RATE > 5.0" | bc -l) )); then
      echo "[TUNE] FP rate ${FP_RATE}% exceeds 5% threshold — add exclusions"
      echo "[TUNE] Common exclusion: | where NOT src_ip IN (baselines_lookup)"
    else
      echo "[TUNE] FP rate ${FP_RATE}% acceptable — promote to production"
      cp "$RULE" "$REGISTRY_DIR/production/"       # => Move to prod registry directory
      git add "$REGISTRY_DIR/production/$(basename $RULE)"
      git commit -m "feat(detection): promote $(basename $RULE) to production"
    fi
    ;;

  retire)
    # Stage 4: Archive retired rules with retirement reason
    RETIRE_DATE=$(date +%Y-%m-%d)                  # => ISO date for audit trail
    sed -i '' "s/^status:.*/status: deprecated/" "$RULE"
                                                   # => Update Sigma status field
    mv "$RULE" "$REGISTRY_DIR/retired/${RETIRE_DATE}_$(basename $RULE)"
                                                   # => Move to dated retirement directory
    git add -A && git commit -m "chore(detection): retire $(basename $RULE) on $RETIRE_DATE"
    echo "[RETIRE] Rule archived to retired/ directory"
    ;;
esac
```

**Key Takeaway:** Encoding the write-test-tune-retire lifecycle as a scripted workflow enforces consistent gates at each stage and creates an auditable Git history of every rule's evolution.

**Why It Matters:** Unmanaged detection libraries accumulate stale, broken, or high-noise rules that erode analyst trust. A formal lifecycle with automated false-positive rate gating before production promotion prevents alert fatigue and ensures that only quality-validated rules reach analysts. Retirement tracking also prevents the common failure of keeping rules for threats that no longer apply to your environment.

---

## Example 69: Threat Hunt — Lateral Movement Hypothesis

**What this covers:** Threat hunting is a proactive search for attacker activity that has evaded automated detection. A lateral movement hunt starts with a hypothesis ("an attacker with valid credentials is moving between hosts using PsExec or WMI"), defines data sources, then executes a sequence of queries to confirm or refute it. This example shows a step-by-step Splunk hunt sequence.

**Scenario:** Threat intelligence indicates that a ransomware group targeting your industry uses PsExec and WMI for lateral movement. You want to hunt for this behaviour across the last 14 days of endpoint logs.

```splunk
| comment "HUNT STEP 1: Find hosts with PsExec service creation (Event 7045)"
index=wineventlog EventCode=7045 ServiceName=PSEXESVC earliest=-14d@d
| stats count, values(host) as AffectedHosts dc(host) as HostCount by ServiceName
| where HostCount > 0
| outputlookup lateral_movement_candidates.csv    | comment "Save for step 2 join"
```

```splunk
| comment "HUNT STEP 2: Correlate with 4624 logons (Type 3 = network) from same timeframe"
index=wineventlog EventCode=4624 Logon_Type=3 earliest=-14d@d
| inputlookup lateral_movement_candidates.csv
| lookup lateral_movement_candidates.csv host AS Computer OUTPUT host
| where isnotvnull(host)                          | comment "Only hosts in PsExec candidate list"
| eval LogonHour = strftime(_time, "%H")
| where (LogonHour < "06" OR LogonHour > "20")   | comment "Off-hours logons are more suspicious"
| stats
    count                   as OffHourLogons,
    values(Account_Name)    as Accounts,
    values(IpAddress)       as SourceIPs
    by Computer
| where OffHourLogons > 2
```

```splunk
| comment "HUNT STEP 3: Check for WMI remote execution (Sysmon Event 20 = WmiEventConsumer)"
index=sysmon EventCode=20 earliest=-14d@d
| eval Consumer = mvindex(split(Destination, "\\"), -1)
| where len(Consumer) > 0
| stats count, values(host) as Hosts by Consumer, User
| outputlookup wmi_consumers.csv
```

```splunk
| comment "HUNT STEP 4: Aggregate all signals into a single host risk score"
| inputlookup lateral_movement_candidates.csv
| append [inputlookup wmi_consumers.csv | eval Signal="WMI"]
| stats
    dc(Signal)  as SignalCount,
    values(Signal) as Signals
    by host
| eval HuntVerdict = case(
    SignalCount >= 3, "CONFIRMED_SUSPECT",         | comment "3+ signals = escalate"
    SignalCount >= 2, "REVIEW",
    true(),           "MONITOR"
  )
| table host, SignalCount, Signals, HuntVerdict
| sort - SignalCount
```

**Key Takeaway:** Structuring a hunt as sequential steps — each building on the previous via lookup files — creates a reproducible, auditable hypothesis-testing workflow that can be tuned and re-run.

**Why It Matters:** Ad-hoc hunting without structured hypothesis tracking produces irreproducible results that cannot be operationalised into detections. A step-by-step hunt sequence that saves intermediate results enables the team to refine each step independently, measure hypothesis confirmation rate over time, and convert confirmed hunts directly into automated detection rules.

---

## Example 70: Threat Hunt — Living-off-the-Land (LOLBin)

**What this covers:** Living-off-the-land (LOLBin) attacks abuse legitimate Windows binaries like `certutil.exe`, `mshta.exe`, and `regsvr32.exe` to download and execute malicious payloads without introducing foreign executables. Hunting for LOLBin abuse requires examining command-line arguments across 30 days of endpoint data for patterns inconsistent with legitimate administrative use.

**Scenario:** You want to hunt for LOLBin abuse across 30 days of Sysmon process creation logs, identifying binaries used in ways that deviate from their documented legitimate purpose.

```splunk
index=sysmon EventCode=1 earliest=-30d@d
| eval CommandLine = lower(CommandLine)
| eval Image_Base  = lower(mvindex(split(Image, "\\"), -1))  | comment "binary filename only"
| eval LOLBin_Signal = case(
    Image_Base="certutil.exe"
      AND (like(CommandLine,"%-urlcache%") OR like(CommandLine,"%-decode%")),
    "certutil_download_or_decode",
                                             | comment "certutil -urlcache fetches remote files"
    Image_Base="mshta.exe"
      AND (like(CommandLine,"%http%") OR like(CommandLine,"%vbscript%")),
    "mshta_remote_script",
                                             | comment "mshta executing remote HTA or VBScript"
    Image_Base="regsvr32.exe"
      AND (like(CommandLine,"%/i:http%") OR like(CommandLine,"%scrobj.dll%")),
    "regsvr32_squiblydoo",
                                             | comment "Squiblydoo: AppLocker bypass via regsvr32"
    Image_Base="wscript.exe"
      AND like(CommandLine,"%.vbs%"),
    "wscript_vbs_exec",
                                             | comment "VBScript execution; common dropper stage"
    Image_Base="rundll32.exe"
      AND (like(CommandLine,"%javascript%") OR like(CommandLine,"%shell32,control_runDLL%")),
    "rundll32_javascript",
                                             | comment "JavaScript in rundll32 = abuse of export"
    true(), null()
  )
| where isnotnull(LOLBin_Signal)
| stats
    count                   as Occurrences,
    dc(host)                as AffectedHosts,
    values(host)            as HostList,
    values(User)            as Users,
    values(CommandLine)     as Commands
    by LOLBin_Signal, Image_Base
| eval Prevalence = case(
    AffectedHosts > 50, "HIGH",              | comment "Widespread = likely FP or mass campaign"
    AffectedHosts > 5,  "MEDIUM",
    true(),             "LOW"                | comment "Low prevalence = most suspicious"
  )
| sort - Occurrences
| table LOLBin_Signal, Image_Base, Occurrences,
        AffectedHosts, Prevalence, Users, Commands
```

**Key Takeaway:** A prevalence filter (`AffectedHosts`) is essential for LOLBin hunting — widespread use across many hosts typically indicates legitimate administration, while low-prevalence anomalies on a handful of hosts warrant investigation.

**Why It Matters:** LOLBin abuse is the dominant initial-access and execution technique in ransomware and APT campaigns because it requires no new tools and evades most AV products. Thirty-day historical hunts reveal slow-and-low campaigns that generate too few alerts per day to trigger threshold-based detection rules, exposing attacker dwell time that automated detection misses.

---

## Example 71: Threat Hunt — Beaconing Detection

**What this covers:** Command-and-control (C2) beaconing is when malware periodically checks in with a remote server at a regular interval, often with small random jitter to evade exact-interval detection. Statistical analysis of connection timing — specifically computing the coefficient of variation (CV) of inter-connection intervals — reveals low-jitter beaconing that human review would miss in millions of connection logs.

**Scenario:** You want to identify C2 beaconing in 30 days of proxy or firewall logs by computing statistical regularity of outbound connections per destination IP.

```python
#!/usr/bin/env python3
"""
beacon_detector.py  —  Detect C2 beaconing via inter-connection interval jitter analysis.
Input: CSV with columns: timestamp (epoch), src_ip, dest_ip, dest_port
Output: TSV of beacon candidates sorted by beacon confidence score
"""

import pandas as pd
import numpy as np
from pathlib import Path

CONN_LOG = Path("proxy_connections_30d.csv")       # => 30-day proxy/firewall export
MIN_CONNECTIONS = 20                               # => Minimum connections to compute stable stats
MAX_CV          = 0.25                             # => Coefficient of variation threshold
                                                   # => CV < 0.25 = very regular = likely beacon

df = pd.read_csv(CONN_LOG, parse_dates=["timestamp"])
                                                   # => parse_dates converts epoch or ISO8601

df.sort_values(["src_ip", "dest_ip", "dest_port", "timestamp"], inplace=True)
                                                   # => Sort within each connection flow

df["interval_seconds"] = (
    df.groupby(["src_ip", "dest_ip", "dest_port"])["timestamp"]
    .diff()
    .dt.total_seconds()                            # => Timedelta → seconds per connection pair
)

agg = (
    df.groupby(["src_ip", "dest_ip", "dest_port"])["interval_seconds"]
    .agg(
        connection_count = "count",
        mean_interval    = "mean",                 # => Average seconds between beacons
        std_interval     = "std",                  # => Standard deviation of interval
        min_interval     = "min",
        max_interval     = "max",
    )
    .reset_index()
)

agg = agg[agg["connection_count"] >= MIN_CONNECTIONS]
                                                   # => Need enough samples for stats to be meaningful

agg["cv"] = agg["std_interval"] / agg["mean_interval"]
                                                   # => CV = std/mean; dimensionless regularity measure
                                                   # => CV ≈ 0 = perfect beacon; CV > 1 = irregular

beacons = agg[agg["cv"] <= MAX_CV].copy()          # => Filter to low-jitter connections
beacons["beacon_confidence"] = (1 - beacons["cv"]) * 100
                                                   # => Scale to 0-100: higher = more regular

beacons.sort_values("beacon_confidence", ascending=False, inplace=True)

print(beacons[[
    "src_ip", "dest_ip", "dest_port",
    "connection_count", "mean_interval",
    "cv", "beacon_confidence"
]].to_csv(sep="\t", index=False))
# => Output: tab-separated candidate list for analyst review
# => Mean interval column shows the beacon period in seconds
```

**Key Takeaway:** The coefficient of variation (CV = std/mean) of connection intervals provides a dimensionless regularity score — C2 beacons cluster at CV < 0.25 while human-driven browsing is CV > 1.

**Why It Matters:** Human analysts cannot detect regular-interval beaconing by reviewing logs manually at scale. Statistical models process millions of connections in seconds and surface the handful of flows with anomalous regularity. This technique catches C2 frameworks that use jitter settings below 25% — which includes many commodity RATs and some APT-grade implants — with extremely low false-positive rates when combined with a minimum-connection threshold.

---

## Example 72: Threat Hunt — Credential Access

**What this covers:** LSASS (Local Security Authority Subsystem Service) stores credential material in memory, making it the primary target for credential harvesting tools like Mimikatz and ProcDump. Detection hunts for processes that open LSASS with memory-read access (access mask `0x0010`, `0x0410`, or `0x1010`) but are not in a pre-approved baseline of legitimate tools (antivirus, EDR, backup agents).

**Scenario:** You want to hunt for LSASS credential access across the last 7 days of Sysmon logs, comparing against a known-good baseline of processes permitted to read LSASS memory.

```splunk
index=sysmon EventCode=10 TargetImage="*lsass.exe" earliest=-7d@d
| eval GrantedAccess_hex = GrantedAccess                         | comment "Hex access mask field"
| eval IsReadAccess = if(
    match(GrantedAccess, "0x00000010|0x00001010|0x00101010|0x001fffff"),
    1, 0
  )                                                              | comment "Masks that include PROCESS_VM_READ"
| where IsReadAccess=1
| eval SourceBinary = lower(mvindex(split(SourceImage, "\\"), -1))
| lookup approved_lsass_readers SourceBinary OUTPUT approved, business_justification
| eval BaselineStatus = case(
    approved="true",  "APPROVED",                               | comment "In EDR/AV approved list"
    true(),           "UNAPPROVED"                              | comment "Not in baseline = investigate"
  )
| where BaselineStatus="UNAPPROVED"
| stats
    count               as AccessCount,
    dc(host)            as AffectedHosts,
    values(host)        as HostList,
    values(User)        as Users,
    values(CallTrace)   as CallTraces                           | comment "Stack trace field from Sysmon 10"
    by SourceImage, GrantedAccess, BaselineStatus
| eval RiskScore = case(
    AffectedHosts > 10 AND AccessCount > 100, 95,              | comment "Mass credential harvest = critical"
    AffectedHosts > 3,                         80,
    true(),                                    60
  )
| sort - RiskScore
| table SourceImage, GrantedAccess, AccessCount,
        AffectedHosts, Users, RiskScore, CallTraces
```

```
| lookup approved_lsass_readers SourceBinary OUTPUT approved, business_justification
```

```
# => CSV lookup: columns = SourceBinary, approved, business_justification
# => Typical approved entries: MsMpEng.exe (Defender), cbsensor.exe (CrowdStrike)
# => Adding a new EDR to baseline requires security team approval and doc update
```

```
| eval IsReadAccess = if(match(GrantedAccess, "0x00000010|..."), 1, 0)
```

```
# => 0x10 = PROCESS_VM_READ; tools like Mimikatz request this or PROCESS_ALL_ACCESS (0x1fffff)
# => Combining multiple masks covers Mimikatz variants that use minimal access masks
```

**Key Takeaway:** A baseline-driven approach — comparing LSASS readers against a known-good lookup — surfaces credential theft tools while suppressing thousands of daily false positives from legitimate security products.

**Why It Matters:** LSASS access is one of the highest-impact detections in a Windows environment because credential theft enables lateral movement and persistence. The challenge is that legitimate tools (AV, EDR, backup software) also read LSASS regularly, making raw EventCode=10 alerts extremely noisy. A maintained approved-reader baseline converts this noisy signal into a precision detection that analysts can act on without alert fatigue.

---

## Example 73: User Behavior Analytics Baseline

**What this covers:** User Behavior Analytics (UBA) establishes a historical baseline for each user's typical login geography, device, and time-of-day patterns. Logins that deviate from baseline — such as a first-time login from a new country — trigger anomaly alerts. This example shows a Python + pandas implementation that computes per-user baselines from 90 days of authentication logs and flags new-country logins.

**Scenario:** Your identity team wants to detect account takeover via login from a country where the user has never authenticated before, without relying on vendor-supplied UBA tooling.

```python
#!/usr/bin/env python3
"""
uba_new_country.py  —  Detect first-time login from a new country per user.
Input: auth_logs.csv — columns: timestamp, username, src_ip, country_code
Output: alerts for new-country logins
"""

import pandas as pd
from datetime import datetime, timedelta

AUTH_LOG      = "auth_logs.csv"
BASELINE_DAYS = 90                                # => Training window: 90 days of history
EVAL_DAYS     = 1                                 # => Evaluation window: last 24 hours

df = pd.read_csv(AUTH_LOG, parse_dates=["timestamp"])
                                                  # => Expects ISO8601 timestamps
df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
                                                  # => Normalise to UTC for comparison

cutoff_baseline_end   = datetime.utcnow().replace(tzinfo=pd.Timestamp.now(tz="UTC").tzinfo)
cutoff_baseline_start = cutoff_baseline_end - timedelta(days=BASELINE_DAYS + EVAL_DAYS)
cutoff_eval_start     = cutoff_baseline_end - timedelta(days=EVAL_DAYS)

baseline_df = df[
    (df["timestamp"] >= cutoff_baseline_start) &
    (df["timestamp"] < cutoff_eval_start)
]                                                 # => Historical data: days -91 to -1

eval_df = df[df["timestamp"] >= cutoff_eval_start]
                                                  # => Recent data: last 24 hours

# Build per-user set of known countries from baseline window
known_countries = (
    baseline_df.groupby("username")["country_code"]
    .apply(set)                                   # => Set of country codes seen per user
    .reset_index()
    .rename(columns={"country_code": "known_countries"})
)                                                 # => e.g. {'US', 'SG'} for a frequent traveller

# Merge eval logins with baselines
eval_merged = eval_df.merge(known_countries, on="username", how="left")
                                                  # => Left join: users with no baseline get NaN

eval_merged["known_countries"] = eval_merged["known_countries"].apply(
    lambda x: x if isinstance(x, set) else set()
)                                                 # => Replace NaN with empty set for new users

eval_merged["is_new_country"] = eval_merged.apply(
    lambda row: row["country_code"] not in row["known_countries"], axis=1
)                                                 # => True if login country never seen in baseline

alerts = eval_merged[eval_merged["is_new_country"]].copy()
                                                  # => Filter to new-country logins only

alerts["alert_type"]   = "FIRST_TIME_COUNTRY_LOGIN"
alerts["baseline_days"] = BASELINE_DAYS           # => Attach metadata for analyst context

print(alerts[
    ["timestamp", "username", "src_ip", "country_code",
     "known_countries", "alert_type", "baseline_days"]
].to_string(index=False))
# => Each row is an alert: username + src_ip + new country code + their known-good countries
```

**Key Takeaway:** Comparing evaluation-window logins against per-user historical country sets converts a raw authentication log into a precise anomaly signal with near-zero false positives for established users.

**Why It Matters:** Credential stuffing and account takeover attacks frequently originate from VPNs or proxies in unfamiliar countries. New-country detection requires no threat intelligence feed and generates one alert per genuine anomaly rather than pattern-matching on known bad IPs that attackers rotate constantly. The 90-day baseline window accommodates occasional legitimate travel while providing enough history to distinguish anomalies from normal patterns for users in multiple regions.

---

## Example 74: Deception Technology Alert Triage

**What this covers:** Honeypots are intentionally vulnerable systems or credentials with no legitimate use — any interaction is a high-confidence malicious signal. When a honeypot SSH login fires, the alert triage process validates the source IP, determines whether the credential used was a canary token, assesses lateral movement risk, and contains the threat. This example documents the triage workflow as annotated bash and Python steps.

**Scenario:** Your deception platform fired an alert: SSH login to honeypot `192.0.2.200` from `203.0.113.45` using the canary credential `svc_backup@CORP`. You need to triage it systematically.

```bash
#!/usr/bin/env bash
# honeypot_triage.sh  —  Triage a honeypot SSH login alert
ATTACKER_IP="203.0.113.45"                         # => Source IP from honeypot alert
CANARY_USER="svc_backup"                           # => Username used (canary credential)
HONEYPOT="192.0.2.200"                          # => Honeypot IP (no legitimate purpose)

echo "=== Step 1: GeoIP and ASN lookup ==="
curl -s "https://ipinfo.io/${ATTACKER_IP}/json" |
  python3 -c "import sys,json; d=json.load(sys.stdin);
  print(f'Country: {d.get(\"country\")}  ASN: {d.get(\"org\")}  City: {d.get(\"city\")}')"
                                                   # => Provides attacker geography and hosting provider
                                                   # => Hosting provider = likely VPS/proxy, not residential

echo "=== Step 2: Check if canary credential was used anywhere else in the last 24h ==="
# Query SIEM via API for the canary username in authentication logs
curl -sk -u admin:"$SPLUNK_PASS" \
  "https://splunk.corp.example:8089/services/search/jobs/export" \
  --data-urlencode "search=index=wineventlog EventCode=4624
    Account_Name=$CANARY_USER earliest=-24h@h | stats count by host, IpAddress" \
  -d output_mode=csv                               # => Any 4624 with canary user on real systems
                                                   # => = credential has been reused on production

echo "=== Step 3: Block attacker IP at perimeter firewall ==="
aws ec2 create-network-acl-entry \
  --network-acl-id acl-0abc1234def56789 \
  --rule-number 100 \
  --protocol 6 \
  --rule-action deny \
  --ingress \
  --cidr-block "${ATTACKER_IP}/32" \
  --port-range From=0,To=65535 2>&1 |
  grep -E "NetworkAclId|RuleNumber|Error"          # => Block all TCP from attacker at AWS NACL level
                                                   # => /32 targets only this IP; collateral damage minimal

echo "=== Step 4: Rotate canary credential and notify SecOps ==="
# Mark canary as burned and generate a replacement
python3 -c "
import secrets, string
new_pass = ''.join(secrets.choice(string.ascii_letters+string.digits) for _ in range(32))
print(f'New canary password (store in vault): {new_pass}')
"                                                  # => Generate cryptographically random replacement
                                                   # => Old canary is now burned; any future use = new alert needed
echo "Alert escalated to SecOps: HONEYPOT_LOGIN attacker=$ATTACKER_IP canary=$CANARY_USER"
```

**Key Takeaway:** Honeypot alerts are zero-false-positive by design — every step of triage focuses on scope assessment and containment rather than verification, because the alert is inherently trustworthy.

**Why It Matters:** Deception technology inverts the economics of intrusion detection: attackers must perfectly avoid every canary to remain undetected, while defenders need to place only one canary in a likely attack path. Honeypot alerts are actionable within minutes because no time is spent on false-positive analysis. Integrating canary credential monitoring with real-authentication-log correlation immediately reveals whether the attacker has already pivoted beyond the honeypot.

---

## Example 75: Network Traffic Analysis with Zeek and Rita

**What this covers:** Zeek (formerly Bro) generates structured network logs from raw packet captures. RITA (Real Intelligence Threat Analytics) analyses Zeek `conn.log` files to surface beaconing, long connections, and DNS tunnelling. This example shows how to run the analysis pipeline and interpret RITA's output for threat hunting.

**Scenario:** You captured 48 hours of egress traffic at the corporate perimeter. You want to run RITA to identify C2 beaconing candidates without writing custom statistical code.

```bash
#!/usr/bin/env bash
# zeek_rita_analysis.sh  —  Ingest Zeek logs into RITA and query beacon results

ZEEK_LOG_DIR="/data/zeek/2026-05-20"              # => Directory of Zeek log files from capture
RITA_DATASET="corp_egress_20260520"               # => Dataset name in RITA database
RITA_THRESHOLD="0.80"                             # => Beacon score threshold (0-1)
                                                  # => >0.80 = high beacon confidence

echo "=== Step 1: Import Zeek logs into RITA ==="
rita import --input "$ZEEK_LOG_DIR" --database "$RITA_DATASET"
                                                  # => Parses conn.log, dns.log, http.log
                                                  # => Stores aggregated flows in MongoDB

echo "=== Step 2: Analyse for beaconing ==="
rita show-beacons --database "$RITA_DATASET" \
  --score "$RITA_THRESHOLD" \
  --human-readable |
  column -t -s $'\t'                              # => Tab-separated output; column formats for terminal
                                                  # => Fields: Score, Source, Dest, Connections, Jitter

echo ""
echo "=== Step 3: Analyse for long connections (potential tunnels) ==="
rita show-long-connections --database "$RITA_DATASET" \
  --min-duration 3600 |                           # => Sessions lasting >1 hour
  head -20                                        # => Top 20 longest sessions
                                                  # => Long TCP sessions can indicate SSH/DNS tunnels

echo ""
echo "=== Step 4: Analyse for DNS tunnelling ==="
rita show-dns-fqdn --database "$RITA_DATASET" \
  --exploded |                                    # => Show all subdomains (tunnels use long subdomains)
  awk '$2 > 50 {print}'                           # => Filter: >50 unique subdomains under one domain
                                                  # => Legitimate CDNs rarely exceed 50 unique FQDNs

echo ""
echo "=== Step 5: Export high-score beacons for SIEM ingest ==="
rita show-beacons --database "$RITA_DATASET" \
  --score "$RITA_THRESHOLD" \
  --output json |                                 # => JSON for SIEM API ingest
  python3 -c "
import sys, json, datetime
for line in sys.stdin:
    rec = json.loads(line)
    rec['hunt_date']  = '$(date +%Y-%m-%d)'      # => Annotate with hunt date for tracking
    rec['analyst']    = '${USER}'                 # => Analyst who ran the hunt
    print(json.dumps(rec))
  " >> /data/hunt_results/rita_beacons.ndjson     # => Append to hunt evidence file
echo "Hunt results appended to rita_beacons.ndjson"
```

**Key Takeaway:** RITA's beacon score automates the statistical analysis that would otherwise require custom Python code, letting analysts focus on contextualising results rather than building models.

**Why It Matters:** Zeek + RITA is a battle-tested open-source alternative to commercial NTA solutions. Running the analysis pipeline on 48 hours of egress logs surfaces C2 beaconing, long-lived tunnel sessions, and DNS exfiltration channels that firewall and proxy alerts miss entirely because the individual connections appear innocuous. The structured Zeek log format also enables re-analysis with new detections against historical data without re-capturing traffic.

---

## Example 76: Memory Forensics — Malware Extraction

**What this covers:** When a process is suspected to contain injected shellcode, Volatility3's `malfind` plugin scans process memory for executable regions that lack a backing file on disk — a signature of in-memory code injection. This example shows the workflow for running `malfind`, interpreting its output, and extracting suspicious regions for further static analysis.

**Scenario:** A suspected process `svchost.exe` (PID 1488) was flagged by your EDR. You have a memory image and want to extract and hash any injected code for submission to a malware sandbox.

```bash
#!/usr/bin/env bash
# memory_forensics_extract.sh  —  Extract injected code from suspicious process
MEMORY_IMAGE="/evidence/suspect_host.raw"          # => Raw memory dump (winpmem, DumpIt, etc.)
TARGET_PID=1488                                    # => PID of suspected hollowed/injected process
OUTPUT_DIR="/evidence/extracted"                   # => Directory for extracted memory regions
mkdir -p "$OUTPUT_DIR"

echo "=== Step 1: Run malfind to identify injected memory regions ==="
vol -f "$MEMORY_IMAGE" windows.malfind \
  --pid "$TARGET_PID" \
  --dump \
  --output-dir "$OUTPUT_DIR" 2>&1 |
  tee "$OUTPUT_DIR/malfind_output.txt"
                                                   # => malfind: finds VAD regions with PAGE_EXECUTE_*
                                                   # => protection that lack a backing file on disk
                                                   # => --dump writes each region to a .dmp file

echo "=== Step 2: Identify MZ (PE) headers in dumped regions ==="
for dmp in "$OUTPUT_DIR"/*.dmp; do
  header=$(xxd "$dmp" 2>/dev/null | head -1)       # => Read first 16 bytes as hex
  if echo "$header" | grep -q "4d 5a"; then        # => "4d 5a" = "MZ" = Windows PE header
    echo "[PE_FOUND] $dmp"
    sha256sum "$dmp"                               # => Hash for VirusTotal / sandbox submission
  fi
done

echo "=== Step 3: Extract strings from injected PE for quick triage ==="
for dmp in "$OUTPUT_DIR"/*.dmp; do
  echo "--- Strings in $dmp ---"
  strings -n 8 "$dmp" | grep -iE \
    "(http|https|cmd\.exe|powershell|\\\\\\\\|AAAAAAA)" |
                                                   # => -n 8: minimum 8-char strings (reduce noise)
                                                   # => grep: URLs, shell commands, UNC paths, NOPs
    head -30                                       # => Top 30 for quick triage
done

echo "=== Step 4: Submit hashes to VirusTotal via API ==="
VT_API_KEY="${VT_API_KEY:?VT_API_KEY not set}"     # => Fail-safe: exit if API key missing
for dmp in "$OUTPUT_DIR"/*.dmp; do
  HASH=$(sha256sum "$dmp" | cut -d' ' -f1)
  curl -s --request GET \
    --url "https://www.virustotal.com/api/v3/files/${HASH}" \
    --header "x-apikey: $VT_API_KEY" |
    python3 -c "import sys,json; d=json.load(sys.stdin);
    stats=d.get('data',{}).get('attributes',{}).get('last_analysis_stats',{});
    print(f'Hash: ${HASH[:12]}... VT: {stats.get(\"malicious\",0)}/{sum(stats.values())} detections')"
                                                   # => Prints detection ratio: e.g. "45/72 detections"
done
```

**Key Takeaway:** Combining `malfind` (detection) with MZ-header scanning (classification) and VirusTotal hash lookup (triage) produces a full extraction pipeline from memory image to actionable threat intelligence in minutes.

**Why It Matters:** Memory forensics is the definitive technique for investigating process hollowing, reflective DLL injection, and fileless malware — all techniques that leave no disk artefacts for traditional forensic tools. Extracting and submitting injected PEs to sandboxes often reveals full malware family, C2 infrastructure, and attacker toolset in a single automated pipeline, dramatically accelerating incident response scoping.

---

## Example 77: Disk Forensics — Timeline Analysis

**What this covers:** Timeline analysis correlates filesystem timestamps, registry modifications, log entries, and browser history into a single chronological view of what happened on a compromised host. Plaso (`log2timeline.py`) collects artefacts from a disk image into a Plaso storage file; `psort.py` filters and exports the timeline to CSV for analyst review.

**Scenario:** You have a forensic image of a compromised Windows workstation. You need to build a 24-hour activity timeline around the suspected compromise window to understand attacker actions.

```bash
#!/usr/bin/env bash
# disk_timeline.sh  —  Build forensic timeline from disk image using Plaso
DISK_IMAGE="/evidence/workstation_c_drive.E01"     # => E01 (EnCase) format; Plaso supports raw/E01/VMDK
PLASO_FILE="/evidence/workstation.plaso"           # => Output storage file for Plaso artefacts
TIMELINE_CSV="/evidence/workstation_timeline.csv"  # => Final analyst-readable timeline
FILTER_START="2026-05-20T08:00:00+07:00"           # => Begin of analysis window (local time)
FILTER_END="2026-05-21T08:00:00+07:00"             # => End of analysis window (24h window)

echo "=== Step 1: Collect artefacts with log2timeline ==="
log2timeline.py \
  --parsers "win7,winevtx,olecf,chrome_history,firefox_history,recycle_bin" \
                                                   # => Parser set: Windows 7+, Event logs, Office, browsers
  --storage-file "$PLASO_FILE" \
  "$DISK_IMAGE"                                    # => This step takes 20-60 min for a 100GB image

echo "=== Step 2: Export filtered timeline with psort ==="
psort.py \
  --output-time-zone "Asia/Jakarta" \              # => Normalise all timestamps to local timezone
  --output-format dynamic \                        # => Dynamic format includes all available fields
  --slice "$FILTER_START" \
  --slice-size 720 \                               # => Extend slice by ±720 minutes around filter window
  --output "$TIMELINE_CSV" \
  "$PLASO_FILE"                                    # => Reads Plaso storage and writes CSV

echo "=== Step 3: Quick-win grep for attacker artefacts ==="
echo "--- PowerShell execution events ---"
grep -i "powershell" "$TIMELINE_CSV" |
  grep -i "Microsoft-Windows-PowerShell" |         # => Filter to PowerShell operational log source
  cut -d',' -f1,3,7 |                              # => Columns: timestamp, source, message
  head -30

echo "--- New files created in Temp directories ---"
grep -iE "(\\\\Temp\\\\|\\\\AppData\\\\Local\\\\Temp\\\\)" "$TIMELINE_CSV" |
  grep "MTIME\|CTIME\|CRTIME" |                    # => File create/modify timestamps
  grep -v "\.log\|\.tmp\|prefetch" |               # => Exclude common noise files
  sort -t',' -k1 |                                 # => Sort by timestamp
  head -30

echo "--- Lateral tool staging: executables in unusual paths ---"
grep -iE "\.(exe|dll|ps1|vbs|bat)" "$TIMELINE_CSV" |
  grep -iE "(Downloads|Temp|Users\\\\Public)" |    # => Attacker drop locations
  grep "CRTIME" |                                  # => Only file creation events
  sort -t',' -k1 | head -20
```

**Key Takeaway:** Plaso's multi-source artefact collection followed by `psort` time-window filtering produces a unified 24-hour timeline that reveals attacker tool staging, persistence installation, and data access in chronological order.

**Why It Matters:** Forensic timelines built from a single artefact source (event logs only, or filesystem only) miss critical context. Plaso correlates filesystem metadata, registry hive write times, browser history, and Windows Event logs into one timeline, revealing the precise sequence of attacker actions. This chronological view is the primary deliverable for incident post-mortems, enabling defenders to determine dwell time, initial access vector, and the full impact scope.

---

## Example 78: Cloud Threat Detection — AWS Console Login Without MFA

**What this covers:** AWS CloudTrail logs all API calls and console sign-ins. A console login without MFA on a production account is a significant risk indicator — it may indicate credential compromise, shared account abuse, or MFA bypass. This example shows a KQL rule for Microsoft Sentinel's AWS CloudTrail connector that fires on non-MFA console authentications.

**Scenario:** Your cloud security policy requires MFA for all AWS console logins to production accounts. You want a Sentinel detection rule that fires when anyone logs into the AWS console without MFA.

```kql
AWSCloudTrail
| where TimeGenerated > ago(1d)
| where EventName == "ConsoleLogin"               // => AWS sign-in service event
| where EventSource == "signin.amazonaws.com"     // => Filters to console login specifically (not API calls)
| extend MFAUsed     = tostring(AdditionalEventData.MFAUsed)
                                                  // => "Yes" or "No" from CloudTrail additional data
| extend UserType    = tostring(UserIdentity.type)
                                                  // => "Root", "IAMUser", "AssumedRole"
| extend UserName    = tostring(UserIdentity.userName)
| extend AccountId   = tostring(UserIdentity.accountId)
| extend SourceIP    = tostring(SourceIpAddress)
| extend UserAgent   = tostring(UserAgent)
| extend LoginResult = tostring(ResponseElements.ConsoleLogin)
                                                  // => "Success" or "Failure"
| where LoginResult == "Success"                  // => Only successful logins (failures are separate detection)
| where MFAUsed != "Yes"                          // => Core condition: MFA was NOT used
| extend Severity = case(
    UserType == "Root", "Critical",               // => Root without MFA = highest severity
    UserName contains "svc_",  "High",            // => Service accounts shouldn't do console logins
    "Medium"
  )
| project
    TimeGenerated,
    Severity,
    AccountId,
    UserName,
    UserType,
    SourceIP,
    UserAgent,
    MFAUsed,
    LoginResult
| order by TimeGenerated desc
```

**Key Takeaway:** Filtering CloudTrail `ConsoleLogin` events where `MFAUsed != "Yes"` and `ConsoleLogin == "Success"` produces a precise, near-zero-false-positive alert that requires no statistical modelling.

**Why It Matters:** AWS root and IAM console logins without MFA represent the single highest-risk configuration finding in cloud environments. Stolen credentials combined with no MFA requirement gives an attacker immediate, unrestricted access to provision resources, exfiltrate data, or destroy infrastructure. Real-time detection via CloudTrail enables a response window measured in minutes rather than hours, before attackers establish persistence through new IAM users or access keys.

---

## Example 79: Cloud Threat Detection — AWS IAM Privilege Escalation

**What this covers:** IAM privilege escalation occurs when an attacker with limited permissions exploits IAM misconfigurations to grant themselves broader permissions — for example, by attaching the `AdministratorAccess` policy to their own user or creating new admin users. This example shows a Sentinel KQL rule that correlates three high-risk IAM events into a single escalation alert.

**Scenario:** Your AWS environment has a least-privilege IAM design. You want a detection rule that fires when a single IAM identity performs privilege-escalating actions within a 30-minute window.

```kql
let EscalationEvents = AWSCloudTrail
| where TimeGenerated > ago(1d)
| where EventName in (
    "AttachUserPolicy",                           // => Attaches managed policy to user (e.g. AdministratorAccess)
    "PutUserPolicy",                              // => Creates or replaces inline policy on user
    "CreateAccessKey",                            // => Creates new access key (persistence)
    "AddUserToGroup",                             // => Adds user to group (may have broader perms)
    "UpdateAssumeRolePolicy",                     // => Modifies trust policy to allow new principal
    "CreateLoginProfile",                         // => Creates console login for existing API-only user
    "SetDefaultPolicyVersion"                     // => Rolls back to older, more permissive policy version
  )
| extend ActorUser    = tostring(UserIdentity.userName)
| extend ActorArn     = tostring(UserIdentity.arn)
| extend TargetUser   = tostring(RequestParameters.userName)
| extend PolicyArn    = tostring(RequestParameters.policyArn)
| extend IsSelfTarget = (ActorUser == TargetUser)  // => Self-modification is highest risk
;

EscalationEvents
| summarize
    EventCount     = count(),
    Events         = make_set(EventName, 10),
    TargetUsers    = make_set(TargetUser, 5),
    PolicyArns     = make_set(PolicyArn, 5),
    SelfTargeted   = max(IsSelfTarget)
    by ActorArn, ActorUser, bin(TimeGenerated, 30m)
                                                  // => Group events into 30-minute windows per actor
| where EventCount >= 2                           // => Two or more escalation events in window
| extend Severity = case(
    SelfTargeted == true and
      PolicyArns has "arn:aws:iam::aws:policy/AdministratorAccess", "Critical",
                                                  // => Self-attaching admin policy = definitive escalation
    SelfTargeted == true,                                            "High",
    EventCount >= 3,                                                 "High",
    true(),                                                          "Medium"
  )
| project TimeGenerated, Severity, ActorUser, ActorArn,
          EventCount, Events, TargetUsers, PolicyArns, SelfTargeted
| order by Severity asc, EventCount desc
```

**Key Takeaway:** Windowing IAM escalation events by actor and 30-minute bins surfaces sequences of privilege-granting API calls that individually look like routine administration but together indicate active escalation.

**Why It Matters:** IAM privilege escalation is the primary post-compromise action in cloud intrusions because it converts limited initial access into full administrative control. The attack is silent — it uses only legitimate IAM APIs with no malware, no exploits, and no network scanning. Detection requires correlating multiple API calls over time, which no single-event alert can surface. Catching escalation within the first 30-minute window limits attacker options before they establish durable persistence.

---

## Example 80: Kubernetes Audit Log Threat Detection

**What this covers:** Kubernetes API server audit logs record every API call with the requesting user, verb, resource, and response code. Attackers who compromise a pod and escalate to cluster-admin via misconfigured RBAC leave clear audit log signatures: `exec` into a pod followed by escalated API calls. This example shows a Python script that parses Kubernetes audit logs to detect this attack chain.

**Scenario:** Your Kubernetes cluster audit logs are shipped to S3. You want to detect the sequence: `exec` into a privileged pod, followed by cluster-admin API calls from the same user within 10 minutes.

```python
#!/usr/bin/env python3
"""
k8s_audit_detector.py  —  Detect exec-into-pod + privilege escalation in K8s audit logs.
Input: JSON Lines Kubernetes audit log file
Output: Alert records for matched attack chains
"""

import json
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from pathlib import Path

AUDIT_LOG  = Path("k8s_audit.jsonl")               # => JSON Lines format; one audit event per line
WINDOW_MIN = 10                                    # => Correlation window: 10 minutes

exec_events   = defaultdict(list)                  # => {username: [timestamp, ...]}
escalated_ops = defaultdict(list)                  # => {username: [event_dict, ...]}

ESCALATED_VERBS      = {"create", "delete", "patch", "update"}
                                                   # => Mutating verbs on sensitive resources
SENSITIVE_RESOURCES  = {"clusterrolebindings", "secrets", "serviceaccounts",
                        "rolebindings", "pods/exec"}
                                                   # => Resources that indicate privilege escalation

with AUDIT_LOG.open() as fh:
    for line in fh:
        event = json.loads(line)
        user  = event.get("user", {}).get("username", "unknown")
                                                   # => Requesting user (could be SA or human)
        ts_str = event.get("requestReceivedTimestamp", "")
        ts     = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                                                   # => Parse RFC3339 timestamp to datetime

        verb     = event.get("verb", "")
        resource = event.get("objectRef", {}).get("resource", "")
        subres   = event.get("objectRef", {}).get("subresource", "")

        # Track exec events
        if verb == "create" and subres == "exec":  # => kubectl exec = POST /pods/{name}/exec
            exec_events[user].append(ts)
            # => Each entry is the timestamp of an exec event for this user

        # Track escalated API calls
        if verb in ESCALATED_VERBS and resource in SENSITIVE_RESOURCES:
            escalated_ops[user].append({"ts": ts, "verb": verb, "resource": resource})
            # => Each entry documents what sensitive operation was attempted

# Correlate: find users with exec followed by escalated op within window
alerts = []
for user, exec_times in exec_events.items():
    for exec_ts in exec_times:
        window_end = exec_ts + timedelta(minutes=WINDOW_MIN)
                                                   # => Window closes 10 minutes after exec
        subsequent_escalations = [
            op for op in escalated_ops.get(user, [])
            if exec_ts <= op["ts"] <= window_end   # => Escalation must follow exec chronologically
        ]
        if subsequent_escalations:
            alerts.append({
                "user":           user,
                "exec_time":      exec_ts.isoformat(),
                "escalations":    subsequent_escalations,
                "alert_type":     "K8S_EXEC_THEN_ESCALATION",
                "severity":       "CRITICAL",      # => Any exec → escalation chain = critical
            })

for alert in alerts:
    print(json.dumps(alert, default=str))
    # => JSON output: one alert per matched chain, ready for SIEM ingest
```

**Key Takeaway:** Correlating `exec` subresource events with subsequent mutating calls on sensitive resources within a time window surfaces the most common Kubernetes post-compromise pattern without requiring rule-based signatures.

**Why It Matters:** Kubernetes clusters are a high-value target because a single misconfigured pod or service account can grant cluster-admin access to an attacker. Unlike traditional OS exploitation, Kubernetes attacks use only legitimate API calls, making them invisible to most network-layer detections. Audit log analysis is the primary detection surface for Kubernetes attacks, and correlation-based detection catches attack chains that no single event rule can identify.

---

## Example 81: Incident Post-Mortem Template

**What this covers:** A post-mortem (or post-incident review) is a structured retrospective that documents the timeline, root cause, contributing factors, detection gaps, and remediation actions for a security incident. This example provides an annotated incident post-mortem template with guidance on each section's purpose and the questions it should answer.

**Scenario:** Your team completed incident response for a ransomware intrusion. You need to produce a post-mortem document that will drive security improvements and satisfy audit requirements.

```markdown
# Incident Post-Mortem: [INCIDENT-ID] [Brief Title]

## Document Metadata

| Field              | Value                        |
| ------------------ | ---------------------------- |
| Incident ID        | INC-2026-0189                |
| Classification     | Confidential — Internal Only |
| Severity           | P1 — Critical                |
| Incident Commander | [Name]                       |
| Post-Mortem Lead   | [Name]                       |
| Review Date        | 2026-05-28                   |
| Status             | DRAFT → FINAL                |

<!-- => Metadata section allows cross-referencing with ticketing system -->
<!-- => Severity P1 = customer-impacting or data-exfiltrating incidents -->

## Executive Summary

<!-- => 3-5 sentences: what happened, business impact, and primary action taken -->
<!-- => Write for a non-technical executive audience -->

On 2026-05-20, an attacker gained initial access via a phishing email targeting
the finance team, escalated privileges using an unpatched CVE in the VPN concentrator,
deployed ransomware on 23 file servers, and exfiltrated 180 GB of financial data.
Affected systems were isolated within 4 hours of detection. No customer PII was exposed.

## Timeline

<!-- => Chronological sequence; include both attacker actions AND defender actions -->
<!-- => Timestamps in local timezone with UTC offset noted -->

| Time (WIB)       | Actor    | Event                                                |
| ---------------- | -------- | ---------------------------------------------------- |
| 2026-05-20 09:14 | Attacker | Phishing email delivered to finance@corp.com         |
| 2026-05-20 09:31 | User     | User clicked attachment; macro executed              |
| 2026-05-20 09:33 | Attacker | Cobalt Strike beacon established to 198.51.100.12    |
| 2026-05-20 11:47 | Attacker | Lateral movement to DC01 via PsExec                  |
| 2026-05-20 14:02 | Defender | EDR alert fired on ransomware deployment             |
| 2026-05-20 14:18 | Defender | Incident Commander engaged, network segment isolated |

<!-- => Timeline is the most valuable section; be precise about the gap between compromise and detection -->

## Root Cause Analysis

<!-- => Five Whys or Fishbone analysis; identify the proximate AND systemic causes -->

**Proximate cause**: Unpatched VPN CVE (CVE-2025-XXXX) allowed privilege escalation.
**Systemic cause**: Patch management process had a 90-day SLA for critical patches;
CVE was published 47 days before exploitation with no emergency procedure triggered.

<!-- => Root cause is never "human error" — it is always a process or control gap -->

## Contributing Factors

<!-- => List conditions that made the incident worse or harder to detect -->

- MFA not enforced on VPN; attacker used harvested credentials without friction
- EDR exclusion list included the VPN agent directory (attack vector location)
- Backup validation had not been tested in 6 months; partial recovery required

## Detection Gaps

<!-- => What should have fired but did not? Why not? -->

- Cobalt Strike beacon ran for 4 hours without detection: proxy TLS inspection disabled
- LSASS dump at 11:31 not alerted: EDR exclusion list included attacker's process path

## Action Items

<!-- => Each item: owner, due date, verification method, priority -->

| #   | Action                                         | Owner    | Due Date   | Priority |
| --- | ---------------------------------------------- | -------- | ---------- | -------- |
| 1   | Enable emergency patch SLA (<48h) for CVSS≥9.0 | SecOps   | 2026-06-04 | P0       |
| 2   | Enforce MFA on all VPN profiles                | IAM Team | 2026-05-28 | P0       |
| 3   | Review and trim EDR exclusion list quarterly   | EDR Team | 2026-06-11 | P1       |
| 4   | Test backup restoration quarterly              | IT Ops   | 2026-07-01 | P1       |

<!-- => Action items without owners and due dates are wishes, not commitments -->
```

**Key Takeaway:** A post-mortem template forces structured documentation of the detection gap and action items with owners — without this structure, incidents produce anecdotes rather than security improvements.

**Why It Matters:** Organisations that conduct blameless, structured post-mortems after incidents measurably improve their security posture over time because each incident becomes a data point for systematic control improvement. The detection gaps section is the most operationally valuable: it directly feeds the detection engineering backlog with evidence-based requirements, ensuring that the next similar attack is caught faster than the last.

---

## Example 82: Attack Simulation Validation with Atomic Red Team

**What this covers:** Atomic Red Team (ART) provides a library of small, focused attack simulations mapped to MITRE ATT&CK techniques. Running an atomic test against a live detection stack and verifying the expected alert fires validates that your detection pipeline is working end-to-end, from technique execution through telemetry collection to alert generation.

**Scenario:** You want to validate that your Sysmon + Splunk detection for LSASS memory access (T1003.001) fires correctly. You run the relevant ART test on a test endpoint and query Splunk for the expected alert.

```powershell
# Step 1: Install Atomic Red Team (on test endpoint, never production)
Install-Module -Name invoke-atomicredteam -Force   # => Installs ART PowerShell module
Import-Module invoke-atomicredteam                 # => Load module into session
# => All ART operations on isolated, non-production test endpoints ONLY

# Step 2: List available tests for T1003.001 (LSASS Memory)
Invoke-AtomicTest T1003.001 -ShowDetails           # => Lists all atomics for the technique
                                                   # => Shows test number, name, executor, prerequisites

# Step 3: Run Atomic #1 (ProcDump targeting LSASS)
Invoke-AtomicTest T1003.001 -TestNumbers 1         # => Executes: procdump.exe -ma lsass.exe lsass.dmp
                                                   # => This WILL trigger LSASS access; test endpoint only
# Expected: LSASS memory dump file created AND Sysmon EventCode=10 logged

# Step 4: Verify Sysmon telemetry was generated
Get-WinEvent -FilterHashtable @{
    LogName   = 'Microsoft-Windows-Sysmon/Operational'
    Id        = 10                                 # => Process Access event
} | Where-Object { $_.Message -like '*lsass*' } |
    Select-Object TimeCreated, Message |
    Format-List
# => Should return entries from the last 5 minutes
# => If no results: Sysmon not installed, not running, or wrong config
```

```bash
# Step 5: Verify the detection alert fired in Splunk (run from analyst workstation)
SPLUNK_URL="https://splunk.corp.example:8089"
SPLUNK_PASS="${SPLUNK_PASS:?}"                     # => Require env var; never hardcode

curl -sk -u "admin:$SPLUNK_PASS" \
  "$SPLUNK_URL/services/search/jobs/export" \
  --data-urlencode \
  "search=index=sysmon EventCode=10 TargetImage=*lsass.exe
           SourceImage=*procdump* earliest=-15m@m
   | stats count by SourceImage, TargetImage, GrantedAccess" \
  -d output_mode=csv                               # => Should return at least one row
                                                   # => Zero rows = detection gap; investigate pipeline

# Step 6: Clean up test artefacts
```

```powershell
Invoke-AtomicTest T1003.001 -TestNumbers 1 -Cleanup
                                                   # => Removes lsass.dmp and procdump binary
                                                   # => Always clean up after each atomic test
```

**Key Takeaway:** Running an ART atomic test and then querying your SIEM for the expected alert is the only way to prove end-to-end detection coverage — reading Sysmon config is necessary but not sufficient.

**Why It Matters:** Detection rules that pass code review and deploy to production can still fail silently due to field-mapping issues, index routing errors, or Sysmon configuration gaps. Regular atomic validation — ideally in a CI pipeline that runs after detection rule changes — provides continuous assurance that your detection stack actually works against the techniques it claims to cover. This practice eliminates the gap between theoretical coverage and operational reality.

---

## Example 83: Purple Team Detection Mapping

**What this covers:** Purple teaming combines red team attack execution with blue team detection analysis to systematically measure and improve detection coverage against a specific threat actor's TTPs. This example shows how to build a MITRE ATT&CK Navigator coverage layer from your existing detection rules and identify gaps for prioritised remediation.

**Scenario:** Your security team wants to measure detection coverage against the TTPs used by a ransomware group targeting your industry. You want to generate an ATT&CK Navigator layer that shows covered, partially covered, and uncovered techniques.

```python
#!/usr/bin/env python3
"""
navigator_layer_generator.py  —  Generate ATT&CK Navigator layer from detection inventory.
Input: detection_inventory.csv  (columns: rule_id, technique_id, status, confidence)
Output: navigator_layer.json  (import into https://mitre-attack.github.io/attack-navigator/)
"""

import csv
import json
from collections import defaultdict
from pathlib import Path

INVENTORY_CSV   = Path("detection_inventory.csv")  # => CSV of all detection rules + ATT&CK mappings
OUTPUT_JSON     = Path("navigator_layer.json")     # => ATT&CK Navigator layer JSON

THREAT_ACTOR_TTPS = [                              # => TTPs from threat intel report on target group
    "T1566.001", "T1059.001", "T1003.001",
    "T1021.002", "T1486",     "T1041",
]                                                  # => Phishing, PowerShell, LSASS, SMB, Ransomware, Exfil

COLOR_MAP = {
    "covered":   "#00cc44",                        # => Green: detection rule exists and tested
    "partial":   "#ffaa00",                        # => Amber: detection exists but not validated
    "gap":       "#cc0000",                        # => Red: no detection coverage
}

technique_status = defaultdict(lambda: "gap")      # => Default: assume no coverage
technique_scores = {}                              # => confidence score per technique

with INVENTORY_CSV.open() as fh:
    for row in csv.DictReader(fh):
        tid    = row["technique_id"].strip()       # => e.g. "T1003.001"
        status = row["status"].strip()             # => "covered" | "partial" | "gap"
        conf   = float(row.get("confidence", 0))   # => 0.0-1.0 detection confidence score

        if status == "covered" and conf >= 0.8:
            technique_status[tid] = "covered"      # => Fully covered: rule exists and tested
        elif status in ("covered", "partial"):
            technique_status[tid] = "partial"      # => Partial: rule exists but gaps remain
        technique_scores[tid] = conf

techniques_layer = []
for tid in THREAT_ACTOR_TTPS:                      # => Only map threat actor TTPs, not all ATT&CK
    status = technique_status[tid]
    techniques_layer.append({
        "techniqueID": tid,
        "color":       COLOR_MAP[status],          # => WCAG-compliant colors for accessibility
        "comment":     f"Status: {status} | Confidence: {technique_scores.get(tid, 0):.0%}",
        "enabled":     True,
        "score":       int(technique_scores.get(tid, 0) * 100),
    })

layer = {
    "name":        "Purple Team Coverage — Ransomware Group X",
    "versions":    {"attack": "14", "navigator": "4.9", "layer": "4.5"},
    "domain":      "enterprise-attack",            # => Enterprise ATT&CK matrix
    "description": f"Coverage assessment for {len(THREAT_ACTOR_TTPS)} threat actor TTPs",
    "techniques":  techniques_layer,
    "gradient":    {"colors": ["#cc0000", "#ffaa00", "#00cc44"], "minValue": 0, "maxValue": 100},
}

OUTPUT_JSON.write_text(json.dumps(layer, indent=2))
print(f"Layer written to {OUTPUT_JSON}")
gaps = [t for t in THREAT_ACTOR_TTPS if technique_status[t] == "gap"]
print(f"Coverage gaps ({len(gaps)}): {', '.join(gaps)}")
# => Gaps list feeds directly into the detection engineering backlog
```

**Key Takeaway:** Generating an ATT&CK Navigator layer from your actual detection inventory — not assumed coverage — reveals precise gap-to-threat-actor alignment that drives evidence-based detection engineering priorities.

**Why It Matters:** Many organisations overestimate their ATT&CK coverage because they count rule deployments rather than validated, tested detections. A navigator layer built from an honest inventory reveals the techniques your most likely threat actors can execute without triggering any alert. Presenting this gap analysis to leadership with traffic-light colour coding translates technical coverage data into business risk, enabling informed investment decisions about detection engineering resources.

---

## Example 84: Detection Metrics Dashboard

**What this covers:** Detection engineering effectiveness is measured through Mean Time to Detect (MTTD), Mean Time to Respond (MTTR), and false positive rate — three metrics that together characterise alert quality and response efficiency. This example shows a Splunk dashboard search that computes all three metrics from incident and alert data.

**Scenario:** Your CISO wants a monthly dashboard showing detection program health. You need Splunk SPL queries that compute MTTD, MTTR, and false positive rate from your ticketing and alert data.

```splunk
| comment "=== METRIC 1: Mean Time to Detect (MTTD) ==="
| comment "MTTD = time from attacker first action to first alert firing"
index=incidents earliest=-30d@d
| eval CompromiseTime = strptime(first_attacker_action, "%Y-%m-%dT%H:%M:%S%z")
| eval FirstAlertTime = strptime(first_alert_timestamp, "%Y-%m-%dT%H:%M:%S%z")
| eval MTTD_hours = (FirstAlertTime - CompromiseTime) / 3600
                                                   | comment "Convert seconds to hours"
| where MTTD_hours > 0 AND MTTD_hours < 720       | comment "Exclude outliers > 30 days"
| stats
    avg(MTTD_hours)    as MTTD_avg_hours,
    median(MTTD_hours) as MTTD_median_hours,
    perc95(MTTD_hours) as MTTD_p95_hours
    by severity
| eval MTTD_SLA_met = if(MTTD_avg_hours <= 4, "MET", "BREACHED")
                                                   | comment "SLA: average MTTD under 4 hours"
```

```splunk
| comment "=== METRIC 2: Mean Time to Respond (MTTR) ==="
| comment "MTTR = time from first alert to incident containment (isolation/blocking)"
index=incidents earliest=-30d@d
| eval FirstAlertTime  = strptime(first_alert_timestamp, "%Y-%m-%dT%H:%M:%S%z")
| eval ContainmentTime = strptime(containment_timestamp, "%Y-%m-%dT%H:%M:%S%z")
| eval MTTR_hours = (ContainmentTime - FirstAlertTime) / 3600
| where MTTR_hours > 0 AND MTTR_hours < 720
| stats
    avg(MTTR_hours)    as MTTR_avg_hours,
    median(MTTR_hours) as MTTR_median_hours
    by severity, incident_type
| eval MTTR_SLA_met = if(MTTR_avg_hours <= 1, "MET", "BREACHED")
                                                   | comment "P1 SLA: containment within 1 hour"
```

```splunk
| comment "=== METRIC 3: False Positive Rate per Detection Rule ==="
| comment "FP rate = closed-as-FP alerts / total alerts per rule, last 30 days"
index=alerts earliest=-30d@d
| stats
    count                                          as TotalAlerts,
    sum(eval(if(disposition="false_positive",1,0))) as FP_Count,
    sum(eval(if(disposition="true_positive",1,0)))  as TP_Count
    by rule_name
| eval FP_Rate_pct = round(FP_Count / TotalAlerts * 100, 1)
                                                   | comment "FP rate as percentage"
| eval SignalQuality = case(
    FP_Rate_pct < 5,  "HIGH",                      | comment "< 5% FP = production quality"
    FP_Rate_pct < 20, "MEDIUM",                    | comment "5-20% FP = needs tuning"
    true(),           "LOW"                        | comment "> 20% FP = review or retire"
  )
| sort - FP_Rate_pct
| table rule_name, TotalAlerts, TP_Count, FP_Count, FP_Rate_pct, SignalQuality
```

**Key Takeaway:** Computing MTTD, MTTR, and false positive rate on a common cadence creates objective, trend-trackable signals for detection program health that replace subjective quality assessments.

**Why It Matters:** Without metrics, detection programs operate on intuition: teams improve what they remember rather than what data shows. MTTD tracks whether detection coverage is actually finding threats faster over time; MTTR tracks whether response processes are improving; and false positive rate tracks alert quality. Together, these three metrics expose the specific bottleneck in the detect-respond loop — whether the problem is missing detections, slow response, or analyst alert fatigue from noisy rules.

---

## Example 85: Building a Threat Intelligence Program

**What this covers:** A structured Cyber Threat Intelligence (CTI) program collects, normalises, stores, and disseminates threat indicators and actor intelligence to detection and response teams. This example shows a workflow connecting MISP (threat intelligence platform) with STIX 2.1 structured intelligence and TAXII 2.1 distribution, plus a Python script that pulls indicators from MISP and pushes them to Splunk as a threat lookup table.

**Scenario:** Your organisation wants to operationalise threat intelligence by automatically converting MISP indicators into Splunk lookup tables that detection rules can reference in real time.

```python
#!/usr/bin/env python3
"""
cti_pipeline.py  —  Pull IOCs from MISP and push to Splunk lookup table via STIX/TAXII.
Requires: pymisp, splunk-sdk, taxii2-client
"""

import csv
import io
import os
from datetime import datetime, timedelta, timezone

import splunklib.client as splunk_client
from pymisp import PyMISP

# --- MISP connection ---
MISP_URL    = os.environ["MISP_URL"]               # => e.g. https://misp.corp.example
MISP_KEY    = os.environ["MISP_APIKEY"]            # => MISP automation key; never hardcode
MISP_VERIFY = True                                 # => TLS cert validation; False only in lab

misp = PyMISP(MISP_URL, MISP_KEY, MISP_VERIFY)    # => Instantiate MISP API client

# --- Pull recent attributes (IOCs) from MISP ---
lookback_days = 7                                  # => Pull indicators updated in the last 7 days
since_date    = (datetime.now(timezone.utc) - timedelta(days=lookback_days)).strftime("%Y-%m-%d")

response = misp.search(
    controller = "attributes",
    type_attribute = ["ip-dst", "domain", "url", "md5", "sha256"],
                                                   # => Filter to network and file IOC types only
    timestamp  = since_date,                       # => Only recently updated indicators
    to_ids     = True,                             # => Only indicators flagged for IDS/detection use
    published  = True,                             # => Only from published events (reviewed)
    limit      = 10000,                            # => Page size; loop for larger datasets
)

attributes = response.get("Attribute", [])         # => List of MISP attribute dicts
print(f"[MISP] Retrieved {len(attributes)} IOCs since {since_date}")

# --- Build Splunk lookup CSV ---
csv_buffer = io.StringIO()
writer     = csv.writer(csv_buffer)
writer.writerow(["ioc_value", "ioc_type", "threat_level",
                 "misp_event_id", "misp_category", "last_seen"])
                                                   # => Header row for Splunk lookup definition

for attr in attributes:
    threat_level = {
        "1": "HIGH",    "2": "MEDIUM",             # => MISP threat levels: 1=high, 2=medium,
        "3": "LOW",     "4": "UNDEFINED"           # => 3=low, 4=undefined
    }.get(str(attr.get("event", {}).get("threat_level_id", "4")), "UNDEFINED")

    writer.writerow([
        attr.get("value"),                         # => The IOC itself: IP, domain, hash, etc.
        attr.get("type"),                          # => IOC type: ip-dst, domain, md5, sha256
        threat_level,
        attr.get("event_id"),                      # => MISP event ID for attribution back to source
        attr.get("category"),                      # => MISP category: Network activity, Payload, etc.
        attr.get("timestamp"),                     # => Last updated timestamp from MISP
    ])

# --- Push CSV to Splunk as a KV Store lookup ---
splunk = splunk_client.connect(
    host     = os.environ["SPLUNK_HOST"],
    port     = 8089,
    username = "admin",
    password = os.environ["SPLUNK_PASS"],
)                                                  # => Splunk REST API connection

lookup_name = "threat_intel_iocs"                  # => Must match lookup definition in transforms.conf

try:
    splunk.kvstore[lookup_name].data.delete()      # => Clear stale IOCs before refresh
except Exception:
    pass                                           # => Ignore if collection is empty

csv_buffer.seek(0)
splunk.kvstore[lookup_name].data.batch_save(
    *[{"ioc_value": r["ioc_value"], "ioc_type": r["ioc_type"],
       "threat_level": r["threat_level"], "last_seen": r["last_seen"]}
      for r in csv.DictReader(csv_buffer)]
)                                                  # => Inserts all IOCs as KV store documents
                                                   # => Splunk detection rules can now `| lookup threat_intel_iocs`
print(f"[SPLUNK] Pushed {len(attributes)} IOCs to '{lookup_name}' KV store lookup")
```

**Key Takeaway:** Automating MISP-to-Splunk IOC synchronisation turns a passive intelligence repository into an active detection control that updates detection rules with fresh indicators on a daily schedule.

**Why It Matters:** A CTI program that produces PDF reports no one reads has zero operational value. The only measure of CTI effectiveness is how directly it improves detection and response outcomes. Wiring MISP to Splunk via a daily sync job ensures that every new indicator from a threat feed, incident, or ISAC sharing becomes a live detection rule within hours of publication — turning intelligence consumption into measurable detection coverage improvement.
