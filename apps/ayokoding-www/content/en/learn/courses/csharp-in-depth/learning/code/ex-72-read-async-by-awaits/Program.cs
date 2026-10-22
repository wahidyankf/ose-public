// => Example 72: Read Async by Awaits.
// => Read an async method by its awaits: each await is a pause with a resume.
Console.WriteLine("open"); // => runs first: nothing async has started yet

// => first await pauses Main until the rice task completes below
string first = await CookAsync("rice"); // => resume value: the finished plate
Console.WriteLine($"first: {first}"); // => Output: first: rice ready

// => second await pauses again: sequential awaits mean sequential work
string second = await CookAsync("rendang"); // => starts only after rice printed
Console.WriteLine($"second: {second}"); // => Output: second: rendang ready

// => the method below never sleeps: completed tasks keep the transcript exact
async Task<string> CookAsync(string dish) // => local function: dish in, plate out
{
    // => the single await: pause here, resume with the task result below
    await Task.CompletedTask; // => shape of waiting with none of the timing
    return $"{dish} ready"; // => resume value the caller above receives
}
