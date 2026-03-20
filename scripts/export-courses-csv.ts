/**
 * 科目マスタJSON → CSV変換スクリプト
 *
 * 使い方: npx tsx scripts/export-courses-csv.ts
 * 出力:   data/courses/2026.csv（Excel/Google Sheetsで編集可能）
 */
import * as fs from "fs";
import * as path from "path";

const INPUT = path.resolve(__dirname, "../data/courses/2026.json");
const OUTPUT = path.resolve(__dirname, "../data/courses/2026.csv");

const data = JSON.parse(fs.readFileSync(INPUT, "utf-8"));

const HEADER = [
  "科目番号",
  "科目名",
  "単位数",
  "標準履修年次",
  "開講モジュール",
  "曜日時限",
  "科目区分",
  "プレフィックス",
  "前提科目",
  "担当教員",
].join(",");

const rows = Object.entries(data).map(([id, c]: [string, any]) =>
  [
    id,
    `"${c.name}"`,
    c.credits,
    c.standardYear,
    `"${c.modules.join("/")}"`,
    c.dayPeriod,
    c.category,
    `"${c.prefixes.join("/")}"`,
    `"${c.prerequisites.join("/")}"`,
    `"${c.instructor}"`,
  ].join(",")
);

const csv = [HEADER, ...rows].join("\n") + "\n";
fs.writeFileSync(OUTPUT, csv, "utf-8");
console.log(`✅ ${Object.keys(data).length}科目を出力 → ${OUTPUT}`);
