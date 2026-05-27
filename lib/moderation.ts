const blockedPatterns = [
  /justify\s+(genocide|slavery|racism|violence|terrorism)/i,
  /(racial|ethnic|religious)\s+superiority/i,
  /(biblical|christian|scriptural)\s+(case|argument|proof)\s+for\s+(racism|slavery|genocide|ethnic cleansing|racial hierarchy)/i,
  /anti[-\s]?semitic/i,
  /hate\s+(sermon|speech|message|propaganda)/i,
  /holy\s+war\s+against/i,
  /prove\s+.+\s+(is|are)\s+cursed/i,
  /use\s+scripture\s+to\s+(shame|dehumanize|attack|humiliate)/i,
  /make\s+.+\s+propaganda/i,
  /support\s+violence/i,
  /extremist\s+propaganda/i,
  /rewrite\s+the\s+bible\s+to\s+justify/i,
  /use\s+christianity\s+to\s+(attack|harm|threaten)/i,
];

const imageBlockedPatterns = [
  /crusade\s+propaganda/i,
  /martyrdom\s+gore/i,
  /bloody\s+(crucifixion|martyrdom|religious)/i,
  /christian\s+symbols?\s+with\s+(nazi|isis|terrorist|extremist)/i,
  /demonize\s+(jews|muslims|catholics|protestants|orthodox|atheists|hindus|buddhists)/i,
  /violent\s+apocalypse\s+against/i,
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

export function moderateImagePrompt(input: string) {
  const textModeration = moderateText(input);

  if (!textModeration.allowed) {
    return textModeration;
  }

  const blocked = imageBlockedPatterns.find((pattern) => pattern.test(input));

  if (blocked) {
    return {
      allowed: false,
      reason:
        "I cannot help generate hateful, extremist, graphic, or violent religious imagery. I can help create respectful Christian educational or devotional visuals.",
    };
  }

  return { allowed: true };
}
