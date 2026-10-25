# => Fixture shim checkpointing green steps as small commits.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Commits are fixed data; no repository is touched.
# => Real behaviour may differ; confirm with claude --help.
STEPS = [
    ("add check", True),
    ("refactor auth", True),
    ("docs", False),
]  # => two green, one red


def checkpoint(steps):  # => commit green steps, hold red ones
    commits = []  # => checkpointed messages collect here
    for message, green in steps:  # => walk steps in session order
        if green:  # => green steps become commits immediately
            commits.append(message)  # => record the checkpoint
        else:  # => red steps stop the checkpoint line
            break  # => nothing past a failure is safe
    return commits  # => the safe prefix of the session


def main():  # => checkpoint the three steps
    commits = checkpoint(STEPS)  # => two commits before the red step
    print("commits:", len(commits))  # => Output: commits: 2
    print("first:", commits[0])  # => Output: first: add check


main()  # => run once; commit the win before chasing the next
