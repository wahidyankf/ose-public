// => Example 73: Read Type by Constructors.
// => Read a type by its constructors first: they list every valid birth.
// => the two births below are the whole public story of a ticket
// => births before behavior: the legal states come before the methods
var quick = new Ticket("rice"); // => one argument: quantity defaults to one
var feast = new Ticket("rendang", 3); // => two arguments: dish plus quantity
Console.WriteLine(quick); // => Output: rice x1
Console.WriteLine(feast); // => Output: rendang x3

// => the type below offers exactly two births: default quantity or explicit
// => sealed birth list: no subclass can add a third way to be born
sealed class Ticket // => sealed: the birth list below is complete
{
    public string Dish { get; } // => get-only: set at birth, read forever
    public int Qty { get; } // => get-only: the second birth decides it

    // => convenience chains to the real birth: defaults live in one place
    public Ticket(string dish)
        : this(dish, 1) // => chains: one plate by default
    { }

    public Ticket(string dish, int qty) // => the real birth: both fields set here
    {
        Dish = dish; // => the dish every ticket must name
        Qty = qty; // => the quantity the caller chose
    }

    public override string ToString() => $"{Dish} x{Qty}"; // => the print shape above
}
