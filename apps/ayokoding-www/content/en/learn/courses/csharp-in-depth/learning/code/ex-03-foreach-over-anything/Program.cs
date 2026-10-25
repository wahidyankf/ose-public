// => Example 3: Foreach Over Anything.
// => foreach walks any enumerable the same way: arrays, lists, strings.
IEnumerable<string> Toppings() // => local iterator: yields one item at a time
{
    // => yield return pauses here and resumes on the next MoveNext
    yield return "rice"; // => first topping out of the iterator
    yield return "rendang"; // => second topping out of the iterator
    yield return "sambal"; // => third topping out of the iterator
}

// => the same loop shape serves an array, a list, and a yielded sequence
// => one traversal to learn instead of one per collection type
foreach (string item in new[] { "rice", "rendang" }) // => foreach over an array
{
    Console.WriteLine($"pantry: {item}"); // => Output: pantry: rice, then rendang
}

// => List<string> walks exactly like the array above: one shape, many types
// => iterators join the same shape: laziness needs no special loop
foreach (string item in Toppings()) // => foreach over the iterator method
{
    Console.WriteLine($"plate: {item}"); // => Output: plate: rice, rendang, sambal
}
