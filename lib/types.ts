export type Denomination = "neutral" | "catholic" | "protestant" | "orthodox";

export type BibleVerse = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

export type RetrievedVerse = BibleVerse & {
  reference: string;
  score: number;
};

export type ChatMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
};

