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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <StudentInfoBar student={student} totalRequired={totalRequired} />

      <div>
        <h3 className="text-sm font-semibold text-secondary uppercase tracking-wide px-1 mb-4">
          科目分別達成率
        </h3>
        <div className="bento-grid">
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
      </div>

      <FailedCoursesAlert failedCourses={student.failedCourses} />
    </div>
  );
}
