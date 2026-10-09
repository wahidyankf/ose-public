var text = await ReadAsync(); // => await unwraps the returned text ready
Console.WriteLine(text); // => Output: ready
static async Task<string> ReadAsync() // => returns a Task of string
{
    await Task.Delay(1); // => yields before producing text
    return "ready"; // => supplies ready to the caller
}
