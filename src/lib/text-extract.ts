import type { UploadedSourceMeta } from "@/types/analysis";
import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";

export function cleanExtractedText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

export function detectSourceKind(
  fileName: string,
  mime: string
): UploadedSourceMeta["kind"] | null {
  const lower = fileName.toLowerCase();
  const m = (mime || "").toLowerCase();
  if (m === "application/pdf" || lower.endsWith(".pdf")) return "pdf";
  if (
    m.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif)$/i.test(lower)
  ) {
    return "image";
  }
  if (m === "text/plain" || lower.endsWith(".txt")) return "text";
  return null;
}

async function bufferToPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return typeof result.text === "string" ? result.text : "";
  } finally {
    await parser.destroy();
  }
}

export async function extractTextFromBuffers(
  files: { name: string; buffer: Buffer; mime: string }[]
): Promise<{ text: string; manifest: UploadedSourceMeta[] }> {
  const manifest: UploadedSourceMeta[] = [];
  const chunks: string[] = [];
  const ocr: { worker: Awaited<ReturnType<typeof createWorker>> | null } = {
    worker: null,
  };

  try {
    for (const f of files) {
      const kind = detectSourceKind(f.name, f.mime);
      if (!kind) continue;

      manifest.push({
        name: f.name,
        mimeType: f.mime || "application/octet-stream",
        size: f.buffer.length,
        kind,
      });

      let part = "";
      if (kind === "pdf") {
        part = await bufferToPdfText(f.buffer);
      } else if (kind === "image") {
        if (!ocr.worker) ocr.worker = await createWorker("eng");
        const {
          data: { text },
        } = await ocr.worker.recognize(f.buffer);
        part = text;
      } else {
        part = f.buffer.toString("utf-8");
      }

      part = cleanExtractedText(part);
      if (part) {
        chunks.push(`--- File: ${f.name} ---\n${part}`);
      }
    }
  } finally {
    if (ocr.worker) await ocr.worker.terminate();
  }

  const text = cleanExtractedText(chunks.join("\n\n"));
  return { text, manifest };
}
