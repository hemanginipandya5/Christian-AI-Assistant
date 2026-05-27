# Christian AI Assistant

A Christianity-focused AI assistant built for grounded theological Q&A, Bible citation retrieval, hallucination prevention, denomination-aware responses, moderation, image generation, and short conversational memory.

## Why This Architecture

This is not a generic chatbot wrapper. The chat flow is deliberately constrained:

1. User message
2. Moderation
3. Bible reference validation
4. Scripture retrieval
5. Grounded prompt construction
6. OpenAI response
7. Citation validation
8. UI response

## RAG And Hallucination Prevention

The assistant retrieves scripture from `data/bible.json` before calling the language model. The prompt tells the model to cite only retrieved context, and `lib/citations.ts` checks generated citations against the allowed retrieved references.

This matters because Bible hallucinations are especially damaging: a fake citation can look authoritative even when it does not exist.

The app supports two retrieval modes:

- `scripts/embedBible.ts` generates `data/bible-embeddings.json` with `text-embedding-3-small`.
- `lib/rag.ts` uses the embedding index when present, and falls back to keyword retrieval for local demos before embeddings are generated.

The assignment mentioned ChromaDB. This implementation keeps ChromaDB in the embedding script path, but the Next.js API route reads from a local JSON vector index. That avoids bundling Chroma's optional server-side embedding packages into the Next app while preserving the same RAG boundary: only retrieved verses are injected into the model prompt.

## Moderation

`lib/moderation.ts` blocks harmful religious misuse, including:

- hateful or extremist religious content
- attempts to justify violence, genocide, racism, or slavery
- adversarial prompt injection
- unsafe image-generation prompts

The goal is not to over-filter normal theological debate. The goal is to prevent the system from producing harmful religious propaganda or manipulated scripture.

## Denomination Awareness

The UI includes a denomination selector:

- Neutral
- Catholic
- Protestant
- Orthodox

`lib/prompts.ts` injects the user preference into the prompt. When traditions differ, the assistant should acknowledge differences respectfully rather than flattening Christian traditions into one answer.

## Citation Validation

`lib/citations.ts` validates references against `data/bible.json`.

Example:

```text
User: Explain John 52:11
Assistant: I could not verify John 52:11 in the local Bible dataset...
```

This is a key differentiator from a generic chatbot.

## Image Generation

`app/api/image/route.ts` uses OpenAI image generation after moderation and prompt sanitization. It refuses hateful, extremist, and violent religious imagery.

## Memory

The app uses simple short-term memory through `lib/memory.ts`. It passes only the last five messages to the chat route, which is enough for context without creating unnecessary persistence or privacy risk.

## Setup

Install Node.js first if it is not available on your machine.

```bash
npm install
```

Create `.env.local`:

```bash
OPENAI_API_KEY=your_key_here
# Optional, if running ChromaDB separately:
# CHROMA_URL=http://localhost:8000
```

Run the development server:

```bash
npm run dev
```

Optional embedding generation:

```bash
npm run embed:bible
```

Then open `http://localhost:3000`.

## Dataset Note

`data/bible.json` contains the full Bible dataset converted from the provided archive into the flat shape used by the RAG layer:

```json
[
  {
    "book": "John",
    "chapter": 3,
    "verse": 16,
    "text": "For God so loved the world..."
  }
]
```

The included dataset has 35,091 verse records across 73 books. After changing the dataset, run `npm run embed:bible` to regenerate the local vector index.

## More Documentation

- `RUN_PROJECT.md` explains setup, environment variables, and demo commands.
- `PROJECT_WALKTHROUGH.md` explains the architecture, design decisions, edge cases, and a 5-8 minute walkthrough script.

## Evaluation

Test cases live in `evaluation/test-cases.json` and cover:

- fake verses
- adversarial prompts
- harmful religious misuse
- denomination conflicts
- citation grounding
- image safety
- short-term memory
