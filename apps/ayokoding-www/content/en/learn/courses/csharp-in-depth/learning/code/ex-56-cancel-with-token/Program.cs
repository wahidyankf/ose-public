// => Example 56: Cancel with Token.
// => Cancel before the work starts: the token is already dead, so the outcome is fixed.
using var source = new CancellationTokenSource(); // => the token factory for this demo

// => cancel before any work: pre-cancelled tokens make the outcome fixed
source.Cancel(); // => cancel up front: deterministic, no race with the work

// => IsCancellationRequested answers true: the work below never starts
// => checking first is the cooperative rule: never start dead work
Console.WriteLine($"canceled: {source.Token.IsCancellationRequested}"); // => Output: canceled: True
try // => ThrowIfCancellationRequested turns the dead token into the standard throw
{
    source.Token.ThrowIfCancellationRequested(); // => the cooperative check every loop needs
}
catch (OperationCanceledException) // => the exact type cancellation promises
{
    Console.WriteLine("work stood down"); // => Output: work stood down
}
