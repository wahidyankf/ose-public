# => Kata reference: per-hunk verdicts against the scope.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Hunks are fixed data; nothing is merged here.

# => WHY per hunk: overall glow hides the intruding file.
# => Membership checks beat aesthetic judgement.

HUNKS = [
    "login.py: add check",
    "auth.py: import check",
    "schema.sql: alter",
]  # => three hunks
SCOPE = ["login.py", "auth.py"]  # => the brief covers two files


def review(hunks, scope):  # => verdict every hunk against the scope
    verdicts = []  # => one verdict per hunk, in order
    for hunk in hunks:  # => walk hunks top to bottom, none skipped
        verdicts.append(hunk.split(":")[0] in scope)  # => file membership decides
    return verdicts  # => True, True, False for these hunks


def main():  # => print each hunk beside its verdict
    verdicts = review(HUNKS, SCOPE)  # => two approvals, one rejection
    for hunk, ok in zip(HUNKS, verdicts):  # => walk hunks with verdicts
        print(ok, hunk)  # => Output: True/False beside each hunk


main()  # => run once; compare your starter against these verdicts
