# => Fixture shim of the Claude Code CLI command surface.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Deterministic simplification: no network, account, or billing.
# => Real behaviour may differ; confirm with claude --help.
REPORTED = "2.1.304"  # => the string claude --version prints on a good install
MINIMUM = (2, 1, 0)  # => oldest release this course still describes


def parse(text):  # => turn "2.1.304" into a tuple of plain integers
    parts = text.split(".")  # => split on dots into three text pieces
    major = int(parts[0])  # => major is 2, a breaking-change counter
    minor = int(parts[1])  # => minor is 1, the feature counter
    patch = int(parts[2])  # => patch is 304, the fix counter
    return (major, minor, patch)  # => tuples compare piece by piece


def supported(version, floor):  # => decide if the install is new enough
    return version >= floor  # => True when every piece meets the floor


def main():  # => drive the version check once, end to end
    found = parse(REPORTED)  # => found is (2, 1, 304) as numbers
    print("reported:", REPORTED)  # => Output: reported: 2.1.304
    print("parsed:", found)  # => Output: parsed: (2, 1, 304)
    ok = supported(found, MINIMUM)  # => ok is True for this release
    print("supported:", ok)  # => Output: supported: True


main()  # => run the check; a missing binary fails here, loudly
