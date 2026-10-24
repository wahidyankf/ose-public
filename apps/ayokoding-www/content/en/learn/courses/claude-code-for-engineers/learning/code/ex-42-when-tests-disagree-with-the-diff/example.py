# => Fixture shim classifying test-versus-diff disagreement.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => States are fixed data; no suite runs here.
# => Real behaviour may differ; confirm with claude --help.
CASES = [
    ("clean", "pass"),
    ("clean", "fail"),
    ("dirty", "pass"),
]  # => three of four combos


def suspect(diff, tests):  # => name what to distrust in each combination
    if diff == "clean" and tests == "pass":  # => agreement means proceed
        return "none"  # => nothing is suspect here
    if tests == "pass":  # => green tests beside a dirty diff
        return "the tests"  # => the suite may not cover the dirt
    return "the diff"  # => red tests beside a clean diff blame the change


def main():  # => classify the three disagreement cases
    for diff, tests in CASES:  # => walk each combination once
        print(diff, tests, "->", suspect(diff, tests))  # => Output: the suspect per row


main()  # => run once; disagreement is information, not noise
