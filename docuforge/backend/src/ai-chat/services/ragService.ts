/**
 * ============================================================
 *  RAG Service — LangChain + Gemini + Pinecone
 *
 *  Pipeline when user asks a question:
 *  1. Take the user's question
 *  2. Convert question to a vector (embedding) using Gemini
 *  3. Search Pinecone for similar document chunks
 *  4. Build context from retrieved chunks
 *  5. Send context + question to Gemini for final answer
 *
 *  Resiliency:
 *  - Uploads parse + chunk fast and persist text locally.
 *  - Pinecone embedding runs in the background (non-blocking).
 *  - Query falls back to a local keyword search over stored text
 *    when Pinecone returns no results or is unavailable.
 * ============================================================
 */
import { ENV } from "../../config/env";

// ─── Dynamic imports for heavy dependencies ─────────────────────
// These are imported lazily to avoid crashes if env vars aren't set

let _Embeddings: any = null;
let _ChatLLM: any = null;
let _PineconeClient: any = null;
let _PineconeStore: any = null;
let _Document: any = null;

async function ensureDeps() {
  if (!_Embeddings && ENV.GEMINI_API_KEY) {
    const genai = await import("@langchain/google-genai");
    _Embeddings = genai.GoogleGenerativeAIEmbeddings;
    _ChatLLM = genai.ChatGoogleGenerativeAI;
  }
  if (!_PineconeClient && ENV.PINECONE_API_KEY) {
    const pc = await import("@pinecone-database/pinecone");
    _PineconeClient = pc.Pinecone;
  }
  if (!_PineconeStore && ENV.PINECONE_API_KEY) {
    const ps = await import("@langchain/pinecone");
    _PineconeStore = ps.PineconeStore;
  }
  if (!_Document) {
    const cd = await import("@langchain/core/documents");
    _Document = cd.Document;
  }
}

function getEmbeddings() {
  if (!_Embeddings) throw new Error("Embeddings not loaded");
  return new _Embeddings({
    apiKey: ENV.GEMINI_API_KEY,
    model: "embedding-001",
  });
}

function getLLM() {
  if (!_ChatLLM) throw new Error("LLM not loaded");
  return new _ChatLLM({
    apiKey: ENV.GEMINI_API_KEY,
    model: "gemini-2.5-flash",
    temperature: 0.65,
    maxOutputTokens: 2048,
  });
}

function getPineconeIndex() {
  if (!_PineconeClient) throw new Error("Pinecone not loaded");
  const pinecone = new _PineconeClient({ apiKey: ENV.PINECONE_API_KEY });
  return pinecone.index(ENV.PINECONE_INDEX);
}

import { chunkText, parseFile, truncateText } from "./fileParserService";

// ─── 1. Parse + chunk (fast, no network) ──────────────────────────
/**
 * Parse a file and split its text into chunks. This is synchronous / fast
 * and does NOT touch Pinecone — used to persist locally and respond quickly.
 */
export async function parseAndChunk(
  filePath: string,
  mimeType: string
): Promise<{ text: string; chunks: string[]; pageCount?: number }> {
  const parsed = await parseFile(filePath, mimeType);
  const chunks = chunkText(parsed.text, 1000, 200);
  return { text: parsed.text, chunks, pageCount: parsed.pageCount };
}

// ─── 2. Store document chunks in Pinecone (background) ────────────
/**
 * Embed chunks and upsert them into Pinecone under a per-user/per-file
 * namespace. Intended to run in the background after the upload responds.
 */
export async function storeInPinecone(
  userId: string,
  fileId: string,
  filePath: string,
  mimeType: string,
  fileName: string
): Promise<{ chunkCount: number; namespace: string }> {
  const { text, chunks } = await parseAndChunk(filePath, mimeType);
  const namespace = `user-${userId}-file-${fileId}`;

  console.log(`[RAG] 🔄 Storing ${chunks.length} chunks in Pinecone (namespace: ${namespace})`);

  try {
    await ensureDeps();
    const embeddingModel = getEmbeddings();
    const pineconeIndex = getPineconeIndex();

    const docs = chunks.map(
      (textChunk: string, i: number) =>
        new _Document({
          pageContent: textChunk,
          metadata: {
            userId,
            fileId,
            fileName,
            chunkIndex: i,
            totalChunks: chunks.length,
          },
        })
    );

    await _PineconeStore.fromDocuments(docs, embeddingModel, {
      pineconeIndex,
      namespace,
    });
    console.log(`[RAG] ✅ Stored ${chunks.length} chunks in Pinecone (namespace: ${namespace})`);
  } catch (err: any) {
    console.warn(`[RAG] ⚠️ Pinecone storage failed: ${err.message}`);
  }

  return { chunkCount: chunks.length, namespace };
}

