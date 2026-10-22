// => Example 69: Sizeof Maps the Interop Edge.
// => Marshal.SizeOf reports the unmanaged size: the number the native side sees.
Console.WriteLine($"int: {System.Runtime.InteropServices.Marshal.SizeOf<int>()}"); // => Output: int: 4
Console.WriteLine($"long: {System.Runtime.InteropServices.Marshal.SizeOf<long>()}"); // => Output: long: 8
Console.WriteLine($"char: {System.Runtime.InteropServices.Marshal.SizeOf<char>()}"); // => Output: char: 1

// => sizes are platform facts the runtime answers: no guessing at the boundary
Console.WriteLine($"byte: {sizeof(byte)}"); // => Output: byte: 1

// => Guid spans 16 bytes: the size a native GUID struct must also reserve
Console.WriteLine($"guid: {System.Runtime.InteropServices.Marshal.SizeOf<Guid>()}"); // => Output: guid: 16
