// Captures README screenshots + a demo GIF of the running app (http://localhost:3000).
// Uses the system Chrome via playwright-core; encodes the GIF with gifenc (no ffmpeg).
// Usage: TOKEN=<jwt> node scripts/capture.mjs
import { chromium } from "playwright-core";
import gifenc from "gifenc";
import { PNG } from "pngjs";

const { GIFEncoder, quantize, applyPalette } = gifenc;
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "docs", "screenshots");
const APP = process.env.APP_URL ?? "http://localhost:3000";
const TOKEN = process.env.TOKEN;
if (!TOKEN) throw new Error("Set TOKEN=<jwt> (run scripts/seed-demo.mjs first)");

mkdirSync(OUT, { recursive: true });
mkdirSync(join(ROOT, "docs"), { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });

async function makePage({ theme = "dark", width = 1440, height = 900, scale = 2 }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale,
    colorScheme: theme,
  });
  await ctx.addInitScript(
    ([t, th]) => {
      localStorage.setItem("cloudbox.token", t);
      localStorage.setItem("cloudbox.theme", th);
    },
    [TOKEN, theme]
  );
  const page = await ctx.newPage();
  return { ctx, page };
}

async function gotoHome(page) {
  await page.goto(APP, { waitUntil: "networkidle" });
  await page.waitForSelector('button:has-text("New folder")', { timeout: 15000 });
  await page.waitForTimeout(600); // let glass/animations settle
}

async function shot(page, name) {
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  console.log("✓", name);
}

// Opens the ⋮ actions menu for the card containing `cardText`.
async function openMenu(page, cardText) {
  // div.card = the grid tile (the "Suggested" carousel uses button.card, which has no menu).
  const card = page.locator("div.card", { hasText: cardText }).first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await card.getByRole("button", { name: "Actions" }).click({ force: true });
  await page.getByRole("menuitem", { name: "Move to trash" }).waitFor({ timeout: 8000 });
  return card;
}

async function closeOverlay(page) {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
}

// ---------------- Stills ----------------
{
  const { ctx, page } = await makePage({ theme: "dark" });
  await gotoHome(page);
  await shot(page, "home-dark");

  // Folders page
  await page.goto(`${APP}/folders`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await shot(page, "folders");

  // Open the Documents folder
  await gotoHome(page);
  await page.locator('div.card', { hasText: "Documents" }).first().click();
  await page.waitForTimeout(700);
  await shot(page, "folder-open");

  // Sectioned context menu on a file
  await gotoHome(page);
  await openMenu(page, "Getting Started.pdf");
  await page.waitForTimeout(300);
  await shot(page, "context-menu");

  // Share modal (themed segmented toggle + date)
  await closeOverlay(page);
  await openMenu(page, "Getting Started.pdf");
  await page.getByRole("menuitem", { name: "Share" }).click();
  await page.waitForSelector("text=Create link", { timeout: 8000 });
  await page.waitForTimeout(400);
  await shot(page, "share-modal");

  // Move-to-folder dialog
  await closeOverlay(page);
  await openMenu(page, "Getting Started.pdf");
  await page.getByRole("menuitem", { name: "Move to folder" }).click();
  await page.getByPlaceholder(/Search folders/i).waitFor({ timeout: 8000 });
  await page.waitForTimeout(400);
  await shot(page, "move-dialog");

  await ctx.close();
}

// Light-mode home
{
  const { ctx, page } = await makePage({ theme: "light" });
  await gotoHome(page);
  await shot(page, "home-light");
  await ctx.close();
}

// ---------------- Demo GIF ----------------
{
  const W = 1024, H = 640;
  const { ctx, page } = await makePage({ theme: "dark", width: W, height: H, scale: 1 });
  await gotoHome(page);

  const frames = [];
  const grab = async (n = 1, wait = 120) => {
    for (let i = 0; i < n; i++) {
      frames.push(await page.screenshot({ type: "png" }));
      await page.waitForTimeout(wait);
    }
  };

  await grab(3, 200);                                   // home
  await page.locator('div.card', { hasText: "Documents" }).first().click();
  await page.waitForTimeout(500);
  await grab(3, 200);                                   // inside Documents
  await page.goBack();
  await page.waitForTimeout(500);
  await grab(2, 200);                                   // back home
  await openMenu(page, "Getting Started.pdf");
  await grab(2, 250);                                   // sectioned menu
  await page.getByRole("menuitem", { name: "Move to folder" }).click();
  await page.getByPlaceholder(/Search folders/i).waitFor();
  await grab(2, 250);                                   // move dialog
  await page.getByRole("button", { name: "Photos" }).first().click();
  await page.waitForTimeout(700);
  await grab(3, 250);                                   // moved
  await ctx.close();

  // Encode frames -> animated GIF
  const enc = GIFEncoder();
  for (const buf of frames) {
    const png = PNG.sync.read(buf);
    const data = new Uint8Array(png.data.buffer, png.data.byteOffset, png.data.length);
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    enc.writeFrame(index, png.width, png.height, { palette, delay: 700 });
  }
  enc.finish();
  writeFileSync(join(ROOT, "docs", "demo.gif"), Buffer.from(enc.bytes()));
  console.log("✓ demo.gif", frames.length, "frames");
}

await browser.close();
console.log("done");
