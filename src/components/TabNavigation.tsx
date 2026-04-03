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
    <div>
      <nav style={{ display: 'flex', gap: '0.25rem', marginBottom: '-1px' }}>
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="text-sm font-medium"
              style={{
                padding: '0.75rem 1.25rem',
                borderBottom: isActive ? '2px solid var(--color-brand)' : '2px solid transparent',
                color: isActive ? 'var(--color-brand)' : 'var(--color-secondary)',
                background: 'transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                outline: 'none',
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--color-primary)';
                  e.currentTarget.style.borderBottomColor = 'var(--color-border)';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--color-secondary)';
                  e.currentTarget.style.borderBottomColor = 'transparent';
                }
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
