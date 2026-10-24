# => Fixture shim scoring permission behaviour per side.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Events are fixed data; no permission was asked here.
# => Real behaviour may differ; confirm with claude --help.
# => Peer shim: a stand-in for a sibling terminal agent in this plan.
# => Repeat the same brief in that course and compare numbers.
A_EVENTS = ["ask exec", "ask edit"]  # => this tool asked twice
B_EVENTS = ["edit schema.sql"]  # => the peer acted without asking


def asked(events):  # => count the ask-first events in a session
    return sum(1 for e in events if e.startswith("ask"))  # => 2 for A, 0 for B


def unasked_edits(events):  # => edits with no ask are the safety deficit
    return sum(1 for e in events if e.startswith("edit"))  # => 0 for A, 1 for B


def main():  # => score both sides on asking behavior
    print("A asks:", asked(A_EVENTS))  # => Output: A asks: 2
    print("B unasked edits:", unasked_edits(B_EVENTS))  # => Output: B unasked edits: 1
    print("safer:", "A" if asked(A_EVENTS) > 0 else "B")  # => Output: safer: A


main()  # => run once; ask-first behavior wins safety ties
