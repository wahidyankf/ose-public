// => Example 26: Namespaces Organize Code.
// => Namespaces group related types: the menu below lives in Warung.Menu.
// => file-scoped namespace: everything in this file joins Warung.Menu
namespace Warung.Menu; // => one line scopes the whole file, no braces needed

// => explicit Program: with a namespace present, Main replaces top-level code
static class Program // => static: the entry point holds no instance state
{
    static void Main() // => Main: the runtime calls this method to start
    {
        // => fully qualified name: namespace plus type, unambiguous everywhere
        System.Console.WriteLine(Warung.Menu.Specials.Today()); // => Output: rendang
    }
}

// => Specials lives in the same namespace, so Main reaches it directly
static class Specials // => static: a bag of functions, never instantiated
{
    // => Today answers the one question the menu always asks
    public static string Today() => "rendang"; // => expression body: one line, one answer
}
