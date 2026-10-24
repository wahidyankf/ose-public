// Starter: Total has no check. The gap: nothing pins the promised 37000.
// => write the Check from Example 35 around Total, then make it pass
int Total() => new List<int> { 12000, 25000 }.Sum(); // => the behavior to pin
Console.WriteLine(Total()); // => prints 37000 today: a check would keep it so
