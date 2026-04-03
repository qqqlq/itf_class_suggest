"use client";

import { useState } from "react";
import type { SuggestedCourse, TimetableSlot } from "@/types";
import { buildTimetableSlots, DAYS, PERIODS } from "@/lib/timetableResolver";

interface TimetableGridProps {
  suggestions: SuggestedCourse[];
}

const MODULES = ["春A", "春B", "春C", "秋A", "秋B", "秋C"] as const;
type Module = (typeof MODULES)[number];

const MODULE_GROUPS = [
  { label: "春学期", modules: ["春A", "春B", "春C"] as Module[] },
  { label: "秋学期", modules: ["秋A", "秋B", "秋C"] as Module[] },
];

const PERIOD_TIMES: Record<number, string> = {
  1: "8:40〜9:55",
  2: "10:10〜11:25",
  3: "12:15〜13:30",
  4: "13:45〜15:00",
  5: "15:15〜16:30",
  6: "16:45〜18:00",
};

const PRIORITY_STYLE: Record<SuggestedCourse["priority"], { bg: string; border: string; text: string; badge: string }> = {
  highest: {
    bg: "rgba(254,226,226,0.9)",
    border: "#fca5a5",
    text: "#991b1b",
    badge: "#ef4444",
  },
  high: {
    bg: "rgba(254,243,199,0.9)",
    border: "#fcd34d",
    text: "#92400e",
    badge: "#f59e0b",
  },
  medium: {
    bg: "rgba(219,234,254,0.9)",
    border: "#93c5fd",
    text: "#1e40af",
    badge: "#3b82f6",
  },
  low: {
    bg: "rgba(241,245,249,0.9)",
    border: "#cbd5e1",
    text: "#475569",
    badge: "#94a3b8",
  },
};

const PRIORITY_LABELS: Record<SuggestedCourse["priority"], string> = {
  highest: "最優先",
  high: "高",
  medium: "中",
  low: "低",
};

