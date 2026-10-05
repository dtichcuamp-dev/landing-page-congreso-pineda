"use client";

import { Check, Moon, Sun } from "lucide-react";
import { DAYS_META, JORNADAS } from "@/data/pricing";

interface Props {
  selected: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}

/** Cuadrícula 5 días × 2 turnos para elegir las jornadas a las que se asistirá. */
export function JornadaPicker({ selected, onChange, error }: Props) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const allSelected = selected.length === JORNADAS.length;

  return (
    <fieldset aria-describedby={error ? "jornadas-error" : undefined}>
      <legend className="mb-1.5 flex w-full items-center justify-between text-sm font-semibold text-ink">
        <span>
          Jornadas a las que asistirás<span className="ml-0.5 text-brand-500" aria-hidden>*</span>
        </span>
        <button
          type="button"
          onClick={() => onChange(allSelected ? [] : JORNADAS.map((j) => j.id))}
          className="text-xs font-semibold text-brand-600 hover:text-brand-800 hover:underline"
        >
          {allSelected ? "Limpiar" : "Seleccionar todas"}
        </button>
      </legend>

      <div className="glass-input rounded-2xl p-2.5">
        <div className="grid grid-cols-[auto_repeat(5,minmax(0,1fr))] items-center gap-1.5 sm:gap-2">
          <span />
          {DAYS_META.map((d) => (
            <span key={d.day} className="text-center text-[0.7rem] font-semibold uppercase leading-tight text-ink-mute sm:text-xs">
              {d.weekday}
              <span className="block text-sm font-extrabold text-ink">{String(d.day).padStart(2, "0")}</span>
            </span>
          ))}

          {(["manana", "tarde"] as const).map((turno) => (
            <Row key={turno} turno={turno} selected={selected} toggle={toggle} />
          ))}
        </div>
      </div>

      <p className="mt-1.5 text-xs text-ink-mute">
        La tarifa se cobra por jornada (mañana o tarde). Elige solo las que usarás.
      </p>
      {error && (
        <p id="jornadas-error" role="alert" className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function Row({
  turno,
  selected,
  toggle,
}: {
  turno: "manana" | "tarde";
  selected: string[];
  toggle: (id: string) => void;
}) {
  const Icon = turno === "manana" ? Sun : Moon;
  return (
    <>
      <span className="flex items-center gap-1 pr-1 text-xs font-semibold text-ink-soft">
        <Icon className="size-4 text-brand-500" aria-hidden />
        <span className="hidden sm:inline">{turno === "manana" ? "Mañana" : "Tarde"}</span>
      </span>
      {JORNADAS.filter((j) => j.turno === turno).map((j) => {
        const on = selected.includes(j.id);
        return (
          <button
            key={j.id}
            type="button"
            aria-pressed={on}
            aria-label={j.label}
            onClick={() => toggle(j.id)}
            className={`flex h-11 items-center justify-center rounded-xl text-sm transition ${
              on
                ? "bg-gradient-to-br from-brand-500 to-clinic-500 text-white shadow-md shadow-brand-500/30"
                : "bg-white/70 text-ink-mute ring-1 ring-brand-100 hover:bg-white hover:ring-brand-300"
            }`}
          >
            {on ? <Check className="size-5" strokeWidth={3} aria-hidden /> : <span aria-hidden className="size-2 rounded-full bg-brand-200" />}
          </button>
        );
      })}
    </>
  );
}
