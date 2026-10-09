Console.WriteLine(string.Join(",", NonNull(new string?[] { "a", null, "b" }))); // => Output: a,b
static IEnumerable<T> NonNull<T>(IEnumerable<T?> xs) // => returns an enumerable of non-null T
    where T : class => xs.Where(x => x is not null).Select(x => x!); // => filters nulls before the non-null assertion
