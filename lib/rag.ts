import bible from "@/data/bible.json";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { BibleVerse, RetrievedVerse } from "./types";
import { formatReference } from "./citations";
import { openai } from "./openai";

type EmbeddedVerse = BibleVerse & {
  reference: string;
  embedding: number[];
};

const verses = bible as BibleVerse[];

const stopwords = new Set([
  "about",
  "after",
  "again",
  "against",
  "also",
  "and",
  "are",
  "bible",
  "biblical",
  "book",
  "christian",
  "christianity",
  "does",
  "for",
  "from",
  "give",
  "god",
  "have",
  "how",
  "into",
  "jesus",
  "lord",
  "say",
  "says",
  "scripture",
  "should",
  "the",
  "their",
  "there",
  "these",
  "they",
  "this",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "with",
  "you",
]);

const topicExpansions: Record<string, string[]> = {
  anxiety: ["anxious", "worry", "worried", "peace", "prayer", "care"],
  forgiveness: ["forgive", "forgiven", "forgiving", "mercy", "merciful", "pardon", "trespass"],
  forgivenes: ["forgive", "forgiven", "forgiving", "mercy", "merciful", "pardon", "trespass"],
  forgive: ["forgiveness", "forgiven", "forgiving", "mercy", "merciful", "pardon", "trespass"],
  grace: ["favor", "gift", "mercy", "salvation", "christ"],
  love: ["charity", "beloved", "neighbor", "neighbour", "mercy", "kind"],
  prayer: ["pray", "praying", "supplication", "request", "thanksgiving"],
  salvation: ["saved", "saves", "redeem", "redemption", "faith", "grace"],
  suffering: ["suffer", "suffering", "affliction", "trial", "trials", "comfort", "endure"],
  wisdom: ["wise", "understanding", "discernment", "knowledge"],
};

const topicalReferenceBoosts: Record<string, string[]> = {
  forgiveness: ["Matthew 6:14", "Ephesians 4:32", "Colossians 3:13", "Luke 6:37", "Matthew 18:21", "Matthew 18:22"],
  forgivenes: ["Matthew 6:14", "Ephesians 4:32", "Colossians 3:13", "Luke 6:37", "Matthew 18:21", "Matthew 18:22"],
  forgive: ["Matthew 6:14", "Ephesians 4:32", "Colossians 3:13", "Luke 6:37", "Matthew 18:21", "Matthew 18:22"],
  love: ["John 3:16", "Matthew 22:37", "Matthew 22:39", "1 Corinthians 13:4", "1 John 4:8"],
  prayer: ["Matthew 6:9", "Philippians 4:6", "James 5:16", "1 Thessalonians 5:17"],
  suffering: ["Romans 5:3", "Romans 8:18", "2 Corinthians 1:4", "James 1:2", "1 Peter 5:10"],
};

function stem(word: string) {
  if (word.endsWith("ss")) {
    return word;
  }

  return word.replace(/(ing|ed|es|s)$/i, "");
}

function tokenize(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .map(stem)
    .filter((word) => !stopwords.has(word));
}

function expandQueryTerms(query: string) {
  const terms = new Set(tokenize(query));

  for (const term of Array.from(terms)) {
    for (const expansion of topicExpansions[term] ?? []) {
      terms.add(stem(expansion.toLowerCase()));
    }
  }

  return terms;
}

function lexicalSearch(query: string, limit: number): RetrievedVerse[] {
  const queryTerms = expandQueryTerms(query);
  const boostedReferences = new Set(
    Array.from(queryTerms).flatMap((term) => topicalReferenceBoosts[term] ?? []),
  );

  return verses
    .map((verse) => {
      const verseTerms = tokenize(`${formatReference(verse)} ${verse.text}`);
      const uniqueVerseTerms = new Set(verseTerms);
      const overlap = Array.from(queryTerms).filter((term) => uniqueVerseTerms.has(term)).length;
      const phraseBonus = verse.text.toLowerCase().includes(query.toLowerCase()) ? 2 : 0;
      const referenceBonus = boostedReferences.has(formatReference(verse)) ? 4 : 0;

      return {
        ...verse,
        reference: formatReference(verse),
        score: overlap + phraseBonus + referenceBonus,
      };
    })
    .filter((verse) => verse.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function loadEmbeddedIndex(): Promise<EmbeddedVerse[] | null> {
  try {
    const filePath = path.join(process.cwd(), "data", "bible-embeddings.json");
    const file = await readFile(filePath, "utf8");
    return JSON.parse(file) as EmbeddedVerse[];
  } catch {
    return null;
  }
}

export async function retrieveScripture(query: string, limit = 5): Promise<RetrievedVerse[]> {
  const embeddedIndex = await loadEmbeddedIndex();

  if (!embeddedIndex || embeddedIndex.length === 0 || !process.env.OPENAI_API_KEY) {
    return lexicalSearch(query, limit);
  }

  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  const queryVector = embedding.data[0].embedding;

  return embeddedIndex
    .map((verse) => ({
      ...verse,
      score: cosineSimilarity(queryVector, verse.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
