# => Fixture shim of the red-green-accept rhythm.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => States are fixed data; no test runs here.
# => Real behaviour may differ; confirm with claude --help.
STATES = ["red", "green"]  # => fail first, then pass


def witnessed(states):  # => both states must appear in order
    return states == ["red", "green"]  # => True only for the true sequence


def accept(states):  # => accept exactly when red then green was seen
    if witnessed(states):  # => the full rhythm earns acceptance
        return "accept"  # => both states witnessed
    return "hold"  # => anything else waits


def main():  # => walk the rhythm and render the verdict
    print("states:", " -> ".join(STATES))  # => Output: states: red -> green
    print("verdict:", accept(STATES))  # => Output: verdict: accept
    print("skipped red:", accept(["green"]))  # => Output: skipped red: hold


main()  # => run once; green without red proves nothing
