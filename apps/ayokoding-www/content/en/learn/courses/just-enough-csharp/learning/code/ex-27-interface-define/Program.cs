IShape shape = new Square(3); // => interface reference holds a Square of side 3
Console.WriteLine(shape.Area()); // => Output: 9

interface IShape // => declares a shape contract
{
    int Area(); // => implementers must supply an integer area
}

class Square(int side) : IShape // => Square promises IShape.Area
{
    public int Area() => side * side; // => side 3 yields area 9
}
