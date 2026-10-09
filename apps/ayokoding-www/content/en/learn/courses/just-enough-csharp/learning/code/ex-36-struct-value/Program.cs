var left = new Vec { X = 1 }; // => left starts with X 1
var right = left; // => right receives its own Vec value
right.X = 2; // => only right changes its X to 2
Console.WriteLine(left.X); // => Output: 1

struct Vec // => declares a value type
{
    public int X { get; set; } // => mutable X belongs to each copy
}
