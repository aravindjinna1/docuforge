import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  convertInchesToTwip,
} from "docx";
import type { DocumentType } from "../types";

// ─── Parse raw content into paragraphs ────────────────────────────
function splitIntoParagraphs(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean);
}

// ─── DOCX generation ───────────────────────────────────────────────
export async function buildDocx(
  content: string,
  title: string,
  _docType: DocumentType
): Promise<Buffer> {
  const paragraphs = splitIntoParagraphs(content);

  const children = [
    // Title paragraph
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: convertInchesToTwip(0.3) },
    }),
    // Horizontal rule via border
    new Paragraph({
      border: {
        bottom: { style: "single", size: 6, space: 1, color: "CCCCCC" },
      },
      spacing: { after: convertInchesToTwip(0.2) },
    }),
    // Content paragraphs
    ...paragraphs.map(
      (para) =>
        new Paragraph({
          children: [
            new TextRun({
              text: para,
              size: 24, // 12pt
              font: "Calibri",
            }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: {
            after: convertInchesToTwip(0.12),
            line: 276, // 1.15 line spacing
          },
        })
    ),
  ];

  const doc = new Document({
    styles: {
      default: {
        heading1: {
          run: {
            size: 28,
            bold: true,
            color: "1a1a2e",
            font: "Calibri",
          },
          paragraph: {
            spacing: { after: 200 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1.0),
              right: convertInchesToTwip(1.25),
              bottom: convertInchesToTwip(1.0),
              left: convertInchesToTwip(1.25),
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

// ─── HTML template for PDF (server renders this with puppeteer) ────
export function buildPdfHtml(content: string, title: string): string {
  const paragraphs = splitIntoParagraphs(content);
  const paragraphHtml = paragraphs
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Crimson Pro', 'Georgia', serif;
      font-size: 12.5pt;
      line-height: 1.75;
      color: #1a1a2e;
      background: #ffffff;
      padding: 72pt 90pt;
    }

    h1 {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 13pt;
      letter-spacing: 0.02em;
      color: #0d0f1a;
      margin-bottom: 8pt;
      padding-bottom: 8pt;
      border-bottom: 1.5pt solid #e2e2e8;
    }

    .content {
      margin-top: 16pt;
    }

    p {
      margin-bottom: 10pt;
      text-align: left;
      orphans: 3;
      widows: 3;
      hyphens: auto;
    }

    @media print {
      body { padding: 0; }
      @page { margin: 72pt 90pt; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="content">
    ${paragraphHtml}
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── Safe filename derivation ──────────────────────────────────────
export function toSafeFilename(title: string, ext: "pdf" | "docx"): string {
  const safe = title
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .toLowerCase()
    .slice(0, 80);
  return `${safe}.${ext}`;
}
