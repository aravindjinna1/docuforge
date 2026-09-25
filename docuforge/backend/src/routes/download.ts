import { Router, Request, Response } from "express";
import { GeneratedDocument } from "../models/GeneratedDocument";
import { buildDocx, buildPdfHtml, toSafeFilename } from "../services/fileService";
import type { DocumentType } from "../types";

const router = Router();

// ─── Shared: resolve content + title from request ─────────────────
async function resolveContent(
  body: Record<string, string>
): Promise<{ content: string; title: string; documentType: DocumentType } | null> {
  // Accept either direct content or a documentId reference
  if (body.content && body.title) {
    return {
      content: body.content,
      title: body.title,
      documentType: (body.documentType as DocumentType) || "custom",
    };
  }

  if (body.documentId) {
    const doc = await GeneratedDocument.findOne({
      documentId: body.documentId,
    }).lean();
    if (!doc) return null;
    return {
      content: doc.content,
      title: doc.title,
      documentType: doc.documentType,
    };
  }

  return null;
}

// POST /api/download/docx
router.post("/docx", async (req: Request, res: Response) => {
  try {
    const resolved = await resolveContent(req.body);
    if (!resolved) {
      res.status(404).json({ success: false, error: "Document not found" });
      return;
    }

    const { content, title, documentType } = resolved;
    const buffer = await buildDocx(content, title, documentType);
    const filename = toSafeFilename(title, "docx");

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length.toString());
    res.send(buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : "DOCX generation failed";
    console.error("[Download DOCX]", message);
    res.status(500).json({ success: false, error: message });
  }
});

// POST /api/download/pdf
router.post("/pdf", async (req: Request, res: Response) => {
  try {
    const resolved = await resolveContent(req.body);
    if (!resolved) {
      res.status(404).json({ success: false, error: "Document not found" });
      return;
    }

    const { content, title } = resolved;
    const html = buildPdfHtml(content, title);
    const filename = toSafeFilename(title, "pdf");

    // Attempt Puppeteer PDF generation
    try {
      // Dynamic import to avoid crashing if puppeteer isn't installed
      const puppeteer = await import("puppeteer").catch(() => null);

      if (puppeteer) {
        const browser = await puppeteer.default.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
          ],
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "domcontentloaded" });

        const pdf = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: { top: "72pt", right: "90pt", bottom: "72pt", left: "90pt" },
        });

        await browser.close();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(Buffer.from(pdf));
        return;
      }
    } catch (puppeteerErr) {
      console.warn("[PDF] Puppeteer unavailable, returning HTML fallback");
    }

    // Fallback: return HTML for client-side printing
    res.status(200).json({
      success: true,
      fallback: "html",
      html,
      filename,
      message:
        "PDF engine not available. Use the HTML for browser printing.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF generation failed";
    console.error("[Download PDF]", message);
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
