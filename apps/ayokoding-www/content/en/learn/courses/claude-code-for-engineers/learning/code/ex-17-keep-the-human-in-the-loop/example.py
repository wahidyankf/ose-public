# => Fixture shim of a human-approval gate.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Steps are fixed data; nothing deploys here.
# => Real behaviour may differ; confirm with claude --help.

# => WHY halt with a name: resumable beats vaguely stuck.
# => Blast radius differs per step, so ownership does too.

STEPS = [
    ("edit login.py", "agent"),
    ("migrate users table", "human"),
]  # => one safe, one gated


def run_until_human(steps):  # => execute agent steps, halt at human ones
    done = []  # => completed agent steps collect here
    for name, owner in steps:  # => walk the plan in order
        if owner == "human":  # => human steps stop the run, never auto-pass
            return done, name  # => done plus the step waiting on you
        done.append(name)  # => agent steps complete immediately
    return done, None  # => None means no human step was met


def main():  # => run the mixed plan and show where it halts
    done, waiting = run_until_human(STEPS)  # => done has 1, waiting names the migration
    print("done:", done)  # => Output: done: ['edit login.py']
    print(
        "waiting on human:", waiting
    )  # => Output: waiting on human: migrate users table


main()  # => run once; human steps never auto-approve
