const CONTROL_OPERATOR_TOKENS = ['&&', '||', '>>', ';', '|', '>', '<', '`', '$(', '\n', '\r'];
const TOKEN_PATTERN = /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|[^\s]+/g;

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
      program: tokens[0].toLowerCase(),
      subcommands: tokens.slice(1).map((token) => token.toLowerCase()),
    }));
}

export function matchesShellCommandRule(tokens, rules) {
  if (!Array.isArray(tokens) || tokens.length === 0) return false;
  const normalizedTokens = tokens.map((token) => String(token).toLowerCase());

  return rules.some((rule) => {
    if (normalizedTokens[0] !== rule.program) return false;
    if (!Array.isArray(rule.subcommands) || rule.subcommands.length === 0) return true;
    if (normalizedTokens.length < 1 + rule.subcommands.length) return false;
    return rule.subcommands.every((part, index) => normalizedTokens[index + 1] === part);
  });
}

export function isAllowedReadonlyShellCommand(command, prefixes) {
  if (containsShellControlOperator(command)) return false;
  const tokens = tokenizeShellCommand(command);
  if (tokens.length === 0) return false;
  return matchesShellCommandRule(tokens, buildShellCommandRules(prefixes));
}
