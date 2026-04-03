interface HeaderProps {
  studentName?: string;
}

export default function Header({ studentName }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200">
      {/* アクセントバー */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400" />
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            履修のすすめ
          </h1>
          <span className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            @ITF_mast
          </span>
        </div>
        {studentName && (
          <span className="text-sm text-slate-500">
            {studentName}
          </span>
        )}
      </div>
    </header>
  );
}
