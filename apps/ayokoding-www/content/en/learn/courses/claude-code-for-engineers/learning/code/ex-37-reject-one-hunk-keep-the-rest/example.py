# => Fixture shim splitting a mixed diff by hunk verdict.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Verdicts are fixed data; nothing is applied here.
# => Real behaviour may differ; confirm with claude --help.
HUNKS = [
    ("login.py", True),
    ("auth.py", True),
    ("schema.sql", False),
]  # => two keepers, one reject


def split(hunks):  # => separate accepted hunks from rejected ones
    keep = [f for f, ok in hunks if ok]  # => the two accepted files
    drop = [f for f, ok in hunks if not ok]  # => the one rejected file
    return keep, drop  # => both lists keep diff order


def main():  # => split the mixed diff and explain the rejection
    keep, drop = split(HUNKS)  # => keep has 2, drop has 1
    print("keep:", keep)  # => Output: keep: ['login.py', 'auth.py']
    print("reject:", drop, "out of scope")  # => Output: reject with its reason


main()  # => run once; partial acceptance beats whole-diff roulette
