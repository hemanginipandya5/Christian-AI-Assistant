import bible from "../data/bible.json";
import type { BibleVerse } from "./types";

const verses = bible as BibleVerse[];

const displayBookNames: Record<string, string> = {
  Psalms: "Psalm",
  SongofSongs: "Song of Songs",
  "1Samuel": "1 Samuel",
  "2Samuel": "2 Samuel",
  "1Kings": "1 Kings",
  "2Kings": "2 Kings",
  "1Chronicles": "1 Chronicles",
  "2Chronicles": "2 Chronicles",
  "1Maccabees": "1 Maccabees",
  "2Maccabees": "2 Maccabees",
  "1Corinthians": "1 Corinthians",
  "2Corinthians": "2 Corinthians",
  "1Thessalonians": "1 Thessalonians",
  "2Thessalonians": "2 Thessalonians",
  "1Timothy": "1 Timothy",
  "2Timothy": "2 Timothy",
  "1Peter": "1 Peter",
  "2Peter": "2 Peter",
  "1John": "1 John",
  "2John": "2 John",
  "3John": "3 John",
};

const aliases: Record<string, string> = {
  psalm: "psalms",
  psalms: "psalms",
  songofsongs: "songofsongs",
  songofsolomon: "songofsongs",
  canticles: "songofsongs",
};

function normalizeBookName(book: string) {
  const compact = book.toLowerCase().replace(/[^a-z0-9]/g, "");
  return aliases[compact] ?? compact;
}

export function displayBookName(book: string) {
  return displayBookNames[book] ?? book;
}

export function formatReference(verse: Pick<BibleVerse, "book" | "chapter" | "verse">) {
  return `${displayBookName(verse.book)} ${verse.chapter}:${verse.verse}`;
}

export function findVerse(book: string, chapter: number, verse: number) {
  const normalizedBook = normalizeBookName(book);

  return verses.find(
    (item) =>
      normalizeBookName(item.book) === normalizedBook &&
      item.chapter === chapter &&
      item.verse === verse,
  );
}

export function parseReference(input: string) {
  const match = input.match(/\b([1-3]?\s?[A-Za-z]+(?:\s[A-Za-z]+)*)\s+(\d{1,3}):(\d{1,3})\b/);

  if (!match) {
    return null;
  }

  return {
    book: match[1].replace(/\s+/g, " ").trim(),
    chapter: Number(match[2]),
    verse: Number(match[3]),
  };
}

export function validateRequestedReference(input: string) {
  const reference = parseReference(input);

  if (!reference) {
    return { hasReference: false, verified: false };
  }

  const verse = findVerse(reference.book, reference.chapter, reference.verse);

  return {
    hasReference: true,
    verified: Boolean(verse),
    reference: verse ? formatReference(verse) : `${reference.book} ${reference.chapter}:${reference.verse}`,
    verse,
  };
}

export function extractCitations(answer: string) {
  return Array.from(answer.matchAll(/\b([1-3]?\s?[A-Za-z]+(?:\s[A-Za-z]+)*)\s+(\d{1,3}):(\d{1,3})\b/g)).map(
    (match) => `${match[1].replace(/\s+/g, " ").trim()} ${match[2]}:${match[3]}`,
  );
}

export function validateAnswerCitations(answer: string, allowedReferences: string[]) {
  const allowed = new Set(allowedReferences.map((reference) => reference.toLowerCase()));
  const invalid = extractCitations(answer).filter((reference) => !allowed.has(reference.toLowerCase()));

  return {
    valid: invalid.length === 0,
    invalid,
  };
}
