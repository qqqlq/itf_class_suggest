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
  if (lines[i].startsWith("# グループ小計")) {
    i++; // ヘッダー行もスキップ
    i++;
    break;
  }
  if (lines[i].startsWith("#") || !lines[i].trim()) continue;
  const [key, ...rest] = parseCsvLine(lines[i]);
  if (key === "項目") continue;
  meta[key] = rest.join(",");
}

// グループ小計を読む
const groupMeta: Record<string, { minCredits: number; maxCredits?: number }> =
  {};
for (; i < lines.length; i++) {
  if (lines[i].startsWith("# 卒業要件カテゴリ")) {
    i++; // ヘッダー行もスキップ
    i++;
    break;
  }
  if (lines[i].startsWith("#") || !lines[i].trim()) continue;
  const fields = parseCsvLine(lines[i]);
  if (fields[0] === "グループ名") continue;
  const name = fields[0];
  const minCredits = parseInt(fields[1], 10);
  const maxCredits = fields[2] ? parseInt(fields[2], 10) : undefined;
  groupMeta[name] = { minCredits, maxCredits };
}

// カテゴリを読む（グループ別に格納）
const groupCategories: Record<string, any[]> = {};
for (; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line || line.startsWith("#")) continue;
  const fields = parseCsvLine(line);
  if (fields.length < 8) continue;

  const [groupName, name, type, minCreditsStr, maxCreditsStr, courses, prefixes, description] =
    fields;

  const cat: any = {
    name,
    type,
    minCredits: parseInt(minCreditsStr, 10),
  };
  if (maxCreditsStr) cat.maxCredits = parseInt(maxCreditsStr, 10);
  if (courses) cat.courses = courses.split("/").filter(Boolean);
  if (prefixes) cat.prefixes = prefixes.split("/").filter(Boolean);
  if (description) cat.description = description;

  if (!groupCategories[groupName]) {
    groupCategories[groupName] = [];
  }
  groupCategories[groupName].push(cat);
}

// グループを組み立て（出現順を保持）
const groupOrder = Object.keys(groupMeta);
// groupCategories に含まれるがgroupMetaにないグループも拾う
for (const gn of Object.keys(groupCategories)) {
  if (!groupOrder.includes(gn)) groupOrder.push(gn);
}

const groups = groupOrder.map((name) => {
  const gm = groupMeta[name] || { minCredits: 0 };
  const group: any = {
    name,
    minCredits: gm.minCredits,
  };
  if (gm.maxCredits != null) group.maxCredits = gm.maxCredits;
  group.categories = groupCategories[name] || [];
  return group;
});

const result = {
  id: meta["学類ID"] || "mast",
  name: meta["学類名"] || "",
  gakugun: meta["学群"] || "",
  totalCreditsRequired: parseInt(meta["卒業必要単位数"] || "124", 10),
  annualCreditCap: parseInt(meta["年間履修上限"] || "45", 10),
  annualCreditCapExtended: parseInt(
    meta["CAP開放時上限"] || "55",
    10
  ),
  promotionRequirements: {
    year3to4: {
      minCredits: parseInt(
        (meta["進級条件(3→4年)"] || "100").replace("単位", ""),
        10
      ),
    },
  },
  groups,
};

fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2) + "\n", "utf-8");
console.log(`✅ カリキュラム定義をインポート → ${OUTPUT}`);
