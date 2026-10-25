// => Example 13: Inner Exception Chain.
// => Wrap once per layer so the outer message explains and the inner proves.
try // => the outer layer translates a low failure into kitchen language
{
    // => nesting shows the layers: inner meets it raw, outer translates it
    try // => the inner layer meets the raw failure first
    {
        throw new InvalidOperationException("burner 2 is cold"); // => the root cause
    }
    catch (Exception inner) // => catch the raw failure at the layer edge
    {
        // => wrap exactly here: context outside for callers, cause inside for logs
        throw new InvalidOperationException("cannot start rendang", inner); // => wrap: context outside, cause inside
    }
}
catch (Exception outer) // => the caller sees the wrapped layer failure
{
    // => outer speaks kitchen language: the layer the caller understands
    // => callers read Message: the actionable layer without digging deeper
    Console.WriteLine($"outer: {outer.Message}"); // => Output: outer: cannot start rendang
    // => inner speaks burner language: the root cause debuggers need
    // => the ?. guards a missing inner: chains this short always carry one
    Console.WriteLine($"inner: {outer.InnerException?.Message}"); // => Output: inner: burner 2 is cold
}
