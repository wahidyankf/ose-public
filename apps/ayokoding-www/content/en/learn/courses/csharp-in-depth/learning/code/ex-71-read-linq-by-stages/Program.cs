// => Example 71: Read LINQ by Stages.
// => Read a pipeline stage by stage: source, filter, shape, then materialize.
var dishes = new[] { "rice", "rendang", "sambal", "soto" }; // => stage zero: the source names four dishes

// => stage one filters by length: only names longer than four letters pass
var longNames = dishes.Where(d => d.Length > 4); // => rice and soto fall out here

// => stage two shapes: upper-case the survivors for the signboard
var sign = longNames.Select(d => d.ToUpperInvariant()); // => RENDANG and SAMBAL take shape

// => stage three materializes: ToList runs the two stages above in one pass
Console.WriteLine(string.Join(",", sign.ToList())); // => Output: RENDANG,SAMBAL
