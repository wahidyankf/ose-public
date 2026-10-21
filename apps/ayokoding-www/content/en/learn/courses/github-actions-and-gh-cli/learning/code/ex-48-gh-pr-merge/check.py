# => Offline simulator for a gh pr command over a fixture.
# => Fixture mirrors the gh pr view --json shape on 2026-10-20.
# => No gh binary and no network; reads pr.json only.
# => WHY fixtures: review state is frozen, assertions stay stable.
# => Every printed field exists in the live --json output too.
import json  # => parse the frozen fixture file
from pathlib import Path  # => locate the fixture beside this script


HERE = Path(__file__).resolve().parent  # => unit directory itself
METHOD = "squash"  # => merge strategy this run uses


def load():  # => read the frozen pull request record
    text = (HERE / "pr.json").read_text(encoding="utf-8")  # => raw bytes
    return json.loads(text)  # => parsed fixture dict


def blockers(pr):  # => reasons this PR must not merge yet
    found = []  # => collected blocker strings
    if pr["mergeable"] != "MERGEABLE":  # => conflicts present
        found.append("conflicts")  # => resolve first
    bad = [c["name"] for c in pr["checks"] if c["conclusion"] != "success"]  # => red
    found.extend("check:" + name for name in bad)  # => name each one
    no = [r for r in pr["reviews"] if r["state"] == "CHANGES_REQUESTED"]  # => veto
    if no:  # => at least one reviewer objected
        found.append("review-changes-requested")  # => address first
    return found  # => empty means safe to merge


def main():  # => gate the merge on checks, conflicts, and reviews
    pr = load()  # => frozen pull request record
    stops = blockers(pr)  # => every reason to wait
    print("method:", METHOD)  # => Output: the merge strategy
    print("blockers:", ",".join(stops) if stops else "none")  # => list
    print("merge:", not stops)  # => True only when the list is empty


main()  # => run once; never merge past a named blocker
