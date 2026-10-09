var xs = new List<int> { 1, 2 }; // => source begins with 1 and 2
var snapshot = xs.Where(x => x > 1).ToList(); // => snapshot immediately stores only 2
xs.Add(3); // => source changes after snapshot creation
Console.WriteLine(string.Join(",", snapshot)); // => Output: 2
