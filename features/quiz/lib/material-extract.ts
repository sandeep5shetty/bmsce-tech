import path from "node:path";
import { pathToFileURL } from "node:url";

import mammoth from "mammoth";
import JSZip from "jszip";

import type { QuizMaterialFileType } from "@/lib/s3/storage";

import type { ExtractedSegment } from "./material-chunk";

let pdfWorkerReady = false;

/**
 * pdf-parse v2 uses pdfjs-dist, which loads a separate worker script. Next.js
 * bundles the main module into .next/server/chunks, so the default relative
 * ./pdf.worker.mjs path does not exist unless we point at node_modules.
 */
async function ensurePdfWorker(): Promise<void> {
  if (pdfWorkerReady) return;

  const { PDFParse } = await import("pdf-parse");
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.worker.mjs",
  );
  PDFParse.setWorker(pathToFileURL(workerPath).href);
  pdfWorkerReady = true;
}

async function extractPdf(buffer: Buffer): Promise<ExtractedSegment[]> {
  await ensurePdfWorker();
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const pageSegments = result.pages
      .map((page) => ({
        text: page.text.replace(/\s+/g, " ").trim(),
        pageNumber: page.num,
      }))
      .filter((page) => page.text.length > 0);

    if (pageSegments.length > 0) {
      return pageSegments;
    }

    const fullText = result.text?.replace(/\s+/g, " ").trim() ?? "";
    if (!fullText) return [];
    return [{ text: fullText, pageNumber: 1 }];
  } finally {
    await parser.destroy();
  }
}

async function extractDocx(buffer: Buffer): Promise<ExtractedSegment[]> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value?.trim() ?? "";
  if (!text) return [];
  return [{ text }];
}

function collectSlideTexts(xml: string): string {
  const parts: string[] = [];
  const regex = /<a:t[^>]*>([^<]*)<\/a:t>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    const value = match[1]?.trim();
    if (value) parts.push(value);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

async function extractPptx(buffer: Buffer): Promise<ExtractedSegment[]> {
  const zip = await JSZip.loadAsync(buffer);
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)/i)?.[1] ?? 0);
      const nb = Number(b.match(/slide(\d+)/i)?.[1] ?? 0);
      return na - nb;
    });

  const segments: ExtractedSegment[] = [];
  for (const name of slideNames) {
    const file = zip.files[name];
    if (!file) continue;
    const xml = await file.async("string");
    const text = collectSlideTexts(xml);
    if (!text) continue;
    const slideNumber = Number(name.match(/slide(\d+)/i)?.[1] ?? 0) || undefined;
    segments.push({ text, slideNumber });
  }

  return segments;
}

export async function extractMaterialSegments(
  buffer: Buffer,
  fileType: QuizMaterialFileType,
): Promise<ExtractedSegment[]> {
  switch (fileType) {
    case "pdf":
      return extractPdf(buffer);
    case "docx":
      return extractDocx(buffer);
    case "pptx":
      return extractPptx(buffer);
    default:
      return [];
  }
}
