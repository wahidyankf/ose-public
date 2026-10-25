// => Example 50: Readonly Record With.
// => with copies a record while changing named fields: the original survives.
var today = new Plate("rendang", 25000); // => the original record, immutable

// => with builds a sibling: price changes, dish carries over, today untouched
var promo = today with
{
    Price = 20000,
}; // => copy plus one named change
Console.WriteLine($"{today.Dish} {today.Price}"); // => Output: rendang 25000
Console.WriteLine($"{promo.Dish} {promo.Price}"); // => Output: rendang 20000

// => record declaration follows the statements in single-file order
record Plate(string Dish, int Price); // => positional record: init-only by default
