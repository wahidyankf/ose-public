IGreeter greeter = new Greeter(); // => implementation inherits default
Console.WriteLine(greeter.Greet()); // => Output: hello

interface IGreeter // => declares the greeting contract
{
    string Greet() => "hello"; // => default body returns hello
}

class Greeter : IGreeter { } // => inherits the default greeting
