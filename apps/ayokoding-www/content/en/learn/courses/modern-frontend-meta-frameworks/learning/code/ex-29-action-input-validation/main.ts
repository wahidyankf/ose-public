// Worked Example 29: Action input validation.
// => NusaMart is fictional; every product and quantity here is fixed.
// => Never trust the client: the action re-validates everything the form
// => claimed, and returns field errors the form can render. The server is
// => the last word on shape, range, and existence.

// => Fixed price list: the existence check for every id.
const PRICES: Record<string, number> = { "kopi-001": 68000, "teh-002": 32000 }; // => fictional prices

// => One field error names the field and the rule it broke.
type FieldError = { field: string; rule: string }; // => error shape

// => Validate an add-to-cart intent: unknown id, non-integer qty, and
// => out-of-range qty each produce their own named error, and all errors
// => return together so the form can mark every field at once.
function validate(id: string, qty: number): FieldError[] {
  // => intent validator
  const errors: FieldError[] = []; // => collected errors
  if (PRICES[id] === undefined) {
    // => unknown product
    errors.push({ field: "id", rule: "unknown product" }); // => existence rule
  } // => end of the id branch
  if (!Number.isInteger(qty)) {
    // => non-integer qty
    errors.push({ field: "qty", rule: "must be an integer" }); // => shape rule
  } // => end of the shape branch
  if (qty < 1 || qty > 9) {
    // => out-of-range qty
    errors.push({ field: "qty", rule: "must be 1 to 9" }); // => range rule
  } // => end of the range branch
  return errors; // => every broken rule, at once
} // => end of validate

console.log("valid: " + JSON.stringify(validate("kopi-001", 2))); // => Output []
console.log("unknown id: " + JSON.stringify(validate("susu-009", 2))); // => Output one id error
console.log("bad qty: " + JSON.stringify(validate("kopi-001", 0))); // => Output one qty error
console.log("both bad: " + JSON.stringify(validate("susu-009", 99))); // => Output id plus range errors
export {}; // => module scope keeps these names local
