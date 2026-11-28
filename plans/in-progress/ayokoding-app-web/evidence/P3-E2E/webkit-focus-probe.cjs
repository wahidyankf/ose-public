const { webkit } = require("<repo>/node_modules/playwright-core");
(async () => {
  for (const key of ["Tab", "Alt+Tab"]) {
    const browser = await webkit.launch();
    const page = await browser.newPage();
    await page.goto("http://127.0.0.1:3290/en");
    await page.keyboard.press(key);
    const focused = await page.evaluate(() => ({
      tag: document.activeElement?.tagName ?? "",
      className: document.activeElement?.className ?? "",
      href: document.activeElement?.getAttribute("href") ?? "",
    }));
    console.log(key, JSON.stringify(focused));
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
