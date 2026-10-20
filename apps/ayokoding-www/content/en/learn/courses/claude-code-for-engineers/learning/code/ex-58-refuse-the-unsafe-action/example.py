# => Fixture shim refusing unsafe action classes outright.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Actions are fixed data; nothing is refused for real.
# => Real behaviour may differ; confirm with claude --help.
UNSAFE = ["drop table", "send secret", "disable guard"]  # => the never-allow class
PROPOSED = [
    "run tests",
    "drop table users",
    "edit login.py",
]  # => one unsafe among safe


def unsafe(action):  # => True when the action names a never-allow pattern
    return any(u in action for u in UNSAFE)  # => substring match on the class list


def triage(proposed):  # => refuse unsafe actions, pass the rest to review
    refused = [a for a in proposed if unsafe(a)]  # => the drop-table action
    review = [a for a in proposed if not unsafe(a)]  # => tests and edit proceed
    return refused, review  # => refusal plus the review queue


def main():  # => triage three proposed actions
    refused, review = triage(PROPOSED)  # => one refused, two to review
    print("refused:", refused)  # => Output: refused: ['drop table users']
    print("to review:", len(review))  # => Output: to review: 2


main()  # => run once; unsafe classes refuse without debate
