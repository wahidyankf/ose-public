// => Example 14: Throw If Null Guards.
// => ThrowIfNull states the contract in one line: null never passes here.
string Plate(string? dish) // => string? admits null: the guard decides next
{
    // => one line replaces the if-null-throw ladder every method repeats
    // => the parameter name travels with the throw for free: no message to craft
    ArgumentNullException.ThrowIfNull(dish); // => throws before any use of dish
    return $"plated {dish}"; // => past the guard dish is non-null: warnings agree
}

// => valid input sails through the guard to the happy path
// => the guard is invisible on success: contracts cost nothing when honored
Console.WriteLine(Plate("rendang")); // => Output: plated rendang
try // => null input must trip the guard before anything else runs
{
    Console.WriteLine(Plate(null)); // => never prints: the guard throws first
}
catch (ArgumentNullException ex) // => the guard throws this exact type
{
    Console.WriteLine($"param: {ex.ParamName}"); // => Output: param: dish
}
