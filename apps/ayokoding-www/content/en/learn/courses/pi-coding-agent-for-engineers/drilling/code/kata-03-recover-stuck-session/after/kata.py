# Kata 3: Recover a Stuck Session
# => Repetition is the loop signal: interrupt, do not encourage.
# => The recovery is the smallest safe intervention available.
# => Recovery succeeds only when the kept list is whole.
symptom = "same edit proposed 3 times"  # => the loop signal
# => Double Escape parks the run and opens the tree view.
# => The tree view then shows exactly where the run stopped.
recovery = "interrupt, branch at last good turn"  # => the fix
# => Branching beats restarting when turns are worth keeping.
# => Saved work is what survives the intervention.
kept = [  # => preserved artifacts
    "src/cart/cart.py",  # => first survivor
    "tests/test_cart.py",  # => second survivor
]  # => the closed list
# => Two survivors is a complete recovery for this drill.
# => Each print below is one quotable fact.
print("symptom:", symptom)  # => Output names the symptom
print("recovery:", recovery)  # => Output names the fix
print("kept:", kept)  # => Output lists survivors
print("recovered:", len(kept) == 2)  # => Output gives verdict
