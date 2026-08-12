// Generates the app icons (a document-with-text-lines glyph). Run: node make-icons.js
//
// Two flavours, because platforms treat them differently:
//   "any"      - rounded tile, drawn as-is. Used in tab/bookmark UI.
//   "maskable" - full-bleed square; the platform crops it to its own shape
//                (a circle on ChromeOS). The glyph must stay inside the safe
//                zone: a centred circle of radius 40% of the icon size.
const fs = require("fs");
const zlib = require("zlib");

// Style shared with Kevin's other apps (PDF Ink / claude dashboard):
// dark tile, slate-blue circle, warm-white page with slate text lines.
const BG = [38, 38, 36];        // #262624 dark tile
const CIRCLE = [95, 141, 161];  // #5f8da1 slate blue
const FG = [250, 249, 245];     // #faf9f5 warm white page

// Circle and page sizes as fractions of the icon. The page's corners must sit
// inside the circle, and (for maskable) the circle inside the safe zone
// (a centred circle of radius 40%): any → circle r 0.363, page hypot 0.320;
// maskable → circle r 0.29, page hypot 0.256.
const SIZES = {
  any: { circleR: 0.363, pageW: 0.40, pageH: 0.50 },
  maskable: { circleR: 0.29, pageW: 0.32, pageH: 0.40 }
};

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

function png(size, maskable) {
  const s = size;
  const radius = maskable ? 0 : s * 0.22;
  const { circleR, pageW: pw, pageH: ph } = SIZES[maskable ? "maskable" : "any"];

  const circR = s * circleR;
  const pageW = s * pw, pageH = s * ph;
  const px0 = (s - pageW) / 2, px1 = px0 + pageW;
  const py0 = (s - pageH) / 2, py1 = py0 + pageH;

  // Text lines, positioned relative to the page rather than the icon.
  const padX = pageW * 0.17;
  const lineH = Math.max(1, pageH * 0.075);
  const lines = [0, 1, 2, 3].map((i) => ({
    y: py0 + pageH * (0.16 + i * 0.20),
    x0: px0 + padX,
    x1: px1 - padX - (i === 3 ? pageW * 0.30 : 0)  // last line is short
  }));

  const rows = [];
  for (let y = 0; y < s; y++) {
    const row = Buffer.alloc(1 + s * 4); // filter byte + RGBA
    row[0] = 0;
    for (let x = 0; x < s; x++) {
      let inside = true;
      if (radius > 0) {
        const cx = Math.min(Math.max(x + 0.5, radius), s - radius);
        const cy = Math.min(Math.max(y + 0.5, radius), s - radius);
        inside = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= radius;
      }

      let r = BG[0], g = BG[1], b = BG[2];
      const a = inside ? 255 : 0;

      if (Math.hypot(x + 0.5 - s / 2, y + 0.5 - s / 2) <= circR) {
        r = CIRCLE[0]; g = CIRCLE[1]; b = CIRCLE[2];
      }

      if (x >= px0 && x < px1 && y >= py0 && y < py1) {
        r = FG[0]; g = FG[1]; b = FG[2];
        for (const ln of lines) {
          if (y >= ln.y && y < ln.y + lineH && x >= ln.x0 && x < ln.x1) {
            r = CIRCLE[0]; g = CIRCLE[1]; b = CIRCLE[2];
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

const out = [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["icon-maskable-512.png", 512, true]
];
for (const [name, size, maskable] of out) {
  fs.writeFileSync(name, png(size, maskable));
  console.log("wrote " + name);
}
