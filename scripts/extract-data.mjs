import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const workbookPath = process.argv[2] || 'C:/Users/sbankes/Downloads/jaipur-normalized-demo-data (1).xlsx';
const outputPath = process.argv[3] || 'src/data/generated/workbook.json';
const data = fs.readFileSync(workbookPath);

function zipEntries(buffer) {
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50 && i + 22 + buffer.readUInt16LE(i + 20) === buffer.length) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Invalid .xlsx: end of central directory not found.');
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  const entries = new Map(); let pos = centralOffset;
  while (buffer.readUInt32LE(pos) === 0x02014b50) {
    const method = buffer.readUInt16LE(pos + 10); const compressedSize = buffer.readUInt32LE(pos + 20);
    const nameLength = buffer.readUInt16LE(pos + 28); const extraLength = buffer.readUInt16LE(pos + 30); const commentLength = buffer.readUInt16LE(pos + 32);
    const localOffset = buffer.readUInt32LE(pos + 42); const name = buffer.toString('utf8', pos + 46, pos + 46 + nameLength);
    const localNameLength = buffer.readUInt16LE(localOffset + 26); const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + localNameLength + localExtraLength; const raw = buffer.subarray(start, start + compressedSize);
    entries.set(name, method === 8 ? zlib.inflateRawSync(raw).toString('utf8') : raw.toString('utf8'));
    pos += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}
const decode = (value = '') => value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
const colIndex = (ref) => [...ref.match(/[A-Z]+/)[0]].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
const cellValue = (cell, shared) => {
  const type = /\bt="([^"]+)"/.exec(cell)?.[1];
  const value = /<v>([\s\S]*?)<\/v>/.exec(cell)?.[1] ?? '';
  if (type === 's') return shared[Number(value)] ?? '';
  if (type === 'inlineStr') return decode((/<t[^>]*>([\s\S]*?)<\/t>/.exec(cell)?.[1] ?? ''));
  if (type === 'b') return value === '1';
  return value === '' ? null : (Number.isFinite(Number(value)) ? Number(value) : decode(value));
};
const entries = zipEntries(data);
const cleanXml = (xml = '') => xml.replace(/(<\/?)(?:[A-Za-z]+:)/g, '$1');
const shared = [...cleanXml(entries.get('xl/sharedStrings.xml')).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => decode([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x => x[1]).join('')));
const workbook = cleanXml(entries.get('xl/workbook.xml'));
const rels = cleanXml(entries.get('xl/_rels/workbook.xml.rels'));
if (!workbook || !rels) throw new Error(`Missing workbook XML. Entries include: ${[...entries.keys()].slice(0, 20).join(', ')}`);
const targets = new Map([...rels.matchAll(/<Relationship\b([^>]*)\/>/g)].map((m) => {
  const id = /\bId="([^\"]+)"/.exec(m[1])?.[1]; const target = /\bTarget="([^\"]+)"/.exec(m[1])?.[1];
  return [id, target?.replace(/^\//, '').replace(/^xl\//, '')];
}).filter(([id, target]) => id && target));
const sheets = {};
for (const match of workbook.matchAll(/<sheet[^>]*name="([^\"]+)"[^>]*r:id="([^\"]+)"[^>]*\/>/g)) {
  const sheetXml = cleanXml(entries.get(`xl/${targets.get(match[2])}`)); if (!sheetXml) continue;
  const rows = [];
  for (const rowMatch of sheetXml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = []; for (const c of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const ref = /\br="([A-Z]+\d+)"/.exec(c[1])?.[1]; if (ref) row[colIndex(ref)] = cellValue(`<c ${c[1]}>${c[2]}</c>`, shared);
    } rows.push(row);
  }
  const headerIndex = rows.findIndex((row) => row.filter((v) => v !== null && v !== undefined && v !== '').length > 1 && row.some((v) => String(v).endsWith('ID') || v === 'ConfigKey'));
  const headers = headerIndex >= 0 ? rows[headerIndex] : rows[0] || [];
  const records = rows.slice(headerIndex >= 0 ? headerIndex + 1 : 1);
  sheets[match[1]] = records.filter(row => row.some(v => v !== null && v !== undefined && v !== '')).map(row => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? null]).filter(([h]) => h)));
}
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(sheets, null, 2));
console.log(`Generated ${outputPath}: ${Object.entries(sheets).map(([name, rows]) => `${name}=${rows.length}`).join(', ')}`);
