var xs = new List<int> { 1, 2 }; // => mutable list begins with 1 and 2
var query = xs.Where(x => x > 1); // => query has not enumerated the source yet
xs.Add(3); // => source now contains 1, 2, and 3
Console.WriteLine(string.Join(",", query)); // => Output: 2,3
