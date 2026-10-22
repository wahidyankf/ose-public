// => Example 25: Intl numbers plus TextEncoder cover display text and bytes.
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }); // => fixed-locale money
console.log(money.format(1234.5)); // => Output: $1,234.50
const pct = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 }); // => fixed digits
console.log(pct.format(0.256)); // => Output: 25.6%
const bytes = new TextEncoder().encode("ada \u2713"); // => WHY encoder: strings to UTF-8 bytes
console.log(bytes.length); // => Output: 7, the check mark costs three bytes
const back = new TextDecoder().decode(bytes); // => bytes back to string
console.log(back); // => Output: ada \u2713
