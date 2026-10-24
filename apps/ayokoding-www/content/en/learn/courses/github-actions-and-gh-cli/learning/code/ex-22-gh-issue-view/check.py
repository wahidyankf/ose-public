# => Offline simulator for a gh issue command over a fixture.
# => Fixture mirrors the gh issue list --json shape on 2026-10-20.
# => No gh binary and no network; reads issues.json only.
# => WHY fixtures: the same bytes replay forever, live state never does.
# => Counts here must match the live command output shape.
# => Every print mirrors one line a real gh call would emit.
import json  # => parse the frozen fixture file
from pathlib import Path  # => locate the fixture beside this script


HERE = Path(__file__).resolve().parent  # => unit directory itself
NUMBER = 12  # => the issue this viewer opens


def load():  # => read the frozen issue list
    text = (HERE / "issues.json").read_text(encoding="utf-8")  # => raw bytes
    return json.loads(text)  # => parsed fixture list


def main():  # => print the one issue like gh issue view would
    issues = load()  # => every recorded issue
    found = [i for i in issues if i["number"] == NUMBER]  # => match
    assert len(found) == 1, "fixture must hold the issue"  # => guard
    issue = found[0]  # => the single matching record
    print("title:", issue["title"])  # => Output: the issue title
    print("state:", issue["state"])  # => Output: open or closed
    print("author:", issue["author"])  # => Output: who reported it
    print("labels:", ",".join(issue["labels"]) or "none")  # => tags
    print("comments:", issue["comments"])  # => discussion depth


main()  # => run once; a wrong NUMBER fails the assert loudly
