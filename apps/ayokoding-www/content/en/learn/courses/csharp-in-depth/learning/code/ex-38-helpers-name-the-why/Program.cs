// => Example 38: Helpers Name the Why.
// => Named helpers say what equality means: CheckEqual, CheckTrue, CheckFalse.
int passed = 0; // => counts the green checks the summary line reports

// => CheckEqual compares values and prints both sides on mismatch
void CheckEqual<T>(T expected, T actual, string name) // => generic: any comparable type
{
    // => EqualityComparer handles nulls and value types without special cases
    if (!EqualityComparer<T>.Default.Equals(expected, actual)) // => mismatch fails loudly
    {
        throw new Exception($"FAIL: {name}: expected {expected}, got {actual}"); // => both sides print
    }
    Console.WriteLine($"PASS: {name}"); // => the promise held: name the green
    passed++; // => count it for the summary line below
}

// => CheckTrue names boolean promises: the intent reads at the call site
void CheckTrue(bool condition, string name) // => thin wrapper with a clear name
{
    CheckEqual(true, condition, name); // => reuse: one comparison engine underneath
}

// => the checks below read like specifications, not like comparisons
CheckEqual(37000, new List<int> { 12000, 25000 }.Sum(), "total sums two lines"); // => Output: PASS
CheckTrue("rendang".Length > 3, "dish name is not empty"); // => Output: PASS

// => the summary closes the transcript with the exact green count
Console.WriteLine($"passed: {passed}"); // => Output: passed: 2
