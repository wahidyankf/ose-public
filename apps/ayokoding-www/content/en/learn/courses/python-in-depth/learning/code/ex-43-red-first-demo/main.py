# => Example 43: red proves the test, green proves the fix.
import unittest  # => assertions plus the result capture


def total(items):  # => the fixed implementation under test
    return sum(items)  # => WHY sum: the behavior the test demands


def broken_total(items):  # => WHY stub: stands in for the pre-fix code
    return 0  # => always wrong except for empty: must fail


case = unittest.TestCase()  # => assertions without a suite file
try:  # => WHY try: the red run is expected to fail
    case.assertEqual(broken_total([1, 2, 3]), 6)  # => fails: stub returns 0
    print("red missing")  # => skipped: the stub must not pass
except AssertionError:  # => the right failure: value mismatch, not import
    print("red: stub fails as expected")  # => Output: red proves detection
case.assertEqual(total([1, 2, 3]), 6)  # => WHY green: the fix after the red
print("green: fix passes")  # => Output: green: fix passes
