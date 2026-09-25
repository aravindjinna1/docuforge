import { Router, Response } from "express";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";

import { GeneratedDocument } from "../models/GeneratedDocument";

const router = Router();

// GET /api/history/recent?limit=
router.get(
  "/recent",
  requireAuth,
  async (req: AuthedRequest, res: Response) => {
  const userId = req.user!.userId;
  const limit = Math.min(parseInt(req.query.limit as string) || 6, 20);

  try {
    const docs = await GeneratedDocument.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("documentId documentType title wordCount createdAt")
      .lean();

    res.json({ success: true, data: docs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch recent documents";
    res.status(500).json({ success: false, error: message });
  }
});

// GET /api/history?page=&limit=&type=
router.get("/", requireAuth, async (req: AuthedRequest, res: Response) => {
  const userId = req.user!.userId;
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const docType = req.query.type as string | undefined;

  const filter: Record<string, unknown> = { userId };
  if (docType && docType !== "all") filter.documentType = docType;

  try {
    const [docs, total] = await Promise.all([
      GeneratedDocument.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("documentId documentType title wordCount createdAt")
        .lean(),
      GeneratedDocument.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: docs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch history";
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
