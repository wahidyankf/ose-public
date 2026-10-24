# => Provider resolution: first reachable entry wins.
# => Reachability is fixture data, never a live network probe.
providers = ["anthropic/claude", "openai/gpt", "local/ollama"]  # => preference order, strongest first
# => providers has 3 entries (type: list)
reachable = {"anthropic/claude": False, "openai/gpt": True, "local/ollama": True}  # => fixture: the primary is down, both fallbacks are up
# => dict lookup is O(1) per provider
chosen = None  # => chosen stays None until a reachable provider is found
for name in providers:  # => walk providers in preference order
    print("trying " + name)  # => Output: trying anthropic/claude, then trying openai/gpt
    if reachable[name]:  # => the fixture decides, not the network
        chosen = name  # => first reachable provider claims the slot
        break  # => stop at the first win; later entries stay backups
print("chosen: " + str(chosen))  # => Output: chosen: openai/gpt
skipped = providers.index(chosen)  # => index() counts how many preferred entries failed
# => skipped is 1, the downed primary
print("fallbacks used: %d" % skipped)  # => Output: fallbacks used: 1
print("outage survived: " + str(chosen is not None))  # => Output: outage survived: True
