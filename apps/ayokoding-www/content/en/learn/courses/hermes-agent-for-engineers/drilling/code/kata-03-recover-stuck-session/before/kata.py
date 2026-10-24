# Kata starter: record the session history, then compare with after/kata.py.
# => History is oldest-first so repeats are countable.
actions = []  # => TODO: paste the session history
# => Name the action you suspect is repeating without progress.
stuck_on = ""  # => TODO: name the suspect action
# => Count repeats of the suspect action across the history.
repeats = sum(1 for a in actions if a == stuck_on)  # => repeat count
# => Print the evidence before declaring the session stuck.
print("repeats:", repeats)  # => Output is the evidence
