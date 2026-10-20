# => Fixture shim tracing a rename across three files.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => File contents are fixed data; nothing is renamed here.
# => Real behaviour may differ; confirm with claude --help.

# => WHY both names: introduction without retirement breaks imports.
# => Stale callers fail at runtime, past review time.

OLD = "authenticate"  # => the name being retired
NEW = "check_credentials"  # => the name replacing it
FILES = {
    "login.py": "def check_credentials",
    "auth.py": "import authenticate",
}  # => one moved, one stale


def stale(files, old):  # => find files still naming the retired symbol
    return [
        f for f, b in files.items() if old in b
    ]  # => auth.py still says authenticate


def moved(files, new):  # => find files already naming the new symbol
    return [f for f, b in files.items() if new in b]  # => login.py moved


def main():  # => report moved and stale files for the rename
    print("moved:", moved(FILES, NEW))  # => Output: moved: ['login.py']
    print("stale:", stale(FILES, OLD))  # => Output: stale: ['auth.py']


main()  # => run once; stale callers break at import time
