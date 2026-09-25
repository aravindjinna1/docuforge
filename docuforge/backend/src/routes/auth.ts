import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { ENV } from "../config/env";
import { User } from "../models/User";
import { v4 as uuidv4 } from "uuid";

const router = Router();

function signToken(userId: string, email?: string) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error("JWT_SECRET not set");

  return jwt.sign({ userId, email }, jwtSecret, {
    expiresIn: "7d",
  });
}

function setAuthCookie(res: Response, token: string) {
  const isProduction = ENV.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    // Local HTTP cannot use SameSite=None without Secure. localhost frontend
    // and backend are same-site, so Lax works for development fetches.
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}


router.post(
  "/register",
  [
    body("username").isString().trim().notEmpty().isLength({ max: 50 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isString().isLength({ min: 8, max: 100 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: "Invalid input", details: errors.array() });
    }

    const { username, email, password } = req.body as {
      username: string;
      email: string;
      password: string;
    };

    const passwordHash = await bcrypt.hash(password, 10);

    // We store bcrypt hash inside the existing User model? That model currently has no password field.
    // So for now: add a dedicated model field below via Mongo schema update (implemented in User model edit).
    // To keep auth code clean, this route expects `User` schema to include `email` and `passwordHash`.

    try {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ success: false, error: "Email already registered" });
      }

      const user = await User.create({
        userId: uuidv4(),
        displayName: username,
        email,
        passwordHash,
      } as any);


      const token = signToken(user.userId, user.email);
      setAuthCookie(res, token);

      return res.json({ success: true, user: { userId: user.userId, displayName: user.displayName, email: user.email } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      return res.status(500).json({ success: false, error: message });
    }
  }
);

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isString().isLength({ min: 1, max: 200 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: "Invalid input", details: errors.array() });
    }

    const { email, password } = req.body as { email: string; password: string };

    try {
      const user = await User.findOne({ email } as any);
      if (!user) {
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }

      const ok = await bcrypt.compare(password, (user as any).passwordHash as string);
      if (!ok) {
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }

      const token = signToken(user.userId, (user as any).email);
      setAuthCookie(res, token);

      return res.json({ success: true, user: { userId: user.userId, displayName: user.displayName, email: (user as any).email } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      return res.status(500).json({ success: false, error: message });
    }
  }
);

router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("token", { path: "/" });
  return res.json({ success: true, message: "Logged out" });
});

router.get("/me", (req: Request, res: Response) => {
  // Frontend can call /me after login; simplest implementation is decode cookie here.
// If token missing/invalid, return 401.
  const token = (req as any).cookies?.token as string | undefined;
  if (!token) return res.status(401).json({ success: false, error: "Not logged in" });

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return res.status(500).json({ success: false, error: "Server misconfigured" });

  try {
    const payload = jwt.verify(token, jwtSecret) as { userId: string; email?: string };
    return res.json({ success: true, user: { userId: payload.userId, email: payload.email } });
  } catch {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
});

export default router;
