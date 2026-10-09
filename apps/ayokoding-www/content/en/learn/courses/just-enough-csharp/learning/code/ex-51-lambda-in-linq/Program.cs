var names = new[] { "Ada", "Lin" }; // => source names start with A and L
var initials = names.Select(name => name[0]); // => projection yields the A and L characters
Console.WriteLine(string.Join(",", initials)); // => Output: A,L
