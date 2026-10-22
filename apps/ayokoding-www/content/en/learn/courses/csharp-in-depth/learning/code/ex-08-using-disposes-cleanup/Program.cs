// => Example 8: Using Disposes Cleanup.
// => using releases each resource in reverse order, even on the happy path.
// => nested usings acquire inside-out and release outside-in, guaranteed
// => the language owns the order here, not programmer discipline
using (var outer = new Scoop("outer")) // => acquired outer prints first
// => each nesting level adds one acquire and guarantees one release
using (var inner = new Scoop("inner")) // => acquired inner prints second
{
    Console.WriteLine("serving"); // => the body runs between acquire and release
} // => released inner prints third, released outer prints last

// => type declarations follow the top-level statements in one file
sealed class Scoop : IDisposable // => sealed: no subclass will extend this tool
{
    // => one field names the instance: disposal reports which scoop releases
    private readonly string _name; // => readonly: set once, read forever after

    public Scoop(string name) // => constructor announces the acquisition
    {
        _name = name; // => remember which scoop this one is for disposal
        // => announcing acquisition makes the release order inspectable later
        Console.WriteLine($"acquired {_name}"); // => acquisition prints immediately
    }

    public void Dispose() // => Dispose runs when the using block exits
    {
        // => release mirrors acquisition: the guarantee the transcript proves
        Console.WriteLine($"released {_name}"); // => release prints in reverse order
    }
}
