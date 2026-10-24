// Example 20: JSON Encodes and Decodes in a Round Trip.
//
// Dart:convert encodes plain maps and lists to JSON text and decodes them
// back, with explicit casts at the boundary where dynamic meets static.
// ToJson methods keep the encoding beside the class; fromJson factories
// rebuild it, so the wire shape lives in exactly one place per type.
import 'dart:convert'; // => jsonEncode and jsonDecode for the wire text

void main() {
  // => the sack as data: strings, numbers, and a nested list, all plain
  final sack = Sack('oat', 12, ['dry', 'graded']); // => const-built below
  // => toJson flattens the object: the map is the wire shape of a sack
  final wire = sack.toJson(); // => Map<String, Object>: encodable directly
  // => jsonEncode renders the map: one line of JSON text, keys quoted
  final text = jsonEncode(wire); // => dart:convert does the rendering
  // => the text is the portable form: storable, sendable, comparable
  print(
      'json: $text'); // => Output: json: {"name":"oat","sacks":12,"tags":["dry","graded"]}
  // => jsonDecode parses back: maps and lists, all typed dynamic
  final back = jsonDecode(text) as Map<String, Object?>; // => cast at once
  // => fromJson rebuilds the object: casts happen inside, checked once
  final rebuilt = Sack.fromJson(back); // => the sack returns, tags intact
  // => round trip proof: the rebuilt sack prints exactly like the first
  print('back: $rebuilt'); // => Output: back: oat (12 sacks) [dry, graded]
}

// Sack is one ledger line: a name, a count, and grading tags.
// => toJson and fromJson live here: the wire shape has one owner
// => equality by value below lets the round trip assert itself
class Sack {
  // => final fields: ledger lines never change after they are written
  final String name; // => the crop name, always present
  final int sacks; // => the count, always a whole number
  final List<String> tags; // => grading tags in the order awarded
  // => const constructor: ledger lines build at compile time
  const Sack(this.name, this.sacks, this.tags);
  // => toJson flattens: field names become the wire keys
  Map<String, Object> toJson() => {'name': name, 'sacks': sacks, 'tags': tags};
  // => fromJson rebuilds: one cast per field, checked in one place
  factory Sack.fromJson(Map<String, Object?> json) {
    // => each field casts once: the boundary where dynamic meets static
    return Sack(json['name'] as String, json['sacks'] as int,
        (json['tags'] as List).cast<String>()); // => tags recast to strings
  }
  // => display form: the shape the round trip proof prints
  // => $tags formats the list itself: brackets and commas come along
  @override
  String toString() => '$name ($sacks sacks) $tags';
}
