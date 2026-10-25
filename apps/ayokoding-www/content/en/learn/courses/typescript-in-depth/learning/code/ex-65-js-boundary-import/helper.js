// => Example 65 file 1: plain JavaScript helper owned by another team.
function shout(text) {
  // => untyped parameters: JavaScript as shipped
  return String(text).trim().toUpperCase(); // => loud normalized text
} // => end of function shout(text)
module.exports = { shout }; // => CommonJS export shape
