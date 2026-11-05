/**
 * Lanes must stay separate (backend/src/copilot/lanes/): a lane never imports another lane, and the shared code (route.ts and the
 * rest of copilot/) never imports a lane's own files, only lanes/loader.ts and lanes/types.ts. That is what lets one lane be
 * tuned, tested or switched off without touching another.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('../backend/src/copilot/', import.meta.url).pathname;
const lanesDir = join(root, 'lanes');
const lanes = readdirSync(lanesDir).filter((n) => statSync(join(lanesDir, n)).isDirectory());
const files = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? files(join(dir, n)) : n.endsWith('.ts') ? [join(dir, n)] : []));
/** The module names a file imports: the quoted text after "from" or a dynamic import's opening bracket. */
const importsOf = (file) => readFileSync(file, 'utf8').split('\n').flatMap((line) => {
  const at = Math.max(line.indexOf(' from '), line.indexOf('import('));
  const quote = at < 0 ? -1 : [...line.slice(at)].findIndex((c) => '\'"`'.includes(c));
  return quote < 0 ? [] : [line.slice(at + quote + 1).split(line[at + quote])[0]];
}).filter((spec) => !spec.includes('${'));
const resolveTo = (file, spec) => (spec.startsWith('.') ? join(file, '..', spec) : spec);

const problems = [];
for (const lane of lanes) {
  for (const file of files(join(lanesDir, lane))) {
    for (const spec of importsOf(file)) {
      const target = resolveTo(file, spec);
      const other = lanes.find((l) => l !== lane && target.startsWith(join(lanesDir, l)));
      if (other) problems.push(`${relative(root, file)} imports the "${other}" lane (${spec})`);
      const outside = spec.startsWith('.') && !target.startsWith(join(lanesDir, lane)) && !target.startsWith(join(lanesDir, 'types'));
      if (outside) problems.push(`${relative(root, file)} reaches outside its lane (${spec}); a lane imports only its own files and lanes/types`);
    }
  }
}
for (const file of files(root).filter((f) => !f.startsWith(lanesDir))) {
  for (const spec of importsOf(file)) {
    const target = resolveTo(file, spec);
    if (target.startsWith(lanesDir) && !['loader', 'types', 'schema'].some((n) => target.endsWith(`lanes/${n}`) || target.endsWith(`lanes/${n}.js`))) problems.push(`${relative(root, file)} imports a lane's own file (${spec}); go through lanes/loader`);
  }
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`lanes: ${lanes.join(', ')} are separate`);
