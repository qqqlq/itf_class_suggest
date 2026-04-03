"use client";

import { useState } from "react";
import type {
  StudentData,
  SuggestedCourse,
  GroupRequirementStatus,
  Curriculum,
  CourseData,
  KdbEntry,
} from "@/types";
import { parseTwinsCSV } from "@/lib/csvParser";
import { checkGroupRequirements } from "@/lib/requirementChecker";
import { suggestCourses } from "@/lib/courseSuggester";
import Header from "@/components/Header";
import CsvUploader from "@/components/CsvUploader";
import ProgressDashboard from "@/components/ProgressDashboard";
import CourseSuggestion from "@/components/CourseSuggestion";
import TimetableGrid from "@/components/TimetableGrid";
import GraduationTableView from "@/components/GraduationTableView";
import TabNavigation, { type TabId } from "@/components/TabNavigation";

import curriculumData from "../../data/curricula/mast.json";
import courseMasterData from "../../data/courses/2026.json";
import kdbDictData from "../../data/courses/kdb_dict.json";

export default function Home() {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [groupRequirements, setGroupRequirements] = useState<GroupRequirementStatus[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedCourse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("progress");

  const curriculum = curriculumData as Curriculum;
  const courseMaster = courseMasterData as Record<string, CourseData>;
  // Explicitly cast to avoid TS indexing issues
  const kdbDict = kdbDictData as Record<string, KdbEntry>;

  const handleCsvUpload = (csvText: string) => {
    try {
      setError(null);
      const parsed = parseTwinsCSV(csvText, kdbDict);
      setStudent(parsed);

      const reqs = checkGroupRequirements(parsed.grades, curriculum);
      setGroupRequirements(reqs);

      const suggested = suggestCourses(
        parsed,
        curriculum,
        courseMaster,
        parsed.currentYear,
        kdbDict
      );
      setSuggestions(suggested);
      setActiveTab("progress");
    } catch (e) {
      setError(e instanceof Error ? e.message : "CSVの解析に失敗しました");
    }
  };

  const handleReset = () => {
    setStudent(null);
    setGroupRequirements([]);
    setSuggestions([]);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col pt-8" style={{ paddingBottom: '4rem' }}>
      <Header studentName={student?.studentName} />

      <main className="flex-col max-w-5xl w-full mx-auto px-6" style={{ display: 'flex', gap: '2rem', flex: 1 }}>
        {/* CSV アップローダー */}
        <CsvUploader
          onUpload={handleCsvUpload}
          compact={!!student}
          onReset={handleReset}
        />

        {/* エラー表示 */}
        {error && (
          <div className="glass-panel text-danger animate-slide-down" style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        {/* メインコンテンツ（CSV読み込み後） */}
        {student && (
          <div className="glass-panel animate-slide-down" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <TabNavigation active={activeTab} onChange={setActiveTab} />
            </div>

            <div style={{ padding: '1.5rem' }}>
              {activeTab === "progress" && (
                <ProgressDashboard
                  student={student}
                  groupRequirements={groupRequirements}
                  totalRequired={curriculum.totalCreditsRequired}
                  courseMaster={courseMaster}
                  curriculum={curriculum}
                />
              )}

              {activeTab === "table" && (
                <GraduationTableView
                  student={student}
                  groupRequirements={groupRequirements}
                  curriculum={curriculum}
                  courseMaster={courseMaster}
                  kdbDict={kdbDict}
                />
              )}

              {activeTab === "suggestion" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {suggestions.length > 0 ? (
                    <>
                      <CourseSuggestion suggestions={suggestions} currentYear={student.currentYear} groupRequirements={groupRequirements} />
                      <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                        <TimetableGrid suggestions={suggestions} />
                      </div>
                    </>
                  ) : (
                    <p className="text-secondary text-center" style={{ padding: '3rem 0' }}>
                      サジェストできる科目がありません
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 初期状態: 説明 */}
        {!student && !error && (
          <div className="text-center text-sm text-tertiary" style={{ padding: '3rem 0' }}>
            TWINSから成績CSVをダウンロードして、上の領域にアップロードしてください
          </div>
        )}
      </main>

      <footer className="mt-auto" style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 text-center text-xs text-tertiary">
          履修のすすめ @ITF_mast — 筑波大学 情報メディア創成学類向け
        </div>
      </footer>
    </div>
  );
}
