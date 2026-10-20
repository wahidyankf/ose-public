# => Fixture shim grading done conditions by checkability.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Grades wording only; no agent reads these briefs.
# => Real behaviour may differ; confirm with claude --help.

# => WHY checkable: machines can declare command results met.
# => Better and cleaner mean different things to every reader.
# => One clause names the command and its expected result.
# => Untestable finish lines become arguments later.
# => Grade briefs before sending, not after failing.
# => Zero-score briefs never leave this gate.

BRIEFS = [
    "make it better",
    "tests pass",
    "pytest -q exits 0",
]  # => vague, better, checkable


def checkable(done):  # => a done condition counts when a command can test it
    return " " in done or done in (
        "tests pass",
        "green",
    )  # => commands and known gates pass


def grade(briefs):  # => score each brief 0 or 1 on its done condition
    return [
        (b, 1 if checkable(b) else 0) for b in briefs
    ]  # => pairs keep brief and score


def main():  # => grade the three briefs from vague to checkable
    for brief, mark in grade(BRIEFS):  # => walk briefs in the given order
        print("%d %s" % (mark, brief))  # => Output: 0, 1, 1 down the rows


main()  # => run once; uncheckable done conditions score zero
