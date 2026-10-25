# => Offline simulator for a gh issue command over a fixture.
# => Fixture mirrors the gh issue list --json shape on 2026-10-20.
# => No gh binary and no network; reads issues.json only.
# => WHY fixtures: the same bytes replay forever, live state never does.
# => Counts here must match the live command output shape.
# => Every print mirrors one line a real gh call would emit.
# => Creation is derived, never performed: the fixture stays frozen.
# => Max-plus-one mirrors the live allocator so scripts can reference it.
import json  # => parse the frozen fixture file
from pathlib import Path  # => locate the fixture beside this script


HERE = Path(__file__).resolve().parent  # => unit directory itself
TITLE = "Nightly audit failed"  # => title the script files
LABELS = ["bug", "automated"]  # => labels attached at creation


def load():  # => read the frozen issue list
    text = (HERE / "issues.json").read_text(encoding="utf-8")  # => raw bytes
    return json.loads(text)  # => parsed fixture list


def next_number(issues):  # => first free number above the maximum
    # => Live gh never reuses numbers; the max-plus-one rule matches it.
    # => Sorting is unnecessary: max scans the whole list already.
    return max(i["number"] for i in issues) + 1  # => no reuse, like live


def main():  # => simulate creation against the frozen list
    issues = load()  # => recorded issues before creation
    number = next_number(issues)  # => the number live gh would assign
    # => The total line proves the creation without mutating anything.
    print("create:", TITLE)  # => Output: the filed title
    print("number:", number)  # => Output: the assigned number
    print("labels:", ",".join(LABELS))  # => Output: attached labels
    print("total:", len(issues) + 1)  # => count after creation


main()  # => run once; the fixture itself is never modified
