# => Fixture shim replaying a session log for decision points.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => The log is fixed data; nothing is replayed for real.
# => Real behaviour may differ; confirm with claude --help.

# => WHY decision points: forks teach session design, events teach trivia.
# => One replay a week builds pattern recognition.
# => Prompts frame; edits commit; both deserve review.

LOG = [
    "prompt: fix login",
    "call: read login.py",
    "call: edit login.py",
]  # => three log lines


def decisions(log):  # => pull the lines where direction was chosen
    return [
        l for l in log if l.startswith("prompt") or "edit" in l
    ]  # => prompt plus the edit


def calls(log):  # => pull the tool-call lines alone
    return [l for l in log if l.startswith("call")]  # => the two call lines


def main():  # => replay the log as counts and decision points
    print("lines:", len(LOG))  # => Output: lines: 3
    print("calls:", len(calls(LOG)))  # => Output: calls: 2
    print("decisions:", len(decisions(LOG)))  # => Output: decisions: 2


main()  # => run once; logs replay decisions, not just events
