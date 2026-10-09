var point = new Point(3, 4); // => record contains X 3 and Y 4
var (x, y) = point; // => x receives 3 and y receives 4
Console.WriteLine(x + y); // => Output: 7

record Point(int X, int Y); // => generates a positional deconstructor
