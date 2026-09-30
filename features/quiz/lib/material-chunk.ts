export interface ExtractedSegment {
  text: string;
  pageNumber?: number;
  slideNumber?: number;
}

export interface MaterialChunkDraft {
  chunkIndex: number;
  text: string;
  pageNumber?: number;
  slideNumber?: number;
  tokenCount: number;
}

const TARGET_CHARS = 900;
const OVERLAP_CHARS = 120;

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function splitLongText(
  text: string,
  pageNumber?: number,
  slideNumber?: number,
): ExtractedSegment[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  if (normalized.length <= TARGET_CHARS) {
    return [{ text: normalized, pageNumber, slideNumber }];
  }

  const parts: ExtractedSegment[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(normalized.length, start + TARGET_CHARS);
    const slice = normalized.slice(start, end).trim();
    if (slice) {
      parts.push({ text: slice, pageNumber, slideNumber });
    }
    if (end >= normalized.length) break;
    start = Math.max(0, end - OVERLAP_CHARS);
  }
  return parts;
}

export function buildChunksFromSegments(
  segments: ExtractedSegment[],
): MaterialChunkDraft[] {
  const expanded: ExtractedSegment[] = [];
  for (const segment of segments) {
    expanded.push(
      ...splitLongText(segment.text, segment.pageNumber, segment.slideNumber),
    );
  }

  return expanded.map((segment, index) => ({
    chunkIndex: index,
    text: segment.text,
    pageNumber: segment.pageNumber,
    slideNumber: segment.slideNumber,
    tokenCount: estimateTokens(segment.text),
  }));
}
