// => Example 36: Failing First Proves Check.
// => A check that never fails proves nothing: watch it fail, then fix the code.
// => the transcript below shows RED first, then GREEN after the one-line fix
try // => run the old code against the check: it must fail loudly
{
    Check(ReverseOld("rice") == "ecir", "reverse flips rice"); // => old code drops a letter
}
catch (Exception ex) // => RED: the catch prints the failure instead of crashing
{
    Console.WriteLine($"RED: {ex.Message}"); // => Output: RED: FAIL: reverse flips rice
}

// => the fix ships: the same check now runs against corrected code
Check(Reverse("rice") == "ecir", "reverse flips rice"); // => Output: PASS: reverse flips rice

// => one helper serves both runs: fail loudly, pass explicitly
void Check(bool condition, string name) // => local function shared by RED and GREEN
{
    // => false throws with the check name: the transcript shows what broke
    if (!condition) // => the old reverse trips this branch above
    {
        throw new Exception($"FAIL: {name}"); // => FAIL text becomes the RED line
    }
    Console.WriteLine($"PASS: {name}"); // => GREEN prints only when the promise holds
}

// => the old code: drops the last character, so the check fails honestly
string ReverseOld(string s) => new(s.Reverse().Skip(1).ToArray()); // => BUG: Skip(1) eats a letter

// => the fix: reverse every character, skip nothing
string Reverse(string s) => new(s.Reverse().ToArray()); // => GREEN: full reversal
