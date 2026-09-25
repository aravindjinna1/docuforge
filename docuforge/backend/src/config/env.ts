import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "4000", 10),
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/docucraft",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",

  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",

  JWT_SECRET: process.env.JWT_SECRET || "",

  RATE_LIMIT_WINDOW_MS: parseInt(
    process.env.RATE_LIMIT_WINDOW_MS || "60000",
    10
  ),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || "20", 10),

  // Pinecone (vector DB for RAG)
  PINECONE_API_KEY: process.env.PINECONE_API_KEY || "",
  PINECONE_INDEX: process.env.PINECONE_INDEX || "",
  PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT || "",
} as const;
