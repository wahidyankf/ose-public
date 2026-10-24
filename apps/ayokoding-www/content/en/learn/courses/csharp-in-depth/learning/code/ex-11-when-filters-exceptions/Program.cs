// => Example 11: When Filters Exceptions.
// => catch-when handles only the failures you recognize and rethrows the rest.
void Handle(InvalidOperationException ex) // => local function: sort one failure
{
    // => the throw below stands in for real failing work the filters sort
    try // => the risky statement is the throw below, standing in for real work
    {
        throw ex; // => rethrow the received failure so the filters can sort it
    }
    // => first arm owns empty orders: the filter names the content it matches
    catch (InvalidOperationException e) when (e.Message.Contains("empty")) // => filter on content
    {
        Console.WriteLine("refused: empty order"); // => Output: refused: empty order
    }
    // => second arm owns the remainder: no filter, so it catches what skipped
    catch (InvalidOperationException e) // => no filter: catches what the first arm skipped
    {
        // => e.Message carries the unrecognized failure through to the transcript
        Console.WriteLine($"failed: {e.Message}"); // => Output: failed: kitchen closed
    }
}

// => the same handler sorts two failures by their messages, no ifs needed
// => declarative arms beat catch-plus-if: sorting stays out of the handling
Handle(new InvalidOperationException("name is empty")); // => first filter matches
Handle(new InvalidOperationException("kitchen closed")); // => falls to the plain arm
