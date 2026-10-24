# Example 25: Permission Review Checklist
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => Setting defaultTools ships in settings.json.
DEFAULTTOOLS = "read,edit,write"  # => pins defaultTools
# => Setting defaultProjectTrust ships in settings.json.
DEFAULTPROJECTTRUST = "ask"  # => pins defaultProjectTrust
# => Setting externalEditor ships in settings.json.
EXTERNALEDITOR = "vi"  # => pins externalEditor
# => REQUIRED names keys a session cannot start without.
REQUIRED = [  # => the non-negotiable keys
    # => defaultTools is required because sessions fail without it.
    "defaultTools",  # => required key
    # => defaultProjectTrust is required because sessions fail without it.
    "defaultProjectTrust",  # => required key
]  # => the closed list
# => config maps every key to its live value.
config = {  # => the live settings under test
    # => Live value for defaultTools, used in the checks below.
    "defaultTools": DEFAULTTOOLS,  # => defaultTools entry
    # => Live value for defaultProjectTrust, used in the checks below.
    "defaultProjectTrust": DEFAULTPROJECTTRUST,  # => defaultProjectTrust entry
    # => Live value for externalEditor, used in the checks below.
    "externalEditor": EXTERNALEDITOR,  # => externalEditor entry
}  # => the closed map
missing = [k for k in REQUIRED if k not in config]  # => gaps
print("missing:", missing)  # => Output names what is absent
# => Reading back defaultTools proves the file was used.
print("defaultTools:", config["defaultTools"])  # => Output echoes it
# => Reading back defaultProjectTrust proves the file was used.
print("trust:", config["defaultProjectTrust"])  # => Output echoes it
