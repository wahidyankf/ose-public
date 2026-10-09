Console.WriteLine(Max(2, 5)); // => Output: 5
static T Max<T>(T a, T b) // => returns whichever comparable input is larger
    where T : IComparable<T> => a.CompareTo(b) > 0 ? a : b; // => CompareTo selects 5 over 2 under the type constraint
