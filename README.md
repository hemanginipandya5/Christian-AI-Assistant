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

The assignment mentioned ChromaDB. This implementation supports ChromaDB when `CHROMA_URL` is configured and also writes a local JSON vector index so reviewers can run the app without managing a vector database service. The retrieval boundary is the same in both modes: only retrieved verses are injected into the model prompt.

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

## Important Dataset Note

`data/bible.json` contains a small KJV-style sample dataset so the project is reviewable immediately. For production or a stronger demo, replace it with a complete public-domain Bible JSON in the same shape:

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

After replacing the dataset, run `npm run embed:bible`.

## Evaluation

Test cases live in `evaluation/test-cases.json` and cover:

- fake verses
- adversarial prompts
- harmful religious misuse
- denomination conflicts
- citation grounding
- image safety
- short-term memory
