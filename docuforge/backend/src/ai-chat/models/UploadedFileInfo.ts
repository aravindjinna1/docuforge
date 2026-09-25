import { Schema, model, Document as MongoDocument } from "mongoose";

export interface IUploadedFileInfo extends MongoDocument {
  fileId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  pineconeNamespace: string;
  chunkCount: number;
  // Locally persisted parsed text so RAG can fall back when Pinecone is unavailable
  storedText?: string;
  createdAt: Date;
}

const uploadedFileInfoSchema = new Schema<IUploadedFileInfo>(
  {
    fileId: {
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
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    mimeType: {
      type: String,
      required: true,
    },
    pineconeNamespace: {
      type: String,
      required: true,
    },
chunkCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    storedText: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

uploadedFileInfoSchema.index({ userId: 1, createdAt: -1 });

export const UploadedFileInfo = model<IUploadedFileInfo>(
  "UploadedFileInfo",
  uploadedFileInfoSchema
);

