# => Fixture shim of manual versus auto permission modes.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => The classifier is a fixed rule here, not a learned model.
# => Real behaviour may differ; confirm with claude --help.

# => WHY mode is workload, not safety: risky steps reach you either way.
# => Manual teaches; auto repays the education later.
# => Silent mode changes hide approvals nobody remembers.
# => The classifier clears routine, never judgement.
# => Switch modes deliberately and announce it.

ACTIONS = [
    "read a.py",
    "exec npm test",
    "edit schema.sql",
]  # => the same three actions twice


def prompts_manual(actions):  # => manual mode prompts on writes and execs
    return [a for a in actions if not a.startswith("read")]  # => exec and edit prompt


def prompts_auto(actions):  # => auto classifier clears routine, holds risky
    held = [a for a in actions if "schema" in a]  # => schema edits still reach you
    return held  # => only the risky survivor prompts


def main():  # => count prompts under each mode
    print(
        "manual prompts:", len(prompts_manual(ACTIONS))
    )  # => Output: manual prompts: 2
    print("auto prompts:", len(prompts_auto(ACTIONS)))  # => Output: auto prompts: 1
    print(
        "auto held:", prompts_auto(ACTIONS)
    )  # => Output: auto held: ['edit schema.sql']


main()  # => run once; auto reduces prompts, never judgement
