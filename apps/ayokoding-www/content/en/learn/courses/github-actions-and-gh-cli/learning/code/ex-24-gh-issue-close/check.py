# => Offline simulator for a gh issue command over a fixture.
# => Fixture mirrors the gh issue list --json shape on 2026-10-20.
# => No gh binary and no network; reads issues.json only.
# => WHY fixtures: the same bytes replay forever, live state never does.
# => Counts here must match the live command output shape.
# => Every print mirrors one line a real gh call would emit.
import json  # => parse the frozen fixture file
from pathlib import Path  # => locate the fixture beside this script


HERE = Path(__file__).resolve().parent  # => unit directory itself
NUMBER = 12  # => the issue this run closes


def load():  # => read the frozen issue list
    text = (HERE / "issues.json").read_text(encoding="utf-8")  # => raw bytes
    return json.loads(text)  # => parsed fixture list


def main():  # => simulate closing and recount the open set
    issues = load()  # => recorded issues before closing
    target = [i for i in issues if i["number"] == NUMBER]  # => match
    assert target and target[0]["state"] == "open", "must close open"  # => g
    rest = [i for i in issues if i["number"] != NUMBER]  # => survivors
    left = [i for i in rest if i["state"] == "open"]  # => still open
    print("closed:", NUMBER)  # => Output: the closed number
    print("open-before:", sum(1 for i in issues if i["state"] == "open"))  # => n
    print("open-after:", len(left))  # => Output: decremented count


main()  # => run once; closing an open issue drops the count by one
