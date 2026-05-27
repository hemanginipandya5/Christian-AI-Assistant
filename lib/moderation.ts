const blockedPatterns = [
  /justify\s+(genocide|slavery|racism|violence|terrorism)/i,
  /(racial|ethnic|religious)\s+superiority/i,
  /anti[-\s]?semitic/i,
  /hate\s+(sermon|speech|message|propaganda)/i,
  /support\s+violence/i,
  /extremist\s+propaganda/i,
  /rewrite\s+the\s+bible\s+to\s+justify/i,
  /use\s+christianity\s+to\s+(attack|harm|threaten)/i,
];

const promptAttackPatterns = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /reveal\s+(your\s+)?system\s+prompt/i,
  /developer\s+message/i,
  /bypass\s+(the\s+)?safety/i,
];

export function moderateText(input: string) {
  const blocked = blockedPatterns.find((pattern) => pattern.test(input));

  if (blocked) {
    return {
      allowed: false,
      reason:
        "I cannot help create hateful, extremist, or violent religious content. I can help discuss Christian ethics and scripture in a respectful, non-harmful way.",
    };
  }

  const attack = promptAttackPatterns.find((pattern) => pattern.test(input));

  if (attack) {
    return {
      allowed: false,
      reason:
        "I cannot follow requests to bypass instructions or safety controls. Please ask a direct theological or biblical question.",
    };
  }

  return { allowed: true };
}

