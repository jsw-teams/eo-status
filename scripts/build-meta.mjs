import { mkdir, writeFile } from 'node:fs/promises';

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const buildId = [
  now.getUTCFullYear(),
  pad(now.getUTCMonth() + 1),
  pad(now.getUTCDate()),
  pad(now.getUTCHours()),
  pad(now.getUTCMinutes()),
  pad(now.getUTCSeconds())
].join('');

await mkdir(new URL('../.build/', import.meta.url), { recursive: true });
await writeFile(
  new URL('../.build/meta.json', import.meta.url),
  JSON.stringify({ buildId, generatedAt: now.toISOString() }, null, 2) + '\n',
  'utf8'
);

console.log(`Build metadata generated: ${buildId}`);
