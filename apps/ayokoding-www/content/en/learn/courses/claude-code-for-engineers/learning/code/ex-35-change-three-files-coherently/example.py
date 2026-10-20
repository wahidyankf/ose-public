# => Fixture shim checking coherence across a multi-file change.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Files are fixed data; nothing is edited here.
# => Real behaviour may differ; confirm with claude --help.
FILES = {
    "login.py": "def check(u, p)",
    "auth.py": "from login import check",
}  # => two files, one symbol
TESTS = {"test_login.py": "check(u, p)"}  # => the test names the same symbol


def symbols(files):  # => collect every new symbol each file introduces
    names = set()  # => symbols gather here without duplicates
    for body in files.values():  # => walk each file body once
        names.update(body.split())  # => words approximate symbols here
    return names  # => the shared vocabulary of the change


def coherent(files, tests):  # => the test must speak the change's language
    vocab = symbols(files)  # => the change introduces its vocabulary
    for body in tests.values():  # => walk each test body once
        if "check" not in body:  # => the key symbol must appear
            return False  # => a missing symbol breaks coherence
    return True  # => every test names the shared symbol


def main():  # => check coherence of the three-file change
    print("files:", len(FILES) + len(TESTS))  # => Output: files: 3
    print("coherent:", coherent(FILES, TESTS))  # => Output: coherent: True


main()  # => run once; incoherent changes fail review whole
