import type { ChatMessage } from "./types";

const MAX_MEMORY_MESSAGES = 5;

export function trimMemory(messages: ChatMessage[] = []) {
  return messages.slice(-MAX_MEMORY_MESSAGES).map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

