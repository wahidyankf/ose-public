var task = LaterAsync(); // => task begins before started is printed
Console.WriteLine("started"); // => Output: started
Console.WriteLine(await task); // => Output: finished
static async Task<string> LaterAsync() // => starts an operation returning a string task
{
    await Task.Delay(1); // => awaits a short delay before returning
    return "finished"; // => supplies finished after the delay
}
