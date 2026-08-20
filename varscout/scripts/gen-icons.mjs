/**
 * Rasterize src/app/icon.svg into the PNG sizes the manifest and Apple touch
 * icon need. One-time build utility; re-run if the icon changes.
 */
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = join(root, "src", "app", "icon.svg");
const svg = readFileSync(svgPath, "utf8");

const render = (width) =>
  new Resvg(svg, { fitTo: { mode: "width", value: width }, background: "transparent" })
    .render()
    .asPng();

const targets = [
  [192, join(root, "public", "icon-192.png")],
  [512, join(root, "public", "icon-512.png")],
  [180, join(root, "src", "app", "apple-icon.png")],
];

for (const [size, out] of targets) {
  writeFileSync(out, render(size));
  console.log(`wrote ${out.replace(root, ".")} (${size}x${size})`);
}

// The console gallery and SiteLogo components fetch the SVG from the live URL.
copyFileSync(svgPath, join(root, "public", "icon.svg"));
console.log("copied icon.svg to ./public/icon.svg");
