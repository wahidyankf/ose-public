# => Four post-mortem fields from one stuck loop.
# => Prevention must name a concrete check.
notes = {}  # => the post-mortem starts empty
notes["failure"] = "exec looped x4"  # => what happened, in one line
# => failure names the stuck loop
notes["cause"] = "missing file never checked"  # => why it happened, one line
# => cause points at the unchecked assumption
notes["recovery"] = "interrupted, resumed from checkpoint"  # => what fixed it, one line
# => recovery cites Example 55
notes["prevention"] = "check file exists before exec retries"  # => the future check, concrete and named
# => prevention is actionable
fields = ["failure", "cause", "recovery", "prevention"]  # => the four required post-mortem fields
for f in fields:  # => show the post-mortem in canonical order
    print(f + ": " + notes[f])  # => Output: four post-mortem lines
concrete = "check" in notes["prevention"]  # => prevention must name an actual check
# => concrete is True
print("prevention is concrete: " + str(concrete))  # => Output: prevention is concrete: True
