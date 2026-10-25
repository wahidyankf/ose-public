# => Fixture shim rendering a transcript as portable lines.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Entries are fixed data; nothing is exported for real.
# => Real behaviour may differ; confirm with claude --help.
ENTRIES = [
    ("you", "fix login"),
    ("agent", "read login.py"),
    ("you", "approved"),
]  # => three entries


def render(entries):  # => render each entry as a role-tagged line
    return ["[%s] %s" % (role, text) for role, text in entries]  # => three tagged lines


def turns_by(entries, role):  # => count one role's turns in the session
    return sum(1 for r, t in entries if r == role)  # => you: 2, agent: 1


def main():  # => render the transcript and count roles
    for line in render(ENTRIES):  # => print each tagged line
        print(line)  # => Output: the three role-tagged lines
    print("your turns:", turns_by(ENTRIES, "you"))  # => Output: your turns: 2


main()  # => run once; portable transcripts travel to reviews
