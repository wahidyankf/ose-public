# => A two-file diff proposal, modelled as added/removed counts.
# => Line bodies are omitted; sizes drive the decision.
proposal = [{"file": "notes.md", "added": 4, "removed": 1}]  # => a small, focused first file
proposal.append({"file": "index.md", "added": 30, "removed": 25})  # => a large rewrite hiding in the same proposal
# => proposal now covers two files
LIMIT = 10  # => LIMIT caps auto-approvable changed lines per file
# => ten lines fit one screen of careful review
approved = []  # => approved collects files that pass the size rule
for change in proposal:  # => judge each file on its own size
    total = change["added"] + change["removed"]  # => total changed lines for this file
    # => 5 for notes.md, 55 for index.md
    ok = total <= LIMIT  # => small proposals pass, rewrites do not
    # => notes.md passes, index.md fails
    print(change["file"] + ": %d changed, ok=%s" % (total, ok))  # => Output: notes.md: 5 changed, ok=True, then index.md
    if ok:  # => only passing files join the approved list
        approved.append(change["file"])  # => notes.md is approved; index.md is escalated
print("approved: " + ", ".join(approved))  # => Output: approved: notes.md
print("escalated: %d" % (len(proposal) - len(approved)))  # => Output: escalated: 1
