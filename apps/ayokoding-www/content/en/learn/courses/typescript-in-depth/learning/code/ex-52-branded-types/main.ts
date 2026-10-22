// => Example 52: branded types tell apart strings that share a runtime shape.
type Meters = number & { readonly brand: "m" }; // => WHY brand: meters are not seconds
type Seconds = number & { readonly brand: "s" }; // => same runtime, different meaning
function asMeters(n: number): Meters {
  // => the single gate that mints meters
  return n as Meters; // => branding happens once, at the boundary
} // => end of function asMeters(n: number): Meters
function asSeconds(n: number): Seconds {
  // => the single gate that mints seconds
  return n as Seconds; // => branding happens once, at the boundary
} // => end of function asSeconds(n: number): Seconds
function speed(distance: Meters, time: Seconds): number {
  // => mixed units rejected by tsc
  return distance / time; // => plain arithmetic on safe inputs
} // => end of function speed(distance: Meters, time: Seconds): num
console.log(speed(asMeters(100), asSeconds(10))); // => Output: 10
console.log(asMeters(5) + asSeconds(5)); // => Output: 10, brands erase at runtime
