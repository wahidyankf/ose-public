# => Kata 2 solution: the checks run under the standard runner.
import unittest  # => WHY runner: enforced on every run, not eyeballed


def total(items):  # => the same function, now guarded
    return sum(items)  # => plain sum, proven correct


class TestTotal(unittest.TestCase):  # => WHY class: the standard shape
    def test_several(self):  # => the first eyeball, made permanent
        self.assertEqual(total([1, 2, 3]), 6)  # => pinned: 6, not eyeballed

    def test_empty(self):  # => WHY second: the edge the eyeball skipped
        self.assertEqual(total([]), 0)  # => empty sums to zero


suite = unittest.TestLoader().loadTestsFromTestCase(TestTotal)  # => collected
result = unittest.TestResult()  # => deterministic capture, no timing
suite.run(result)  # => enforced: failures raise the exit
print("ran:", result.testsRun)  # => Output: ran: 2, both enforced
print("ok:", result.wasSuccessful())  # => Output: ok: True
