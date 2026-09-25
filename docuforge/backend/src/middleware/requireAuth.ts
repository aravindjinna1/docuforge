import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const COOKIE_NAME = "token";

export interface AuthUser {
  userId: string;
  email?: string;
}

export type AuthedRequest = Request & { user?: AuthUser };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token || typeof token !== "string") {
    return res.status(401).json({ success: false, error: "Login required" });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ success: false, error: "Server misconfigured" });
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as { userId: string; email?: string };
    if (!payload?.userId) {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }

    req.user = { userId: payload.userId, email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid/expired token" });
  }
}



