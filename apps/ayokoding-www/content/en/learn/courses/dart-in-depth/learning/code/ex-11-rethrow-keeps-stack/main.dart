// Example 11: Rethrow Keeps the Stack Trace.
//
// Catch, note the failure, and rethrow when the layer cannot answer it.
// Rethrow preserves the original trace; throwing a new exception would
// point at the handler instead of the true failure site.
void main() {
  // => the outer boundary answers what the inner layer could not
  try {
    // => load fails deep inside: the inner layer notes it and rethrows
    loadConfig('missing.cfg'); // => throws: the file is not there
  } catch (e) {
    // => the boundary catches the rethrown original
    // => message names the file: the trace still points at the real site
    print(
        'startup failed: $e'); // => Output: startup failed: config missing.cfg not found
  }
}

// loadConfig reads a config file it cannot live without.
// => it notes the failure for the log, then rethrows for the boundary
// => the boundary decides: this layer only adds context, not answers
void loadConfig(String name) {
  // => attempt the read that may fail
  try {
    // => the only config that exists is default.cfg: anything else fails
    if (name != 'default.cfg') {
      // => missing file: the failure condition
      throw Exception('config $name not found'); // => throw with the name in
    }
  } catch (e) {
    // => catch to note, not to answer
    // => the note goes out now: operators see the failure as it happens
    print(
        'note: $e'); // => Output: note: Exception: config missing.cfg not found
    // => rethrow, never throw: the original trace survives to the boundary
    rethrow; // => same exception, original trace: the boundary sees truth
  }
}
