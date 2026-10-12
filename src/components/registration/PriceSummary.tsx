"use client";

import { Award, Gift, Receipt, Sparkles } from "lucide-react";
import { PARTICIPANT_BY_ID, calcTotal, usd } from "@/data/pricing";
import { bs, useBcvRate } from "@/lib/useBcvRate";
import type { InstitucionOrigen, ParticipantTypeId, SeleccionTurnos } from "@/types/registration";

interface Props {
  tipo: ParticipantTypeId | "";
  turnos: SeleccionTurnos | string[];
  origen?: InstitucionOrigen;
}

export function PriceSummary({ tipo, turnos, origen = "HCUAMP" }: Props) {
  const rateBcv = useBcvRate();
  const { rate, diasCount, turnosCount, total, exonerated } = calcTotal(tipo, turnos, origen);
  const typeInfo = tipo ? PARTICIPANT_BY_ID[tipo] : null;
  const label = typeInfo?.label ?? "";

  return (
    <div
      className="rounded-2xl bg-gradient-to-br from-brand-50/90 to-clinic-50/90 p-4 ring-1 ring-brand-100"
      aria-live="polite"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-800">
          <Receipt className="size-4" aria-hidden />
          Resumen de tu inscripción
        </div>
        {diasCount > 0 && (
          <span className="text-xs font-semibold text-slate-600 bg-white/80 px-2 py-0.5 rounded-full ring-1 ring-black/5">
            {diasCount} {diasCount === 1 ? "día" : "días"} ({turnosCount} {turnosCount === 1 ? "turno" : "turnos"})
          </span>
        )}
      </div>

      {!tipo || diasCount === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">
          Selecciona tu categoría de participante y al menos un día/turno para ver el detalle de inscripción.
        </p>
      ) : exonerated ? (
        <div className="mt-2.5 space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-clinic-100 text-clinic-700">
              <Sparkles className="size-4" aria-hidden />
            </span>
            <div>
              <p className="text-base font-bold text-clinic-700">
                Inscripción Exonerada <span className="font-normal text-xs text-ink-soft">· HCUAMP</span>
              </p>
              <p className="text-xs text-ink-soft">Categoría: <b className="text-ink">{label}</b> · Monto: <b className="text-clinic-700">0$ USD</b></p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-2.5 space-y-1">
          <p className="text-xs font-medium text-ink-soft">
            <b className="text-ink">{label}</b> · {usd(rate)} por día
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold tracking-tight text-ink">
              {usd(total)}
              <span className="ml-1 text-sm font-semibold text-ink-mute">USD</span>
            </p>
            <span className="text-xs text-ink-soft">
              ({usd(rate)} × {diasCount} {diasCount === 1 ? "día" : "días"})
            </span>
          </div>
          {rateBcv && (
            <p className="text-xs text-ink-mute">
              ≈ {bs(total * rateBcv)} a tasa oficial BCV de {rateBcv.toFixed(2)} Bs/USD
            </p>
          )}
        </div>
      )}

      {/* Beneficios incluidos para todos */}
      <div className="mt-3.5 pt-3 border-t border-brand-100/60 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-soft">
        <span className="flex items-center gap-1">
          <Award className="size-3 text-clinic-600" />
          Certificado digital avalado
        </span>
        <span className="flex items-center gap-1">
          <Gift className="size-3 text-brand-600" />
          Kit oficial del participante
        </span>
      </div>
    </div>
  );
}
