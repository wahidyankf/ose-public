# => Fixture shim scoring two brief styles on one rubric.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Scores are fixed data; no agent reads either brief.
# => Real behaviour may differ; confirm with claude --help.
VAGUE = {"scope": 0, "done": 0, "guards": 0}  # => "fix things" scores nowhere
SCOPED = {"scope": 1, "done": 1, "guards": 1}  # => the full brief scores everywhere


def total(marks):  # => add the rubric rows into one score
    return (
        marks["scope"] + marks["done"] + marks["guards"]
    )  # => 0 for vague, 3 for scoped


def gap(a, b):  # => measure how much clarity the rewrite adds
    return total(b) - total(a)  # => the improvement in rubric points


def main():  # => score both briefs and the gap between them
    print("vague:", total(VAGUE))  # => Output: vague: 0
    print("scoped:", total(SCOPED))  # => Output: scoped: 3
    print("gap:", gap(VAGUE, SCOPED))  # => Output: gap: 3


main()  # => run once; rewrite vague briefs until the gap closes
