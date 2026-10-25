// Solution: Total pinned by a Check. The promise 37000 now has a guard.
// => arrange-act-assert from Example 35: one helper, honest PASS lines
int total = new List<int> { 12000, 25000 }.Sum(); // => act: the behavior under check
Check(total == 37000, "total sums two lines"); // => assert: 37000 is the promise

// => Check helper: PASS prints, FAIL throws with the promise name
void Check(bool condition, string name) // => local function: promise plus name
{
    // => false throws: the transcript stops at the first broken promise
    if (!condition) // => the promise decides here, synchronously
    {
        throw new Exception($"FAIL: {name}"); // => FAIL names the broken promise
    }
    Console.WriteLine($"PASS: {name}"); // => Output: PASS: total sums two lines
}
