import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const evidenceDir = path.join(repoRoot, 'release-evidence');

const observedEvidence = path.join(evidenceDir, '20260306-observed-runtime-validation.md');
const freeDemoEvidence = path.join(evidenceDir, '20260306-free-demo-results.json');
const governedEvidence = path.join(evidenceDir, '20260306-governed-example-results.json');
const nativeHookEvidence = path.join(evidenceDir, 'native-hook-evidence.json');

assert.ok(fs.existsSync(observedEvidence), 'observed runtime validation evidence is missing');
assert.ok(fs.existsSync(freeDemoEvidence), 'free demo evidence is missing');
assert.ok(fs.existsSync(governedEvidence), 'governed example evidence is missing');

let hasNativeHookEvidence = false;
if (fs.existsSync(nativeHookEvidence)) {
  const nativeHook = JSON.parse(fs.readFileSync(nativeHookEvidence, 'utf8'));
  hasNativeHookEvidence = nativeHook.status === 'captured'
    && nativeHook.source === 'real_runtime'
    && typeof nativeHook.observed?.toolName === 'string'
    && nativeHook.observed.toolName.length > 0
    && typeof nativeHook.observed?.decision === 'string'
    && nativeHook.observed.decision.length > 0;
}
const releaseStatus = hasNativeHookEvidence ? 'CERTIFIED_ENFORCED_READY' : 'LOCKDOWN_ONLY_READY';

console.log(JSON.stringify({
  releaseStatus,
  hasNativeHookEvidence,
  requiredEvidence: [
    path.basename(observedEvidence),
    path.basename(freeDemoEvidence),
    path.basename(governedEvidence),
  ],
  missingForCertifiedEnforced: hasNativeHookEvidence ? [] : ['native-hook-evidence.json'],
}, null, 2));
