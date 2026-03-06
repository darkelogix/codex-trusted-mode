import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function parseArgs(argv) {
  const args = { input: null, source: 'example' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--input') args.input = argv[i + 1];
    if (argv[i] === '--source') args.source = argv[i + 1];
  }
  return args;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const evidenceDir = path.join(repoRoot, 'release-evidence');

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) {
    console.error('Usage: node scripts/capture_native_hook_evidence.js --input <raw-callback-json> [--source real_runtime|example]');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(path.resolve(args.input), 'utf8'));
  const source = args.source === 'real_runtime' ? 'real_runtime' : 'example';
  const normalized = {
    capturedAtUtc: new Date().toISOString(),
    runtime: 'codex',
    status: source === 'real_runtime' ? 'captured' : 'example_capture',
    source,
    notes: [
      source === 'real_runtime'
        ? 'Captured from a real native hook or callback path.'
        : 'Captured from an example or simulated callback payload.',
      'Review for sensitive content before distribution outside the engineering context.',
    ],
    observed: {
      toolName: raw.toolName || raw.tool_name || '',
      callbackShape: raw,
      decision: raw.decision || '',
      reasonCode: raw.reasonCode || raw.reason_code || '',
    },
  };

  const outputPath = path.join(evidenceDir, 'native-hook-evidence.json');
  fs.writeFileSync(outputPath, JSON.stringify(normalized, null, 2));
  console.log(`Native hook evidence written to ${outputPath}`);
}

main();
