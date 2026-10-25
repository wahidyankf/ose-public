# => Example 38: one method, a table of boundary cases.
# => Literal rows beat generated ones: the space here is small and reviewable.
# => The loop asserts uniformly: one assertion shape for all six.
# => Six rows cover the space: two per band edge, no middles wasted.
# => Edges over middles: off-by-one errors live at boundaries.
# => Rows over methods: coverage grows without boilerplate.
# => SubTest names the failing row: diagnostics stay precise.
# => Tables are specifications: the rows are the contract.
import unittest  # => subTest names each failing case


def rate(score):  # => grade boundaries: the edges under test
    if score >= 90:  # => top band first
        return "A"  # => excellent
    if score >= 60:  # => middle band next
        return "B"  # => passing
    return "F"  # => WHY last: everything below fails


cases = [
    (100, "A"),
    (90, "A"),
    (89, "B"),
    (60, "B"),
    (59, "F"),
    (0, "F"),
]  # => WHY table: edges explicit
case = unittest.TestCase()  # => assertions without a suite file
for score, want in cases:  # => every row runs the same assertion
    with case.subTest(score=score):  # => WHY subTest: failures name the row
        case.assertEqual(rate(score), want)  # => contract per boundary
print("cases:", len(cases))  # => Output: cases: 6, all boundaries covered
print("all pass")  # => Output: all pass
