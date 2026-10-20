# => Fixture shim publishing a verdict stapled to its limits.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Verdicts are fixed data; no comparison ran here.
# => Real behaviour may differ; confirm with claude --help.
# => Peer shim: a stand-in for a sibling terminal agent in this plan.
# => Repeat the same brief in that course and compare numbers.
VERDICT = "A leads on turns, ties on correctness"  # => the headline result
LIMITS = ["2 runs each", "one task", "shim stand-ins"]  # => the three honest limits


def publish(verdict, limits):  # => staple every limit to the verdict
    lines = ["verdict: " + verdict]  # => the headline first
    lines += ["limit: " + l for l in limits]  # => each limit on its own line
    return lines  # => the publishable block


def main():  # => publish one verdict with three limits
    for line in publish(VERDICT, LIMITS):  # => print each published line
        print(line)  # => Output: verdict plus three limit lines


main()  # => run once; verdicts travel with their limits or not at all
