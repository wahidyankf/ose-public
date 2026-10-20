# => Exec policy: allowlisted binary, no chaining operators.
# => Five fixture commands, two must fail.
allow = ["ls", "cat", "wc"]  # => the only binaries exec may launch
# => allow has 3 entries (type: list)
cmds = ["ls drafts", "cat inbox.md", "rm notes.md", "wc -w inbox.md", "cat a.md && cat b.md"]  # => rm is foreign; the last chains two cats
# => cmds has 5 entries (type: list)
passed = 0  # => passed counts commands the policy permits
for cmd in cmds:  # => screen each command the same way
    binary = cmd.split()[0]  # => first token names the binary
    # => binary is ls, cat, rm, wc, cat
    chained = (";" in cmd) or ("&&" in cmd) or ("||" in cmd)  # => any chaining operator fails the screen
    # => only the last command chains
    ok = (binary in allow) and (not chained)  # => both rules must hold at once
    # => rm fails rule one, the chain fails rule two
    print(cmd + " => " + str(ok))  # => Output: five verdict lines
    passed += 1 if ok else 0  # => count only the permitted commands
    # => passed reaches 3
print("permitted: %d of %d" % (passed, len(cmds)))  # => Output: permitted: 3 of 5
