// Solution: a record replaces the hand equality. Same True, one line.
// => value equality from Example 51: same fields means equal, free
Console.WriteLine(new Plate("rice", 2) == new Plate("rice", 2)); // => Output: True

// => record declaration follows the statement in single-file order
record Plate(string Dish, int Qty); // => positional record: equality by value, free
