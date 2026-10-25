# => Fixture shim delegating bounded slices to subagents.
# => Target release 2.1.304, checked against vendor docs on 2026-10-20.
# => Slices are fixed data; no agent is spawned here.
# => Real behaviour may differ; confirm with claude --help.

# => WHY bounds: explicit files keep slices from wandering.
# => Reports compress exploration into findings.
# => Main sessions keep judgement; slices bring facts.
# => Handoffs need summaries, not raw transcripts.

SLICES = [
    ("tests", ["test_login.py"]),
    ("docs", ["README.md"]),
]  # => two bounded slices


def delegate(slices):  # => hand each slice out with its file bounds
    return [
        {"job": job, "files": files} for job, files in slices
    ]  # => one assignment each


def collect(assignments):  # => collect one report line per assignment
    return [
        "%s: done in %s" % (a["job"], ", ".join(a["files"])) for a in assignments
    ]  # => two lines


def main():  # => delegate two slices and collect their reports
    assignments = delegate(SLICES)  # => two bounded assignments
    print("assigned:", len(assignments))  # => Output: assigned: 2
    for line in collect(assignments):  # => print each report line
        print(line)  # => Output: the two completion lines


main()  # => run once; bound slices by files, collect by report
