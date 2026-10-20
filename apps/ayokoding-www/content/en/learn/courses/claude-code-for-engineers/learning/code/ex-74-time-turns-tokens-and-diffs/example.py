# => Fixture shim measuring three cost axes per side.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Measurements are fixed data; nothing is timed here.
# => Real behaviour may differ; confirm with claude --help.
# => Peer shim: a stand-in for a sibling terminal agent in this plan.
# => Repeat the same brief in that course and compare numbers.
A = {"turns": 4, "tokens": 9000, "lines": 18}  # => this tool's three costs
B = {"turns": 6, "tokens": 7000, "lines": 18}  # => the peer's three costs


def cheaper(a, b):  # => name the winning axis owner per axis
    wins = {}  # => axis maps to the cheaper side
    for axis in ("turns", "tokens", "lines"):  # => walk all three axes
        wins[axis] = "A" if a[axis] <= b[axis] else "B"  # => ties favor A
    return wins  # => A takes turns, B takes tokens, lines tie


def main():  # => compare both sides axis by axis
    wins = cheaper(A, B)  # => three axis verdicts
    print("turns:", wins["turns"])  # => Output: turns: A
    print("tokens:", wins["tokens"])  # => Output: tokens: B
    print("lines:", wins["lines"])  # => Output: lines: A


main()  # => run once; no single axis tells the story
