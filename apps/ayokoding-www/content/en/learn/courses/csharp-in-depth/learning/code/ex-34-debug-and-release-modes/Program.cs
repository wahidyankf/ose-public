// => Example 34: Debug and Release Modes.
// => DEBUG is defined for debug builds only: the same source prints its mode.
#if DEBUG // => debug builds define this symbol automatically
Console.WriteLine("mode: debug"); // => Output in the debug run: mode: debug
#else // => release builds take this arm instead
Console.WriteLine("mode: release"); // => Output in the release run: mode: release
#endif
