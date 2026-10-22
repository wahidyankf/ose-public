// => Catalog.cs: the data type for Example 27, living in its own file.
// => one public type per file: findable by name, reviewable in isolation
static class Catalog // => static: shared menu data, never instantiated
{
    // => Today answers the headline question the menu always asks first
    public static string Today() => "rendang"; // => expression body: one line, one answer

    // => Dishes lists the full menu: a new list per call, safe to share
    public static List<string> Dishes() => new() { "rice", "rendang", "sambal" }; // => target-typed new keeps it short
}
