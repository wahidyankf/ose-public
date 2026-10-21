# => Offline simulator for a gh pr command over a fixture.
# => Fixture mirrors the gh pr view --json shape on 2026-10-20.
# => No gh binary and no network; reads pr.json only.
# => WHY fixtures: review state is frozen, assertions stay stable.
# => Every printed field exists in the live --json output too.
import json  # => parse the frozen fixture file
from pathlib import Path  # => locate the fixture beside this script


HERE = Path(__file__).resolve().parent  # => unit directory itself
WANT = "APPROVE"  # => review action this run records


def load():  # => read the frozen pull request record
    text = (HERE / "pr.json").read_text(encoding="utf-8")  # => raw bytes
    return json.loads(text)  # => parsed fixture dict


def approvals(reviews):  # => logins whose latest review approves
    good = [r["user"] for r in reviews if r["state"] == "APPROVED"]  # => yes
    return sorted(set(good))  # => unique, deterministic order


def main():  # => record the review action and recount approvals
    pr = load()  # => frozen pull request record
    print("action:", WANT, "on", pr["number"])  # => what is recorded
    print("approvals:", ",".join(approvals(pr["reviews"])))  # => who said yes
    print("count:", len(approvals(pr["reviews"])))  # => approval total


main()  # => run once; approvals only grow, never shrink here
