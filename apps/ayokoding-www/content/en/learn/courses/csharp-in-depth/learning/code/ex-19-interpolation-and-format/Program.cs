// => Example 19: Interpolation and Format.
// => Interpolated strings embed values; alignment and format verbs shape them.
string dish = "rendang"; // => the value every format below displays
int price = 25000; // => plain integer: verbs decide how it prints

// => plain hole: the value renders with its default shape
Console.WriteLine($"dish: {dish}"); // => Output: dish: rendang

// => alignment pads to 12: the receipt column stays straight
Console.WriteLine($"|{dish, 12}|"); // => Output: |     rendang|

// => N0 thousands-separates with the invariant shape used across this course
Console.WriteLine($"{price.ToString("N0", System.Globalization.CultureInfo.InvariantCulture)}"); // => Output: 25,000

// => composite format numbers its holes: the oldest shaping style still works
Console.WriteLine(string.Format("{0} x{1}", dish, 2)); // => Output: rendang x2
