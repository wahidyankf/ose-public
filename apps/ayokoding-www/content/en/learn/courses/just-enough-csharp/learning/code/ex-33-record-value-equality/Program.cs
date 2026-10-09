var first = new Point(1, 2); // => first record contains coordinates 1 and 2
var second = new Point(1, 2); // => second record has equal coordinates in a separate instance
Console.WriteLine(first == second); // => Output: True

record Point(int X, int Y); // => generates components used by equality
