import { Router, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { requireAuth, AuthedRequest } from "../../middleware/requireAuth";
import { ChatSession } from "../models/ChatSession";
import { ChatMessage } from "../models/ChatMessage";
import { UploadedFileInfo } from "../models/UploadedFileInfo";
import { queryWithRAG, parseAndChunk, storeInPinecone, deleteFileVectors } from "../services/ragService";

const router = Router();

// ─── Multer config ────────────────────────────────────────────────
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "ai-chat");
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(() => {});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = [".pdf", ".docx", ".doc", ".txt"];
    allowed.includes(ext)
      ? cb(null, true)
      : cb(new Error(`Unsupported file type: ${ext}. Allowed: PDF, DOCX, TXT`));
  },
});

// ─── GET /api/ai-chat/sessions ─────────────────────────────────────
router.get("/sessions", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user!.userId })
      .sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Failed" });
  }
});

// ─── POST /api/ai-chat/sessions ────────────────────────────
router.post("/sessions", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { title } = req.body as { title?: string };
    const sessionId = uuidv4();
    const session = new ChatSession({ sessionId, userId: req.user!.userId, title: title || "New Chat" });
    await session.save();

    const welcomeMsg = new ChatMessage({
      messageId: uuidv4(), sessionId, userId: req.user!.userId, role: "assistant",
      content: "👋 Welcome! I'm your AI Document Assistant. Upload a PDF, DOCX, or TXT file and I can answer questions about it using RAG.",
    });
    await welcomeMsg.save();

    res.status(201).json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Failed" });
  }
});

// ─── GET /api/ai-chat/sessions/:id/messages ────────────────────────
router.get("/sessions/:id/messages", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const session = await ChatSession.findOne({ sessionId: req.params.id, userId: req.user!.userId });
    if (!session) { res.status(404).json({ success: false, error: "Session not found" }); return; }
    const messages = await ChatMessage.find({ sessionId: req.params.id, userId: req.user!.userId })
      .sort({ createdAt: 1 }).lean();
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Failed" });
  }
});

// ─── DELETE /api/ai-chat/sessions/:id ──────────────────────────────
router.delete("/sessions/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    await ChatMessage.deleteMany({ sessionId: id, userId });
    const result = await ChatSession.deleteOne({ sessionId: id, userId });
    if (result.deletedCount === 0) { res.status(404).json({ success: false, error: "Session not found" }); return; }
    res.json({ success: true, message: "Session deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Failed" });
  }
});

// ─── POST /api/ai-chat/query — RAG Query ───────────────────────────
router.post("/query", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { sessionId, content } = req.body as { sessionId: string; content: string };
    if (!sessionId || !content?.trim()) {
      res.status(400).json({ success: false, error: "sessionId and content are required" }); return;
    }

    const userId = req.user!.userId;
    const session = await ChatSession.findOne({ sessionId, userId });
    if (!session) { res.status(404).json({ success: false, error: "Session not found" }); return; }

    // Save user message
    const userMsg = new ChatMessage({ messageId: uuidv4(), sessionId, userId, role: "user", content: content.trim() });
    await userMsg.save();

    // Auto-title the session
    if (session.title === "New Chat") {
      session.title = content.trim().length > 45 ? content.trim().slice(0, 45) + "…" : content.trim();
      await session.save();
    }

// Get user's uploaded files to scope the search
    const uploadedFiles = await UploadedFileInfo.find({ userId }).lean();
    const fileIds = uploadedFiles.map((f) => f.fileId);

    // Provide locally stored text so RAG can fall back to keyword search
    const storedFiles = uploadedFiles
      .filter((f) => f.storedText)
      .map((f) => ({ fileId: f.fileId, fileName: f.fileName, storedText: f.storedText || "" }));

    // 🔥 Execute RAG pipeline
    const ragResult = await queryWithRAG({
      userId,
      sessionId,
      query: content.trim(),
      fileIds: fileIds.length > 0 ? fileIds : undefined,
      storedFiles: storedFiles.length > 0 ? storedFiles : undefined,
    });

    // Save AI response
    const botMsg = new ChatMessage({ messageId: uuidv4(), sessionId, userId, role: "assistant", content: ragResult.answer });
    await botMsg.save();

    res.json({ success: true, data: { message: botMsg, sources: ragResult.sources } });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Query failed" });
  }
});

// ─── GET /api/ai-chat/files ────────────────────────────────────────
router.get("/files", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const files = await UploadedFileInfo.find({ userId: req.user!.userId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: files });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Failed" });
  }
});

// ─── POST /api/ai-chat/upload — Upload + Ingest ────────────────────
router.post("/upload", requireAuth, upload.single("file"), async (req: AuthedRequest, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ success: false, error: "No file uploaded" }); return; }

    const userId = req.user!.userId;
    const fileId = uuidv4();
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    const fileName = req.file.originalname;

// Parse + chunk (fast). Persist extracted text locally so RAG can
    // fall back to keyword search even if Pinecone embedding fails.
    const { text, chunks } = await parseAndChunk(filePath, mimeType);
    const chunkCount = chunks.length;

    const fileInfo = new UploadedFileInfo({
      fileId, userId, fileName, fileSize: req.file.size, mimeType,
      pineconeNamespace: `user-${userId}-file-${fileId}`, chunkCount,
      storedText: text,
    });
    await fileInfo.save();

    // Run Pinecone embedding & upsert in the background (non-blocking),
    // so the upload responds quickly.
    storeInPinecone(userId, fileId, filePath, mimeType, fileName)
      .then(() => console.log(`[Upload] ✅ Pinecone background store complete for ${fileName}`))
      .catch((err) => console.warn(`[Upload] ⚠️ Background Pinecone store failed: ${err.message}`));

    res.status(201).json({ success: true, data: fileInfo, message: `File processed with ${chunkCount} text chunks` });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Upload failed" });
  }
});

// ─── DELETE /api/ai-chat/files/:id ─────────────────────────────────
router.delete("/files/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const fileInfo = await UploadedFileInfo.findOne({ fileId: id, userId });
    if (!fileInfo) { res.status(404).json({ success: false, error: "File not found" }); return; }

    await deleteFileVectors(userId, id);
    await UploadedFileInfo.deleteOne({ fileId: id, userId });

    res.json({ success: true, message: "File and vectors deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Failed to delete file" });
  }
});

export default router;

