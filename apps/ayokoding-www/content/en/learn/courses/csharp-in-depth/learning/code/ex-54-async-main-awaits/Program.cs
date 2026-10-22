// => Example 54: Async Main Awaits.
// => Top-level statements can await: the program pauses without blocking a thread.
Console.WriteLine("kitchen open"); // => prints before any async work starts

// => await pauses here and resumes when the task completes: order guaranteed
int portions = await SimmerAsync("rendang"); // => async work runs, Main waits
Console.WriteLine($"ready: {portions}"); // => Output: ready: 2

// => async local function: completed task, so the run stays instant and exact
async Task<int> SimmerAsync(string dish) // => task in name, int out on completion
{
    // => await a completed task: async shape with zero timing involved
    await Task.CompletedTask; // => yields once; nothing sleeps, nothing races
    return dish == "rendang" ? 2 : 1; // => the answer the await above delivers
}
