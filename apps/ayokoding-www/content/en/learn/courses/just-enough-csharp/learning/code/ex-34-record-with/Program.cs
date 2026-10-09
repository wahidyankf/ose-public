var first = new Point(1, 2); // => original record retains X 1
var moved = first with { X = 5 }; // => copy changes X to 5 while keeping Y 2
Console.WriteLine(first.X + ":" + moved.X); // => Output: 1:5

record Point(int X, int Y); // => generates components retained by the copy
