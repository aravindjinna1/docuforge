import { Router, Response } from "express";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";

import {
  getPersonalizationData,
  getOrCreatePreferences,
} from "../services/preferencesService";
import { UserPreferences } from "../models/UserPreferences";
import type { ToneType } from "../types";

const router = Router();

// GET /api/preferences
router.get("/", requireAuth, async (req: AuthedRequest, res: Response) => {
  const userId = req.user!.userId;

  try {
    const data = await getPersonalizationData(userId);
    res.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch preferences";
    res.status(500).json({ success: false, error: message });
  }
});

// PATCH /api/preferences
router.patch("/", requireAuth, async (req: AuthedRequest, res: Response) => {
  const { preferredTone } = req.body as {
    preferredTone?: ToneType;
  };

  const userId = req.user!.userId;

  const validTones: ToneType[] = [
    "formal",
    "professional",
    "friendly",
    "assertive",
    "empathetic",
  ];

  if (preferredTone && !validTones.includes(preferredTone)) {
    res.status(400).json({
      success: false,
      error: `Invalid tone. Must be one of: ${validTones.join(", ")}`,
    });
    return;
  }

  try {
    const update: Record<string, unknown> = {};
    if (preferredTone) update.preferredTone = preferredTone;

    await UserPreferences.findOneAndUpdate(
      { userId },
      { $set: update },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: "Preferences updated" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update preferences";
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
