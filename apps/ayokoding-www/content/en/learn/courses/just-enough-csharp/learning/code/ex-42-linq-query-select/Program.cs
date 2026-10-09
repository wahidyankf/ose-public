var xs = new[] { "ada", "lin" }; // => lowercase input contains ada and lin
var upper = from x in xs select x.ToUpper(); // => projection creates ADA and LIN when enumerated
Console.WriteLine(string.Join(",", upper)); // => Output: ADA,LIN
