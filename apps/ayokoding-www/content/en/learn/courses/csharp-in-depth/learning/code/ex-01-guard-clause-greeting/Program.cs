// => Example 1: Guard Clause Greeting.
// => C# checks the failure first and returns, so the happy path stays flat.
string Greet(string name) // => local function: the demo stays in one file
{
    // => guard clause first: refuse input this function cannot serve
    if (string.IsNullOrEmpty(name)) // => IsNullOrEmpty covers null and "" alike
    {
        return "error: name is empty"; // => failure travels as data, not an exception
    }
    return $"hello, {name}"; // => past the guard the name is safe to use
}

// => empty input trips the guard before any greeting builds
Console.WriteLine(Greet("")); // => Output: error: name is empty

// => valid input skips the guard and reaches the greeting
Console.WriteLine(Greet("Sari")); // => Output: hello, Sari
