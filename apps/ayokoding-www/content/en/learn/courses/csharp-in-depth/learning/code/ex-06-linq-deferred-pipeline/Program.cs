// => Example 6: LINQ Deferred Pipeline.
// => Where and Select build a query; nothing runs until you enumerate it.
var scores = new List<int> { 41, 55, 68, 72 }; // => the source the query reads

// => no loop runs here: passing and withHonors only describe the pipeline
var passing = scores.Where(s => s >= 60); // => Where keeps scores of 60 and up
var withHonors = passing.Select(s => s + 5); // => Select adds the honors bonus
scores.Add(59); // => late arrival: the query has not run yet, so it still sees this

// => ToList enumerates now: the late 59 plus bonus flows through the pipeline
Console.WriteLine(string.Join(",", withHonors.ToList())); // => Output: 73,77

// => the source list itself never changed: queries project, they do not mutate
Console.WriteLine($"source still: {scores.Count}"); // => Output: source still: 5
