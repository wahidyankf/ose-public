// => Example 9: Throw for Exceptional.
// => C# throws for the truly exceptional; callers catch where they can act.
int Serve(string name) // => local function: portions out, or throws trying
{
    // => validate first: an empty order is a contract violation, not data
    // => contract violations throw because callers cannot predict them
    if (string.IsNullOrEmpty(name)) // => guard decides before any work starts
    {
        throw new InvalidOperationException("name is empty"); // => throw carries the reason
    }
    return name == "Sari" ? 2 : 1; // => happy path: portions depend on appetite
}

// => try wraps only the call that can throw, nothing more
// => small tries keep the risky call obvious and the handling adjacent
try // => the risky call lives inside, the handling right below it
{
    Console.WriteLine($"portions: {Serve("Sari")}"); // => Output: portions: 2
    // => the second call throws: the catch below translates it to words
    Console.WriteLine($"portions: {Serve("")}"); // => empty name throws here
}
catch (InvalidOperationException ex) // => catch the exact type thrown above
{
    // => exact-type catches never swallow unrelated faults by accident
    Console.WriteLine($"caught: {ex.Message}"); // => Output: caught: name is empty
}
