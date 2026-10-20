# => Fixture shim gating style comparison on correctness.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Outcomes are fixed data; no code is judged here.
# => Real behaviour may differ; confirm with claude --help.
# => Peer shim: a stand-in for a sibling terminal agent in this plan.
# => Repeat the same brief in that course and compare numbers.
A = {"correct": True, "style": 8}  # => correct with style 8
B = {"correct": False, "style": 9}  # => prettier but wrong


def finalists(a, b):  # => only correct sides reach the style round
    sides = {"A": a, "B": b}  # => name each side's outcome
    return [n for n, s in sides.items() if s["correct"]]  # => B drops out here


def style_winner(names, sides):  # => best style among the correct sides
    return max(names, key=lambda n: sides[n]["style"])  # => A wins by default here


def main():  # => gate on correctness, then judge style
    final = finalists(A, B)  # => only A survives the gate
    print("finalists:", final)  # => Output: finalists: ['A']
    print("style:", style_winner(final, {"A": A, "B": B}))  # => Output: style: A


main()  # => run once; wrong code leaves the contest early
