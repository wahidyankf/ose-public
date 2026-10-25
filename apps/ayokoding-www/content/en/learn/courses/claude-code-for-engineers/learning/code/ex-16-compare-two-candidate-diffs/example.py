# => Fixture shim of scoring two candidate diffs.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Candidates are fixed data; no code is applied here.
# => Real behaviour may differ; confirm with claude --help.
A = {"files": 1, "tests": True, "lines": 6}  # => small, tested candidate
B = {"files": 3, "tests": True, "lines": 40}  # => sprawling, tested candidate


def score(diff):  # => fewer files and lines score higher, tests are mandatory
    if not diff["tests"]:  # => untested candidates score nothing at all
        return 0  # => zero removes it from consideration
    return 100 - 10 * diff["files"] - diff["lines"]  # => small and scoped wins


def pick(a, b):  # => return the winning label and both scores
    sa, sb = score(a), score(b)  # => sa is 84, sb is 30 here
    winner = "A" if sa >= sb else "B"  # => ties favor the first candidate
    return winner, sa, sb  # => the verdict plus its evidence


def main():  # => score both candidates and name the winner
    print("scores:", score(A), score(B))  # => Output: scores: 84 30
    print("pick:", pick(A, B)[0])  # => Output: pick: A


main()  # => run once; criteria decide, not adjectives
