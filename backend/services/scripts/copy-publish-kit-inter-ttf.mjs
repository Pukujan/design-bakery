import { cpSync, mkdirSync } from 'node:fs';

const destDir = 'lib/blog/publishKit/inter-ttf';
mkdirSync(destDir, { recursive: true });
cpSync(
  'src/blog/publishKit/inter-ttf/Inter-Variable.ttf',
  `${destDir}/Inter-Variable.ttf`,
);
