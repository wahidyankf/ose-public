// => Example 77: Read Using Chains Inside Out.
// => Read nested usings inside-out: the innermost acquisition releases first.
using (var stove = new Burner("stove")) // => acquired first, released last
// => second level nests under the first: acquisitions stack in order
using (var wok = new Burner("wok")) // => acquired second, released second
// => third level nests deepest: innermost acquires last, releases first
using (var oil = new Burner("oil")) // => acquired last, released first
{
    Console.WriteLine("frying"); // => the body all three acquisitions protect
}

// => release order mirrors acquisition: oil, wok, stove, exactly reversed
// => the mirror is the lesson: read chains inside-out, never line by line
// => the tool below logs its own lifecycle so the order is inspectable
sealed class Burner : IDisposable // => sealed: the lifecycle shape ends here
{
    private readonly string _name; // => which burner this instance tends

    public Burner(string name) // => construction announces the acquisition
    {
        _name = name; // => keep the name for the release line below
        // => lit lines print in nesting order: stove, wok, oil
        Console.WriteLine($"lit {_name}"); // => acquisition prints in nesting order
    }

    public void Dispose() // => runs on using exit, innermost first
    {
        // => out lines print reversed: oil, wok, stove, the mirror image
        Console.WriteLine($"out {_name}"); // => release prints in reverse order
    }
}
