"use client";

export type TabId = "progress" | "table" | "suggestion";

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: "progress", label: "達成状況" },
  { id: "table", label: "卒業要件表" },
  { id: "suggestion", label: "履修提案" },
];

interface TabNavigationProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export default function TabNavigation({ active, onChange }: TabNavigationProps) {
  return (
    <div className="border-b border-slate-200">
      <nav className="-mb-px flex gap-1">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
