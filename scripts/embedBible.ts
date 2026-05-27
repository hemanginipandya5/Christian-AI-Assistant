import { writeFile } from "node:fs/promises";
import path from "node:path";
import bible from "../data/bible.json";
import { openai } from "../lib/openai";
import { formatReference } from "../lib/citations";
import type { BibleVerse } from "../lib/types";

type EmbeddedVerse = BibleVerse & {
  reference: string;
  embedding: number[];
};

async function syncChroma(embedded: EmbeddedVerse[]) {
  if (!process.env.CHROMA_URL) {
    return;
  }

  const { ChromaClient } = await import("chromadb");
  const client = new ChromaClient({ path: process.env.CHROMA_URL });
  const collection = await client.getOrCreateCollection({ name: "bible" });

  await collection.upsert({
    ids: embedded.map((verse) => verse.reference),
    documents: embedded.map((verse) => verse.text),
    embeddings: embedded.map((verse) => verse.embedding),
    metadatas: embedded.map((verse) => ({
      book: verse.book,
      chapter: verse.chapter,
      verse: verse.verse,
      reference: verse.reference,
    })),
  });
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to generate embeddings.");
  }

  const verses = bible as BibleVerse[];
  const embedded = [];

  for (const verse of verses) {
    const reference = formatReference(verse);
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: `${reference} ${verse.text}`,
    });

    embedded.push({
      ...verse,
      reference,
      embedding: response.data[0].embedding,
    });
  }

  const output = path.join(process.cwd(), "data", "bible-embeddings.json");
  await writeFile(output, JSON.stringify(embedded, null, 2));
  console.log(`Embedded ${embedded.length} verses into ${output}`);

  await syncChroma(embedded);
  if (process.env.CHROMA_URL) {
    console.log(`Synced ${embedded.length} verses to ChromaDB at ${process.env.CHROMA_URL}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
