// Kata 3 starter: the test asserts only the confirmation banner. The banner
// renders for any 200 -- including one that saved the wrong item -- so the
// test passes while the order is wrong.
// Task: intercept the request and assert on its payload (see Example 28).
// The test must fail when the payload is wrong and pass when it is right.
async function main(): Promise<void> {
  const banner = "Order confirmed"; // the UI always says this on 200
  const savedItem = "bread"; // ...but the backend saved the wrong item
  const pass: boolean = banner === "Order confirmed"; // pixels only: blind to the payload
  console.log("banner shown: " + String(pass));
  console.log("saved item: " + savedItem);
  console.log("test blind to payload: " + String(pass && savedItem !== "milk"));
}

await main();
