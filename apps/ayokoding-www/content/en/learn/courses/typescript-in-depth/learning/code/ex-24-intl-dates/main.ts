// => Example 24: Intl formats fixed instants; date arithmetic stays in milliseconds.
const instant = new Date(Date.UTC(2026, 9, 21, 0, 0, 0)); // => WHY UTC: no local zone leaks in
const en = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }); // => fixed zone and locale
console.log(en.format(instant)); // => Output: 21 Oct 2026
const jakarta = new Intl.DateTimeFormat("en-GB", {
  // => UTC+7 always
  hour: "2-digit", // => fixed digits
  minute: "2-digit", // => fixed digits
  timeZone: "Asia/Jakarta", // => named zone
}); // => end of jakarta formatter
console.log(jakarta.format(instant)); // => Output: 07:00
const plusDay = new Date(instant.getTime() + 24 * 60 * 60 * 1000); // => WHY ms math: days are exact
console.log(plusDay.getUTCDate()); // => Output: 22
