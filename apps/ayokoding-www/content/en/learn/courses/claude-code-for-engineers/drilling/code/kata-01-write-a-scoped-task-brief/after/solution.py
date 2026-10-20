# => Kata reference: a complete scoped task brief.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => The brief is fixed data; no agent reads it here.

# => WHY this shape: three fields remove vagueness mechanically.
# => Scope names the file so hands cannot wander.
# => Done names the command so finish is testable.
# => Guard names the limit so review has teeth.
# => Non-empty strings are the minimum viable clarity.
# => Reference stays plain; clarity needs no ornament.
# => Compare starters field by field, not by feel.
# => Missing fields fail loudly instead of drifting.
# => Briefs written here transfer to live sessions directly.

BRIEF = {
    "scope": "login.py",
    "done": "pytest -q exits 0",
}  # => scope plus checkable proof
GUARD = "no schema change"  # => the one no-go rule


def complete(brief, guard):  # => True when scope, done, and guard read clearly
    fields = [
        brief.get("scope"),
        brief.get("done"),
        guard,
    ]  # => the three required readings
    return all(
        isinstance(f, str) and len(f) > 0 for f in fields
    )  # => every field non-empty


def main():  # => confirm the reference brief is complete
    print(
        "brief:", BRIEF["scope"], "|", BRIEF["done"]
    )  # => Output: the scope and done line
    print("guard:", GUARD)  # => Output: guard: no schema change
    print("complete:", complete(BRIEF, GUARD))  # => Output: complete: True


main()  # => run once; compare your starter against this shape
