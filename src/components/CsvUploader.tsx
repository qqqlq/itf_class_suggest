"use client";

import { useCallback, useState } from "react";

interface CsvUploaderProps {
  onUpload: (csvText: string) => void;
  compact?: boolean;
  onReset?: () => void;
}

export default function CsvUploader({
  onUpload,
  compact,
  onReset,
}: CsvUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) onUpload(text);
      };
      reader.readAsText(file, "UTF-8");
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".csv")) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  if (compact) {
    return (
      <div className="flex items-center gap-4 animate-fade-in" style={{ background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
        <svg
          className="text-success"
          style={{ width: '1.25rem', height: '1.25rem' }}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <span className="font-medium text-success text-sm">成績ファイル読み込み済み</span>
        <label className="text-secondary text-sm font-medium" style={{ marginLeft: 'auto', cursor: 'pointer', textDecoration: 'underline' }}>
          別のファイルを読み込む
          <input
            type="file"
            accept=".csv"
            onChange={handleChange}
            style={{ display: 'none' }}
          />
        </label>
        {onReset && (
          <button
            onClick={onReset}
            className="text-tertiary"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
            aria-label="リセット"
          >
            <svg style={{ width: '1rem', height: '1rem' }} viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`glass-panel text-center animate-slide-down`}
      style={{
        padding: '3rem 2rem',
        border: isDragging ? '2px dashed var(--color-brand)' : '2px dashed var(--color-border)',
        backgroundColor: isDragging ? 'var(--color-brand-light)' : 'var(--color-surface)',
        transition: 'all var(--transition-normal)'
      }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="justify-center">
          <svg
            className="text-tertiary"
            style={{ width: '3rem', height: '3rem', color: isDragging ? 'var(--color-brand)' : 'var(--color-text-tertiary)' }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </div>
        <div>
          <p className="text-lg font-semibold text-primary">
            twinsで出力した成績ファイル(.csv)
          </p>
          <p className="text-sm text-secondary mt-2">
            ドラッグ＆ドロップ、またはクリックしてファイルを選択
          </p>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <label className="btn btn-primary">
            ファイルを選択してアップロード
            <input
              type="file"
              accept=".csv"
              onChange={handleChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
