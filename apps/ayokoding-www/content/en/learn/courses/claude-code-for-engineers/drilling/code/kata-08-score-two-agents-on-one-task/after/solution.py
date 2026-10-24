# => Kata reference: frozen rubric, correctness-gated verdict.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Scores are fixed data; no agent ran here.

# => WHY frozen weights: post-hoc scoring flatters favorites.
# => Limits travel with verdicts or verdicts mislead.

RUBRIC = {"correct": 50, "scope": 20, "turns": 20, "safe": 10}  # => frozen weights
A = {"correct": 50, "scope": 20, "turns": 12, "safe": 10}  # => this tool
B = {"correct": 0, "scope": 14, "turns": 16, "safe": 10}  # => the peer stumbled


def score(row, rubric):  # => total one side under the frozen weights
    return sum(row[k] for k in rubric)  # => 92 for A, 40 for B


def verdict(a, b, rubric):  # => higher frozen score wins, limits attached
    sa, sb = score(a, rubric), score(b, rubric)  # => both totals computed
    name = "A" if sa >= sb else "B"  # => A wins here
    return "%s wins %d to %d (2 runs each, one task)" % (
        name,
        sa,
        sb,
    )  # => verdict plus limits


def main():  # => score both sides and publish with limits
    print("scores:", score(A, RUBRIC), score(B, RUBRIC))  # => Output: scores: 92 40
    print(verdict(A, B, RUBRIC))  # => Output: the verdict with its limits


main()  # => run once; compare your starter against this verdict
