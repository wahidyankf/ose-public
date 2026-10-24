// => Example 31: Stdlib Only, No Restore.
// => No PackageReference means restore is a no-op: this unit builds offline.
var menu = new[] { "rice", "rendang", "sambal" }; // => array literal: BCL type, no package

// => string.Join and OrderBy both ship in the shared framework itself
string line = string.Join(" | ", menu.OrderBy(m => m, StringComparer.Ordinal)); // => sorted, joined
Console.WriteLine(line); // => Output: rendang | rice | sambal

// => the csproj beside this file names zero packages: that absence is the lesson
Console.WriteLine($"items: {menu.Length}"); // => Output: items: 3
