// => Example 74: Read Test by Asserts.
// => Read a test backwards from its asserts: each assert names one promise.
int passed = 0; // => counts the promises the transcript proves below

// => first promise first: the total of rice plus rendang is 37000
Check(MenuTotal(new() { ["rice"] = 12000, ["rendang"] = 25000 }) == 37000, "total is 37000"); // => Output: PASS

// => second promise: an empty menu totals zero, not garbage
Check(MenuTotal(new()) == 0, "empty menu is 0"); // => Output: PASS

// => the summary closes the read: two promises named, two promises kept
Console.WriteLine($"passed: {passed}"); // => Output: passed: 2

// => Check stays tiny: the asserts above carry the meaning, not the helper
void Check(bool condition, string name) // => local function: promise plus name
{
    // => false throws: a red transcript names the broken promise exactly
    if (!condition) // => the promise under test decides here
    {
        throw new Exception($"FAIL: {name}"); // => FAIL text is the reading guide
    }
    Console.WriteLine($"PASS: {name}"); // => green: one promise read and kept
    passed++; // => count it for the summary line above
}

// => the code under check: sums any menu dictionary it receives
int MenuTotal(Dictionary<string, int> menu) => menu.Values.Sum(); // => local function: menu in, total out
