# => Example 10: attempt the lookup; handle absence as data.
cache = {"ada": 98}  # => small mapping with one present key
try:  # => WHY attempt: the lookup itself is the check
    print("hit:", cache["ada"])  # => Output: hit: 98, no pre-test needed
except KeyError:  # => absence is an expected outcome, handled here
    print("miss")  # => skipped: ada is present
try:  # => same shape for the absent key
    print("hit:", cache["grace"])  # => raises: grace was never stored
except KeyError:  # => the documented exception for a missing key
    print("miss: grace")  # => Output: miss: grace, handled not guarded
if "grace" in cache:  # => the LBYL form: check first, then act
    print("hit:", cache["grace"])  # => skipped: check failed
print("lbyl says miss")  # => Output: lbyl says miss, two lines did one job
