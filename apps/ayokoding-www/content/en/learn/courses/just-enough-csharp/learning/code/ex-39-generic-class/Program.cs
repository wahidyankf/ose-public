var box = new Box<int>(7); // => Box<int> contains the integer 7
Console.WriteLine(box.Value); // => Output: 7

class Box<T>(T value) // => captures the typed constructor value
{
    public T Value { get; } = value; // => property keeps type T
}
