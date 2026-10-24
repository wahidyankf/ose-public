// Starter: class with hand-written equality. The smell: records do this free.
// => replace with a record following Example 51 and delete the Equals pair
Console.WriteLine(new Plate("rice", 2).Equals(new Plate("rice", 2))); // => True today, one line tomorrow

class Plate // => hand equality: sixteen lines for what one record line gives
{
    public string Dish; // => mutable field, like Example 49 warned about
    public int Qty; // => second field the equality below must remember

    public Plate(string dish, int qty)
    {
        Dish = dish;
        Qty = qty;
    } // => constructor assigns both

    public override bool Equals(object? o) => o is Plate p && p.Dish == Dish && p.Qty == Qty; // => hand field compare

    public override int GetHashCode() => HashCode.Combine(Dish, Qty); // => hand hash to match
}
