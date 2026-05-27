import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Christian AI Assistant",
  description: "A grounded Christianity-focused AI assistant with RAG, citation checks, moderation, and memory.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

