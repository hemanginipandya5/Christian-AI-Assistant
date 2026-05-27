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

function tokenize(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function lexicalSearch(query: string, limit: number): RetrievedVerse[] {
  const queryTerms = new Set(tokenize(query));

  return verses
    .map((verse) => {
      const verseTerms = tokenize(`${formatReference(verse)} ${verse.text}`);
      const overlap = verseTerms.filter((term) => queryTerms.has(term)).length;
      const phraseBonus = verse.text.toLowerCase().includes(query.toLowerCase()) ? 2 : 0;

      return {
        ...verse,
        reference: formatReference(verse),
        score: overlap + phraseBonus,
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
