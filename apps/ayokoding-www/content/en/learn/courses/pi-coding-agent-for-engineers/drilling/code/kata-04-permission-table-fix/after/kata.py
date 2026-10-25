# Kata 4: Fix the Permission Table
# => Review with reading tools first; writers wait for the fix.
# => Plain names replace defaults; minus removes one tool.
# => An enabled edit tool during review is a loaded action.
defaults = ["read", "bash", "edit", "write"]  # => startup list
# => Review drops shell and writers: reading cannot change state.
overrides = ["-bash", "-edit", "-write"]  # => frozen minus flags
# => Rebuild plainly: adds join, removals filter out.
adds = [f[1:] for f in overrides if f.startswith("+")]  # => added
drops = [f[1:] for f in overrides if f.startswith("-")]  # => cut
# => Read alone survives: the review set ends up read-only.
active = sorted(set(defaults) | set(adds) - set(drops))  # => final
# => Print defaults, flags, and the resolved set.
print("defaults:", defaults)  # => Output shows the start
print("overrides:", overrides)  # => Output shows the flags
print("active:", active)  # => Output shows the result
