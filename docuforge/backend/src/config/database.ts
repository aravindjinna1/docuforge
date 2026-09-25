import mongoose from "mongoose";
import { ENV } from "./env";

export async function connectDatabase(): Promise<void> {
  const uri = ENV.MONGODB_URI;

  mongoose.connection.on("connected", () => {
    console.log("[DB] MongoDB connected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("[DB] MongoDB error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[DB] MongoDB disconnected");
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
}

export function getConnectionState(): string {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  return states[mongoose.connection.readyState] || "unknown";
}

