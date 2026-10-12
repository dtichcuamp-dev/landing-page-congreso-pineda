"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, ShieldCheck } from "lucide-react";
import { BANK_TRANSFER_DETAILS } from "@/data/pricing";
import { bs, useBcvRate } from "@/lib/useBcvRate";

interface Props {
  totalUsd: number;
}

export function PaymentDetails({ totalUsd }: Props) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const rateBcv = useBcvRate();
  const totalBs = rateBcv ? (totalUsd * rateBcv).toFixed(2) : null;

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch (err) {
      console.warn("Error al copiar:", err);
    }
  };

  const copyAll = () => {
    const lines = [
      "XIV CONGRESO PINEDA 2026 · DATOS DE PAGO",
      ...BANK_TRANSFER_DETAILS.filter((f) => f.copyable).map((f) => `${f.label}: ${f.value}`),
      totalBs ? `Monto a transferir: ${totalBs} Bs (${totalUsd} USD a tasa oficial BCV)` : `Monto: ${totalUsd} USD`,
    ];
    copyToClipboard(lines.join("\n"), "ALL");
  };

  return (
    <div className="rounded-2xl bg-white p-4 sm:p-5 ring-1 ring-slate-200/80 shadow-sm space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
        <div>
          <h4 className="text-sm font-bold text-ink flex items-center gap-2">
            <ShieldCheck className="size-4 text-clinic-600" />
            Datos Oficiales para el Pago
          </h4>
          <p className="text-xs text-ink-mute">
            Transfiere o realiza pago móvil y luego adjunta el comprobante
          </p>
        </div>

        <button
          type="button"
          onClick={copyAll}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-100"
        >
          {copiedKey === "ALL" ? (
            <>
              <Check className="size-3.5 text-clinic-600" />
              ¡Datos copiados!
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              Copiar todos los datos
            </>
          )}
        </button>
      </div>

      {/* Lista de campos bancarios con botón de copia */}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {BANK_TRANSFER_DETAILS.map((item) => {
          const isCopied = copiedKey === item.label;
          return (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-xl bg-slate-50/80 px-3 py-2 ring-1 ring-slate-100"
            >
              <div className="overflow-hidden pr-2">
                <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  {item.label}
                </span>
                <span className="block text-xs font-bold text-ink truncate select-all">
                  {item.value}
                </span>
              </div>

              {item.copyable && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(item.value, item.label)}
                  title={`Copiar ${item.label}`}
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-xs ring-1 ring-slate-200 hover:bg-slate-50 hover:text-brand-600"
                >
                  {isCopied ? (
                    <Check className="size-3.5 text-clinic-600" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>
              )}
            </div>
          );
        })}

        {/* Monto exacto calculado en Bs */}
        {totalBs && (
          <div className="flex items-center justify-between rounded-xl bg-clinic-50/80 px-3 py-2 ring-1 ring-clinic-200 sm:col-span-2">
            <div className="overflow-hidden pr-2">
              <span className="block text-[11px] font-semibold text-clinic-700 uppercase tracking-wider">
                Monto en Bolívares a transferir
              </span>
              <span className="block text-sm font-extrabold text-clinic-900 select-all">
                {bs(Number(totalBs))} <span className="text-xs font-semibold text-clinic-700">({totalUsd} USD a tasa BCV)</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(totalBs, "MONTO_BS")}
              title="Copiar monto en Bs"
              className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-clinic-800 shadow-xs ring-1 ring-clinic-300 hover:bg-clinic-100"
            >
              {copiedKey === "MONTO_BS" ? (
                <>
                  <Check className="size-3.5 text-clinic-600" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  Copiar monto
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
