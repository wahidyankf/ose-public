# => Fixture shim checking actions against brief guardrails.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Rules are fixed data; nothing is blocked for real.
# => Real behaviour may differ; confirm with claude --help.

# => WHY up front: tribal knowledge becomes a per-action check.
# => Review-time discovery wastes invested work and feelings.
# => Schema and dependency rules guard the irreversible.
# => Guardrails are cheapest as sentences, dearest as reverts.
# => Clear actions pass silently; only hits surface.

GUARDS = ["no schema change", "no new dependency"]  # => the two no-go rules
ACTIONS = [
    "edit login.py",
    "add package x",
    "edit schema.sql",
]  # => one clean, two hitting


def hits(action, guards):  # => name the guardrails one action breaks
    bad = []  # => broken rules collect here
    if (
        "package" in action and "no new dependency" in guards
    ):  # => new code library trips the rule
        bad.append("no new dependency")  # => record the dependency guard
    if (
        "schema" in action and "no schema change" in guards
    ):  # => schema edits trip the rule
        bad.append("no schema change")  # => record the schema guard
    return bad  # => empty means the action is clear


def main():  # => check all three actions against the guardrails
    for action in ACTIONS:  # => walk actions in the given order
        print(action, "->", hits(action, GUARDS))  # => Output: clear, then two hits


main()  # => run once; guardrails work only when written first
