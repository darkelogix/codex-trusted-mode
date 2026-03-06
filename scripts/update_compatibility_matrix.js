import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHECK_ONLY = process.argv.includes('--check');

function normalizeLineEndings(value) {
  return value.replace(/\r\n/g, '\n');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function statusFromResult(target, result) {
  if (!result) return target.certification_status;
  if (target.certification_status === 'UNSUPPORTED') return 'UNSUPPORTED';
  return result.releaseStatus === 'CERTIFIED_ENFORCED_READY'
    ? 'CERTIFIED_ENFORCED'
    : 'LOCKDOWN_ONLY';
}

function buildRow(target, result, adapterVersion) {
  const status = statusFromResult(target, result);
  const notes = result
    ? `${target.notes} (last check ${result.checkedAtUtc || 'n/a'})`
    : target.notes;
  return `| ${target.codex_version} | ${adapterVersion} | ${status} | ${notes} |`;
}

function replaceMatrixTable(content, rows) {
  const header = '| Codex Version | Repo Version | Certification | Notes |';
  const divider = '| --- | --- | --- | --- |';
  const start = content.indexOf(header);
  if (start === -1) throw new Error('Compatibility table header not found.');
  const dividerIndex = content.indexOf(divider, start);
  if (dividerIndex === -1) throw new Error('Compatibility table divider not found.');

  const afterDivider = dividerIndex + divider.length;
  const tailStart = content.indexOf('\n\n## ', afterDivider);
  const tail = tailStart === -1 ? '' : content.slice(tailStart);
  const prefix = content.slice(0, start);
  return `${prefix}${header}\n${divider}\n${rows.join('\n')}${tail}`;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const targetsPath = path.join(root, 'scripts', 'compatibility_targets.json');
const matrixPath = path.join(root, 'COMPATIBILITY_MATRIX.md');
const resultsDir = path.join(root, 'compat-results');
const pkgPath = path.join(root, 'package.json');

const targets = readJson(targetsPath);
const pkg = readJson(pkgPath);
const adapterVersion = String(pkg.version || '').trim();
const resultByVersion = new Map();

if (fs.existsSync(resultsDir)) {
  const files = fs.readdirSync(resultsDir).filter((name) => name.endsWith('.json'));
  for (const file of files) {
    const version = file.replace(/\.json$/, '');
    try {
      resultByVersion.set(version, readJson(path.join(resultsDir, file)));
    } catch {
      // ignore unreadable artifacts
    }
  }
}

const rows = targets.map((target) =>
  buildRow(target, resultByVersion.get(target.codex_version), adapterVersion)
);
const current = fs.readFileSync(matrixPath, 'utf8');
const next = replaceMatrixTable(current, rows);

if (CHECK_ONLY) {
  if (normalizeLineEndings(current) !== normalizeLineEndings(next)) {
    console.error('COMPATIBILITY_MATRIX.md is out of date. Run: node scripts/update_compatibility_matrix.js');
    process.exit(1);
  }
  console.log('Compatibility matrix check passed.');
  process.exit(0);
}

fs.writeFileSync(matrixPath, next, 'utf8');
console.log('Updated COMPATIBILITY_MATRIX.md');
