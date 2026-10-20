# Example 69: Project Overrides Agent Settings
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => Setting defaultModel ships in settings.json.
DEFAULTMODEL = "project-pinned"  # => pins defaultModel
# => Setting defaultThinkingLevel ships in settings.json.
DEFAULTTHINKINGLEVEL = "low"  # => pins defaultThinkingLevel
# => REQUIRED names keys a session cannot start without.
REQUIRED = [  # => the non-negotiable keys
    # => defaultModel is required because sessions fail without it.
    "defaultModel",  # => required key
]  # => the closed list
# => config maps every key to its live value.
config = {  # => the live settings under test
    # => Live value for defaultModel, used in the checks below.
    "defaultModel": DEFAULTMODEL,  # => defaultModel entry
    # => Live value for defaultThinkingLevel, used in the checks below.
    "defaultThinkingLevel": DEFAULTTHINKINGLEVEL,  # => defaultThinkingLevel entry
}  # => the closed map
missing = [k for k in REQUIRED if k not in config]  # => gaps
print("missing:", missing)  # => Output names what is absent
# => Reading back defaultModel proves the file was used.
print("defaultModel:", config["defaultModel"])  # => Output echoes it
