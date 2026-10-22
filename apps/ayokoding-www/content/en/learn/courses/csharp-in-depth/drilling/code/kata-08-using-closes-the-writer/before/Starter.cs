// Starter: StreamWriter never disposed. The leak: the flush may never land.
// => wrap in using following Example 8 so disposal is guaranteed
var writer = new System.IO.StreamWriter("note.txt"); // => opened, never closed below
writer.WriteLine("rice x2"); // => sits in the buffer: flush uncertain
Console.WriteLine("wrote note.txt"); // => claims the write without guaranteeing it
