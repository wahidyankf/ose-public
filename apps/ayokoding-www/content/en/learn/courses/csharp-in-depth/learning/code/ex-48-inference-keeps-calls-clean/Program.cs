// => Example 48: Inference Keeps Calls Clean.
// => The compiler infers T from the arguments: write Swap once, call it plainly.
string first = "rice"; // => two strings to swap: T infers as string
string second = "rendang"; // => the swap below exchanges these two
Swap(ref first, ref second); // => no type arguments: string is inferred

// => inference read the arguments: first now holds rendang, second holds rice
Console.WriteLine($"{first},{second}"); // => Output: rendang,rice

// => explicit arguments still work: the noisy form means the same thing
Swap<string>(ref first, ref second); // => explicit T: swaps them back again
Console.WriteLine($"{first},{second}"); // => Output: rice,rendang

// => ref passes the variables themselves: the swap sticks after the call
void Swap<T>(ref T a, ref T b) // => local function: generic over any T
{
    // => tuple deconstruction swaps without any temporary variable
    (a, b) = (b, a); // => right side reads first, then both assign at once
}
