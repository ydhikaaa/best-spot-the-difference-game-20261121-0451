// Hand-in program for "Double Vision — a spot-the-difference campaign".
//
// The game itself is the static site under game/ (open game/index.html in a
// desktop browser, no build step, no network). This program's only job is to
// package the entry the way the make.fun gate expects: copy game/ and
// screenshots/ next to the output directory and write dossier.json there
// with the vendored library, so the bytes the judge reads are exactly the
// bytes in this repository.
//
// Run it the way the grader does (Node 22, standard library only):
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// MAKEFUN_OUTPUT_DIR stands in for /output outside the grader's container.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const rootDir = dirname(fileURLToPath(import.meta.url));
const targetDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's own limits, passed through to the dossier builder so an entry
// that would be refused is refused here first, with the same numbers.
const GATE_LIMITS = {
  text_max_bytes: 163_840,
  screenshots: { max: 4, max_bytes: 262_144 },
  game_max_files: 993,
  game_max_bytes: 50_331_648,
  game_path_max_bytes: 1_000,
} as const;

function stageFolder(name: string): void {
  const from = join(rootDir, name);
  const to = join(targetDir, name);
  mkdirSync(to, { recursive: true });
  if (existsSync(from)) cpSync(from, to, { recursive: true });
}

mkdirSync(targetDir, { recursive: true });
stageFolder('game');
stageFolder('screenshots');

const dossierText = buildDossier(targetDir, GATE_LIMITS);
writeFileSync(join(targetDir, 'dossier.json'), dossierText);

// Self-check: walk what was actually staged and report it, so a bad hand-in
// (a missing screenshot, an oversized game folder) is visible in the run log
// here rather than only at the gate.
function survey(dir: string): { files: number; bytes: number } {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = survey(p);
      files += sub.files;
      bytes += sub.bytes;
    } else {
      files += 1;
      bytes += statSync(p).size;
    }
  }
  return { files, bytes };
}

const gameSurvey = survey(join(targetDir, 'game'));
const shotNames = readdirSync(join(targetDir, 'screenshots')).filter((n) => !n.startsWith('.'));
console.log(`staged game/: ${gameSurvey.files} files, ${gameSurvey.bytes} bytes`);
console.log(`staged screenshots/: ${shotNames.length} (${shotNames.join(', ')})`);
console.log(
  `dossier.json written (${Buffer.byteLength(dossierText)} bytes) to ${relative(process.cwd(), targetDir) || targetDir}`,
);
if (shotNames.length < 3 || shotNames.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shotNames.length}`);
}
