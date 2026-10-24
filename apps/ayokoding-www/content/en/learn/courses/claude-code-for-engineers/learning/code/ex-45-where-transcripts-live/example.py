# => Fixture shim of the transcript store address scheme.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Paths are fixed data; no disk is read here.
# => Real behaviour may differ; confirm with claude --help.
HOME = "~/.claude"  # => the configuration directory root
SESSIONS = ["auth-refactor", "docs-pass"]  # => two recorded sessions


def address(home, name):  # => build one transcript's address
    return home + "/transcripts/" + name + ".jsonl"  # => one path per session


def listing(home, sessions):  # => address every recorded session
    return [address(home, s) for s in sessions]  # => one address per name


def main():  # => list the transcript addresses
    for path in listing(HOME, SESSIONS):  # => walk both sessions
        print(path)  # => Output: the two transcript paths
    print("count:", len(SESSIONS))  # => Output: count: 2


main()  # => run once; transcripts outlive terminals
