# => Fixture shim of a diff-stat reader.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => The diff is fixed data; no repository is touched.
# => Real behaviour may differ; confirm with claude --help.
ADDED = ["+def login(u, p):", "+    return check(u, p)"]  # => two lines the agent adds
REMOVED = ["-def login(u):"]  # => one line the agent replaces


def stat(added, removed):  # => count the change the way git would
    plus = len(added)  # => plus is 2 here
    minus = len(removed)  # => minus is 1 here
    return "+%d -%d" % (plus, minus)  # => one compact stat string


def touches_outside(diff_files, scope):  # => flag files outside the brief
    extra = [f for f in diff_files if f not in scope]  # => keep only out-of-scope names
    return extra  # => empty means the change stayed inside


def main():  # => render the stat and the scope check
    print("stat:", stat(ADDED, REMOVED))  # => Output: stat: +2 -1
    print(
        "outside:", touches_outside(["login.py"], ["login.py"])
    )  # => Output: outside: []
    print("added:", len(ADDED))  # => Output: added: 2


main()  # => run once; read stats before prose, always
