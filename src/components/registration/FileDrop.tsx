"use client";

import { FileCheck2, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { ACCEPTED_FILES } from "@/lib/validation";

interface Props {
  id: string;
  file: File | null;
  onChange: (f: File | null) => void;
  error?: string;
}

const formatSize = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

export function FileDrop({ id, file, onChange, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPTED_FILES}
        className="sr-only"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : `${id}-hint`}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />

      {file ? (
        <div className="glass-input flex items-center gap-3 rounded-2xl p-3.5">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-clinic-100 text-clinic-600">
            <FileCheck2 className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
            <p className="text-xs text-ink-mute">{formatSize(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            aria-label="Quitar archivo"
            className="inline-flex size-9 items-center justify-center rounded-lg text-ink-mute hover:bg-white hover:text-red-500"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) onChange(f);
          }}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition ${
            drag ? "border-brand-500 bg-brand-50/80" : "border-brand-200 bg-white/50 hover:border-brand-400 hover:bg-white/80"
          } ${error ? "!border-red-400" : ""}`}
        >
          <UploadCloud className="size-8 text-brand-500" aria-hidden />
          <span className="text-sm font-semibold text-ink">Toca para subir o arrastra tu comprobante</span>
          <span id={`${id}-hint`} className="text-xs text-ink-mute">JPG, PNG, WebP o PDF (máx. 3 MB en PDF)</span>
        </label>
      )}

      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
