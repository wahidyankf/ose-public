Console.WriteLine(await StepAsync("one")); // => Output: one
Console.WriteLine(await StepAsync("two")); // => Output: two
static async Task<string> StepAsync(string x) // => returns the input after an asynchronous delay
{
    await Task.Delay(1); // => first call completes before the second starts
    return x; // => returns the current label
}
