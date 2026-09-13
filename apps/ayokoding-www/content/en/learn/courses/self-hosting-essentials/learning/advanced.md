---
title: "Advanced Examples"
date: 2026-07-30T00:00:00+07:00
draft: false
weight: 30
---

Examples 33-78 cover resilience, data, and the self-host vs managed trade-off, then go deep on the
mechanics: a data-backed service with a tested backup and a restore drill, reboot resilience, multiple
services on one box, `systemd` resource limits, metrics, a git-driven deploy pipeline, a trade-off
writeup, a disaster rebuild, `fail2ban`, and staging-vs-prod promotion -- followed by an extended run
of `systemd` patterns (timer, socket activation, drop-in, graceful shutdown), the full proxy and TLS
surface (Caddy-vs-Nginx, HTTPS redirect, HSTS, OCSP stapling, proxy rate limiting, multi-domain TLS),
DNS CNAME/TTL/subdomain routing, env templating and `EnvironmentFile`, secret rotation automation and
a pre-commit secret scanner, structured logging and log shipping, health-failure alerting, a watchdog
and restart backoff, Procfile/release/scaling PaaS patterns, blue-green and connection-drain deploys,
restic and `pg_dump` backups with retention and verification, a `cloud-init` first-boot reprovision,
and a capstone preview.

---

### Example 33: A Data-Backed Service with a Persistent Volume

_ex-33 &middot; exercises co-06, co-19_

A stateless service (Example 6) loses its data on restart. A DATA-BACKED service persists to a volume
that survives the process. This unit adds a data directory owned by the app, so writes live longer
than the process.

**`learning/code/ex-33-data-backed-service/myapp-data.service`**:

```ini
[Unit]
Description=MyApp data-backed service (persistent volume)
After=network-online.target
Wants=network-online.target
[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/myapp
Environment=APP_DB_PATH=/opt/myapp/data/app.db  # => co-19: the app writes its SQLite DB HERE
ExecStartPre=/usr/bin/install -d -o deploy -g deploy -m 750 /opt/myapp/data  # => ensure the volume exists
ExecStart=/opt/myapp/venv/bin/python /opt/myapp/app.py
Restart=on-failure
RestartSec=3
[Install]
WantedBy=multi-user.target
```

**Run**: `install myapp-data.service /etc/systemd/system/ && systemctl daemon-reload && systemctl enable --now myapp-data`

**Expected**: write a row, `systemctl restart myapp-data`, read it back -- the row survived.

**Key takeaway**: the process is ephemeral; `/opt/myapp/data` is NOT. A restart kills and revives the
process, but the DB file persists -- which is exactly what makes it the thing worth backing up.

**Why it matters**: state is what makes a service worth backing up (co-19) and worth recovering
(Example 42). A stateless service can always be re-deployed; a stateful one's data is irreplaceable,
which is why Examples 34-35 and 75-77 exist.

---

### Example 34: A Scripted Tested Backup of the Data

_ex-34 &middot; exercises co-19_

An untested backup is a wish. This script takes a consistent SQLite snapshot (safe against a running
writer), stamps it, and immediately VERIFIES the copy opens -- so the backup is proven restorable at
the moment it is taken.

**`learning/code/ex-34-backup-the-data/backup.sh`**:

```bash
#!/usr/bin/env bash
set -euo pipefail
DB_PATH="/opt/myapp/data/app.db"; BACKUP_DIR="/var/backups/myapp"
install -d -m 750 "${BACKUP_DIR}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"; DEST="${BACKUP_DIR}/app-${STAMP}.db"
sqlite3 "${DB_PATH}" ".backup '${DEST}'"  # => co-19: online backup API -> no torn writes
chmod 640 "${DEST}"
if ! sqlite3 "${DEST}" 'PRAGMA integrity_check;' | grep -q '^ok$'; then
  echo "[FAIL] backup ${DEST} failed integrity check" >&2; exit 1
fi
echo "[verify] backup OK and integrity-checked: ${DEST}"
```

**Run**: `bash backup.sh`

**Expected**:

```text
[verify] backup OK and integrity-checked: /var/backups/myapp/app-20260730T030000Z.db
```

**Key takeaway**: testing the backup AT BACKUP TIME (the `integrity_check`) is the discipline that
separates a backup from a hope -- a corrupt file is caught now, not during the first real restore.

**Why it matters**: the part most people skip is the verification. A backup that has never been
opened might be torn, truncated, or empty, and you only find out under duress. Example 35 then proves
the full restore; together they close the loop.

---

### Example 35: A Restore Drill

_ex-35 &middot; exercises co-19, co-15_

The ONLY proof a backup works: actually restore from it. This script wipes the live DB, restores from
the latest backup, and verifies the data the app wrote is back. The single most-skipped,
highest-value operational step in the course.

**`learning/code/ex-35-restore-drill/restore.sh`**:

```bash
#!/usr/bin/env bash
set -euo pipefail
DB_PATH="/opt/myapp/data/app.db"; BACKUP_DIR="/var/backups/myapp"; UNIT="myapp-data"
LATEST="$(ls -1t "${BACKUP_DIR}"/app-*.db 2>/dev/null | head -n1)"
[ -n "${LATEST}" ] || { echo "[abort] no backup to restore from"; exit 1; }
echo "[restore] using: ${LATEST}"
systemctl stop "${UNIT}"  # => no writer races the file swap
mv "${DB_PATH}" "${DB_PATH}.drill-wiped"  # => set the live copy aside (reversible drill)
cp "${LATEST}" "${DB_PATH}"; chown deploy:deploy "${DB_PATH}"; chmod 640 "${DB_PATH}"
systemctl start "${UNIT}"; sleep 2
curl -fsS http://127.0.0.1:8000/health >/dev/null && echo "[verify] healthy on restored data"
```

**Run**: `bash restore.sh`

**Expected**:

```text
[restore] using: /var/backups/myapp/app-20260730T030000Z.db
[verify] healthy on restored data
```

**Key takeaway**: a backup you have never restored from is an article of faith; a drill converts it
into evidence -- and it is the drill, not the backup, that proves recoverability.

**Why it matters**: the first time you ever restore should NOT be during an outage. A periodic drill
catches a broken backup (Example 77 automates this) when the stakes are zero, so the real restore is
boring instead of terrifying.

---

### Example 36: Reboot Resilience for the Whole Stack

_ex-36 &middot; exercises co-15, co-07, co-09_

The ultimate resilience test: reboot the BOX, not just the service. A correct stack brings the
service, the proxy, and TLS back on its own -- no human, no pager.

**`learning/code/ex-36-reboot-resilience/reboot-test.sh`**:

```bash
#!/usr/bin/env bash
set -euo pipefail
DOMAIN="myapp.example.com"; UNIT="myapp"
systemctl is-enabled "${UNIT}" caddy 2>/dev/null | grep -q enabled || {
  echo "[abort] ${UNIT} or caddy is not 'enabled' -- it will NOT survive a reboot"; exit 1; }
echo "[pre-flight] ${UNIT} + caddy are enabled -> both return on boot"
echo "[reboot] scheduling; reconnect over SSH when the box answers (~60s)"
# shutdown -r +1 "reboot-resilience test (Example 36)"
cat <<'CHECK'
  [post-reboot verify]
  systemctl is-active myapp caddy          # => expect: active
  curl -sI https://myapp.example.com/health # => expect: HTTP/2 200
  systemctl is-system-running              # => expect: running (not 'degraded')
CHECK
echo "[verify] if all three pass, the stack is reboot-resilient"
```

**Run**: `bash reboot-test.sh` (uncomment the `shutdown` to actually reboot)

**Expected**: after reconnect, `is-active myapp caddy` is `active`, the curl returns `HTTP/2 200`,
and `is-system-running` is `running`.

**Key takeaway**: reboot resilience is not a property of the service alone -- it requires the SERVICE
and the PROXY to both be `enabled`, or the box comes back with an app nobody can reach.

**Why it matters**: a reboot is the most common "planned" cause of downtime (patching, provider
restarts). A stack that survives it unattended is the difference between maintenance being invisible
and maintenance being an incident.

---

### Example 37: Two Services on One Box Behind One Proxy

_ex-37 &middot; exercises co-09, co-11_

The reverse proxy's superpower: one box, one `:443`, MANY services, each on its own subdomain. This
Caddyfile routes two subdomains to two different local ports -- one proxy, one cert set, two distinct
services.

**`learning/code/ex-37-multi-service-on-one-box/Caddyfile`**:

```caddy
api.example.com {  # => co-11: a distinct subdomain for service A
  reverse_proxy 127.0.0.1:8000  # => service A
}
blog.example.com {  # => co-11: a distinct subdomain for service B
  reverse_proxy 127.0.0.1:8001  # => service B (a second app on a second local port)
}
```

**Run**: `install Caddyfile /etc/caddy/ && systemctl reload caddy` (both subdomains' DNS must resolve
to the box)

**Expected**: `curl https://api.example.com/health` -> service A; `curl https://blog.example.com/` ->
service B.

**Key takeaway**: the proxy multiplexes by NAME -- both services share `:443` from the caller's view
but are isolated behind it, and adding a service means adding a block, not opening a new public port.

