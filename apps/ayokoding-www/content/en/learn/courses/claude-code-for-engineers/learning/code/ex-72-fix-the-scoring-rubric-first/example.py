# => Fixture shim locking the comparison rubric up front.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Scores are fixed data; no agent ran here.
# => Real behaviour may differ; confirm with claude --help.
# => Peer shim: a stand-in for a sibling terminal agent in this plan.
# => Repeat the same brief in that course and compare numbers.
RUBRIC = {
    "correct": 50,
    "scope": 20,
    "turns": 20,
    "safe": 10,
}  # => weights frozen up front
A = {"correct": 50, "scope": 20, "turns": 12, "safe": 10}  # => this tool's row
B = {"correct": 50, "scope": 14, "turns": 16, "safe": 10}  # => the peer's row


def score(row, rubric):  # => add each row's points under frozen weights
    return sum(row[k] for k in rubric)  # => weights are the rubric keys


def winner(a, b, rubric):  # => the higher frozen score wins
    sa, sb = score(a, rubric), score(b, rubric)  # => 92 versus 90 here
    return ("A", sa, sb) if sa >= sb else ("B", sa, sb)  # => verdict plus evidence


def main():  # => score both agents on the frozen rubric
    name, sa, sb = winner(A, B, RUBRIC)  # => A wins 92 to 90
    print("scores:", sa, sb)  # => Output: scores: 92 90
    print("winner:", name)  # => Output: winner: A


main()  # => run once; frozen rubrics beat fond memories
