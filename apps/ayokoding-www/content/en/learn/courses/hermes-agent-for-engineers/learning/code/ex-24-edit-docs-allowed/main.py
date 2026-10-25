# Example 24: Edit Docs Allowed
# => The shim models permissions as an ordered allow/deny table.
# => First match wins, exactly like Hermes evaluates its own rules.
# => Order matters more than count: broad allows go last, not first.
rules = [
    ("edit:docs", "allow"),
    ("edit", "ask"),
    ("shell", "deny"),
]  # => the policy table, read top to bottom
tool = "edit:docs"  # => the tool call the agent is attempting
# => Walk the table and keep the first matching decision.
# => No match means deny: closed by default beats open by accident.
decision = "deny"  # => closed default before any rule matches
for name, verdict in rules:  # => scan rules in listed order
    # => Compare this row against the attempted tool call.
    # => The first hit freezes the answer; later rows are ignored.
    if name == tool:  # => this row governs the attempt
        decision = verdict  # => first match wins, loop stops caring
        break  # => stop scanning once the answer is fixed
# => Print the decision plus the tool so logs stay attributable.
print("tool:", tool)  # => Output names what was attempted
# => The verdict line is what the approval flow would consume.
print("decision:", decision)  # => Output is allow or deny
