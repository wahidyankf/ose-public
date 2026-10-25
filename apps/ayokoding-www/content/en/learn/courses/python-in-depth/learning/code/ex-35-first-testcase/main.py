# => Example 35: the standard TestCase shape, zero installs.
# => Methods double as documentation: each names one behavior.
# => In-memory results keep the transcript free of timing lines.
import unittest  # => WHY stdlib: every interpreter runs these tests


def discount(price, rate):  # => the unit under test: pure arithmetic
    return price * (1 - rate)  # => WHY pure: deterministic, no fixtures needed


class TestDiscount(unittest.TestCase):  # => WHY class: shared fixture per method
    def test_full_price(self):  # => WHY test_: discovered by the runner
        self.assertEqual(discount(100, 0.0), 100)  # => no discount applied

    def test_half_off(self):  # => one behavior per method
        self.assertEqual(discount(100, 0.5), 50)  # => half rate halves price


suite = unittest.TestLoader().loadTestsFromTestCase(
    TestDiscount
)  # => collect the methods
result = unittest.TestResult()  # => WHY result: deterministic summary, no timing
suite.run(result)  # => execute against the in-memory result
print("ran:", result.testsRun)  # => Output: ran: 2, both methods executed
print("ok:", result.wasSuccessful())  # => Output: ok: True, no failures
