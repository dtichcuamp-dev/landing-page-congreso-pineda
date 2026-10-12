"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Hospital,
  Loader2,
  Search,
  Send,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";
import {
  ESPECIALIDADES_CONGRESO,
  PARTICIPANT_TYPES_HCUAMP,
  PARTICIPANT_TYPES_OTRA,
  calcTotal,
  usd,
} from "@/data/pricing";
import { ApiError, getCapacities, lookupHcuamp, submitRegistration } from "@/lib/api";
import { cleanCedula, validateStep } from "@/lib/validation";
import {
  EMPTY_VALUES,
  type FieldErrors,
  type InstitucionOrigen,
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
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Cargar disponibilidad de aforo al montar
  useEffect(() => {
    getCapacities().then((data) => setCapacities(data)).catch(() => {});
  }, []);

  const set = <K extends keyof RegistrationValues>(key: K, value: RegistrationValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleOrigenChange = (origen: InstitucionOrigen) => {
    setValues((prev) => ({
      ...prev,
      origenInstitucion: origen,
      institucion:
        origen === "HCUAMP"
          ? "Hospital Central Universitario Dr. Antonio María Pineda (HCUAMP)"
          : "",
      tipoParticipante: "",
      nombrePonencia: "",
      especialidad: "",
    }));
    setHcuampFeedback({ status: "idle" });
    setErrors({});
  };

  const handleLookupHcuamp = async () => {
    const rawCed = cleanCedula(values.cedula);
    if (!rawCed || rawCed.length < 5) {
      setErrors((e) => ({ ...e, cedula: "Ingresa un número de cédula válido para buscar (5 a 9 dígitos)." }));
      return;
    }

    setSearchingHcuamp(true);
    setHcuampFeedback({ status: "idle" });
    try {
      const res = await lookupHcuamp(rawCed);
      if (res.found && res.data) {
        setValues((v) => ({
          ...v,
          nombres: res.data?.nombres || v.nombres,
          apellidos: res.data?.apellidos || v.apellidos,
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
  const maxSteps = isHcuamp ? 2 : 3;

  const stepsList = isHcuamp
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

  const next = () => {
    const e = validateStep(step, values);
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

    setSubmitting(true);
    setServerError(null);
    try {
      const res = await submitRegistration(values);
      setResult(res);
      requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado al procesar la inscripción.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setValues(EMPTY_VALUES);
    setErrors({});
    setResult(null);
    setHcuampFeedback({ status: "idle" });
    setStep(0);
  };

  const { total, exonerated } = calcTotal(values.tipoParticipante, values.turnos, values.origenInstitucion);

  /* ───────── Pantalla de confirmación ───────── */
  if (result) {
    return (
      <div ref={topRef} className="py-6 text-center" role="status">
        <span className="mx-auto inline-flex size-20 items-center justify-center rounded-full bg-clinic-100 text-clinic-600 shadow-md">
          <CheckCircle2 className="size-11" aria-hidden />
        </span>
        <h3 className="mt-5 text-2xl font-extrabold text-ink sm:text-3xl">¡Inscripción Recibida con Éxito!</h3>
        <p className="mt-3 text-base text-ink-soft">
          Tu código único de participante es:
        </p>
        <div className="mt-2 inline-block rounded-xl bg-gradient-to-r from-brand-50 to-clinic-50 px-4 py-2 ring-1 ring-brand-200">
          <span className="font-mono text-2xl font-extrabold tracking-wider text-brand-700">{result.id}</span>
        </div>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
          {result.exonerated
            ? "Tu participación como personal del HCUAMP está 100% exonerada. Hemos registrado tu asistencia a las jornadas y turnos seleccionados y te enviamos la confirmación a tu correo electrónico."
            : `Hemos recibido tu inscripción por un monto de ${usd(result.total)}. Verificaremos tu comprobante bancario y te confirmaremos la activación de tu pase al correo registrado.`}
        </p>
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs text-ink-mute max-w-md mx-auto ring-1 ring-slate-200">
          Guarda o anota tu código <b>{result.id}</b> para presentarlo en la mesa de acreditación del evento en el Hotel Biotel Suites.
        </div>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-700"
        >
          Registrar a otra persona
        </button>
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
                className={inputClass(!!errors.institucion)}
                value={values.institucion}
                onChange={(e) => set("institucion", e.target.value)}
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
                  disabled={searchingHcuamp}
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
                    onChange={(e) => set("cedula", e.target.value.replace(/[^\d.]/g, ""))}
                    aria-invalid={!!errors.cedula}
                  />
                </div>
              </Field>
            )}

            <Field id="nombres" label="Nombres" error={errors.nombres} required>
              <input
                id="nombres"
                className={inputClass(!!errors.nombres)}
                autoComplete="given-name"
                value={values.nombres}
                onChange={(e) => set("nombres", e.target.value)}
                aria-invalid={!!errors.nombres}
              />
            </Field>

            <Field id="apellidos" label="Apellidos" error={errors.apellidos} required>
              <input
                id="apellidos"
                className={inputClass(!!errors.apellidos)}
                autoComplete="family-name"
                value={values.apellidos}
                onChange={(e) => set("apellidos", e.target.value)}
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
                className={inputClass(!!errors.pais)}
                value={values.pais}
                onChange={(e) => set("pais", e.target.value)}
                aria-invalid={!!errors.pais}
              />
            </Field>

            <Field id="estado" label="Estado" error={errors.estado} required>
              <input
                id="estado"
                className={inputClass(!!errors.estado)}
                value={values.estado}
                onChange={(e) => set("estado", e.target.value)}
                aria-invalid={!!errors.estado}
              />
            </Field>

            <Field id="municipio" label="Municipio" error={errors.municipio} required>
              <input
                id="municipio"
                className={inputClass(!!errors.municipio)}
                value={values.municipio}
                onChange={(e) => set("municipio", e.target.value)}
                aria-invalid={!!errors.municipio}
              />
            </Field>

            <Field id="parroquia" label="Parroquia" error={errors.parroquia} required>
              <input
                id="parroquia"
                className={inputClass(!!errors.parroquia)}
                value={values.parroquia}
                onChange={(e) => set("parroquia", e.target.value)}
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
                        {p.label} — {usd(p.rate)} por día
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
                  className={inputClass(!!errors.nombrePonencia)}
                  value={values.nombrePonencia || ""}
                  onChange={(e) => set("nombrePonencia", e.target.value)}
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
                  className={inputClass(!!errors.especialidad)}
                  value={values.especialidad || ""}
                  onChange={(e) => set("especialidad", e.target.value)}
                  aria-invalid={!!errors.especialidad}
                >
                  <option value="">Selecciona la especialidad médica...</option>
                  {ESPECIALIDADES_CONGRESO.map((esp) => (
                    <option key={esp} value={esp}>
                      {esp}
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

          {/* Si es HCUAMP, el paso 2 incluye la aceptación de términos y finaliza */}
          {isHcuamp ? (
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-200">
                <input
                  type="checkbox"
                  id="terminos_hcuamp"
                  className="mt-1 h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
                  checked={values.aceptaTerminos}
                  onChange={(e) => set("aceptaTerminos", e.target.checked)}
                />
                <label htmlFor="terminos_hcuamp" className="text-xs text-ink-soft leading-relaxed select-none">
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
            /* Para Otra Institución, nota informativa y avanza al paso 3 */
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

      {/* ─────────────────── PASO 3: PAGO (SOLO OTRA INSTITUCIÓN) ─────────────────── */}
      {step === 2 && !isHcuamp && (
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
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-clinic-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-brand-500/25 transition hover:brightness-110"
          >
            {step === 0 ? "Siguiente" : "Continuar"} <ArrowRight className="size-4" aria-hidden />
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
    </form>
  );
}
