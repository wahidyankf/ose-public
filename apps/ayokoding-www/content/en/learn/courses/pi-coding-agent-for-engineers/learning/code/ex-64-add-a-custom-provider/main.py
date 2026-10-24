# Example 64: Add a Custom Provider
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => Setting providerId ships in settings.json.
PROVIDERID = "shop-llm"  # => pins providerId
# => Setting baseUrl ships in settings.json.
BASEURL = "https://llm.shop/v1"  # => pins baseUrl
# => Setting auth ships in settings.json.
AUTH = "api-key"  # => pins auth
# => REQUIRED names keys a session cannot start without.
REQUIRED = [  # => the non-negotiable keys
    # => providerId is required because sessions fail without it.
    "providerId",  # => required key
    # => baseUrl is required because sessions fail without it.
    "baseUrl",  # => required key
    # => auth is required because sessions fail without it.
    "auth",  # => required key
]  # => the closed list
# => config maps every key to its live value.
config = {  # => the live settings under test
    # => Live value for providerId, used in the checks below.
    "providerId": PROVIDERID,  # => providerId entry
    # => Live value for baseUrl, used in the checks below.
    "baseUrl": BASEURL,  # => baseUrl entry
    # => Live value for auth, used in the checks below.
    "auth": AUTH,  # => auth entry
}  # => the closed map
missing = [k for k in REQUIRED if k not in config]  # => gaps
print("missing:", missing)  # => Output names what is absent
# => Reading back providerId proves the file was used.
print("providerId:", config["providerId"])  # => Output echoes it
# => Reading back baseUrl proves the file was used.
print("baseUrl:", config["baseUrl"])  # => Output echoes it
