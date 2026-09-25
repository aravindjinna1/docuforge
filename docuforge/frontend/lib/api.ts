import type {

  DocumentType,
  AnyDocumentInputs,
  RefineAction,
  GeneratedDocResult,
  PersonalizationData,
  HistoryItem,
  HistoryItemFull,
  // AI Chat types
} from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiAuthError extends Error {
  constructor(message = "Login required") {
    super(message);
    this.name = "ApiAuthError";
  }
}

export function isApiAuthError(error: unknown): error is ApiAuthError {
  return error instanceof ApiAuthError;
}

type RequestOptions = RequestInit & { timeoutMs?: number };

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 10000;

  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Remove custom property before spreading
  const { timeoutMs: _timeout, ...fetchOptions } = options;

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      ...fetchOptions,
      signal: controller.signal,
    });

    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        errMsg = (body as any).error ?? errMsg;
      } catch {
        // ignore parse failure
      }
      if (res.status === 401) {
        throw new ApiAuthError(errMsg);
      }
      throw new Error(errMsg);
    }

    return res.json() as Promise<T>;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${path}`);
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Generate ─────────────────────────────────────────────────────
export async function apiGenerate(
  documentType: DocumentType,
  inputs: AnyDocumentInputs
): Promise<GeneratedDocResult> {
  const data = await request<{ success: true; document: GeneratedDocResult }>(
    "/api/generate",
    {
      method: "POST",
      body: JSON.stringify({ documentType, inputs }),
    }
  );
  return data.document;
}

export async function apiRefine(
  documentType: DocumentType,
  inputs: AnyDocumentInputs,
  refineAction: RefineAction,
  existingContent: string
): Promise<GeneratedDocResult> {
  const data = await request<{ success: true; document: GeneratedDocResult }>(
    "/api/generate",
    {
      method: "POST",
      body: JSON.stringify({
        documentType,
        inputs,
        refineAction,
        existingContent,
      }),
    }
  );
  return data.document;
}

// ─── History ──────────────────────────────────────────────────────
export async function apiGetRecent(limit = 6): Promise<HistoryItem[]> {
  const data = await request<{ success: true; data: HistoryItem[] }>(
    `/api/history/recent?limit=${limit}`
  );
  return data.data;
}

export async function apiGetHistory(
  page = 1,
  limit = 20,
  type?: DocumentType | "all"
): Promise<{
  data: HistoryItem[];
  pagination: { page: number; totalPages: number; total: number };
}> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (type && type !== "all") params.set("type", type);

  const result = await request<{
    success: true;
    data: HistoryItem[];
    pagination: { page: number; totalPages: number; total: number };
  }>(`/api/history?${params}`);

  return { data: result.data, pagination: result.pagination };
}

// ─── Documents ────────────────────────────────────────────────────
export async function apiGetDocument(id: string): Promise<HistoryItemFull> {
  const data = await request<{ success: true; data: HistoryItemFull }>(
    `/api/documents/${id}`
  );
  return data.data;
}

export async function apiDeleteDocument(id: string): Promise<void> {
  await request(`/api/documents/${id}`, { method: "DELETE" });
}

// ─── Downloads ────────────────────────────────────────────────────
export async function apiDownloadDocx(
  content: string,
  title: string,
  documentType: DocumentType
): Promise<Blob> {
  const res = await fetch(`${BASE}/api/download/docx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, title, documentType }),
  });

  if (!res.ok) throw new Error(`DOCX download failed: HTTP ${res.status}`);
  return res.blob();
}

export async function apiDownloadPdf(
  content: string,
  title: string
): Promise<{ blob?: Blob; html?: string; filename?: string }> {
  const res = await fetch(`${BASE}/api/download/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, title }),
  });

  if (!res.ok) throw new Error(`PDF download failed: HTTP ${res.status}`);

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/pdf")) {
    return { blob: await res.blob() };
  }

  // HTML fallback
  const json = await res.json();
  return { html: json.html, filename: json.filename };
}

// ─── Preferences ──────────────────────────────────────────────────
export async function apiGetPreferences(): Promise<PersonalizationData> {
  const data = await request<{ success: true; data: PersonalizationData }>(
    `/api/preferences`
  );
  return data.data;
}

export async function apiUpdatePreferences(
  preferredTone: string
): Promise<void> {
  await request("/api/preferences", {
    method: "PATCH",
    body: JSON.stringify({ preferredTone }),
  });
}

// ══════════════════════════════════════════════════════════════════
//  AI CHAT (RAG) — /api/ai-chat/*
// ══════════════════════════════════════════════════════════════════

export interface AiChatSession {
  _id: string;
  sessionId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiChatMessage {
  _id: string;
  messageId: string;
  sessionId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface AiUploadedFile {
  _id: string;
  fileId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  pineconeNamespace: string;
  chunkCount: number;
  createdAt: string;
}

/** GET /api/ai-chat/sessions — List all chat sessions */
export async function apiAiGetSessions(): Promise<AiChatSession[]> {
  const data = await request<{ success: true; data: AiChatSession[] }>("/api/ai-chat/sessions");
  return data.data;
}

/** POST /api/ai-chat/sessions — Create a new chat session */
export async function apiAiCreateSession(title?: string): Promise<AiChatSession> {
  const data = await request<{ success: true; data: AiChatSession }>("/api/ai-chat/sessions", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  return data.data;
}

/** DELETE /api/ai-chat/sessions/:id — Delete a session */
export async function apiAiDeleteSession(sessionId: string): Promise<void> {
  await request(`/api/ai-chat/sessions/${sessionId}`, { method: "DELETE" });
}

/** GET /api/ai-chat/sessions/:id/messages — Get messages for a session */
export async function apiAiGetSessionMessages(sessionId: string): Promise<AiChatMessage[]> {
  const data = await request<{ success: true; data: AiChatMessage[] }>(
    `/api/ai-chat/sessions/${sessionId}/messages`
  );
  return data.data;
}

/** POST /api/ai-chat/query — Send a message and get RAG response */
export async function apiAiQuery(
  sessionId: string,
  content: string
): Promise<{ message: AiChatMessage; sources: Array<{ fileName: string; chunkIndex: number; score: number; excerpt: string }> }> {
  const data = await request<{ success: true; data: { message: AiChatMessage; sources: Array<{ fileName: string; chunkIndex: number; score: number; excerpt: string }> } }>(
    "/api/ai-chat/query",
    {
      method: "POST",
      body: JSON.stringify({ sessionId, content }),
      timeoutMs: 60000, // 60s timeout for RAG queries
    } as any
  );
  return data.data;
}

/** GET /api/ai-chat/files — List uploaded files */
export async function apiAiGetFiles(): Promise<AiUploadedFile[]> {
  const data = await request<{ success: true; data: AiUploadedFile[] }>("/api/ai-chat/files");
  return data.data;
}

/** POST /api/ai-chat/upload — Upload a file (uses FormData) */
export async function apiAiUploadFile(file: File): Promise<AiUploadedFile> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE}/api/ai-chat/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      errMsg = (body as any).error ?? errMsg;
    } catch { /* ignore */ }
    throw new Error(errMsg);
  }

  const data = await res.json() as { success: true; data: AiUploadedFile };
  return data.data;
}

/** DELETE /api/ai-chat/files/:id — Delete an uploaded file + its Pinecone vectors */
export async function apiAiDeleteFile(fileId: string): Promise<void> {
  await request(`/api/ai-chat/files/${fileId}`, { method: "DELETE" });
}
