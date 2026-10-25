# => Example 36: rejections are contractual, so tests pin them.
import unittest  # => the standard runner, no installs


def withdraw(balance, amount):  # => reject overdrafts with a typed error
    if amount > balance:  # => WHY guard: the rejection condition
        raise ValueError("insufficient funds")  # => typed: callers handle this
    return balance - amount  # => success returns the new balance


case = unittest.TestCase()  # => WHY instance: assertions without a suite
with case.assertRaises(ValueError) as caught:  # => WHY block: multi-step safe
    withdraw(50, 500)  # => must raise: the contract under test
print("raised:", type(caught.exception).__name__)  # => Output: raised: ValueError
print("message:", caught.exception)  # => Output: message: insufficient funds
case.assertEqual(withdraw(50, 20), 30)  # => WHY symmetry: success pinned too
print("success pinned")  # => Output: success pinned
