"use client";

import { MODULES } from "@/lib/timetableResolver";

interface ModuleTabProps {
  selected: string;
  onChange: (module: string) => void;
}

export default function ModuleTab({ selected, onChange }: ModuleTabProps) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      {MODULES.map((module) => (
        <button
          key={module}
          onClick={() => onChange(module)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            selected === module
              ? "bg-white text-blue-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {module}
        </button>
      ))}
    </div>
  );
}
