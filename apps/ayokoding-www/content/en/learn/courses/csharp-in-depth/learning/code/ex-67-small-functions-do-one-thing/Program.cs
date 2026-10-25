// => Example 67: Small Functions Do One Thing.
// => Expression-bodied members keep one-liners visible: name, arrow, answer.
Console.WriteLine(Label("rendang", 25000)); // => Output: rendang: 25000
Console.WriteLine(Total(12000, 25000)); // => Output: 37000

// => each helper below does exactly one thing its name already promises
string Label(string dish, int price) => $"{dish}: {price}"; // => format one receipt line
int Total(int first, int second) => first + second; // => add two lines, nothing else
bool Pricey(int price) => price > 20000; // => one comparison, one boolean answer

// => the third helper joins the transcript: rendang clears the pricey bar
Console.WriteLine($"pricey: {Pricey(25000)}"); // => Output: pricey: True
