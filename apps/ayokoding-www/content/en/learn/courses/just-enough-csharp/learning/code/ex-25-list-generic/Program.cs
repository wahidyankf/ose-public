var names = new List<string> { "Ada" }; // => list starts with one string, Ada
names.Add("Lin"); // => list now contains Ada followed by Lin
Console.WriteLine(string.Join(",", names)); // => Output: Ada,Lin
