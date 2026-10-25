// => Example 11: custom errors plus cause chain each layer's context.
class ConfigError extends Error {
  // => WHY subclass: catch sites filter by type
  constructor(message: string, options?: { cause?: unknown }) {
    // => cause links the layer below
    super(message, options); // => Error keeps name, message, and cause
    this.name = "ConfigError"; // => stable name across the chain
  } // => end of constructor(message: string, options?: { cause?: unk
} // => end of class ConfigError extends Error
function loadPort(raw: string): number {
  // => stringly config to validated port
  const port = Number(raw); // => coercion first
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    // => range policy in one test
    throw new ConfigError(`bad port: ${raw}`, { cause: `parsed as ${String(port)}` }); // => both layers kept
  } // => end of if (!Number.isInteger(port) || port < 1 || port > 65
  return port; // => valid port escapes
} // => end of function loadPort(raw: string): number
try {
  // => single risky call below
  loadPort("abc"); // => NaN fails the integer test
} catch (err) {
  // => filter by the custom type
  if (err instanceof ConfigError) {
    // => only ConfigError lands here
    console.log(err.name, "-", err.message, "| cause:", String(err.cause)); // => Output: ConfigError - bad port
  } // => end of if (err instanceof ConfigError)
} // => end of catch (err)
console.log(loadPort("3101")); // => Output: 3101
