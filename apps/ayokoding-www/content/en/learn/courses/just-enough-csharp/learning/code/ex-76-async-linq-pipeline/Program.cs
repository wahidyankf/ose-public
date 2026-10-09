var values = await FetchAsync(); // => await yields the fetched array 1, 2, 3
Console.WriteLine(string.Join(",", values.Where(x => x > 1))); // => Output: 2,3
static async Task<int[]> FetchAsync() // => returns an asynchronous integer array
{
    await Task.Delay(1); // => yields before the array is available
    return [1, 2, 3]; // => supplies 1, 2, and 3
}
