import fs from 'node:fs';
import path from 'node:path';
import { evaluateCodexEvent } from '../src/index.js';

function parseArgs(argv) {
  const args = { config: null, event: null };
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === '--event') args.event = argv[i + 1];
    if (current === '--config') args.config = argv[i + 1];
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.event) {
    console.error('Usage: node scripts/evaluate_event.js --event <path> [--config <path>]');
    process.exit(1);
  }

  const event = readJson(args.event);
  const config = args.config ? readJson(args.config) : {};
  const result = await evaluateCodexEvent(event, config);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
