var values = await Task.WhenAll(GetAsync(1), GetAsync(2)); // => both task results become available together
Console.WriteLine(string.Join(",", values)); // => Output: 1,2
static async Task<int> GetAsync(int x) // => returns one integer asynchronously
{
    await Task.Delay(1); // => both tasks may advance before the join
    return x; // => returns each task input
}
