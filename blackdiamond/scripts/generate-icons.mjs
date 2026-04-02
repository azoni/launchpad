import { execSync } from "child_process";
import { mkdirSync, existsSync } from "fs";

const sizes = [
  { name: "icon-192.png", size: 192, dest: "public" },
  { name: "icon-512.png", size: 512, dest: "public" },
  { name: "apple-icon.png", size: 180, dest: "src/app" },
];

const svgPath = "src/app/icon.svg";

for (const { name, size, dest } of sizes) {
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
  const outPath = `${dest}/${name}`;
  // Use qlmanage to convert SVG to PNG, then sips to resize
  const tmpDir = `/tmp/icon-gen-${size}`;
  execSync(`mkdir -p ${tmpDir}`);
  execSync(`qlmanage -t -s ${size} -o ${tmpDir} ${svgPath} 2>/dev/null || true`);
  const tmpPng = `${tmpDir}/icon.svg.png`;
  try {
    execSync(`sips -z ${size} ${size} ${tmpPng} --out ${outPath} 2>/dev/null`);
    console.log(`Generated ${outPath} (${size}x${size})`);
  } catch {
    console.log(`Failed to generate ${outPath}, creating placeholder`);
    // Create a minimal 1x1 PNG as placeholder
    execSync(`printf '\\x89PNG\\r\\n\\x1a\\n' > ${outPath}`);
  }
  execSync(`rm -rf ${tmpDir}`);
}
