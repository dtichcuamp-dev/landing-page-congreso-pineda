"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  Send,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { useRef, useState } from "react";
import {
  PARTICIPANT_TYPES,
  PAYMENT_INFO,
  calcTotal,
  usd,
} from "@/data/pricing";
import { ApiError, submitRegistration } from "@/lib/api";
import { validateStep } from "@/lib/validation";
import {
  EMPTY_VALUES,
  type FieldErrors,
  type RegistrationResult,
  type RegistrationValues,
} from "@/types/registration";
import { Field, inputClass } from "./Field";
import { FileDrop } from "./FileDrop";
import { JornadaPicker } from "./JornadaPicker";
import { PriceSummary } from "./PriceSummary";

const STEPS = [
  { title: "Tus datos", icon: UserRound },
  { title: "Participación", icon: Stethoscope },
  { title: "Pago", icon: CreditCard },
] as const;

export function RegistrationForm() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<RegistrationValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof RegistrationValues>(key: K, value: RegistrationValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const goTo = (n: number) => {
    setStep(n);
    setServerError(null);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const next = () => {
    const e = validateStep(step, values);
    setErrors(e);
    if (Object.keys(e).length === 0) goTo(step + 1);
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (step < 2) return next();

    // Revalida todo antes de enviar
    for (const s of [0, 1, 2]) {
      const e = validateStep(s, values);
      if (Object.keys(e).length) {
        setErrors(e);
        goTo(s);
        return;
      }
    }

    setSubmitting(true);
    setServerError(null);
    try {
      setResult(await submitRegistration(values));
      requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setValues(EMPTY_VALUES);
    setErrors({});
    setResult(null);
    setStep(0);
  };

  const { total, exonerated } = calcTotal(values.tipoParticipante, values.jornadas);

  /* ───────── Pantalla de éxito ───────── */
  if (result) {
    return (
      <div ref={topRef} className="py-4 text-center" role="status">
        <span className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-clinic-100 text-clinic-600">
          <CheckCircle2 className="size-9" aria-hidden />
        </span>
        <h3 className="mt-4 text-2xl font-extrabold text-ink">¡Inscripción recibida!</h3>
        <p className="mt-2 text-ink-soft">
          Tu código de registro es{" "}
          <span className="rounded-lg bg-brand-50 px-2 py-0.5 font-mono font-bold text-brand-700">{result.id}</span>
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
          {result.exonerated
            ? "Tu participación está exonerada. Te enviaremos la confirmación al correo registrado."
            : `Verificaremos tu comprobante por ${usd(result.total)} y te enviaremos la confirmación al correo registrado.`}{" "}
          Guarda tu código para cualquier consulta.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl px-5 py-2.5 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 transition hover:bg-white/80"
        >
          Registrar a otra persona
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate aria-label="Formulario de inscripción">
      <div ref={topRef} className="scroll-mt-28" />

      {/* Indicador de pasos */}
      <ol className="mb-7 flex items-center" aria-label="Progreso">
        {STEPS.map((s, i) => {
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
              {i < STEPS.length - 1 && (
                <span className={`mx-2 mb-5 h-0.5 flex-1 rounded-full transition ${done ? "bg-clinic-500" : "bg-brand-100"}`} aria-hidden />
              )}
            </li>
          );
        })}
      </ol>

      {/* Honeypot anti-spam (oculto para personas) */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label>
          No completar
          <input type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set("website", e.target.value)} />
        </label>
      </div>

      {/* ───── Paso 1: datos personales ───── */}
      {step === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="nombres" label="Nombres" error={errors.nombres}>
            <input id="nombres" className={inputClass(!!errors.nombres)} autoComplete="given-name" value={values.nombres}
              onChange={(e) => set("nombres", e.target.value)} aria-invalid={!!errors.nombres} aria-describedby={errors.nombres ? "nombres-error" : undefined} />
          </Field>
          <Field id="apellidos" label="Apellidos" error={errors.apellidos}>
            <input id="apellidos" className={inputClass(!!errors.apellidos)} autoComplete="family-name" value={values.apellidos}
              onChange={(e) => set("apellidos", e.target.value)} aria-invalid={!!errors.apellidos} aria-describedby={errors.apellidos ? "apellidos-error" : undefined} />
          </Field>

          <Field id="cedula" label="Cédula de identidad" error={errors.cedula}>
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
              <input id="cedula" inputMode="numeric" placeholder="12345678" className={inputClass(!!errors.cedula)} value={values.cedula}
                onChange={(e) => set("cedula", e.target.value.replace(/[^\d.]/g, ""))} aria-invalid={!!errors.cedula} aria-describedby={errors.cedula ? "cedula-error" : undefined} />
            </div>
          </Field>

          <Field id="sexo" label="Sexo" error={errors.sexo}>
            <select id="sexo" className={inputClass(!!errors.sexo)} value={values.sexo}
              onChange={(e) => set("sexo", e.target.value as "M" | "F" | "")} aria-invalid={!!errors.sexo} aria-describedby={errors.sexo ? "sexo-error" : undefined}>
              <option value="">Selecciona...</option>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
            </select>
          </Field>
          
          <Field id="fechaNacimiento" label="Fecha de Nacimiento" error={errors.fechaNacimiento}>
            <input id="fechaNacimiento" type="date" className={inputClass(!!errors.fechaNacimiento)} value={values.fechaNacimiento}
              onChange={(e) => set("fechaNacimiento", e.target.value)} aria-invalid={!!errors.fechaNacimiento} aria-describedby={errors.fechaNacimiento ? "fechaNacimiento-error" : undefined} />
          </Field>

          <Field id="telefono" label="Número telefónico" error={errors.telefono} hint="Preferiblemente WhatsApp.">
            <input id="telefono" type="tel" inputMode="tel" autoComplete="tel" placeholder="0414-1234567" className={inputClass(!!errors.telefono)}
              value={values.telefono} onChange={(e) => set("telefono", e.target.value)} aria-invalid={!!errors.telefono} aria-describedby={errors.telefono ? "telefono-error" : "telefono-hint"} />
          </Field>

          <Field id="correo" label="Correo electrónico" error={errors.correo} className="sm:col-span-2">
            <input id="correo" type="email" inputMode="email" autoComplete="email" placeholder="nombre@correo.com" className={inputClass(!!errors.correo)}
              value={values.correo} onChange={(e) => set("correo", e.target.value)} aria-invalid={!!errors.correo} aria-describedby={errors.correo ? "correo-error" : undefined} />
          </Field>
        </div>
      )}

      {/* ───── Paso 2: participación ───── */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="tipo" label="Tipo de participante" error={errors.tipoParticipante}>
              <select id="tipo" className={inputClass(!!errors.tipoParticipante)} value={values.tipoParticipante}
                onChange={(e) => set("tipoParticipante", e.target.value as RegistrationValues["tipoParticipante"])}
                aria-invalid={!!errors.tipoParticipante} aria-describedby={errors.tipoParticipante ? "tipo-error" : undefined}>
                <option value="">Selecciona una opción…</option>
                {PARTICIPANT_TYPES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} — {p.rate === 0 ? "Exonerado" : `${usd(p.rate)} / jornada`}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="institucion" label="Institución de origen" error={errors.institucion}>
              <input id="institucion" className={inputClass(!!errors.institucion)} autoComplete="organization" placeholder="Ej.: HCUAMP"
                value={values.institucion} onChange={(e) => set("institucion", e.target.value)} aria-invalid={!!errors.institucion} aria-describedby={errors.institucion ? "institucion-error" : undefined} />
            </Field>

            <Field id="pais" label="País" error={errors.pais}>
              <input id="pais" className={inputClass(!!errors.pais)} autoComplete="country-name" placeholder="Ej.: Venezuela"
                value={values.pais} onChange={(e) => set("pais", e.target.value)} aria-invalid={!!errors.pais} aria-describedby={errors.pais ? "pais-error" : undefined} />
            </Field>
            <Field id="estado" label="Estado" error={errors.estado}>
              <input id="estado" className={inputClass(!!errors.estado)} autoComplete="address-level1" placeholder="Ej.: Lara"
                value={values.estado} onChange={(e) => set("estado", e.target.value)} aria-invalid={!!errors.estado} aria-describedby={errors.estado ? "estado-error" : undefined} />
            </Field>
            <Field id="municipio" label="Municipio" error={errors.municipio}>
              <input id="municipio" className={inputClass(!!errors.municipio)} autoComplete="address-level2" placeholder="Ej.: Iribarren"
                value={values.municipio} onChange={(e) => set("municipio", e.target.value)} aria-invalid={!!errors.municipio} aria-describedby={errors.municipio ? "municipio-error" : undefined} />
            </Field>
            <Field id="parroquia" label="Parroquia" error={errors.parroquia}>
              <input id="parroquia" className={inputClass(!!errors.parroquia)} autoComplete="address-level3" placeholder="Ej.: Concepción"
                value={values.parroquia} onChange={(e) => set("parroquia", e.target.value)} aria-invalid={!!errors.parroquia} aria-describedby={errors.parroquia ? "parroquia-error" : undefined} />
            </Field>
          </div>

          <JornadaPicker selected={values.jornadas} onChange={(ids) => set("jornadas", ids)} error={errors.jornadas} />
          <PriceSummary tipo={values.tipoParticipante} jornadas={values.jornadas} />
        </div>
      )}

      {/* ───── Paso 3: pago ───── */}
      {step === 2 && (
        <div className="space-y-5">
          <PriceSummary tipo={values.tipoParticipante} jornadas={values.jornadas} />

          {exonerated ? (
            <p className="rounded-2xl bg-clinic-50 p-4 text-sm font-medium text-clinic-700 ring-1 ring-clinic-200">
              Tu categoría está exonerada: no necesitas adjuntar comprobante. Si deseas, puedes subir un documento de respaldo.
            </p>
          ) : (
            <dl className="glass-input grid gap-x-4 gap-y-2 rounded-2xl p-4 text-sm sm:grid-cols-2">
              {PAYMENT_INFO.map((p) => (
                <div key={p.label}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-ink-mute">{p.label}</dt>
                  <dd className="font-semibold text-ink">{p.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <Field id="comprobante" label="Comprobante de pago" required={total > 0} error={errors.comprobante}>
            <FileDrop id="comprobante" file={values.comprobante} onChange={(f) => set("comprobante", f)} error={errors.comprobante} />
          </Field>

          <div className="flex items-start gap-3 mt-4">
            <input
              type="checkbox"
              id="terminos"
              className="mt-1 h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
              checked={values.aceptaTerminos}
              onChange={(e) => set("aceptaTerminos", e.target.checked)}
            />
            <label htmlFor="terminos" className="text-sm text-ink-soft">
              He leído y acepto los <a href="/terminos" target="_blank" className="font-semibold text-brand-600 hover:underline">Términos de Uso</a> y la <a href="/privacidad" target="_blank" className="font-semibold text-brand-600 hover:underline">Política de Privacidad</a>, reconociendo que los datos ingresados son correctos y el pago emitido no es reembolsable.
            </label>
          </div>
          {errors.aceptaTerminos && <p className="text-xs font-medium text-red-600">{errors.aceptaTerminos}</p>}

          {serverError && (
            <div role="alert" className="flex items-start gap-2.5 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700 ring-1 ring-red-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {serverError}
            </div>
          )}
        </div>
      )}

      {/* Navegación */}
      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 0 ? (
          <button type="button" onClick={() => goTo(step - 1)} disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-ink-soft transition hover:bg-white/80 disabled:opacity-50">
            <ArrowLeft className="size-4" aria-hidden /> Atrás
          </button>
        ) : (
          <span />
        )}

        {step < 2 ? (
          <button type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-clinic-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-110">
            Continuar <ArrowRight className="size-4" aria-hidden />
          </button>
        ) : (
          <button type="submit" disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-clinic-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70">
            {submitting ? (<><Loader2 className="size-4 animate-spin" aria-hidden /> Enviando…</>) : (<><Send className="size-4" aria-hidden /> Enviar inscripción</>)}
          </button>
        )}
      </div>
    </form>
  );
}
