# => Three files proposed; one cites an untouched file.
# => Coherence fails closed: unknown references escalate.
proposal = {"notes.md": 5, "index.md": 8, "deploy.sh": 40}  # => changed-line counts per proposed file
# => proposal covers three files (type: dict)
repo = ["notes.md", "index.md", "deploy.sh", "config.yml"]  # => files already in the repository
# => config.yml exists; summary.md does not
refs = {"notes.md": ["index.md"], "index.md": [], "deploy.sh": ["summary.md"]}  # => cross-file references each proposal makes
# => deploy.sh cites missing summary.md
LIMIT = 10  # => per-file auto-approve ceiling, as in Example 11
approved = []  # => approved collects files passing both checks
for name, changed in proposal.items():  # => judge each proposed file in turn
    size_ok = changed <= LIMIT  # => small files pass the size rule
    # => notes.md and index.md pass; deploy.sh fails
    coherent = all(r in proposal or r in repo for r in refs[name])  # => every reference must exist somewhere
    # => deploy.sh cites absent summary.md
    ok = size_ok and coherent  # => both gates must pass together
    # => notes.md and index.md are approved
    print(name + ": size_ok=%s coherent=%s" % (size_ok, coherent))  # => Output: three judgement lines
    if ok:  # => only doubly-passing files are approved
        approved.append(name)  # => approved becomes notes.md and index.md
print("approved: " + ", ".join(approved))  # => Output: approved: notes.md, index.md
print("escalated: %d" % (len(proposal) - len(approved)))  # => Output: escalated: 1
