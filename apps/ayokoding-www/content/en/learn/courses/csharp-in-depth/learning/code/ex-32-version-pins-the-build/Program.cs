// => Example 32: Version Pins the Build.
// => Version in the csproj stamps the assembly: readers can ask what they run.
var version = typeof(Program).Assembly.GetName().Version; // => Program names this assembly itself

// => the csproj pins 1.2.3: the stamp below proves the pin traveled into the binary
Console.WriteLine($"menu-api: {version}"); // => Output: menu-api: 1.2.3.0

// => top-level programs still expose their assembly through typeof(Program)
Console.WriteLine($"name: {typeof(Program).Assembly.GetName().Name}"); // => Output: name: app
