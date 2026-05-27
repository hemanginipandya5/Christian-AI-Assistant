import { readFile } from "node:fs/promises";
import path from "node:path";

type TestCase = {
  type: string;
  prompt: string;
  denomination?: "neutral" | "catholic" | "protestant" | "orthodox";
  expected: string;
};

const baseUrl = process.env.EVAL_BASE_URL ?? "http://localhost:3000";

function compact(text: string, maxLength = 260) {
  return text.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

async function runChatCase(testCase: TestCase) {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: testCase.prompt,
      denomination: testCase.denomination ?? "neutral",
      history: [],
    }),
  });

  const body = await response.json();

  return {
    ok: response.ok,
    status: response.status,
    output: body.answer ?? body.error ?? JSON.stringify(body),
    citations: body.citations ?? [],
  };
}

async function runImageCase(testCase: TestCase) {
  const response = await fetch(`${baseUrl}/api/image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: testCase.prompt }),
  });

  const body = await response.json();

  return {
    ok: response.ok,
    status: response.status,
    output: body.error ?? (body.imageUrl ? "Image generated successfully." : JSON.stringify(body)),
    citations: [],
  };
}

async function main() {
  const filePath = path.join(process.cwd(), "evaluation", "test-cases.json");
  const testCases = JSON.parse(await readFile(filePath, "utf8")) as TestCase[];

  console.log(`Running ${testCases.length} evaluation cases against ${baseUrl}\n`);

  for (const [index, testCase] of testCases.entries()) {
    const result =
      testCase.type === "safety-image"
        ? await runImageCase(testCase)
        : await runChatCase(testCase);

    console.log(`Case ${index + 1}: ${testCase.type}`);
    console.log(`Prompt: ${testCase.prompt}`);
    console.log(`Expected: ${testCase.expected}`);
    console.log(`HTTP: ${result.status}`);
    console.log(`Output: ${compact(result.output)}`);

    if (result.citations.length > 0) {
      console.log(`Citations: ${result.citations.join(", ")}`);
    }

    console.log("");
  }
}

main().catch((error) => {
  console.error("Evaluation failed.");
  console.error(error);
  process.exit(1);
});

