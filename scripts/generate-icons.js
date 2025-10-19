const Jimp = require('jimp');
const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

async function generate() {
  const src = path.join(__dirname, '..', 'public', 'logo.png');
  if (!fs.existsSync(src)) {
    console.error('Source logo not found at public/logo.png. Please copy your image there first.');
    process.exit(1);
  }

  const outDir = path.join(__dirname, '..', 'public');

  // sizes to generate
  const sizes = [16, 32, 48, 180, 192, 512];

  const image = await Jimp.read(src);

  const pngPaths = [];
  for (const s of sizes) {
    const dst = path.join(outDir, `icon-${s}.png`);
    const clone = image.clone();
    clone.cover(s, s).write(dst);
    console.log('Wrote', dst);
    // collect smaller sizes for ico
    if (s === 16 || s === 32 || s === 48) pngPaths.push(dst);
  }

  // create favicon.ico from 16,32,48
  try {
    const icoBuf = await pngToIco(pngPaths);
    fs.writeFileSync(path.join(outDir, 'favicon.ico'), icoBuf);
    console.log('Wrote favicon.ico');
  } catch (err) {
    console.error('Failed to create favicon.ico', err);
  }

  // write apple-touch-icon.png (180)
  // already generated as icon-180.png

  console.log('Icon generation complete.');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
