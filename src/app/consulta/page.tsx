"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  Download,
  Printer,
  QrCode,
  RefreshCw,
  Sparkles,
  Building2,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Check,
  ArrowRight,
  ChevronRight,
  CreditCard,
  FileText,
} from "lucide-react";

interface TurnoDetalle {
  diaId: string;
  diaLabel: string;
  manana?: string;
  tarde?: string;
}

interface Participant {
  id: string;
  fecha?: string;
  origen: "HCUAMP" | "OTRA";
  institucion: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  sexo?: string;
  fechaNacimiento?: string;
  telefono?: string;
  correo?: string;
  tipo: string;
  tipoLabel?: string;
  detalleExtra?: string;
  dias?: string;
  numDias?: number;
  turnosTexto?: string;
  turnosJson?: string;
  turnosDetallados: TurnoDetalle[];
  monto?: number;
  estado: string;
  exonerated: boolean;
}

function ConsultaContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || searchParams.get("cedula") || searchParams.get("id") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [generatingDownload, setGeneratingDownload] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Ejecutar búsqueda por API
  const doSearch = useCallback(async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    if (!q) {
      setError("Ingresa tu número de cédula, código de comprobante o correo.");
      return;
    }

    setLoading(true);
    setError(null);
    setParticipant(null);
    setQrCodeUrl(null);

    try {
      const res = await fetch(`/api/consulta?query=${encodeURIComponent(q)}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();
      if (!res.ok || !data.ok || !data.participant) {
        throw new Error(
          data.error ||
            `No encontramos un registro para «${q}». Verifica que el número de cédula esté escrito correctamente.`
        );
      }

      setParticipant(data.participant);

      // Generar QR de acceso oficial
      const qrUrl = await QRCode.toDataURL(data.participant.id, {
        width: 500,
        margin: 2,
        color: {
          dark: "#0b2545",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      });
      setQrCodeUrl(qrUrl);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al consultar el registro.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Búsqueda automática si viene en URL
  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery);
    }
  }, [initialQuery, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(searchQuery);
  };

  // Generación de Ficha Gráfica Descargable en Alta Resolución (Canvas 2X)
  const handleDownloadFicha = async () => {
    if (!participant || !qrCodeUrl) return;
    setGeneratingDownload(true);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No se pudo inicializar canvas");

      // Dimensiones de la credencial: 800 x 1120 px a 2x retina
      const width = 800;
      const height = 1140;
      canvas.width = width;
      canvas.height = height;

      // Fondo blanco redondeado
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Cabecera Navy Gradient
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, "#0b2545");
      grad.addColorStop(0.6, "#134074");
      grad.addColorStop(1, "#0d9488");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, 180);

      // Título en cabecera
      ctx.fillStyle = "#5eead4";
      ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("PASE OFICIAL DE ACCESO · CREDENCIAL DIGITAL", 40, 50);

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("XIV CONGRESO PINEDA 2026", 40, 90);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("Hospital Central Universitario Dr. Antonio María Pineda", 40, 120);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("Hotel Biotel Suites · Barquisimeto, Edo. Lara · 02 al 06 Nov 2026", 40, 145);

      // Badge de estado en cabecera
      ctx.fillStyle = participant.exonerated ? "#2dd4bf" : "#fef08a";
      ctx.fillRect(width - 200, 40, 160, 36);
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(participant.exonerated ? "EXONERADO 100%" : "INSCRIPCIÓN ACTIVA", width - 120, 63);
      ctx.textAlign = "left";

      // Separador estético
      ctx.fillStyle = "#14b8a6";
      ctx.fillRect(0, 180, width, 6);

      // Sección Datos del Participante
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(35, 210, width - 70, 175);
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(35, 210, width - 70, 175);

      // Nombre y Apellido
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("PARTICIPANTE REGISTRADO", 55, 240);

      ctx.fillStyle = "#0f172a";
      ctx.font = "900 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(`${participant.nombres} ${participant.apellidos}`, 55, 270);

      // Cédula y Teléfono
      ctx.fillStyle = "#334155";
      ctx.font = "bold 16px monospace";
      ctx.fillText(`C.I.: ${participant.cedula}`, 55, 300);

      if (participant.telefono) {
        ctx.fillStyle = "#64748b";
        ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(`Tlf: ${participant.telefono}`, 250, 300);
      }

      // Institución y Categoría
      ctx.fillStyle = "#0d9488";
      ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(`Categoría: ${participant.tipoLabel || participant.tipo}`, 55, 335);

      ctx.fillStyle = "#475569";
      ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      const inst = participant.institucion || "HCUAMP";
      ctx.fillText(`Institución: ${inst.length > 55 ? inst.slice(0, 55) + "..." : inst}`, 55, 360);

      // Código QR Central de Alta Resolución
      const qrImg = new window.Image();
      qrImg.crossOrigin = "anonymous";
      qrImg.src = qrCodeUrl;
      await new Promise((resolve) => {
        qrImg.onload = resolve;
      });

      const qrSize = 250;
      const qrX = (width - qrSize) / 2;
      const qrY = 415;

      // Marco del QR
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30);
      ctx.strokeStyle = "#cbd5e1";
      ctx.strokeRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30);
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Código de Identificación
      ctx.textAlign = "center";
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("CÓDIGO OFICIAL DE COMPROBANTE", width / 2, 725);

      ctx.fillStyle = "#0b2545";
      ctx.font = "900 34px monospace";
      ctx.fillText(participant.id, width / 2, 765);

      ctx.fillStyle = "#0f766e";
      ctx.font = "bold 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("✓ Control de Acceso: Salón Principal (1) / Salón Alterno (2)", width / 2, 795);
      ctx.textAlign = "left";

      // Programación de Días y Turnos
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(35, 825, width - 70, 200);
      ctx.strokeStyle = "#e2e8f0";
      ctx.strokeRect(35, 825, width - 70, 200);

      ctx.fillStyle = "#0b2545";
      ctx.font = "900 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("CRONOGRAMA DE ASISTENCIA Y SALONES ASIGNADOS", 55, 855);

      let lineY = 885;
      if (participant.turnosDetallados && participant.turnosDetallados.length > 0) {
        participant.turnosDetallados.slice(0, 5).forEach((t) => {
          ctx.fillStyle = "#1e293b";
          ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          ctx.fillText(`• ${t.diaLabel}:`, 55, lineY);

          const turnosDesc: string[] = [];
          if (t.manana) turnosDesc.push(`Mañana (${t.manana})`);
          if (t.tarde) turnosDesc.push(`Tarde (${t.tarde})`);

          ctx.fillStyle = "#0d9488";
          ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          ctx.fillText(turnosDesc.join(" | "), 240, lineY);
          lineY += 24;
        });
      } else {
        ctx.fillStyle = "#64748b";
        ctx.font = "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(participant.turnosTexto || "Sin horarios registrados.", 55, lineY);
      }

      // Pie de Ficha con Validación Institucional
      ctx.fillStyle = "#64748b";
      ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        "Ficha Oficial expedida por el Comité Organizador del XIV Congreso Pineda 2026.",
        width / 2,
        1065
      );
      ctx.fillText(
        "Presenta este pase digital o impreso junto a tu Cédula de Identidad en el control de acceso de la sede.",
        width / 2,
        1085
      );
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px monospace";
      ctx.fillText(`Validado electrónicamente · Emisión: ${new Date().toLocaleDateString("es-VE")}`, width / 2, 1105);

      // Descargar como imagen PNG
      const link = document.createElement("a");
      link.download = `Ficha_Congreso_Pineda_${participant.id}_${participant.cedula.replace(/\D/g, "")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Error al generar imagen de la ficha:", err);
      alert("No se pudo generar la imagen descargable. Puedes usar el botón de 'Imprimir / Guardar en PDF'.");
    } finally {
      setGeneratingDownload(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-clinic-50/50 via-white to-slate-50 flex flex-col justify-between">
      {/* ─────────────────── BARRA SUPERIOR CON UN SOLO BOTÓN ─────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 sm:px-8 shadow-xs print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group" title="Ir a la página principal">
            <Image
              src="/images/logo-congreso-pineda.png"
              alt="Congreso Pineda 2026 · HCUAMP"
              width={180}
              height={50}
              className="h-8 sm:h-9 w-auto object-contain transition group-hover:opacity-90"
              priority
            />
          </Link>

          {/* Único botón en la parte superior requerido por el usuario */}
          <a
            href="https://congresopineda.vercel.app/#inscripciones"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-700 to-clinic-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-brand-500/20 hover:brightness-110 transition shrink-0"
          >
            Inscripciones
          </a>
        </div>
      </header>

      {/* ─────────────────── CONTENIDO PRINCIPAL ─────────────────── */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Encabezado de la Sección de Consulta (oculto al imprimir) */}
        <div className="text-center space-y-3 print:hidden">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200">
            <Sparkles className="size-3.5" /> Portal de Consulta Oficial
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-ink tracking-tight">
            Consulta de Personas Inscritas
          </h1>
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-ink-soft leading-relaxed">
            Ingresa tu número de cédula de identidad, código de comprobante (CP26-XXXX) o correo electrónico para obtener tu <b>ficha oficial de participante</b> con tu código QR de acceso descargable.
          </p>
        </div>

        {/* Formulario de Búsqueda (oculto al imprimir) */}
        <div className="print:hidden">
          <form
            onSubmit={handleSubmit}
            className="max-w-2xl mx-auto rounded-3xl bg-white p-3 sm:p-4 shadow-lg shadow-slate-200/50 border border-slate-200 ring-4 ring-brand-500/5"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ej: 31930086, V-12345678, CP26-0001 o correo..."
                  className="w-full rounded-2xl bg-slate-50/80 py-3 pl-11 pr-4 text-sm font-medium text-ink placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !searchQuery.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm px-6 py-3 shadow-md shadow-brand-500/25 transition cursor-pointer shrink-0"
              >
                {loading ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" /> Buscando...
                  </>
                ) : (
                  <>
                    <Search className="size-4" /> Consultar Ficha
                  </>
                )}
              </button>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 px-2 text-[11px] text-ink-mute">
              <span>✓ Cédula venezolana o extranjera</span>
              <span>✓ Código de inscripción CP26</span>
              <span>✓ Correo institucional o personal</span>
            </div>
          </form>
        </div>

        {/* Mensaje de Error (oculto al imprimir) */}
        {error && (
          <div className="max-w-2xl mx-auto rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs sm:text-sm text-rose-800 flex items-start gap-3 animate-in fade-in print:hidden">
            <AlertCircle className="size-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="font-bold">No se pudo localizar el registro</p>
              <p className="leading-relaxed text-rose-700">{error}</p>
            </div>
          </div>
        )}

        {/* ─────────────────── FICHA DEL PARTICIPANTE (VISIBLE Y DESCARGABLE) ─────────────────── */}
        {participant && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Banner de Verificación Éxito (oculto al imprimir) */}
            <div className="max-w-2xl mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between gap-3 text-emerald-900 print:hidden">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                <span className="text-xs sm:text-sm font-bold">
                  Inscripción confirmada formalmente en el sistema
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-300 text-emerald-800">
                {participant.id}
              </span>
            </div>

            {/* Tarjeta / Ficha Oficial del Participante */}
            <div
              ref={cardRef}
              id="ficha-credencial"
              className="mx-auto max-w-xl overflow-hidden rounded-3xl border-2 border-brand-200/90 bg-white shadow-2xl ring-1 ring-slate-100 text-left print:border-none print:shadow-none print:p-0"
            >
              {/* Encabezado de la Ficha */}
              <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-clinic-800 p-5 sm:p-6 text-white relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="inline-block text-[10px] font-black uppercase tracking-widest text-clinic-300">
                      Credencial Oficial de Participante
                    </span>
                    <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white leading-tight">
                      XIV CONGRESO PINEDA 2026
                    </h2>
                    <p className="text-xs text-white/80">
                      Hospital Central Universitario Dr. Antonio María Pineda
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                        participant.exonerated
                          ? "bg-clinic-400 text-brand-950 shadow-xs"
                          : "bg-amber-300 text-amber-950 shadow-xs"
                      }`}
                    >
                      {participant.exonerated ? "Exonerado 100%" : participant.estado || "Participante"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cuerpo de la Ficha */}
              <div className="p-5 sm:p-6 space-y-6">
                {/* Datos Personales y de Identificación */}
                <div className="grid gap-4 sm:grid-cols-2 border-b border-slate-100 pb-5">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-mute flex items-center gap-1">
                      <User className="size-3 text-slate-400" /> Nombres y Apellidos
                    </span>
                    <p className="text-base sm:text-lg font-black text-ink leading-snug">
                      {participant.nombres} {participant.apellidos}
                    </p>
                    <p className="text-xs font-mono font-bold text-brand-700">
                      C.I.: {participant.cedula}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-mute flex items-center gap-1">
                      <Building2 className="size-3 text-slate-400" /> Institución & Categoría
                    </span>
                    <p className="text-xs font-bold text-ink leading-tight line-clamp-2">
                      {participant.institucion}
                    </p>
                    <span className="inline-block mt-1 rounded-md bg-clinic-50 border border-clinic-200 px-2 py-0.5 text-[11px] font-bold text-clinic-800">
                      {participant.tipoLabel || participant.tipo}
                    </span>
                  </div>

                  {participant.detalleExtra && (
                    <div className="sm:col-span-2 rounded-xl bg-brand-50/70 p-3 text-xs text-brand-950 ring-1 ring-brand-200">
                      <span className="font-bold">Especialidad / Detalle:</span> {participant.detalleExtra}
                    </div>
                  )}

                  {participant.correo && (
                    <div className="text-xs text-ink-soft flex items-center gap-1.5 truncate">
                      <Mail className="size-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{participant.correo}</span>
                    </div>
                  )}

                  {participant.telefono && (
                    <div className="text-xs text-ink-soft flex items-center gap-1.5">
                      <Phone className="size-3.5 text-slate-400 shrink-0" />
                      <span>{participant.telefono}</span>
                    </div>
                  )}
                </div>

                {/* Código QR Central de Control de Acceso */}
                <div className="flex flex-col items-center justify-center text-center py-2">
                  <div className="relative rounded-2xl bg-white p-3.5 shadow-md ring-2 ring-brand-500/20">
                    {qrCodeUrl ? (
                      <img
                        src={qrCodeUrl}
                        alt={`Código QR de acceso para ${participant.nombres} ${participant.apellidos} (${participant.id})`}
                        className="size-48 sm:size-56 object-contain mx-auto"
                      />
                    ) : (
                      <div className="flex size-48 sm:size-56 items-center justify-center">
                        <RefreshCw className="size-8 animate-spin text-brand-600" />
                      </div>
                    )}
                  </div>

                  <div className="mt-3.5 space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-mute">
                      Código Oficial de Acceso
                    </span>
                    <div className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-brand-700">
                      {participant.id}
                    </div>
                  </div>

                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-clinic-50 px-3.5 py-1 text-xs font-bold text-clinic-800 ring-1 ring-clinic-200">
                    <Check className="size-3.5 text-clinic-600" strokeWidth={3} />
                    Válido para Acceso a Salones
                  </div>
                </div>

                {/* Cronograma de Turnos y Salones */}
                <div className="rounded-2xl bg-slate-50/90 p-4 ring-1 ring-slate-200/80 space-y-2.5">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold text-ink uppercase tracking-wider">
                    <Calendar className="size-4 text-brand-600" /> Días y Salones Programados
                  </h3>

                  <div className="space-y-1.5">
                    {participant.turnosDetallados && participant.turnosDetallados.length > 0 ? (
                      participant.turnosDetallados.map((t) => (
                        <div
                          key={t.diaId}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs py-1.5 border-b border-slate-200/60 last:border-none"
                        >
                          <span className="font-bold text-ink">{t.diaLabel}</span>
                          <div className="flex flex-wrap gap-1.5">
                            {t.manana && (
                              <span className="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-brand-800 ring-1 ring-brand-200">
                                Mañana: {t.manana}
                              </span>
                            )}
                            {t.tarde && (
                              <span className="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-clinic-800 ring-1 ring-clinic-200">
                                Tarde: {t.tarde}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-ink-soft">
                        {participant.turnosTexto || "Sin asignación de turno registrada."}
                      </p>
                    )}
                  </div>
                </div>

                {/* Sede del Congreso */}
                <div className="flex items-center justify-center gap-1.5 text-center text-xs text-ink-soft pt-1">
                  <MapPin className="size-3.5 text-brand-600 shrink-0" />
                  <span>Hotel Biotel Suites · Barquisimeto, Estado Lara</span>
                </div>
              </div>
            </div>

            {/* ─────────────────── BOTONES DE ACCIÓN (DESCARGAR E IMPRIMIR) ─────────────────── */}
            <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 print:hidden">
              {/* Botón Principal: Descargar Ficha en Imagen PNG */}
              <button
                type="button"
                onClick={handleDownloadFicha}
                disabled={generatingDownload || !qrCodeUrl}
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 via-brand-700 to-clinic-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-brand-500/25 transition hover:brightness-110 disabled:opacity-50 cursor-pointer"
              >
                {generatingDownload ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" /> Generando Ficha...
                  </>
                ) : (
                  <>
                    <Download className="size-4" /> Descargar Ficha (PNG)
                  </>
                )}
              </button>

              {/* Botón Secundario: Imprimir o Guardar como PDF */}
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs sm:text-sm font-bold text-ink-soft shadow-sm hover:bg-slate-50 transition cursor-pointer"
                title="Imprimir o guardar la credencial en PDF"
              >
                <Printer className="size-4 text-slate-600" /> Imprimir / PDF
              </button>

              {/* Botón Terciario: Descargar Solo QR */}
              {qrCodeUrl && (
                <a
                  href={qrCodeUrl}
                  download={`QR_Acceso_${participant.id}_${participant.cedula.replace(/\D/g, "")}.png`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-3 text-xs sm:text-sm font-semibold text-ink-soft transition"
                  title="Descargar únicamente el archivo de imagen del código QR"
                >
                  <QrCode className="size-4" /> Solo QR
                </a>
              )}
            </div>

            {/* Botón para Realizar Otra Consulta */}
            <div className="text-center pt-2 print:hidden">
              <button
                type="button"
                onClick={() => {
                  setParticipant(null);
                  setError(null);
                  setSearchQuery("");
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                className="text-xs font-bold text-brand-600 hover:text-brand-800 underline transition cursor-pointer"
              >
                ← Consultar otra persona o cédula
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ─────────────────── PIE DE PÁGINA (oculto al imprimir) ─────────────────── */}
      <footer className="mt-12 border-t border-slate-200/80 bg-white/80 py-6 text-center text-xs text-ink-mute print:hidden">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 XIV Congreso Pineda · Hospital Central Universitario Dr. Antonio María Pineda</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-brand-700 transition">
              Inicio
            </Link>
            <a href="https://congresopineda.vercel.app/#inscripciones" className="hover:text-brand-700 transition">
              Inscripciones
            </a>
            <Link href="/confirmacion-bachilleres" className="hover:text-brand-700 transition">
              Bachilleres
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ConsultaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-clinic-50">
          <div className="flex items-center gap-2 text-ink-soft text-sm font-bold">
            <RefreshCw className="size-5 animate-spin text-brand-600" />
            Cargando portal de consulta...
          </div>
        </div>
      }
    >
      <ConsultaContent />
    </Suspense>
  );
}
