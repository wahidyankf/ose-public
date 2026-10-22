// => Example 28: Access Modifiers Draw Lines.
// => public invites, private hides, internal shares within one assembly.
// => the cashier below shows all three lines in one small type
var till = new Till(); // => construct the cashier the demo operates
Console.WriteLine($"total: {till.Total()}"); // => Output: total: 37000

// => private balance stays hidden: the line below would not compile
// => Console.WriteLine(till.balance);
Console.WriteLine($"open: {Till.Open}"); // => Output: open: True

// => type declarations follow the statements in single-file order
sealed class Till // => sealed: the cashier design ends here
{
    private int _balance = 37000; // => private: only Till methods touch this
    internal static bool Open = true; // => internal: visible across this assembly

    public int Total() => _balance; // => public: the one reading the outside gets
}
