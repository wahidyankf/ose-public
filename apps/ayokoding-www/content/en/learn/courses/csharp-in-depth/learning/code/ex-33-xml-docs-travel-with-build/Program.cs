// => Example 33: XML Docs Travel with Build.
// => GenerateDocumentationFile writes app.xml beside the dll; this reads it back.
var doc = System.Xml.Linq.XDocument.Load(
    System.IO.Path.Combine(AppContext.BaseDirectory, "app.xml")
); // => the doc file the build generated

// => find the Today member and print the summary the triple-slash wrote
var member = doc.Descendants("member")
    .First(m => (m.Attribute("name")?.Value ?? "").Contains("Today")); // => the documented method below
Console.WriteLine(member.Element("summary")?.Value.Trim()); // => Output: Names the dish of the day.

// => type declarations follow the statements; only members carry XML docs
/// <summary>Holds the documented menu answers.</summary>
public static class Specials // => public: the doc file records visible members
{
    /// <summary>Names the dish of the day.</summary>
    public static string Today() => "rendang"; // => documented member the query finds
}
