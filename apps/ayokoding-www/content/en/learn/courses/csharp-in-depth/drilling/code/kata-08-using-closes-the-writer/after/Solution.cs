// Solution: using guarantees the flush. Same note, certain landing.
// => using from Example 8: Dispose flushes and closes on block exit
using (var writer = new System.IO.StreamWriter("note.txt")) // => the writer the block owns
{
    writer.WriteLine("rice x2"); // => lands in the file when the block exits
} // => Dispose flushes here: the note below is guaranteed, not hoped
Console.WriteLine(System.IO.File.ReadAllText("note.txt").Trim()); // => Output: rice x2
