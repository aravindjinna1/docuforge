import { ENV } from "../config/env";
import type { DocumentType, AnyDocumentInputs, RefineAction, PromptContext } from "../types";
import {
  buildGenerationPrompt,
  buildRefineGenerationPrompt,
} from "./promptService";

interface CallOptions {
  systemPrompt: string;
  userPrompt: string;
}

// ─── Gemini 1.5 Flash ──────────────────────────────────────────────
async function callGemini({ systemPrompt, userPrompt }: CallOptions): Promise<string> {
  if (!ENV.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${ENV.GEMINI_API_KEY}`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.65,
      topP: 0.9,
      maxOutputTokens: 2048,
      stopSequences: [],
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text?.trim()) throw new Error("Gemini returned empty content");

  return text.trim();
}

// ─── Groq (llama3-70b) ───────────────────────────────────────────
async function callGroq({ systemPrompt, userPrompt }: CallOptions): Promise<string> {
  if (!ENV.GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.65,
      max_tokens: 2048,
      top_p: 0.9,
      stream: false,
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const text = data.choices?.[0]?.message?.content;
  if (!text?.trim()) throw new Error("Groq returned empty content");

  return text.trim();
}

// ─── Provider chain with fallback ─────────────────────────────────
type Provider = { name: string; fn: (opts: CallOptions) => Promise<string> };

function getProviderChain(): Provider[] {
  const chain: Provider[] = [];
  if (ENV.GEMINI_API_KEY) chain.push({ name: "Gemini", fn: callGemini });
  if (ENV.GROQ_API_KEY) chain.push({ name: "Groq", fn: callGroq });
  return chain;
}

async function callAI(opts: CallOptions): Promise<string> {
  const chain = getProviderChain();
  if (chain.length === 0) {
    throw new Error(
      "No AI providers configured. Set GEMINI_API_KEY or GROQ_API_KEY in your .env file."
    );
  }

  const errors: string[] = [];

  for (const provider of chain) {
    try {
      console.log(`[AI] Attempting with ${provider.name}…`);
      const result = await provider.fn(opts);
      console.log(`[AI] ${provider.name} succeeded (${result.length} chars)`);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[AI] ${provider.name} failed: ${msg}`);
      errors.push(`${provider.name}: ${msg}`);
    }
  }

  throw new Error(
    `All AI providers failed.\n${errors.join("\n")}`
  );
}

// ─── Public service functions ──────────────────────────────────────
export async function generateWithAI(
  docType: DocumentType,
  inputs: AnyDocumentInputs,
  ctx: PromptContext = {}
): Promise<string> {
  const prompts = buildGenerationPrompt(docType, inputs, ctx);
  return callAI(prompts);
}

export async function refineWithAI(
  docType: DocumentType,
  action: RefineAction,
  existingContent: string
): Promise<string> {
  const prompts = buildRefineGenerationPrompt(docType, action, existingContent);
  return callAI(prompts);
}
