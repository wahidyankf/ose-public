# => Fixture shim assembling one fully scoped session.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => The session never starts; only its config is validated.
# => Real behaviour may differ; confirm with claude --help.
BRIEF = {"scope": "login.py", "done": "tests pass"}  # => what and when-done
ALLOW = ["read /repo/**", "edit /repo/login.py"]  # => reads wide, edits narrow
MODE = "manual"  # => every sensitive action prompts


def validate(brief, allow, mode):  # => reject scoped sessions with holes
    problems = []  # => missing pieces collect here
    if "done" not in brief:  # => no done condition means no finish line
        problems.append("no done condition")  # => record the gap
    if not any(
        a.startswith("edit") for a in allow
    ):  # => an edit-less scope edits nothing
        problems.append("no edit rule")  # => record the gap
    if mode not in ("manual", "auto"):  # => unknown modes are typos, not features
        problems.append("unknown mode")  # => record the gap
    return problems  # => empty means the session is safe to start


def main():  # => validate the assembled session config
    print("problems:", validate(BRIEF, ALLOW, MODE))  # => Output: problems: []
    print("scope:", BRIEF["scope"])  # => Output: scope: login.py
    print("mode:", MODE)  # => Output: mode: manual


main()  # => run once; validate the scope before the session
