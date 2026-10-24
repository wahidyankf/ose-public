// => Example 40: Async Checks Await.
// => Async checks await the task first: never assert on an unstarted promise.
int passed = 0; // => counts the green checks the summary line reports

// => Check awaits nothing itself: callers pass already-awaited values
void Check(bool condition, string name) // => local function: promise plus name
{
    // => false throws: the transcript stops at the first broken promise
    if (!condition) // => the awaited value decides here, synchronously
    {
        throw new Exception($"FAIL: {name}"); // => FAIL names the broken promise
    }
    Console.WriteLine($"PASS: {name}"); // => green: the awaited answer held
    passed++; // => count it for the summary line below
}

// => top-level statements can await: the check runs after the task finishes
int total = await TotalAsync(new List<int> { 12000, 25000 }); // => await first, assert after
Check(total == 37000, "async total sums two lines"); // => Output: PASS
Console.WriteLine($"passed: {passed}"); // => Output: passed: 1

// => TotalAsync pretends to fetch each line: completed tasks, no delays
async Task<int> TotalAsync(List<int> lines) // => async local function: task in, total out
{
    // => await a completed task: the shape is async, the run stays instant
    await Task.CompletedTask; // => yields once without sleeping or timing out
    return lines.Sum(); // => the same sum the sync checks assert elsewhere
}
