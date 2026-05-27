import bible from "../data/bible.json";
import type { BibleVerse } from "./types";

const verses = bible as BibleVerse[];

export function formatReference(verse: Pick<BibleVerse, "book" | "chapter" | "verse">) {
  return `${verse.book} ${verse.chapter}:${verse.verse}`;
}

export function findVerse(book: string, chapter: number, verse: number) {
  return verses.find(
    (item) =>
      item.book.toLowerCase() === book.toLowerCase() &&
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
    reference: `${reference.book} ${reference.chapter}:${reference.verse}`,
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
