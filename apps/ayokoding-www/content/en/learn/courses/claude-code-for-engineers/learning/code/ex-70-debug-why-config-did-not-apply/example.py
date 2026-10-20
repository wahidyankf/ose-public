# => Fixture shim walking the config load chain for breaks.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Chain state is fixed data; nothing is loaded here.
# => Real behaviour may differ; confirm with claude --help.
CHAIN = [
    ("memory", True),
    ("settings", True),
    ("hooks", False),
]  # => hooks failed to load


def first_break(chain):  # => name the first link that failed to load
    for name, ok in chain:  # => walk the chain in load order
        if not ok:  # => the first False ends the search
            return name  # => hooks broke the chain here
    return None  # => None means everything loaded


def loaded(chain):  # => list the links that loaded fine
    return [n for n, ok in chain if ok]  # => memory and settings loaded


def main():  # => walk a three-link chain with one break
    print("loaded:", loaded(CHAIN))  # => Output: loaded: ['memory', 'settings']
    print("broken:", first_break(CHAIN))  # => Output: broken: hooks
    print("clean:", first_break([("a", True)]))  # => Output: clean: None


main()  # => run once; check the chain before blaming the agent
