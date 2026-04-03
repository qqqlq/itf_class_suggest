interface HeaderProps {
  studentName?: string;
}

export default function Header({ studentName }: HeaderProps) {
  return (
    <header className="glass-panel" style={{ borderRadius: 0, position: 'sticky', top: 0, zIndex: 50, marginBottom: '2rem', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
      <div style={{ height: '4px', background: 'linear-gradient(to right, var(--color-brand), #c457f9)' }} />
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">履修のすすめ</h1>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-brand)', background: 'var(--color-brand-light)', padding: '0.25rem 0.75rem', borderRadius: '99px' }}>
            @ITF_mast
          </span>
        </div>
        {studentName && (
          <span className="text-sm font-medium text-secondary">
            {studentName}
          </span>
        )}
      </div>
    </header>
  );
}
