// => Example 23: Date and TimeOnly.
// => DateOnly carries the calendar day; TimeOnly carries the wall-clock time.
var open = new DateOnly(2026, 10, 21); // => fixed date: no clock read anywhere
var opensAt = new TimeOnly(9, 0); // => the warung opens at nine sharp
var closesAt = new TimeOnly(21, 0); // => and closes at nine in the evening

// => AddDays moves the calendar without touching any clock or time zone
Console.WriteLine(open.AddDays(1).ToString("yyyy-MM-dd")); // => Output: 2026-10-22

// => TimeOnly subtracts to a TimeSpan: the open window measures twelve hours
Console.WriteLine(closesAt - opensAt); // => Output: 12:00:00

// => DayOfWeek names the weekday of the fixed date above
Console.WriteLine(open.DayOfWeek); // => Output: Wednesday
