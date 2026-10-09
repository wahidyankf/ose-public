var xs = new[] { -1, 2, 3 }; // => input has one negative and two positive values
var positive = from x in xs where x > 0 select x; // => query retains 2 and 3 when enumerated
Console.WriteLine(string.Join(",", positive)); // => Output: 2,3
