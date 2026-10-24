# Example 32: Cycle Through Favourite Models
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => Setting enabledModels ships in settings.json.
ENABLEDMODELS = "anthropic/*,ollama/*"  # => pins enabledModels
# => Setting defaultModel ships in settings.json.
DEFAULTMODEL = "auto"  # => pins defaultModel
# => REQUIRED names keys a session cannot start without.
REQUIRED = [  # => the non-negotiable keys
    # => enabledModels is required because sessions fail without it.
    "enabledModels",  # => required key
    # => defaultModel is required because sessions fail without it.
    "defaultModel",  # => required key
]  # => the closed list
# => config maps every key to its live value.
config = {  # => the live settings under test
    # => Live value for enabledModels, used in the checks below.
    "enabledModels": ENABLEDMODELS,  # => enabledModels entry
    # => Live value for defaultModel, used in the checks below.
    "defaultModel": DEFAULTMODEL,  # => defaultModel entry
}  # => the closed map
missing = [k for k in REQUIRED if k not in config]  # => gaps
print("missing:", missing)  # => Output names what is absent
# => Reading back enabledModels proves the file was used.
print("enabledModels:", config["enabledModels"])  # => Output echoes it
