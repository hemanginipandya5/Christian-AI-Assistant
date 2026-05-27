"use client";

import { FormEvent, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ImageIcon, Loader2, Send } from "lucide-react";
import type { ChatMessage, Denomination } from "@/lib/types";

type ChatResponse = {
  answer?: string;
  citations?: string[];
  error?: string;
};

const denominations: { value: Denomination; label: string }[] = [
  { value: "neutral", label: "Neutral" },
  { value: "catholic", label: "Catholic" },
  { value: "protestant", label: "Protestant" },
  { value: "orthodox", label: "Orthodox" },
];

export function ChatInterface() {
  const [mode, setMode] = useState<"chat" | "image">("chat");
  const [denomination, setDenomination] = useState<Denomination>("neutral");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Ask a biblical or theological question. I will ground answers in retrieved scripture and flag unverifiable references.",
    },
  ]);
  const [input, setInput] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const recentHistory = useMemo(
    () => messages.filter((message) => message.role !== "assistant" || !message.content.startsWith("Ask a biblical")),
    [messages],
  );

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();

    if (!message || isLoading) {
      return;
    }

    setInput("");
    setIsLoading(true);
    setMessages((current) => [...current, { role: "user", content: message }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          denomination,
          history: recentHistory.slice(-5),
        }),
      });
      const data = (await response.json()) as ChatResponse;
      const content = data.answer ?? data.error ?? "I could not complete that request.";

      setMessages((current) => [...current, { role: "assistant", content }]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: "Something went wrong while contacting the assistant." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function generateImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = imagePrompt.trim();

    if (!prompt || isLoading) {
      return;
    }

    setIsLoading(true);
    setImageUrl("");

    try {
      const response = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = (await response.json()) as { imageUrl?: string; error?: string };

      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
      } else {
        setMessages((current) => [
          ...current,
          { role: "assistant", content: data.error ?? "Image generation failed." },
        ]);
      }
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: "Something went wrong while generating the image." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-parchment">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6">
        <header className="flex flex-col gap-3 border-b border-ink/15 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-ink">Christian AI Assistant</h1>
            <p className="mt-1 max-w-2xl text-sm text-ink/70">
              Grounded theological Q&amp;A, citation validation, denomination-aware responses, and moderated image generation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={denomination}
              onChange={(event) => setDenomination(event.target.value as Denomination)}
              className="h-10 rounded-md border border-ink/20 bg-white px-3 text-sm"
              aria-label="Denomination"
            >
              {denominations.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <div className="flex h-10 rounded-md border border-ink/20 bg-white p-1">
              <button
                type="button"
                onClick={() => setMode("chat")}
                className={`rounded px-3 text-sm ${mode === "chat" ? "bg-moss text-white" : "text-ink/70"}`}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => setMode("image")}
                className={`rounded px-3 text-sm ${mode === "image" ? "bg-moss text-white" : "text-ink/70"}`}
              >
                Image
              </button>
            </div>
          </div>
        </header>

        {mode === "chat" ? (
          <section className="flex min-h-0 flex-1 flex-col py-4">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-md border border-ink/15 bg-white p-4">
              {messages.map((message, index) => (
                <article
                  key={`${message.role}-${index}`}
                  className={`max-w-3xl rounded-md px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "ml-auto bg-moss text-white"
                      : "mr-auto border border-ink/10 bg-parchment text-ink"
                  }`}
                >
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </article>
              ))}
            </div>

            <form onSubmit={sendMessage} className="mt-4 flex gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about forgiveness, prayer, grace, or a specific verse..."
                className="min-h-14 flex-1 resize-none rounded-md border border-ink/20 bg-white px-3 py-3 text-sm outline-none focus:border-moss"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="flex h-14 w-14 items-center justify-center rounded-md bg-wine text-white disabled:opacity-60"
                aria-label="Send message"
                title="Send"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </form>
          </section>
        ) : (
          <section className="grid flex-1 gap-4 py-4 lg:grid-cols-[420px_1fr]">
            <form onSubmit={generateImage} className="rounded-md border border-ink/15 bg-white p-4">
              <label className="text-sm font-medium text-ink" htmlFor="image-prompt">
                Image prompt
              </label>
              <textarea
                id="image-prompt"
                value={imagePrompt}
                onChange={(event) => setImagePrompt(event.target.value)}
                placeholder="A peaceful stained glass scene of the Good Shepherd..."
                className="mt-2 min-h-40 w-full resize-none rounded-md border border-ink/20 px-3 py-3 text-sm outline-none focus:border-moss"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-wine px-4 text-sm font-medium text-white disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                Generate
              </button>
            </form>

            <div className="flex min-h-[360px] items-center justify-center rounded-md border border-ink/15 bg-white p-4">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="Generated Christian visual" className="max-h-[640px] rounded-md object-contain" />
              ) : (
                <p className="text-sm text-ink/60">Generated image will appear here.</p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

