try // => runs protected work before cleanup
{
    Console.WriteLine("work"); // => Output: work
}
finally // => runs even if protected work throws
{
    Console.WriteLine("cleanup"); // => Output: cleanup
}
