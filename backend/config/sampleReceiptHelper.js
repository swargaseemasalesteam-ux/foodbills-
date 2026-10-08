const fs = require('fs');
const zlib = require('zlib');

function createSampleReceiptPNG(filePath, agentName, amount, billId, dateStr, paymentMethod) {
  const width = 300;
  const height = 200;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(2, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const ihdrChunk = createChunk('IHDR', ihdr);

  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    rawData[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const idx = rowStart + 1 + x * 3;
      if (y < 45) {
        rawData[idx] = 30;
        rawData[idx + 1] = 58;
        rawData[idx + 2] = 138;
      } else if (y > 60 && y < 100 && x > 120 && x < 180) {
        rawData[idx] = 16;
        rawData[idx + 1] = 185;
        rawData[idx + 2] = 129;
      } else {
        rawData[idx] = 248;
        rawData[idx + 1] = 250;
        rawData[idx + 2] = 252;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  const pngBuffer = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(filePath, pngBuffer);
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4);
  data.copy(buf, 8);

  const crc = crc32(Buffer.concat([Buffer.from(type), data]));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ -1) >>> 0;
}

module.exports = { createSampleReceiptPNG };
