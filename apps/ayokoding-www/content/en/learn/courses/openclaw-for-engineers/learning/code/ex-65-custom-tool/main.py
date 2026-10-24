# => One custom tool, registered with three fields.
# => Calls outside the policy are refused.
tool = {"name": "wordcount", "binary": "wc"}  # => tool name plus the binary it wraps
# => tool starts with two fields
tool["args"] = ["-w"]  # => the only permitted argument flag
# => args bound the call shape
tool["policy"] = "allow"  # => default permission for in-policy calls
# => policy completes the registration
print("tool: " + tool["name"] + " wraps " + tool["binary"])  # => Output: tool: wordcount wraps wc
calls = [("wc", ["-w"]), ("wc", ["-w", "a.md", ";", "rm"])]  # => one clean call, one smuggling chaining
# => calls has 2 entries (type: list)
allowed = 0  # => allowed counts policy-passing calls
for binary, args in calls:  # => screen each call against the registration
    ok = (binary == tool["binary"]) and (";" not in args)  # => right binary and no chaining wins
    # => first passes, second fails
    print("call ok: " + str(ok))  # => Output: call ok: True, then False
    allowed += 1 if ok else 0  # => count only permitted calls
    # => allowed reaches 1
print("permitted: %d of %d" % (allowed, len(calls)))  # => Output: permitted: 1 of 2
