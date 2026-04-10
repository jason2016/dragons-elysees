// Generates PWA icons from logo5.png
// Usage: node scripts/gen-icons.js
import zlib from 'zlib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, '..', 'public', 'icons', 'logo5.png');
const OUT_DIR   = path.join(__dirname, '..', 'public', 'icons');

// ── CRC32 ──────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xFF];
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// ── PNG chunk helpers ──────────────────────────────────────────────────────
function readChunks(buf) {
  const chunks = [];
  let pos = 8; // skip signature
  while (pos < buf.length) {
    const len  = buf.readUInt32BE(pos); pos += 4;
    const type = buf.slice(pos, pos + 4).toString('ascii'); pos += 4;
    const data = buf.slice(pos, pos + len); pos += len;
    pos += 4; // skip CRC
    chunks.push({ type, data });
  }
  return chunks;
}

function pngChunk(type, data) {
  const lenBuf  = Buffer.alloc(4); lenBuf.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcBuf  = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// ── PNG decoder → Float32 RGBA pixels[y][x] = [r,g,b,a] 0-255 ────────────
function decodePNG(buf) {
  const chunks = readChunks(buf);
  const ihdr = chunks.find(c => c.type === 'IHDR').data;
  const width  = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const bitDepth   = ihdr[8];
  const colorType  = ihdr[9];
  // colorType: 0=Gray, 2=RGB, 3=Indexed, 4=GrayA, 6=RGBA

  // Collect IDAT
  const idatBufs = chunks.filter(c => c.type === 'IDAT').map(c => c.data);
  const compressed = Buffer.concat(idatBufs);
  const raw = zlib.inflateSync(compressed);

  // Bytes per pixel in source
  let srcChannels;
  if (colorType === 0) srcChannels = 1;
  else if (colorType === 2) srcChannels = 3;
  else if (colorType === 4) srcChannels = 2;
  else if (colorType === 6) srcChannels = 4;
  else if (colorType === 3) srcChannels = 1; // indexed - we won't handle palette
  else throw new Error('Unsupported colorType: ' + colorType);

  const bpp = Math.ceil(srcChannels * bitDepth / 8);
  const stride = Math.ceil(width * srcChannels * bitDepth / 8);

  // Reconstruct filters
  const pixels = new Uint8Array(width * height * 4); // RGBA output

  let rawPos = 0;
  const rowBuf = Buffer.alloc(stride);
  const prevRow = Buffer.alloc(stride, 0);

  for (let y = 0; y < height; y++) {
    const filter = raw[rawPos++];
    const scanline = raw.slice(rawPos, rawPos + stride);
    rawPos += stride;

    // Apply filter
    const recon = Buffer.alloc(stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? recon[i - bpp] : 0;
      const b = prevRow[i];
      const c = i >= bpp ? prevRow[i - bpp] : 0;
      let v = scanline[i];
      if (filter === 0) recon[i] = v;
      else if (filter === 1) recon[i] = (v + a) & 0xFF;
      else if (filter === 2) recon[i] = (v + b) & 0xFF;
      else if (filter === 3) recon[i] = (v + Math.floor((a + b) / 2)) & 0xFF;
      else if (filter === 4) {
        // Paeth
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        recon[i] = (v + pr) & 0xFF;
      }
    }
    recon.copy(prevRow);

    // Convert to RGBA
    for (let x = 0; x < width; x++) {
      const off = (y * width + x) * 4;
      if (colorType === 2) { // RGB
        recon.copy(pixels, off, x * 3, x * 3 + 3);
        pixels[off + 3] = 255;
      } else if (colorType === 6) { // RGBA
        recon.copy(pixels, off, x * 4, x * 4 + 4);
      } else if (colorType === 0) { // Gray
        const v = recon[x];
        pixels[off] = pixels[off+1] = pixels[off+2] = v;
        pixels[off+3] = 255;
      } else if (colorType === 4) { // GrayA
        const v = recon[x * 2];
        pixels[off] = pixels[off+1] = pixels[off+2] = v;
        pixels[off+3] = recon[x * 2 + 1];
      } else {
        // Indexed: just fill gold
        pixels[off] = 201; pixels[off+1] = 168; pixels[off+2] = 76; pixels[off+3] = 255;
      }
    }
  }
  return { width, height, pixels };
}

// ── Bilinear resize ────────────────────────────────────────────────────────
function resizeRGBA(src, srcW, srcH, dstW, dstH) {
  const dst = new Uint8Array(dstW * dstH * 4);
  const xRatio = srcW / dstW;
  const yRatio = srcH / dstH;
  for (let y = 0; y < dstH; y++) {
    for (let x = 0; x < dstW; x++) {
      const gx = x * xRatio;
      const gy = y * yRatio;
      const x0 = Math.floor(gx), y0 = Math.floor(gy);
      const x1 = Math.min(x0 + 1, srcW - 1), y1 = Math.min(y0 + 1, srcH - 1);
      const fx = gx - x0, fy = gy - y0;
      const dstOff = (y * dstW + x) * 4;
      for (let c = 0; c < 4; c++) {
        const tl = src[(y0 * srcW + x0) * 4 + c];
        const tr = src[(y0 * srcW + x1) * 4 + c];
        const bl = src[(y1 * srcW + x0) * 4 + c];
        const br = src[(y1 * srcW + x1) * 4 + c];
        dst[dstOff + c] = Math.round(tl * (1-fx) * (1-fy) + tr * fx * (1-fy) + bl * (1-fx) * fy + br * fx * fy);
      }
    }
  }
  return dst;
}

// ── Composite logo onto dark background, encode PNG ───────────────────────
function buildIcon(logoPixels, logoW, logoH, iconSize) {
  const padding = Math.round(iconSize * 0.12); // 12% padding on each side
  const maxLogoW = iconSize - padding * 2;
  const maxLogoH = iconSize - padding * 2;

  // Scale logo to fit within maxLogo bounds, preserving aspect ratio
  const scale = Math.min(maxLogoW / logoW, maxLogoH / logoH);
  const scaledW = Math.round(logoW * scale);
  const scaledH = Math.round(logoH * scale);

  const scaled = resizeRGBA(logoPixels, logoW, logoH, scaledW, scaledH);

  // Composite onto #0a0a0a background
  const offX = Math.round((iconSize - scaledW) / 2);
  const offY = Math.round((iconSize - scaledH) / 2);

  const out = new Uint8Array(iconSize * iconSize * 3); // RGB output
  // Fill background
  for (let i = 0; i < out.length; i += 3) { out[i] = 10; out[i+1] = 10; out[i+2] = 10; }

  // Alpha-composite logo
  for (let y = 0; y < scaledH; y++) {
    for (let x = 0; x < scaledW; x++) {
      const ix = offX + x, iy = offY + y;
      if (ix < 0 || ix >= iconSize || iy < 0 || iy >= iconSize) continue;
      const srcOff = (y * scaledW + x) * 4;
      const dstOff = (iy * iconSize + ix) * 3;
      const alpha = scaled[srcOff + 3] / 255;
      out[dstOff]   = Math.round(scaled[srcOff]   * alpha + 10 * (1 - alpha));
      out[dstOff+1] = Math.round(scaled[srcOff+1] * alpha + 10 * (1 - alpha));
      out[dstOff+2] = Math.round(scaled[srcOff+2] * alpha + 10 * (1 - alpha));
    }
  }

  // Encode PNG
  const rowBytes = 1 + iconSize * 3;
  const raw = Buffer.alloc(iconSize * rowBytes);
  for (let y = 0; y < iconSize; y++) {
    raw[y * rowBytes] = 0; // filter: None
    for (let x = 0; x < iconSize; x++) {
      const srcOff = (y * iconSize + x) * 3;
      const dstOff = y * rowBytes + 1 + x * 3;
      raw[dstOff]   = out[srcOff];
      raw[dstOff+1] = out[srcOff+1];
      raw[dstOff+2] = out[srcOff+2];
    }
  }
  const compressed = zlib.deflateSync(raw, { level: 6 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(iconSize, 0); ihdr.writeUInt32BE(iconSize, 4);
  ihdr[8] = 8; ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

// ── Main ───────────────────────────────────────────────────────────────────
const logoBuf = fs.readFileSync(LOGO_PATH);
console.log(`Logo loaded: ${logoBuf.length} bytes`);

const { width, height, pixels } = decodePNG(logoBuf);
console.log(`Logo dimensions: ${width}×${height}`);

fs.mkdirSync(OUT_DIR, { recursive: true });

fs.writeFileSync(path.join(OUT_DIR, 'icon-192.png'), buildIcon(pixels, width, height, 192));
console.log('✓ icon-192.png');

fs.writeFileSync(path.join(OUT_DIR, 'icon-512.png'), buildIcon(pixels, width, height, 512));
console.log('✓ icon-512.png');

console.log('Done.');
