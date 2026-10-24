# Example 58: Resume Keeps Your Tools
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => Pi enables read, bash, edit, write unless told otherwise.
# => Plain names replace defaults; + adds, - removes one.
defaults = ["read", "bash", "edit", "write"]  # => the startup tool list
# => Overrides are the +name/-name flags of this run.
overrides = ["+grep", "+find"]  # => frozen CLI flags
# => Adds join, removals filter out, removals win ties.
adds = [f[1:] for f in overrides if f.startswith("+")]  # => added
drops = [f[1:] for f in overrides if f.startswith("-")]  # => cut
active = sorted(set(defaults) | set(adds) - set(drops))  # => final
# => Print defaults, flags, and the resolved set.
print("defaults:", defaults)  # => Output shows the start
print("overrides:", overrides)  # => Output shows the flags
print("active:", active)  # => Output shows the result