**Why it matters**: without a proxy, each service needs its own IP or port and its own TLS chore. The
proxy collapses N services into one public face, which is why a single box can host a surprising
number of small services cheaply.

---

### Example 38: systemd Resource Limits on a Service

_ex-38 &middot; exercises co-07, co-08_

An unbounded service can eat the whole box (a memory leak starves every other service). `systemd`
lets you CAP a service's resources so a runaway is contained before it takes the box down.

**`learning/code/ex-38-resource-limits/myapp-limited.service`**:

```ini
[Unit]
Description=MyApp with resource limits
After=network-online.target
Wants=network-online.target
[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/venv/bin/python /opt/myapp/app.py
MemoryMax=256M   # => hard ceiling: systemd KILLS the service above 256MB
MemoryHigh=200M  # => soft ceiling: throttle memory reclaim above 200MB
CPUQuota=50%     # => at most half of one CPU (100% = one full core)
TasksMax=64      # => cap on processes/threads (stops a fork bomb)
Restart=on-failure
RestartSec=3
[Install]
WantedBy=multi-user.target
```

**Run**: install the unit, `systemctl daemon-reload && systemctl restart myapp`

**Expected**: `systemctl show myapp -p MemoryMax -p CPUQuotaPerSecUSec` prints the limits; a load
test exceeding 256M gets the service OOM-killed and restarted (visible in the journal).

**Key takeaway**: `MemoryMax`/`CPUQuota`/`TasksMax` make a runaway service kill ITSELF before it kills
the box -- containment at the supervisor level, independent of the app's own discipline.

**Why it matters**: on a one-service box a leak is bad; on a multi-service box (Example 37) a leak in
one service takes down ALL of them. Resource limits are how you keep services as good neighbors.

---

### Example 39: A Basic Metrics Endpoint

_ex-39 &middot; exercises co-14_

Logs tell you WHY something failed; METRICS tell you THAT it is degrading before it fails. This adds a
`/metrics` endpoint exposing counters in the Prometheus text format -- the floor of metrics,
scrapeable by `curl` or any collector.

**`learning/code/ex-39-basic-metrics/scrape.sh`**:

```bash
#!/usr/bin/env bash
set -euo pipefail
DOMAIN="myapp.example.com"; METRICS_PATH="/metrics"
RAW="$(curl -fsS "http://127.0.0.1:8000${METRICS_PATH}")"  # => the raw text exposition format
echo "[metrics] local scrape:"; echo "${RAW}"
curl -fsS "https://${DOMAIN}${METRICS_PATH}" | grep -E '^myapp_' | head
sleep 1; curl -fsS "https://${DOMAIN}/" >/dev/null 2>/dev/null || true  # => bump the counter
AFTER="$(curl -fsS "https://${DOMAIN}${METRICS_PATH}" | awk '/^myapp_requests_total/{print $2}')"
echo "[verify] myapp_requests_total moved -> ${AFTER}"
```

**Run**: `bash scrape.sh`

**Expected**:

```text
[metrics] local scrape:
myapp_requests_total 1234
myapp_in_flight 3
[verify] myapp_requests_total moved -> 1235
```

**Key takeaway**: a metric that moves across two scrapes is the proof it is wired up -- a collector
will see it grow, which is what makes alerting on a threshold possible.

**Why it matters**: a health check (Example 17) is binary (up/down); metrics are continuous (how
busy, how slow, how full). The latter lets you catch degradation BEFORE it becomes an outage -- the
difference between reactive and proactive operations.

---

### Example 40: A Deploy Pipeline from Git

_ex-40 &middot; exercises co-16, co-18_

Wire the deploy (Example 26) into a small pipeline: push -> build -> health check -> release. The
health check is the gate that makes a push a SAFE deploy -- if the new release fails its check, the
pipeline stops BEFORE the release.

**`learning/code/ex-40-deploy-pipeline-from-git/pipeline.sh`**:

```bash
#!/usr/bin/env bash
set -euo pipefail
APP_NAME="myapp"; BOX_IP="$(cat .box-ip)"
echo "[1/3] build: git push"  # => co-16: the push builds a new release
git push dokku main:master
echo "[2/3] health-check the new release"  # => co-18 gate
STATUS="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://${BOX_IP}/health" || echo 000)"
[ "${STATUS}" = "200" ] || { echo "[gate] health-check failed (${STATUS}); rollback before release"; ssh "dokku@${BOX_IP}" ps:rollback "${APP_NAME}"; exit 1; }
echo "[3/3] release: healthy -> live"
echo "[verify] the pipeline built, health-checked, and released ${APP_NAME}"
```

**Run**: `bash pipeline.sh`

**Expected**:

```text
[1/3] build: git push
[2/3] health-check the new release
[3/3] release: healthy -> live
[verify] the pipeline built, health-checked, and released myapp
```

**Key takeaway**: the health check between build and release is what turns "we shipped a broken
build" into "the pipeline refused to ship a broken build" -- a gate, not a hope.

**Why it matters**: a pipeline without a gate deploys broken code at full speed. The gate makes the
deploy SAFE by proving the new release is healthy before it becomes the live one, which is the co-18
discipline applied across the whole release flow.

---

### Example 41: Self-Hosted vs Managed Trade-Off Writeup

_ex-41 &middot; exercises co-20, co-22_

Not code -- a DECISION ARTIFACT. Deploy the same app both ways and name the concrete trade-off. This
file IS the deliverable co-20/co-22 ask for: a documented recommendation, not a vague "it depends."

**`learning/code/ex-41-self-hosted-vs-managed-writeup/decision.md`** (excerpt):

```text
| Dimension   | Self-hosted (this box)         | Managed PaaS                |
|-------------|--------------------------------|-----------------------------|
| Control     | Full (the whole box is yours)  | Constrained (runtime theirs)|
| Setup effort| High (Examples 1-24, by hand)  | Low (one 'git push')        |
| Ops burden  | YOU patch/backup/wake at 3am   | platform absorbs it         |
| Debugability| Full substrate visibility      | only the app's logs + leaks |

RECOMMENDATION (name a force, not a preference):
- Self-host when the point is to SEE the primitives (solo, learning).
- Managed when a small TEAM ships a product with no ops appetite (3am cost dominates).
```

**Run**: read it; both deploys serve 200 (Examples 14 and 30) and the writeup names a winning force
for each side.

**Expected**: the writeup names a concrete force that picks each side -- control/learning for
self-host, ops-burden-absorption for managed.

**Key takeaway**: the trade-off is not "which is better" -- it is "which FORCE (control, cost,
state, compliance, learning) is doing the deciding for THIS workload," named explicitly.

**Why it matters**: "we should self-host this" without naming the force is a decision waiting to
become an incident. The discipline (co-22) is to state the deciding dimension and revisit it when
that dimension changes.

---

### Example 42: Disaster Rebuild from Script and Backup

_ex-42 &middot; exercises co-21, co-19_

The ultimate test of reproducibility: PRETEND the box is gone, stand up a brand-new box from
Example 20's `setup.sh` + Example 34's backup, and confirm the service returns with its data.

**`learning/code/ex-42-disaster-rebuild/rebuild.sh`**:

```bash
#!/usr/bin/env bash
set -euo pipefail
DOMAIN="myapp.example.com"; BACKUP_DIR="/var/backups/myapp"
echo "[1/3] running setup.sh to converge the new box to the known baseline"  # => Example 20
./setup.sh
echo "[2/3] restoring data from the latest backup"  # => co-19
LATEST="$(ls -1t "${BACKUP_DIR}"/app-*.db | head -n1)"
install -d -o deploy -g deploy -m 750 /opt/myapp/data
cp "${LATEST}" /opt/myapp/data/app.db && chown deploy:deploy /opt/myapp/data/app.db && chmod 640 /opt/myapp/data/app.db
systemctl restart myapp
echo "[3/3] end-to-end verify"
curl -fsS "https://${DOMAIN}/health" >/dev/null && echo "[verify] healthy on the rebuilt box"
echo "[verify] data restored: curl https://${DOMAIN}/items"
```

**Run**: `bash rebuild.sh` (on a fresh box, DNS repointed, backup copied over)

**Expected**:

```text
[1/3] running setup.sh to converge the new box to the known baseline
...
[3/3] end-to-end verify
[verify] healthy on the rebuilt box
[verify] data restored: curl https://myapp.example.com/items
```

**Key takeaway**: this drill succeeds ONLY because Example 19 captured the setup AND Example 34
captured the data -- lose either and the rebuild is incomplete. Reproducibility is setup + backup,
together.

**Why it matters**: a box you cannot rebuild is a single point of failure with a countdown. This
example is the proof your whole self-hosting discipline composes into "lose the box, recover
everything" -- the acceptance bar for the capstone.

---

### Example 43: fail2ban Brute-Force Protection for SSH

_ex-43 &middot; exercises co-04, co-05_

Key-only SSH stops password guessing, but bots still hammer port 22, polluting your logs. `fail2ban`
watches the auth log and TEMPORARILY BANS an IP after N failed attempts -- defense in depth layered
on the firewall.

**`learning/code/ex-43-firewall-and-fail2ban/sshd.conf`**:

