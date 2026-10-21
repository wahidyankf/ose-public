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


def main():  # => print the fields a reviewer checks first
    pr = load()  # => frozen pull request record
    print("pr:", pr["number"], pr["title"])  # => number plus title
    print("head:", pr["head"], "->", pr["base"])  # => merge direction
    print("author:", pr["author"])  # => Output: who opened it
    print("state:", pr["state"])  # => Output: open or merged
    print("mergeable:", pr["mergeable"])  # => conflict signal


main()  # => run once; a missing field fails with KeyError
