var meter = new Meter(3); // => constructor captures the starting value 3
Console.WriteLine(meter.Next()); // => Output: 4

class Meter(int value) // => captures the initial meter value
{
    public int Next() => value + 1; // => returns 3 + 1 without changing value
}
