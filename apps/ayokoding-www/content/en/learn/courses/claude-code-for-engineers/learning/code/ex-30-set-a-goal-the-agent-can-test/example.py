# => Fixture shim of a testable completion goal.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Test results are fixed data; no suite runs here.
# => Real behaviour may differ; confirm with claude --help.
GOAL = "login rejects wrong passwords"  # => the outcome in plain words
COMMAND = "pytest tests/test_login.py -q"  # => the command that proves it


def met(failures):  # => the goal is met exactly when failures reach zero
    return failures == 0  # => zero failures means the goal holds


def status(goal, command, failures):  # => render the goal plus its verdict
    verdict = "met" if met(failures) else "open"  # => one word carries the state
    return "%s [%s]: %s" % (goal, command, verdict)  # => goal, proof, verdict


def main():  # => show the goal open, then met
    print(status(GOAL, COMMAND, 2))  # => Output: the goal line marked open
    print(status(GOAL, COMMAND, 0))  # => Output: the goal line marked met


main()  # => run once; untestable goals stay wishes
