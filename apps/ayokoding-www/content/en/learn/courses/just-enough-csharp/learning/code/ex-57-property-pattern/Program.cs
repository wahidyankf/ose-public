var point = new Point(0, 4); // => Point has X 0 and Y 4
Console.WriteLine(point is { X: 0 } ? "axis" : "other"); // => Output: axis

record Point(int X, int Y); // => provides X and Y for the property pattern
