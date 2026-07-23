import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync
} from 'node:fs';
import { homedir } from 'node:os';
import { basename, delimiter, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tauriCli = join(projectRoot, 'node_modules', '@tauri-apps', 'cli', 'tauri.js');
const releaseDir = join(projectRoot, 'release');
const rustReleaseDir = join(projectRoot, 'src-tauri', 'target', 'release');

function environmentWithRust() {
  const env = { ...process.env };
  const pathKey = Object.keys(env).find((key) => key.toLowerCase() === 'path') || 'Path';
  const cargoBin = join(homedir(), '.cargo', 'bin');
  const cargoExecutable = join(cargoBin, process.platform === 'win32' ? 'cargo.exe' : 'cargo');
  const entries = String(env[pathKey] || '').split(delimiter).filter(Boolean);

  if (existsSync(cargoExecutable) && !entries.some((entry) => entry.toLowerCase() === cargoBin.toLowerCase())) {
    entries.unshift(cargoBin);
  }

  env[pathKey] = entries.join(delimiter);
  return env;
}

function runTauri(args) {
  if (!existsSync(tauriCli)) {
    console.error('Brak Tauri CLI. Najpierw uruchom: npm install');
    process.exit(1);
  }

  const result = spawnSync(process.execPath, [tauriCli, ...args], {
    cwd: projectRoot,
    env: environmentWithRust(),
    stdio: 'inherit'
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function copyPortable() {
  const source = join(rustReleaseDir, 'micdeck.exe');
  const destination = join(releaseDir, 'MicDeck-portable.exe');
  const rootDestination = join(projectRoot, 'MicDeck-portable.exe');
  mkdirSync(releaseDir, { recursive: true });
  copyFileSync(source, destination);
  copyFileSync(source, rootDestination);
  console.log(`\nGotowe: ${destination}`);
  console.log(`Kopia:  ${rootDestination}`);
}

function forcePortableRelink() {
  const executable = join(rustReleaseDir, 'micdeck.exe');
  if (existsSync(executable)) {
    rmSync(executable);
  }
}

function copyInstaller() {
  const bundleDir = join(rustReleaseDir, 'bundle', 'nsis');
  const candidates = readdirSync(bundleDir)
    .filter((name) => {
      const normalized = name.toLowerCase();
      return normalized.startsWith('micdeck_') && normalized.endsWith('-setup.exe');
    })
    .sort();

  if (candidates.length === 0) {
    console.error(`Nie znaleziono instalatora NSIS w ${bundleDir}`);
    process.exit(1);
  }

  const source = join(bundleDir, candidates.at(-1));
  const destination = join(releaseDir, 'MicDeck-Setup.exe');
  mkdirSync(releaseDir, { recursive: true });
  copyFileSync(source, destination);
  console.log(`\nGotowe: ${destination}`);
  console.log(`Źródło: ${basename(source)}`);
}

const [command, ...rest] = process.argv.slice(2);

if (command === 'all') {
  forcePortableRelink();
  runTauri(['build', '--no-bundle']);
  copyPortable();
  runTauri(['build', '--bundles', 'nsis']);
  copyInstaller();
} else if (command === 'portable') {
  forcePortableRelink();
  runTauri(['build', '--no-bundle']);
  copyPortable();
} else if (command === 'installer') {
  runTauri(['build', '--bundles', 'nsis']);
  copyInstaller();
} else {
  runTauri([command, ...rest].filter(Boolean));
}
