var sum = await AddAsync(2, 3); // => await unwraps the integer result 5
Console.WriteLine(sum); // => Output: 5
static async Task<int> AddAsync(int a, int b) // => returns a Task of int
{
    await Task.Delay(1); // => yields before computing the sum
    return a + b; // => returns 2 + 3 to the caller
}
