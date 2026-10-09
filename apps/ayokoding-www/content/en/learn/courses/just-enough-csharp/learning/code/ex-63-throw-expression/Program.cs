string? input = null; // => nullable input is currently missing
try // => begins the null guard
{
    var name = input ?? throw new ArgumentNullException(); // => null input triggers the throw expression
} // => throw expression transfers control to catch
catch (ArgumentNullException) // => handles the missing argument
{
    Console.WriteLine("required"); // => Output: required
}
