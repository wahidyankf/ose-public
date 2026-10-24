# => Preview mode: record intentions, change nothing.
# => The file counter must read zero at the end.
steps = ["move drafts/*.md to archive/", "delete drafts/*.md", "write archive/index.md"]  # => a destructive three-step fixture plan
# => steps has 3 entries (type: list)
preview = True  # => preview mode flag: intentions only
# => nothing below mutates any state
would_do = []  # => would_do collects the previewed actions
changed = 0  # => changed counts real mutations, must stay zero
for step in steps:  # => walk the plan without executing it
    if preview:  # => preview branch records instead of doing
        would_do.append(step)  # => the intention joins the preview list
        # => would_do reaches 3 entries
        print("would: " + step)  # => Output: three would lines
    else:  # => the real branch is never taken in this run
        changed += 1  # => a real mutation would count here
        # => changed stays 0
print("previewed: %d" % len(would_do))  # => Output: previewed: 3
print("files changed: %d" % changed)  # => Output: files changed: 0
