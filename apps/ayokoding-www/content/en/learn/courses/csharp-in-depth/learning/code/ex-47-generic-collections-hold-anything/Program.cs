// => Example 47: Generic Collections Hold Anything.
// => List and Dictionary take any T: one collection shape, every item type.
var prices = new Dictionary<string, int> // => string keys, int values: T named twice
{
    ["rice"] = 12000, // => add through the indexer: upsert in one move
    ["rendang"] = 25000, // => second pair joins the same table
};

// => Keys reports the table contents: sorted here for a stable transcript
Console.WriteLine(string.Join(",", prices.Keys.OrderBy(k => k, StringComparer.Ordinal))); // => Output: rendang,rice

// => Stack is last-in-first-out: the last plate stacked serves first
var stack = new Stack<string>(); // => generic stack of dish names
stack.Push("rice"); // => first in sits at the bottom
stack.Push("rendang"); // => last in sits on top, served first
Console.WriteLine(stack.Pop()); // => Output: rendang