function CourseCard({ slot }: { slot: TimetableSlot }) {
  const style = PRIORITY_STYLE[slot.course.priority];
  return (
    <div
      style={{
        background: style.bg,
        border: `1.5px solid ${style.border}`,
        borderRadius: "8px",
        padding: "0.4rem 0.5rem",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "0.2rem",
        overflow: "hidden",
        cursor: "default",
        transition: "transform 0.1s, box-shadow 0.1s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "";
      }}
      title={`${slot.course.course.name}\n科目番号: ${slot.course.course.id}\n優先度: ${PRIORITY_LABELS[slot.course.priority]}\n理由: ${slot.course.reason}`}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: "0.7rem",
          color: style.text,
          lineHeight: 1.3,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {slot.course.course.name}
      </div>
      <div
        style={{
          fontSize: "0.6rem",
          color: style.text,
          opacity: 0.7,
          fontFamily: "monospace",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {slot.course.course.id}
      </div>
      <div style={{ marginTop: "auto", display: "flex", gap: "0.25rem", alignItems: "center" }}>
        <span
          style={{
            fontSize: "0.55rem",
            fontWeight: 700,
            padding: "0.1rem 0.3rem",
            borderRadius: "3px",
            background: style.badge,
            color: "#fff",
            whiteSpace: "nowrap",
          }}
        >
          {PRIORITY_LABELS[slot.course.priority]}
        </span>
        {slot.course.course.credits > 0 && (
          <span style={{ fontSize: "0.6rem", color: style.text, opacity: 0.8 }}>
            {slot.course.course.credits}単位
          </span>
        )}
      </div>
    </div>
  );
}

export default function TimetableGrid({ suggestions }: TimetableGridProps) {
  const [selectedSemester, setSelectedSemester] = useState<"春" | "秋">("春");
  const [selectedModule, setSelectedModule] = useState<Module>("春A");
  const slots = buildTimetableSlots(suggestions);

  const activeGroup = MODULE_GROUPS.find((g) => g.label === `${selectedSemester}学期`)!;

  const getSlot = (day: string, period: number, module: Module): TimetableSlot | undefined =>
    slots.find((s) => s.day === day && s.period === period && s.module === module);

  // Count courses per module for the badge
  const moduleCounts = MODULES.reduce((acc, m) => {
    acc[m] = slots.filter((s) => s.module === m).length;
    return acc;
  }, {} as Record<Module, number>);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-primary)", margin: 0 }}>
          時間割プレビュー
        </h3>

        {/* 学期 + モジュール切り替え */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {/* 春/秋 タブ */}
          <div
            style={{
              display: "flex",
              background: "var(--color-bg)",
              borderRadius: "8px",
              padding: "2px",
              border: "1px solid var(--color-border)",
            }}
          >
            {(["春", "秋"] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSelectedSemester(s);
                  setSelectedModule(`${s}A` as Module);
                }}
                style={{
                  padding: "0.3rem 0.8rem",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: selectedSemester === s ? 700 : 400,
                  background: selectedSemester === s ? "var(--color-brand)" : "transparent",
                  color: selectedSemester === s ? "#fff" : "var(--color-secondary)",
                  transition: "all 0.15s",
                }}
              >
                {s}学期
              </button>
            ))}
          </div>

          {/* A/B/C モジュール */}
          <div
            style={{
              display: "flex",
              background: "var(--color-bg)",
              borderRadius: "8px",
              padding: "2px",
              border: "1px solid var(--color-border)",
            }}
          >
            {activeGroup.modules.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedModule(m)}
                style={{
                  padding: "0.3rem 0.6rem",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: selectedModule === m ? 700 : 400,
                  background: selectedModule === m ? "var(--color-brand)" : "transparent",
                  color: selectedModule === m ? "#fff" : "var(--color-secondary)",
                  transition: "all 0.15s",
                  position: "relative",
                }}
              >
                {m}
                {moduleCounts[m] > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-3px",
                      right: "-3px",
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: "0.55rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                    }}
                  >
                    {moduleCounts[m]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* グリッド本体 */}
      <div
        style={{
          overflowX: "auto",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
          <thead>
            <tr>
              {/* 時限列ヘッダー */}
              <th
                style={{
                  width: "70px",
                  padding: "0.6rem",
                  background: "var(--color-bg)",
                  borderBottom: "1px solid var(--color-border)",
                  borderRight: "1px solid var(--color-border)",
                  fontSize: "0.7rem",
                  color: "var(--color-tertiary)",
                  fontWeight: 500,
                  textAlign: "center",
                }}
              />
              {DAYS.map((day) => (
                <th
                  key={day}
                  style={{
                    padding: "0.6rem",
                    background: "var(--color-bg)",
                    borderBottom: "1px solid var(--color-border)",
                    borderRight: "1px solid var(--color-border)",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "var(--color-primary)",
                    textAlign: "center",
                  }}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => (
              <tr key={period}>
                {/* 時限 */}
                <td
                  style={{
                    padding: "0.4rem 0.6rem",
                    background: "var(--color-bg)",
                    borderBottom: "1px solid var(--color-border)",
                    borderRight: "1px solid var(--color-border)",
                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--color-primary)" }}>
                    {period}
                  </div>
                  <div style={{ fontSize: "0.6rem", color: "var(--color-tertiary)", marginTop: "0.15rem" }}>
                    {PERIOD_TIMES[period].split("〜")[0]}
                    <br />〜
                    <br />{PERIOD_TIMES[period].split("〜")[1]}
                  </div>
                </td>

                {/* 各曜日セル */}
                {DAYS.map((day) => {
                  const slot = getSlot(day, period, selectedModule);
                  return (
                    <td
                      key={`${day}-${period}`}
                      style={{
                        padding: "0.35rem",
                        borderBottom: "1px solid var(--color-border)",
                        borderRight: "1px solid var(--color-border)",
                        height: "88px",
                        minWidth: "100px",
                        verticalAlign: "top",
                        background: slot ? "transparent" : "var(--color-surface)",
                      }}
                    >
                      {slot ? (
                        <CourseCard slot={slot} />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <div
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: "var(--color-border)",
                            }}
                          />
                        </div>
                      )}
                    </td>
                  );
                })}

              </tr>
            ))}
          </tbody>
        </table>

        {/* 時限未定行（モジュールは分かるが dayPeriod がない科目） */}
        {(() => {
          const noSchedule = suggestions.filter(
            (s) =>
              (!s.course.dayPeriod || s.course.dayPeriod === "by appointment") &&
              s.course.modules.includes(selectedModule)
          );
          if (noSchedule.length === 0) return null;
          return (
            <div
              style={{
                borderTop: "2px dashed var(--color-border)",
                padding: "0.5rem 0.75rem",
                background: "var(--color-bg)",
              }}
            >
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "var(--color-tertiary)",
                  marginBottom: "0.4rem",
                  fontWeight: 600,
                }}
              >
                {selectedModule} ・ 時限未定
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {noSchedule.map((s) => {
                  const ps = PRIORITY_STYLE[s.priority];
                  return (
                    <div
                      key={s.course.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.3rem 0.6rem",
                        borderRadius: "6px",
                        background: ps.bg,
                        border: `1px solid ${ps.border}`,
                        fontSize: "0.72rem",
                      }}
                      title={`科目番号: ${s.course.id}\n優先度: ${PRIORITY_LABELS[s.priority]}\n理由: ${s.reason}`}
                    >
                      <span
                        style={{
                          fontSize: "0.6rem",
                          fontWeight: 700,
                          padding: "0.1rem 0.3rem",
                          borderRadius: "3px",
                          background: ps.badge,
                          color: "#fff",
                        }}
                      >
                        {PRIORITY_LABELS[s.priority]}
                      </span>
                      <span style={{ fontWeight: 600, color: ps.text }}>{s.course.name}</span>
                      <span style={{ color: ps.text, opacity: 0.7 }}>{s.course.credits}単位</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* 凡例 */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", fontSize: "0.7rem" }}>
        {(["highest", "high", "medium", "low"] as const).map((p) => (
          <div key={p} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "3px",
                background: PRIORITY_STYLE[p].badge,
              }}
            />
            <span style={{ color: "var(--color-secondary)" }}>
              {PRIORITY_LABELS[p]}{" "}
              {p === "highest" && "（取り逃がし・必修）"}
              {p === "high" && "（再履修）"}
              {p === "medium" && "（充足推薦）"}
              {p === "low" && "（単位確保）"}
            </span>
          </div>
        ))}
      </div>

      {/* 時間割に乗らない提案 */}
      {(() => {
        // モジュール情報があるものは時限未定行で表示済み → ここでは modules が空のものだけ
        const unscheduled = suggestions.filter(
          (s) =>
            (!s.course.dayPeriod || s.course.dayPeriod === "by appointment") &&
            s.course.modules.length === 0
        );
        if (unscheduled.length === 0) return null;
        return (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-secondary)", marginBottom: "0.5rem" }}>
              時間割グリッド外の提案（曜日・時限情報なし / 随時・集中講義など）
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {unscheduled.map((s) => {
                const ps = PRIORITY_STYLE[s.priority];
                const moduleLabel = s.course.modules.length > 0
                  ? s.course.modules.join(" / ")
                  : "開講時期不明";
                return (
                  <div
                    key={s.course.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto auto",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.75rem",
                      padding: "0.35rem 0.5rem",
                      borderRadius: "6px",
                      background: "var(--color-surface)",
                    }}
                  >
                    <span
                      style={{
                        padding: "0.1rem 0.4rem",
                        borderRadius: "4px",
                        background: ps.badge,
                        color: "#fff",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {PRIORITY_LABELS[s.priority]}
                    </span>
                    <div>
                      <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>{s.course.name}</span>
                      <span style={{ color: "var(--color-tertiary)", fontSize: "0.65rem", fontFamily: "monospace", marginLeft: "0.4rem" }}>
                        {s.course.id}
                      </span>
                    </div>
                    <span style={{ color: "var(--color-secondary)", fontSize: "0.7rem", whiteSpace: "nowrap" }}>
                      {moduleLabel}
                    </span>
                    <span style={{ color: "var(--color-tertiary)", fontSize: "0.7rem", whiteSpace: "nowrap" }}>
                      {s.course.credits}単位
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