// ─── 3. Local keyword-search fallback ─────────────────────────────
/**
 * Score locally stored chunks by overlap of query terms. Used when
 * Pinecone is unavailable or returns no results.
 */
export function localSearch(
  storedText: string,
  fileName: string,
  query: string,
  topK = 3
): Array<{ pageContent: string; metadata: Record<string, unknown>; score: number }> {
  if (!storedText) return [];

  const chunks = chunkText(storedText, 1000, 200);
  const stopwords = new Set([
    "a","an","the","is","are","was","were","be","been","being","to","of","in",
    "on","for","with","and","or","but","at","by","from","as","it","its","this",
    "that","these","those","what","which","who","whom","how","when","where",
    "do","does","did","have","has","had","will","would","can","could","should",
    "about","into","over","after","before","not","no","i","you","he","she","we",
    "they","my","your","their","our","me","us","them","if","then","than","so",
  ]);
  const qTokens = query.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !stopwords.has(t));

  if (qTokens.length === 0) return [];

  const scored = chunks
    .map((chunk, i) => {
      const lower = chunk.toLowerCase();
      let score = 0;
      for (const token of qTokens) {
        if (lower.includes(token)) score += 1;
      }
      // Give a slight boost to longer matches and earlier chunks
      score += Math.min(score, 1) * 0.5;
      return {
        pageContent: chunk,
        metadata: { fileName, chunkIndex: i },
        score,
        i,
      };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, topK);

  return scored.map(({ pageContent, metadata, score }) => ({ pageContent, metadata, score }));
}

