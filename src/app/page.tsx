"use client";

import { useState } from "react";
import type {
  StudentData,
  SuggestedCourse,
  GroupRequirementStatus,
  Curriculum,
  CourseData,
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

export default function Home() {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [groupRequirements, setGroupRequirements] = useState<GroupRequirementStatus[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedCourse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("progress");

  const curriculum = curriculumData as Curriculum;
  const courseMaster = courseMasterData as Record<string, CourseData>;

  const handleCsvUpload = (csvText: string) => {
    try {
      setError(null);
      const parsed = parseTwinsCSV(csvText);
      setStudent(parsed);

      const reqs = checkGroupRequirements(parsed.grades, curriculum);
      setGroupRequirements(reqs);

      const suggested = suggestCourses(
        parsed,
        curriculum,
        courseMaster,
        parsed.currentYear
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header studentName={student?.studentName} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-5">
        {/* CSV アップローダー */}
        <CsvUploader
          onUpload={handleCsvUpload}
          compact={!!student}
          onReset={handleReset}
        />

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* メインコンテンツ（CSV読み込み後） */}
        {student && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 pt-4">
              <TabNavigation active={activeTab} onChange={setActiveTab} />
            </div>

            <div className="px-5 py-5">
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
                  groupRequirements={groupRequirements}
                  curriculum={curriculum}
                  courseMaster={courseMaster}
                />
              )}

              {activeTab === "suggestion" && (
                <div className="space-y-6">
                  {suggestions.length > 0 ? (
                    <>
                      <CourseSuggestion suggestions={suggestions} />
                      <div className="border-t border-slate-100 pt-6">
                        <TimetableGrid suggestions={suggestions} />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400 py-8 text-center">
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
          <div className="text-center py-6 text-sm text-slate-400">
            TWINSから成績CSVをダウンロードして、上のボタンでアップロードしてください
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-3 text-center text-xs text-slate-400">
          履修のすすめ @ITF_mast — 筑波大学 情報メディア創成学類向け
        </div>
      </footer>
    </div>
  );
}
