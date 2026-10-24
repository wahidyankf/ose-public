// => Example 18: String Builder Joins Lines.
// => StringBuilder appends without re-allocating the whole string per line.
var ticket = new System.Text.StringBuilder(); // => mutable buffer, not a string yet

// => AppendLine adds the line plus the newline: no plus operator in sight
ticket.AppendLine("warung sari"); // => header line lands in the buffer first
ticket.AppendLine("rice x2"); // => order lines accumulate without copies
ticket.AppendLine("rendang x1"); // => each Append mutates the same buffer

// => ToString freezes the buffer into one string exactly once, at the end
Console.Write(ticket.ToString()); // => Output: the three lines above, each ended

// => Length reports the built characters: 11 plus 7 plus 10 plus 3 newlines
Console.WriteLine($"chars: {ticket.Length}"); // => Output: chars: 31
