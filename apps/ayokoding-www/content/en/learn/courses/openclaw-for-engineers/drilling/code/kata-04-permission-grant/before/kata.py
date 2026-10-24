# => Buggy: unknown tools run free.
# => The default is backwards.
allow = ["read", "exec"]  # => two explicitly allowed tools
deny = ["browser"]  # => one explicitly denied tool
requests = ["read", "browser", "cron"]  # => cron is unknown here
# => three fixture requests
for tool in requests:  # => resolve each request
    verdict = "allow" if tool not in deny else "deny"  # => BUG: anything not denied is allowed
    # => cron slips through
    print(tool + ": " + verdict)  # => Output: cron allowed, wrongly
