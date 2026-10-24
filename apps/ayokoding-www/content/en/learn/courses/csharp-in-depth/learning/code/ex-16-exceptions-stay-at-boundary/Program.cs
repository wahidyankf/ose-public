// => Example 16: Exceptions Stay at Boundary.
// => Libraries throw; only the program edge catches and turns them into words.
// => the boundary catch below is the only catch in the whole example
try // => the edge of the program: the single place failures become messages
{
    Console.WriteLine(Cook("rendang")); // => Output: rendang simmers 4 hours
    // => the second call throws: exactly one catch below translates it
    Console.WriteLine(Cook("")); // => empty dish throws: caught once, at the edge
}
catch (Exception ex) // => edge catch: translate, never swallow silently
{
    // => translation, not swallowing: the message reaches the user intact
    Console.WriteLine($"kitchen says: {ex.Message}"); // => Output: kitchen says: dish is empty
}

// => Cook throws honestly instead of returning a magic failure string
// => magic values force every caller to check: throws force exactly one catch
string Cook(string dish) // => no try inside: failures propagate to the edge
{
    // => guard throws: the library refuses bad input loudly
    if (string.IsNullOrEmpty(dish)) // => empty input violates the contract
    {
        throw new InvalidOperationException("dish is empty"); // => one throw, one edge catch
    }
    return $"{dish} simmers 4 hours"; // => happy path returns plain data
}
