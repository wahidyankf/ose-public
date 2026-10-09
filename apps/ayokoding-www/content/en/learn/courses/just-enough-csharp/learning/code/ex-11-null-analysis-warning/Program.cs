string? name = Console.ReadLine(); // => input may return null
Console.WriteLine(name.Length); // => CS8602 warning: possible null dereference
