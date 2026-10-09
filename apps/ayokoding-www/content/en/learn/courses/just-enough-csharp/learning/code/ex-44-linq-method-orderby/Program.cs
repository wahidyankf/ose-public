var xs = new[] { "Lin", "Ada" }; // => source order is Lin then Ada
var ordered = xs.OrderBy(x => x); // => ordered enumeration yields Ada then Lin
Console.WriteLine(string.Join(",", ordered)); // => Output: Ada,Lin
