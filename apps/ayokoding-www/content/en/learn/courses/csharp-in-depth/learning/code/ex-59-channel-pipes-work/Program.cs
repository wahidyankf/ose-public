// => Example 59: Channel Pipes Work.
// => A Channel carries plates from writer to reader: Complete ends the stream.
var pipe = System.Threading.Channels.Channel.CreateUnbounded<string>(); // => unbounded: writes never block here

// => the writer serves three plates, then completes: the menu for this demo
await pipe.Writer.WriteAsync("rice"); // => first plate enters the pipe
await pipe.Writer.WriteAsync("rendang"); // => second plate enters the pipe
await pipe.Writer.WriteAsync("sambal"); // => third plate enters the pipe
pipe.Writer.Complete(); // => complete: the reader below sees the end coming

// => ReadAllAsync drains in write order: pipes preserve the serving sequence
await foreach (string plate in pipe.Reader.ReadAllAsync()) // => ends when Complete arrives
{
    Console.WriteLine($"served: {plate}"); // => Output: rice, rendang, sambal in order
}
