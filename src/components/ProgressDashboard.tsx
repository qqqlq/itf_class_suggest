"use client";

import type {
  GroupRequirementStatus,
  StudentData,
  CourseData,
  Curriculum,
} from "@/types";
import StudentInfoBar from "./StudentInfoBar";
import CategoryProgressCard from "./CategoryProgressCard";
import FailedCoursesAlert from "./FailedCoursesAlert";

interface ProgressDashboardProps {
  student: StudentData;
  groupRequirements: GroupRequirementStatus[];
  totalRequired: number;
  courseMaster: Record<string, CourseData>;
  curriculum: Curriculum;
}

export default function ProgressDashboard({
  student,
  groupRequirements,
  totalRequired,
  courseMaster,
  curriculum,
}: ProgressDashboardProps) {
  return (
    <div className="space-y-4">
      <StudentInfoBar student={student} totalRequired={totalRequired} />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide px-1">
          科目分別達成率
        </h3>
        {groupRequirements.map((group, idx) => {
          const curriculumGroup = curriculum.groups[idx];
          return (
            <CategoryProgressCard
              key={group.groupName}
              group={group}
              courseMaster={courseMaster}
              curriculumGroup={curriculumGroup}
            />
          );
        })}
      </div>

      <FailedCoursesAlert failedCourses={student.failedCourses} />
    </div>
  );
}
