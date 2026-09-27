// Reads a ZIP (e.g. .xlsx) central directory and rejects archives whose
// declared uncompressed contents are too large, before any decompression.
export function zipWithinLimits(
  buf: ArrayBuffer,
  { maxTotal = 50_000_000, maxEntry = 30_000_000, maxEntries = 2000 } = {},
) {
  const v = new DataView(buf);
  // End of central directory: signature 0x06054b50, within the last 64 KB.
  let eocd = -1;
  for (let i = v.byteLength - 22; i >= Math.max(0, v.byteLength - 65557); i--) {
    if (v.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return false;
  const entries = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  if (entries > maxEntries || p === 0xffffffff) return false; // ZIP64 not accepted
  let total = 0;
  for (let n = 0; n < entries; n++) {
    if (p + 46 > v.byteLength || v.getUint32(p, true) !== 0x02014b50) return false;
    const size = v.getUint32(p + 24, true);
    if (size === 0xffffffff || size > maxEntry) return false;
    total += size;
    if (total > maxTotal) return false;
    p += 46 + v.getUint16(p + 28, true) + v.getUint16(p + 30, true) + v.getUint16(p + 32, true);
  }
  return true;
}
