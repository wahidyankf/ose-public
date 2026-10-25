// Starter: nested checks bury the answer two levels deep. The smell: the pyramid.
// => flatten with a guard clause and a switch following Example 68
int Price(string dish, int qty) // => nested version: answer hides inside
{
    if (qty > 0) // => level one: quantity must be positive
    {
        if (dish == "rendang") // => level two: dish must match
        {
            return 25000 * qty; // => answer two levels deep
        }
    }
    return 0; // => failure value far from its conditions
}
Console.WriteLine(Price("rendang", 2)); // => 50000 today, nested tomorrow