// ─── 4. Answer a user's question using RAG ─────────────────────────
export async function queryWithRAG(options: {
  userId: string;
  sessionId: string;
  query: string;
  fileIds?: string[];
  storedFiles?: Array<{ fileId: string; fileName: string; storedText: string }>;
}): Promise<{
  answer: string;
  sources: Array<{ fileName: string; chunkIndex: number; score: number; excerpt: string }>;
}> {
  const { query, storedFiles } = options;
  console.log(`[RAG] ❓ User asked: "${query.slice(0, 50)}..."`);

  // Check if we can actually use RAG
  if (!ENV.GEMINI_API_KEY) {
    return {
      answer: "⚠️ RAG pipeline is not configured. Please set GEMINI_API_KEY and PINECONE_API_KEY in your .env file to enable AI-powered document Q&A.",
      sources: [],
    };
  }

  let retrievedContext = "";
  let topResults: any[] = [];

  // Try Pinecone search if configured
  if (ENV.PINECONE_API_KEY && ENV.PINECONE_INDEX) {
    try {
      console.log(`[RAG] 🔍 Searching Pinecone...`);
      await ensureDeps();
      const embeddingModel = getEmbeddings();
      const pineconeIndex = getPineconeIndex();

      const namespaces = options.fileIds
        ? options.fileIds.map((fid) => `user-${options.userId}-file-${fid}`)
        : [`user-${options.userId}`];

      let allResults: Array<{ pageContent: string; metadata: Record<string, unknown>; score: number }> = [];

      for (const ns of namespaces) {
        try {
          const vectorStore = await _PineconeStore.fromExistingIndex(embeddingModel, {
            pineconeIndex,
            namespace: ns,
          });
          const results = await vectorStore.similaritySearchWithScore(query, 3);
          allResults.push(
            ...results.map(([doc, score]: [any, number]) => ({
              pageContent: doc.pageContent,
              metadata: doc.metadata as Record<string, unknown>,
              score,
            }))
          );
        } catch {
          console.log(`[RAG] ⚠️ No data in namespace: ${ns}`);
        }
      }

      allResults.sort((a, b) => b.score - a.score);
      topResults = allResults.slice(0, 5);

      retrievedContext = topResults
        .map(
          (r) =>
            `[From file: ${(r.metadata.fileName as string) || "Unknown"}]\n${r.pageContent}`
        )
        .join("\n\n---\n\n");

      console.log(`[RAG] 🔍 Found ${topResults.length} relevant chunks`);
    } catch (err: any) {
      console.warn(`[RAG] ⚠️ Pinecone search failed: ${err.message}`);
    }
  }

  // ─── Local fallback when Pinecone returns nothing ────────────────
  if (topResults.length === 0 && storedFiles && storedFiles.length > 0) {
    console.log(`[RAG] 🔎 Falling back to local keyword search over ${storedFiles.length} file(s)`);
    const localResults: Array<{ pageContent: string; metadata: Record<string, unknown>; score: number }> = [];
    for (const sf of storedFiles) {
      localResults.push(
        ...localSearch(sf.storedText, sf.fileName, query, 3)
      );
    }
    localResults.sort((a, b) => b.score - a.score);
    topResults = localResults.slice(0, 5);

    retrievedContext = topResults
      .map(
        (r) =>
          `[From file: ${(r.metadata.fileName as string) || "Unknown"}]\n${r.pageContent}`
      )
      .join("\n\n---\n\n");
  }

  // Build answer - use LLM if we have context, otherwise use fallback
  let answer: string;

  if (retrievedContext) {
    try {
      const llm = getLLM();
      const systemPrompt = `
You are a helpful document analysis assistant. Your job is to answer questions
based ONLY on the context provided below. Be clear and specific.

Context from user's documents:
${retrievedContext}

Instructions:
- Answer based solely on the provided context
- If the context doesn't contain enough info, say so honestly
- Reference which file the info came from when possible
- Keep answers concise but thorough`;

      const response = await llm.invoke([
        ["system", systemPrompt],
        ["human", query],
      ]);

      answer = response.content.toString();
    } catch (err: any) {
      console.warn(`[RAG] ⚠️ LLM failed: ${err.message}`);
      // Fallback: use context directly
      answer = `Based on your documents, here's what I found:\n\n${topResults.map((r, i) => `**Source ${i + 1}** (from: ${r.metadata.fileName || "Unknown"}):\n${truncateText(r.pageContent, 300)}`).join("\n\n")}`;
    }
  } else {
    // No context found - provide helpful message
    const fileCount = options.fileIds?.length || storedFiles?.length || 0;
    if (fileCount > 0) {
      answer = `I found your uploaded files but couldn't retrieve specific relevant content. Try asking a more specific question about your documents.`;
    } else {
      answer = `👋 Welcome! I'm your AI Document Assistant.\n\nTo get started, **upload a PDF, DOCX, or TXT file** using the panel on the right. Once uploaded, I can answer questions about the content using RAG (Retrieval-Augmented Generation).\n\nAlternatively, you can ask me about document generation, templates, or how to use DocuCraft!`;
    }
  }

  const sources = topResults.map((r) => ({
    fileName: (r.metadata.fileName as string) || "Unknown",
    chunkIndex: (r.metadata.chunkIndex as number) || 0,
    score: r.score,
    excerpt: truncateText(r.pageContent, 120),
  }));

  console.log(`[RAG] ✅ Answer generated (${answer.length} chars)`);
  return { answer, sources };
}

// ─── 6. Delete vectors when user removes a file ────────────────────
export async function deleteFileVectors(userId: string, fileId: string): Promise<void> {
  if (!ENV.PINECONE_API_KEY || !ENV.PINECONE_INDEX) {
    console.log(`[RAG] ⏭️ Skipping vector deletion (Pinecone not configured)`);
    return;
  }

  const namespace = `user-${userId}-file-${fileId}`;
  try {
    const pineconeIndex = getPineconeIndex();
    await pineconeIndex.namespace(namespace).deleteAll();
    console.log(`[RAG] 🗑️ Deleted vectors in namespace: ${namespace}`);
  } catch (err) {
    console.warn(`[RAG] ⚠️ Could not delete namespace ${namespace}:`, err);
  }
}

// ─── Backward-compatible helper (kept for any existing callers) ────
export async function ingestFile(
  userId: string,
  fileId: string,
  filePath: string,
  mimeType: string
): Promise<{ chunkCount: number; namespace: string }> {
  const { chunks } = await parseAndChunk(filePath, mimeType);
  const namespace = `user-${userId}-file-${fileId}`;
  // Fire-and-forget Pinecone store
  storeInPinecone(userId, fileId, filePath, mimeType, filePath.split(/[\\/]/).pop() || "file")
    .catch(() => {});
  return { chunkCount: chunks.length, namespace };
}
