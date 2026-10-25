// => Example 35: First Check, Arrange Act Assert.
// => Every check arranges its input, acts once, then asserts the outcome.
int passed = 0; // => counts the green checks at the end of the transcript

// => Check is the whole framework here: one helper, honest PASS lines
void Check(bool condition, string name) // => local function: condition plus name
{
    // => a failed condition throws: the transcript stops at the first red
    if (!condition) // => false means the code under check is wrong
    {
        throw new Exception($"FAIL: {name}"); // => FAIL names the broken promise
    }
    Console.WriteLine($"PASS: {name}"); // => PASS proves one promise held
    passed++; // => count the green so the summary line can report it
}

// => arrange: the order under check; act: total it; assert: compare
var order = new List<int> { 12000, 25000 }; // => arrange: rice plus rendang
int total = order.Sum(); // => act: the one behavior this check exercises
Check(total == 37000, "total sums two lines"); // => assert: 37000 is the promise

// => second check: arrange-act-assert again for the item count
Check(order.Count == 2, "order holds two lines"); // => assert on the count

// => the summary line closes the transcript with the green count
Console.WriteLine($"passed: {passed}"); // => Output: passed: 2
