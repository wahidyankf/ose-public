# => Four files, two subagents, one verified partition.
# => Exactly-once ownership is the whole contract.
files = ["a.md", "b.md", "c.md", "d.md"]  # => the four files the change touches
# => files has 4 entries (type: list)
plan = {"sub-1": ["a.md", "b.md"], "sub-2": ["c.md", "d.md"]}  # => each subagent owns two files
# => plan maps agent to files (type: dict)
owned = [f for agent in plan.values() for f in agent]  # => flatten every owned file into one list
# => owned has 4 entries (type: list)
gaps = [f for f in files if f not in owned]  # => files nobody owns would be silent gaps
# => gaps is [] here
dupes = len(owned) != len(set(owned))  # => duplicate ownership means merge conflicts
# => dupes is False here
print("files: %d owned: %d" % (len(files), len(owned)))  # => Output: files: 4 owned: 4
print("gaps: %d dupes: %s" % (len(gaps), dupes))  # => Output: gaps: 0 dupes: False
reports = ["sub-1: 2 files done", "sub-2: 2 files done"]  # => fixture completion reports
# => reports has 2 entries (type: list)
for r in reports:  # => merge the subagent reports in order
    print("report: " + r)  # => Output: two report lines
print("partition sound: " + str(len(gaps) == 0 and not dupes))  # => Output: partition sound: True
