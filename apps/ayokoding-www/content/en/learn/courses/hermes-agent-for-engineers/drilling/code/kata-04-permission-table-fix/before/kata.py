# Kata starter: write the policy table, then compare with after/kata.py.
# => First match wins, so order the rows deliberately.
rules = []  # => TODO: write the allow/deny rows
# => Name the tool call the agent is attempting.
tool = ""  # => TODO: name the attempted tool
# => Closed by default: no match means deny.
decision = "deny"  # => closed default before any rule
# => Walk the table and keep the first matching decision.
# => Later rows never override the first hit for the same tool.
for name, verdict in rules:  # => scan rows in listed order
    # => The first hit freezes the answer for this attempt.
    if name == tool:  # => this row governs the attempt
        decision = verdict  # => first match wins
        break  # => stop scanning once decided
# => Print the verdict the approval flow would consume.
print("decision:", decision)  # => Output is allow or deny
