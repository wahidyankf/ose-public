var dog = new Dog("Milo"); // => Dog passes Milo into its Animal base
Console.WriteLine(dog.Describe()); // => Output: animal:Milo

class Animal(string name) // => captures a name in the base type
{
    protected string Name { get; } = name; // => derived types can read Name
}

class Dog(string name) : Animal(name) // => passes name to Animal
{
    public string Describe() => "animal:" + Name; // => combines the base name with a prefix
}
