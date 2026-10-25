# => One change ask, two channels, opposite verdicts.
# => Trust travels with the channel, not the text.
ask = "restart gateway"  # => the requested change, well-formed
# => ask is one plain string
power = {"announce": ["read"], "ops": ["read", "write", "exec"]}  # => per-channel action power from Example 22
# => ops may exec, announce may only read
for channel in ["announce", "ops"]:  # => try the same ask from each channel
    ok = "exec" in power[channel]  # => restart needs exec power
    # => announce fails, ops passes
    print(channel + ": " + ("accepted" if ok else "refused"))  # => Output: announce: refused, ops: accepted
print("ask: " + ask)  # => Output: ask: restart gateway
print("public refused: " + str("exec" not in power["announce"]))  # => Output: public refused: True
