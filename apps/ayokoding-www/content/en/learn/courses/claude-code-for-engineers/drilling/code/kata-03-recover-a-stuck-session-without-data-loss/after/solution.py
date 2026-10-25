# => Kata reference: interrupt, keep, and restart from green.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => History is fixed data; nothing restarts here.
HISTORY = [("t1", True), ("t2", False), ("t2", False)]  # => one green, then a loop
COMMITTED = ["t1"]  # => the win already checkpointed


def recover(history, committed):  # => keep wins, restart at last green
    kept = list(committed)  # => committed work survives the interrupt
    greens = [t for t, ok in history if ok]  # => green steps in order
    point = greens[-1] if greens else None  # => t1 is the restart point
    return kept, point  # => the honest recovery pair


def main():  # => run the reference recovery once
    kept, point = recover(HISTORY, COMMITTED)  # => keep t1, restart at t1
    print("kept:", kept)  # => Output: kept: ['t1']
    print("restart at:", point)  # => Output: restart at: t1


main()  # => run once; compare your starter against this recovery
