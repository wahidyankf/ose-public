# Example 52: Choose the Share Destination
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => Setting sessionShareDestination ships in settings.json.
SESSIONSHAREDESTINATION = "gist"  # => pins sessionShareDestination
# => Setting defaultModel ships in settings.json.
DEFAULTMODEL = "auto"  # => pins defaultModel
# => REQUIRED names keys a session cannot start without.
REQUIRED = [  # => the non-negotiable keys
    # => sessionShareDestination is required because sessions fail without it.
    "sessionShareDestination",  # => required key
]  # => the closed list
# => config maps every key to its live value.
config = {  # => the live settings under test
    # => Live value for sessionShareDestination, used in the checks below.
    "sessionShareDestination": SESSIONSHAREDESTINATION,  # => sessionShareDestination entry
    # => Live value for defaultModel, used in the checks below.
    "defaultModel": DEFAULTMODEL,  # => defaultModel entry
}  # => the closed map
missing = [k for k in REQUIRED if k not in config]  # => gaps
print("missing:", missing)  # => Output names what is absent
# => Reading back sessionShareDestination proves the file was used.
print("destination:", config["sessionShareDestination"])  # => Output echoes it
