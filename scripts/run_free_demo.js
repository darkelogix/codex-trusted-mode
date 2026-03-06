import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateCodexEvent } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const evidenceDir = path.join(repoRoot, 'release-evidence');

async function run() {
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
      name: 'mutating_shell_block',
      event: {
        toolName: 'functions.shell_command',
        command: 'git commit -m test',
        workingDirectory: 'C:\\dev\\codex-trusted-mode',
        environment: 'dev',
      },
    },
    {
      name: 'apply_patch_block',
      event: {
        toolName: 'functions.apply_patch',
        workingDirectory: 'C:\\dev\\codex-trusted-mode',
        environment: 'dev',
      },
    },
    {
      name: 'update_plan_allow',
      event: {
        toolName: 'functions.update_plan',
        workingDirectory: 'C:\\dev\\codex-trusted-mode',
        environment: 'dev',
      },
    },
  ];

  const results = [];
  for (const scenario of scenarios) {
    const result = await evaluateCodexEvent(scenario.event, {
      toolPolicyMode: 'ALLOWLIST_ONLY',
    });
    results.push({
      scenario: scenario.name,
      event: scenario.event,
      decision: result.decision,
      reasonCode: result.reasonCode,
      source: result.source,
      trace: result.trace,
    });
  }

  const outputPath = path.join(evidenceDir, '20260306-free-demo-results.json');
  fs.writeFileSync(outputPath, JSON.stringify({ results }, null, 2));
  console.log(`Free demo results written to ${outputPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
