# => Fixture shim of resuming a session by name.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => The registry is fixed data; no session store is touched.
# => Real behaviour may differ; confirm with claude --help.

# => WHY names: recency fails the moment two tasks interleave.
# => Names record intent when it is freshest.
# => Unknown names raise instead of opening the wrong past.
# => Named sessions make handoffs explainable.

REGISTRY = {
    "auth-refactor": 4,
    "docs-pass": 2,
}  # => two named sessions with turn counts


def lookup(registry, name):  # => find one session by its exact name
    if name not in registry:  # => unknown names fail fast, never guess
        raise KeyError(name)  # => KeyError names the missing session
    return registry[name]  # => the turn count proves it existed


def resume_named(registry, name):  # => reopen the named session's state
    turns = lookup(registry, name)  # => turns is 4 for auth-refactor
    return "resumed %s with %d turns" % (name, turns)  # => one status line


def main():  # => resume by name and list what remains
    print(
        resume_named(REGISTRY, "auth-refactor")
    )  # => Output: resumed auth-refactor with 4 turns
    print(
        "known:", ", ".join(sorted(REGISTRY))
    )  # => Output: known: auth-refactor, docs-pass


main()  # => run once; a typo in the name raises instead of guessing
