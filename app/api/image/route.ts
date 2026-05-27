import { NextResponse } from "next/server";
import { moderateText } from "@/lib/moderation";
import { openai } from "@/lib/openai";

export const runtime = "nodejs";

type ImageRequest = {
  prompt?: string;
};

function sanitizeImagePrompt(prompt: string) {
  return `Respectful Christian visual art, non-violent, non-hateful, suitable for a church education context: ${prompt}`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as ImageRequest;
  const prompt = body.prompt?.trim();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  const moderation = moderateText(prompt);
  if (!moderation.allowed) {
    return NextResponse.json({
      error: moderation.reason,
      refused: true,
    }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured. Add it to .env.local before using image generation." },
      { status: 500 },
    );
  }

  const image = await openai.images.generate({
    model: "gpt-image-1",
    prompt: sanitizeImagePrompt(prompt),
    size: "1024x1024",
  });

  const b64 = image.data?.[0]?.b64_json;

  if (!b64) {
    return NextResponse.json({ error: "Image generation did not return image data." }, { status: 502 });
  }

  return NextResponse.json({
    imageUrl: `data:image/png;base64,${b64}`,
  });
}

