await ReportAsync(); // => caller waits until done has been printed
static async Task ReportAsync() // => returns a Task for this operation
{
    await Task.Delay(1); // => yields until the delay completes
    Console.WriteLine("done"); // => Output: done
}
