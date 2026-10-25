// => Example 52: Yield Builds Lazy Pipelines.
// => yield return streams items: stopping after two leaves the third uncooked.
int cooked = 0; // => counts the dishes the iterator actually prepared
int served = 0; // => counts the plates the loop below accepted

// => two counters tell the story: pulls accepted versus dishes cooked
// => the loop stops after two: the third yield never runs, laziness proven
foreach (string dish in StreamMenu()) // => the loop pulls; the iterator yields
{
    Console.WriteLine($"served: {dish}"); // => Output: served: rice, served: rendang
    // => two accepted ends the pulls: the iterator pauses forever after
    if (++served == 2) // => two plates accepted: stop pulling from the stream
    {
        break; // => break abandons the iterator: sambal never cooks
    }
}

// => cooked counts two: the pipeline ran only what the loop demanded
Console.WriteLine($"cooked: {cooked}"); // => Output: cooked: 2

// => iterator method: each yield pauses until the loop asks for more
IEnumerable<string> StreamMenu() // => local iterator: lazy by construction
{
    cooked++; // => side effect proves when each dish actually cooks
    yield return "rice"; // => first pull cooks rice, then pauses here
    cooked++; // => runs only when the loop pulls the second plate
    yield return "rendang"; // => second pull cooks rendang, then pauses
    cooked++; // => unreachable: the break above stopped the pulls
    yield return "sambal"; // => never cooked: laziness you can count
}
