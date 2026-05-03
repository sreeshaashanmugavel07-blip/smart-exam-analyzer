import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleanExtractedText, extractTextFromBuffers } from "@/lib/text-extract";
import type { UploadedSourceMeta } from "@/types/analysis";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_FILES = 15;
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const textField = form.get("text");

    const collected: File[] = [];
    for (const v of form.getAll("files")) {
      if (v instanceof File && v.size > 0) collected.push(v);
    }
    const legacy = form.get("file");
    if (legacy instanceof File && legacy.size > 0) collected.push(legacy);

    let combined = "";
    let manifest: UploadedSourceMeta[] = [];

    if (typeof textField === "string" && textField.trim()) {
      const t = cleanExtractedText(textField);
      combined = t;
      manifest.push({
        name: "pasted-text",
        mimeType: "text/plain",
        size: Buffer.byteLength(t, "utf8"),
        kind: "text",
      });
    }

    if (collected.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Too many files (max ${MAX_FILES})` },
        { status: 400 }
      );
    }

    if (collected.length > 0) {
      const buffers: { name: string; buffer: Buffer; mime: string }[] = [];
      for (const f of collected) {
        if (f.size > MAX_BYTES) {
          return NextResponse.json(
            { error: `File too large: ${f.name} (max 25MB each)` },
            { status: 400 }
          );
        }
        buffers.push({
          name: f.name || "unnamed",
          buffer: Buffer.from(await f.arrayBuffer()),
          mime: f.type || "application/octet-stream",
        });
      }

      const { text, manifest: fileManifest } =
        await extractTextFromBuffers(buffers);

      if (!fileManifest.length) {
        return NextResponse.json(
          {
            error:
              "No supported files. Use PDF, PNG, JPG, or TXT.",
          },
          { status: 400 }
        );
      }

      if (!text.trim()) {
        return NextResponse.json(
          { error: "No text could be extracted from the uploaded files" },
          { status: 400 }
        );
      }

      if (combined) {
        combined = cleanExtractedText(
          `${combined}\n\n--- Uploaded files ---\n\n${text}`
        );
        manifest = [...manifest, ...fileManifest];
      } else {
        combined = text;
        manifest = fileManifest;
      }
    }

    if (!combined.trim()) {
      return NextResponse.json(
        {
          error:
            "Provide at least one PDF, image, or TXT file — or paste text.",
        },
        { status: 400 }
      );
    }

    const aggregateName =
      collected.length === 0
        ? "pasted-text"
        : collected.length === 1
          ? collected[0].name
          : `${collected.length} files`;

    const aggregateMime =
      collected.length === 0
        ? "text/plain"
        : collected.length === 1
          ? collected[0].type || "application/octet-stream"
          : "multipart/form-data";

    const paper = await prisma.examPaper.create({
      data: {
        fileName: aggregateName,
        mimeType: aggregateMime,
        sourceFiles: manifest as unknown as object[],
        extractedText: combined,
      },
    });

    return NextResponse.json({
      id: paper.id,
      extractedText: paper.extractedText,
      files: manifest,
      createdAt: paper.createdAt.toISOString(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
