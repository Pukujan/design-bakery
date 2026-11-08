/**
 * Prints the SQL for each lane's own tables (backend/src/copilot/lanes/schema.ts) so it can be reviewed. It does not run it:
 * creating the tables in the Octo workspace is a separate, approved step.
 *
 *   pnpm --dir backend run build && node scripts/lanes-schema.mjs [strong|hybrid|small]
 */
const root = new URL('../backend/lib/copilot/lanes/', import.meta.url);
const { createSql } = await import(new URL('schema.js', root).href);
const names = process.argv[2] ? [process.argv[2]] : ['strong', 'hybrid', 'small'];
for (const name of names) {
  const { lane } = await import(new URL(`${name}/index.js`, root).href);
  console.log(`-- lane: ${name}\n${createSql(lane.manifest)}\n`);
}
