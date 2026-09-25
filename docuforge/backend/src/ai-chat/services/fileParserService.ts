/**
 * ============================================================
 *  File Parser Service — Extract text from uploaded files
 *
 *  Supports: TXT, PDF (via pdf-parse v2), DOCX (via mammoth)
 * ============================================================
 */
import fs from "fs/promises";
import path from "path";

export interface ParsedDocument {
  text: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  pageCount?: number;
}

/**
 * Extract text content from uploaded files.
 * Supports: TXT, PDF, DOCX
 */
export async function parseFile(filePath: string, mimeType: string): Promise<ParsedDocument> {
  const stats = await fs.stat(filePath);
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  let text = "";
  let pageCount: number | undefined;

  if (ext === ".txt" || mimeType.includes("text")) {
    // ─── Plain text ────────────────────────────────────────────────
    text = await fs.readFile(filePath, "utf-8");

  } else if (ext === ".pdf" || mimeType.includes("pdf")) {
    // ─── PDF using pdf-parse v2 ────────────────────────────────────
    const { PDFParse } = await import("pdf-parse");
    const buffer = await fs.readFile(filePath);
    const parser = new PDFParse({ data: buffer });
    try {
      const raw = await parser.getText();
      text = raw.text;
      pageCount = raw.total;
    } finally {
      await parser.destroy();
    }

  } else if (ext === ".docx" || ext === ".doc" || mimeType.includes("word")) {
    // ─── DOCX ──────────────────────────────────────────────────────
    const mammoth = await import("mammoth");
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;

  } else {
    throw new Error(`Unsupported file type: ${ext || mimeType}. Allowed: PDF, DOCX, TXT`);
  }

  return {
    text: text.trim(),
    fileName,
    fileSize: stats.size,
    mimeType,
    pageCount,
  };
}

/**
 * Split extracted text into chunks for embedding.
 * Uses smart splitting at paragraph/sentence boundaries.
 */
export function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): string[] {
  if (!text || text.length === 0) return [];
  if (text.length <= chunkSize) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Try to break at a paragraph or sentence boundary
    if (end < text.length) {
      const lookahead = text.slice(end - overlap, end + overlap);
      const paraBreak = lookahead.lastIndexOf("\n\n");
      if (paraBreak > overlap / 2) {
        end = end - overlap + paraBreak;
      } else {
        const sentenceBreak = lookahead.lastIndexOf(". ");
        if (sentenceBreak > overlap / 2) {
          end = end - overlap + sentenceBreak + 1;
        }
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
  }

  return chunks.filter((c) => c.length > 0);
}

/**
 * Truncate text for display (source excerpts, etc.)
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}
