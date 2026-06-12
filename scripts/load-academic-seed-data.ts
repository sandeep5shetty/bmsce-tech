import { readFileSync } from "fs";
import { join } from "path";

import type { AcademicRecordInput } from "../features/placement/lib/academic-records";

const DATA_PATH = join(process.cwd(), "scripts/data/placement-academic.json");

/** Loads academic seed rows from scripts/data/placement-academic.json (local ops only). */
export function loadAcademicSeedData(): AcademicRecordInput[] {
  const raw = readFileSync(DATA_PATH, "utf8");
  return JSON.parse(raw) as AcademicRecordInput[];
}
