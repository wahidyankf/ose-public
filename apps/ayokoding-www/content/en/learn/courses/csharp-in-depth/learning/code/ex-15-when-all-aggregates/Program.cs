// => Example 15: When All Aggregates.
// => WhenAll gathers every fault: Wait wraps them in one AggregateException.
var first = Task.FromException<int>(new InvalidOperationException("burner cold")); // => fault one, pre-made

// => pre-made faults remove timing: the aggregate order is task order, always
var second = Task.FromException<int>(new InvalidOperationException("rice short")); // => fault two, pre-made
try // => Wait blocks and throws the aggregate: both faults travel together
{
    // => Wait (not await) surfaces the aggregate: await would show only the first
    Task.WhenAll(first, second).Wait(); // => pre-faulted tasks: deterministic order
}
catch (AggregateException agg) // => AggregateException carries every inner fault
{
    // => InnerExceptions keeps task order: first fault prints first, always
    // => the full picture in one catch: no hidden second failure to chase later
    foreach (var inner in agg.InnerExceptions) // => exactly the two faults above
    {
        Console.WriteLine($"fault: {inner.Message}"); // => Output: burner cold, then rice short
    }
}
