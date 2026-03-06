import fs from 'node:fs';
import path from 'node:path';
import { evaluateAppServerApprovalRequest } from '../src/index.js';

const cwd = process.cwd();
const requests = [
  JSON.parse(fs.readFileSync(path.join(cwd, 'examples', 'native-command-approval-request.json'), 'utf8')),
  JSON.parse(fs.readFileSync(path.join(cwd, 'examples', 'native-file-change-approval-request.json'), 'utf8')),
];

const results = [];
for (const request of requests) {
  results.push(await evaluateAppServerApprovalRequest(request));
}

const output = {
  generatedAt: new Date().toISOString(),
  source: 'native_approval_bridge_demo',
  results,
};

const outputPath = path.join(cwd, 'release-evidence', 'native-approval-bridge-demo-results.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
