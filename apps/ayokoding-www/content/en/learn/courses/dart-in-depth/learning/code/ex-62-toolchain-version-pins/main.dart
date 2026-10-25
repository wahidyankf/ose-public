// Example 62: The Toolchain Version Pins the Behavior.
//
// Platform.version names the Dart release running the code, so lessons
// can assert the floor they were proven against instead of hoping. The
// pinned toolchain in apps/ayokoding-cli is the single source of truth:
// this course runs Dart 3.13.5 there, and every example below claims no
// behavior that release does not have.
import 'dart:io'; // => Platform, the handle on the running toolchain

void main() {
  // => the full version string: release, channel, date, and platform
  final full = Platform.version; // => e.g. 3.13.5 (stable) ... on linux_x64
  // => the release number rides first: split on spaces, take the head
  final release = full.split(' ').first; // => 3.13.5: the behavior pin
  // => major and minor name the language generation the code targets
  final generation = release.split('.').take(2).join('.'); // => 3.13 here
  // => the floor assert: this course speaks Dart 3, never Dart 2 habits
  assert(release.startsWith('3.'), 'course needs Dart 3, got $release');
  // => generation pinned: recorded by the harness for this toolchain
  print('dart: $generation'); // => Output: dart: 3.13
  // => full release printed: the exact behavior pin behind every example
  print('release: $release'); // => Output: release: 3.13.5
}
