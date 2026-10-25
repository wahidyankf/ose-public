# Example 65: Config Layering
# => This file is the fixture shim: it pretends to be Hermes Agent
# => reading its settings file, without touching your real machine.
# => Every value below is fake but plausible, frozen for determinism.
# => Hermes keeps these settings in a config file you own and can diff.
config = {  # => one dict stands in for the whole settings file
    "model": "hermes-2-large",  # => which model answers this session
    "sandbox": "ask",  # => ask | allowlist | lockdown
    "scope": "/repo/shop",  # => repo root the agent may touch
    "plugin.test-bot.quarantine": "true",  # => one extra knob this example turns
}
# => REQUIRED names the keys a session cannot start without.
# => The real tool fails fast here instead of guessing mid-task.
REQUIRED = ["model", "sandbox", "scope"]  # => the non-negotiable keys
# => A missing key is a set difference, computed in one line.
# => An empty result means complete; anything else names the gaps.
missing = [k for k in REQUIRED if k not in config]  # => list the gaps
# => Hermes refuses to start with gaps: fail before any file changes.
# => Printing the raw list keeps the check honest and greppable.
print("missing:", missing)  # => Output names exactly what is absent
# => The sandbox value decides whether each write needs approval.
# => Reading it back proves the shim used the file, not a default.
print("sandbox:", config["sandbox"])  # => Output echoes the mode
# => The extra knob shows settings compose: base plus one override.
print(
    "plugin.test-bot.quarantine:", config["plugin.test-bot.quarantine"]
)  # => Output echoes the extra knob
