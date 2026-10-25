# => Four steps; step three needs a human yes.
# => Denial stops the tail, never rewrites the head.
steps = [("read", "auto"), ("exec", "auto"), ("browser", "ask"), ("message", "auto")]  # => each step pairs a tool with its policy
# => steps has 4 entries (type: list)
approved = True  # => fixture: the human approves the ask step
# => denial is modelled in a later example
done = []  # => done collects tools that actually ran
for tool, policy in steps:  # => walk the task in order
    if policy == "ask" and not approved:  # => an unapproved ask step halts the task
        print(tool + ": blocked")  # => this line never prints in the approved run
        # => blocked would print on denial
        break  # => halt: later steps never run after a denial
    done.append(tool)  # => record the executed tool
    # => done grows to four entries
    print(tool + ": ran")  # => Output: read: ran, exec: ran, browser: ran, message: ran
print("completed: %d of %d" % (len(done), len(steps)))  # => Output: completed: 4 of 4
print("gate respected: True")  # => the ask step ran only because approval existed
