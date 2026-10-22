// => Example 37: Data Rows Drive Cases.
// => Table checks list cases as data: one row per case, one loop, no copies.
var cases = new (string Dish, int Qty, int Expected)[] // => value tuples: input plus promise
{
    ("rice", 2, 24000), // => row one: two rice at 12000 each
    ("rendang", 1, 25000), // => row two: one rendang at 25000
    ("sambal", 3, 15000), // => row three: three sambal at 5000 each
};

// => the loop runs the same assertion per row: new cases add rows, not code
foreach (var c in cases) // => c carries the dish, quantity, and promise
{
    // => act per row: look up the price and multiply by the quantity
    int got = Price(c.Dish) * c.Qty; // => Price answers from the fixed menu
    // => assert per row: the receipt line must match its promise exactly
    Console.WriteLine($"{c.Dish}: {(got == c.Expected ? "PASS" : "FAIL")}"); // => Output: three PASS lines
}

// => fixed menu: the prices the rows above promise against
int Price(string dish) =>
    dish switch // => local function: dish in, price out
    {
        "rice" => 12000, // => row one depends on this price
        "rendang" => 25000, // => row two depends on this price
        "sambal" => 5000, // => row three depends on this price
        _ => 0, // => unknown dishes cost nothing in this demo
    };
