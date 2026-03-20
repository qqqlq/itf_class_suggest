/**
 * CSV → 科目マスタJSON変換スクリプト
 *
 * 使い方: npx tsx scripts/import-courses-csv.ts
 * 入力:   data/courses/2026.csv
 * 出力:   data/courses/2026.json（上書き）
 */
import * as fs from "fs";
import * as path from "path";

const INPUT = path.resolve(__dirname, "../data/courses/2026.csv");
const OUTPUT = path.resolve(__dirname, "../data/courses/2026.json");

const csv = fs.readFileSync(INPUT, "utf-8");
const lines = csv.trim().split("\n");

// ヘッダー行をスキップ
const dataLines = lines.slice(1);

const result: Record<string, any> = {};

for (const line of dataLines) {
  // CSV行をパース（ダブルクォート内のカンマを考慮）
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());

  if (fields.length < 10) continue;

  const [id, name, credits, standardYear, modules, dayPeriod, category, prefixes, prerequisites, instructor] = fields;

  if (!id) continue;

  result[id] = {
    name,
    credits: parseFloat(credits),
    standardYear: parseInt(standardYear, 10),
    modules: modules ? modules.split("/").filter(Boolean) : [],
    dayPeriod,
    category,
    prefixes: prefixes ? prefixes.split("/").filter(Boolean) : [],
    prerequisites: prerequisites ? prerequisites.split("/").filter(Boolean) : [],
    instructor: instructor || "",
  };
}

fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2) + "\n", "utf-8");
console.log(`✅ ${Object.keys(result).length}科目をインポート → ${OUTPUT}`);
