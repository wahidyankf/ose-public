// Starter: hand-rolled splitter walks characters. The smell: framework does this.
// => replace the loop below with string.Split following Example 31
string line = "rice,rendang,sambal"; // => three dishes separated by commas
var dishes = new List<string>(); // => the loop below fills this by hand
string current = ""; // => accumulates characters between commas
foreach (char c in line) // => hand walk: every character inspected manually
{
    if (c == ',') // => comma ends the current dish
    {
        dishes.Add(current); // => flush the accumulation into the list
        current = ""; // => restart the accumulation after each comma
    }
    else // => ordinary character: join the current dish
    {
        current += c; // => string concat per character: slow and noisy
    }
}
dishes.Add(current); // => flush the trailing dish after the loop
Console.WriteLine(string.Join("|", dishes)); // => rice|rendang|sambal, the hard way
