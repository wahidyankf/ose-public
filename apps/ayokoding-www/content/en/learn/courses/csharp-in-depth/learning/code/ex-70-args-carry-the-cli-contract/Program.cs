// => Example 70: Args Carry the CLI Contract.
// => The harness runs this with --format json sari: args arrive verbatim.
// => Length first: the contract starts with how many words followed the dll
Console.WriteLine($"args: {args.Length}"); // => Output: args: 3

// => echo every argument with its position: order is part of the contract
for (int i = 0; i < args.Length; i++) // => index loop: position matters here
{
    Console.WriteLine($"[{i}]={args[i]}"); // => Output: [0]=--format, [1]=json, [2]=sari
}

// => Contains checks flags without caring where they sit in the order
Console.WriteLine($"json: {args.Contains("--format")}"); // => Output: json: True
