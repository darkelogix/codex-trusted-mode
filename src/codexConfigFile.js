import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function stripInlineComment(line) {
  let inSingle = false;
  let inDouble = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const previous = index > 0 ? line[index - 1] : '';
    if (char === '"' && !inSingle && previous !== '\\') inDouble = !inDouble;
    if (char === "'" && !inDouble && previous !== '\\') inSingle = !inSingle;
    if (char === '#' && !inSingle && !inDouble) {
      return line.slice(0, index).trim();
    }
  }
  return line.trim();
}

function parseArray(rawValue) {
  const inner = rawValue.slice(1, -1).trim();
  if (!inner) return [];

  const values = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;

  for (let index = 0; index < inner.length; index += 1) {
    const char = inner[index];
    const previous = index > 0 ? inner[index - 1] : '';
    if (char === '"' && !inSingle && previous !== '\\') inDouble = !inDouble;
    if (char === "'" && !inDouble && previous !== '\\') inSingle = !inSingle;

    if (char === ',' && !inSingle && !inDouble) {
      values.push(parseTomlValue(current.trim()));
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    values.push(parseTomlValue(current.trim()));
  }

  return values;
}

export function parseTomlValue(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) return '';

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+$/.test(value)) return Number.parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return Number.parseFloat(value);
  if (value.startsWith('[') && value.endsWith(']')) return parseArray(value);

  return value;
}

export function defaultCodexConfigPath({ env = process.env, homeDir = os.homedir() } = {}) {
  const codexHome = env.CODEX_HOME || path.join(homeDir, '.codex');
  return path.join(codexHome, 'config.toml');
}

export function parseCodexTrustedModeSection(text, appId = 'codex-trusted-mode') {
  const lines = String(text || '').split(/\r?\n/);
  const targetSection = `[apps.${appId}]`;
  let inTargetSection = false;
  const result = {};

  for (const originalLine of lines) {
    const line = stripInlineComment(originalLine);
    if (!line) continue;

    if (line.startsWith('[') && line.endsWith(']')) {
      inTargetSection = line === targetSection;
      continue;
    }

    if (!inTargetSection) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    if (!key) continue;

    result[key] = parseTomlValue(rawValue);
  }

  return result;
}

export function loadCodexTrustedModeConfig({ configPath, appId = 'codex-trusted-mode', env = process.env, homeDir } = {}) {
  const resolvedPath = configPath ? path.resolve(configPath) : defaultCodexConfigPath({ env, homeDir });
  if (!fs.existsSync(resolvedPath)) {
    return {};
  }

  return parseCodexTrustedModeSection(fs.readFileSync(resolvedPath, 'utf8'), appId);
}

export function loadBridgeOverrides({ configPath, overridePath, appId = 'codex-trusted-mode', env = process.env, homeDir } = {}) {
  const codexConfig = loadCodexTrustedModeConfig({ configPath, appId, env, homeDir });
  if (!overridePath) {
    return codexConfig;
  }

  const jsonOverrides = JSON.parse(fs.readFileSync(path.resolve(overridePath), 'utf8'));
  return {
    ...codexConfig,
    ...jsonOverrides,
  };
}
