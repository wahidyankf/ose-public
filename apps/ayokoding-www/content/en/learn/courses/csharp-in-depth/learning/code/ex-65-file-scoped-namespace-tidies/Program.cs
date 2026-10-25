// => Example 65: File Scoped Namespace Tidies.
// => One line scopes the file: namespace Warung, no braces, no indent tax.
// => file-scoped namespace: the whole file below joins Warung
namespace Warung; // => semicolon, not braces: the file is the scope

// => explicit Program: file-scoped files name their entry point plainly
static class Program // => static: the entry point holds no instance state
{
    static void Main() // => Main: the runtime starts here
    {
        // => Stove lives in the same file scope: no qualification needed
        System.Console.WriteLine(Stove.DishOfTheDay()); // => Output: rendang
    }
}

// => Stove shares the file scope: same namespace, zero nesting added
static class Stove // => static: a bag of answers, never instantiated
{
    // => expression body: the file-scoped style favors short members
    public static string DishOfTheDay() => "rendang"; // => one line, one answer
}
