# => Fixture shim detecting a repeating-action loop.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Actions are fixed data; nothing is retried here.
# => Real behaviour may differ; confirm with claude --help.
ACTIONS = ["edit login.py", "test", "edit login.py", "test"]  # => the same pair twice


def repeats(actions, window):  # => True when the last window repeats itself
    if len(actions) < window * 2:  # => too short to contain a repeat
        return False  # => young sessions are not loops yet
    return (
        actions[-window:] == actions[-2 * window : -window]
    )  # => compare the two halves


def name_loop(actions):  # => name the repeated action for the report
    return (
        actions[-1] if repeats(actions, 2) else "no loop"
    )  # => the looping action or all-clear


def main():  # => detect the loop in four actions
    print("loop:", repeats(ACTIONS, 2))  # => Output: loop: True
    print("repeating:", name_loop(ACTIONS))  # => Output: repeating: test


main()  # => run once; named loops get interrupted, unnamed ones get watched
