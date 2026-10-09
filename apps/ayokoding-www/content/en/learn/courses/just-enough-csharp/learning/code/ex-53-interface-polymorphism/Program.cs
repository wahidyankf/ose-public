IShape[] shapes = [new Square(2), new Circle(1)]; // => array holds Square and Circle behind one interface
Console.WriteLine(string.Join(",", shapes.Select(x => x.Area()))); // => Output: 4,3

interface IShape // => declares the shared shape contract
{
    int Area(); // => each shape supplies area
}

class Square(int x) : IShape // => implements the square area
{
    public int Area() => x * x; // => side 2 produces area 4
}

class Circle(int x) : IShape // => implements the circle area
{
    public int Area() => x * x * 3; // => approximates πr² using 3 for π; radius 1 gives 3
}