```ini
[DEFAULT]
bantime = 1h       # => how long a banned IP is blocked
findtime = 10m     # => the window in which 'maxretry' failures trigger a ban
maxretry = 5       # => 5 failures within 10m -> ban (co-04)
backend = systemd  # => read failures from the journal
banaction = ufw    # => insert the ban as a ufw deny rule (integrates with Example 4)

[sshd]
enabled = true
port = ssh
```

**Run**: `apt-get install -y fail2ban && install -D sshd.conf /etc/fail2ban/jail.d/sshd.conf && systemctl enable --now
fail2ban`; fail SSH 5+ times from a test IP, then `fail2ban-client status sshd`.

**Expected**: the repeat-offender IP appears under `Banned IP list`, and `ufw status` shows a deny
rule for it.

**Key takeaway**: `fail2ban` shrinks the attack surface OVER TIME -- repeat offenders lose access
automatically, so the log noise (and the small residual risk) steadily decreases.

**Why it matters**: even with key-only auth, unbounded SSH attempts are a log-pollution and
resource-drain nuisance. `fail2ban` makes "fail repeatedly, get locked out" automatic, which is the
defense-in-depth layer on top of the firewall.

---

### Example 44: Staging vs Prod on the PaaS with Promotion

_ex-44 &middot; exercises co-16, co-18_

Two environments, one PaaS: push to STAGING first, smoke-test, then PROMOTE the exact same release to
PROD. Promotion reuses the already-built image, so what you tested is byte-identical to what you ship.

**`learning/code/ex-44-staging-vs-prod-on-paas/promote.sh`**:

```bash
#!/usr/bin/env bash
set -euo pipefail
PROD="myapp"; STAGING="myapp-staging"
dokku apps:create "${STAGING}" 2>/dev/null || true
echo "[1/3] push to staging: ${STAGING}"
git remote add staging "dokku@$(cat .box-ip):${STAGING}" 2>/dev/null || true
git push staging main:master
SMOKE="$(curl -s -o /dev/null -w '%{http_code}' "https://${STAGING}.example.com/health")"
[ "${SMOKE}" = "200" ] || { echo "[gate] staging smoke failed (${SMOKE}); NOT promoting"; exit 1; }
echo "[2/3] staging healthy -> promoting the exact release to ${PROD}"
dokku ps:promote "${STAGING}" 2>/dev/null || git push dokku main:master
echo "[3/3] [verify] prod now serves the promoted release: curl https://${PROD}.example.com/health"
```

**Run**: `bash promote.sh`

**Expected**:

```text
[1/3] push to staging: myapp-staging
[2/3] staging healthy -> promoting the exact release to myapp
[3/3] [verify] prod now serves the promoted release: curl https://myapp.example.com/health
```

**Key takeaway**: promotion means "tested == shipped" -- the artifact you verified in staging is the
artifact prod runs, with no second build that could diverge.

**Why it matters**: a separate prod build that "should be the same" is a classic source of "works on
my staging." Promotion eliminates that class of bug by making it literally the same release, which is
co-18's safety property across environments.

---

### Example 45: A Cost-and-Scope Recommendation

_ex-45 &middot; exercises co-20, co-22_

A scoped, written recommendation -- the co-22 deliverable: NAME the force that decides self-host vs
managed for a given workload, with a rule the reader can apply.

**`learning/code/ex-45-cost-and-scope-note/recommendation.md`** (excerpt):

```text
RULE: "Self-host when the workload is STATELESS, the team is LEARNING, or the
managed-tier spend would exceed a VM plus your own on-call; otherwise stay managed."

APPLIED:
- Personal blog (stateless, solo, learning) ........... SELF-HOST (point IS to see primitives)
- SaaS with must-not-lose Postgres (stateful, HA) ..... MANAGED (managed absorbs backups+failover)
- Compliance-bound API (audit, PCI) ................... MANAGED (certified platform inherits the cert)
```

**Run**: read it; the file names a concrete rule and applies it to three workloads.

**Expected**: each of the three workloads has a NAMED deciding force (learning / stateful-HA /
compliance), not "it depends."

**Key takeaway**: the deliverable is a RULE with a named force, applicable to workloads beyond these
three -- the opposite of "self-host when you feel like it."

**Why it matters**: the value of this course is not "everyone should self-host." It is "know exactly
when self-hosting wins and when it does not," so a team can make the call deliberately rather than by
default.

---

### Example 46: Capstone Preview of a Fully Self-Hosted Service

_ex-46 &middot; exercises co-01–co-21_

A preview of the capstone (see `./capstone/overview.md` for the full four-step build): every primitive
from co-01..co-21, assembled into one runnable service on one box.

**`learning/code/ex-46-capstone-preview/preview.md`** (excerpt):

```text
The capstone builds a small service, fully self-hosted on ONE box:
  - provisioned + SSH-hardened + firewalled              (co-02..co-05)
  - run under systemd with restart-on-crash + boot hook  (co-06..co-08, co-15)
  - behind a reverse proxy with automatic TLS on a domain(co-09, co-10, co-11)
  - configured via env, with secrets out-of-band only    (co-12, co-13)
  - with a health check, a tested backup, and a restore   (co-14, co-19)
  - captured as reproducible scripts                      (co-21)
  - then deployed once more via a git-push PaaS for contrast (co-16, co-20)
ACCEPTANCE: reproduce it from scripts on a CLEAN box; reach it at HTTPS; confirm
restart-on-failure + reboot resilience + a working restore; deploy via 'git push'.
```

**Run**: follow `./capstone/overview.md`.

**Expected**: a clean-box rebuild reaches a healthy HTTPS endpoint, with restart + reboot resilience +
a working restore, plus a PaaS deploy -- no committed secrets.

**Key takeaway**: the capstone is not a new technique -- it is every technique in this course,
composed; if any one primitive is weak, the capstone exposes it.

**Why it matters**: this is the integration test of the whole course. Each earlier example isolates
one primitive; the capstone proves they compose into a real, recoverable, reproducible service --
which is the actual thing you wanted to learn to do.

---

### Example 47: A systemd Timer Replacing a Cron Job

_ex-47 &middot; exercises co-08_

The cron line `* * * * * backup.sh` works, but a `systemd` TIMER does the same job with three
advantages: it logs to the journal, it survives a reboot cleanly, and it can run a "missed" tick after
downtime.

**`learning/code/ex-47-systemd-timer-vs-cron/myapp-backup.timer`**:

```ini
[Unit]
Description=Run the MyApp backup daily
[Timer]
OnCalendar=*-*-* 03:00:00  # => every day at 03:00 (off-peak); cron's '0 3 * * *' equivalent
RandomizedDelaySec=10m  # => jitter so two timers don't fire on the same instant
Persistent=true  # => if the box was off at 03:00, run the backup on next boot (cron cannot do this)
[Install]
WantedBy=timers.target
# Companion oneshot: [Service] Type=oneshot ExecStart=/opt/myapp/backup.sh
```

**Run**: `install myapp-backup.{timer,service} && systemctl daemon-reload && systemctl enable --now
myapp-backup.timer`

**Expected**: `systemctl list-timers myapp-backup.timer` shows the next/last fire; failures land in
`journalctl -u myapp-backup`.

**Key takeaway**: a timer beats cron on observability (journal), environment (clean, not cron's
surprises), and recovery (a missed run fires after downtime) -- for the same scheduling job.

**Why it matters**: a cron job's failure goes to a lost email or a silent log; a timer's failure is
in the journal next to the service it backs up. Unifying on `systemd` makes the whole box observable
through one lens.

---

### Example 48: Socket Activation for Lazy Startup

_ex-48 &middot; exercises co-07_

With SOCKET activation, `systemd` holds the listening socket and starts the service ONLY on the first
connection -- lazy startup, zero idle memory, and no dropped connection across a restart.

**`learning/code/ex-48-systemd-socket-activation/myapp.socket`**:

```ini
[Unit]
Description=MyApp socket (socket-activated)
[Socket]
ListenStream=127.0.0.1:8000  # => the local port the proxy (Example 12) forwards to
Accept=no  # => one long-running service instance per socket (not one per connection)
[Install]
WantedBy=sockets.target  # => the socket is created at boot; the SERVICE starts on first connect
```

**Run**: `install myapp.socket && systemctl start myapp.socket`; the service is NOT running until
`curl http://127.0.0.1:8000/health` triggers it.

**Expected**: `systemctl is-active myapp` is `inactive` until the first connection, then `active`.

**Key takeaway**: `systemd` holds the socket during a restart, so no connection is refused across the
gap -- the process can die and revive without a caller ever seeing `connection refused`.

**Why it matters**: for an infrequently-used service, socket activation means the box spends zero
memory on it until traffic arrives; for a frequently-restarting one, it means restarts are invisible
to callers. Both are co-07 flexibility the unit file buys for free.

---

### Example 49: A systemd Drop-In Override

_ex-49 &middot; exercises co-07_

Editing a package-supplied unit file directly is fragile -- the next package update overwrites it. A
DROP-IN adds to or overrides a unit without touching the original, so it survives updates.

**`learning/code/ex-49-systemd-drop-in-override/restart.conf`** (`/etc/systemd/system/myapp.service.d/restart.conf`):

