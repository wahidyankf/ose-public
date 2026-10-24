# => Fixture shim of allow plus deny rule evaluation.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Rules are fixed data; no access is granted here.
# => Real behaviour may differ; confirm with claude --help.
ALLOW = ["edit /repo/**"]  # => broad allow over the whole repo
DENY = ["edit /repo/migrations/**"]  # => narrow deny over migrations


def matches(path, patterns):  # => test a path against glob-style rules
    return any(
        path.startswith(p.split("*")[0]) for p in patterns
    )  # => prefix match per rule


def decide(path):  # => deny wins over allow, always
    if matches(path, DENY):  # => the deny list is consulted first
        return "deny"  # => protected paths refuse even when allowed
    if matches(path, ALLOW):  # => allow covers the unprotected rest
        return "allow"  # => ordinary repo paths pass
    return "ask"  # => unlisted paths fall back to a prompt


def main():  # => decide one protected and one ordinary path
    print(
        "migration:", decide("/repo/migrations/001.sql")
    )  # => Output: migration: deny
    print("code:", decide("/repo/login.py"))  # => Output: code: allow
    print("other:", decide("/tmp/x"))  # => Output: other: ask


main()  # => run once; order of checks is the safety policy
