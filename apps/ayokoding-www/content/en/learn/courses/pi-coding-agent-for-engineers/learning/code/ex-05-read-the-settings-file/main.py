# Example 5: Read the Settings File
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => Setting defaultProvider ships in settings.json.
DEFAULTPROVIDER = "anthropic"  # => pins defaultProvider
# => Setting defaultModel ships in settings.json.
DEFAULTMODEL = "auto"  # => pins defaultModel
# => Setting defaultThinkingLevel ships in settings.json.
DEFAULTTHINKINGLEVEL = "medium"  # => pins defaultThinkingLevel
# => REQUIRED names keys a session cannot start without.
REQUIRED = [  # => the non-negotiable keys
    # => defaultProvider is required because sessions fail without it.
    "defaultProvider",  # => required key
    # => defaultModel is required because sessions fail without it.
    "defaultModel",  # => required key
    # => defaultThinkingLevel is required because sessions fail without it.
    "defaultThinkingLevel",  # => required key
]  # => the closed list
# => config maps every key to its live value.
config = {  # => the live settings under test
    # => Live value for defaultProvider, used in the checks below.
    "defaultProvider": DEFAULTPROVIDER,  # => defaultProvider entry
    # => Live value for defaultModel, used in the checks below.
    "defaultModel": DEFAULTMODEL,  # => defaultModel entry
    # => Live value for defaultThinkingLevel, used in the checks below.
    "defaultThinkingLevel": DEFAULTTHINKINGLEVEL,  # => defaultThinkingLevel entry
}  # => the closed map
missing = [k for k in REQUIRED if k not in config]  # => gaps
print("missing:", missing)  # => Output names what is absent
# => Reading back defaultProvider proves the file was used.
print("defaultProvider:", config["defaultProvider"])  # => Output echoes it
# => Reading back defaultThinkingLevel proves the file was used.
print("thinking:", config["defaultThinkingLevel"])  # => Output echoes it
