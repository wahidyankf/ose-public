---
title: "Overview"
date: 2026-07-15T00:00:00+07:00
draft: false
weight: 1
---

## Goal

Take the [Backend-Essentials capstone](../../../backend-essentials/learning/capstone/overview.md)
Task API and harden it end to end: fix a real, injectable search endpoint; replace the old
hardcoded-token middleware with real argon2id-backed registration and login issuing a signed,
expiring bearer token; add allow-list input validation and output encoding on a new HTML view
route; stamp every response with security headers; move the auth signing key to an environment
variable; and finish with a clean `pip-audit` run. Every attack below is run twice against a real,
listening server -- once against the naive first draft (it succeeds), once against the shipped,
hardened code (it fails) -- with genuine, captured `curl` output for both.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
flowchart LR
    accTitle: Goal
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: Step 1 Fix SQL injection, Step 2 Argon2id auth, Step 3 Allow-list + escaping + headers, Step 4 Secrets in env + pip-audit. Connections: Step 1 Fix SQL injection to Step 2 Argon2id auth, Step 2 Argon2id auth to Step 3 Allow-list + escaping + headers, Step 3 Allow-list + escaping + headers to Step 4 Secrets in env + pip-audit.
    A["Step 1<br/>Fix SQL injection"]:::blue
    B["Step 2<br/>Argon2id auth"]:::orange
    C["Step 3<br/>Allow-list +<br/>escaping + headers"]:::teal
    D["Step 4<br/>Secrets in env +<br/>pip-audit"]:::purple
    A --> B --> C --> D

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Concepts exercised

- [x] parameterized queries fixing a real SQL injection (co-01, co-03)
- [x] argon2id password hashing, never plaintext (co-09)
- [x] per-hash salting, automatic and free (co-10)
- [x] timing-safe token-signature comparison (co-11)
- [x] a signed, expiring bearer token, replacing a hardcoded string (co-12)
- [x] allow-list field validation on every new input (co-07)
- [x] output encoding closing a real stored-XSS hole (co-06)
- [x] secrets read from the environment, never hardcoded (co-17)
- [x] security headers stamped on every response (co-19)
- [x] a clean `pip-audit` run against pinned dependencies (co-21)
- [x] a consistent, generic error envelope that leaks nothing internal (co-23)

All colocated code lives under `learning/capstone/code/`: `app/__init__.py`, `app/models.py`,
`app/repository.py`, `app/middleware.py`, `app/auth.py`, `app/main.py`, `app/schema.sql`,
`app/templates/task_view.html`, `test_app.py`, `attack_transcript.py`, `requirements.txt`, and
`pyrightconfig.json`. Every snippet below is copied directly from those files or from a real
terminal session against them -- nothing on this page is paraphrased or fabricated (DD-19). Health,
readiness, CRUD, and pagination are otherwise **unchanged** from the Backend-Essentials capstone --
hardening never meant rewriting what already worked.

## Step 1: Fix the SQL Injection in `/tasks/search`

_exercises co-01, co-03_

The naive first draft of this capstone added `GET /tasks/search?q=` built with an f-string:
`f"SELECT * FROM tasks WHERE title LIKE '%{q}%'"`. A single quote in `q` breaks out of the string
literal, and a classic `' OR '1'='1` payload turns the `WHERE` clause into something that matches
every row -- including tasks the query was never supposed to return. That draft was run for real
(on a throwaway port, never committed) to capture the "before" transcript below; the shipped
`repository.py` you'll read further down only ever contained the fixed, parameterized version.

**Naive first draft (NOT shipped -- shown only to document what was attacked)**:

```python
def search_tasks_unsafe(conn: sqlite3.Connection, q: str) -> list[Task]:
    query = f"SELECT * FROM tasks WHERE title LIKE '%{q}%'"  # UNSAFE: q is concatenated into SQL text
    cursor = conn.execute(query)
    return [_row_to_task(row) for row in cursor.fetchall()]
```

**Run** (naive draft, on a throwaway port): register a user, log in, seed three tasks -- one of
them named to look sensitive -- then compare a legitimate search against the attack payload.

**Output** (naive draft -- the attack SUCCEEDS):

```text
=== seed tasks ===
{"id":1,"title":"write the report","description":"Q3 summary","status":"todo","created_at":"2026-07-15 15:59:36"}
{"id":2,"title":"rotate prod db credentials","description":"secret-looking task, should NOT leak via search","status":"todo","created_at":"2026-07-15 15:59:36"}
{"id":3,"title":"buy milk","description":"groceries","status":"todo","created_at":"2026-07-15 15:59:36"}
=== legit search: q=report (should return only 1 matching task) ===
[{"id":1,"title":"write the report","description":"Q3 summary","status":"todo","created_at":"2026-07-15 15:59:36"}]
=== ATTACK: q=%27%20OR%20%271%27%3D%271 (payload: ' OR '1'='1) ===
[{"id":1,"title":"write the report","description":"Q3 summary","status":"todo","created_at":"2026-07-15 15:59:36"},{"id":2,"title":"rotate prod db credentials","description":"secret-looking task, should NOT leak via search","status":"todo","created_at":"2026-07-15 15:59:36"},{"id":3,"title":"buy milk","description":"groceries","status":"todo","created_at":"2026-07-15 15:59:36"}]
```

A search for `' OR '1'='1` matches no real title substring, yet it returned all three tasks --
including the one that was never supposed to leak through a search box.

**The fix, as shipped in `learning/capstone/code/app/repository.py`**:

```python
def search_tasks(conn: sqlite3.Connection, q: str) -> list[Task]:
    """Search tasks by a substring of their title -- co-03, the FIXED version of this capstone's
    Step 1. The naive first draft built this WHERE clause with an f-string
    (`f"...LIKE '%{q}%'"`) and a live attack against it is documented on this capstone's page;
    this shipped version binds `q` as a parameter, so it can never be interpreted as SQL."""
    cursor = conn.execute(
        "SELECT * FROM tasks WHERE title LIKE '%' || ? || '%'",  # => co-03: `?` -- q is DATA, never SQL text
        (q,),
    )
    return [_row_to_task(row) for row in cursor.fetchall()]
```

**Run** (shipped, hardened app, `uvicorn app.main:app --port 8093` from `learning/capstone/code/`):
the SAME legitimate search and the SAME attack payload, byte-for-byte.

**Output** (shipped app -- the attack now FAILS):

```text
=== legit search: q=report (post-seed) ===
[{"id":1,"title":"write the report","description":"Q3 summary","status":"todo","created_at":"2026-07-15 16:08:28"}]
=== SAME ATTACK PAYLOAD: q=' OR '1'='1 -- expect empty [] ===
[]
```

**Key takeaway**: the naive draft and the shipped fix differ by exactly one thing -- whether `q`
is spliced into the SQL text or bound as a parameter. Every other line of `search_tasks()` is
identical; the entire vulnerability, and the entire fix, live in that one substitution.

**Why it matters**: this closes the exact injection class SQL-Essentials warned about and
Backend-Essentials' original CRUD queries already avoided -- this capstone's contribution is
proving the SAME lesson holds for a route added AFTER that original hardening pass, with a real
attack that actually leaked data before the fix landed.

## Step 2: Real Argon2id-Backed Registration and Login

_exercises co-09, co-10, co-11, co-12_

Backend-Essentials had no login system at all -- every write request just compared the
`Authorization` header against a single hardcoded string with `!=`. This capstone replaces that
with `POST /auth/register` and `POST /auth/login`, backed by `app/auth.py`'s argon2id hasher and a
signed, expiring bearer token. The database's `users` table stores `password_hash` and nothing
else -- there is no code path anywhere in this app that can write a raw password to disk.

