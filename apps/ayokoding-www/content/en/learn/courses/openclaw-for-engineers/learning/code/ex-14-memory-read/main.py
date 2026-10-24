# => A tiny memory store: dict write, dict read.
# => Misses return None instead of inventing facts.
memory = {}  # => the agent's persistent store starts empty
memory["editor"] = "nvim"  # => store the first fixture fact
# => memory now holds one fact
memory["shell"] = "bash"  # => store the second fixture fact
# => memory now holds two facts
print("stored: %d" % len(memory))  # => Output: stored: 2
print("editor: " + str(memory.get("editor")))  # => get() returns the stored value
# => Output: editor: nvim
print("shell: " + str(memory.get("shell")))  # => Output: shell: bash
missing = memory.get("timezone")  # => timezone was never stored
# => missing is None (type: NoneType)
print("timezone: " + str(missing))  # => Output: timezone: None
honest = missing is None  # => an explicit miss beats an invented answer
# => honest is True
print("miss is explicit: " + str(honest))  # => Output: miss is explicit: True
