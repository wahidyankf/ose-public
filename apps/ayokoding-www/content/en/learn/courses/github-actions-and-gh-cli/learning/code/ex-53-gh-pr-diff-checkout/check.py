# => Offline simulator for a gh pr command over a fixture.
# => Fixture mirrors the gh pr view --json shape on 2026-10-20.
# => No gh binary and no network; reads pr.json only.
# => WHY fixtures: review state is frozen, assertions stay stable.
# => Every printed field exists in the live --json output too.
import json  # => parse the frozen fixture file
from pathlib import Path  # => locate the fixture beside this script


HERE = Path(__file__).resolve().parent  # => unit directory itself


def load():  # => read the frozen pull request record
    text = (HERE / "pr.json").read_text(encoding="utf-8")  # => raw bytes
    return json.loads(text)  # => parsed fixture dict


def main():  # => print the local checkout plan for this PR
    pr = load()  # => frozen pull request record
    print(
        "fetch:", "pull/" + str(pr["number"]) + "/head:pr-" + str(pr["number"])
    )  # => ref
    print("checkout:", "pr-" + str(pr["number"]))  # => local branch name
    print("files:", ",".join(pr["files"]))  # => files the PR touches
    print("additions:", pr["additions"], "deletions:", pr["deletions"])  # => size


main()  # => run once; fetching never runs, only the plan prints
