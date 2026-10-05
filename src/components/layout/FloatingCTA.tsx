"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

/** Botón flotante: aparece al salir del Hero y se oculta al llegar a Inscripciones. */
export function FloatingCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("inicio");
    const form = document.getElementById("inscripciones");
    const state = { pastHero: false, onForm: false };
    const update = () => setShow(state.pastHero && !state.onForm);

    const ioHero = new IntersectionObserver(([e]) => {
      state.pastHero = !e.isIntersecting;
      update();
    });
    const ioForm = new IntersectionObserver(([e]) => {
      state.onForm = e.isIntersecting;
      update();
    }, { threshold: 0.15 });

    if (hero) ioHero.observe(hero);
    if (form) ioForm.observe(form);
    return () => {
      ioHero.disconnect();
      ioForm.disconnect();
    };
  }, []);

  return (
    <a
      href="#inscripciones"
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      className={`fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-clinic-500 px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-600/30 ring-4 ring-white/60 transition-all duration-300 hover:brightness-110 sm:bottom-8 sm:right-8 ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      Inscríbete
      <ArrowRight className="size-4" />
    </a>
  );
}
