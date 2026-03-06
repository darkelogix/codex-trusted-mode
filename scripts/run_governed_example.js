import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateCodexEvent } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const evidenceDir = path.join(repoRoot, 'release-evidence');

async function run() {
  const pdpUrl = process.env.CODEX_TRUSTED_MODE_PDP_URL || 'http://127.0.0.1:8011/v1/authorize';

  const scenarios = [
    {
      name: 'readonly_shell_allow',
      event: {
        toolName: 'functions.shell_command',
        command: 'Get-Content README.md',
        workingDirectory: 'C:\\dev\\codex-trusted-mode',
        environment: 'dev',
      },
    },
    {
      name: 'mutating_shell_deny',
      event: {
        toolName: 'functions.shell_command',
        command: 'git commit -m test',
        workingDirectory: 'C:\\dev\\codex-trusted-mode',
        environment: 'dev',
      },
    },
    {
      name: 'apply_patch_deny',
      event: {
        toolName: 'functions.apply_patch',
        workingDirectory: 'C:\\dev\\codex-trusted-mode',
        environment: 'dev',
      },
    },
  ];

  const results = [];
  for (const scenario of scenarios) {
    const result = await evaluateCodexEvent(scenario.event, {
      toolPolicyMode: 'PDP',
      pdpUrl,
      failClosed: true,
    });
    results.push({
      scenario: scenario.name,
      event: scenario.event,
      decision: result.decision,
      reasonCode: result.reasonCode,
      constraints: result.constraints || {},
      trace: result.trace,
      source: result.source,
    });
  }

  const outputPath = path.join(evidenceDir, '20260306-governed-example-results.json');
  fs.writeFileSync(outputPath, JSON.stringify({ pdpUrl, results }, null, 2));
  console.log(`Governed example results written to ${outputPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
