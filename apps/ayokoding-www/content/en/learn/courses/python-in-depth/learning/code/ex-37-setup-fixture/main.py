# => Example 37: fresh fixtures make tests order-independent.
import unittest  # => setUp runs before every method


class Cart:  # => the unit under test: a tiny mutable basket
    def __init__(self):  # => WHY init: empty state, filled per test
        self.items = []  # => mutable: must never be shared between tests

    def add(self, item):  # => append one item
        self.items.append(item)  # => mutation the fixture must isolate

    def count(self):  # => how many items held
        return len(self.items)  # => derived, never stored


class TestCart(unittest.TestCase):  # => one class, two independent methods
    def setUp(self):  # => WHY setUp: pristine cart per method
        self.cart = Cart()  # => rebuilt every time, never reused

    def test_add(self):  # => first behavior: adding works
        self.cart.add("lamp")  # => act on the fresh cart
        self.assertEqual(self.cart.count(), 1)  # => one item held

    def test_empty(self):  # => WHY second: proves no leak from test_add
        self.assertEqual(self.cart.count(), 0)  # => still empty: isolation held


suite = unittest.TestLoader().loadTestsFromTestCase(TestCart)  # => collect both
result = unittest.TestResult()  # => deterministic capture, no timing
suite.run(result)  # => run in definition order
print("ran:", result.testsRun)  # => Output: ran: 2
print("ok:", result.wasSuccessful())  # => Output: ok: True, order-independent
