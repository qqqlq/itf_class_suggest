/**
 * CSV → カリキュラムJSON変換スクリプト
 *
 * 使い方: npx tsx scripts/import-curriculum-csv.ts
 * 入力:   data/curricula/mast.csv
 * 出力:   data/curricula/mast.json（上書き）
 */
import * as fs from "fs";
import * as path from "path";

const INPUT = path.resolve(__dirname, "../data/curricula/mast.csv");
const OUTPUT = path.resolve(__dirname, "../data/curricula/mast.json");

const csv = fs.readFileSync(INPUT, "utf-8");
const lines = csv.trim().split("\n");

function parseCsvLine(line: string): string[] {
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
  return fields;
}

// メタ情報を読む
const meta: Record<string, string> = {};
let i = 0;
for (; i < lines.length; i++) {
  if (lines[i].startsWith("# 卒業要件カテゴリ")) {
    i++; // ヘッダー行もスキップ
    i++;
    break;
  }
  if (lines[i].startsWith("#") || !lines[i].trim()) continue;
  const [key, ...rest] = parseCsvLine(lines[i]);
  if (key === "項目") continue;
  meta[key] = rest.join(",");
}

// カテゴリを読む
const categories: any[] = [];
for (; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line || line.startsWith("#")) continue;
  const fields = parseCsvLine(line);
  if (fields.length < 7) continue;

  const [name, type, minCredits, maxCredits, courses, prefixes, description] = fields;

  const cat: any = {
    name,
    type,
    minCredits: parseInt(minCredits, 10),
  };
  if (maxCredits) cat.maxCredits = parseInt(maxCredits, 10);
  if (courses) cat.courses = courses.split("/").filter(Boolean);
  if (prefixes) cat.prefixes = prefixes.split("/").filter(Boolean);
  if (description) cat.description = description;

  categories.push(cat);
}

const result = {
  id: meta["学類ID"] || "mast",
  name: meta["学類名"] || "",
  gakugun: meta["学群"] || "",
  totalCreditsRequired: parseInt(meta["卒業必要単位数"] || "124", 10),
  annualCreditCap: parseInt(meta["年間履修上限"] || "45", 10),
  annualCreditCapExtended: parseInt(meta["CAP開放時上限"] || "55", 10),
  promotionRequirements: {
    year3to4: {
      minCredits: parseInt((meta["進級条件(3→4年)"] || "100").replace("単位", ""), 10),
    },
  },
  categories,
};

fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2) + "\n", "utf-8");
console.log(`✅ カリキュラム定義をインポート → ${OUTPUT}`);
