"use client";

import { useState } from "react";
import type { SuggestedCourse, TimetableSlot } from "@/types";
import { buildTimetableSlots, DAYS, PERIODS } from "@/lib/timetableResolver";
import ModuleTab from "./ModuleTab";

interface TimetableGridProps {
  suggestions: SuggestedCourse[];
}

const PRIORITY_BG: Record<SuggestedCourse["priority"], string> = {
  highest: "bg-red-100 border-red-300",
  high: "bg-orange-100 border-orange-300",
  medium: "bg-blue-100 border-blue-300",
  low: "bg-gray-100 border-gray-300",
};

export default function TimetableGrid({ suggestions }: TimetableGridProps) {
  const [selectedModule, setSelectedModule] = useState("春A");
  const slots = buildTimetableSlots(suggestions);

  const getSlot = (day: string, period: number): TimetableSlot | undefined => {
    return slots.find(
      (s) => s.day === day && s.period === period && s.module === selectedModule
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">時間割</h3>
        <ModuleTab selected={selectedModule} onChange={setSelectedModule} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-50 w-12"></th>
              {DAYS.map((day) => (
                <th key={day} className="border p-2 bg-gray-50 min-w-[120px]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => (
              <tr key={period}>
                <td className="border p-2 bg-gray-50 text-center font-medium">
                  {period}
                </td>
                {DAYS.map((day) => {
                  const slot = getSlot(day, period);
                  return (
                    <td
                      key={`${day}-${period}`}
                      className={`border p-1 h-16 align-top ${
                        slot ? PRIORITY_BG[slot.course.priority] : ""
                      }`}
                    >
                      {slot && (
                        <div className="text-xs">
                          <div className="font-medium leading-tight">
                            {slot.course.course.name}
                          </div>
                          <div className="text-gray-500 mt-0.5">
                            {slot.course.course.id}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
