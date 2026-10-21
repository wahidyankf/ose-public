# => Example 40: the protocol asserted, not just the output.
# => Spies observe the boundary: protocol, not just output.
# => Once_with collapses three checks: happened, once, with these args.
# => Ordered calls pin sequences: validate before save.
from unittest.mock import Mock, call  # => WHY call: ordered-call matching

notifier = Mock()  # => WHY Mock: records every interaction for review
notifier.send("ada", "shipped")  # => the single expected notification
notifier.send.assert_called_once_with(
    "ada", "shipped"
)  # => WHY once_with: one call, exact args
print("single send proven")  # => Output: single send proven
log = Mock()  # => a second spy for the sequence case
log.emit("start")  # => first event in order
log.emit("stop")  # => second event in order
log.emit.assert_has_calls(
    [call("start"), call("stop")]
)  # => WHY order: sequence pinned
print("order proven")  # => Output: order proven
