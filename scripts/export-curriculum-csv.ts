/**
 * カリキュラムJSON → CSV変換スクリプト
 *
 * 使い方: npx tsx scripts/export-curriculum-csv.ts
 * 出力:   data/curricula/mast.csv
 */
import * as fs from "fs";
import * as path from "path";

const INPUT = path.resolve(__dirname, "../data/curricula/mast.json");
const OUTPUT = path.resolve(__dirname, "../data/curricula/mast.csv");

const data = JSON.parse(fs.readFileSync(INPUT, "utf-8"));

const lines: string[] = [];

// メタ情報
lines.push("# メタ情報");
lines.push("項目,値");
lines.push(`学類ID,${data.id}`);
lines.push(`学類名,${data.name}`);
lines.push(`学群,${data.gakugun}`);
lines.push(`卒業必要単位数,${data.totalCreditsRequired}`);
lines.push(`年間履修上限,${data.annualCreditCap}`);
lines.push(`CAP開放時上限,${data.annualCreditCapExtended}`);
lines.push(`進級条件(3→4年),${data.promotionRequirements.year3to4.minCredits}単位`);
lines.push("");

// グループ小計
lines.push("# グループ小計");
lines.push("グループ名,必要最低単位,上限単位");
for (const group of data.groups) {
  lines.push(
    [group.name, group.minCredits, group.maxCredits ?? ""].join(",")
  );
}
lines.push("");

// カテゴリ
lines.push("# 卒業要件カテゴリ");
lines.push(
  "グループ名,カテゴリ名,種別(required/elective/free),必要最低単位,上限単位,科目番号リスト,プレフィックス,備考"
);

for (const group of data.groups) {
  for (const cat of group.categories) {
    lines.push(
      [
        `"${group.name}"`,
        `"${cat.name}"`,
        cat.type,
        cat.minCredits,
        cat.maxCredits ?? "",
        `"${(cat.courses ?? []).join("/")}"`,
        `"${(cat.prefixes ?? []).join("/")}"`,
        `"${cat.description ?? ""}"`,
      ].join(",")
    );
  }
}

fs.writeFileSync(OUTPUT, lines.join("\n") + "\n", "utf-8");
console.log(`✅ カリキュラム定義を出力 → ${OUTPUT}`);
