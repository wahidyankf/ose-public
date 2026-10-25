# => Fixture shim of a task-brief checker.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Checks structure only; no agent reads the brief here.
# => Real behaviour may differ; confirm with claude --help.

# => WHY three fields: scope, done, and guardrails remove guessing.
# => Vague prompts produce confident guesses about intent.
# => Rejected briefs cost seconds; confused sessions cost hours.
# => The brief is the first deliverable, review it like one.
# => Structure checks run before any agent sees the brief.
# => Completeness here is binary: all three or rejected.
# => Good briefs make agent behavior predictable.

REQUIRED = ["scope", "done", "guardrails"]  # => the three fields every brief needs


def check(brief):  # => list the required fields a brief forgot
    missing = [f for f in REQUIRED if f not in brief]  # => keep only absent fields
    return missing  # => an empty list means the brief is complete


def summarize(brief):  # => render a complete brief as one status line
    return "%s | done when %s | %s" % (
        brief["scope"],
        brief["done"],
        brief["guardrails"],
    )  # => scope first


def main():  # => reject the vague brief, accept the complete one
    vague = {"scope": "fix things"}  # => no done condition, no guardrails
    print(
        "vague missing:", ", ".join(check(vague))
    )  # => Output: vague missing: done, guardrails
    solid = {
        "scope": "login.py",
        "done": "tests pass",
        "guardrails": "no schema change",
    }  # => all three present
    print("solid missing:", check(solid))  # => Output: solid missing: []
    print("brief:", summarize(solid))  # => Output: brief: the complete one-liner


main()  # => run once; incomplete briefs never leave this gate
