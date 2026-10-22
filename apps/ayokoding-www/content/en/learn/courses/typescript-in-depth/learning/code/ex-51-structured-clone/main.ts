// => Example 51: structuredClone deep-copies plain data, including Dates and Maps.
const src = { who: "ada", at: new Date(Date.UTC(2026, 0, 1)), tags: new Map([["lang", "ts"]]) }; // => nested payload
const copy = structuredClone(src); // => WHY structuredClone: full depth, real classes kept
copy.tags.set("lang", "js"); // => mutate the copy's map
copy.at.setUTCFullYear(2000); // => mutate the copy's date
console.log(src.tags.get("lang"), src.at.getUTCFullYear()); // => Output: ts 2026, original intact
console.log(copy.tags.get("lang"), copy.at.getUTCFullYear()); // => Output: js 2000, copy changed
console.log(copy.who); // => Output: ada
