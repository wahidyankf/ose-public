// => Example 27: One Type per File.
// => Small projects keep one type per file: Program starts, Catalog answers.
// => this file holds the entry point only; Catalog.cs beside it holds the data
Console.WriteLine($"today: {Catalog.Today()}"); // => Output: today: rendang
Console.WriteLine($"count: {Catalog.Dishes().Count}"); // => Output: count: 3
