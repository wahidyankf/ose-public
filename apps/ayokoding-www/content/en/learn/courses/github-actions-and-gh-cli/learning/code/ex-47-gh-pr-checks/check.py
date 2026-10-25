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


def verdict(checks):  # => roll every check into one word
    if any(c["conclusion"] == "failure" for c in checks):  # => any red
        return "failing"  # => at least one check failed
    if all(c["status"] == "completed" for c in checks):  # => all done
        return "passing"  # => every check green
    return "pending"  # => still running somewhere


def main():  # => list each check, then the rolled-up verdict
    pr = load()  # => frozen pull request record
    for check in pr["checks"]:  # => one line per check, stable order
        done = check["status"] + "/" + check["conclusion"]  # => state
        print(check["name"] + ":", done)  # => Output: check status
    print("verdict:", verdict(pr["checks"]))  # => Output: rollup word


main()  # => run once; merge only on a passing verdict
