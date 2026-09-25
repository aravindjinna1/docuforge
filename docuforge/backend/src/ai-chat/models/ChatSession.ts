import { Schema, model, Document as MongoDocument } from "mongoose";

export interface IChatSession extends MongoDocument {
  sessionId: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const chatSessionSchema = new Schema<IChatSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      default: "New Chat",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

chatSessionSchema.index({ userId: 1, createdAt: -1 });

export const ChatSession = model<IChatSession>("ChatSession", chatSessionSchema);