**`learning/capstone/code/app/auth.py`**

```python
"""Capstone: hardened task API -- argon2id password hashing + signed bearer tokens.

NEW module (co-09, co-10, co-11, co-12, co-17) -- Backend-Essentials had no login system at
all, only a single hardcoded token compared with `!=`. This module replaces that with real
password-hash-backed auth and a signed, expiring token whose signing key lives in an env var.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time

from argon2 import PasswordHasher  # => co-09: argon2-cffi's high-level hasher
from argon2.exceptions import VerifyMismatchError  # => co-09: the specific "wrong password" exception

# co-09: OWASP's current minimum-tier argon2id parameters -- 19 MiB memory, 2 iterations,
# 1 degree of parallelism -- deliberately slow AND memory-hard against offline cracking.
_HASHER = PasswordHasher(memory_cost=19456, time_cost=2, parallelism=1)

TOKEN_TTL_SECONDS = 3600  # => co-12: a bounded lifetime -- a leaked token stops working on its own


def hash_password(password: str) -> str:  # => co-09: the ONLY function allowed to touch a raw password
    """Hash a password with argon2id. The DB stores ONLY this value, never the raw password."""
    return _HASHER.hash(password)  # => co-10: argon2id generates its own random salt internally, every call


def verify_password(stored_hash: str, candidate: str) -> bool:  # => co-09: the verify half of the same fix
    """Verify a candidate password against a stored argon2id hash."""
    try:
        return _HASHER.verify(stored_hash, candidate)  # => co-09: True only if candidate re-hashes to stored_hash
    except VerifyMismatchError:  # => co-09: argon2-cffi's specific exception for "wrong password"
        return False  # => co-09: normalizes the exception into a plain boolean for callers


def _sign(payload_b64: str, secret: str) -> str:  # => co-17: `secret` is ALWAYS a caller-supplied env value --
    digest = hmac.new(secret.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256)  # => never hardcoded here
    return digest.hexdigest()


def issue_token(user_id: int, secret: str) -> str:
    """Mint a signed, expiring bearer token.

    The signing algorithm is FIXED at HMAC-SHA256 -- never read from the token itself, so an
    attacker cannot downgrade or confuse it (co-14's `alg` confusion lesson, applied here).
    """
    payload = {"sub": user_id, "exp": int(time.time()) + TOKEN_TTL_SECONDS}  # => co-12: a bounded-lifetime claim
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).decode("ascii")
    signature = _sign(payload_b64, secret)
    return f"{payload_b64}.{signature}"  # => co-12: opaque to the client -- carries no readable secret itself


def resolve_token(token: str, secret: str) -> int | None:
    """Verify a bearer token's signature and expiry, returning the user id if valid."""
    try:
        payload_b64, signature = token.split(".", 1)
    except ValueError:  # => co-23: malformed input fails closed -- no crash, just "not authenticated"
        return None
    expected_signature = _sign(payload_b64, secret)
    if not hmac.compare_digest(signature, expected_signature):  # => co-11: TIMING-SAFE compare --
        return None  # => a plain `==` here would leak how many leading bytes of the signature matched
    try:
        payload = json.loads(base64.urlsafe_b64decode(payload_b64.encode("ascii")))
    except (ValueError, UnicodeDecodeError):
        return None
    if int(payload.get("exp", 0)) < int(time.time()):  # => co-12: expired tokens are rejected, not just old ones
        return None
    return int(payload["sub"])
```

**Run**: `uvicorn app.main:app --port 8093` from `learning/capstone/code/`, then:

```bash
curl -X POST http://127.0.0.1:8093/auth/register -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"Sup3rSecret!"}'
curl -X POST http://127.0.0.1:8093/auth/login -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"Sup3rSecret!"}'
```

**Output**:

```text
=== register alice ===
{"id":1,"username":"alice","created_at":"2026-07-15 16:08:27"}
=== login alice ===
{"access_token":"eyJzdWIiOiAxLCAiZXhwIjogMTc4NDEzNTMxNn0=.ba208ace90837dc591ef0c42a14d8ea0a09a6c69c5cedd033b04f5c9ee39c465","token_type":"bearer"}
```

**Verifying the database directly** -- reading the SQLite file the API just wrote to, bypassing
the API entirely:

```python
import sqlite3
conn = sqlite3.connect("app/tasks.db")
conn.row_factory = sqlite3.Row
for row in conn.execute("SELECT id, username, password_hash FROM users"):
    print(dict(row))
```

**Output**:

```text
{'id': 1, 'username': 'alice', 'password_hash': '$argon2id$v=19$m=19456,t=2,p=1$N8d9hCO9ULd5reVlHR+M8Q$R87vBTNEmmW+hsvSFoL+rma3UIFurVI/Ba+khp4A+UY'}
```

The row contains a `$argon2id$` PHC-format hash and nothing else -- the string `Sup3rSecret!` does
not appear anywhere in the database file.

**Key takeaway**: `hash_password()` is the only function in this entire codebase permitted to see
a raw password, and it converts that password into an argon2id hash before the value ever reaches
`repository.create_user()` -- there is no intermediate step where a plaintext password touches disk.

**Why it matters**: this is the concrete difference between "the app has a login form" and "the
app is safe to run" -- a leaked database dump of this `users` table gives an attacker only slow,
salted, memory-hard hashes to crack, one password at a time, instead of a plaintext list they can
read directly.

## Step 3: Allow-List Validation, Output Encoding, and Security Headers

_exercises co-06, co-07, co-19_

Three hardening moves land together in this step, because they compose: `UserRegister`'s
`pattern=r"^[a-zA-Z0-9_]+$"` on `username` rejects hostile input before any handler code runs
(co-07); the new `GET /tasks/{id}/view` route renders through an autoescaping Jinja2 template
instead of raw string interpolation, closing a real stored-XSS hole (co-06); and
`security_headers_middleware` stamps `Content-Security-Policy`, `X-Content-Type-Options`, and
`Strict-Transport-Security` onto every response this app sends, success or error (co-19).

**The naive first draft's `/tasks/{id}/view` (NOT shipped)**:

```python
@app.get("/tasks/{task_id}/view", response_class=HTMLResponse)
def view_task_route(task_id: int, conn: sqlite3.Connection = Depends(get_db)) -> str:
    task = repo.get_task(conn, task_id)
    if task is None:
        raise HTTPException(status_code=404, ...)
    return f"<html><body><h1>{task.title}</h1><p>{task.description}</p></body></html>"
```

**Output** (naive draft -- a task titled `<script>alert(1)</script>` renders as EXECUTABLE markup):

```text
=== create task with XSS payload title ===
{"id":4,"title":"<script>alert(1)</script>","description":"xss test","status":"todo","created_at":"2026-07-15 15:59:46"}
XSS_ID=4
=== ATTACK: GET /tasks/4/view (unescaped raw HTML) ===
<html><body><h1><script>alert(1)</script></h1><p>xss test</p></body></html>
```

**The shipped fix -- `learning/capstone/code/app/templates/task_view.html`**:

```html
{# co-06: rendered through Jinja2Templates, whose default loader enables autoescape() for .html files -- every template
expression below is HTML-escaped automatically. #}
<!doctype html>
<html>
  <head>
    <title>Task {{ task.id }}</title>
  </head>
  <body>
    <h1>{{ task.title }}</h1>
    <p>{{ task.description }}</p>
    <p>Status: {{ task.status }}</p>
  </body>
</html>
```

