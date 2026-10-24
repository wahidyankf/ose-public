# => Channel trust: group membership caps allowed actions.
# => Public channels stay read-only by construction.
groups = {"team-chat": "internal", "announce": "public", "ops": "admin"}  # => three fixture channels, three trust levels
# => groups maps channel to group (type: dict)
powers = {"public": ["read"], "internal": ["read", "write"], "admin": ["read", "write", "exec"]}  # => actions grow with trust, read-only at the bottom
# => powers maps group to actions (type: dict)
for channel in ["team-chat", "announce", "ops"]:  # => resolve each channel in a fixed order
    group = groups[channel]  # => look up the channel's access group
    # => group is internal, public, admin
    print(channel + " [" + group + "]: " + ", ".join(powers[group]))  # => Output: three channel capability lines
public_caps = powers[groups["announce"]]  # => the public channel's capabilities
# => public_caps is ['read']
print("public can exec: " + str("exec" in public_caps))  # => Output: public can exec: False
