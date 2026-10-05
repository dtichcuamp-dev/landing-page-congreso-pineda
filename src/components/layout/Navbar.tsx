"use client";

import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/data/event";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
      <nav
        aria-label="Principal"
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 ${
          scrolled || open ? "glass-strong" : "bg-transparent"
        }`}
      >
        <a href="#inicio" className="flex items-center" aria-label="Ir al inicio">
          <Image
            src="/images/logo-congreso-pineda.png"
            alt="Congreso Pineda · HCUAMP"
            width={1024}
            height={426}
            className="h-9 w-auto sm:h-10"
            priority
          />
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-white/70 hover:text-brand-700"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href="#inscripciones"
            className="hidden rounded-xl bg-gradient-to-r from-brand-500 to-clinic-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-110 sm:inline-flex"
          >
            Inscripciones
          </a>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-xl text-ink hover:bg-white/70 lg:hidden"
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div
          id="menu-movil"
          className="glass-strong mx-auto mt-2 max-w-6xl rounded-2xl p-3 lg:hidden"
        >
          <ul className="flex flex-col">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-base font-medium text-ink hover:bg-white/80"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="mt-1">
              <a
                href="#inscripciones"
                onClick={() => setOpen(false)}
                className="block rounded-xl bg-gradient-to-r from-brand-500 to-clinic-500 px-4 py-3 text-center text-base font-semibold text-white"
              >
                Inscripciones
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
