try // => begins protected asynchronous work
{
    await FailAsync(); // => rethrows the task failure at await
} // => faulted task rethrows at the await
catch (InvalidOperationException) // => handles the expected operation error
{
    Console.WriteLine("handled"); // => Output: handled
}
static async Task FailAsync() // => returns a task that will fault
{
    await Task.Delay(1); // => yields before the failure
    throw new InvalidOperationException(); // => faults with InvalidOperationException
}
