// => Example 45: One Min for All Types.
// => A generic method with IComparable works for every orderable type at once.
// => one method serves ints, strings, and dates: the constraint names the power
Console.WriteLine(Min(12000, 25000)); // => Output: 12000
Console.WriteLine(Min("rice", "rendang")); // => Output: rendang

// => generic Min: T must compare itself, or the method cannot choose
T Min<T>(T a, T b)
    where T : IComparable<T> // => the constraint is the contract
{
    // => CompareTo decides: negative means a sorts first, so a wins
    return a.CompareTo(b) <= 0 ? a : b; // => one body, every orderable T
}
