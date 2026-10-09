string?[] names = ["Ada", null, "Lin"]; // => array includes one null among two names
var sizes = names.Where(x => x is not null).Select(x => x!.Length); // => filter removes null before reading lengths
Console.WriteLine(string.Join(",", sizes)); // => Output: 3,3
