# => Kata reference: billing changes start it, docs edits skip it.
# => Checked against the vendor path-filter docs on 2026-10-20.
# => PATHS lists the service tree; pushes must touch one glob to run.
# => Docs-only pushes match nothing and the workflow stays quiet.

# => WHY this shape: minutes should scale with the change, not the repo.
# => One service, one file, one owner: the billing team owns this filter.
# => Keep a docs check elsewhere, or typos ship unverified forever.
PATHS = ["billing/**"]  # => the billing service tree


def scoped(paths, changed):  # => True when the push touches the tree
    return any(c.startswith("billing/") for c in changed)  # => prefix match


def main():  # => print the scope and two verdicts: code runs, docs skip
    print("paths:", ",".join(PATHS))  # => Output: the service globs
    print("code-push:", scoped(PATHS, ["billing/api.py"]))  # => True
    print("docs-push:", scoped(PATHS, ["docs/guide.md"]))  # => False


main()  # => run once; True on docs means the filter leaks
