const ROMAN_NUMERALS = new Set([
  "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x",
  "xi", "xii", "xiii", "xiv", "xv", "xvi", "xvii", "xviii", "xix", "xx",
]);

function normalizeTokens(name: string) {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function stripTrailingSequence(tokens: string[]) {
  const next = [...tokens];
  while (next.length > 1) {
    const last = next[next.length - 1];
    if (/^\d+$/.test(last) || ROMAN_NUMERALS.has(last)) {
      next.pop();
      continue;
    }
    break;
  }
  return next;
}

export function inferFranchiseName(seedName: string, seriesNames: string[]) {
  const seedBase = stripTrailingSequence(
    normalizeTokens(seedName.split(/[:\-–—]/)[0] ?? seedName)
  ).join(" ");

  if (seedBase && seriesNames.some(name => normalizeTokens(name).join(" ").startsWith(seedBase))) {
    return seedBase
      .split(" ")
      .map(token => token.charAt(0).toUpperCase() + token.slice(1))
      .join(" ");
  }

  const tokenSets = seriesNames.map(name => stripTrailingSequence(normalizeTokens(name)));
  if (!tokenSets.length) {
    return null;
  }

  const shortest = tokenSets.reduce((acc, tokens) => Math.min(acc, tokens.length), Infinity);
  const common: string[] = [];
  for (let i = 0; i < shortest; i += 1) {
    const token = tokenSets[0][i];
    if (tokenSets.every(tokens => tokens[i] === token)) {
      common.push(token);
    } else {
      break;
    }
  }

  const candidate = common.join(" ").trim();
  if (!candidate || candidate.length < 3) {
    return null;
  }

  return candidate
    .split(" ")
    .map(token => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}
