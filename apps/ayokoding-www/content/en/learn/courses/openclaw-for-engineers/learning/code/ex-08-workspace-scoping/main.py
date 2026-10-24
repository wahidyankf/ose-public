# => Workspace fence: pure prefix logic on fixture paths.
# => No filesystem access happens; strings are enough.
root = "/srv/notes"  # => the workspace root from the config file
# => root is the only trusted prefix
paths = ["inbox.md", "../secrets.env", "drafts/a.md", "/etc/hosts"]  # => four candidate paths, two hostile
# => paths has 4 entries (type: list)
resolved = [(p if p.startswith("/") else root + "/" + p) for p in paths]  # => absolute candidates stay literal, relative ones join the root
# => /etc/hosts is therefore tested as itself
inside = [p for p in resolved if p.startswith(root + "/")]  # => keep only paths under the root prefix
# => /etc/hosts fails the prefix test
clean = [p for p in inside if "/../" not in p]  # => drop traversals that smuggle .. segments
# => ../secrets.env is rejected here
print("candidates: %d" % len(paths))  # => Output: candidates: 4
print("accepted: %d" % len(clean))  # => Output: accepted: 2
for p in clean:  # => show the survivors in candidate order
    print("ok: " + p)  # => Output: ok: /srv/notes/inbox.md, then drafts/a.md
print("fence holds: " + str(len(clean) == 2))  # => Output: fence holds: True
