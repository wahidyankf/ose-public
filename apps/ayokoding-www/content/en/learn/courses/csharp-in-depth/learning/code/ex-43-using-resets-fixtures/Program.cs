// => Example 43: Using Resets Fixtures.
// => A fixture type sets up in its constructor and resets in Dispose per check.
using (var fx = new MenuFixture()) // => first check gets a fresh two-dish menu
{
    // => mutate freely: this menu dies with the block, never leaking out
    fx.Menu.Add("sambal"); // => the check mutates its own fixture freely
    Console.WriteLine($"first sees: {fx.Menu.Count}"); // => Output: first sees: 3
} // => Dispose runs here: a fresh fixture starts below, never polluted

// => the second block starts from two: isolation made structural, not hoped
using (var fx = new MenuFixture()) // => second check starts from two again
{
    Console.WriteLine($"second sees: {fx.Menu.Count}"); // => Output: second sees: 2
}

// => the fixture owns setup plus reset: checks share the shape, never state
// => shape shared, state fresh: the rule that ends order-dependent suites
sealed class MenuFixture : IDisposable // => sealed: the fixture design ends here
{
    public List<string> Menu { get; } = new() { "rice", "rendang" }; // => fresh two-dish menu per fixture

    public void Dispose() // => reset point: release or verify here in real suites
    {
        // => nothing shared escapes: the list dies with the fixture itself
    }
}
