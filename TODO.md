# Doc Handler RAG Fix — Task List

## Goal
Make the Doc Handler RAG pipeline work reliably (answer questions from uploaded documents even if Pinecone fails) and make uploads respond fast.

## Steps
- [x] 1. Fix pdf-parse v2 API usage in `fileParserService.ts` (resolves `verbosity` crash)
- [x] 2. Add `storedText` field to `UploadedFileInfo` model for local persistence
- [x] 3. Restructure `ragService.ts`:
       - Add `parseAndChunk()` (fast parse/chunk, no Pinecone wait)
       - Add `storeInPinecone()` (background, non-blocking upsert)
       - Add local keyword-search fallback in `queryWithRAG`
- [x] 4. Update `aiChat.ts` upload route:
       - Persist parsed text locally
       - Respond fast after parse/chunk, run Pinecone embed in background
- [x] 5. Verify: modules load with tsx (same runtime as dev server); restart backend + re-upload to confirm in-app
