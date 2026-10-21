# => Offline simulator for a gh pr command over a fixture.
# => Fixture mirrors the gh pr view --json shape on 2026-10-20.
# => No gh binary and no network; reads pr.json only.
# => WHY fixtures: review state is frozen, assertions stay stable.
# => Every printed field exists in the live --json output too.
import json  # => parse the frozen fixture file
from pathlib import Path  # => locate the fixture beside this script


HERE = Path(__file__).resolve().parent  # => unit directory itself
HEAD = "cache-deps"  # => branch carrying the change
BASE = "main"  # => branch receiving the change


def load():  # => read the frozen pull request record
    text = (HERE / "pr.json").read_text(encoding="utf-8")  # => raw bytes
    return json.loads(text)  # => parsed fixture dict


def main():  # => prove the recorded PR matches the intended direction
    pr = load()  # => the PR that creation would return
    print("number:", pr["number"])  # => Output: assigned number
    print("direction:", HEAD + "->" + BASE)  # => intended direction
    print("match:", pr["head"] == HEAD and pr["base"] == BASE)  # => True
    print("title:", pr["title"])  # => Output: the recorded title


main()  # => run once; direction mismatch fails the match line
