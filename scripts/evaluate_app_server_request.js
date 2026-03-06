import fs from 'node:fs';
import path from 'node:path';
import { evaluateAppServerApprovalRequest } from '../src/index.js';

function getFlag(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return '';
  return process.argv[index + 1] || '';
}

const inputPath = getFlag('--input');
const configPath = getFlag('--config');

if (!inputPath) {
  console.error('Usage: node scripts/evaluate_app_server_request.js --input <request.json> [--config <config.json>]');
  process.exit(1);
}

const absoluteInput = path.resolve(inputPath);
const request = JSON.parse(fs.readFileSync(absoluteInput, 'utf8'));
const overrides = configPath ? JSON.parse(fs.readFileSync(path.resolve(configPath), 'utf8')) : {};
const result = await evaluateAppServerApprovalRequest(request, overrides);
console.log(JSON.stringify(result, null, 2));
