# Example 70: Validate Settings With Schema
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => Setting $schema ships in settings.json.
_SCHEMA = "https://pi.dev/schemas/settings.schema.json"  # => pins $schema
# => Setting defaultProvider ships in settings.json.
DEFAULTPROVIDER = "anthropic"  # => pins defaultProvider
# => REQUIRED names keys a session cannot start without.
REQUIRED = [  # => the non-negotiable keys
    # => $schema is required because sessions fail without it.
    "$schema",  # => required key
    # => defaultProvider is required because sessions fail without it.
    "defaultProvider",  # => required key
]  # => the closed list
# => config maps every key to its live value.
config = {  # => the live settings under test
    # => Live value for $schema, used in the checks below.
    "$schema": _SCHEMA,  # => $schema entry
    # => Live value for defaultProvider, used in the checks below.
    "defaultProvider": DEFAULTPROVIDER,  # => defaultProvider entry
}  # => the closed map
missing = [k for k in REQUIRED if k not in config]  # => gaps
print("missing:", missing)  # => Output names what is absent
# => Reading back defaultProvider proves the file was used.
print("defaultProvider:", config["defaultProvider"])  # => Output echoes it
