// Example 2: For Loops Come in Three Shapes.
//
// Dart repeats with for-in over values, a counted for over indexes, and
// forEach when the body is already a function. Each shape below sums the
// same list so you can match the shape to the job.
void main() {
  // => one list feeds all three loop shapes below
  final nums = [1, 2, 3, 4]; // => final: the binding never points elsewhere
  // => for-in reads each value directly: no index to get wrong
  var total = 0; // => accumulator starts at the additive identity
  // => value takes each element in turn, first to last
  for (final value in nums) {
    // => for-in: the shape for whole collections
    total += value; // => add the value itself, not nums[i]
  }
  // => counted for owns the index: the shape for neighbors and windows
  print('for-in: $total'); // => Output: for-in: 10
  var indexed = 0; // => second accumulator, same identity start
  // => i walks the valid indexes; length keeps the bound always correct
  for (var i = 0; i < nums.length; i++) {
    // => counted: init, test, step
    indexed += nums[i]; // => index access when position itself matters
  }
  // => forEach takes a function: the shape when the body already exists
  print('indexed: $indexed'); // => Output: indexed: 10
  var each = 0; // => third accumulator for the callback shape
  // => the closure runs once per element in encounter order
  nums.forEach((value) {
    // => forEach: value in, no result out
    each += value; // => closure captures the accumulator from outside
  });
  // => all three shapes agree: the list sums to ten
  print('forEach: $each'); // => Output: forEach: 10
}
