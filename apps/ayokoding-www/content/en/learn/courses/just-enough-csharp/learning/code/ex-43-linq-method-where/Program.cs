var xs = new[] { 1, 2, 3, 4 }; // => input contains two even numbers
var even = xs.Where(x => x % 2 == 0); // => predicate retains 2 and 4 when enumerated
Console.WriteLine(string.Join(",", even)); // => Output: 2,4
