# => Fixture shim of the sandboxed shell boundary.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Paths are fixed data; no boundary is enforced here.
# => Real behaviour may differ; confirm with claude --help.
ALLOWED = ["/repo", "/tmp/work"]  # => the two directories inside the fence
REQUESTS = [
    "/repo/a.py",
    "/etc/passwd",
    "/tmp/work/o.txt",
]  # => two inside, one outside


def inside(path, roots):  # => test one path against the fence
    return any(path.startswith(r) for r in roots)  # => True when any root prefixes it


def enforce(requests, roots):  # => split requests into allowed and refused
    ok = [p for p in requests if inside(p, roots)]  # => the two inside paths
    denied = [p for p in requests if not inside(p, roots)]  # => the outside path
    return ok, denied  # => both lists keep request order


def main():  # => enforce the boundary over three requests
    ok, denied = enforce(REQUESTS, ALLOWED)  # => ok has 2, denied has 1
    print("allowed:", len(ok))  # => Output: allowed: 2
    print("denied:", denied)  # => Output: denied: ['/etc/passwd']


main()  # => run once; the fence is checked before execution
