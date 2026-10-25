# => A skill call is a name plus validated inputs.
# => Missing inputs fail the brief, not the skill.
skill = "triage-inbox"  # => the skill to invoke, by name
# => skill is one plain string
needs = ["inbox_path", "rules"]  # => the skill's two required inputs
# => needs has 2 entries (type: list)
given = {"inbox_path": "inbox.md", "rules": "keep receipts"}  # => the brief's supplied inputs
# => given covers both needs
missing = [k for k in needs if k not in given]  # => list required inputs the brief forgot
# => missing is [] here
print("skill: " + skill)  # => Output: skill: triage-inbox
print("inputs: %d of %d" % (len(given), len(needs)))  # => Output: inputs: 2 of 2
invocation = skill + " " + given["inbox_path"]  # => build the invocation only when inputs are whole
# => invocation names skill and path
print("invoke: " + invocation)  # => Output: invoke: triage-inbox inbox.md
print("brief complete: " + str(len(missing) == 0))  # => Output: brief complete: True
