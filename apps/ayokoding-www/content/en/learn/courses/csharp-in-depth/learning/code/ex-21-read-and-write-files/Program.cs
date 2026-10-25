// => Example 21: Read and Write Files.
// => WriteAllText then ReadAllText round-trips a small file through the disk.
string name = "today.txt"; // => relative name: lives beside the binary, portable

// => Combine joins segments with the platform separator, no hardcoded slash
string path = Path.Combine(".", name); // => ./today.txt on every platform here
File.WriteAllText(path, "rice x2\nrendang x1\n"); // => the whole menu in one call

// => ReadAllText brings the exact bytes back: the round trip proves the write
string back = File.ReadAllText(path); // => back equals what the write stored
Console.Write(back); // => Output: rice x2, then rendang x1, each on its line

// => Exists confirms the file the write created before this process exits
Console.WriteLine($"exists: {File.Exists(path)}"); // => Output: exists: True
