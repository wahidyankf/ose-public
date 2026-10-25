// => Example 24: TimeSpan Arithmetic.
// => TimeSpan measures durations: parse it, add it, compare it, print it.
var simmer = TimeSpan.FromHours(4); // => rendang simmers four hours, fixed span
var prep = TimeSpan.FromMinutes(30); // => prep adds a fixed half hour

// => spans add like numbers: the whole cook takes four and a half hours
Console.WriteLine(simmer + prep); // => Output: 04:30:00

// => Parse reads the colon shape back into the same four-hour span
Console.WriteLine(TimeSpan.Parse("4:00:00") == simmer); // => Output: True

// => TotalMinutes reports the duration in one unit: 270 minutes exactly
Console.WriteLine((simmer + prep).TotalMinutes); // => Output: 270
