"use client";

import { useState } from "react";
import type { StudentData, SuggestedCourse, RequirementStatus, Curriculum, CourseData } from "@/types";
import { parseTwinsCSV } from "@/lib/csvParser";
import { checkRequirements } from "@/lib/requirementChecker";
import { suggestCourses } from "@/lib/courseSuggester";
import CsvUploader from "@/components/CsvUploader";
import ProgressDashboard from "@/components/ProgressDashboard";
import CourseSuggestion from "@/components/CourseSuggestion";
import TimetableGrid from "@/components/TimetableGrid";

import curriculumData from "../../data/curricula/mast.json";
import courseMasterData from "../../data/courses/2026.json";

export default function Home() {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [requirements, setRequirements] = useState<RequirementStatus[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedCourse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const curriculum = curriculumData as Curriculum;
  const courseMaster = courseMasterData as Record<string, CourseData>;

  const handleCsvUpload = (csvText: string) => {
    try {
      setError(null);
      const parsed = parseTwinsCSV(csvText);
      setStudent(parsed);

      const reqs = checkRequirements(parsed.grades, curriculum);
      setRequirements(reqs);

      const suggested = suggestCourses(
        parsed,
        curriculum,
        courseMaster,
        parsed.currentYear
      );
      setSuggestions(suggested);
    } catch (e) {
      setError(e instanceof Error ? e.message : "CSVの解析に失敗しました");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            履修計画サジェストツール
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            情報メディア創成学類向け
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {!student && <CsvUploader onUpload={handleCsvUpload} />}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {student && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">成績分析結果</h2>
              <button
                onClick={() => {
                  setStudent(null);
                  setRequirements([]);
                  setSuggestions([]);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                別のCSVを読み込む
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <ProgressDashboard
                student={student}
                requirements={requirements}
                totalRequired={curriculum.totalCreditsRequired}
              />
            </div>

            {suggestions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <CourseSuggestion suggestions={suggestions} />
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <TimetableGrid suggestions={suggestions} />
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-xs text-gray-400">
          履修計画サジェストツール — 筑波大学 情報メディア創成学類向け
        </div>
      </footer>
    </div>
  );
}
