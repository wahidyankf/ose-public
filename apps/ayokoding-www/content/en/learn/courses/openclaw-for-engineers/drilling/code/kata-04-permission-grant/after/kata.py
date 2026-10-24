# => Fixed: unknown tools ask first.
# => Deny still wins outright.
allow = ["read", "exec"]  # => same two allowed tools
# => facts did not change
deny = ["browser"]  # => same one denied tool
# => deny still wins first
requests = ["read", "browser", "cron"]  # => same three fixture requests
# => cron is still unknown
for tool in requests:  # => resolve each request
    verdict = "deny" if tool in deny else ("allow" if tool in allow else "ask")  # => FIX: deny, then allow, then ask
    # => cron now asks
    print(tool + ": " + verdict)  # => Output: read allow, browser deny, cron ask
