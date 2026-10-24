// => Example 55: When All Fans Out.
// => WhenAll starts every task, then awaits them together: the join is one line.
var rice = Task.FromResult("rice"); // => completed task: no thread, no timing
var rendang = Task.FromResult("rendang"); // => second completed task beside it
var sambal = Task.FromResult("sambal"); // => third completed task beside those

// => WhenAll joins the three: results arrive in task order, always
string[] plates = await Task.WhenAll(rice, rendang, sambal); // => order follows the arguments

// => Join prints the joined results in the same fixed order every run
Console.WriteLine(string.Join(",", plates)); // => Output: rice,rendang,sambal
