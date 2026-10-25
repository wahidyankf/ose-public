# Example 4: Action Outside Scope
# => The shim models scope as a path prefix: inside edits, outside asks.
# => Real Hermes scopes a session to one repo root the same way.
# => Freezing the scope here keeps the run deterministic and safe.
scope = "/repo/shop"
action = "/etc/hosts"
# => Scope is a prefix test: the action must sit under the root.
# => A prefix test is crude but predictable, which is the point.
# => Real tools add symlinks and case rules; the shim skips them openly.
inside = action.startswith(scope)
# => The verdict prints as a pair so the log stays greppable.
# => A False here would route the session to the approval flow.
print("inside-scope:", inside)  # => Output is the permit decision
# => The second line names the rule, so audits can cite it, not vibes.
print("rule: action must start with scope")
