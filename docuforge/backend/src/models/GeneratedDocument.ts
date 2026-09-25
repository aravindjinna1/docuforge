import { Schema, model, Document as MongoDocument } from "mongoose";
import type { DocumentType } from "../types";

export interface IGeneratedDocument extends MongoDocument {
  documentId: string; // UUID — stable public identifier
  userId: string;
  documentType: DocumentType;
  title: string;
  inputs: Record<string, unknown>; // Stored verbatim for regeneration
  content: string; // Final generated text
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const generatedDocumentSchema = new Schema<IGeneratedDocument>(
  {
    documentId: {
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
    documentType: {
      type: String,
      required: true,
      enum: [
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
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    inputs: {
      type: Schema.Types.Mixed,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    wordCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for user history queries
generatedDocumentSchema.index({ userId: 1, createdAt: -1 });
generatedDocumentSchema.index({ userId: 1, documentType: 1, createdAt: -1 });

export const GeneratedDocument = model<IGeneratedDocument>(
  "GeneratedDocument",
  generatedDocumentSchema
);

