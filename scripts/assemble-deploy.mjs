import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const deployDir = path.join(rootDir, 'deploy');
const assetsDir = path.join(deployDir, 'assets');

const meta = JSON.parse(await readFile(path.join(rootDir, '.build', 'meta.json'), 'utf8'));

const filesToHash = [
  { input: 'app.js', outputBase: 'app', ext: '.js' },
  { input: 'styles.css', outputBase: 'styles', ext: '.css' },
  { input: 'config.js', outputBase: 'config', ext: '.js' }
];

const hashContent = (content) => createHash('sha256').update(content).digest('hex').slice(0, 12);

await rm(deployDir, { recursive: true, force: true });
await mkdir(assetsDir, { recursive: true });

let indexHtml = await readFile(path.join(rootDir, 'index.html'), 'utf8');

for (const item of filesToHash) {
  const content = await readFile(path.join(rootDir, item.input));
  const hash = hashContent(content);
  const fileName = `${item.outputBase}.${hash}${item.ext}`;
  await writeFile(path.join(assetsDir, fileName), content);
  indexHtml = indexHtml.replace(`./${item.input}`, `./assets/${fileName}`);
}

indexHtml = indexHtml.replace('</head>', `    <meta name="x-build-id" content="${meta.buildId}" />\n  </head>`);
await writeFile(path.join(deployDir, 'index.html'), indexHtml, 'utf8');

const edgeoneConfig = {
  headers: [
    {
      source: '/',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400, stale-if-error=86400'
        }
      ]
    },
    {
      source: '/index.html',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400, stale-if-error=86400'
        }
      ]
    },
    {
      source: '/assets/*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, s-maxage=31536000, immutable'
        }
      ]
    },
    {
      source: '/build-info.json',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400, stale-if-error=86400'
        }
      ]
    }
  ],
  caches: [
    { source: '/', cacheTtl: 1800 },
    { source: '/index.html', cacheTtl: 1800 },
    { source: '/assets/*', cacheTtl: 31536000 },
    { source: '/build-info.json', cacheTtl: 1800 }
  ]
};

await writeFile(path.join(deployDir, 'edgeone.json'), JSON.stringify(edgeoneConfig, null, 2) + '\n', 'utf8');
await writeFile(path.join(deployDir, 'build-info.json'), JSON.stringify(meta, null, 2) + '\n', 'utf8');

console.log(`Deploy bundle generated in ${deployDir}`);
