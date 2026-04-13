const CONTROL_OPERATOR_TOKENS = ['&&', '||', '>>', ';', '|', '>', '<', '`', '$(', '\n', '\r'];
const TOKEN_PATTERN = /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|[^\s]+/g;
const EXECUTABLE_SUFFIXES = ['.exe', '.cmd', '.bat', '.com'];
const BROAD_INTERPRETERS = new Set([
  'bash',
  'cmd',
  'deno',
  'env',
  'fish',
  'ksh',
  'lua',
  'node',
  'nodejs',
  'perl',
  'php',
  'powershell',
  'pwsh',
  'py',
  'python',
  'python3',
  'ruby',
  'sh',
  'wscript',
  'zsh',
]);

function stripWrappingQuotes(token) {
  const trimmed = String(token || '').trim();
  if (!trimmed) return '';
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith('\'') && trimmed.endsWith('\''))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function containsShellControlOperator(command) {
  const normalized = String(command || '');
  return CONTROL_OPERATOR_TOKENS.some((token) => normalized.includes(token));
}

export function normalizeProgramName(program) {
  const normalized = String(program || '').trim().replace(/\\/g, '/');
  const basename = normalized.split('/').pop().toLowerCase();
  for (const suffix of EXECUTABLE_SUFFIXES) {
    if (basename.endsWith(suffix)) {
      return basename.slice(0, -suffix.length);
    }
  }
  return basename;
}

export function tokenizeShellCommand(command) {
  const normalized = String(command || '').trim();
  if (!normalized) return [];
  const matches = normalized.match(TOKEN_PATTERN);
  if (!matches) return [];
  return matches.map(stripWrappingQuotes).filter(Boolean);
}

export function buildShellCommandRules(prefixes) {
  if (!Array.isArray(prefixes)) return [];
  return prefixes
    .map((prefix) => tokenizeShellCommand(prefix))
    .filter((tokens) => tokens.length > 0)
    .map((tokens) => ({
      program: normalizeProgramName(tokens[0]),
      subcommands: tokens.slice(1).map((token) => token.toLowerCase()),
    }));
}

export function findMatchingShellCommandRule(tokens, rules) {
  if (!Array.isArray(tokens) || tokens.length === 0) return null;
  const normalizedTokens = [
    normalizeProgramName(tokens[0]),
    ...tokens.slice(1).map((token) => String(token).toLowerCase()),
  ];

  return rules.find((rule) => {
    if (normalizedTokens[0] !== rule.program) return false;
    if (!Array.isArray(rule.subcommands) || rule.subcommands.length === 0) return true;
    if (normalizedTokens.length < 1 + rule.subcommands.length) return false;
    return rule.subcommands.every((part, index) => normalizedTokens[index + 1] === part);
  }) || null;
}

export function evaluateReadonlyShellCommand(command, prefixes) {
  if (containsShellControlOperator(command)) {
    return { allowed: false, denyKind: 'control_operator' };
  }

  const tokens = tokenizeShellCommand(command);
  if (tokens.length === 0) {
    return { allowed: false, denyKind: 'invalid_payload' };
  }

  if (BROAD_INTERPRETERS.has(normalizeProgramName(tokens[0]))) {
    return { allowed: false, denyKind: 'broad_interpreter' };
  }

  const matchedRule = findMatchingShellCommandRule(tokens, buildShellCommandRules(prefixes));
  if (!matchedRule) {
    return { allowed: false, denyKind: 'rule_miss' };
  }

  return { allowed: true, matchedRule };
}

export function matchesShellCommandRule(tokens, rules) {
  return Boolean(findMatchingShellCommandRule(tokens, rules));
}

export function isAllowedReadonlyShellCommand(command, prefixes) {
  return evaluateReadonlyShellCommand(command, prefixes).allowed;
}
