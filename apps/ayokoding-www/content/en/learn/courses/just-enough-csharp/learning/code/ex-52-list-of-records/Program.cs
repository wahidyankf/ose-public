var points = new List<Point> { new(1, 2), new(3, 4) }; // => records contain X coordinates 1 and 3
Console.WriteLine(string.Join(",", points.Select(p => p.X))); // => Output: 1,3

record Point(int X, int Y); // => defines the two projected coordinates
