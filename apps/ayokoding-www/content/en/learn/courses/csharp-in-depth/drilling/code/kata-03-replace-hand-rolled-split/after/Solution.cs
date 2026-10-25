// Solution: string.Split replaces the hand walk. Same dishes, one call.
// => standard library from Example 31: Split with no empty entries
string line = "rice,rendang,sambal"; // => three dishes separated by commas

// => one call returns the three dishes: the loop above retires entirely
string[] dishes = line.Split(',', StringSplitOptions.RemoveEmptyEntries); // => framework split, exact
Console.WriteLine(string.Join("|", dishes)); // => Output: rice|rendang|sambal
