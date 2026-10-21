# => Example 44: skips and expected failures stay visible.
# => Gates read the runtime: platform facts, not assumptions.
# => Skips carry reasons: the suite reports truthfully, never silently.
import sys  # => WHY sys: platform gates read the runtime
import unittest  # => skip markers live on the TestCase


class TestGated(unittest.TestCase):  # => environment-aware test class
    @unittest.skipUnless(
        sys.version_info >= (3, 10), "needs modern python"
    )  # => WHY gate: honest skip
    def test_version_floor(self):  # => runs everywhere: the pinned toolchain clears it
        self.assertTrue(True)  # => trivial: the gate is the point

    @unittest.skip("demo: optional dependency absent")  # => WHY skip: reason attached
    def test_optional(self):  # => kept in suite, never silently dropped
        self.assertTrue(False)  # => never runs while skipped

    @unittest.expectedFailure  # => WHY xfail: known bug tracked, not hidden
    def test_known_bug(self):  # => documents the defect as a test
        self.assertEqual(1 + 1, 3)  # => fails as predicted: the marker holds


suite = unittest.TestLoader().loadTestsFromTestCase(TestGated)  # => collect all three
result = unittest.TestResult()  # => deterministic capture
suite.run(result)  # => run: one pass, one skip, one expected failure
print("run:", result.testsRun)  # => Output: run: 3, all accounted
print("skipped:", len(result.skipped))  # => Output: skipped: 1
print("expected:", len(result.expectedFailures))  # => Output: expected: 1
