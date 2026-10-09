var xs = new[] { 3, 1, 2 }; // => source starts in order 3, 1, 2
var result = xs.Where(x => x > 1).Select(x => x * 10).OrderBy(x => x); // => filter, multiply, then sort yields 20, 30
Console.WriteLine(string.Join(",", result)); // => Output: 20,30
