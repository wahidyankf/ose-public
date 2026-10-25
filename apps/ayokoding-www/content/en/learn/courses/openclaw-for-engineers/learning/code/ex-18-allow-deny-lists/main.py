# => Policy resolution: deny wins, then allow, then ask.
# => Unknown tools are never silently permitted.
allow = ["read", "exec", "message"]  # => tools that run without asking
# => allow has 3 entries (type: list)
deny = ["browser", "exec-admin"]  # => tools that never run, whatever the ask
# => deny has 2 entries (type: list)
requests = ["read", "exec", "browser", "cron", "exec-admin", "message"]  # => six fixture requests to judge
# => requests has 6 entries (type: list)
for tool in requests:  # => resolve each request against the policy
    if tool in deny:  # => deny list is checked first and wins
        verdict = "deny"  # => denied tools stop here, no appeal
        # => verdict is deny for browser, exec-admin
    elif tool in allow:  # => allowed tools run untouched
        verdict = "allow"  # => verdict is allow for read, exec, message
    else:  # => unknown tools fall through to human review
        verdict = "ask"  # => verdict is ask for cron, the unknown tool
    print(tool + ": " + verdict)  # => Output: six verdict lines in request order
print("policy judged: %d" % len(requests))  # => Output: policy judged: 6
