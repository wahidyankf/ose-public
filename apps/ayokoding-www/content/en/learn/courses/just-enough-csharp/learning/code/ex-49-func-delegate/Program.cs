Func<string, int> length = text => text.Length; // => delegate maps text to its length
Console.WriteLine(length("C#")); // => Output: 2
