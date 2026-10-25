// => Example 30: Target Framework Pins Runtime.
// => TargetFramework names the runtime: NET10_0 is defined only for net10.0.
string moniker = // => the moniker below is chosen at compile time, not runtime
#if NET10_0 // => defined by the SDK when TargetFramework is net10.0
    "net10.0"; // => matches the csproj TargetFramework exactly
#else // => any other framework would take this arm instead
    "other"; // => unreachable while the csproj pins net10.0
#endif

// => the printed moniker proves which framework compiled this binary
Console.WriteLine($"runs on: {moniker}"); // => Output: runs on: net10.0
