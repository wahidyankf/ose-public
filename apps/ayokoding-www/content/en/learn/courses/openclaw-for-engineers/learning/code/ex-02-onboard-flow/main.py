# => Two onboarding paths, modelled as plain step lists.
# => The fixture keeps only the step names, never credentials.
guided = ["verify inference", "gateway", "workspace", "channels", "skills", "health"]  # => the six wizard stages from the CLI reference
# => guided has 6 steps (type: list)
baseline = ["baseline config", "workspace"]  # => the two scriptable steps the --baseline flag runs
# => baseline has 2 steps (type: list)
print("guided steps: %d" % len(guided))  # => Output: guided steps: 6
print("baseline steps: %d" % len(baseline))  # => Output: baseline steps: 2
shared = [s for s in baseline if s in guided]  # => keep baseline steps that the wizard also performs
# => shared is ['workspace'] (type: list)
print("shared: " + ", ".join(shared))  # => Output: shared: workspace
only_guided = [s for s in guided if s not in baseline]  # => steps the wizard adds beyond the baseline
# => four interactive stages remain
print("guided-only: " + ", ".join(only_guided))  # => Output: guided-only: verify inference, gateway, channels, skills, health
command = "openclaw setup --baseline"  # => the repeatable command this lesson recommends
# => command is a plain string, never executed here
print("rebuild with: " + command)  # => Output: rebuild with: openclaw setup --baseline
same_config = True  # => both paths converge on ~/.openclaw/openclaw.json
# => same_config records that documented guarantee
print("same config file: " + str(same_config))  # => Output: same config file: True
