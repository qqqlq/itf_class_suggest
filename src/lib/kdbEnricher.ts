/**
 * KdB辞書を使って courseMaster の科目情報を補完するユーティリティ
 * - 2026.json の科目名は英語のため、KdBの日本語名を優先
 * - standardYear も KdB の値を優先（2026.json の値は不正確なケースが多い）
 */
import type { CourseData, KdbEntry } from "@/types";

export interface EnrichedCourse extends CourseData {
  id: string;
  displayName: string;  // 日本語優先の表示名
  kdbStandardYear: number | null;  // KdBからの標準履修年次
}

/**
 * KdBの標準履修年次文字列を数値に変換する
 * "1" → 1, "2 - 4" → 2 (下限), "3・4" → 3 (下限), "4" → 4
 */
export function parseKdbStandardYear(s: string | undefined): number | null {
  if (!s) return null;
  // "2 - 4" or "3・4" → take first number
  const m = s.match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

/**
 * courseMaster の全エントリを KdB 辞書で補完した EnrichedCourse マップを返す
 */
export function buildEnrichedCourseMaster(
  courseMaster: Record<string, CourseData>,
  kdbDict: Record<string, KdbEntry>
): Record<string, EnrichedCourse> {
  const result: Record<string, EnrichedCourse> = {};
  for (const [id, course] of Object.entries(courseMaster)) {
    const kdb = kdbDict[id];
    const kdbYear = parseKdbStandardYear(kdb?.standardYear);
    result[id] = {
      ...course,
      id,
      // KdBに日本語名があればそれを使う
      displayName: kdb?.name ?? course.name,
      // KdBの年次を優先、なければ courseMaster の値
      kdbStandardYear: kdbYear,
    };
  }
  return result;
}

/**
 * 課目IDから日本語表示名を取得する（KdB → courseMaster → IDそのままの優先順）
 */
export function getDisplayName(
  id: string,
  courseMaster: Record<string, CourseData>,
  kdbDict: Record<string, KdbEntry>
): string {
  return kdbDict[id]?.name ?? courseMaster[id]?.name ?? id;
}

/**
 * courseIdの標準履修年次を取得（KdB → courseMaster の順）
 */
export function getStandardYear(
  id: string,
  courseMaster: Record<string, CourseData>,
  kdbDict: Record<string, KdbEntry>
): number {
  const kdbYear = parseKdbStandardYear(kdbDict[id]?.standardYear);
  if (kdbYear !== null) return kdbYear;
  return courseMaster[id]?.standardYear ?? 1;
}

/**
 * 日本語科目名からcourseIdを逆引きする
 * 1. courseMaster内のIDに対応するKdBの日本語名で検索
 * 2. courseMasterの英語名で検索
 * 3. KdB全件から日本語名で検索（GC必修など2026.jsonにないものも対象）
 */
export function findCourseIdByName(
  searchName: string,
  courseMaster: Record<string, CourseData>,
  kdbDict: Record<string, KdbEntry>
): string | undefined {
  // 1. KdBの日本語名で検索（courseMaster内IDのみ）
  for (const [id] of Object.entries(courseMaster)) {
    if (kdbDict[id]?.name === searchName) return id;
  }
  // 2. courseMasterの英語名で検索
  for (const [id, course] of Object.entries(courseMaster)) {
    if (course.name === searchName) return id;
  }
  // 3. KdB全件から検索（GC必修等2026.jsonに載っていないもの）
  // GCプレフィックスを優先して最初にヒットしたIDを返す
  let fallbackId: string | undefined;
  for (const [id, entry] of Object.entries(kdbDict)) {
    if (entry.name === searchName) {
      if (id.startsWith("GC")) return id; // GC系を最優先
      if (!fallbackId) fallbackId = id;
    }
  }
  return fallbackId;
}
