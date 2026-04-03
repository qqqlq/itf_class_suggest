"use client";

import { useState } from "react";
import type { SuggestedCourse, TimetableSlot } from "@/types";
import { buildTimetableSlots, DAYS, PERIODS } from "@/lib/timetableResolver";
import ModuleTab from "./ModuleTab";

interface TimetableGridProps {
  suggestions: SuggestedCourse[];
}

const PRIORITY_BG: Record<SuggestedCourse["priority"], string> = {
  highest: "bg-red-50 border-red-200 text-red-800",
  high: "bg-orange-50 border-orange-200 text-orange-800",
  medium: "bg-blue-50 border-blue-200 text-blue-800",
  low: "bg-slate-50 border-slate-200 text-slate-600",
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
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">時間割</h3>
        <ModuleTab selected={selectedModule} onChange={setSelectedModule} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-r border-slate-200 p-2 bg-slate-50 w-10 text-xs text-slate-400" />
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="border-b border-r border-slate-200 p-2 bg-slate-50 min-w-[110px] text-xs font-semibold text-slate-600"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => (
              <tr key={period}>
                <td className="border-b border-r border-slate-200 p-2 bg-slate-50 text-center text-xs font-medium text-slate-400">
                  {period}
                </td>
                {DAYS.map((day) => {
                  const slot = getSlot(day, period);
                  return (
                    <td
                      key={`${day}-${period}`}
                      className={`border-b border-r border-slate-200 p-1.5 h-16 align-top ${
                        slot
                          ? `border ${PRIORITY_BG[slot.course.priority]}`
                          : "bg-white"
                      }`}
                    >
                      {slot ? (
                        <div className="text-xs leading-snug">
                          <div className="font-medium line-clamp-2">
                            {slot.course.course.name}
                          </div>
                          <div className="text-[10px] opacity-60 mt-0.5 font-mono">
                            {slot.course.course.id}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-slate-200" />
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
