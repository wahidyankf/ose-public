// => Example 29: Program Class Shape.
// => The classic shape names its entry point: class Program with static Main.
// => no top-level statements here: Main below is the only entry point
static class Program // => static: the entry point holds no instance state
{
    static void Main(string[] args) // => args arrive from the command line
    {
        // => Length reports how many words followed the dll name, if any
        System.Console.WriteLine($"args: {args.Length}"); // => Output: args: 0
        // => Greet is a private helper: Main stays the only public story
        System.Console.WriteLine(Greet("Sari")); // => Output: hello, Sari
    }

    // => private helper: the greeting logic lives outside Main but beside it
    private static string Greet(string name) => $"hello, {name}"; // => one line, one answer
}
