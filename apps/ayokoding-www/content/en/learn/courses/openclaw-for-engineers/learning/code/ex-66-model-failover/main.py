# => Three providers, two retries each, first wins.
# => Bounds keep failover from becoming a loop.
chain = ["primary", "fallback-a", "fallback-b"]  # => provider chain in preference order
# => chain has 3 entries (type: list)
up = {"primary": False, "fallback-a": False, "fallback-b": True}  # => fixture: only the last provider answers
# => two outages precede the success
RETRIES = 2  # => at most two attempts per provider
# => bounds turn outage into degradation
attempts = 0  # => attempts counts every try
winner = None  # => winner names the provider that answers
for name in chain:  # => walk the chain in preference order
    for _ in range(RETRIES):  # => bounded tries per provider
        attempts += 1  # => count this attempt
        # => attempts reaches 5
        if up[name]:  # => the fixture decides who answers
            winner = name  # => first answering provider wins
            # => winner is fallback-b
            break  # => stop retrying a live provider
    if winner is not None:  # => stop walking once someone answers
        break  # => later providers stay untouched
print("attempts: %d" % attempts)  # => Output: attempts: 5
print("winner: " + str(winner))  # => Output: winner: fallback-b
