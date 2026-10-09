Animal animal = new Dog(); // => Animal variable contains a Dog instance
Console.WriteLine(animal.Sound()); // => Output: bark

class Animal // => declares the base sound behavior
{
    public virtual string Sound() => "?"; // => virtual member can be overridden
}

class Dog : Animal // => inherits from Animal
{
    public override string Sound() => "bark"; // => replaces base sound with bark
}
