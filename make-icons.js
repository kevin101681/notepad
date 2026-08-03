// Generates icon-192.png and icon-512.png (a document-with-text-lines glyph).
// Run with: node make-icons.js
const fs = require("fs");
const zlib = require("zlib");

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size) {
  const bg = [0, 103, 192];      // Windows-ish accent blue
  const fg = [255, 255, 255];
  const s = size;
  const radius = s * 0.22;       // rounded app-icon corners

  // Page rectangle inside the tile.
  const px0 = s * 0.24, px1 = s * 0.76;
  const py0 = s * 0.18, py1 = s * 0.82;

  const rows = [];
  for (let y = 0; y < s; y++) {
    const row = Buffer.alloc(1 + s * 4); // filter byte + RGBA
    row[0] = 0;
    for (let x = 0; x < s; x++) {
      // Rounded-corner mask for the tile itself.
      const cx = Math.min(Math.max(x + 0.5, radius), s - radius);
      const cy = Math.min(Math.max(y + 0.5, radius), s - radius);
      const inside = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= radius;

      let r = bg[0], g = bg[1], b = bg[2], a = inside ? 255 : 0;

      const onPage = x >= px0 && x < px1 && y >= py0 && y < py1;
      if (onPage) { r = fg[0]; g = fg[1]; b = fg[2]; }

      // Four text lines drawn in the tile colour on top of the white page.
      if (onPage) {
        const lineH = s * 0.045;
        for (let i = 0; i < 4; i++) {
          const ly = py0 + s * 0.13 + i * s * 0.135;
          const lx1 = i === 3 ? px0 + (px1 - px0) * 0.55 : px1 - s * 0.09;
          if (y >= ly && y < ly + lineH && x >= px0 + s * 0.09 && x < lx1) {
            r = bg[0]; g = bg[1]; b = bg[2];
          }
        }
      }
      row.writeUInt8(r, 1 + x * 4);
      row.writeUInt8(g, 2 + x * 4);
      row.writeUInt8(b, 3 + x * 4);
      row.writeUInt8(a, 4 + x * 4);
    }
    rows.push(row);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(s, 0);
  ihdr.writeUInt32BE(s, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // colour type RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

for (const size of [192, 512]) {
  fs.writeFileSync(`icon-${size}.png`, png(size));
  console.log(`wrote icon-${size}.png`);
}
