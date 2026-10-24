// => Example 17: Dispose Despite Errors.
// => A throw inside using still disposes: cleanup outlives the failure.
// => the log below proves disposal ran even though the body threw
var log = new List<string>(); // => records the order: acquire, fail, release

// => the list is the transcript: every lifecycle event lands here in order
try // => the throw inside the using must not skip the release below it
{
    using (var pan = new Pan(log, "wok")) // => acquired wok lands in the log
    {
        log.Add("cooking"); // => body work happens between acquire and release
        // => mid-body failure: the release below must still precede the catch
        throw new InvalidOperationException("oil smoking"); // => failure mid-body
    }
}
catch (InvalidOperationException) // => edge catch: the failure is expected here
{
    // => caught lands last: disposal already ran before this handler woke
    log.Add("caught"); // => caught lands after the release, never before it
}

// => released wok precedes caught: disposal beat the handler to the log
// => Join renders the transcript: one line proves the whole lifecycle order
Console.WriteLine(string.Join(" | ", log)); // => Output: acquired wok | cooking | released wok | caught

// => Pan writes its whole lifecycle into the shared log for inspection
sealed class Pan : IDisposable // => sealed: the lifecycle shape ends here
{
    // => shared log plus name: the whole lifecycle stays inspectable after
    private readonly List<string> _log; // => shared log owned by the caller
    private readonly string _name; // => which pan this disposal belongs to

    public Pan(List<string> log, string name) // => construction logs the acquire
    {
        _log = log; // => keep the log for the Dispose call below
        _name = name; // => keep the name for the release line
        // => acquire logs first: the transcript opens with the construction
        _log.Add($"acquired {_name}"); // => acquire prints first in the final order
    }

    public void Dispose() // => runs on using exit, throw or not
    {
        // => release logs before any catch: the guarantee made visible
        _log.Add($"released {_name}"); // => release precedes the catch, guaranteed
    }
}