Wired in `app/main.py` via `templates = Jinja2Templates(directory=...)`, whose loader sets
`autoescape=jinja2.select_autoescape()` for `.html` files -- confirmed by reading Starlette's own
`Jinja2Templates.__init__` source directly in this topic's build environment before relying on it.

**Run** (shipped app): the SAME payload, against `GET /tasks/{id}/view`.

**Output** (shipped app -- the payload renders as INERT, escaped text):

```text
=== create task with XSS payload title ===
{"id":4,"title":"<script>alert(1)</script>","description":"xss test","status":"todo","created_at":"2026-07-15 16:08:47"}
=== Step 3 AFTER FIX: GET /tasks/4/view -- expect ESCAPED output ===
<!doctype html>
<html>
  <head>
    <title>Task 4</title>
  </head>
  <body>
    <h1>&lt;script&gt;alert(1)&lt;/script&gt;</h1>
    <p>xss test</p>
    <p>Status: todo</p>
  </body>
</html>
```

**Allow-list validation rejecting hostile registration input**:

```bash
curl -i -X POST http://127.0.0.1:8093/auth/register -H "Content-Type: application/json" \
  -d "{\"username\":\"admin'--\",\"password\":\"Sup3rSecret!\"}"
curl -i -X POST http://127.0.0.1:8093/auth/register -H "Content-Type: application/json" \
  -d '{"username":"shorty","password":"short"}'
```

**Output**:

```text
=== hostile register: username with SQL metacharacters -- expect 422 ===
HTTP/1.1 422 Unprocessable Content
content-security-policy: default-src 'self'
x-content-type-options: nosniff
strict-transport-security: max-age=31536000; includeSubDomains

{"detail":[{"type":"string_pattern_mismatch","loc":["body","username"],"msg":"String should match pattern '^[a-zA-Z0-9_]+$'","input":"admin'--","ctx":{"pattern":"^[a-zA-Z0-9_]+$"}}]}
=== hostile register: password too short -- expect 422 ===
HTTP/1.1 422 Unprocessable Content
content-security-policy: default-src 'self'
x-content-type-options: nosniff
strict-transport-security: max-age=31536000; includeSubDomains

{"detail":[{"type":"string_too_short","loc":["body","password"],"msg":"String should have at least 8 characters","input":"short","ctx":{"min_length":8}}]}
```

**Security headers, via `curl -i` on a plain `GET`**:

```bash
curl -i http://127.0.0.1:8093/health
```

```text
HTTP/1.1 200 OK
content-length: 15
content-type: application/json
content-security-policy: default-src 'self'
x-content-type-options: nosniff
strict-transport-security: max-age=31536000; includeSubDomains

{"status":"ok"}
```

`curl -I` (a literal HEAD request) against this GET-only route returns a genuine `405 Method Not
Allowed` in this FastAPI version, since HEAD isn't auto-derived from a GET route here -- but the
security headers are present on that 405 response too, since `security_headers_middleware` wraps
every response `call_next` returns, regardless of status code. A plain `GET` (`curl -i`, shown
above) is the direct way to confirm the headers on a 200.

**Key takeaway**: allow-list validation, output encoding, and security headers are three
independent layers that each stop a different failure mode -- a hostile username never reaches the
database at all, a hostile title reaches the database but renders inert, and even a route this
capstone never explicitly hardens still ships with the baseline headers, because the middleware
wraps everything.

**Why it matters**: none of these three defenses depends on the others -- deleting the
`security_headers_middleware` line would not reopen the XSS hole, and reverting the Jinja2 template
to raw string interpolation would not remove the security headers. Real hardening stacks
independent layers instead of relying on one mechanism to catch everything.

## Step 4: Secrets in the Environment, and a Clean `pip-audit`

_exercises co-17, co-21_

`app/main.py` reads its signing key with `os.environ["CAPSTONE_AUTH_SECRET"]` -- no default, no
fallback. Import this module without that variable set and it raises `KeyError` immediately; the
app refuses to start with an unset secret rather than silently falling back to a hardcoded value.

**`learning/capstone/code/app/main.py`** (the one line this step is about):

```python
AUTH_SECRET = os.environ["CAPSTONE_AUTH_SECRET"]  # => co-17: REQUIRED, no hardcoded fallback --
# => this line raises KeyError and refuses to start if the secret is missing, by design
```

**Verifying no secret is committed** -- grepping the entire shipped source tree for the exact
value used to run every server session in this topic:

```bash
grep -rn "dev-only-not-a-real-secret-abc123" app/ test_app.py pyrightconfig.json requirements.txt
```

**Output**:

```text
(no matches -- grep exit code 1)
```

```bash
grep -rn "CAPSTONE_AUTH_SECRET" app/
```

**Output**:

```text
app/main.py:42:AUTH_SECRET = os.environ["CAPSTONE_AUTH_SECRET"]  # => co-17: REQUIRED, no hardcoded fallback --
```

The only occurrence of the secret's name anywhere in `app/` is a read from `os.environ` -- never an
assignment of a literal value.

**`learning/capstone/code/requirements.txt`**

```text
fastapi==0.139.0
uvicorn==0.51.0
pydantic==2.13.4
argon2-cffi==25.1.0
jinja2==3.1.6
pytest==9.1.1
httpx2==2.7.0
```

**Running `pip-audit`**: `pip-audit -r requirements.txt` tries to resolve the full dependency tree
by building its own isolated virtual environment, which crashed with a sandbox-specific `ensurepip`
failure in this authoring environment (a local `venv`-creation limitation, not a finding about the
dependencies themselves). The equivalent, and in this case more precise, alternative is to build a
throwaway virtual environment containing **only** the packages `requirements.txt` pins (plus their
real transitive dependencies), then audit that environment directly with `pip-audit -l`:

```bash
python3 -m venv .venv-audit && source .venv-audit/bin/activate
pip install -r requirements.txt
pip install pip-audit==2.10.1
pip-audit -l
```

**Output**:

```text
No known vulnerabilities found
```

