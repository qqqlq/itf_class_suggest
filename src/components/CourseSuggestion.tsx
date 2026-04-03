"use client";

import type { SuggestedCourse, GroupRequirementStatus } from "@/types";

interface CourseSuggestionProps {
  suggestions: SuggestedCourse[];
  currentYear: number;
  groupRequirements: GroupRequirementStatus[];
}

const PRIORITY_LABELS: Record<SuggestedCourse["priority"], string> = {
  highest: "最優先",
  high: "高",
  medium: "中",
  low: "低",
};

const PRIORITY_STYLE: Record<SuggestedCourse["priority"], { bg: string; color: string; border: string }> = {
  highest: { bg: "rgba(254,226,226,0.8)", color: "#991b1b", border: "#fca5a5" },
  high: { bg: "rgba(254,243,199,0.8)", color: "#92400e", border: "#fcd34d" },
  medium: { bg: "rgba(219,234,254,0.7)", color: "#1e40af", border: "#93c5fd" },
  low: { bg: "rgba(241,245,249,0.8)", color: "#475569", border: "#cbd5e1" },
};

export default function CourseSuggestion({ suggestions, currentYear, groupRequirements }: CourseSuggestionProps) {
  const totalCredits = suggestions.reduce((sum, s) => sum + s.course.credits, 0);
  const creditStatus =
    totalCredits > 45
      ? { color: "var(--color-danger)", note: "⚠ 上限超過" }
      : totalCredits >= 40
      ? { color: "var(--color-success)", note: "" }
      : { color: "var(--color-warning)", note: "⚠ 40単位未満" };

  // 要件充足系カテゴリの進捗（「自由選択」と「その他」を除く）
  const requirementProgress = groupRequirements
    .filter((g) => g.groupName !== "その他・未分類")
    .flatMap((g) =>
      g.categories
        .filter((c) => c.type !== "free")
        .map((c) => {
          const suggested = suggestions
            .filter((s) => s.categoryName === c.categoryName)
            .reduce((sum, s) => sum + s.course.credits, 0);
          return { ...c, suggested };
        })
        .filter((c) => c.suggested > 0 || !c.fulfilled)
    );

  // カテゴリグループを「要件充足」と「自由選択」に分離
  const requirementGroups: Record<string, SuggestedCourse[]> = {};
  const freeGroups: Record<string, SuggestedCourse[]> = {};
  for (const s of suggestions) {
    if (s.categoryName === "自由選択") {
      if (!freeGroups[s.categoryName]) freeGroups[s.categoryName] = [];
      freeGroups[s.categoryName].push(s);
    } else {
      if (!requirementGroups[s.categoryName]) requirementGroups[s.categoryName] = [];
      requirementGroups[s.categoryName].push(s);
    }
  }
  const hasFree = Object.keys(freeGroups).length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* 概要バー */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.25rem",
          borderRadius: "12px",
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-primary)" }}>
            {currentYear}年次の推奨履修リスト
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-tertiary)", marginTop: "0.25rem" }}>
            最優先 = 取り逃がし・必修、中 = カテゴリ充足のため推薦、低 = 単位数確保のため提案
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--color-secondary)" }}>合計:</span>
          <span style={{ fontWeight: 800, fontSize: "1.1rem", color: creditStatus.color }}>
            {totalCredits}単位
          </span>
          {creditStatus.note && (
            <span style={{ fontSize: "0.75rem", color: creditStatus.color, fontWeight: 600 }}>
              {creditStatus.note}
            </span>
          )}
        </div>
      </div>

      {/* 要件別進捗 */}
      {requirementProgress.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "0.5rem",
          }}
        >
          {requirementProgress.map((c) => {
            const afterSuggested = c.earnedCredits + c.suggested;
            const pct = c.minCredits > 0 ? Math.min(100, (afterSuggested / c.minCredits) * 100) : 100;
            const basePct = c.minCredits > 0 ? Math.min(100, (c.earnedCredits / c.minCredits) * 100) : 100;
            const isFulfilled = afterSuggested >= c.minCredits;
            return (
              <div
                key={c.categoryName}
                style={{
                  padding: "0.6rem 0.75rem",
                  borderRadius: "8px",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.35rem" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--color-secondary)" }}>
                    {c.categoryName}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: isFulfilled ? "var(--color-success)" : "var(--color-warning)", fontWeight: 700 }}>
                    {afterSuggested}/{c.minCredits}単位
                  </span>
                </div>
                {/* プログレスバー */}
                <div style={{ height: "5px", borderRadius: "3px", background: "var(--color-border)", overflow: "hidden" }}>
                  <div style={{ height: "100%", display: "flex" }}>
                    <div style={{ width: `${basePct}%`, background: "var(--color-success)", transition: "width 0.3s" }} />
                    <div style={{ width: `${pct - basePct}%`, background: "var(--color-warning)", opacity: 0.7, transition: "width 0.3s" }} />
                  </div>
                </div>
                {c.suggested > 0 && (
                  <div style={{ fontSize: "0.65rem", color: "var(--color-tertiary)", marginTop: "0.25rem" }}>
                    現在 {c.earnedCredits}単位 + 提案 <span style={{ color: "var(--color-warning)", fontWeight: 700 }}>+{c.suggested}単位</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 要件充足のための提案 */}
      {Object.keys(requirementGroups).length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-secondary)", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
            要件充足のための提案
            <span style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
          </div>
          {Object.entries(requirementGroups).map(([category, items]) => (
            <CategoryBlock key={category} category={category} items={items} />
          ))}
        </div>
      )}

      {/* 単位数確保（自由選択）*/}
      {hasFree && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-tertiary)", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
            単位数確保（自由選択）
            <span style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
          </div>
          {Object.entries(freeGroups).map(([category, items]) => (
            <CategoryBlock key={category} category={category} items={items} muted />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryBlock({
  category,
  items,
  muted = false,
}: {
  category: string;
  items: SuggestedCourse[];
  muted?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: muted ? "var(--color-tertiary)" : "var(--color-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "0.5rem",
          paddingLeft: "0.25rem",
        }}
      >
        {category}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
          borderRadius: "10px",
          overflow: "hidden",
          border: `1px solid ${muted ? "var(--color-border)" : "var(--color-border)"}`,
          opacity: muted ? 0.8 : 1,
        }}
      >
        {items.map((s, idx) => {
          const ps = PRIORITY_STYLE[s.priority];
          return (
            <div
              key={s.course.id}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto auto",
                gap: "0.75rem",
                alignItems: "center",
                padding: "0.65rem 1rem",
                background: idx % 2 === 0 ? "var(--color-surface)" : "var(--color-bg)",
                borderTop: idx > 0 ? "1px solid var(--color-border)" : "none",
              }}
            >
              {/* 優先度バッジ */}
              <span
                style={{
                  padding: "0.15rem 0.5rem",
                  borderRadius: "5px",
                  background: ps.bg,
                  color: ps.color,
                  border: `1px solid ${ps.border}`,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {PRIORITY_LABELS[s.priority]}
              </span>

              {/* 科目名・番号 */}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    color: "var(--color-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.course.name}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.15rem", alignItems: "center", flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontFamily: "monospace",
                      color: "var(--color-tertiary)",
                    }}
                  >
                    {s.course.id}
                  </span>
                  {s.course.standardYear > 0 && (
                    <span style={{ fontSize: "0.65rem", color: "var(--color-tertiary)" }}>
                      {s.course.standardYear}年次配当
                    </span>
                  )}
                  {s.reason && (
                    <span style={{ fontSize: "0.65rem", color: "var(--color-secondary)" }}>
                      · {s.reason}
                    </span>
                  )}
                </div>
              </div>

              {/* 曜日時限 */}
              <div style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                {s.course.dayPeriod && s.course.dayPeriod !== "by appointment" ? (
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>
                    {s.course.dayPeriod}
                  </span>
                ) : (
                  <span style={{ fontSize: "0.7rem", color: "var(--color-tertiary)" }}>随時</span>
                )}
                <div style={{ fontSize: "0.65rem", color: "var(--color-tertiary)", marginTop: "0.1rem" }}>
                  {s.course.modules.join("/")}
                </div>
              </div>

              {/* 単位数 */}
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  color: "var(--color-secondary)",
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                {s.course.credits}単位
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
