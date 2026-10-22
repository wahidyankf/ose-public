// => Example 25: Offset Anchors Instants.
// => DateTimeOffset pins the instant plus its offset: no time-zone database needed.
var lunch = new DateTimeOffset(2026, 10, 21, 12, 0, 0, TimeSpan.FromHours(7)); // => noon in Jakarta, fixed instant

// => ToUniversalTime shifts the same instant to offset zero, date math stays exact
Console.WriteLine(lunch.ToUniversalTime().ToString("HH:mm")); // => Output: 05:00

// => ToUnixTimeSeconds counts seconds since the epoch: one fixed number
Console.WriteLine(lunch.ToUnixTimeSeconds()); // => Output: 1792558800

// => the offset itself prints as seven hours: the anchor travels with the value
Console.WriteLine(lunch.Offset); // => Output: 07:00:00
