var user = new User("Ada"); // => required construction state
Console.WriteLine(user.Name); // => Output: Ada

class User(string name) // => captures the required name argument
{
    public string Name { get; } = name; // => getter exposes the captured name
}
