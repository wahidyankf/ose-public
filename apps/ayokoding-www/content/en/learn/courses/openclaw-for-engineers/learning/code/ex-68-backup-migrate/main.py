# => Backup packs config plus memory; restore verifies.
# => Lossless transit is checked, not hoped.
source = {"config": {"model": "primary"}, "memory": {"editor": "nvim", "shell": "bash"}}  # => the live machine's bundle
# => source holds config and memory (type: dict)
backup = {"config": dict(source["config"]), "memory": dict(source["memory"])}  # => deep-copy both halves into the backup
# => copies, so later edits cannot alias
print("backed up keys: %d" % (len(backup["config"]) + len(backup["memory"])))  # => Output: backed up keys: 3
target = {}  # => the fresh machine starts empty
target["config"] = dict(backup["config"])  # => restore the config half first
# => target gains config
target["memory"] = dict(backup["memory"])  # => restore the memory half second
# => target is whole again
whole = target == source  # => equality proves lossless transit
# => whole is True
print("restored keys: %d" % (len(target["config"]) + len(target["memory"])))  # => Output: restored keys: 3
print("migration lossless: " + str(whole))  # => Output: migration lossless: True
