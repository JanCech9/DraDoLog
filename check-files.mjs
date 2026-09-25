// Run from the DraDoLog repo root:  node check-files.mjs
// Compares every file from the rules update with the delivered version and
// flags stray copies. No dependencies.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const EXPECTED = {
  "src/data/abilities.ts": "e61b603eccfb26d08fb8a547a3c4b271cd93c87291b8b205dc8d620f75a94a61",
  "src/data/catalog.ts": "7b6fb49e865a4564fa40f135dc4dc7c354f88e678436f2ae81bb15cad0228347",
  "src/data/races.ts": "4f7d487a051761267eb3d03a29cdd52221f57f261542d3c13a927375707d33ff",
  "src/data/recipes.ts": "eb31469cd39fb853406ba9deee7ff907303f5b012dc22f9fbf397bf7937128a5",
  "src/data/spells.ts": "edd04f7e7da71cc40cd4b1476ea960711561bc59f5cc0bcce5f889573121437a",
  "src/rules/abilities.ts": "e691161cd588f4eb0508ea557caa8843fa2e1ecf03933b4025349baa5bca2a86",
  "src/rules/derived.ts": "4e8e59ec3c42447813374d77591ae1a640e81fd6f5eba74ac4470328a422e4a1",
  "src/rules/dice.ts": "b2abdc9160e377e935c8b4e7ab573952a86dd2f063301ae8e1c879dc6c088998",
  "src/rules/restrictions.ts": "61c66568d1c9a4df756751cdd61437cc6ac8a4b7b6dd012a8802d22715b4307d",
  "src/rules/tables.ts": "76c97f0ef49d0d89c8ed3dfebdfa7362c2ddecc9c3aa74f164736c6c734ab4fe",
  "src/screens/BojScreen.tsx": "102c2f59a9485138b022ac14f03d14c323c57356d93118f87d5a61439ef1d747",
  "src/screens/PostavaScreen.tsx": "73a7cd5bba20701e17fdc5ef4c79a96f218643ed517fc1a9af1d0209526538e7",
  "src/screens/SchopnostiScreen.tsx": "138b76d87139e504d8294b9801fc9827eb703f7d7b5a27e5664e4768c23827a0",
  "src/screens/VybavaScreen.tsx": "f7245ecef995ba77b8536d5b4e59d5ac876847d2d1b9d5a7fb45fec5e7e3658f",
  "src/state/defaultCharacter.ts": "d9db7c52162bba5e4d92979a1fb9dc060e1fa849bae4a57427d82f9a68555005",
  "src/state/useCharacter.ts": "cda778ef521d3f071e4e55f30aef23fd6255310cb88cfbbf21ffc04cb8e468ec",
  "src/types/character.ts": "827c515b70e5c98931d807dd321d9ba5f7a25a75ff1e504f743288c02c04c881"
};

// Paths that must NOT exist (unzipped copies landed inside src/).
const STRAY = ['src/files', 'src/mnt', 'src/CHANGES.md', 'migrate.ts', 'smoke.ts'];

let bad = 0;
for (const [file, sha] of Object.entries(EXPECTED)) {
  if (!existsSync(file)) { console.log('MISSING   ', file); bad++; continue; }
  const actual = createHash('sha256').update(readFileSync(file)).digest('hex');
  if (actual === sha) console.log('ok        ', file);
  else { console.log('DIFFERENT ', file); bad++; }
}
for (const p of STRAY) {
  if (existsSync(p)) { console.log('STRAY     ', p, '- delete it'); bad++; }
}
// Any other unexpected directory directly under src/ is worth a look too.
const known = new Set(['types', 'rules', 'data', 'state', 'screens', 'assets']);
for (const e of readdirSync('src')) {
  const p = join('src', e);
  if (statSync(p).isDirectory() && !known.has(e)) console.log('UNEXPECTED', p);
}
console.log(bad ? `\n${bad} problem(s) found` : '\nAll files match.');
