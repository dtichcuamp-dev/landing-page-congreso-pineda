import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata = {
  title: "Política de Privacidad | Congreso Pineda",
};

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
      <div className="glass rounded-3xl p-8 sm:p-12">
        <SectionHeading title="Política de Privacidad" />
        <div className="prose prose-sm prose-slate mt-8 text-ink-soft">
          <p>
            El Comité Organizador del XIV Congreso Pineda respeta tu privacidad y se compromete a proteger los datos personales que nos proporciones a través de este sistema.
          </p>
          
          <h3 className="mt-6 text-lg font-bold text-ink">1. Recopilación de Datos</h3>
          <p>
            Recopilamos información personal básica como nombres, apellidos, cédula, correo electrónico, número telefónico, ubicación geográfica (país, estado, municipio, parroquia) e institución de origen, exclusivamente con el fin de procesar tu registro, generar certificados de asistencia y contactarte respecto al evento.
          </p>
          
          <h3 className="mt-6 text-lg font-bold text-ink">2. Uso de la Información</h3>
          <p>
            Tus datos serán utilizados únicamente por el equipo logístico del congreso y no serán vendidos, compartidos ni transferidos a terceros con fines comerciales. Se podrá enviar información académica relacionada con el Hospital Central Universitario &quot;Dr. Antonio María Pineda&quot;.
          </p>
          
          <h3 className="mt-6 text-lg font-bold text-ink">3. Seguridad</h3>
          <p>
            Implementamos medidas de seguridad administrativas y técnicas para proteger tus datos contra acceso no autorizado. Los comprobantes de pago se almacenan de manera segura y confidencial.
          </p>
          
          <h3 className="mt-6 text-lg font-bold text-ink">4. Derechos del Usuario</h3>
          <p>
            Tienes derecho a solicitar la corrección de tus datos personales si estos presentan errores tipográficos, enviando un correo al soporte oficial del congreso antes de la emisión de certificados.
          </p>
        </div>
      </div>
    </main>
  );
}
