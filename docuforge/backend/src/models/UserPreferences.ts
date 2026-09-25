import { Schema, model, Document } from "mongoose";
import type { DocumentType, ToneType } from "../types";

export interface IUserPreferences extends Document {
  userId: string;
  preferredTone: ToneType;
  mostUsedDocumentType: DocumentType | null;
  documentTypeCounts: Map<string, number>;
  // Names and companies extracted from past submissions
  commonNames: string[];
  commonCompanies: string[];
  // Last-used inputs per document type for pre-fill
  lastUsedInputs: Map<string, Record<string, unknown>>;
  updatedAt: Date;
  createdAt: Date;
}

const userPreferencesSchema = new Schema<IUserPreferences>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    preferredTone: {
      type: String,
      enum: ["formal", "professional", "friendly", "assertive", "empathetic"],
      default: "professional",
    },
    mostUsedDocumentType: {
      type: String,
      default: null,
    },
    documentTypeCounts: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    commonNames: {
      type: [String],
      default: [],
    },
    commonCompanies: {
      type: [String],
      default: [],
    },
    lastUsedInputs: {
      type: Map,
      of: Schema.Types.Mixed,
      default: new Map(),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const UserPreferences = model<IUserPreferences>(
  "UserPreferences",
  userPreferencesSchema
);
