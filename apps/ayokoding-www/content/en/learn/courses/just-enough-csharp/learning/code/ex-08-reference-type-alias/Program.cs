var first = new Counter(); // => first refers to one mutable Counter
var second = first; // => second aliases that same Counter
second.Value = 2; // => the shared Counter now stores 2
Console.WriteLine(first.Value); // => Output: 2

class Counter // => mutable reference type shared by both variables
{
    public int Value { get; set; } // => setter changes the shared object
}
