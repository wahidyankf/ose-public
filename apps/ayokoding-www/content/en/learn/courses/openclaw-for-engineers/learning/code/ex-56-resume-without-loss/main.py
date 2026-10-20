# => Resume bundle: goal, done, and the failure note.
# => All three must load before work continues.
bundle = {"goal": "tidy drafts", "done": ["read", "plan"], "failure": "exec looped x4"}  # => the three resume items in one dict
# => bundle has 3 entries (type: dict)
loaded = {}  # => loaded collects what the new session restores
for key in ["goal", "done", "failure"]:  # => restore each bundle item in order
    loaded[key] = bundle[key]  # => copy the item into the live session
    # => loaded grows to three items
    print("restored: " + key)  # => Output: three restored lines
print("items restored: %d of %d" % (len(loaded), len(bundle)))  # => Output: items restored: 3 of 3
knows_failure = "looped" in loaded["failure"]  # => the session must remember what failed
# => knows_failure is True
print("remembers failure: " + str(knows_failure))  # => Output: remembers failure: True
