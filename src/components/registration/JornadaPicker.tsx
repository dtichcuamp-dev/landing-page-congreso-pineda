"use client";

import { Check, Calendar } from "lucide-react";
import { JORNADAS } from "@/data/pricing";

interface Props {
  selected: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}

/** Picker de jornadas por día entero (5 días). */
export function JornadaPicker({ selected, onChange, error }: Props) {
  const toggle = (id: string) => onChange([id]);
  const isSelected = (id: string) => selected.includes(id);

  return (
    <fieldset aria-describedby={error ? "jornadas-error" : undefined}>
      <legend className="mb-1.5 flex w-full items-center justify-between text-sm font-semibold text-ink">
        <span>
          Día al que asistirás<span className="ml-0.5 text-brand-500" aria-hidden>*</span>
        </span>
      </legend>

      <div className="glass-input rounded-2xl p-2.5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {JORNADAS.map((j) => {
            const on = isSelected(j.id);
            return (
              <button
                key={j.id}
                type="button"
                aria-pressed={on}
                aria-label={j.label}
                onClick={() => toggle(j.id)}
                className={`flex h-12 items-center justify-center gap-2 rounded-xl text-sm transition ${
                  on
                    ? "bg-gradient-to-br from-brand-500 to-clinic-500 text-white shadow-md shadow-brand-500/30"
                    : "bg-white/70 text-ink-soft ring-1 ring-brand-100 hover:bg-white hover:ring-brand-300"
                }`}
              >
                {on ? <Check className="size-4" strokeWidth={3} aria-hidden /> : <Calendar className="size-4 opacity-50" aria-hidden />}
                <span className="font-semibold">{j.label.split(" ")[0]} {j.label.split(" ")[1]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-1.5 text-xs text-ink-mute">
        La tarifa se cobra por día (cubre tanto el bloque de la mañana como de la tarde).
      </p>
      {error && (
        <p id="jornadas-error" role="alert" className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
