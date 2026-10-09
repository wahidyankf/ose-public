try // => begins the protected operation
{
    throw new InvalidOperationException("closed"); // => throws with the message closed
} // => InvalidOperationException transfers control to catch
catch (InvalidOperationException error) // => binds the matching exception as error
{
    Console.WriteLine(error.Message); // => Output: closed
}
