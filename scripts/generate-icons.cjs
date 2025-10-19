const sharp = require('sharp');
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
  const sizes = [16, 32, 48, 180, 192, 512];

  const pngPaths = [];
  for (const s of sizes) {
    const dst = path.join(outDir, `icon-${s}.png`);
    await sharp(src).resize(s, s, { fit: 'cover' }).toFile(dst);
    console.log('Wrote', dst);
    if (s === 16 || s === 32 || s === 48) pngPaths.push(dst);
  }

  try {
    // pngToIco may be a default export or a function
    const pngToIcoFunc = typeof pngToIco === 'function' ? pngToIco : (pngToIco && pngToIco.default) ? pngToIco.default : null;
    if (pngToIcoFunc) {
      const icoBuf = await pngToIcoFunc(pngPaths);
      fs.writeFileSync(path.join(outDir, 'favicon.ico'), icoBuf);
      console.log('Wrote favicon.ico');
    } else {
      // fallback: copy 48px PNG as favicon.ico (not ideal but works for browsers)
      const src48 = path.join(outDir, 'icon-48.png');
      const dst = path.join(outDir, 'favicon.ico');
      fs.copyFileSync(src48, dst);
      console.log('png-to-ico not available; copied icon-48.png to favicon.ico as fallback');
    }
  } catch (err) {
    console.error('Failed to create favicon.ico', err);
    try {
      const src48 = path.join(outDir, 'icon-48.png');
      const dst = path.join(outDir, 'favicon.ico');
      fs.copyFileSync(src48, dst);
      console.log('Used fallback: copied icon-48.png to favicon.ico');
    } catch (err2) {
      console.error('Fallback also failed:', err2);
    }
  }

  console.log('Icon generation complete.');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
