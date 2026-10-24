// => Example 64: Names Follow the Guide.
// => PascalCase for members, camelCase for locals, _camelCase for private fields.
var kitchen = new Kitchen("Sari"); // => local is camelCase: starts lowercase
Console.WriteLine(kitchen.HeadChef); // => Output: Sari
Console.WriteLine(kitchen.OpenOrder("rendang")); // => Output: rendang x1

// => type follows the statements; its members show the three casings at once
class Kitchen // => PascalCase type: nouns for types, verbs for methods
{
    private readonly string _headChef; // => _camelCase field: private state

    public Kitchen(string headChef) => _headChef = headChef; // => parameter is camelCase

    public string HeadChef => _headChef; // => PascalCase property: public face

    public string OpenOrder(string dish) => $"{dish} x1"; // => PascalCase method, camelCase parameter
}
