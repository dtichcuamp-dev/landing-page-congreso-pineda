"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  Hospital,
  Loader2,
  Mail,
  MapPin,
  Printer,
  QrCode,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import {
  CAPACIDADES_SALON,
  DAYS_CONGRESO,
  ESPECIALIDADES_CONGRESO,
  PARTICIPANT_BY_ID,
  PARTICIPANT_TYPES_HCUAMP,
  PARTICIPANT_TYPES_OTRA,
  calcTotal,
  usd,
} from "@/data/pricing";
import {
  ApiError,
  checkExistingRegistration,
  getCapacities,
  lookupHcuamp,
  submitRegistration,
  type ExistingRegistrationInfo,
} from "@/lib/api";
import { cleanCedula, validateStep } from "@/lib/validation";
import {
  EMPTY_VALUES,
  type FieldErrors,
  type InstitucionOrigen,
  type ParticipantTypeId,
  type RegistrationResult,
  type RegistrationValues,
} from "@/types/registration";
import { Field, inputClass } from "./Field";
import { FileDrop } from "./FileDrop";
import { PaymentDetails } from "./PaymentDetails";
import { PriceSummary } from "./PriceSummary";
import { TurnosSalonPicker } from "./TurnosSalonPicker";

export function RegistrationForm() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<RegistrationValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [searchingHcuamp, setSearchingHcuamp] = useState(false);
  const [hcuampFeedback, setHcuampFeedback] = useState<{
    status: "idle" | "found" | "not_found" | "error";
    message?: string;
  }>({ status: "idle" });
  const [capacities, setCapacities] = useState<Record<string, number>>({});
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState<ExistingRegistrationInfo | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // Cargar disponibilidad de aforo al montar
  useEffect(() => {
    getCapacities().then((data) => setCapacities(data)).catch(() => {});
  }, []);

  // Generar código QR cuando se confirme la inscripción
  useEffect(() => {
    if (result?.id) {
      setGeneratingQr(true);
      QRCode.toDataURL(result.id, {
        width: 440,
        margin: 2,
        color: {
          dark: "#0b2545",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      })
        .then((url) => {
          setQrCodeUrl(url);
        })
        .catch((err) => {
          console.error("Error al generar código QR:", err);
        })
        .finally(() => {
          setGeneratingQr(false);
        });
    } else {
      setQrCodeUrl(null);
    }
  }, [result]);

  const set = <K extends keyof RegistrationValues>(key: K, value: RegistrationValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
    if (key === "cedula" || key === "correo") setAlreadyRegistered(null);
  };

  const handleOrigenChange = (origen: InstitucionOrigen) => {
    setValues((prev) => ({
      ...prev,
      origenInstitucion: origen,
      institucion:
        origen === "HCUAMP"
          ? "HOSPITAL CENTRAL UNIVERSITARIO DR. ANTONIO MARÍA PINEDA (HCUAMP)"
          : "",
      tipoParticipante: "",
      nombrePonencia: "",
      especialidad: "",
    }));
    setHcuampFeedback({ status: "idle" });
    setAlreadyRegistered(null);
    setErrors({});
  };

  const checkCedulaDuplicate = async (rawCed: string) => {
    const cleaned = cleanCedula(rawCed);
    if (!cleaned || cleaned.length < 5) return;
    try {
      const dup = await checkExistingRegistration(cleaned, values.correo);
      if (dup.registered) {
        setAlreadyRegistered(dup);
        setErrors((e) => ({
          ...e,
          cedula: `Esta cédula ya está registrada en el Congreso (Comprobante ${dup.id}). No se permiten inscripciones duplicadas para no quitar cupo a otros participantes.`,
        }));
      }
    } catch (_) {}
  };

  const handleLookupHcuamp = async () => {
    const rawCed = cleanCedula(values.cedula);
    if (!rawCed || rawCed.length < 5) {
      setErrors((e) => ({ ...e, cedula: "Ingresa un número de cédula válido para buscar (5 a 9 dígitos)." }));
      return;
    }

    setSearchingHcuamp(true);
    setHcuampFeedback({ status: "idle" });
    setAlreadyRegistered(null);
    try {
      // 1. Verificar primero si este participante ya se encuentra registrado
      const dup = await checkExistingRegistration(rawCed, values.correo);
      if (dup.registered) {
        setAlreadyRegistered(dup);
        setErrors((e) => ({
          ...e,
          cedula: `Esta persona ya se encuentra registrada en el Congreso (Comprobante ${dup.id}). No se permiten registros duplicados.`,
        }));
        return;
      }

      // 2. Si no está registrado, buscar en nómina HCUAMP
      const res = await lookupHcuamp(rawCed);
      if (res.found && res.data) {
        setValues((v) => ({
          ...v,
          nombres: (res.data?.nombres || v.nombres).toUpperCase(),
          apellidos: (res.data?.apellidos || v.apellidos).toUpperCase(),
          sexo: (res.data?.sexo as "M" | "F") || v.sexo,
          fechaNacimiento: res.data?.fechaNacimiento || v.fechaNacimiento,
          telefono: res.data?.telefono || v.telefono,
        }));
        setHcuampFeedback({
          status: "found",
          message: "✓ Datos encontrados y cargados desde la nómina HCUAMP. Puedes editarlos si lo requieres.",
        });
      } else {
        setHcuampFeedback({
          status: "not_found",
          message: "Cédula no encontrada en nómina activa. Puedes completar tus datos manualmente.",
        });
      }
    } catch {
      setHcuampFeedback({
        status: "error",
        message: "No se pudo consultar la nómina en este momento. Completa tus datos manualmente.",
      });
    } finally {
      setSearchingHcuamp(false);
    }
  };

  const isHcuamp = values.origenInstitucion === "HCUAMP";
  const selectedTypeInfo = values.tipoParticipante ? PARTICIPANT_BY_ID[values.tipoParticipante] : null;
  const isExoneratedType = isHcuamp || (selectedTypeInfo ? selectedTypeInfo.rate === 0 : false);
  const maxSteps = isExoneratedType ? 2 : 3;

  const stepsList = isExoneratedType
    ? [
        { title: "Tus datos", icon: UserRound },
        { title: "Participación y Registro", icon: Stethoscope },
      ]
    : [
        { title: "Tus datos", icon: UserRound },
        { title: "Participación", icon: Stethoscope },
        { title: "Pago", icon: CreditCard },
      ];

  const goTo = (n: number) => {
    setStep(n);
    setServerError(null);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const next = async () => {
    const e = validateStep(step, values);

    // ── Paso 0: Verificación estricta de Participante Único (Anti-Duplicados) ──
    if (step === 0 && Object.keys(e).length === 0) {
      setCheckingDuplicate(true);
      try {
        const dup = await checkExistingRegistration(values.cedula, values.correo);
        if (dup.registered) {
          setCheckingDuplicate(false);
          setAlreadyRegistered(dup);
          setErrors({
            ...e,
            cedula: `Esta persona ya se encuentra registrada en el Congreso (ID: ${dup.id}). No se permite duplicar registros para garantizar el cupo a otros participantes.`,
          });
          return;
        }
      } catch (err) {
        console.warn("Error verificando participante único:", err);
      } finally {
        setCheckingDuplicate(false);
      }
    }

    // ── Paso 1: Verificación estricta de Aforo en Tiempo Real ──
    if (step === 1 && Object.keys(e).length === 0) {
      // Verificación estricta de aforo en tiempo real para evitar depósitos bancarios errados
      for (const [diaId, t] of Object.entries(values.turnos)) {
        if (t.manana) {
          const key = `${diaId}_manana_${t.manana}`;
          const occ = capacities[key] || 0;
          const cap = CAPACIDADES_SALON[t.manana];
          if (occ >= cap) {
            const diaMeta = DAYS_CONGRESO.find((d) => d.id === diaId);
            const salonName = t.manana === "principal" ? "Salón Principal (1)" : "Salón Alterno (2)";
            setErrors({
              ...e,
              turnos: `El ${salonName} para el turno Mañana del ${diaMeta?.dateLabel || diaId} ha alcanzado su cupo máximo (0 libres). NO realices depósitos para este turno. Por favor selecciona otro salón o turno con disponibilidad.`,
            });
            return;
          }
        }
        if (t.tarde) {
          const key = `${diaId}_tarde_${t.tarde}`;
          const occ = capacities[key] || 0;
          const cap = CAPACIDADES_SALON[t.tarde];
          if (occ >= cap) {
            const diaMeta = DAYS_CONGRESO.find((d) => d.id === diaId);
            const salonName = t.tarde === "principal" ? "Salón Principal (1)" : "Salón Alterno (2)";
            setErrors({
              ...e,
              turnos: `El ${salonName} para el turno Tarde del ${diaMeta?.dateLabel || diaId} ha alcanzado su cupo máximo (0 libres). NO realices depósitos para este turno. Por favor selecciona otro salón o turno con disponibilidad.`,
            });
            return;
          }
        }
      }
    }

    setErrors(e);
    if (Object.keys(e).length === 0) {
      goTo(step + 1);
    }
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();

    // Si aún no estamos en el paso final, avanzamos
    if (step < maxSteps - 1) {
      return next();
    }

    // Validar todos los pasos pertinentes
    for (let s = 0; s < maxSteps; s++) {
      const e = validateStep(s, values);
      if (Object.keys(e).length > 0) {
        setErrors(e);
        goTo(s);
        return;
      }
    }

    // Verificación final de aforo antes del envío
    for (const [diaId, t] of Object.entries(values.turnos)) {
      if (t.manana && (capacities[`${diaId}_manana_${t.manana}`] || 0) >= CAPACIDADES_SALON[t.manana]) {
        const diaMeta = DAYS_CONGRESO.find((d) => d.id === diaId);
        setServerError(`El Salón ${t.manana === "principal" ? "Principal (1)" : "Alterno (2)"} para el turno Mañana del ${diaMeta?.dateLabel || diaId} se encuentra agotado. No realices transferencias para este horario.`);
        goTo(1);
        return;
      }
      if (t.tarde && (capacities[`${diaId}_tarde_${t.tarde}`] || 0) >= CAPACIDADES_SALON[t.tarde]) {
        const diaMeta = DAYS_CONGRESO.find((d) => d.id === diaId);
        setServerError(`El Salón ${t.tarde === "principal" ? "Principal (1)" : "Alterno (2)"} para el turno Tarde del ${diaMeta?.dateLabel || diaId} se encuentra agotado. No realices transferencias para este horario.`);
        goTo(1);
        return;
      }
    }

    // Verificación final de participante único antes del envío
    const dupFinal = await checkExistingRegistration(values.cedula, values.correo);
    if (dupFinal.registered) {
      setAlreadyRegistered(dupFinal);
      setServerError(
        `Esta persona ya se encuentra registrada en el Congreso (Comprobante ID: ${dupFinal.id}). No se permite duplicar registros para garantizar el cupo a otros participantes.`
      );
      goTo(0);
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      const upperValues: RegistrationValues = {
        ...values,
        institucion: (
          values.origenInstitucion === "HCUAMP"
            ? "HOSPITAL CENTRAL UNIVERSITARIO DR. ANTONIO MARÍA PINEDA (HCUAMP)"
            : values.institucion.trim()
        ).toUpperCase(),
        nombres: values.nombres.trim().toUpperCase(),
        apellidos: values.apellidos.trim().toUpperCase(),
        pais: (values.pais.trim() || "VENEZUELA").toUpperCase(),
        estado: (values.estado.trim() || "LARA").toUpperCase(),
        municipio: (values.municipio.trim() || "IRIBARREN").toUpperCase(),
        parroquia: (values.parroquia.trim() || "CONCEPCIÓN").toUpperCase(),
        nombrePonencia: values.nombrePonencia ? values.nombrePonencia.trim().toUpperCase() : "",
        especialidad: values.especialidad ? values.especialidad.trim().toUpperCase() : "",
      };
      setValues(upperValues);
      const res = await submitRegistration(upperValues);
      setResult(res);
      requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : (err?.message || "Ocurrió un error inesperado al procesar la inscripción.");
      if (
        msg.includes("ya se encuentra registrado") ||
        msg.includes("ya se encuentra formalmente registrado") ||
        msg.includes("ya fue registrada")
      ) {
        setAlreadyRegistered({
          registered: true,
          cedula: values.cedula,
          correo: values.correo,
          message: msg,
        });
        goTo(0);
      }
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setValues(EMPTY_VALUES);
    setErrors({});
    setResult(null);
    setQrCodeUrl(null);
    setHcuampFeedback({ status: "idle" });
    setStep(0);
  };

  const { total, exonerated } = calcTotal(values.tipoParticipante, values.turnos, values.origenInstitucion);

  /* ───────── Pantalla de confirmación con Código QR y Credencial Digital ───────── */
  if (result) {
    const activeDays = DAYS_CONGRESO.filter(
      (d) => values.turnos[d.id]?.manana || values.turnos[d.id]?.tarde,
    );
    const tipoLabel = (
      PARTICIPANT_BY_ID[values.tipoParticipante as ParticipantTypeId]?.label ||
      values.tipoParticipante
    ).toUpperCase();

    return (
      <div ref={topRef} className="py-4 space-y-6 text-center" role="status">
        {/* Encabezado de éxito */}
        <div>
          <span className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-clinic-100 text-clinic-600 shadow-md ring-8 ring-clinic-50">
            <CheckCircle2 className="size-9" aria-hidden />
          </span>
          <h3 className="mt-4 text-2xl font-black text-ink sm:text-3xl">
            ¡Inscripción Exitosa!
          </h3>
          <p className="mt-1 text-sm text-ink-soft">
            Tu pase digital de acceso y código QR para los salones han sido generados exitosamente.
          </p>
        </div>

        {/* ──────── CREDENCIAL DIGITAL DE ACCESO ──────── */}
        <div
          id="credencial-pase"
          className="mx-auto max-w-lg overflow-hidden rounded-3xl border-2 border-brand-200/90 bg-white shadow-xl ring-1 ring-slate-100 text-left"
        >
          {/* Header de la Credencial */}
          <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-clinic-800 p-5 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-clinic-300">
                  Pase Oficial de Acceso
                </span>
                <h4 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                  XIV CONGRESO PINEDA 2026
                </h4>
                <p className="text-[11px] text-white/80">
                  Hospital Central Universitario Dr. Antonio María Pineda
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                    result.exonerated
                      ? "bg-clinic-400 text-brand-950"
                      : "bg-amber-300 text-amber-950"
                  }`}
                >
                  {result.exonerated ? "Exonerado 100%" : "Participante"}
                </span>
              </div>
            </div>
          </div>

          {/* Cuerpo de la Credencial */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* Datos del Participante */}
            <div className="grid gap-3 sm:grid-cols-2 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-mute">
                  Participante
                </span>
                <p className="text-base font-bold text-ink leading-tight">
                  {values.nombres} {values.apellidos}
                </p>
                <p className="text-xs font-mono font-medium text-ink-soft">
                  C.I.: {values.nacionalidad}-{values.cedula}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-mute">
                  Institución & Categoría
                </span>
                <p className="text-xs font-bold text-ink leading-tight line-clamp-2">
                  {values.institucion || (values.origenInstitucion === "HCUAMP" ? "HCUAMP" : "Otra Institución")}
                </p>
                <span className="inline-block mt-0.5 text-[11px] font-semibold text-brand-700">
                  {tipoLabel}
                </span>
              </div>
              {values.nombrePonencia && (
                <div className="sm:col-span-2 rounded-xl bg-brand-50/70 p-2.5 text-xs text-brand-950 ring-1 ring-brand-200">
                  <span className="font-bold">Ponencia:</span> {values.nombrePonencia}
                </div>
              )}
              {values.especialidad && (
                <div className="sm:col-span-2 rounded-xl bg-clinic-50/70 p-2.5 text-xs text-clinic-950 ring-1 ring-clinic-200">
                  <span className="font-bold">Especialidad:</span> {values.especialidad}
                </div>
              )}
            </div>

            {/* Código QR Central para Control de Acceso */}
            <div className="flex flex-col items-center justify-center text-center py-1">
              <div className="relative rounded-2xl bg-white p-3 shadow-md ring-2 ring-brand-500/20">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt={`Código QR de acceso para ${values.nombres} ${values.apellidos} (${result.id})`}
                    className="size-48 sm:size-56 object-contain mx-auto"
                  />
                ) : (
                  <div className="flex size-48 sm:size-56 items-center justify-center">
                    <Loader2 className="size-8 animate-spin text-brand-600" />
                  </div>
                )}
              </div>

              <div className="mt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-mute">
                  Código de Identificación
                </span>
                <div className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-brand-700">
                  {result.id}
                </div>
              </div>

              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-clinic-50 px-3 py-1 text-xs font-bold text-clinic-700 ring-1 ring-clinic-200">
                <Check className="size-3.5" strokeWidth={3} />
                Acceso a Salón Principal (1) y Salón Alterno (2)
              </div>
            </div>

            {/* Turnos y Salones asignados */}
            <div className="rounded-2xl bg-slate-50/90 p-3.5 ring-1 ring-slate-200/80">
              <h5 className="flex items-center gap-1.5 text-[11px] font-bold text-ink uppercase tracking-wider mb-2">
                <Calendar className="size-3.5 text-brand-600" /> Días y Salones Programados
              </h5>
              <div className="space-y-1.5">
                {activeDays.length > 0 ? (
                  activeDays.map((d) => {
                    const t = values.turnos[d.id];
                    return (
                      <div
                        key={d.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs py-1 border-b border-slate-200/50 last:border-none"
                      >
                        <span className="font-bold text-ink">{d.dateLabel}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {t?.manana && (
                            <span className="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-brand-800 ring-1 ring-brand-200">
                              Mañana: {t.manana === "principal" ? "Salón Principal (1)" : "Salón Alterno (2)"}
                            </span>
                          )}
                          {t?.tarde && (
                            <span className="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-clinic-800 ring-1 ring-clinic-200">
                              Tarde: {t.tarde === "principal" ? "Salón Principal (1)" : "Salón Alterno (2)"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-ink-muted">Sin turnos registrados.</p>
                )}
              </div>
            </div>

            {/* Sede del evento */}
            <div className="flex items-center justify-center gap-1.5 text-center text-xs text-ink-soft pt-1">
              <MapPin className="size-3.5 text-brand-600 shrink-0" />
              <span>Hotel Biotel Suites · Barquisimeto, Estado Lara</span>
            </div>
          </div>
        </div>

        {/* ──────── NOTIFICACIÓN DE ENVÍO POR CORREO ──────── */}
        <div className="mx-auto max-w-lg rounded-2xl bg-brand-50/80 p-4 text-left ring-1 ring-brand-200">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <Mail className="size-5" />
            </span>
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-brand-950 uppercase tracking-wide">
                Remitido a tu correo electrónico
              </h5>
              <p className="text-xs text-brand-900 leading-relaxed">
                Hemos enviado automáticamente tu constancia de inscripción oficial y este <b>Código QR de acceso</b> a{" "}
                <span className="font-bold underline">{values.correo}</span>.
              </p>
              <p className="text-[11px] text-brand-800">
                {result.exonerated
                  ? values.origenInstitucion === "HCUAMP"
                    ? "Como personal del HCUAMP, tu participación está 100% exonerada."
                    : "Como bachiller / estudiante de pregrado, tu participación está 100% exonerada (0$)."
                  : `Inscripción por un monto de ${usd(result.total)}. Conserva el correo con tu código QR para el control de acceso en la sede.`}
              </p>
            </div>
          </div>
        </div>

        {/* ──────── BOTONES DE ACCIÓN ──────── */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {qrCodeUrl && (
            <a
              href={qrCodeUrl}
              download={`Pase_Acceso_Congreso_${result.id}_${values.cedula}.png`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-clinic-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-brand-500/25 transition hover:brightness-110"
            >
              <Download className="size-4" /> Descargar Código QR (PNG)
            </a>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-ink-soft shadow-sm hover:bg-slate-50 transition"
          >
            <Printer className="size-4" /> Imprimir Credencial
          </button>

          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 text-xs sm:text-sm font-semibold text-ink-soft transition hover:bg-slate-200"
          >
            Registrar a otra persona
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate aria-label="Formulario de inscripción al congreso">
      <div ref={topRef} className="scroll-mt-28" />

      {/* Indicador de pasos */}
      <ol className="mb-8 flex items-center" aria-label="Progreso de inscripción">
        {stepsList.map((s, i) => {
          const done = i < step;
          const active = i === step;
          const Icon = s.icon;
          return (
            <li key={s.title} className="flex flex-1 items-center last:flex-none" aria-current={active ? "step" : undefined}>
              <span className="flex flex-col items-center gap-1.5">
                <span
                  className={`inline-flex size-10 items-center justify-center rounded-full text-sm font-bold transition ${
                    done
                      ? "bg-clinic-500 text-white"
                      : active
                        ? "bg-gradient-to-br from-brand-500 to-clinic-500 text-white shadow-lg shadow-brand-500/30"
                        : "bg-white/70 text-ink-mute ring-1 ring-brand-100"
                  }`}
                >
                  {done ? <Check className="size-5" strokeWidth={3} aria-hidden /> : <Icon className="size-5" aria-hidden />}
                </span>
                <span className={`text-xs font-semibold ${active ? "text-ink" : "text-ink-mute"}`}>{s.title}</span>
              </span>
              {i < stepsList.length - 1 && (
                <span className={`mx-2 mb-5 h-0.5 flex-1 rounded-full transition ${done ? "bg-clinic-500" : "bg-brand-100"}`} aria-hidden />
              )}
            </li>
          );
        })}
      </ol>

      {/* Honeypot anti-spam */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label>
          No completar
          <input type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set("website", e.target.value)} />
        </label>
      </div>

      {/* ─────────────────── PASO 1: DATOS PERSONALES Y DE ORIGEN ─────────────────── */}
      {step === 0 && (
        <div className="space-y-6">
          {/* Selección de Institución de Origen */}
          <div>
            <label className="mb-2 block text-sm font-bold text-ink">
              1. Institución de Origen<span className="ml-0.5 text-brand-500">*</span>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Opción HCUAMP */}
              <button
                type="button"
                onClick={() => handleOrigenChange("HCUAMP")}
                className={`relative flex flex-col items-start rounded-2xl p-4 text-left transition-all ${
                  isHcuamp
                    ? "bg-gradient-to-br from-brand-50 to-clinic-50 ring-2 ring-brand-500 shadow-sm"
                    : "bg-white/70 ring-1 ring-slate-200 hover:bg-white hover:ring-brand-200"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                    <Hospital className="size-5" />
                  </span>
                </div>
                <h4 className="mt-2.5 text-sm font-bold text-ink">
                  Hospital Central Universitario Dr. Antonio María Pineda
                </h4>
                <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                  Personal médico, asistencial, residentes, técnicos y trabajadores del HCUAMP.
                </p>
              </button>

              {/* Opción Otra Institución */}
              <button
                type="button"
                onClick={() => handleOrigenChange("OTRA")}
                className={`relative flex flex-col items-start rounded-2xl p-4 text-left transition-all ${
                  !isHcuamp
                    ? "bg-gradient-to-br from-brand-50 to-clinic-50 ring-2 ring-brand-500 shadow-sm"
                    : "bg-white/70 ring-1 ring-slate-200 hover:bg-white hover:ring-brand-200"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Building2 className="size-5" />
                  </span>
                </div>
                <h4 className="mt-2.5 text-sm font-bold text-ink">
                  Otra Institución
                </h4>
                <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                  Participantes, profesionales de la salud y acompañantes de otras instituciones.
                </p>
              </button>
            </div>
          </div>

          {/* Campo de Institución si es OTRA */}
          {!isHcuamp && (
            <Field id="institucion" label="Nombre de la Institución de Origen" error={errors.institucion} required>
              <input
                id="institucion"
                placeholder="Ej.: Hospital Militar / Clínica Razetti / Universidad UCLA"
                className={`${inputClass(!!errors.institucion)} uppercase`}
                value={values.institucion}
                onChange={(e) => set("institucion", e.target.value.toUpperCase())}
                aria-invalid={!!errors.institucion}
              />
            </Field>
          )}

          {/* Búsqueda por cédula para HCUAMP */}
          {isHcuamp && (
            <div className="rounded-2xl bg-brand-50/70 p-4 ring-1 ring-brand-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="size-3.5 text-brand-600" />
                  Consulta en Nómina Personal HCUAMP
                </span>
                <span className="text-[11px] text-brand-700">Trae tus datos registrados</span>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex gap-2 flex-1">
                  <select
                    aria-label="Nacionalidad"
                    className={`${inputClass(false)} !w-20 shrink-0`}
                    value={values.nacionalidad}
                    onChange={(e) => set("nacionalidad", e.target.value as "V" | "E")}
                  >
                    <option value="V">V</option>
                    <option value="E">E</option>
                  </select>
                  <input
                    id="cedula_lookup"
                    inputMode="numeric"
                    placeholder="Número de cédula (ej. 12345678)"
                    className={inputClass(!!errors.cedula)}
                    value={values.cedula}
                    onBlur={() => checkCedulaDuplicate(values.cedula)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleLookupHcuamp();
                      }
                    }}
                    onChange={(e) => {
                      set("cedula", e.target.value.replace(/[^\d.]/g, ""));
                      setHcuampFeedback({ status: "idle" });
                    }}
                  />
                </div>
                <button
                  type="button"
                  disabled={searchingHcuamp || checkingDuplicate}
                  onClick={handleLookupHcuamp}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
                >
                  {searchingHcuamp ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Consultando…
                    </>
                  ) : (
                    <>
                      <Search className="size-3.5" />
                      Buscar en nómina
                    </>
                  )}
                </button>
              </div>

              {errors.cedula && (
                <p className="text-xs font-medium text-red-600">{errors.cedula}</p>
              )}

              {alreadyRegistered && (
                <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-950 border border-amber-300 flex items-start gap-2.5 animate-in fade-in">
                  <ShieldAlert className="size-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <p className="font-bold text-amber-900">
                      Participante ya registrado (Comprobante {alreadyRegistered.id}):
                    </p>
                    <p className="mt-0.5 text-amber-800">
                      Esta cédula ya tiene un registro activo. No se permiten inscripciones duplicadas para no quitarle el cupo a otra persona.
                    </p>
                  </div>
                </div>
              )}

              {hcuampFeedback.status === "found" && (
                <div className="rounded-xl bg-clinic-100/90 p-2.5 text-xs font-semibold text-clinic-800 ring-1 ring-clinic-200">
                  {hcuampFeedback.message}
                </div>
              )}
              {hcuampFeedback.status === "not_found" && (
                <div className="rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800 ring-1 ring-amber-200">
                  {hcuampFeedback.message}
                </div>
              )}
              {hcuampFeedback.status === "error" && (
                <div className="rounded-xl bg-red-50 p-2.5 text-xs text-red-700 ring-1 ring-red-200">
                  {hcuampFeedback.message}
                </div>
              )}
            </div>
          )}

          {/* Formulario de Datos Personales */}
          <div className="grid gap-4 sm:grid-cols-2">
            {!isHcuamp && (
              <Field id="cedula" label="Cédula de identidad" error={errors.cedula} required className="sm:col-span-2">
                <div className="flex gap-2">
                  <select
                    aria-label="Nacionalidad"
                    className={`${inputClass(false)} !w-20 shrink-0`}
                    value={values.nacionalidad}
                    onChange={(e) => set("nacionalidad", e.target.value as "V" | "E")}
                  >
                    <option value="V">V</option>
                    <option value="E">E</option>
                  </select>
                  <input
                    id="cedula"
                    inputMode="numeric"
                    placeholder="12345678"
                    className={inputClass(!!errors.cedula)}
                    value={values.cedula}
                    onBlur={() => checkCedulaDuplicate(values.cedula)}
                    onChange={(e) => set("cedula", e.target.value.replace(/[^\d.]/g, ""))}
                    aria-invalid={!!errors.cedula}
                  />
                </div>

                {alreadyRegistered && (
                  <div className="mt-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-950 border border-amber-300 flex items-start gap-2.5 animate-in fade-in">
                    <ShieldAlert className="size-4 shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <p className="font-bold text-amber-900">
                        Participante ya registrado (Comprobante {alreadyRegistered.id}):
                      </p>
                      <p className="mt-0.5 text-amber-800">
                        Esta cédula ya tiene un registro activo. No se permiten inscripciones duplicadas para no quitarle el cupo a otra persona.
                      </p>
                    </div>
                  </div>
                )}
              </Field>
            )}

            <Field id="nombres" label="Nombres" error={errors.nombres} required>
              <input
                id="nombres"
                className={`${inputClass(!!errors.nombres)} uppercase`}
                autoComplete="given-name"
                value={values.nombres}
                onChange={(e) => set("nombres", e.target.value.toUpperCase())}
                aria-invalid={!!errors.nombres}
              />
            </Field>

            <Field id="apellidos" label="Apellidos" error={errors.apellidos} required>
              <input
                id="apellidos"
                className={`${inputClass(!!errors.apellidos)} uppercase`}
                autoComplete="family-name"
                value={values.apellidos}
                onChange={(e) => set("apellidos", e.target.value.toUpperCase())}
                aria-invalid={!!errors.apellidos}
              />
            </Field>

            <Field id="sexo" label="Sexo" error={errors.sexo} required>
              <select
                id="sexo"
                className={inputClass(!!errors.sexo)}
                value={values.sexo}
                onChange={(e) => set("sexo", e.target.value as "M" | "F" | "")}
                aria-invalid={!!errors.sexo}
              >
                <option value="">Selecciona...</option>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
              </select>
            </Field>

            <Field id="fechaNacimiento" label="Fecha de Nacimiento" error={errors.fechaNacimiento} required>
              <input
                id="fechaNacimiento"
                type="date"
                className={inputClass(!!errors.fechaNacimiento)}
                value={values.fechaNacimiento}
                onChange={(e) => set("fechaNacimiento", e.target.value)}
                aria-invalid={!!errors.fechaNacimiento}
              />
            </Field>

            <Field id="telefono" label="Número telefónico" error={errors.telefono} hint="WhatsApp preferiblemente" required>
              <input
                id="telefono"
                type="tel"
                inputMode="tel"
                placeholder="0414-1234567"
                className={inputClass(!!errors.telefono)}
                value={values.telefono}
                onChange={(e) => set("telefono", e.target.value)}
                aria-invalid={!!errors.telefono}
              />
            </Field>

            <Field id="correo" label="Correo electrónico" error={errors.correo} required>
              <input
                id="correo"
                type="email"
                inputMode="email"
                placeholder="nombre@correo.com"
                className={inputClass(!!errors.correo)}
                value={values.correo}
                onChange={(e) => set("correo", e.target.value)}
                aria-invalid={!!errors.correo}
              />
            </Field>

            <Field id="pais" label="País" error={errors.pais} required>
              <input
                id="pais"
                className={`${inputClass(!!errors.pais)} uppercase`}
                value={values.pais}
                onChange={(e) => set("pais", e.target.value.toUpperCase())}
                aria-invalid={!!errors.pais}
              />
            </Field>

            <Field id="estado" label="Estado" error={errors.estado} required>
              <input
                id="estado"
                className={`${inputClass(!!errors.estado)} uppercase`}
                value={values.estado}
                onChange={(e) => set("estado", e.target.value.toUpperCase())}
                aria-invalid={!!errors.estado}
              />
            </Field>

            <Field id="municipio" label="Municipio" error={errors.municipio} required>
              <input
                id="municipio"
                className={`${inputClass(!!errors.municipio)} uppercase`}
                value={values.municipio}
                onChange={(e) => set("municipio", e.target.value.toUpperCase())}
                aria-invalid={!!errors.municipio}
              />
            </Field>

            <Field id="parroquia" label="Parroquia" error={errors.parroquia} required>
              <input
                id="parroquia"
                className={`${inputClass(!!errors.parroquia)} uppercase`}
                value={values.parroquia}
                onChange={(e) => set("parroquia", e.target.value.toUpperCase())}
                aria-invalid={!!errors.parroquia}
              />
            </Field>
          </div>
        </div>
      )}

      {/* ─────────────────── PASO 2: FORMAS DE PARTICIPACIÓN ─────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Tipo de participante */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="tipoParticipante"
              label="Tipo de Participante"
              error={errors.tipoParticipante}
              required
              className="sm:col-span-2"
            >
              <select
                id="tipoParticipante"
                className={inputClass(!!errors.tipoParticipante)}
                value={values.tipoParticipante}
                onChange={(e) => set("tipoParticipante", e.target.value as RegistrationValues["tipoParticipante"])}
                aria-invalid={!!errors.tipoParticipante}
              >
                <option value="">Selecciona tu categoría...</option>
                {isHcuamp
                  ? PARTICIPANT_TYPES_HCUAMP.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))
                  : PARTICIPANT_TYPES_OTRA.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label} — {p.rate === 0 ? "Exonerado 100% (0$)" : `${usd(p.rate)} por día`}
                      </option>
                    ))}
              </select>
            </Field>

            {/* Campo condicional para Conferencista */}
            {isHcuamp && values.tipoParticipante === "conferencista" && (
              <Field
                id="nombrePonencia"
                label="Nombre de su Ponencia"
                error={errors.nombrePonencia}
                required
                className="sm:col-span-2"
              >
                <input
                  id="nombrePonencia"
                  placeholder="Título completo de su ponencia académica"
                  className={`${inputClass(!!errors.nombrePonencia)} uppercase`}
                  value={values.nombrePonencia || ""}
                  onChange={(e) => set("nombrePonencia", e.target.value.toUpperCase())}
                  aria-invalid={!!errors.nombrePonencia}
                />
              </Field>
            )}

            {/* Campo condicional para Residente de último año */}
            {isHcuamp && values.tipoParticipante === "residente_ultimo_anio" && (
              <Field
                id="especialidad"
                label="Especialidad del Congreso"
                error={errors.especialidad}
                required
                className="sm:col-span-2"
              >
                <select
                  id="especialidad"
                  className={`${inputClass(!!errors.especialidad)} uppercase`}
                  value={values.especialidad || ""}
                  onChange={(e) => set("especialidad", e.target.value.toUpperCase())}
                  aria-invalid={!!errors.especialidad}
                >
                  <option value="">SELECCIONA LA ESPECIALIDAD MÉDICA...</option>
                  {ESPECIALIDADES_CONGRESO.map((esp) => (
                    <option key={esp} value={esp.toUpperCase()}>
                      {esp.toUpperCase()}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          {/* Selector interactivo de Días, Turnos y Salones */}
          <TurnosSalonPicker
            value={values.turnos}
            onChange={(t) => set("turnos", t)}
            capacities={capacities}
            error={errors.turnos as string | undefined}
          />

          {/* Resumen */}
          <PriceSummary
            tipo={values.tipoParticipante}
            turnos={values.turnos}
            origen={values.origenInstitucion}
          />

          {/* Si es exonerado (HCUAMP o Bachiller/Pregrado), el paso 2 incluye la aceptación de términos y finaliza */}
          {isExoneratedType ? (
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-200">
                <input
                  type="checkbox"
                  id="terminos_exonerado"
                  className="mt-1 h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
                  checked={values.aceptaTerminos}
                  onChange={(e) => set("aceptaTerminos", e.target.checked)}
                />
                <label htmlFor="terminos_exonerado" className="text-xs text-ink-soft leading-relaxed select-none">
                  He leído y acepto los{" "}
                  <a href="/terminos" target="_blank" className="font-bold text-brand-600 hover:underline">
                    Términos de Uso
                  </a>{" "}
                  y la{" "}
                  <a href="/privacidad" target="_blank" className="font-bold text-brand-600 hover:underline">
                    Política de Privacidad
                  </a>
                  , reconociendo que los datos ingresados son correctos y verificables, procediendo a negar la participación si existe falsedad en lo registrado.
                </label>
              </div>
              {errors.aceptaTerminos && (
                <p className="text-xs font-semibold text-red-600">{errors.aceptaTerminos}</p>
              )}
            </div>
          ) : (
            /* Para participantes con pago, nota informativa y avanza al paso 3 */
            <div className="rounded-xl bg-blue-50/70 p-3.5 text-xs text-blue-900 ring-1 ring-blue-200 leading-relaxed">
              <b>Nota:</b> La inscripción incluye acceso a las ponencias académicas de los salones elegidos, certificado digital con aval institucional (y de crédito académico) y kit del participante.
            </div>
          )}

          {serverError && (
            <div role="alert" className="flex items-start gap-2.5 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700 ring-1 ring-red-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {serverError}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────── PASO 3: PAGO (SOLO OTRA INSTITUCIÓN CON MONTO > 0) ─────────────────── */}
      {step === 2 && !isExoneratedType && (
        <div className="space-y-6">
          <PriceSummary
            tipo={values.tipoParticipante}
            turnos={values.turnos}
            origen={values.origenInstitucion}
          />

          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
            Una persona puede seleccionar 1 o 2 turnos de un día (mañana y/o tarde) y el pago por ese día será el mismo de acuerdo a su tipo de participante.
          </div>

          {/* Datos bancarios con botones de copia con 1 clic */}
          <PaymentDetails totalUsd={total} />

          {/* Subir comprobante */}
          <Field id="comprobante" label="Comprobante de pago bancario" required error={errors.comprobante}>
            <FileDrop
              id="comprobante"
              file={values.comprobante}
              onChange={(f) => set("comprobante", f)}
              error={errors.comprobante}
            />
          </Field>

          {/* Checkbox de términos para pago no reembolsable */}
          <div className="space-y-2">
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-200">
              <input
                type="checkbox"
                id="terminos_pago"
                className="mt-1 h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
                checked={values.aceptaTerminosPago}
                onChange={(e) => set("aceptaTerminosPago", e.target.checked)}
              />
              <label htmlFor="terminos_pago" className="text-xs text-ink-soft leading-relaxed select-none">
                He leído y acepto los{" "}
                <a href="/terminos" target="_blank" className="font-bold text-brand-600 hover:underline">
                  Términos de Uso
                </a>{" "}
                y la{" "}
                <a href="/privacidad" target="_blank" className="font-bold text-brand-600 hover:underline">
                  Política de Privacidad
                </a>
                , reconociendo que los datos ingresados son correctos y el pago emitido no es reembolsable.
              </label>
            </div>
            {errors.aceptaTerminosPago && (
              <p className="text-xs font-semibold text-red-600">{errors.aceptaTerminosPago}</p>
            )}
          </div>

          {serverError && (
            <div role="alert" className="flex items-start gap-2.5 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700 ring-1 ring-red-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {serverError}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────── BOTONES DE NAVEGACIÓN ─────────────────── */}
      <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-slate-100 disabled:opacity-50"
          >
            <ArrowLeft className="size-4" aria-hidden /> Atrás
          </button>
        ) : (
          <span />
        )}

        {step < maxSteps - 1 ? (
          <button
            type="submit"
            disabled={checkingDuplicate}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-clinic-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-brand-500/25 transition hover:brightness-110 disabled:opacity-70"
          >
            {checkingDuplicate ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden /> Verificando cédula…
              </>
            ) : (
              <>
                {step === 0 ? "Siguiente" : "Continuar"} <ArrowRight className="size-4" aria-hidden />
              </>
            )}
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-clinic-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden /> Procesando inscripción…
              </>
            ) : (
              <>
                <Send className="size-4" aria-hidden /> Enviar inscripción
              </>
            )}
          </button>
        )}
      </div>

      {/* ────────────────── MODAL PARTICIPANTE YA REGISTRADO ────────────────── */}
      {alreadyRegistered && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-duplicate-title"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/10 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header del Modal con Icono */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 ring-4 ring-amber-50">
                  <ShieldAlert className="size-6" />
                </div>
                <div>
                  <h3 id="modal-duplicate-title" className="text-lg font-black text-ink">
                    Participante Ya Registrado
                  </h3>
                  <p className="text-xs font-semibold text-amber-600">
                    Inscripción activa detectada en el sistema
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAlreadyRegistered(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink transition"
                aria-label="Cerrar modal"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Ficha del Registro Previo */}
            <div className="rounded-2xl bg-slate-50 p-4 text-xs space-y-2 ring-1 ring-slate-200">
              <div className="flex justify-between items-center text-ink">
                <span className="font-semibold text-ink-mute">Cédula:</span>
                <span className="font-bold text-ink font-mono">{alreadyRegistered.cedula || values.cedula}</span>
              </div>
              {(alreadyRegistered.nombres || alreadyRegistered.apellidos) && (
                <div className="flex justify-between items-center text-ink">
                  <span className="font-semibold text-ink-mute">Participante:</span>
                  <span className="font-bold text-ink uppercase">
                    {alreadyRegistered.nombres} {alreadyRegistered.apellidos}
                  </span>
                </div>
              )}
              {alreadyRegistered.id && (
                <div className="flex justify-between items-center text-ink border-t border-slate-200 pt-2 mt-2">
                  <span className="font-semibold text-ink-mute">N.º Comprobante / Registro:</span>
                  <span className="font-mono font-black text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md ring-1 ring-brand-200">
                    {alreadyRegistered.id}
                  </span>
                </div>
              )}
            </div>

            {/* AVISO IMPORTANTE SOBRE AFORO Y NO DUPLICIDAD */}
            <div className="rounded-2xl bg-amber-50 p-4 text-xs text-amber-950 border border-amber-200 space-y-1.5">
              <p className="font-bold text-amber-900">
                Garantía de aforo y cupo de asistencia para todos los colegas:
              </p>
              <p className="text-amber-800 leading-relaxed">
                Para asegurar que todos los profesionales de la salud tengan la oportunidad de asistir al Congreso y <b>evitar que se le quite el cupo a otra persona</b>, el sistema restringe el registro a <b>una sola inscripción por participante</b>.
              </p>
            </div>

            {/* ¿Qué hacer si ya estás registrado? */}
            <div className="rounded-xl bg-blue-50/70 p-3.5 text-xs text-blue-900 ring-1 ring-blue-100 space-y-1">
              <p className="font-bold">¿Necesitas tu credencial o código QR?</p>
              <p className="text-blue-800 leading-relaxed">
                Tu registro ya está guardado de forma segura en la base de datos oficial. Si no has recibido tu comprobante con código QR en tu correo o deseas consultar tu asignación de salones, el administrador del sistema puede reenviártelo o validarlo con tu número de cédula el día del evento.
              </p>
            </div>

            {/* Botón de Cierre */}
            <button
              type="button"
              onClick={() => setAlreadyRegistered(null)}
              className="w-full rounded-2xl bg-gradient-to-r from-brand-600 to-clinic-600 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-110"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
