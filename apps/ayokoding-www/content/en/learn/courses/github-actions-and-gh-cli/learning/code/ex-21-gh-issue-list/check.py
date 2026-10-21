# => Offline simulator for a gh issue command over a fixture.
# => Fixture mirrors the gh issue list --json shape on 2026-10-20.
# => No gh binary and no network; reads issues.json only.
# => WHY fixtures: the same bytes replay forever, live state never does.
# => Counts here must match the live command output shape.
# => Every print mirrors one line a real gh call would emit.
import json  # => parse the frozen fixture file
from pathlib import Path  # => locate the fixture beside this script


HERE = Path(__file__).resolve().parent  # => unit directory itself
STATE = "open"  # => which state this listing filters to


def load():  # => read the frozen issue list
    text = (HERE / "issues.json").read_text(encoding="utf-8")  # => raw bytes
    return json.loads(text)  # => parsed fixture list


def main():  # => list matching issues oldest-first, like gh does
    issues = load()  # => every recorded issue, open and closed
    shown = [i for i in issues if i["state"] == STATE]  # => filter rows
    shown.sort(key=lambda i: i["number"])  # => oldest number first
    for issue in shown:  # => one line per issue, stable order
        tags = ",".join(issue["labels"]) or "-"  # => labels or a dash
        print(issue["number"], issue["title"] + " [" + tags + "]")  # => row
    print("shown:", len(shown), "of", len(issues))  # => filter summary


main()  # => run once; change STATE to replay another listing
