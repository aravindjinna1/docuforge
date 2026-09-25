import { Router, Request, Response } from "express";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";
import { GeneratedDocument } from "../models/GeneratedDocument";

const router = Router();

// GET /api/documents/:id
router.get("/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const doc = await GeneratedDocument.findOne({
      documentId: req.params.id,
      userId: req.user!.userId,
    }).lean();

    if (!doc) {
      res.status(404).json({ success: false, error: "Document not found" });
      return;
    }

    res.json({ success: true, data: doc });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch document";
    res.status(500).json({ success: false, error: message });
  }
});

// DELETE /api/documents/:id
router.delete("/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const result = await GeneratedDocument.deleteOne({
      documentId: req.params.id,
      userId: req.user!.userId,
    });

    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, error: "Document not found" });
      return;
    }

    res.json({ success: true, message: "Document deleted" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete document";
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
