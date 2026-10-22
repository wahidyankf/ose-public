// => Example 22: JSON Round Trip.
// => System.Text.Json serializes a record and parses it back with no packages.
var order = new Order("rendang", 2); // => record: value shape with two fields

// => Serialize turns the record into a JSON object string with camel keys
string json = System.Text.Json.JsonSerializer.Serialize(order); // => {"Dish":"rendang","Qty":2}
Console.WriteLine(json); // => Output: {"Dish":"rendang","Qty":2}

// => Deserialize rebuilds the record: the JSON above parses back exactly
var back = System.Text.Json.JsonSerializer.Deserialize<Order>(json); // => back equals order
Console.WriteLine($"{back?.Dish} x{back?.Qty}"); // => Output: rendang x2

// => record declaration follows the statements in single-file order
record Order(string Dish, int Qty); // => positional record: equality by value
