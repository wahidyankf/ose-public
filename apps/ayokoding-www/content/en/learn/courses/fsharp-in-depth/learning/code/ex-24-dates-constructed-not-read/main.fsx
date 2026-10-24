// => Example 24: a fixed date built from parts, formatted explicitly.
open System.Globalization // => InvariantCulture lives here.
// => Construct, never read: every field below is fixed in the script.
let release = System.DateTime(2026, 10, 21, 9, 30, 0, System.DateTimeKind.Unspecified) // => the fixed instant.
// => TimeSpan arithmetic stays in the date domain: plus fourteen days exactly.
let review = release.Add(System.TimeSpan.FromDays(14.0)) // => 2026-11-04 09:30.
// => Explicit pattern plus invariant culture: identical text on every machine.
let stamp = release.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture) // => 2026-10-21 09:30.
// => Weekday reads back from the constructed value, never from the clock.
let day = review.DayOfWeek.ToString() // => Tuesday: derived, not observed.
printfn "release=%s review=%s weekday=%s" stamp (review.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)) day // => release=2026-10-21 09:30 review=2026-11-04 weekday=Tuesday.
