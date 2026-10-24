// => Ledger.cs: the receipt library for the capstone. Pure functions, no I/O.
// => one static type: parse lines, price dishes, total orders, all testable
static class Ledger // => static: every member is a pure function of its inputs
{
    // => the fixed menu: the prices every receipt in this capstone promises
    private static readonly Dictionary<string, int> Prices = new() // => readonly: set once, read forever
    {
        ["rice"] = 12000, // => the price the main run multiplies for rice x2
        ["rendang"] = 25000, // => the price the main run multiplies for rendang x1
        ["sambal"] = 5000, // => the price the main run multiplies for sambal x3
    };

    // => TryParseLine answers false for malformed lines instead of throwing
    public static bool TryParseLine(string line, out string dish, out int qty) // => Try-pattern from Example 10
    {
        dish = ""; // => default out: a failed parse leaves nothing behind
        qty = 0; // => default out: zero quantity on every failure path
        // => Split on spaces, drop empties: "rice x2" becomes [rice, x2]
        string[] parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries); // => exactly two parts expected
        // => shape check first: wrong part count fails before any lookup runs
        if (parts.Length != 2 || !parts[1].StartsWith('x')) // => guard: dish plus x-quantity
        {
            return false; // => malformed line: the caller reports it, not us
        }
        // => quantity must parse and stay positive: x0 and x-1 both fail here
        if (!int.TryParse(parts[1][1..], out qty) || qty <= 0) // => range slices past the x
        {
            qty = 0; // => reset: a half-parsed quantity must not leak out
            return false; // => bad quantity: same honest false as a bad shape
        }
        dish = parts[0]; // => the dish name travels out only on success
        return true; // => parsed: dish plus positive quantity, ready to price
    }

    // => Price throws for unknown dishes: the menu above is the whole contract
    public static int Price(string dish) // => dish in, price out, or throw
    {
        // => TryGetValue keeps the lookup total: no exception for the happy path
        if (Prices.TryGetValue(dish, out int price)) // => the idiom Example 5 teaches
        {
            return price; // => known dish: the promised price answers
        }
        throw new InvalidOperationException($"unknown dish: {dish}"); // => unknown: loud, at the edge
    }

    // => ReceiptLine prices one parsed line: dish, quantity, and line total
    public static string ReceiptLine(string dish, int qty) =>
        $"{dish} x{qty} = {Price(dish) * qty}"; // => one line, one answer

    // => Total sums priced lines: the number the golden transcript closes with
    public static int Total(IEnumerable<(string Dish, int Qty)> lines) =>
        lines.Sum(l => Price(l.Dish) * l.Qty); // => LINQ over the parsed order
}
