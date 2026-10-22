// Example 21: Uri Parses Addresses into Parts.
//
// Uri.parse splits an address into scheme, host, path, and decoded query
// parameters, so code reads parts instead of slicing strings. Uri.https
// builds addresses from parts, encoding query values that need it.
void main() {
  // => one catalog address with two query parameters, one encoded
  const address = 'https://pantry.example.com/catalog?crop=oat&note=grade%20A';
  // => parse splits once: every part below reads from this object
  final uri = Uri.parse(address); // => never throws for a valid address
  // => scheme and host name the destination: the routing pair
  print(
      'host: ${uri.scheme}://${uri.host}'); // => Output: host: https://pantry.example.com
  // => path names the resource inside the host: the catalog page
  print('path: ${uri.path}'); // => Output: path: /catalog
  // => queryParameters decodes: %20 is already a space again here
  print('crop: ${uri.queryParameters['crop']}'); // => Output: crop: oat
  // => decoded value: percent-encoding never leaks into the reading
  print('note: ${uri.queryParameters['note']}'); // => Output: note: grade A
  // => Uri.https builds from parts: host, path, then the query map
  final built =
      Uri.https('pantry.example.com', '/order', {'crop': 'tea', 'sacks': '4'});
  // => values encode automatically: spaces would become %20 on their own
  print(
      'built: $built'); // => Output: built: https://pantry.example.com/order?crop=tea&sacks=4
}
