// => Example 46: Constraints Name Operations.
// => Constraints list what T can do: new it, compare it, or keep it a class.
// => NewPlate needs new(): the factory promise lives in the constraint
// => callers name the type, the constraint guarantees the construction
Console.WriteLine(NewPlate<Plate>().Label); // => Output: empty plate
Console.WriteLine(NewPlate<Special>().Label); // => Output: rendang special

// => new() promises a parameterless constructor: the body can construct T
// => without the constraint this line would not compile: power must be named
T NewPlate<T>()
    where T : new() // => the constraint unlocks the new expression
{
    return new T(); // => legal only because new() names the power
}

// => types follow the statements; each honors the new() promise differently
class Plate // => plain plate: the default constructor suffices
{
    public string Label => "empty plate"; // => expression body: one line, one answer
}

class Special // => special: its constructor sets the label itself
{
    public string Label { get; } = "rendang special"; // => initializer runs in new()
}
