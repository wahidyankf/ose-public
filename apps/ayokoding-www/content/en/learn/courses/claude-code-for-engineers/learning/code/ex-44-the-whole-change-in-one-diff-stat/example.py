# => Fixture shim aggregating a session into one diff stat.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => File stats are fixed data; no diff runs here.
# => Real behaviour may differ; confirm with claude --help.
FILES = {
    "login.py": (12, 3),
    "auth.py": (4, 4),
    "test_login.py": (20, 0),
}  # => added, removed per file


def aggregate(files):  # => total the session into files, added, removed
    names = sorted(files)  # => sorted names keep the stat deterministic
    added = sum(a for a, r in files.values())  # => added is 36 here
    removed = sum(r for a, r in files.values())  # => removed is 7 here
    return len(names), added, removed  # => the three stat numbers


def main():  # => render the session as one stat line
    files, added, removed = aggregate(FILES)  # => 3 files, 36 added, 7 removed
    print("files changed:", files)  # => Output: files changed: 3
    print("stat: +%d -%d" % (added, removed))  # => Output: stat: +36 -7


main()  # => run once; read the stat before the hunks
