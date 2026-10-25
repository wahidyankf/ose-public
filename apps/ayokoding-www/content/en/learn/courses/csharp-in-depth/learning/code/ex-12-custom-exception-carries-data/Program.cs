// => Example 12: Custom Exception Carries Data.
// => A custom exception type carries the fields the handler needs to react.
// => the type declaration follows the statements, as single-file order demands
try // => the order below violates the field rule the type enforces
{
    // => zero portions violates the house rule the type below encodes
    throw new ShortOrderException("rice", 0); // => zero portions: invalid order
}
catch (ShortOrderException ex) // => catch the custom type, not its base
{
    // => the handler reads the fields: dish names the retry, minimum sets it
    // => typed fields beat message parsing: renames cannot break this handler
    Console.WriteLine($"reorder {ex.Dish} with at least {ex.Minimum}"); // => Output: reorder rice with at least 1
}

// => custom type: dish plus minimum travel with the failure itself
// => failures as contracts: the compiler checks what strings never could
sealed class ShortOrderException : Exception // => sealed: this taxonomy ends here
{
    public string Dish { get; } // => get-only: the failure facts never change
    public int Minimum { get; } // => the smallest order the kitchen accepts

    // => ordered explains the cause while dish and minimum serve the handler
    public ShortOrderException(string dish, int ordered) // => ordered explains the cause
        : base($"ordered {ordered} of {dish}") // => base message keeps the story
    {
        Dish = dish; // => remember the dish for the handler
        Minimum = 1; // => the house rule lives with the type
    }
}
