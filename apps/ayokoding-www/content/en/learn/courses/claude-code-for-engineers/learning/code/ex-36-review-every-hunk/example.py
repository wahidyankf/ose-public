# => Fixture shim walking every hunk with a verdict.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Hunks are fixed data; nothing is merged here.
# => Real behaviour may differ; confirm with claude --help.
HUNKS = [
    "login.py: add check",
    "auth.py: import check",
    "docs: fix typo",
]  # => three hunks to judge


def review(hunks, scope):  # => verdict every hunk against the scope
    verdicts = []  # => one verdict per hunk, in order
    for hunk in hunks:  # => walk hunks top to bottom, none skipped
        file = hunk.split(":")[0]  # => the file name leads each hunk
        verdicts.append((hunk, file in scope))  # => True means in-scope
    return verdicts  # => the full verdict list


def main():  # => review three hunks against a two-file scope
    verdicts = review(HUNKS, ["login.py", "auth.py"])  # => two True, one False
    for hunk, ok in verdicts:  # => print each hunk with its verdict
        print(ok, hunk)  # => Output: True/False beside each hunk


main()  # => run once; unreviewed hunks are unmerged hunks
