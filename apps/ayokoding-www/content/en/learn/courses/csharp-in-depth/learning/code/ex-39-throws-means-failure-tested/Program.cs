// => Example 39: Throws Means Failure Tested.
// => CheckThrows proves the failure path: the promise is that bad input throws.
int passed = 0; // => counts the green checks the summary line reports

// => CheckThrows runs the action and demands exactly the promised exception
void CheckThrows<T>(Action action, string name)
    where T : Exception // => generic over the exception type
{
    // => the action runs inside: the only question is whether it throws
    try // => run the action that must throw
    {
        action(); // => if this returns, the promise broke: no throw happened
        // => reaching here means silence: the failure path failed to fire
        throw new Exception($"FAIL: {name}: nothing thrown"); // => silence is failure here
    }
    catch (T) // => the promised type: the failure path works as specified
    {
        // => exact-type catch: wrong exception types still escape loudly
        Console.WriteLine($"PASS: {name}"); // => green: the right failure fired
        passed++; // => count it for the summary line below
    }
}

// => empty orders must throw: the kitchen refuses them loudly by contract
CheckThrows<InvalidOperationException>(() => Serve(""), "empty order throws"); // => Output: PASS

// => valid orders must not throw: the happy path still serves
Console.WriteLine(Serve("Sari")); // => Output: Sari gets 2 portions
Console.WriteLine($"passed: {passed}"); // => Output: passed: 1

// => Serve throws for empty names exactly like Example 9 taught
// => guards stay honest only while a check demands their throws
string Serve(string name) // => local function: the behavior under check
{
    // => guard throws: this is the failure the check above demands
    if (string.IsNullOrEmpty(name)) // => empty input violates the contract
    {
        throw new InvalidOperationException("name is empty"); // => the promised throw
    }
    return $"{name} gets 2 portions"; // => happy path serves plain data
}
