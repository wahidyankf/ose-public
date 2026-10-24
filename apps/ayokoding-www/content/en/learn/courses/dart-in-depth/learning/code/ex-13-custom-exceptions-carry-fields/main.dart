// Example 13: Custom Exceptions Carry Fields.
//
// A custom exception class names the failure and carries the values the
// handler needs: which sack, how many, what was expected. Catching the
// class recovers those fields with types, not by parsing a message.
void main() {
  // => two deliveries: one within quota, one over it
  print(deliver('oat', 10)); // => Output: delivered 10 sacks of oat
  // => the over-quota delivery throws fields: caught and read below
  try {
    // => this call throws: the refusal travels as a QuotaExceeded
    print(deliver('rice', 99)); // => never prints: 99 exceeds the quota
  } on QuotaExceeded catch (e) {
    // => the custom class: fields arrive typed
    // => allows and asked arrive as ints: formatted without parsing
    print(e); // => Output: quota exceeded: rice allows 50, asked 99
  }
}

// QuotaExceeded names the failure and carries the three numbers that
// explain it. It implements Exception so on-catch clauses can name it.
// => fields over messages: handlers read values, never parse sentences
// => const constructor: the failure value builds at compile time
class QuotaExceeded implements Exception {
  // => final fields: a failure value never changes after it is raised
  final String item; // => which goods broke the quota
  final int allows; // => the quota the store enforces
  final int asked; // => the delivery the driver attempted
  // => const constructor: failures are values, cheap to build
  const QuotaExceeded(this.item, this.allows, this.asked);
  // => message reads the fields: humans get the sentence, code gets fields
  @override
  String toString() => 'quota exceeded: $item allows $allows, asked $asked';
}

// deliver accepts a delivery inside quota and refuses one outside it.
// => the return is the receipt; the throw is the refusal with evidence
// => handlers catch QuotaExceeded and read allows and asked as ints
String deliver(String item, int sacks) {
  // => the store quota: fifty sacks per item, no exceptions to the rule
  const quota = 50; // => const: policy is a compile-time fact
  // => over quota throws the custom failure with all three fields set
  if (sacks > quota) {
    // => the refusal condition, checked first
    throw QuotaExceeded(item, quota, sacks); // => fields, not just words
  }
  // => inside quota, the easy path: build the receipt and return it
  return 'delivered $sacks sacks of $item'; // => the success sentence
}
