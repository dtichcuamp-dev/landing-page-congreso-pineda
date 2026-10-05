"use client";

import { useEffect, useState } from "react";

const URL_BCV = "https://ve.dolarapi.com/v1/dolares/oficial";

/** Tasa oficial BCV (Bs/USD) solo con fines informativos. Falla en silencio. */
export function useBcvRate() {
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(URL_BCV, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const n = Number(d?.promedio);
        if (Number.isFinite(n) && n > 0) setRate(n);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  return rate;
}

export const bs = (n: number) =>
  new Intl.NumberFormat("es-VE", { style: "currency", currency: "VES" }).format(n);
