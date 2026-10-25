# => Fixture shim running one brief twice per side.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Runs are fixed data; nothing executes twice here.
# => Real behaviour may differ; confirm with claude --help.
# => Peer shim: a stand-in for a sibling terminal agent in this plan.
# => Repeat the same brief in that course and compare numbers.
A_RUNS = [4, 6]  # => this tool's turns across two runs
B_RUNS = [5, 5]  # => the peer's turns across two runs


def spread(runs):  # => the range between best and worst run
    return max(runs) - min(runs)  # => 2 for A, 0 for B here


def mean(runs):  # => average turns across the repeated runs
    return sum(runs) / len(runs)  # => 5.0 for both sides here


def main():  # => report means and spreads for both sides
    print("means:", mean(A_RUNS), mean(B_RUNS))  # => Output: means: 5.0 5.0
    print("spreads:", spread(A_RUNS), spread(B_RUNS))  # => Output: spreads: 2 0


main()  # => run once; ranges beat anecdotes