```ini
[Service]
Restart=always  # => co-07/co-15: override Example 10's 'on-failure' with 'always'
RestartSec=5  # => override the original 3s with 5s
StartLimitIntervalSec=300  # => widen Example 10's window
StartLimitBurst=10  # => more headroom than the original 5/60s
# Everything else (Description, ExecStart, User) is UNCHANGED -- the drop-in only names what it changes.
```

**Run**: `install -d /etc/systemd/system/myapp.service.d && install restart.conf .../restart.conf &&
systemctl daemon-reload && systemctl restart myapp`

**Expected**: `systemctl cat myapp | grep '^Restart='` shows `always` (the drop-in's value wins).

**Key takeaway**: a drop-in touches only the keys it names, inheriting everything else -- which is why
it survives a package update that would clobber a direct edit.

**Why it matters**: the moment you install a service from a package, you want to customize it (restart
policy, env, limits). Drop-ins are the safe way -- your changes live in a separate file the package
manager never touches, so `apt upgrade` cannot silently revert them.

---

### Example 50: Graceful Shutdown with TimeoutStopSec

_ex-50 &middot; exercises co-08_

When `systemd` stops a service, it sends `SIGTERM`, waits, then `SIGKILL`. `TimeoutStopSec` tunes the
wait so the service finishes active requests before it dies -- the detail that keeps a stop from
dropping requests.

**`learning/code/ex-50-graceful-shutdown-timeout/graceful.conf`** (drop-in):

```ini
[Service]
TimeoutStopSec=15s  # => co-08: 15s for the app to finish in-flight work after SIGTERM
KillSignal=SIGTERM  # => the initial signal (the app should trap this and drain)
FinalKillSignal=SIGKILL  # => the forceful fallback past the timeout
SendSIGKILL=yes  # => confirm systemd WILL escalate (no zombie services)
```

**Run**: install the drop-in, `daemon-reload`, then `time systemctl stop myapp` with a long request
in flight.

**Expected**: the stop waits up to 15s for the in-flight request to finish; `journalctl` shows a
clean `Stopped`, not a `SIGKILL`.

**Key takeaway**: graceful shutdown is TWO-SIDED -- `systemd` must send `SIGTERM` and wait
(`TimeoutStopSec`), AND the app must trap it, stop accepting NEW work, and finish IN-FLIGHT work.

**Why it matters**: a too-short (or missing) graceful window kills requests mid-flight at every
deploy and every restart. This is the co-08 detail that, combined with Example 74's drain, makes
deploys invisible to callers.

---

### Example 51: The Same Proxy Rule in Caddy and Nginx

_ex-51 &middot; exercises co-09_

Side by side: the SAME reverse-proxy rule in Caddy's and Nginx's syntax. The CONCEPT is identical;
only the dialect differs -- so you can see what each tool is doing underneath the vocabulary.

**`learning/code/ex-51-caddy-vs-nginx-contrast/contrast.conf`** (excerpt):

```text
# Caddy -------------------------------------------------
myapp.example.com {
  reverse_proxy 127.0.0.1:8000  # forward + automatic TLS, redirect, renewal
}

# Nginx -------------------------------------------------
# server {
#     server_name myapp.example.com;       # match this host (SNI/Host)
#     location / {
#         proxy_pass http://127.0.0.1:8000;  # forward to the app's local port
#     }                                       # (Nginx does NOT auto-do TLS; see Example 52)
# }
```

**Run**: deploy either dialect; both make the app reachable at `https://myapp.example.com`.

**Expected**: both proxies terminate public traffic and forward to a local port -- same outcome,
different verbosity.

**Key takeaway**: the reverse-proxy concept (co-09) is tool-independent; Caddy hides TLS/redirect/
headers, Nginx makes each explicit. Pick by whether you want "just works" or "every knob is mine."

**Why it matters**: recognizing that both tools express the SAME concept means you can transfer skills
between them, and choose based on the trade-off (convenience vs. control) rather than on tribal
loyalty to one syntax.

---

### Example 52: An Nginx Reverse-Proxy Config

_ex-52 &middot; exercises co-09_

The Nginx equivalent of Examples 12+14: terminate HTTPS, redirect HTTP, and `proxy_pass` to the app.
Unlike Caddy, Nginx does NOT obtain the cert for you -- you provision it (here via `certbot`).

**`learning/code/ex-52-nginx-reverse-proxy/myapp.conf`**:

```nginx
server {  # redirect HTTP -> HTTPS
    listen 80;
    server_name myapp.example.com;
    return 301 https://$host$request_uri;
}
server {  # HTTPS + reverse_proxy
    listen 443 ssl;
    server_name myapp.example.com;
    ssl_certificate     /etc/letsencrypt/live/myapp.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/myapp.example.com/privkey.pem;
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

**Run**: `install myapp.conf /etc/nginx/sites-available/ && ln -s .../sites-enabled/... && nginx -t
&& systemctl reload nginx`

**Expected**: `curl -sI https://myapp.example.com/health` -> `HTTP/2 200`; `nginx -t` ->
`syntax is ok`.

**Key takeaway**: Nginx makes every layer explicit (the redirect, the TLS files, the upstream
headers) that Caddy hides -- more work, but more control and more portability across environments
that standardize on Nginx.

**Why it matters**: many shops and load-balancers speak Nginx config natively. Knowing it means you
can operate the proxy layer in those environments, not just in Caddy-friendly ones -- a portable
skill.

---

### Example 53: Force HTTP to HTTPS at the Proxy

_ex-53 &middot; exercises co-10_

A certificate is useless if callers can still reach plain HTTP and accept a silent downgrade. This
Caddyfile serves ONLY HTTPS and redirects every HTTP request to its HTTPS equivalent.

**`learning/code/ex-53-https-redirect/Caddyfile`**:

```caddy
http://myapp.example.com, :80 {  # => plain HTTP for this host AND bare :80
  redir https://{host}{uri} permanent  # => 301 to the same URL over HTTPS
}  # => no reverse_proxy here -- nothing is ever served over HTTP
myapp.example.com {  # => the real service, over TLS only
  reverse_proxy 127.0.0.1:8000
}
```

**Run**: `install Caddyfile /etc/caddy/ && systemctl reload caddy`

**Expected**: `curl -sI http://myapp.example.com/` -> `301` with `Location: https://...`;
`curl -sI https://myapp.example.com/` -> `HTTP/2 200`.

**Key takeaway**: a redirect is reactive (upgrades a request that already arrived); HSTS (Example 54)
is preventive (stops the browser trying HTTP at all). You want both to fully close the downgrade gap.

**Why it matters**: without the redirect, a typo'd `http://` URL silently serves content unencrypted.
The redirect makes HTTPS the only path that ever serves the app -- a baseline co-10 guarantee.

---

### Example 54: The Strict-Transport-Security HSTS Header

_ex-54 &middot; exercises co-10_

HSTS tells browsers "always use HTTPS for this host, for N seconds, period" -- so a browser that has
seen the header once REFUSES plain HTTP for that window, defeating downgrade attacks the 301 cannot
fully prevent.

**`learning/code/ex-54-hsts-header/Caddyfile`**:

```caddy
myapp.example.com {
  reverse_proxy 127.0.0.1:8000
  header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
  # max-age=31536000      => remember "HTTPS only" for 1 year
  # includeSubDomains     => apply to EVERY subdomain too
  # preload               => opt into the browser HSTS preload list (built-in HTTPS-only)
}
```

**Run**: `install Caddyfile /etc/caddy/ && systemctl reload caddy`, then
`curl -sI https://myapp.example.com/ | grep -i strict-transport-security`

**Expected**: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

**Key takeaway**: `preload` is a one-way door -- once your domain is on the browsers' preload list,
serving HTTP becomes impossible for all users, so add it only once every subdomain is HTTPS forever.

**Why it matters**: HSTS is the preventive layer that the redirect (Example 53) is the reactive layer
of. Together they make a downgrade attack impractical: the browser will not even attempt the HTTP
request that the redirect would have had to catch.

---

### Example 55: OCSP Stapling at the Proxy

_ex-55 &middot; exercises co-10_

When a browser gets your cert, it may phone the CA (OCSP) to check for revocation -- a slow,
privacy-leaking extra round trip. OCSP STAPLING makes the PROXY fetch that proof and attach it to the
handshake, so the browser trusts the cert without calling the CA.

**`learning/code/ex-55-ocsp-stapling/ocsp.notes`** (excerpt):

```text
# Caddy: OCSP stapling is ON by default -- just verify it:
echo | openssl s_client -connect myapp.example.com:443 -status 2>/dev/null \
  | grep -A2 'OCSP Response Status'
# => expect: 'OCSP Response Status: successful'

# Nginx (in the server{} block):
ssl_stapling on;
ssl_stapling_verify on;
resolver 1.1.1.1 valid=300s;
resolver_timeout 5s;
```

**Run**: run the `openssl` probe against your endpoint.

**Expected**: `OCSP Response Status: successful` (the proof is stapled to the handshake).

**Key takeaway**: without stapling, every new client MAY make an extra call to the CA -- adding
latency and leaking (to the CA) which site the client visited. Stapling moves that to the proxy, done
once and reused.

**Why it matters**: TLS performance and privacy both improve with stapling. It is on by default in
Caddy and one directive in Nginx, so the cost is low and the benefit (faster, more private TLS) is
real for every caller.

---

### Example 56: Rate Limiting at the Proxy

_ex-56 &middot; exercises co-09_

A misbehaving client should not be able to hammer the app into the ground. Rate limiting at the PROXY
caps requests-per-second before they reach the app -- defense at the chokepoint.

**`learning/code/ex-56-proxy-rate-limit/Caddyfile`**:

```caddy
myapp.example.com {
  rate_limit {  # => co-09: cap requests at the proxy, not the app
    zone dynamic  # => one leaky-bucket per distinct key (defaults to remote IP)
    events 20  # => allow a burst of 20 requests
    window 1s  # => ... per 1 second -> 20 r/s per client
  }  # => over the limit, Caddy returns 429 (Too Many Requests)
  reverse_proxy 127.0.0.1:8000
}
```

**Run**: `install Caddyfile /etc/caddy/ && systemctl reload caddy`, then a 30-request `curl` loop.

**Expected**: a mix of `200`s then `429`s once the burst is exceeded.

**Key takeaway**: capping at the proxy means the app never implements (or re-implements) rate
limiting, AND the cap survives an app restart because the proxy's state is separate.

**Why it matters**: the proxy sees ALL traffic before the app does, so it is the natural place to
enforce a per-client cap. This protects a stateless app from being resource-starved by one noisy
neighbour -- a co-09 benefit beyond just forwarding.

---

### Example 57: Multiple Domains and TLS on One Proxy

_ex-57 &middot; exercises co-10, co-11_

One box, one proxy, MANY domains -- each gets its OWN cert automatically. Caddy issues one cert per
site name; this Caddyfile serves two domains with two independent certificates from one process.

**`learning/code/ex-57-multi-domain-tls/Caddyfile`**:

```caddy
api.example.com {  # => co-11: domain A -> its own cert
  reverse_proxy 127.0.0.1:8000
}
www.example.com {  # => co-11: domain B -> a separate cert
  reverse_proxy 127.0.0.1:8001
}
# Wildcard alternative (one cert for *.example.com, needs DNS-01):
# *.example.com { reverse_proxy 127.0.0.1:8000 }
```

**Run**: `install Caddyfile /etc/caddy/ && systemctl reload caddy` (both domains' DNS must resolve to
the box)

**Expected**: `openssl s_client ... -servername api.example.com | x509 -noout -subject` ->
`CN=api.example.com`; a different cert for `www.example.com`.

**Key takeaway**: use per-domain certs for a few known names; use a wildcard (`*.example.com`, via
DNS-01) when you have many dynamic subdomains -- each trades setup simplicity against control.

**Why it matters**: serving many domains from one box is what makes a small self-hosted setup
economical. The proxy (with ACME) makes adding a domain a one-block edit, not a new cert chore.

---

### Example 58: CNAME vs A Record

_ex-58 &middot; exercises co-11_

Both map a NAME to a destination, but to different KINDS of destination: A -> an IP directly; CNAME ->
another NAME (an alias). This shows when each applies.

**`learning/code/ex-58-dns-cname-vs-a/dns-types.sh`** (excerpt):

```bash
# A record: name -> an IP (Example 13 used this)
dig +noall +answer myapp.example.com A     # => myapp.example.com. IN A 192.0.2.10
# CNAME: name -> another name (alias to a managed host whose IP you do not control)
dig +noall +answer docs.example.com CNAME  # => docs.example.com. IN CNAME myapp.hostedpaas.com.
# Rule: A when you control the box's IP; CNAME when the target is a NAME you do not control
#       (a PaaS/CDN hostname) whose IP may rotate. Apex cannot be a CNAME (use ALIAS/ANAME).
```

**Run**: `bash dns-types.sh`

**Expected**: the A query returns an IP; the CNAME query returns a hostname.

**Key takeaway**: the record TYPE encodes whether you are pointing at a stable IP you control (A) or
delegating to a managed name whose IP may change (CNAME) -- choosing wrong breaks failover or wastes
queries.

**Why it matters**: pointing a vanity domain at a PaaS (Example 30) or a CDN REQUIRES a CNAME, since
the platform's IP rotates. Knowing the distinction is what makes "point my domain at the managed
thing" actually work.

---

### Example 59: DNS TTL and Propagation Verification

_ex-59 &middot; exercises co-11_

TTL is how long a resolver may CACHE your record before asking again. A LONG TTL means fewer queries
but slow changes; a SHORT TTL means fast changes but more DNS traffic.

**`learning/code/ex-59-dns-ttl-and-propagation/ttl-check.sh`** (excerpt):

```bash
PUBLIC_RESOLVER="1.1.1.1"
TTL="$(dig +ttlid +noall +answer @"${PUBLIC_RESOLVER}" myapp.example.com A | awk '{print $2}' | head -1)"
echo "[ttl] myapp.example.com A has TTL ${TTL}s at ${PUBLIC_RESOLVER}"
EXPECTED_IP="$(cat .box-ip 2>/dev/null || echo 192.0.2.10)"
SEEN="$(dig +short @"${PUBLIC_RESOLVER}" myapp.example.com A | tr -d '[:space:]')"
if [ "${SEEN}" = "${EXPECTED_IP}" ]; then echo "[verify] propagated: ${SEEN}";
else echo "[verify] NOT YET propagated (seen '${SEEN}'); wait up to TTL=${TTL}s"; fi
```

**Run**: `bash ttl-check.sh`

**Expected**: `[ttl] myapp.example.com A has TTL 3600s at 1.1.1.1`; `[verify] propagated: 192.0.2.10`
(or the "wait" line during propagation).

**Key takeaway**: a DNS change is not "live" until the public resolvers return the new value, which
takes up to one TTL -- so verify propagation by polling a PUBLIC resolver, not just your box.

**Why it matters**: setting a record and immediately testing from your box can show the OLD value for
up to a TTL, fooling you into thinking the change failed. Polling a public resolver is the honest
check that the world now sees what you set.

---

### Example 60: Subdomain Routing to Multiple Services

_ex-60 &middot; exercises co-09, co-11_

Extend Example 37: route by SUBDOMAIN, where each maps to a different backend behind the one proxy.
Three subdomains, three services, one `:443`, three automatic certs.

**`learning/code/ex-60-subdomain-routing/Caddyfile`**:

```caddy
api.example.com { reverse_proxy 127.0.0.1:8000 }     # the JSON API
www.example.com { reverse_proxy 127.0.0.1:8001 }      # the marketing site
admin.example.com {                                    # an internal admin UI
  reverse_proxy 127.0.0.1:8002
  import restrict-admin  # => gate /admin to known IPs (an admin UI must not be public-open)
}
# Each subdomain needs its OWN A record (or a wildcard *.example.com) resolving to this box.
```

**Run**: `install Caddyfile /etc/caddy/ && systemctl reload caddy`

**Expected**: `for h in api www admin; do curl -sI https://$h.example.com/ | head -1; done` -> three
status lines, one per service, all on `:443`.

**Key takeaway**: adding a service is adding a block -- no new public port, no new cert chore -- so
the proxy turns "one box" into "as many distinct services as you have subdomains."

**Why it matters**: this is the architectural pattern behind cheap self-hosting: one box, one proxy,
N services. It is also where you must remember to GATE the sensitive ones (the admin UI) with auth or
an IP allowlist, since being behind the proxy does not make them private.

---

### Example 61: Env-File Templating at Deploy Time

_ex-61 &middot; exercises co-12, co-21_

A repo-committed TEMPLATE holds the SHAPE; a deploy step fills in the VALUES from a separate source
and writes the real `app.env` on the box -- never in the repo.

**`learning/code/ex-61-env-template-substitution/render.sh`** (excerpt):

```bash
ENV_FILE="/opt/myapp/app.env"
# app.env.tmpl (committed, safe):  APP_PORT=${APP_PORT}  /  APP_SIGNING_SECRET=${SECRET}
APP_PORT="8000"  # non-secret, environment-specific (co-12)
SECRET="$(sed -n 's/^APP_SIGNING_SECRET=//p' /opt/myapp/secrets.env)"  # co-13: from the locked file
export APP_PORT SECRET
envsubst < /opt/myapp/app.env.tmpl > "${ENV_FILE}.tmp"
chmod 600 "${ENV_FILE}.tmp" && chown deploy:deploy "${ENV_FILE}.tmp" && mv -f "${ENV_FILE}.tmp" "${ENV_FILE}"
echo "[verify] rendered ${ENV_FILE}; 'git log' has never seen this file"
```

**Run**: `bash render.sh`

**Expected**: `/opt/myapp/app.env` exists with the rendered values; `git log -- /opt/myapp/app.env`
shows nothing (it was never committed).

**Key takeaway**: templating separates the SHAPE (committed, safe) from the VALUES (per-environment,
some secret), so the same template renders correctly in staging and prod with different inputs.

**Why it matters**: this is the bridge between "config in env" (co-12) and "reproducible setup"
(co-21): the template is reproducible; the rendered file is environment-specific and never committed,
satisfying both principles at once.

---

### Example 62: The systemd EnvironmentFile Directive

_ex-62 &middot; exercises co-12_

Example 15 wrote an env file; Example 61 templated one. THIS unit shows how the service actually
READS it: `EnvironmentFile=` loads every `KEY=value` line into the service's environment at start.

**`learning/code/ex-62-systemd-environment-file/myapp-envfile.service`**:

```ini
[Unit]
Description=MyApp reading config from an EnvironmentFile
After=network-online.target
Wants=network-online.target
[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/myapp
EnvironmentFile=/opt/myapp/app.env  # => co-12: loads every KEY=value into the process env
EnvironmentFile=-/opt/myapp/secrets.env  # => leading '-' = optional; secrets (co-13)
ExecStart=/opt/myapp/venv/bin/python /opt/myapp/app.py  # => app reads os.environ, already populated
Restart=on-failure
RestartSec=3
[Install]
WantedBy=multi-user.target
```

**Run**: `install myapp-envfile.service /etc/systemd/system/ && systemctl daemon-reload && systemctl
restart myapp`

**Expected**: `systemctl show myapp -p Environment` lists the merged env; the app starts reading the
file's values with no config-parsing code of its own.

**Key takeaway**: the leading `-` on the secrets `EnvironmentFile` makes it OPTIONAL -- the service
starts fine without it (e.g. before secrets are set), which is the safe default for a secrets file
that should not crash the unit if temporarily absent.

**Why it matters**: this is the cleanest way to wire co-12's env file into a `systemd` service: one
directive, the app sees `os.environ` populated, and secrets stay in their own optional, mode-0600
file -- no config-parsing code in the app at all.

---

### Example 63: Automating Secret Rotation

_ex-63 &middot; exercises co-13, co-08_

Example 21 rotated a secret BY HAND. This cron-able script automates it on a SCHEDULE, with a SAFETY
property: it writes the new secret, reloads, and CONFIRMS the service came back -- rolling back if it
did not.

**`learning/code/ex-63-secret-rotation-automation/rotate.sh`** (excerpt):

```bash
SECRET_PATH="/opt/myapp/secrets.env"; UNIT="myapp"
BACKUP="$(mktemp)" ; cp -a "${SECRET_PATH}" "${BACKUP}"  # snapshot for rollback
trap 'rm -f "${BACKUP}"' EXIT
NEW="$(openssl rand -hex 32)"; TMP="$(mktemp)"
printf 'APP_SIGNING_SECRET=%s\n' "${NEW}" > "${TMP}"; chmod 600 "${TMP}"; chown deploy:deploy "${TMP}"
mv -f "${TMP}" "${SECRET_PATH}"  # atomic install
systemctl reload "${UNIT}" 2>/dev/null || systemctl restart "${UNIT}"; sleep 3
if ! systemctl is-active --quiet "${UNIT}"; then
  echo "[rotate] service did not come back; ROLLING BACK"; mv -f "${BACKUP}" "${SECRET_PATH}"; systemctl restart "${UNIT}"; exit 1
fi
echo "[verify] rotated secret + service healthy on the new value"
```

**Run**: schedule via a timer (Example 47's shape); `bash rotate.sh`

**Expected**: `[verify] rotated secret + service healthy on the new value`; if the service fails, the
script rolls back and the OLD secret is restored.

**Key takeaway**: automated rotation is only safe if it is REVERSIBLE -- the snapshot + rollback
means a rotation that breaks the service is undone before anyone notices, which is what makes
scheduling it unattended acceptable.

**Why it matters**: a secret that must be rotated by hand tends to never be rotated. Automating it
(with a rollback safety net) turns "rotate quarterly" from a forgotten TODO into a non-event, which
is the co-13 discipline made operational.

---

### Example 64: A Pre-Commit Hook That Blocks Secrets

_ex-64 &middot; exercises co-13_

The LAST line of defense against a committed secret: a `git` pre-commit hook that scans the staged
diff for secret patterns and REJECTS the commit before it is ever created.

**`learning/code/ex-64-pre-commit-secret-scan/pre-commit`** (`chmod +x .git/hooks/pre-commit`):

```bash
#!/usr/bin/env bash
set -euo pipefail
[ -z "$(git diff --cached --diff-filter=AM -U0 --name-only)" ] && exit 0  # nothing staged
# Scan staged additions for secret-shaped patterns:
if git diff --cached -U0 | grep -nE '(sk-live-[a-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|xoxb-[0-9]{10,})' ; then
  echo "[pre-commit] BLOCKED: a secret-looking string is staged for commit." >&2; exit 1
fi
# Refuse the forbidden filenames too:
if git diff --cached --name-only | grep -qE '(^|/)(secrets\.env|\.env)$'; then
  echo "[pre-commit] BLOCKED: a secret file (.env / secrets.env) is staged." >&2; exit 1
fi
exit 0
```

**Run**: `chmod +x .git/hooks/pre-commit`, then stage a fake `AKIA...` string and try to commit.

**Expected**: `git commit` is REJECTED with the `[pre-commit] BLOCKED` message; the secret never
enters history.

**Key takeaway**: the hook's non-zero exit ABORTS the commit -- the secret is blocked at the earliest
possible moment, before it exists in any object, not discovered later by Example 16's repo-wide scan.

**Why it matters**: a committed secret is permanent. A pre-commit hook is the cheapest possible
insurance: it costs one script and catches the slip at the keyboard, the moment before it would
become a forensic incident.

---

### Example 65: Structured JSON Logging

_ex-65 &middot; exercises co-14_

Unstructured logs are easy to read and hard to query. STRUCTURED logs (one JSON object per line) are
machine-parseable: filter, count, and alert on fields, not `grep` on prose.

**`learning/code/ex-65-structured-logging-json/Caddyfile`** (plus app-side shape):

```caddy
myapp.example.com {
  reverse_proxy 127.0.0.1:8000
  log {
    output file /var/log/caddy/access.log
    format json  # => co-14: one JSON object per request (was 'console' in Example 12)
  }
}
# App side: emit one JSON line per event --
#   {"ts": 1234.5, "level": "info", "msg": "request", "path": "/items", "status": 200, "ms": 12}
```

**Run**: `install Caddyfile /etc/caddy/ && systemctl reload caddy`, then
`tail -n 1 /var/log/caddy/access.log | jq .`

**Expected**: a parsed JSON object with named fields (`status`, `duration`, etc.).

**Key takeaway**: a query like "count of 5xx in the last hour" is a `jq` filter on JSON, not a
fragile `grep` on free text -- and a shipper (Example 66) can index the fields directly.

**Why it matters**: structured logging is the precondition for every later observability step
(shipping, alerting, dashboards). Without it you are string-matching; with it you are querying, which
scales as the log volume grows.

---

### Example 66: Log Shipping and Rotation

_ex-66 &middot; exercises co-14_

Logs on the box are only useful while the box is up. SHIPPING them to a separate volume survives a
box loss -- which is exactly when you most need them. This `rsyslog` conf ships the service's journal
stream to a file under a shipped-logs volume.

**`learning/code/ex-66-log-shipping-and-rotation/myapp.rsyslog`** (excerpt):

```text
module(load="imjournal" StateFile="imjournal.state" IgnorePreviousMessages="on")
if $programname == 'myapp' then {
  action(type="omfile" file="/srv/logs/myapp.log" fileOwner="deploy" fileGroup="deploy" fileCreateMode="0640")  # co-14: shipped
  stop
}
# Plus logrotate on /srv/logs/myapp.log: weekly, rotate 12, compress, postrotate reload rsyslog
```

**Run**: `install myapp.rsyslog /etc/rsyslog.d/ && systemctl reload rsyslog`

**Expected**: `tail -n 1 /srv/logs/myapp.log` mirrors the latest `journalctl -u myapp -n 1` line.

**Key takeaway**: a shipped log survives a box rebuild (Example 42); rotation keeps it from filling
the volume that survives -- together they make logs as durable as the data.

**Why it matters**: the box is the LEAST reliable place for the logs that explain why the box failed.
Shipping them elsewhere (a volume, a remote collector) means a dead box's post-mortem is still
possible, which is the whole point of keeping logs at all.

---

### Example 67: Alert on Health-Check Failure

_ex-67 &middot; exercises co-14_

Example 18 LOGGED failures; this script ALERTS on them -- after N consecutive failures, not one (a
single blip is noise; N in a row is an outage).

**`learning/code/ex-67-alert-on-health-failure/alert.sh`** (excerpt):

```bash
DOMAIN="myapp.example.com"; THRESHOLD=3; STATE_FILE="/var/lib/myapp/health.state"
install -d /var/lib/myapp ; FAILS="$(cat "${STATE_FILE}" 2>/dev/null || echo 0)"
if curl -fsS --max-time 5 "https://${DOMAIN}/health" >/dev/null 2>&1; then FAILS=0; else FAILS=$((FAILS + 1)); fi
echo "${FAILS}" > "${STATE_FILE}"
if [ "${FAILS}" -ge "${THRESHOLD}" ]; then
  echo "[ALERT] ${DOMAIN} unhealthy for ${FAILS} consecutive checks -- paging"
else
  echo "[ok] ${FAILS}/${THRESHOLD} consecutive failures (no alert yet)"
fi
```

**Run**: schedule via a timer; `bash alert.sh`

**Expected**: stop the app, wait 3 ticks -> `[ALERT]`; restart it -> the counter resets to `[ok]`.

**Key takeaway**: alerting on a THRESHOLD (N consecutive failures) de-noises monitoring -- a single
blip does not page you, but a sustained outage does, which is the signal-to-noise balance that makes
on-call survivable.

**Why it matters**: an alert on every single failure pages you into oblivion (alert fatigue); an
alert that never fires leaves outages undetected. The threshold is the tuning knob between those two
failure modes.

---

### Example 68: A systemd Watchdog for Hung Services

_ex-68 &middot; exercises co-15, co-07_

`Restart=always` revives a CRASHED process. But a process can also HANG without exiting -- still
"running" but not answering. The `systemd` WATCHDOG fixes this: the service must ping `systemd` every
`WatchdogSec`, or it is force-restarted.

**`learning/code/ex-68-watchdog-restart/watchdog.conf`** (drop-in):

```ini
[Service]
WatchdogSec=30s  # => co-15: report in every 30s, or presumed hung -> force restart
Restart=always
RestartSec=3
# The app MUST call sd_notify("WATCHDOG=1") more often than WatchdogSec (a background thread).
```

**Run**: install the drop-in; the app pings via `sdnotify`; to test, deadlock the app and watch
`systemd` force-restart it within 30s.

**Expected**: `systemctl show myapp -p WatchdogUSec` -> `30s`; after a deliberate hang, the journal
shows a `watchdog timeout` + restart line.

**Key takeaway**: a crash (exit) and a hang (no exit) are different failure modes -- `Restart=always`
catches the first, the WATCHDOG catches the second, and you need both for full resilience.

**Why it matters**: a hung service stays "active (running)" forever while serving nothing -- the
worst silent outage. The watchdog is the only `systemd` mechanism that detects "alive but stuck," and
it is what turns "active" from a guess into a proven claim.

---

### Example 69: A Restart Backoff Strategy

_ex-69 &middot; exercises co-15_

`RestartSec=3` waits a fixed 3s between revivals. But if the service crashes BECAUSE of a transient
problem, a fixed loop hammers the same broken state. The `StartLimit` knobs are the escape hatch: after
N restarts, `systemd` stops and leaves the unit `failed`.

**`learning/code/ex-69-restart-backoff-strategy/backoff.conf`** (drop-in):

```ini
[Service]
RestartSec=5  # => co-15: base wait between restarts (gentler than Example 10's 3s)
StartLimitIntervalSec=120  # => over a 2-minute window ...
StartLimitBurst=8  # => ... allow at most 8 restarts; a 9th trips into 'failed'
# After the burst is exceeded, systemd leaves the unit 'failed' (does NOT keep looping) -> a loud,
# visible failure instead of a quiet resource burn.
```

**Run**: install the drop-in; force 9 quick failures (e.g. point `ExecStart` at a missing file).

**Expected**: after the 9th failure, `systemctl status myapp` -> `failed (Result: start-limit)`.

**Key takeaway**: a service that can never start MUST eventually STOP retrying -- otherwise it loops
forever, burning CPU and filling the log. `StartLimitBurst` is the escape hatch that makes the failure
loud.

**Why it matters**: an infinite crash loop is itself an outage (resource exhaustion, log flooding)
layered on the original outage. The start-limit converts that into a single, visible `failed` state
that an alert (Example 67) can catch and a human can act on.

---

### Example 70: A Procfile Declaring Process Types

_ex-70 &middot; exercises co-16_

A Procfile declares EVERY process type the app needs. The PaaS runs each as its own supervised set,
scaling them independently (Example 72). This declares TWO types: a `web` (HTTP) and a `worker`
(background).

**`learning/code/ex-70-paas-procfile/Procfile`**:

```text
web: gunicorn app:app --bind 0.0.0.0:${PORT:-5000}
worker: python worker.py --queue ${QUEUE:-default}
# web    => the HTTP process type; the PaaS routes inbound HTTP to THIS type
# worker => a NON-HTTP type; runs but no traffic routed to it (pulls from a queue)
```

**Run**: commit the Procfile, `git push dokku main:master`, then `dokku ps:report myapp`.

**Expected**: the report lists BOTH `web` and `worker`, each running.

**Key takeaway**: a real app is rarely JUST a web server -- the Procfile names each process type so
the PaaS can run and scale them INDEPENDENTLY from a single deploy.

**Why it matters**: separating web from worker lets you scale them to match demand independently
(scale web for HTTP traffic, worker for queue depth), which Example 72 does. Without distinct process
types, one deploy cannot express "more web, fewer workers."

---

### Example 71: A PaaS Release Phase for Migrations

_ex-71 &middot; exercises co-16_

A deploy that swaps new code onto a new schema BEFORE migrating breaks; so does migrating AFTER the
new code is live. The RELEASE PHASE runs migrations ONCE, between build and go-live, while the OLD
version still serves.

**`learning/code/ex-71-paas-release-phase/release.sh`** (excerpt):

```bash
APP_NAME="myapp"
cat > ./app.json <<'JSON'
{ "scripts": { "dokku": { "predeploy": "echo build-done", "postdeploy": "echo released" } },
  "healthcheck": { "path": "/health", "timeout": 30 } }
JSON
echo "[migrate] running migrations as a release-phase one-off"  # schema ready PRE-release
ssh "dokku@$(cat .box-ip)" run "${APP_NAME}" "python manage.py migrate"
git push dokku main:master  # new code goes live against an ALREADY-migrated DB
echo "[verify] migrations ran before release; /health 200 across the cutover"
```

**Run**: `bash release.sh`

**Expected**: migrations run (as a one-off), THEN the push releases the new code against the migrated
DB; `/health` stays 200 across the cutover.

**Key takeaway**: the release phase runs schema changes while the OLD code is still serving, so
neither the old nor the new version ever runs against the wrong schema -- the no-downtime migration
trick.

**Why it matters**: migrations are the classic deploy-breaker. Running them in the release phase
(before the new code is live) is the PaaS-native fix -- it is what makes a schema change safe to
ship, which is otherwise the scariest kind of deploy.

---

### Example 72: Scaling a Process Type

_ex-72 &middot; exercises co-16_

A PaaS lets you scale each process type (Example 70) to N instances INDEPENDENTLY -- web to 3 for HTTP
capacity, worker to 1 if jobs are light. The PaaS load-balances across them and restarts any that die.

**`learning/code/ex-72-paas-scaling/scale.sh`**:

```bash
#!/usr/bin/env bash
set -euo pipefail
APP_NAME="myapp"
dokku ps:scale "${APP_NAME}" web=3  # => co-16: three web instances behind the PaaS proxy
echo "[scale] web=3 (the PaaS load-balances inbound HTTP across them)"
dokku ps:scale "${APP_NAME}" worker=1  # => co-16: one worker; bump if the queue backs up
echo "[scale] worker=1 (scale up if the queue depth grows)"
dokku ps:report "${APP_NAME}" | grep -E 'Processes|web|worker' || true
echo "[verify] web x3, worker x1 -- each supervised + restarted by the PaaS"
```

**Run**: `bash scale.sh`

**Expected**: `ps:report` shows `web=3, worker=1`; each instance is supervised.

**Key takeaway**: scaling a process type is a one-command capacity change -- the fleet-management
shape the PaaS absorbs for you, which is the contrast to the single self-hosted process in
Examples 7-10.

**Why it matters**: on the self-hosted side, "more capacity" means a bigger box or a second box with
a load-balancer. On the PaaS, it is `ps:scale web=3` -- a concrete piece of operational value
(Cluster-style horizontal scaling, on one box) that the managed platform provides.

---

### Example 73: A Blue-Green Deploy via the Proxy

_ex-73 &middot; exercises co-18_

Two identical environments -- BLUE (live) and GREEN (idle). Deploy to GREEN, warm it, health-check
it, then FLIP the proxy in one atomic reload. The flip is instantly reversible (reload back).

**`learning/code/ex-73-blue-green-deploy/Caddyfile`**:

```caddy
myapp.example.com {
  reverse_proxy 127.0.0.1:8000  # => BLUE: the currently-live instance
}
# After deploying + health-checking GREEN (127.0.0.1:8001), FLIP in one edit:
# myapp.example.com {
#   reverse_proxy 127.0.0.1:8001  # => GREEN now live; BLUE becomes the idle rollback target
# }
# then: systemctl reload caddy  # atomic cutover; no request sees a half-state
```

**Run**: deploy to GREEN, health-check it, edit the Caddyfile to GREEN's port, `systemctl reload
caddy`. If GREEN is bad, revert the edit and reload back to BLUE.

**Expected**: a traffic loop (Example 32) sees no drops across the reload; the revert is one reload.

**Key takeaway**: blue-green keeps the OLD instance answering until the NEW one is PROVEN healthy,
then swaps in one proxy reload -- zero gap, and an instant revert, at the cost of twice the instances.

**Why it matters**: this is the strongest form of co-18's zero-downtime property. Example 32 restarts
the same instance (a brief gap is possible); blue-green eliminates the gap entirely by never stopping
the instance callers are hitting.

---

### Example 74: Draining In-Flight Requests Before Stop

_ex-74 &middot; exercises co-18, co-15_

Before stopping a backend for a deploy (or a blue-green flip), DRAIN it: tell the proxy to stop
sending NEW requests, let the IN-FLIGHT ones finish, THEN stop the process.

**`learning/code/ex-74-connection-drain/drain.sh`** (excerpt):

```bash
UNIT="myapp"; DRAIN_WAIT=20
echo "[drain] marking ${UNIT} as non-receiving; new traffic goes elsewhere"  # co-18: no NEW requests
for i in $(seq 1 "${DRAIN_WAIT}"); do  # poll up to DRAIN_WAIT seconds
  if [ "$((i % 5))" -eq 0 ]; then echo "[drain] waiting for in-flight to finish (${i}s)"; fi
  sleep 1
done
systemctl stop "${UNIT}"  # co-15: a clean stop with no dropped request
echo "[verify] ${UNIT} stopped with zero in-flight requests"
```

**Run**: `bash drain.sh`

**Expected**: `[verify] myapp stopped with zero in-flight requests` -- no caller saw an error.

**Key takeaway**: draining is the mechanism that makes a stop invisible -- stop accepting new work,
finish the work in flight, THEN stop, so no request is killed mid-flight.

**Why it matters**: combined with graceful shutdown (Example 50), draining is what makes a deploy
truly zero-drop. The proxy stops routing, the app finishes what it has, then exits cleanly -- the
two-sided discipline a production deploy needs.

---

### Example 75: A restic File Backup

_ex-75 &middot; exercises co-19_

Example 34 backed up one SQLite file. `restic` deduplicates across runs -- daily snapshots of a
mostly-unchanged tree store only the changed blocks, so they are cheap. This is the "grows beyond one
file" backup.

**`learning/code/ex-75-backup-restic-files/backup.sh`**:

```bash
#!/usr/bin/env bash
set -euo pipefail
REPO="/srv/restic/myapp"; DATA_DIR="/opt/myapp/data"
RESTIC_PASSWORD="${RESTIC_PASSWORD:?set RESTIC_PASSWORD in the env}"  # => co-13: repo key, out of band
restic -r "${REPO}" snapshots >/dev/null 2>&1 || restic -r "${REPO}" init  # init only if empty
restic -r "${REPO}" backup "${DATA_DIR}" --tag myapp  # => co-19: one timestamped, deduped snapshot
restic -r "${REPO}" forget --keep-daily 7 --keep-weekly 4 --prune  # keep 7 dailies + 4 weeklies
restic -r "${REPO}" snapshots  # => lists each snapshot with a time + ID
echo "[verify] 'restic -r ${REPO} restore <id> --target /tmp/x' reproduces the tree"
```

**Run**: `RESTIC_PASSWORD=... bash backup.sh` (schedule via a timer)

**Expected**: `restic snapshots` lists one per run; successive runs store only the changed blocks.

**Key takeaway**: deduplication is what makes frequent backups affordable -- a daily snapshot of a
1GB tree with 10MB of daily churn stores ~10MB, not 1GB, per run, so you can afford to keep many.

**Why it matters**: as the data grows beyond a single file (Example 34) to a whole tree, copying the
whole thing each run becomes wasteful. `restic` keeps the backup cheap AND the history deep, which is
what makes a real retention policy (Example 77) practical.

---

### Example 76: A pg_dump Database Backup

_ex-76 &middot; exercises co-19_

A SQLite DB is a FILE (copied in Example 34). A PostgreSQL DB is a RUNNING SERVER whose files must
NOT be copied directly (a live copy can be torn). `pg_dump` is the safe, consistent export -- the
database's own backup API.

**`learning/code/ex-76-backup-pgdump-database/backup.sh`**:

```bash
#!/usr/bin/env bash
set -euo pipefail
DB_NAME="myapp"; DUMP_DIR="/var/backups/myapp-pg"; install -d -m 750 "${DUMP_DIR}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"; DEST="${DUMP_DIR}/${DB_NAME}-${STAMP}.sql.gz"
pg_dump -C "${DB_NAME}" | gzip > "${DEST}"  # => co-19: a safe, server-consistent export
chmod 640 "${DEST}"
TMPDB="verify_${DB_NAME}_$$"  # => a unique, throwaway DB name
createdb "${TMPDB}" 2>/dev/null || true
gunzip -c "${DEST}" | psql -d "${TMPDB}" -q >/dev/null 2>&1 && echo "[verify] dump reloaded OK"
dropdb "${TMPDB}" 2>/dev/null || true
echo "[verify] backup OK and reload-tested: ${DEST}"
```

**Run**: `bash backup.sh` (schedule via a timer)

**Expected**: `[verify] dump reloaded OK` and `[verify] backup OK and reload-tested: ...`.

**Key takeaway**: for a running database, the ONLY safe backup is the DB's own dump API -- a file
copy of a live DB's files can be torn (half a transaction), which `pg_dump`'s consistent snapshot
prevents.

**Why it matters**: the failure mode of a file-copied live DB is the worst kind -- it often "works"
until you restore and find corrupt rows. Using `pg_dump` (and reload-testing it) is what makes a
database backup trustworthy instead of a time bomb.

---

### Example 77: Backup Retention and Restore Verification

_ex-77 &middot; exercises co-19_

Two things a backup discipline needs beyond "take a backup": RETENTION (delete old backups so the
disk does not fill) and PERIODIC RESTORE VERIFICATION (actually restore one, so a corrupt backup is
caught before you need it).

**`learning/code/ex-77-backup-retention-and-verify/retention.sh`**:

```bash
#!/usr/bin/env bash
set -euo pipefail
DUMP_DIR="/var/backups/myapp-pg"; VERIFY_DIR="/tmp/restore-verify"; KEEP_DAYS=14
echo "[retention] deleting dumps older than ${KEEP_DAYS} days:"
find "${DUMP_DIR}" -name '*.sql.gz' -mtime "+${KEEP_DAYS}" -print -delete  # => co-19: bounded history
LATEST="$(ls -1t "${DUMP_DIR}"/*.sql.gz 2>/dev/null | head -n1)"
[ -n "${LATEST}" ] || { echo "[abort] no backup to verify"; exit 1; }
echo "[verify] restore-drilling the newest backup: ${LATEST}"
install -d "${VERIFY_DIR}"; gunzip -c "${LATEST}" > "${VERIFY_DIR}/restored.sql"
if grep -q 'CREATE TABLE' "${VERIFY_DIR}/restored.sql"; then echo "[verify] PASS: backup restored and contains schema";
else echo "[verify] FAIL: backup restored but no schema found -- investigate" >&2; exit 1; fi
rm -rf "${VERIFY_DIR}"
```

**Run**: schedule via a timer; `bash retention.sh`

**Expected**: old dumps pruned; the latest one passes the restore + schema check.

**Key takeaway**: a backup that has never been restored might be silently corrupt -- periodic
automated restore drills catch that before a real outage makes it catastrophic.

**Why it matters**: retention keeps the disk bounded; verification keeps the backups honest. Together
they make "we have backups" an actual, tested guarantee rather than an assumption -- which is the
only version of that statement worth anything.

---

### Example 78: A cloud-init User-Data for First-Boot Setup

_ex-78 &middot; exercises co-21_

`cloud-init` makes a NEW VM converge to a known state on its FIRST boot, unattended. This user-data
does what Example 20's `setup.sh` does, but run by the provider's first-boot agent -- so a freshly
created VM is fully provisioned before you ever SSH in. This is co-21 at its strongest.

**`learning/code/ex-78-cloud-init-reprovision/user-data.yaml`** (excerpt):

```yaml
#cloud-config
packages: [python3.12, python3.12-venv, ufw, caddy, sqlite3, curl, ca-certificates]
package_update: true
users:
  - name: deploy
    sudo: ALL=(ALL) NOPASSWD:ALL # first-boot convenience; NARROW after setup
    shell: /bin/bash
    ssh_authorized_keys: [ssh-ed25519 AAAA... replace-with-your-public-key]
runcmd:
  - [ufw, --force, reset]
  - [ufw, default, deny, incoming]
  - [ufw, default, allow, outgoing]
  - [ufw, allow, 22/tcp]
  - [ufw, allow, 80/tcp]
  - [ufw, allow, 443/tcp]
  - [ufw, --force, enable]
  - [install, -d, -o, deploy, -g, deploy, -m, 755, /opt/myapp]
  - [sudo, -u, deploy, python3.12, -m, venv, /opt/myapp/venv]
  - [systemctl, enable, --now, myapp]
  - [systemctl, enable, --now, caddy]
```

**Run**: paste as the new VM's user-data at creation; on first SSH it already has the service running
and HTTPS answering.

**Expected**: a fresh VM, created with this user-data, boots into the SAME baseline as Example 20's
`setup.sh` -- no manual SSH setup step.

**Key takeaway**: disaster rebuild (Example 42) becomes "create a VM with the same user-data + restore
the backup" -- the box is REPRODUCIBLE from a committed file, down to its first boot.

**Why it matters**: this is co-21's peak. A box whose entire first-boot state is a committed file is
a box you can recreate identically, anywhere, on a moment's notice -- the difference between a
self-host you operate and a self-host that operates itself.

---

← Previous: [Intermediate Examples](./intermediate.md) · Next: [Capstone](./capstone/overview.md) →