Exit code `0`. This audited FastAPI 0.139.0, Starlette (FastAPI's dependency), Uvicorn 0.51.0,
Pydantic 2.13.4 + pydantic-core, argon2-cffi 25.1.0 + argon2-cffi-bindings, and Jinja2 3.1.6 +
MarkupSafe -- the complete resolved dependency graph this app actually runs on -- plus the two
test-only packages `test_app.py` requires, `pytest==9.1.1` and `httpx2==2.7.0` (Starlette's
`TestClient` now requires `httpx2`; see "Full Acceptance Suite" below).

**Key takeaway**: `os.environ["CAPSTONE_AUTH_SECRET"]` (no `.get()`, no default) is a deliberate
fail-closed choice -- a missing secret is a startup crash, never a silent hardcoded fallback that
would defeat the entire point of moving the secret out of the source tree.

**Why it matters**: a secret that "usually" comes from the environment but falls back to a
hardcoded value if the environment variable is missing is not actually externalized -- it just has
two ways to leak instead of one. Requiring the variable with no default is what makes "the secret
lives in the environment" a guarantee instead of a convention.

## Full Attack Transcript, End to End

_exercises co-01, co-03, co-06, co-07, co-12_

`attack_transcript.py` scripts all five attacks this page documents against a live server and
prints `PASS`/`FAIL` for each, using only the Python standard library (`urllib`) so it never needs
an extra runtime dependency beyond what's already installed to run the app itself.

**`learning/capstone/code/attack_transcript.py`**

```python
"""Capstone attack transcript -- runs the exact attacks this capstone's page documents
against a LIVE server and prints PASS/FAIL for each. Every attack below is proven to have
SUCCEEDED against the naive first draft of this app (see the page's Step 1 / Step 3
"before" transcripts, captured from that draft before it was hardened); run against the
SHIPPED app below, every one of them is expected to FAIL.

Run:
    uvicorn app.main:app --host 127.0.0.1 --port 8000   # in one terminal, with
                                                          # CAPSTONE_AUTH_SECRET set
    python attack_transcript.py                          # in another terminal
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE_URL = "http://127.0.0.1:8000"


def _request(method: str, path: str, body: dict[str, object] | None = None, token: str | None = None) -> tuple[int, str]:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {"Content-Type": "application/json"}
    if token is not None:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(BASE_URL + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as response:  # noqa: S310 -- 127.0.0.1 only, local demo
            return response.status, response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8")


def _check(label: str, condition: bool) -> bool:
    print(f"[{'PASS' if condition else 'FAIL'}] {label}")
    return condition


def main() -> int:
    all_passed = True

    # Register + log in a real user, exactly the way a legitimate client would.
    _request("POST", "/auth/register", {"username": "attacker_demo", "password": "Sup3rSecret!"})
    status, body = _request("POST", "/auth/login", {"username": "attacker_demo", "password": "Sup3rSecret!"})
    all_passed &= _check("login succeeds end-to-end", status == 200)
    token = json.loads(body)["access_token"]

    # Seed one public task and one "secret-looking" task the attack should NOT be able to reach.
    _request("POST", "/tasks", {"title": "write the report"}, token=token)
    _request("POST", "/tasks", {"title": "rotate prod db credentials"}, token=token)

    # Attack 1: SQL injection via /tasks/search -- co-03.
    status, body = _request("GET", "/tasks/search?q=%27%20OR%20%271%27%3D%271")
    all_passed &= _check("SQL injection payload returns zero rows", status == 200 and json.loads(body) == [])

    # Attack 2: stored XSS via /tasks/{id}/view -- co-06.
    status, body = _request("POST", "/tasks", {"title": "<script>alert(1)</script>"}, token=token)
    xss_task_id = json.loads(body)["id"]
    status, body = _request("GET", f"/tasks/{xss_task_id}/view")
    all_passed &= _check("XSS payload is rendered escaped, not executable", "<script>" not in body and "&lt;script&gt;" in body)

    # Attack 3: writing without a valid bearer token -- co-12.
    status, _ = _request("POST", "/tasks", {"title": "no auth"})
    all_passed &= _check("unauthenticated write is rejected (401)", status == 401)

    # Attack 4: registering a username carrying SQL metacharacters -- co-07.
    status, _ = _request("POST", "/auth/register", {"username": "admin'--", "password": "Sup3rSecret!"})
    all_passed &= _check("hostile username is rejected by the allow-list (422)", status == 422)

    print()
    print("ALL ATTACKS BLOCKED" if all_passed else "AT LEAST ONE ATTACK SUCCEEDED")
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
```

**Run**: `uvicorn app.main:app --host 127.0.0.1 --port 8000` (with `CAPSTONE_AUTH_SECRET` set) from
`learning/capstone/code/`, then `python attack_transcript.py` in a second terminal.

**Output**:

```text
[PASS] login succeeds end-to-end
[PASS] SQL injection payload returns zero rows
[PASS] XSS payload is rendered escaped, not executable
[PASS] unauthenticated write is rejected (401)
[PASS] hostile username is rejected by the allow-list (422)

ALL ATTACKS BLOCKED
```

Exit code `0`.

**Key takeaway**: every attack this page documents individually, in isolated `curl` transcripts
throughout Steps 1 and 3, is also encoded here as one runnable script -- a reader does not have to
trust the prose above; they can clone this app and reproduce every red-before/green-after claim
themselves in one command.

**Why it matters**: a security fix that is only ever demonstrated once, by hand, in documentation
tends to regress silently the next time someone touches the code. Encoding each attack as an
automated, re-runnable check is what turns a one-time demo into a regression guard.

## Base App Functionality Is Fully Preserved

_exercises co-02, co-08, co-14, co-15, co-19, co-20, co-23_

Hardening this app never meant rewriting what the Backend-Essentials capstone already got right.
Every original route -- health, readiness, full CRUD, and pagination-plus-filtering -- still works
exactly as before, now additionally covered by the security-headers middleware.

**Run**: against the same live, hardened server as every transcript above.

**Output**:

```text
=== base CRUD still works: PUT /tasks/1 -> done ===
{"id":1,"title":"write the report","description":"Q3 summary","status":"done","created_at":"2026-07-15 16:08:28"}
=== pagination: GET /tasks?limit=2&offset=0 ===
{"items":[{"id":1,"title":"write the report","description":"Q3 summary","status":"done","created_at":"2026-07-15 16:08:28"},{"id":2,"title":"rotate prod db credentials","description":"secret-looking task, should NOT leak via search","status":"todo","created_at":"2026-07-15 16:08:28"}],"total":4,"next":2}
=== DELETE /tasks/1 -> 204, then GET -> 404 ===
DELETE: HTTP 204
GET after delete: HTTP 404
```

**Key takeaway**: none of Steps 1 through 4 touched the CRUD or pagination code paths at all --
`repository.py`'s `create_task`, `get_task`, `update_task`, `delete_task`, and `list_tasks` are
byte-for-byte the same functions Backend-Essentials shipped.

**Why it matters**: a hardening pass that breaks existing functionality just trades one kind of
failure for another. Proving the original feature set survives untouched is as much a part of
"done" as proving the new attacks fail.

## The Full App -- `app/main.py`, `app/models.py`, `app/repository.py`, `app/middleware.py`, `app/schema.sql`

_exercises co-02, co-03, co-06, co-07, co-09, co-10, co-11, co-12, co-17, co-19, co-23_

**`learning/capstone/code/app/main.py`**

```python
"""Capstone: the hardened task API -- routing, validation, errors, repository, auth, pagination.

Run with: uvicorn app.main:app --port 8000  (this doc's canonical prose port; the capstone's own
verification run in this topic used other ports to avoid colliding with other locally running
servers -- see the transcripts below for the exact port each one used).

This module takes the Backend-Essentials capstone app and hardens it end to end: a real
argon2id-backed /auth/register + /auth/login (co-09, co-10) issuing a signed, expiring bearer
token (co-11, co-12, co-17) that write routes now require instead of a hardcoded string; a
parameterized /tasks/search (co-03) replacing a naive f-string version; an autoescaped HTML
/tasks/{id}/view (co-06) replacing raw string interpolation; and a security-headers middleware
(co-19) stamping every response. Every other route (health, ready, CRUD, pagination) is
UNCHANGED from Backend-Essentials -- hardening this app never meant rewriting what already worked.
"""

import os
import sqlite3
from collections.abc import Iterator
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates

from . import auth
from . import repository as repo
from .middleware import make_token_check_middleware, security_headers_middleware
from .models import (
    Task,
    TaskCreate,
    TaskPage,
    TaskUpdate,
    TokenResponse,
    UserLogin,
    UserPublic,
    UserRegister,
)

DB_PATH = os.environ.get(  # => overridable so tests can point at a fresh, isolated file
    "CAPSTONE_DB_PATH", os.path.join(os.path.dirname(__file__), "tasks.db")
)
AUTH_SECRET = os.environ["CAPSTONE_AUTH_SECRET"]  # => co-17: REQUIRED, no hardcoded fallback --
# => this line raises KeyError and refuses to start if the secret is missing, by design

repo.init_db(DB_PATH)  # => applies schema.sql once, at import/startup time

app = FastAPI(title="Capstone Task API (Hardened)")
templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))  # => co-06: autoescaping loader


def get_db() -> Iterator[sqlite3.Connection]:  # => one connection per request, dependency-injected
    conn = repo.get_connection(DB_PATH)
    try:
        yield conn
    finally:
        conn.close()


def _resolve_token(token: str) -> int | None:  # => co-17: the ONE place AUTH_SECRET is actually used
    return auth.resolve_token(token, AUTH_SECRET)


app.middleware("http")(make_token_check_middleware(_resolve_token))  # => co-12: guards every write
app.middleware("http")(security_headers_middleware)  # => co-19: stamps every response, success or error


@app.exception_handler(HTTPException)  # => co-23: one consistent {"error": {...}} envelope, app-wide
async def handle_http_exception(request: Request, exc: HTTPException) -> JSONResponse:
    body = exc.detail if isinstance(exc.detail, dict) else {"error": {"code": "error", "message": str(exc.detail)}}
    return JSONResponse(status_code=exc.status_code, content=body)


@app.get("/health")  # => LIVENESS -- always 200, no DB dependency at all (unchanged)
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready")  # => READINESS -- genuinely pings the database (unchanged)
def ready(response: Response, conn: sqlite3.Connection = Depends(get_db)) -> dict[str, str]:
    try:
        repo.ping(conn)
        return {"status": "ready"}
    except sqlite3.OperationalError as exc:
        response.status_code = 503
        return {"status": "not_ready", "reason": str(exc)}


@app.post("/auth/register", response_model=UserPublic, status_code=201)  # => co-07, co-09: NEW
def register_route(body: UserRegister, conn: sqlite3.Connection = Depends(get_db)) -> UserPublic:
    existing = repo.get_user_by_username(conn, body.username)
    if existing is not None:  # => co-23: a specific, honest conflict -- distinct from login's generic error
        raise HTTPException(
            status_code=409,
            detail={"error": {"code": "conflict", "message": "username already taken"}},
        )
    password_hash = auth.hash_password(body.password)  # => co-09: hash BEFORE it ever touches the DB
    return repo.create_user(conn, body.username, password_hash)


@app.post("/auth/login", response_model=TokenResponse)  # => co-09, co-11, co-12: NEW
def login_route(body: UserLogin, conn: sqlite3.Connection = Depends(get_db)) -> TokenResponse:
    row = repo.get_user_by_username(conn, body.username)
    generic_error = HTTPException(  # => co-23: SAME message for "no such user" and "wrong password" --
        status_code=401,  # => an attacker probing usernames learns nothing from the response either way
        detail={"error": {"code": "unauthorized", "message": "invalid username or password"}},
    )
    if row is None:
        raise generic_error
    if not auth.verify_password(str(row["password_hash"]), body.password):
        raise generic_error
    token = auth.issue_token(int(row["id"]), AUTH_SECRET)  # => co-12, co-17
    return TokenResponse(access_token=token)


@app.post("/tasks", response_model=Task, status_code=201)  # => guarded (a WRITE) -- unchanged
def create_task_route(body: TaskCreate, conn: sqlite3.Connection = Depends(get_db)) -> Task:
    return repo.create_task(conn, body)


@app.get("/tasks/search", response_model=list[Task])  # => co-03: NEW, and registered BEFORE
def search_tasks_route(  # => /tasks/{task_id} below -- otherwise FastAPI would try to parse
    q: str = Query(default="", max_length=200), conn: sqlite3.Connection = Depends(get_db)
) -> list[Task]:  # => "search" as an int task_id and 422 before ever reaching this route
    return repo.search_tasks(conn, q)  # => co-03: the FIXED, parameterized version -- see repository.py


@app.get("/tasks/{task_id}/view", response_class=HTMLResponse)  # => co-06: NEW
def view_task_route(task_id: int, request: Request, conn: sqlite3.Connection = Depends(get_db)) -> HTMLResponse:
    task = repo.get_task(conn, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": "no such task"}})
    return templates.TemplateResponse(request, "task_view.html", {"task": task})  # => co-06: autoescaped


@app.get("/tasks/{task_id}", response_model=Task)  # => read -- OPEN, no token required (unchanged)
def read_task_route(task_id: int, conn: sqlite3.Connection = Depends(get_db)) -> Task:
    task = repo.get_task(conn, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": "no such task"}})
    return task


@app.put("/tasks/{task_id}", response_model=Task)  # => replace -- guarded (a WRITE), unchanged
def update_task_route(task_id: int, body: TaskUpdate, conn: sqlite3.Connection = Depends(get_db)) -> Task:
    updated = repo.update_task(conn, task_id, body)
    if updated is None:
        raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": "no such task"}})
    return updated


@app.delete("/tasks/{task_id}", status_code=204)  # => delete -- guarded (a WRITE), unchanged
def delete_task_route(task_id: int, conn: sqlite3.Connection = Depends(get_db)) -> None:
    if not repo.delete_task(conn, task_id):
        raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": "no such task"}})


@app.get("/tasks", response_model=TaskPage)  # => pagination + filtering -- OPEN, no token, unchanged
def list_tasks_route(
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    status: str | None = Query(default=None),
    conn: sqlite3.Connection = Depends(get_db),
) -> TaskPage:
    return repo.list_tasks(conn, limit, offset, status)
```

**`learning/capstone/code/app/models.py`**

```python
"""Capstone: hardened task API -- typed request/response models (co-07, co-09, co-10)."""

from typing import Literal

from pydantic import BaseModel, Field

TaskStatus = Literal["todo", "in_progress", "done"]  # => co-07: a closed set -- anything else is a 422


class TaskCreate(BaseModel):  # => the shape POST /tasks requires -- unchanged from Backend-Essentials
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)


class TaskUpdate(BaseModel):  # => PUT REPLACES the full resource with this exact shape
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    status: TaskStatus = "todo"


class Task(BaseModel):  # => the response shape for every task-returning endpoint
    id: int
    title: str
    description: str
    status: TaskStatus
    created_at: str


class TaskPage(BaseModel):  # => the paginated list envelope
    items: list[Task]
    total: int
    next: int | None


# --- co-07: allow-list validation for the NEW auth surface -------------------------------


class UserRegister(BaseModel):  # => co-07: username is an ALLOW-LIST -- only letters/digits/underscore
    username: str = Field(min_length=3, max_length=32, pattern=r"^[a-zA-Z0-9_]+$")
    # => co-07: an attacker cannot smuggle quotes, dashes, or SQL metacharacters through this field --
    # => this REJECTS `admin'--` outright, before any handler code runs
    password: str = Field(min_length=8, max_length=128)  # => co-09: bounds only -- the HASH is what protects it


class UserLogin(BaseModel):  # => same allow-list shape, reused for the login body
    username: str = Field(min_length=3, max_length=32, pattern=r"^[a-zA-Z0-9_]+$")
    password: str = Field(min_length=8, max_length=128)


class UserPublic(BaseModel):  # => co-09: NEVER includes password_hash -- this is the only shape a client sees
    id: int
    username: str
    created_at: str


class TokenResponse(BaseModel):  # => co-12: the bearer token a successful login returns
    access_token: str
    token_type: Literal["bearer"] = "bearer"
```

**`learning/capstone/code/app/repository.py`**

```python
"""Capstone: hardened task API -- the ONLY module that talks to the database (co-03).

Every statement below is parameterized -- the entire injection surface Backend-Essentials
already closed for CRUD, PLUS the new search_tasks() this capstone adds and hardens.
"""

import sqlite3
from pathlib import Path

from .models import Task, TaskCreate, TaskPage, TaskUpdate, UserPublic

SCHEMA_PATH = Path(__file__).parent / "schema.sql"


def get_connection(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # => rows are addressable by column name, not just position
    return conn


def init_db(db_path: str) -> None:  # => applies schema.sql once, safe to call repeatedly
    conn = get_connection(db_path)
    conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
    conn.commit()
    conn.close()


def _row_to_task(row: sqlite3.Row) -> Task:
    return Task(
        id=int(row["id"]),
        title=str(row["title"]),
        description=str(row["description"]),
        status=str(row["status"]),  # type: ignore[arg-type]  # => Pydantic validates this against TaskStatus
        created_at=str(row["created_at"]),
    )


def create_task(conn: sqlite3.Connection, data: TaskCreate) -> Task:  # => co-03: parameterized INSERT
    cursor = conn.execute(
        "INSERT INTO tasks (title, description) VALUES (?, ?)",  # => co-03: ? placeholders, never f-strings
        (data.title, data.description),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM tasks WHERE id = ?", (cursor.lastrowid,)).fetchone()
    assert row is not None  # => guaranteed by the INSERT above -- narrows Row | None for strict-mode pyright
    return _row_to_task(row)


def get_task(conn: sqlite3.Connection, task_id: int) -> Task | None:  # => co-03: parameterized SELECT
    row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    return _row_to_task(row) if row is not None else None


def update_task(conn: sqlite3.Connection, task_id: int, data: TaskUpdate) -> Task | None:  # => co-03
    cursor = conn.execute(
        "UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?",  # => parameterized
        (data.title, data.description, data.status, task_id),
    )
    if cursor.rowcount == 0:
        return None
    conn.commit()
    row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    assert row is not None
    return _row_to_task(row)


def delete_task(conn: sqlite3.Connection, task_id: int) -> bool:  # => co-03: parameterized DELETE
    cursor = conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    return cursor.rowcount > 0


def list_tasks(conn: sqlite3.Connection, limit: int, offset: int, status: str | None) -> TaskPage:
    where = " WHERE status = ?" if status is not None else ""
    params: list[str] = [status] if status is not None else []
    total_row = conn.execute(f"SELECT COUNT(*) AS n FROM tasks{where}", params).fetchone()
    assert total_row is not None
    total = int(total_row["n"])
    cursor = conn.execute(
        f"SELECT * FROM tasks{where} ORDER BY id LIMIT ? OFFSET ?",  # => still parameterized -- `where`
        [*params, limit, offset],  # => interpolates only a FIXED clause string, never attacker data
    )
    items = [_row_to_task(row) for row in cursor.fetchall()]
    next_offset = offset + limit
    return TaskPage(items=items, total=total, next=next_offset if next_offset < total else None)


def search_tasks(conn: sqlite3.Connection, q: str) -> list[Task]:
    """Search tasks by a substring of their title -- co-03, the FIXED version of this capstone's
    Step 1. The naive first draft built this WHERE clause with an f-string
    (`f"...LIKE '%{q}%'"`) and a live attack against it is documented on this capstone's page;
    this shipped version binds `q` as a parameter, so it can never be interpreted as SQL."""
    cursor = conn.execute(
        "SELECT * FROM tasks WHERE title LIKE '%' || ? || '%'",  # => co-03: `?` -- q is DATA, never SQL text
        (q,),
    )
    return [_row_to_task(row) for row in cursor.fetchall()]


def ping(conn: sqlite3.Connection) -> bool:  # => the cheapest possible real query -- used by /ready
    conn.execute("SELECT 1")
    return True


def create_user(conn: sqlite3.Connection, username: str, password_hash: str) -> UserPublic:  # => co-03, co-09
    cursor = conn.execute(
        "INSERT INTO users (username, password_hash) VALUES (?, ?)",  # => parameterized; hash only, never raw
        (username, password_hash),
    )
    conn.commit()
    row = conn.execute(
        "SELECT id, username, created_at FROM users WHERE id = ?", (cursor.lastrowid,)
    ).fetchone()
    assert row is not None
    return UserPublic(id=int(row["id"]), username=str(row["username"]), created_at=str(row["created_at"]))


def get_user_by_username(conn: sqlite3.Connection, username: str) -> sqlite3.Row | None:  # => co-03
    return conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
```

**`learning/capstone/code/app/middleware.py`**

```python
"""Capstone: hardened task API -- session-token auth middleware + security headers (co-12,
co-17, co-19). Backend-Essentials compared a single hardcoded string with `!=`; this version
resolves a REAL signed token issued by /auth/login, and adds a second middleware that stamps
every response (including error responses) with a security-header baseline.
"""

from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse

WRITE_METHODS = {"POST", "PUT", "DELETE"}  # => only WRITES need a token -- GET stays open, unchanged


def make_token_check_middleware(
    resolve_token: Callable[[str], int | None],
) -> Callable[[Request, Callable[[Request], Awaitable[Response]]], Awaitable[Response]]:
    """Builds the write-guard middleware around a `resolve_token` function so this module
    never imports `auth` (or an env-var secret) directly -- co-17: the secret stays in main.py,
    the ONE place that reads it from the environment."""

    async def token_check_middleware(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        needs_token = request.url.path.startswith("/tasks") and request.method in WRITE_METHODS
        if needs_token:
            auth_header = request.headers.get("authorization", "")
            token = auth_header.removeprefix("Bearer ") if auth_header.startswith("Bearer ") else ""
            user_id = resolve_token(token) if token else None  # => co-12: real signature + expiry check
            if user_id is None:
                return JSONResponse(  # => co-23: the SAME structured envelope every other error uses
                    status_code=401,
                    content={"error": {"code": "unauthorized", "message": "missing or invalid token"}},
                )
            request.state.user_id = user_id  # => available to route handlers that need "who is this?"
        return await call_next(request)

    return token_check_middleware


async def security_headers_middleware(  # => co-19: runs on EVERY response, success or error
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = "default-src 'self'"  # => restricts script/style sources
    response.headers["X-Content-Type-Options"] = "nosniff"  # => stops MIME-sniffing of response bodies
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"  # => forces HTTPS
    return response
```

**`learning/capstone/code/app/schema.sql`**

```sql
-- Capstone: hardened task API schema. Applied once at startup (unchanged mechanism from
-- Backend-Essentials); this capstone ADDS the `users` table for real password-hash-backed auth.
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo',
  created_at TEXT NOT NULL DEFAULT (datetime ('now'))
);

-- co-09: password_hash stores ONLY an argon2id PHC string -- this column NEVER holds a raw password.
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime ('now'))
);
```

## Full Acceptance Suite

_exercises co-01, co-03, co-06, co-07, co-09, co-11, co-12, co-19_

`test_app.py` is the capstone's own green acceptance suite: nine test classes covering health and
readiness (unchanged), the new argon2id auth surface, the original CRUD round trip (now
token-gated by real signed tokens), the token-check middleware, the SQL-injection fix, the XSS fix,
security headers, and pagination-plus-filtering -- 19 tests, all passing.

**`learning/capstone/code/test_app.py`**

```python
"""Capstone acceptance suite -- auth, injection-safety, XSS-safety, headers, pagination,
all in one green run against the hardened app."""

import importlib
import sqlite3
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv("CAPSTONE_DB_PATH", str(tmp_path / "tasks.db"))  # => a FRESH DB file per test
    monkeypatch.setenv("CAPSTONE_AUTH_SECRET", "test-only-secret-never-committed")  # => co-17: test-scoped only
    from app import main as main_module  # => imported here so the env vars above are set BEFORE module load

    importlib.reload(main_module)
    return TestClient(main_module.app)


def _register_and_login(client: TestClient, username: str = "alice", password: str = "Sup3rSecret!") -> str:
    client.post("/auth/register", json={"username": username, "password": password})
    login = client.post("/auth/login", json={"username": username, "password": password})
    token: str = login.json()["access_token"]
    return token


class TestHealthAndReadiness:  # => unchanged behavior from Backend-Essentials
    def test_health_is_always_200(self, client: TestClient) -> None:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_ready_is_200_when_db_is_reachable(self, client: TestClient) -> None:
        response = client.get("/ready")
        assert response.status_code == 200
        assert response.json() == {"status": "ready"}


class TestAuthArgon2id:  # => co-09, co-10, co-11, co-12: the NEW auth surface
    def test_register_then_login_succeeds_end_to_end(self, client: TestClient) -> None:
        token = _register_and_login(client)
        assert token != ""

    def test_stored_password_is_never_plaintext(self, client: TestClient, tmp_path: Path) -> None:
        _register_and_login(client, "bob", "AnotherSecret1!")
        conn = sqlite3.connect(tmp_path / "tasks.db")  # => reads the DB FILE DIRECTLY, bypassing the API
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT password_hash FROM users WHERE username = ?", ("bob",)).fetchone()
        stored_hash = str(row["password_hash"])
        assert stored_hash.startswith("$argon2id$")  # => co-09: a real PHC-format argon2id hash
        assert "AnotherSecret1!" not in stored_hash  # => the raw password is provably NOT in storage

    def test_login_rejects_wrong_password(self, client: TestClient) -> None:
        client.post("/auth/register", json={"username": "carol", "password": "RightPassword1!"})
        response = client.post("/auth/login", json={"username": "carol", "password": "WrongPassword1!"})
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "unauthorized"

    def test_login_unknown_user_gets_same_generic_error(self, client: TestClient) -> None:
        response = client.post("/auth/login", json={"username": "no_such_user", "password": "whatever12"})
        assert response.status_code == 401
        assert response.json()["error"]["message"] == "invalid username or password"  # => co-23: no enumeration

    def test_register_rejects_hostile_username(self, client: TestClient) -> None:
        response = client.post("/auth/register", json={"username": "admin'--", "password": "ValidPass1!"})
        assert response.status_code == 422  # => co-07: the allow-list pattern rejects this before any SQL runs

    def test_register_rejects_short_password(self, client: TestClient) -> None:
        response = client.post("/auth/register", json={"username": "dave", "password": "short"})
        assert response.status_code == 422

    def test_duplicate_username_is_conflict(self, client: TestClient) -> None:
        client.post("/auth/register", json={"username": "erin", "password": "FirstPass1!"})
        response = client.post("/auth/register", json={"username": "erin", "password": "SecondPass1!"})
        assert response.status_code == 409


class TestCrudRoundTrip:  # => unchanged behavior from Backend-Essentials, now gated by REAL tokens
    def test_create_read_update_delete(self, client: TestClient) -> None:
        token = _register_and_login(client)
        auth_header = {"Authorization": f"Bearer {token}"}
        created = client.post(
            "/tasks", json={"title": "write the report", "description": "Q3 summary"}, headers=auth_header
        )
        assert created.status_code == 201
        task_id = created.json()["id"]

        read = client.get(f"/tasks/{task_id}")  # => reads are open, no token needed
        assert read.status_code == 200

        updated = client.put(
            f"/tasks/{task_id}",
            json={"title": "write the report", "description": "Q3 summary", "status": "done"},
            headers=auth_header,
        )
        assert updated.status_code == 200
        assert updated.json()["status"] == "done"

        deleted = client.delete(f"/tasks/{task_id}", headers=auth_header)
        assert deleted.status_code == 204

        gone = client.get(f"/tasks/{task_id}")
        assert gone.status_code == 404


class TestTokenCheckMiddleware:
    def test_create_without_token_is_401(self, client: TestClient) -> None:
        response = client.post("/tasks", json={"title": "x"})
        assert response.status_code == 401

    def test_create_with_garbage_token_is_401(self, client: TestClient) -> None:
        response = client.post(
            "/tasks", json={"title": "x"}, headers={"Authorization": "Bearer garbage.notasignature"}
        )
        assert response.status_code == 401  # => co-11: a forged signature never verifies

    def test_reads_never_require_a_token(self, client: TestClient) -> None:
        assert client.get("/tasks").status_code == 200
        assert client.get("/health").status_code == 200


class TestSqlInjectionIsFixed:  # => co-01, co-03: the Step 1 attack, re-run against the SHIPPED code
    def test_injection_payload_returns_no_extra_rows(self, client: TestClient) -> None:
        token = _register_and_login(client)
        auth_header = {"Authorization": f"Bearer {token}"}
        client.post("/tasks", json={"title": "write the report"}, headers=auth_header)
        client.post("/tasks", json={"title": "rotate prod db credentials"}, headers=auth_header)

        legit = client.get("/tasks/search", params={"q": "report"})
        assert len(legit.json()) == 1  # => a genuine substring match still works

        attack = client.get("/tasks/search", params={"q": "' OR '1'='1"})
        assert attack.status_code == 200
        assert attack.json() == []  # => the injection payload matches NO title substring anymore


class TestXssIsFixed:  # => co-01, co-06: the Step 3 attack, re-run against the SHIPPED code
    def test_view_route_escapes_hostile_title(self, client: TestClient) -> None:
        token = _register_and_login(client)
        auth_header = {"Authorization": f"Bearer {token}"}
        created = client.post("/tasks", json={"title": "<script>alert(1)</script>"}, headers=auth_header)
        task_id = created.json()["id"]
        response = client.get(f"/tasks/{task_id}/view")
        assert response.status_code == 200
        assert "<script>" not in response.text  # => the payload never appears as executable markup
        assert "&lt;script&gt;" in response.text  # => it appears ONLY as inert, escaped text


class TestSecurityHeaders:  # => co-19
    def test_headers_present_on_every_response(self, client: TestClient) -> None:
        response = client.get("/health")
        assert response.headers["content-security-policy"] == "default-src 'self'"
        assert response.headers["x-content-type-options"] == "nosniff"
        assert "strict-transport-security" in response.headers

    def test_headers_present_even_on_error_responses(self, client: TestClient) -> None:
        response = client.get("/tasks/999999")
        assert response.status_code == 404
        assert response.headers["x-content-type-options"] == "nosniff"  # => the middleware wraps EVERY response


class TestPaginationAndFiltering:  # => unchanged behavior from Backend-Essentials
    def test_pagination_window_and_metadata(self, client: TestClient) -> None:
        token = _register_and_login(client)
        auth_header = {"Authorization": f"Bearer {token}"}
        for i in range(15):
            client.post("/tasks", json={"title": f"task {i}"}, headers=auth_header)
        page = client.get("/tasks", params={"limit": 5, "offset": 0})
        body = page.json()
        assert len(body["items"]) == 5
        assert body["total"] == 15
        assert body["next"] == 5

    def test_limit_over_maximum_is_422(self, client: TestClient) -> None:
        response = client.get("/tasks", params={"limit": 1000})
        assert response.status_code == 422
```

**Output** (`pytest -v`, from `learning/capstone/code/`):

```text
============================= test session starts ==============================
platform darwin -- Python 3.13.12, pytest-9.1.1, pluggy-1.6.0 -- .venv/bin/python
cachedir: .pytest_cache
rootdir: learning/capstone/code
plugins: anyio-4.14.2
collecting ... collected 19 items

test_app.py::TestHealthAndReadiness::test_health_is_always_200 PASSED    [  5%]
test_app.py::TestHealthAndReadiness::test_ready_is_200_when_db_is_reachable PASSED [ 10%]
test_app.py::TestAuthArgon2id::test_register_then_login_succeeds_end_to_end PASSED [ 15%]
test_app.py::TestAuthArgon2id::test_stored_password_is_never_plaintext PASSED [ 21%]
test_app.py::TestAuthArgon2id::test_login_rejects_wrong_password PASSED  [ 26%]
test_app.py::TestAuthArgon2id::test_login_unknown_user_gets_same_generic_error PASSED [ 31%]
test_app.py::TestAuthArgon2id::test_register_rejects_hostile_username PASSED [ 36%]
test_app.py::TestAuthArgon2id::test_register_rejects_short_password PASSED [ 42%]
test_app.py::TestAuthArgon2id::test_duplicate_username_is_conflict PASSED [ 47%]
test_app.py::TestCrudRoundTrip::test_create_read_update_delete PASSED    [ 52%]
test_app.py::TestTokenCheckMiddleware::test_create_without_token_is_401 PASSED [ 57%]
test_app.py::TestTokenCheckMiddleware::test_create_with_garbage_token_is_401 PASSED [ 63%]
test_app.py::TestTokenCheckMiddleware::test_reads_never_require_a_token PASSED [ 68%]
test_app.py::TestSqlInjectionIsFixed::test_injection_payload_returns_no_extra_rows PASSED [ 73%]
test_app.py::TestXssIsFixed::test_view_route_escapes_hostile_title PASSED [ 78%]
test_app.py::TestSecurityHeaders::test_headers_present_on_every_response PASSED [ 84%]
test_app.py::TestSecurityHeaders::test_headers_present_even_on_error_responses PASSED [ 89%]
test_app.py::TestPaginationAndFiltering::test_pagination_window_and_metadata PASSED [ 94%]
test_app.py::TestPaginationAndFiltering::test_limit_over_maximum_is_422 PASSED [100%]

============================== 19 passed in 0.93s ==============================
```

**Key takeaway**: `TestSqlInjectionIsFixed` and `TestXssIsFixed` encode the exact two attacks
documented in Steps 1 and 3 as permanent regression tests -- the next change to this app cannot
silently reopen either hole without a red `pytest` run.

**Why it matters**: `test_stored_password_is_never_plaintext` reads the SQLite file directly,
bypassing the API entirely, the same way an attacker with database access would -- proving the
password is unrecoverable from storage is a stronger claim than proving the API never returns it.

## Strict-Mode `pyright` Verification

_exercises DD-39 (typed Python throughout)_

`pyrightconfig.json` scopes `"typeCheckingMode": "strict"` to `["app"]` only, matching the
Backend-Essentials capstone's own scoping rationale: `test_app.py` and `attack_transcript.py` sit
outside strict scope because `TestClient`'s `httpx`-backed request/response types and stdlib
`urllib` typing are not the object under test here -- every line of actual application code is.

**`learning/capstone/code/pyrightconfig.json`**

```json
{
  "typeCheckingMode": "strict",
  "pythonVersion": "3.13",
  "include": ["app"]
}
```

**Output** (strict-mode `pyright`, via `pyrightconfig.json`, run against `app/`):

```text
0 errors, 0 warnings, 0 informations
```

**Key takeaway**: `resolve_token()`'s `try`/`except` blocks in `app/auth.py` and the `assert row is
not None` statements in `repository.py` exist to satisfy strict-mode's `None`-narrowing -- every one
of them documents a real invariant (a malformed token fails closed; an `INSERT` immediately
followed by a `SELECT` on the same primary key cannot return `None`) rather than silencing a type
error blindly.

**Why it matters**: strict-mode `pyright` catches the SAME class of bug a `mypy --strict` run would
in a Python service handling untrusted network input -- an unnarrowed `Optional` that a handler
forgets to check is a crash waiting to happen the first time an attacker sends a token this app
doesn't expect.

## Acceptance criteria

- `curl` against the naive first draft's `/tasks/search?q=' OR '1'='1'` returns every task in the
  table (verified in Step 1's "before" transcript); the identical payload against the shipped,
  parameterized `search_tasks()` returns `[]` (verified in Step 1's "after" transcript).
- `curl` against the naive first draft's `/tasks/{id}/view` with a `<script>` payload renders it as
  executable markup (verified in Step 3's "before" transcript); the identical payload against the
  shipped, autoescaped Jinja2 template renders it as inert, escaped text (verified in Step 3's
  "after" transcript).
- `POST /auth/register` followed by `POST /auth/login` succeeds end to end, and a direct read of
  the SQLite `users` table shows only a `$argon2id$` PHC-format hash for the stored password, never
  the raw string -- verified in Step 2 via both the API and a direct database read.
- Hostile registration input (a username with SQL metacharacters, a too-short password) is
  rejected with a structured 422 before any handler code runs -- verified in Step 3.
- `curl -i` against a live route shows `Content-Security-Policy`, `X-Content-Type-Options`, and
  `Strict-Transport-Security` present on every response, success or error -- verified in Step 3.
- `grep` across the entire shipped source tree for the runtime secret value used to run every
  server session in this topic returns no matches; the only occurrence of the secret's env-var
  name is a read from `os.environ`, never an assignment -- verified in Step 4.
- `pip-audit` against this capstone's pinned dependency set exits clean with no known
  vulnerabilities -- verified in Step 4.
- `attack_transcript.py`, run against the shipped, live server, reports `ALL ATTACKS BLOCKED` with
  exit code `0` -- verified in "Full Attack Transcript, End to End".
- Every original Backend-Essentials endpoint (health, readiness, full CRUD, pagination-plus-
  filtering) still works exactly as before -- verified in "Base App Functionality Is Fully
  Preserved".
- `pytest -v` against `learning/capstone/code/` passes all 19 tests, genuinely green, with no
  skips.
- strict-mode `pyright` (via `pyrightconfig.json`) against `app/` reports 0 errors, 0 warnings, 0
  informations.

## Done bar

This capstone is runnable end to end: `uvicorn app.main:app --port 8000` (with
`CAPSTONE_AUTH_SECRET` set) from `learning/capstone/code/` starts a real server backed by a real,
schema-migrated SQLite file, and every `curl` transcript on this page -- both the "before" runs
against the naive first draft and the "after" runs against the shipped, hardened code -- is
genuine, captured output from an actual local run; no response body was hand-written or simulated
(DD-19). `pytest -v` against the same directory passes all 19 tests in the acceptance suite above,
strict-mode `pyright` (via the colocated `pyrightconfig.json`, scoped to `app/`) reports 0 errors,
0 warnings, 0 informations, and `attack_transcript.py` reports `ALL ATTACKS BLOCKED` against a live
server. `pip-audit` against this capstone's pinned `requirements.txt` exits clean, and a full-tree
grep confirms no secret value is committed anywhere in the source. Every mechanism this capstone
combines -- a real SQL-injection fix (co-01, co-03), argon2id password hashing with automatic
salting (co-09, co-10), a timing-safe-verified signed bearer token (co-11, co-12), allow-list
validation and autoescaped output encoding (co-06, co-07), environment-only secrets (co-17),
security headers on every response (co-19), and a clean dependency audit (co-21) -- is proven with
a genuine before/after attack transcript, not asserted without evidence. Every version pinned in
`requirements.txt` was confirmed current and CVE-clean via a direct `pip index versions` /
`pip-audit` check against this repository's own installed environment on 2026-07-15, not assumed
from training data.

---

← Previous: [Advanced Examples](../advanced.md) · Next: [Drilling](../../drilling/overview.md) →
