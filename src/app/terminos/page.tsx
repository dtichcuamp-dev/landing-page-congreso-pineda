import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata = {
  title: "Términos de Uso | Congreso Pineda",
};

export default function TerminosPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
      <div className="glass rounded-3xl p-8 sm:p-12">
        <SectionHeading 
          eyebrow="Congreso Pineda"
          title="Términos de Uso" 
        />
        <div className="prose prose-sm prose-slate mt-8 text-ink-soft">
          <p>
            Bienvenido al sistema de inscripciones del XIV Congreso Pineda. Al acceder y utilizar nuestra plataforma, aceptas cumplir con los siguientes términos y condiciones.
          </p>
          
          <h3 className="mt-6 text-lg font-bold text-ink">1. Uso del Sistema</h3>
          <p>
            La plataforma de inscripciones tiene como objetivo facilitar el registro de los participantes al evento científico. El usuario se compromete a ingresar información veraz, precisa y actualizada.
          </p>
          
          <h3 className="mt-6 text-lg font-bold text-ink">2. Pagos e Inscripciones</h3>
          <p>
            Las tarifas están expresadas en dólares estadounidenses (USD) y se pagarán en bolívares al cambio de la tasa del Banco Central de Venezuela (BCV) del día en que se realiza la transacción. <strong>Los pagos emitidos no son reembolsables</strong> bajo ninguna circunstancia, incluyendo inasistencia al evento.
          </p>
          
          <h3 className="mt-6 text-lg font-bold text-ink">3. Comprobantes</h3>
          <p>
            La validación del registro está sujeta a la verificación del comprobante de pago enviado. En caso de inconsistencias, el comité organizador se reserva el derecho de anular la inscripción.
          </p>
          
          <h3 className="mt-6 text-lg font-bold text-ink">4. Propiedad Intelectual</h3>
          <p>
            Todo el contenido de esta plataforma (diseño, textos, logotipos) es propiedad del Hospital Central Universitario &quot;Dr. Antonio María Pineda&quot; (HCUAMP) y su Departamento de Tecnología, Información y Comunicación (DTIC).
          </p>
          
          <h3 className="mt-6 text-lg font-bold text-ink">5. Modificaciones</h3>
          <p>
            El Comité Organizador se reserva el derecho de modificar la agenda, ponentes, sedes u horarios del evento, notificando oportunamente a los participantes por los canales oficiales.
          </p>
        </div>
      </div>
    </main>
  );
}
