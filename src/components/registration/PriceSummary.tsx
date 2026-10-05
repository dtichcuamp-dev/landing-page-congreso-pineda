"use client";

import { Receipt, Sparkles } from "lucide-react";
import { PARTICIPANT_BY_ID, calcTotal, usd, type ParticipantTypeId } from "@/data/pricing";
import { bs, useBcvRate } from "@/lib/useBcvRate";

interface Props {
  tipo: ParticipantTypeId | "";
  jornadas: string[];
}

export function PriceSummary({ tipo, jornadas }: Props) {
  const rateBcv = useBcvRate();
  const { rate, count, total, exonerated } = calcTotal(tipo, jornadas);
  const label = tipo ? PARTICIPANT_BY_ID[tipo].label : null;

  return (
    <div
      className="rounded-2xl bg-gradient-to-br from-brand-50/90 to-clinic-50/90 p-4 ring-1 ring-brand-100"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-brand-800">
        <Receipt className="size-4" aria-hidden />
        Resumen de tu inscripción
      </div>

      {!tipo || count === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">
          Elige tu tipo de participante y las jornadas para calcular el monto.
        </p>
      ) : exonerated ? (
        <div className="mt-2 flex items-center gap-2">
          <Sparkles className="size-5 text-clinic-600" aria-hidden />
          <p className="text-base font-bold text-clinic-700">
            Exonerado <span className="font-medium text-ink-soft">· {label}</span>
          </p>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-ink-soft">
            {label} · {usd(rate)} × {count} {count === 1 ? "jornada" : "jornadas"}
          </p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-ink">
            {usd(total)}
            <span className="ml-1.5 text-sm font-semibold text-ink-mute">USD</span>
          </p>
          {rateBcv && (
            <p className="mt-0.5 text-xs text-ink-mute">
              ≈ {bs(total * rateBcv)} a tasa BCV de {rateBcv.toFixed(2)} Bs/USD (referencial)
            </p>
          )}
        </>
      )}
    </div>
  );
}
