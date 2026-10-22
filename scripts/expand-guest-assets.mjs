import { existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const root = 'public/opportunity-city';
mkdirSync(root, { recursive: true });
for (const file of ['opportunity-city-source-a.zip', 'opportunity-city-source-b.zip']) {
  const source = `${root}/${file}`;
  if (!existsSync(source)) throw new Error(`Missing required guest showcase asset bundle: ${source}`);
  execFileSync('unzip', ['-o', source, '-d', root], { stdio: 'inherit' });
}
for (const file of ['opportunity-city.png', 'nova-card.jpg']) {
  if (!existsSync(`${root}/${file}`)) throw new Error(`Guest showcase missing expanded image: ${file}`);
}
console.log('Expanded Opportunity City artwork and supporting assets for guest preview.');
