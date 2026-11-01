#!/usr/bin/env node
// node scripts/photo-dimensions.mjs <image>...
//
// Prints the src/lib/data entry for each image. Point it at new files in a checkout of hackathon-static
// and paste the lines into the gallery's list. Chrome does the measuring, because the size a gallery
// has to reserve is the one a browser renders: many of these photos carry an EXIF rotation that swaps
// width and height, and the size stored in the file's header does not show it.
import { chromium } from '@playwright/test';
import { basename, resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
for (const path of process.argv.slice(2)) {
  await page.goto(pathToFileURL(resolve(path)).href);
  const [width, height] = await page.locator('img').evaluate((image) => [image.naturalWidth, image.naturalHeight]);
  if (!width || !height) throw new Error(`Chrome could not read ${path}`);
  process.stdout.write(`  { filename: '${basename(path)}', width: ${width}, height: ${height} },\n`);
}
await browser.close();
