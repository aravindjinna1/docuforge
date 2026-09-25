import { Router, Request, Response } from "express";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";

import { v4 as uuidv4 } from "uuid";
import type { GenerateRequest } from "../types";
import { generateWithAI, refineWithAI } from "../services/aiService";
import { GeneratedDocument } from "../models/GeneratedDocument";
import {
  getPromptContext,
  recordGeneration,
} from "../services/preferencesService";
import { deriveDocumentTitle } from "../services/promptService";

const router = Router();

router.post("/", requireAuth, async (req: AuthedRequest, res: Response) => {
  const { documentType, inputs, refineAction, existingContent } =
    req.body as GenerateRequest;

  const userId = req.user!.userId;


  // ─── Validation ───────────────────────────────────────────────
  if (!documentType || !inputs) {
    res.status(400).json({
      success: false,
      error: "documentType and inputs are required",
    });
    return;
  }

  const validTypes = [
    "email",
    "cover_letter",
    "leave_letter",
    "resignation_letter",
    "resume",
    "custom",
    "memo",
    "proposal",
    "agreement",
    "meeting_minutes",
    "report",
  ];
  if (!validTypes.includes(documentType)) {
    res.status(400).json({
      success: false,
      error: `Invalid documentType. Must be one of: ${validTypes.join(", ")}`,
    });
    return;
  }

  try {
    let content: string;

    if (refineAction && existingContent) {
      // Refinement path — rewrite existing content
      console.log(`[Generate] Refine action: ${refineAction} on ${documentType}`);
      content = await refineWithAI(documentType, refineAction, existingContent);
    } else {
      // Fresh generation path
      console.log(`[Generate] Fresh generation: ${documentType} for user ${userId}`);
      const ctx = await getPromptContext(userId);
      content = await generateWithAI(documentType, inputs, ctx);
    }

    const title = deriveDocumentTitle(documentType, inputs);
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const documentId = uuidv4();

    // Persist to database
    const savedDoc = await GeneratedDocument.create({
      documentId,
      userId,
      documentType,
      title,
      inputs,
      content,
      wordCount,
    });

    // Update preferences asynchronously — don't block response
    if (!refineAction) {
      recordGeneration(userId, documentType, inputs).catch((err) =>
        console.error("[Prefs] Failed to record generation:", err)
      );
    }

    res.status(200).json({
      success: true,
      document: {
        id: documentId,
        documentType,
        title,
        content,
        wordCount,
        createdAt: savedDoc.createdAt.toISOString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    console.error("[Generate] Error:", message);
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
