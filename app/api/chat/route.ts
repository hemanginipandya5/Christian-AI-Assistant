import { NextResponse } from "next/server";
import { validateAnswerCitations, validateRequestedReference } from "@/lib/citations";
import { trimMemory } from "@/lib/memory";
import { moderateText } from "@/lib/moderation";
import { openai } from "@/lib/openai";
import { buildGroundedPrompt, SYSTEM_PROMPT } from "@/lib/prompts";
import { retrieveScripture } from "@/lib/rag";
import type { ChatMessage, Denomination } from "@/lib/types";

export const runtime = "nodejs";

type ChatRequest = {
  message?: string;
  denomination?: Denomination;
  history?: ChatMessage[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as ChatRequest;
  const message = body.message?.trim();
  const denomination = body.denomination ?? "neutral";

  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const moderation = moderateText(message);
  if (!moderation.allowed) {
    return NextResponse.json({
      answer: moderation.reason,
      citations: [],
      refused: true,
    });
  }

  const requestedReference = validateRequestedReference(message);
  if (requestedReference.hasReference && !requestedReference.verified) {
    return NextResponse.json({
      answer: `I could not verify ${requestedReference.reference} in the local Bible dataset, so I should not explain it as a real scripture reference.`,
      citations: [],
      refused: false,
    });
  }

  const verses = await retrieveScripture(message, 5);

  if (verses.length === 0) {
    return NextResponse.json({
      answer:
        "I could not retrieve enough relevant scripture from the local dataset to answer this responsibly. Try asking with a specific theme or reference.",
      citations: [],
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured. Add it to .env.local before using chat." },
      { status: 500 },
    );
  }

  const prompt = buildGroundedPrompt({
    message,
    denomination,
    verses,
    memory: trimMemory(body.history),
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 650,
  });

  const answer = completion.choices[0]?.message.content?.trim() ?? "";
  const allowedReferences = verses.map((verse) => verse.reference);
  const citationCheck = validateAnswerCitations(answer, allowedReferences);

  if (!citationCheck.valid) {
    return NextResponse.json({
      answer:
        "I could not safely return that answer because it included scripture citations that were not present in the retrieved context. Please ask again or use a more specific Bible reference.",
      citations: allowedReferences,
      invalidCitations: citationCheck.invalid,
    });
  }

  return NextResponse.json({
    answer,
    citations: allowedReferences,
    retrieved: verses,
  });
}
