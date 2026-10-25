// => Example 63: Pragma Tames One Warning.
// => pragma warning disable silences one warning ID in the smallest scope.
#pragma warning disable CS0219 // => unused variable below: acknowledged, not fixed
int reservedTables = 4; // => kept for the seating plan: intentionally unread
#pragma warning restore CS0219 // => restore: later warnings fire normally again
// => the gated build treats warnings as errors: this file still passes clean
Console.WriteLine("seating plan kept"); // => Output: seating plan kept

// => reservedTables stays unread on purpose: the pragma names the exact ID
Console.WriteLine("tables held for regulars"); // => Output: tables held for regulars
