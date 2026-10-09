object value = 7; // => boxed integer 7 can bind to an int pattern
if (value is int number) // => binds the matched integer as number
    Console.WriteLine(number * 2); // => Output: 14
