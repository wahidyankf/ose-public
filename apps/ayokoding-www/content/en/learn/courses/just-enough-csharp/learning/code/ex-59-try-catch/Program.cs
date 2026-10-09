try // => begins the protected parse
{
    int.Parse("nope"); // => throws FormatException for nonnumeric text
} // => FormatException transfers control to catch
catch (FormatException) // => handles only format errors
{
    Console.WriteLine("invalid"); // => Output: invalid
}
