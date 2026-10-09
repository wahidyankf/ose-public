var value = new Vec { X = 1 }; // => creates the original Vec value
var valueCopy = value; // => copies the Vec value
valueCopy.X = 2; // => valueCopy changes while value stays at X 1
var reference = new Box { X = 1 }; // => creates one Box object
var alias = reference; // => points to that same Box
alias.X = 2; // => alias changes the Box seen through reference
Console.WriteLine(value.X + ":" + reference.X); // => Output: 1:2

struct Vec // => declares value semantics
{
    public int X { get; set; } // => X can change on a Vec copy
}

class Box // => declares reference semantics
{
    public int X { get; set; } // => X mutation is visible through an alias
}
