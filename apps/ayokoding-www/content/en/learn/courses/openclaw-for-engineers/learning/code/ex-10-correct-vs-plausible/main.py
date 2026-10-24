# => Two steps, one honest and one plausible-but-wrong.
# => The workspace listing is the ground truth.
workspace = ["inbox.md", "drafts/a.md"]  # => the only files the agent may legitimately cite
# => workspace has 2 entries (type: list)
steps = [{"tool": "read", "file": "inbox.md"}, {"tool": "read", "file": "summary.md"}]  # => step two cites a file that does not exist
# => steps has 2 entries (type: list)
verdicts = []  # => verdicts collects True or False per step
for step in steps:  # => judge each step against the listing
    ok = step["file"] in workspace  # => True only for files really present
    # => inbox.md passes, summary.md fails
    verdicts.append(ok)  # => record this step's verdict
    # => verdicts becomes [True, False]
    print(step["file"] + ": " + str(ok))  # => Output: inbox.md: True, then summary.md: False
print("wrong steps: %d" % verdicts.count(False))  # => Output: wrong steps: 1
trust = all(verdicts)  # => the trace is trustworthy only when every step checks out
# => trust is False here
print("trace trustworthy: " + str(trust))  # => Output: trace trustworthy: False
