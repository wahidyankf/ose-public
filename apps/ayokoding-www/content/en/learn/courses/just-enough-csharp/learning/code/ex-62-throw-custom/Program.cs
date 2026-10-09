try // => begins the protected withdrawal
{
    throw new BalanceException("insufficient"); // => throws the domain-specific error
} // => BalanceException transfers control to catch
catch (BalanceException e) // => handles this exception type
{
    Console.WriteLine(e.Message); // => Output: insufficient
}

class BalanceException(string message) : Exception(message); // => passes the message to Exception
