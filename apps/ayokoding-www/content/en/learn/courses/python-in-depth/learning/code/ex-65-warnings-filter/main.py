# => Example 65: warnings escalated, recorded, and asserted.
# => Record mode turns warnings into data tests can assert.
# => Error mode turns warnings into tracebacks at the offending line.
import warnings  # => WHY warnings: the future speaks through this module

with warnings.catch_warnings(
    record=True
) as caught:  # => WHY record: assert on warnings
    warnings.simplefilter("always")  # => show every warning inside this block
    warnings.warn("old api", DeprecationWarning, stacklevel=2)  # => the notice itself
print(len(caught))  # => Output: 1, exactly one warning recorded
print(caught[0].category.__name__)  # => Output: DeprecationWarning, typed
print(str(caught[0].message))  # => Output: old api, content pinned
with warnings.catch_warnings():  # => a second block for the error mode
    warnings.simplefilter("error")  # => WHY error: warnings become raisers
    try:  # => the escalation demonstrated safely
        warnings.warn("loud", UserWarning)  # => raises under the error filter
    except UserWarning:  # => caught: escalation proven without crashing
        print("escalated")  # => Output: escalated
