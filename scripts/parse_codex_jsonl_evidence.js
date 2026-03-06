import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const args = { input: null, source: 'real_runtime' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--input') args.input = argv[i + 1];
    if (argv[i] === '--source') args.source = argv[i + 1];
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) {
    console.error('Usage: node scripts/parse_codex_jsonl_evidence.js --input <codex-jsonl-file>');
    process.exit(1);
  }

  const lines = fs.readFileSync(path.resolve(args.input), 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const commandItem = lines.find((entry) =>
    entry.type === 'item.completed' && entry.item?.type === 'command_execution'
  );

  if (!commandItem) {
    console.error('No command_execution item found in JSONL');
    process.exit(1);
  }

  const output = {
    capturedAtUtc: new Date().toISOString(),
    runtime: 'codex',
    status: args.source === 'real_runtime' ? 'runtime_stream_captured' : 'example_capture',
    source: args.source,
    notes: [
      'Captured from codex exec --json output.',
      'This proves native runtime event shape, but does not by itself prove adapter-mediated enforcement.',
    ],
    observed: {
      toolName: 'command_execution',
      callbackShape: commandItem.item,
      decision: commandItem.item.status === 'failed' ? 'deny_like' : 'allow_like',
      reasonCode: commandItem.item.status === 'failed' ? 'RUNTIME_POLICY_BLOCK' : 'RUNTIME_EXECUTION_ALLOWED',
    },
  };

  const outputPath = path.resolve(path.dirname(args.input), 'native-runtime-stream-evidence.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Parsed runtime stream evidence written to ${outputPath}`);
}

main();
