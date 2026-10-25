# => Example 2: for-else reports a search with no flag variable.
roster = ["ada", "grace", "margaret"]  # => the data the search scans
wanted = "grace"  # => the name this run looks for: present case
for name in roster:  # => scan each entry in order
    if name == wanted:  # => the match test for this iteration
        print("found:", name)  # => Output: found: grace, break exits here
        break  # => WHY break: match ends the search, else is skipped
else:  # => WHY else: runs only when no break fired, absence proven
    print("missing:", wanted)  # => skipped this run: grace was present
wanted = "alan"  # => a name the roster does not contain: absent case
for name in roster:  # => the same loop shape, different outcome
    if name == wanted:  # => never true this run
        print("found:", name)  # => unreachable: alan is absent
        break  # => never fires, so the else below must run
else:  # => absence proven by exhausting the roster
    print("missing:", wanted)  # => Output: missing: alan, no flag needed
