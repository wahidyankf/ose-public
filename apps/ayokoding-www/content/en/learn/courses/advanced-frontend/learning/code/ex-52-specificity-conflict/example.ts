// Example 52: Resolving a Specificity Conflict by the ID CLASS Type Model. (co-29)
//
// Specificity is the ID--CLASS--TYPE three-column model. When two rules both match an element, the
// rule with more IDs wins; ties fall to more CLASSes; further ties to more TYPEs; final ties to
// source order. A higher-specificity rule ALWAYS beats a later lower-specificity one.
//
// Note: specificity is the ID--CLASS--TYPE three-column model; ties break by source
// order. Source: MDN Specificity
// (https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity).

// A CSS rule: its selector breakdown and the declaration it applies.
interface Rule {
  // => specificity is read off the selector's id/class/type counts
  selector: string; // => e.g. "#nav .item"
  ids: number; // => column 1: ID count
  classes: number; // => column 2: CLASS (and attribute/pseudo-class) count
  types: number; // => column 3: TYPE (and pseudo-element) count
  order: number; // => source order (tiebreaker)
  value: string; // => the declaration, e.g. "color: red"
}

// Two rules both match the SAME element; specificity (not source order) decides the winner.
const rules: Rule[] = [
  // => a later, lower-specificity rule cannot override an earlier, higher-specificity one
  { selector: "nav li", ids: 0, classes: 0, types: 2, order: 1, value: "color: black" }, // => (0,0,2)
  { selector: "#nav .item", ids: 1, classes: 1, types: 0, order: 2, value: "color: blue" }, // => (1,1,0) wins
];

// winnerBySpecificity compares left-to-right: ids, then classes, then types, then source order.
function winnerBySpecificity(candidates: Rule[]): Rule {
  // => co-29: compare column by column; first difference decides; source order is the last tiebreaker
  return candidates.reduce((best, r) => {
    // => higher ids wins outright; else higher classes; else higher types; else later order
    if (r.ids !== best.ids) return r.ids > best.ids ? r : best;
    if (r.classes !== best.classes) return r.classes > best.classes ? r : best;
    if (r.types !== best.types) return r.types > best.types ? r : best;
    return r.order > best.order ? r : best; // => final tiebreaker: source order
  });
}

const winning = winnerBySpecificity(rules); // => the #nav .item rule wins (1,1,0) > (0,0,2)

console.log("winning selector:", winning.selector); // => Output: winning selector: #nav .item
console.log("applied value:", winning.value); // => Output: applied value: color: blue
console.log("specificity (ids,classes,types):", `${winning.ids},${winning.classes},${winning.types}`); // => Output: 1,1,0
