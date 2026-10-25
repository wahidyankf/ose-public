# => Fixture shim restarting from the last green checkpoint.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => History is fixed data; nothing restarts here.
# => Real behaviour may differ; confirm with claude --help.

# => WHY from green: zero discards proven work with the confusion.
# => The attached lesson keeps the retry out of the same ditch.
# => Fresh sessions are cheap; confused ones are expensive.
# => Restart early and the total bill usually shrinks.

HISTORY = [
    ("t1", True),
    ("t2", True),
    ("t3", False),
    ("t4", False),
]  # => green, green, red, red


def last_green(history):  # => find the newest green checkpoint
    greens = [t for t, ok in history if ok]  # => t1 and t2 survived
    return greens[-1] if greens else None  # => t2 is the restart point


def restart(history, lesson):  # => restart at the last green with a lesson
    point = last_green(history)  # => the solid ground to stand on
    return "restart at %s: %s" % (point, lesson)  # => point plus the learning


def main():  # => restart a four-turn history with its lesson
    print("last green:", last_green(HISTORY))  # => Output: last green: t2
    print(
        restart(HISTORY, "scope was too wide")
    )  # => Output: restart at t2 with the lesson


main()  # => run once; restart from green, never from zero
