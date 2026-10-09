var text = "ready,steady"; // => comma separates the two words in the source
var parts = text.ToUpper().Split(','); // => transforms and splits
Console.WriteLine($"{parts[1]}:{text.Contains(",")}"); // => Output: STEADY:True
