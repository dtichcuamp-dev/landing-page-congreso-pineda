export type Turno = "manana" | "tarde";

export type Salon = "principal" | "alterno";
export type TalkKind = "talk" | "break" | "ceremony";

export interface Talk {
  time?: string;
  title: string;
  speaker?: string;
  kind: TalkKind;
  /** Ponente o tema por confirmar. */
  tbc?: boolean;
}

export interface Session {
  /** Id de la especialidad (ver specialties.ts). Vacío en actos especiales. */
  specialtyId?: string;
  title: string;
  /** Horario específico cuando difiere del bloque general del turno. */
  hours?: string;
  /** Título/tema del bloque científico. */
  theme?: string;
  moderator?: string;
  talks?: Talk[];
  /** Nota visible para el usuario (p. ej. horarios por confirmar). */
  note?: string;
  kind?: "ceremony" | "none";
}

export interface DaySchedule {
  id: string;
  day: number;
  weekday: string;
  salones: Record<Salon, Record<Turno, Session | Session[]>>;
}

export const TURNO_LABEL: Record<Turno, { name: string; hours: string }> = {
  manana: { name: "Mañana", hours: "8:30 a. m. – 12:30 p. m." },
  tarde: { name: "Tarde", hours: "2:00 p. m. – 6:00 p. m." },
};

export const SALON_LABEL: Record<Salon, string> = {
  principal: "Salón Principal",
  alterno: "Salón Alterno",
};

// ── helpers de transcripción ──────────────────────────────────────────────
const t = (time: string | undefined, title: string, speaker?: string, tbc?: boolean): Talk => ({
  time, title, speaker, tbc, kind: "talk",
});
const brk = (time: string | undefined, title = "Receso"): Talk => ({ time, title, kind: "break" });
const cer = (time: string | undefined, title: string, speaker?: string): Talk => ({
  time, title, speaker, kind: "ceremony",
});

// ── Programas detallados (fuente: documentos de Drive «Programas de Ponencias») ──
const INAUGURAL: Session = {
  title: "Acto Inaugural del Congreso",
  kind: "ceremony",
  talks: [
    cer("8:30 a. m.", "Himno Nacional y del Edo. Lara · Palabras de apertura"),
    cer("8:50 a. m.", "Palabras del Gobernador del Edo. Lara"),
    cer("9:05 a. m.", "Palabras de la Dra. Linda Amaro"),
    t("9:30 a. m.", "Reseña histórica del Dr. Antonio María Pineda", "Dr. Felipe Pineda Barrios"),
    brk("10:00 a. m."),
    t("10:30 a. m.", "Semblanza del Dr. Juan Alberto Olivares", "Dr. Ramón Aguilar"),
    cer("11:00 a. m.", "Presentación de Acto Cultural o Clase Magistral"),
  ],
};

const MED_INTERNA: Session = {
  specialtyId: "medicina-interna",
  title: "Medicina Interna",
  hours: "8:30 a. m. – 12:40 p. m. · Salón Principal",
  talks: [
    cer("8:30 – 8:50 a. m.", "Apertura del Bloque de Medicina Interna", "Servicio de Medicina Interna"),
    t("8:50 – 9:10 a. m.", "Historia clínica como método diagnóstico eficaz", "Dra. Isbel González"),
    t("9:10 – 9:30 a. m.", "Anticoagulación en casos especiales", "Dra. Yedalith Pernalete"),
    t("9:30 – 9:50 a. m.", "Neuroinfecciones y encefalitis autoinmune: del LCR a tratamiento empírico", "Dr. José Mejías"),
    t("9:50 – 10:10 a. m.", "Síndromes paraneoplásicos: La pista sistémica del cáncer oculto", "Dra. María Estefanía Fernández"),
    t("10:10 – 10:20 a. m.", "Sesión de preguntas y respuestas", "Panel de especialistas"),
    brk("10:20 – 10:50 a. m.", "Coffee Break · Receso"),
    t("10:50 – 11:10 a. m.", "El eje cardiorrenometabólico: Prescripción orientada al riesgo organocéntrico", "Dra. Indira Acosta"),
    t("11:10 – 11:30 a. m.", "Obesidad sarcopénica y fenotipificación de la composición corporal", "Dr. Ludwig Rivero"),
    t("11:30 – 11:50 a. m.", "Preeclampsia: Una misma tensión arterial, 2 fenotipos", "Dr. Ángel Echenique"),
    t("11:50 a. m. – 12:10 p. m.", "Vasculitis sistémicas: Del síndrome a la interpretación serológica", "Dra. Gabriela Caldera"),
    t("12:10 – 12:20 p. m.", "Sesión de preguntas y respuestas", "Panel de especialistas"),
    cer("12:20 – 12:40 p. m.", "Acto de clausura: Reconocimiento al Mejor Adjunto, Mejor Residente y Mejor Servicio", "Servicio de Medicina Interna"),
  ],
};

const ENFERMERIA: Session = {
  specialtyId: "enfermeria",
  title: "Departamento de Enfermería",
  hours: "2:00 – 6:00 p. m. (14:00 - 18:00)",
  theme: "Cuidado crítico, neumoprotección y humanización en la práctica de enfermería",
  talks: [
    cer("2:00 – 2:15 p. m.", "Apertura del Bloque de Enfermería", "Coordinación de Enfermería"),
    t("2:20 – 2:40 p. m.", "Neumoprotección en el Neonato Ventilado", "Lcda. Yilbexy Rodríguez / Lcda. Fabiana Sánchez"),
    t("2:50 – 3:10 p. m.", "De la Cama a la Bipedestación: Fisioterapia, Osteomuscular y Estabilidad Hemodinámica", "Lcdo. Alberto Pargas"),
    brk("3:20 – 3:45 p. m.", "Coffee Break · Receso"),
    t("3:45 – 4:00 p. m.", "Ronda de preguntas y respuestas", "Panel de ponentes"),
    t("4:00 – 4:20 p. m.", "Rol de Enfermería en la Humanización de los usuarios en el área de Emergencia General", "Lcda. Maurimar Escalona"),
    t("4:30 – 4:50 p. m.", "Ronda de preguntas y respuestas", "Panel de ponentes"),
    t("5:00 – 5:20 p. m.", "Aplicación de los códigos en el área de triaje de Emergencia General", "Lcda. María Celeste Sánchez"),
    cer("5:20 – 5:45 p. m.", "Cierre de la jornada y entrega de reconocimientos", "Departamento de Enfermería"),
  ],
};

const NEUROCIRUGIA: Session = {
  specialtyId: "neurocirugia",
  title: "Neurocirugía",
  hours: "2:00 – 4:40 p. m. (14:00 - 16:40) · Salón Principal",
  talks: [
    cer("2:00 – 2:15 p. m.", "Palabras de Bienvenida e Instalación de las Jornadas", "Dr. Williams Arrieche (Jefe del Servicio de Neurocirugía)"),
    cer("2:15 – 2:30 p. m.", "Palabras de Apertura", "Dr. Kenny Mejías (Jefe de Residentes)"),
    t("2:30 – 2:50 p. m.", "Abordaje Endoscópico de Columna: Curva de Aprendizaje", "Dr. Williams Gutiérrez"),
    t("2:50 – 3:10 p. m.", "Abordaje Retrosigmoideo", "Dr. Daher"),
    t("3:10 – 3:30 p. m.", "Nuevos Conceptos en Disrrafismo Espinal", "Dra. Cobos"),
    t("3:30 – 3:50 p. m.", "Ablación Cerebral en Patologías Psiquiátricas (Trastornos de Agresividad)", "Dr. Juan Abud"),
    t("3:50 – 4:10 p. m.", "Monitoreo Neurológico Multimodal para la Predicción Diagnóstica de Isquemia en los Clipajes de Aneurismas Cerebrales", "Dra. Thair Moreno"),
    t("4:10 – 4:40 p. m.", "Foro de Preguntas y Respuestas", "Panel interactivo con todos los ponentes invitados"),
    cer("4:40 p. m.", "Clausura del Evento", "Servicio de Neurocirugía"),
  ],
};

const IMAGENES: Session = {
  specialtyId: "imagenes",
  title: "Diagnóstico por Imágenes",
  hours: "8:30 a. m. – 12:30 m. · Salón Alterno",
  theme: "IMÁGENES QUE SALVAN VIDAS: DESAFÍOS MULTIDISCIPLINARIOS EN EL ÁREA DE EMERGENCIA",
  talks: [
    cer("8:30 a. m.", "Bienvenida y apertura", "Servicio de Diagnóstico por Imágenes"),
    t("9:00 a. m.", "Traumatismo craneoencefálico: claves radiológicas en la toma de decisión quirúrgica vs. expectante", "Dra. Maruja Hidalgo y Dr. Ygnacio Ramírez"),
    t("9:30 a. m.", "Evaluación radiológica de la pelvis traumática: signos de inestabilidad e impacto en la conducta quirúrgica", "Dr. Douglas García y Dr. Alejandro Orduz"),
    t("10:00 a. m.", "Ecografía pulmonar en emergencias: diagnóstico rápido a la cabecera del paciente", "Dra. María Gonzales y Dra. Karla Tamayo"),
    t("10:30 a. m.", "Algoritmo imagenológico en la embarazada", "Dr. Carlos Roa"),
    brk("10:30 – 10:50 a. m.", "Coffee Break · Receso"),
    t("10:50 a. m.", "Trauma abdominal agudo: triage imagenológico eficiente entre Eco FAST y TC", "Dra. Laura Prado y Dr. Richard Oropeza"),
    t("11:20 a. m.", "Intervencionismo y emergencia: accesos vasculares ecoguiados para un procedimiento seguro", "Dr. Nelson Garcías"),
    cer("12:00 m.", "Cierre de la jornada", "Comité Organizador"),
  ],
};

const ANESTESIOLOGIA: Session = {
  specialtyId: "anestesiologia",
  title: "Anestesiología",
  hours: "2:00 – 6:00 p. m. (14:00 - 18:00)",
  theme: "Desafío crítico en anestesiología y reanimación",
  moderator: "Dr. Revilla (Tiempo por ponencia: 25 min)",
  talks: [
    cer("2:00 – 2:15 p. m.", "Palabras de bienvenida", "Dr. Alonzo García, Dra. Katherin Cayama"),
    t("2:20 – 2:45 p. m.", "Mutaciones mitocondriales y su impacto en la sociedad venezolana", "Dra. Metzi Navas"),
    t("2:50 – 3:15 p. m.", "Uso de análogos de GLP-1: dilemas y repercusiones en el acto anestésico (Ozempic)", "Dr. Carlos Pérez"),
    t("3:20 – 3:45 p. m.", "Actualización en manejo hemodinámico avanzado (ONLINE)", "Dr. Pablo Herrera"),
    brk("3:45 – 4:25 p. m.", "Coffee Break · Receso"),
    t("4:25 – 4:50 p. m.", "Opciones prácticas en dolor oncológico: Rompiendo la dependencia de la elastomérica", "Dra. Verónica Rodríguez"),
    t("4:55 – 5:20 p. m.", "Manejo de emergencia masiva y evento catastrófico", "Dr. Carlos Salazar"),
    t("5:20 – 5:45 p. m.", "Hipertermia Maligna, lecciones de un caso, cómo estar preparados (ONLINE)", "Dr. Gabriel Medina"),
    cer("5:45 – 6:00 p. m.", "Cierre de la jornada", "Comité Organizador"),
  ],
};

const GINECO: Session = {
  specialtyId: "ginecobstetricia",
  title: "Ginecología y Obstetricia",
  hours: "8:30 a. m. – 12:30 m. · Salón Principal",
  theme: "Innovación y nuevos retos en la práctica clínica: el arte de cuidar cada etapa femenina",
  talks: [
    cer("8:30 a. m.", "Apertura del Bloque de Ginecología y Obstetricia", "Servicio de Ginecología y Obstetricia"),
    t("8:55 – 9:15 a. m.", "Utilidad de la histerosonografía como método diagnóstico de patologías endometriales en pacientes con sangrado uterino anormal", "Dra. Sofía Brito"),
    t("9:20 – 9:40 a. m.", "ABC de la terapia hormonal en la menopausia", "Dra. Katiuska Ríos"),
    t("9:45 – 10:05 a. m.", "Enfermedad trofoblástica gestacional: del diagnóstico preciso al manejo clínico actual", "Dra. Sunangela Escalona"),
    t("10:10 – 10:30 a. m.", "Manejo de la embarazada con patología de tiroides", "Dr. Miguel Vargas"),
    brk("10:30 – 11:00 a. m.", "Coffee Break · Receso"),
    t("11:00 – 11:20 a. m.", "Uso correcto del Doppler Color y espectral en Medicina fetal", "Dr. Héctor Quiroga"),
    t("11:25 – 11:45 a. m.", "Fenotipos hemodinámicos de preeclampsia", "Dr. Miguel Vargas"),
    t("11:50 a. m. – 12:10 p. m.", "Simuladores de preeclampsia", "Dra. Alexandra Rivero"),
    cer("12:30 p. m.", "Clausura del bloque y entrega de reconocimientos", "Servicio de Ginecología y Obstetricia"),
  ],
};

const CIRUGIA_PLASTICA: Session = {
  specialtyId: "cirugia-plastica",
  title: "Cirugía Plástica, Reconstructiva, Estética y Maxilofacial",
  hours: "8:30 a. m. – 1:00 p. m.",
  theme: "Rol de la Cirugía Plástica y Reconstructiva en el tratamiento integral del cáncer de mama",
  talks: [
    cer("8:30 – 8:50 a. m.", "Palabras jefe de servicio apertura y bienvenida · Palabras de presidenta SVCPREM", "Dra. Bélgica Becerra, Dra. Coralia Almeida"),
    t("9:00 – 9:30 a. m.", "Evaluación mastológica previa a cirugía plástica mamaria", "Dr. José Pernalete"),
    t("9:40 – 10:10 a. m.", "Opciones reconstructivas que brindan confort a las pacientes con patología de cáncer de mama", "Dra. Linda Isturiz"),
    brk("10:10 – 10:30 a. m.", "Coffee Break · Receso"),
    t("10:40 – 11:10 a. m.", "Complicaciones de los Colgajos", "Dr. Jesús Orangel García"),
    t("11:20 – 11:50 a. m.", "Reconstrucción del CAP (Complejo Aréola-Pezón)", "Dra. Natalia Solórzano"),
    t("12:00 – 12:15 p. m.", "El ácido hipocloroso en pacientes quemados", "Dr. Jesús Orangel García (Speaker ACUA-E)"),
    t("12:15 – 12:30 p. m.", "Ronda de preguntas y respuestas", "Residentes del Servicio"),
    cer("12:30 – 1:00 p. m.", "Entrega de premios y reconocimientos", "Residentes y Comité Organizador"),
  ],
};

const CIRUGIA_GENERAL: Session = {
  specialtyId: "cirugia-general",
  title: "Cirugía General",
  hours: "2:00 – 5:30 p. m. (14:00 - 17:30)",
  theme: "El Bisturí Digital - La imagenología en manos del Cirujano",
  talks: [
    cer("2:00 – 2:15 p. m.", "Apertura del Bloque de Cirugía General", "Comité Organizador"),
    t("2:20 – 2:40 p. m.", "Utilidad de la RM en el diagnóstico de la patología rectal: Mesorrecto y el margen de resección circunferencial (CRM) definitivo", "Dr. Luis Carrasco"),
    t("2:50 – 3:10 p. m.", "Mapeo ecográfico del cuello: ¿Suficiente o amerita complemento?", "Dra. Glenna Chirinos"),
    t("3:20 – 3:40 p. m.", "Complicaciones en la pared abdominal: Imaginando cómo ordenar el desorden. Volumetría, pérdida de dominio y mapas anatómicos para la separación de componentes", "Dr. Andrés Reyes Belandria"),
    brk("3:40 – 4:00 p. m.", "Coffee Break · Receso"),
    t("4:00 – 4:20 p. m.", "TU de pared torácica: Desde las imágenes hasta la solución de la complicación", "Dr. Otto Mosquera"),
    t("4:30 – 4:50 p. m.", "Navegando la Vía Biliar: ¿Quién toma el timón? · Colangiografía en los diferentes escenarios", "Dr. Diego Castillo, Dr. Honorio Anza, Dr. Carlos Baptista"),
    t("5:00 – 5:20 p. m.", "Imágenes en el postoperatorio gastrointestinal complicado: Abordaje imagenológico en el diagnóstico de colecciones, fístulas y fugas", "Dr. Honorio Anza"),
    cer("5:30 p. m.", "Cierre de la Jornada", "Comité Organizador"),
  ],
};

const DERMATOLOGIA: Session = {
  specialtyId: "dermatologia",
  title: "Dermatología",
  hours: "8:30 – 11:30 a. m. · Salón Alterno",
  theme: "Dermatitis Atópica de la «A hasta la Z»",
  talks: [
    t("8:30 a. m.", "Dermatitis atópica: generalidades", "Dra. Graciela María González Padilla"),
    t("8:50 a. m.", "Microbiota cutánea y su relación con las infecciones en el paciente atópico", "Dr. Karim Moukhallalele Saman"),
    t("9:10 a. m.", "Cuidado de la piel del paciente atópico", "Dra. Julia Rothe de Arocha"),
    t("9:30 a. m.", "Manejo de la dermatitis atópica en el adulto", "Dra. María Graciete Nunes Contreras"),
    t("9:50 a. m.", "Queratosis pilaris", "Dr. José Luis Narváez Villarroel"),
    t("10:10 a. m.", "La esfera psicológica del paciente atópico y sus familiares", "Lcda. en Psicología María Valentina Perdomo"),
    t("10:30 a. m.", "La nutrición del paciente atópico formando parte del abordaje integral", "Lcda. en Nutrición Jenny Arrellano Quintero"),
    brk("10:50 – 11:10 a. m.", "Coffee Break · Receso"),
    t("11:10 a. m.", "¿La ecografía cutánea en el paciente atópico es diferente?", "Dra. Claudia Beatriz González Ditta (Esp. en Diagnóstico por Imágenes, Ultrasonido Dermatológico)"),
    cer("11:30 a. m.", "Cierre y entrega de premios", "Servicio de Dermatología"),
  ],
};

const ORL: Session = {
  specialtyId: "orl",
  title: "Otorrinolaringología (ORL)",
  hours: "2:00 – 5:10 p. m. (14:00 - 17:10) · Salón Alterno",
  talks: [
    cer("2:00 p. m.", "Palabras de Bienvenida e Instalación de las Jornadas", "Dra. Elvymar Carmona (Jefe del Servicio de Otorrinolaringología)"),
    cer("2:30 p. m.", "Palabras de Apertura", "Dra. Yaselin Soler (Coordinadora de Postgrado de Otorrinolaringología)"),
    t("3:00 p. m.", "Diagnóstico del vértigo agudo en la emergencia: valor clínico y aplicación del protocolo HINTS", "Dra. Alexandra Hagobian"),
    t("3:30 p. m.", "Impacto funcional de las maniobras quirúrgicas en rinoplastia", "Dra. María Jesús Rojas"),
    brk("3:30 – 3:45 p. m.", "Coffee Break · Receso"),
    t("3:50 p. m.", "Angina de Ludwig: hasta dónde llega el otorrinolaringólogo", "Dr. Adrián Mast"),
    t("4:20 p. m.", "Claves para el abordaje seguro de los senos paranasales", "Dr. Hugo Cifuentes"),
    t("4:40 p. m.", "Esenciales en el manejo de la patología laríngea", "Dra. Leicy Carrasco"),
    cer("5:10 p. m.", "Clausura del Evento", "Servicio de Otorrinolaringología"),
  ],
};

const UROLOGIA: Session = {
  specialtyId: "urologia",
  title: "Urología",
  hours: "2:00 – 5:50 p. m. (14:00 - 17:50) · Salón Alterno",
  theme: "Uroinnovación: de la evidencia a la práctica",
  talks: [
    cer("2:00 – 2:10 p. m.", "Palabras de Bienvenida por Comité Organizador", "Dra. Gabriela Santiago"),
    cer("2:10 – 2:20 p. m.", "Apertura del Evento por Jefe de Servicio", "Dra. Yngrid Pacheco"),
    t("2:30 – 2:50 p. m.", "Elutax-3: Dispositivo innovador para estenosis de vías urinarias", "Dr. Narciel Sáez / Dr. Joseph Sáez"),
    t("2:50 – 3:00 p. m.", "Urología de transición", "Dr. Jesús Fernández"),
    t("3:00 – 3:20 p. m.", "Cáncer de próstata oligometastásico", "Dr. Adelino Andrade"),
    t("3:20 – 3:30 p. m.", "Sesión de preguntas y respuestas", "Panel de especialistas"),
    brk("3:30 – 4:00 p. m.", "Coffee Break · Receso"),
    t("4:00 – 4:20 p. m.", "Disfunción eréctil: ¿Cómo abordarla?", "Dra. Soli Molina (R3)"),
    t("4:20 – 4:50 p. m.", "Nuevas tecnologías en urología", "Dr. Manuel Castro (R3)"),
    t("4:50 – 5:00 p. m.", "Estética Masculina", "Dr. Christian Araujo (R3)"),
    t("5:00 – 5:10 p. m.", "Sesión de preguntas y respuestas", "Dr. Víctor Contreras"),
    cer("5:10 – 5:30 p. m.", "Entrega de Reconocimientos", "Graduandos"),
    cer("5:30 – 5:50 p. m.", "Clausura del Evento y Palabras de Cierre", "Dr. Antoun Banna y Graduandos"),
  ],
};

const OFTALMOLOGIA: Session = {
  specialtyId: "oftalmologia",
  title: "Oftalmología",
  hours: "8:30 a. m. – 12:30 m. · Salón Alterno",
  talks: [
    cer("8:30 a. m.", "Apertura del Bloque de Oftalmología", "Servicio de Oftalmología"),
    t("8:50 – 9:10 a. m.", "Revelaciones de la Retina: Diagnóstico temprano y salud sistémica", "Dra. Carla Rojas"),
    t("9:15 – 9:35 a. m.", "Glaucoma al día: Avances diagnósticos y abordajes de última generación", "Dra. Aura Álvarez"),
    t("9:40 – 10:00 a. m.", "Agonistas del receptor GLP-1: amigos o enemigos de la visión", "Dr. Edwin Martínez"),
    t("10:05 – 10:25 a. m.", "Estrabismo infantil: ¿Cuándo intervenir quirúrgicamente frente al tratamiento óptico?", "Dra. Karina Zambrano"),
    brk("10:25 – 10:55 a. m.", "Coffee Break · Receso"),
    t("11:00 – 11:20 a. m.", "Avances y Controversias en el manejo quirúrgico del trauma ocular y las fracturas orbitarias", "Dra. Laurent Dumont"),
    t("11:25 – 11:45 a. m.", "Fronteras en la emergencia ocular: De la sospecha al quirófano", "Dra. Daniela Díaz"),
    t("11:50 a. m. – 12:10 p. m.", "Situación actual de la cirugía de cataratas en el HCUAMP y perspectivas para el futuro", "Dr. Rafael Asuaje"),
    cer("12:30 p. m.", "Premiación al Mejor Adjunto y al Mejor Residente", "Servicio de Oftalmología"),
  ],
};

// ── Sesiones estructuradas según el cronograma oficial ─────────
const NONE: Session = { title: "Sin actividad", kind: "none" };

const EMERGENCIA: Session = {
  specialtyId: "emergencia",
  title: "Emergencia General",
  hours: "8:00 a. m. – 12:30 m. · Salón Principal",
  theme: "Triage: Del primer Contacto al manejo especializado",
  talks: [
    cer("8:00 – 8:20 a. m.", "Palabras de bienvenida", "Dr. Ángel Echenique"),
    t("8:20 – 8:40 a. m.", "Abordaje inmediato del politraumatizado y traslado prehospitalario", "Dr. José Rivas"),
    t("8:40 – 9:00 a. m.", "Triaje ABCDE del abordaje inicial", "Dr. Roxfrancys Guevara"),
    t("9:00 – 9:20 a. m.", "Alteración del estado de conciencia", "Dr. Axel Rodríguez"),
    t("9:20 – 9:30 a. m.", "Sesión de preguntas y respuestas", "Panel de ponentes"),
    brk("9:30 – 10:00 a. m.", "Coffee Break · Receso"),
    t("10:00 – 10:20 a. m.", "Código ICTUS", "Dra. Angi Bonito"),
    t("10:20 – 10:40 a. m.", "Arritmias graves", "Dr. Endher Castillo"),
    t("10:40 – 11:00 a. m.", "Manejo de insuficiencia respiratoria aguda", "Dr. Luis Anzola"),
    t("11:00 – 11:20 a. m.", "Rol crítico de enfermería en emergencia: acceso vascular y cuidado de vías centrales", "Lcdo. Roiber Figueredo"),
    t("11:20 – 11:40 a. m.", "Atención en saldo masivo de víctimas", "Dr. José Troncoso"),
    t("11:40 – 11:50 a. m.", "Sesión de preguntas y respuestas", "Panel de ponentes"),
    cer("11:50 a. m. – 12:30 m.", "Cierre y entrega de reconocimientos", "Comité Organizador"),
  ],
};

const REHABILITACION: Session = {
  specialtyId: "rehabilitacion",
  title: "Medicina Física y Rehabilitación",
  hours: "2:00 – 4:00 p. m. (14:00 - 16:00) · Salón Alterno",
  talks: [
    t("2:00 – 2:30 p. m.", "Estrategias en el hogar para el envejecimiento activo del adulto mayor", "Dra. María Gabriela Vásquez"),
    t("2:30 – 3:00 p. m.", "Rehabilitación Musculoesquelética. Estrategias para una rehabilitación efectiva", "Dra. Yajaira Alzuru"),
    t("3:00 – 3:30 p. m.", "Dolor cervical y problemas relacionados", "Dra. Yolanda Méndez"),
    t("3:30 – 4:00 p. m.", "Abordaje fisiátrico integral del dolor cervical", "Dra. Dayana Cauro"),
  ],
};

const SALUD_MENTAL: Session = {
  specialtyId: "salud-mental",
  title: "Salud Mental",
  hours: "4:15 – 4:45 p. m. (16:15 - 16:45) · Salón Alterno",
  talks: [
    t("4:15 – 4:45 p. m.", "Comunicación sexual y su influencia en la salud mental", "Msc. Pedro Silva y Msc. Claudia Flores"),
  ],
};

const GASTROENTEROLOGIA: Session = {
  specialtyId: "gastroenterologia",
  title: "Gastroenterología",
  hours: "8:30 a. m. – 12:30 m. · Salón Alterno",
  theme: "Programa de Vías Digestivas",
  moderator: "Dr. Amado Zambrano Ávila (Jefe del Servicio de Vías Digestivas HCUAMP)",
  talks: [
    t("8:30 – 8:55 a. m.", "Síndrome de intestino irritable – microbiota. Mesa redonda", "Lic. Luis Oropeza (Nutricionista / Psicólogo) / Dr. Alejandro Bethelmy (Gastroenterólogo)"),
    t("9:00 – 9:25 a. m.", "Ascitis: sus causas y manejo", "Dra. María Fernanda García (Gastroenterólogo UCLA)"),
    t("9:30 – 9:55 a. m.", "Sangrado digestivo alto y bajo manejos", "Dra. Yenlimar Torrealba (R1) y Dra. Angélica Belandria (R1)"),
    t("10:00 – 10:30 a. m.", "Hígado graso y el uso de los GLP-1", "Dr. Carlos Liriano (Gastroenterólogo UCLA)"),
    brk("10:30 – 11:00 a. m.", "Coffee Break · Receso"),
    t("11:00 – 11:45 a. m.", "Discusión clínica y ronda de preguntas", "Dr. Amado Zambrano Ávila y panel de especialistas"),
    cer("11:45 a. m. – 12:15 m.", "Cierre del bloque de Vías Digestivas", "Servicio de Vías Digestivas HCUAMP"),
  ],
};

const CARDIOLOGIA: Session = {
  specialtyId: "cardiologia",
  title: "Cardiología",
  hours: "2:00 – 5:30 p. m. (14:00 - 17:30) · Salón Alterno",
  theme: "DECISIONES CRÍTICAS EN SCA: El infarto que no espera, reconocimiento precoz desde la emergencia",
  talks: [
    cer("2:00 p. m.", "Palabras de bienvenida", "Dra. Yudith Angulo"),
    t("2:15 p. m.", "Dolor torácico desde la emergencia, el punto de partida básico", "Dra. Raquel González"),
    t("2:35 p. m.", "Quinta definición universal de infarto, asentando las bases", "Dr. Julio Medina"),
    t("2:55 p. m.", "Manejo del SCA sin elevación del ST, el más olvidado", "Dr. Aníbal Arroyo"),
    t("3:25 p. m.", "Sesión interactiva de preguntas y respuestas", "Panel de especialistas"),
    brk("3:50 – 4:10 p. m.", "Coffee Break · Receso"),
    t("4:10 p. m.", "Síndrome coronario agudo con elevación del ST, cuando el tiempo apremia", "Dr. Francisco Arias"),
    t("4:30 p. m.", "Trombosis intraventricular, la secuela embólica", "Dr. Endher Castillo"),
    t("4:50 p. m.", "Más allá del fármaco: intervención nutricional integral en el paciente cardiorenohepatometabólico", "Lic. Atagualpa Mejías"),
  ],
};

const TRAUMATOLOGIA: Session = {
  specialtyId: "traumatologia",
  title: "Traumatología",
  hours: "2:00 – 5:50 p. m. (14:00 - 17:50) · Salón Principal",
  talks: [
    cer("2:00 – 2:10 p. m.", "Palabras de Bienvenida y apertura del evento", "Comité Organizador"),
    t("2:15 – 2:30 p. m.", "Lesión del nervio radial asociada a fracturas: guía para no depender de la suerte", "Dr. Nelson Ures"),
    t("2:35 – 2:50 p. m.", "Rescate Articular en el Caos: Abordaje Quirúrgico y Reemplazo de Cadera en el Paciente Politraumatizado", "Dra. Iraiby Rodríguez"),
    t("2:55 – 3:10 p. m.", "Anterolateral en reconstrucción de Ligamento Cruzado Anterior", "Dr. Miguel Herrera"),
    t("3:15 – 3:30 p. m.", "Pilón Tibial: Expectativa Vs. Realidad", "Dr. Edgredy Guzmán"),
    brk("3:35 – 4:05 p. m.", "Coffee Break · Receso"),
    t("4:10 – 4:25 p. m.", "Osteotomía alrededor de la rodilla, cómo la planificamos y cómo la realizamos", "Dr. José Pulido"),
    t("4:30 – 4:45 p. m.", "Persistencia del dolor en el trauma vial: Del evento agudo al desarrollo de dolor crónico", "Dra. Verónica Rodríguez"),
    t("4:50 – 5:05 p. m.", "Manejo anestésico pre-trans y post quirúrgico del paciente politraumatizado", "Dr. Rafael Agüero"),
    t("5:10 – 5:25 p. m.", "Rehabilitar en la Emergencia: abordaje precoz del Médico Fisiatra en el manejo del paciente politraumatizado", "Dra. Carlana Chapón"),
    cer("5:30 – 5:50 p. m.", "Palabras de Cierre y Clausura del Bloque de Traumatología", "Comité Organizador"),
  ],
};

const CLAUSURA: Session = {
  title: "Acto de Clausura del Congreso",
  hours: "6:00 p. m. (18:00)",
  kind: "ceremony",
  talks: [
    cer("6:00 p. m.", "Palabras de cierre del Comité Organizador"),
    cer("6:20 p. m.", "Entrega de Premiaciones y Reconocimientos Institucionales"),
    cer("6:50 p. m.", "Clausura Oficial del XIV Congreso Pineda 2026"),
  ],
};

export const AGENDA: DaySchedule[] = [
  {
    id: "2026-11-02", day: 2, weekday: "Lunes",
    salones: {
      principal: { manana: INAUGURAL, tarde: ENFERMERIA },
      alterno: { manana: NONE, tarde: UROLOGIA },
    },
  },
  {
    id: "2026-11-03", day: 3, weekday: "Martes",
    salones: {
      principal: { manana: EMERGENCIA, tarde: NEUROCIRUGIA },
      alterno: { manana: IMAGENES, tarde: [REHABILITACION, SALUD_MENTAL] },
    },
  },
  {
    id: "2026-11-04", day: 4, weekday: "Miércoles",
    salones: {
      principal: { manana: GINECO, tarde: ANESTESIOLOGIA },
      alterno: { manana: GASTROENTEROLOGIA, tarde: CARDIOLOGIA },
    },
  },
  {
    id: "2026-11-05", day: 5, weekday: "Jueves",
    salones: {
      principal: { manana: CIRUGIA_PLASTICA, tarde: CIRUGIA_GENERAL },
      alterno: { manana: DERMATOLOGIA, tarde: ORL },
    },
  },
  {
    id: "2026-11-06", day: 6, weekday: "Viernes",
    salones: {
      principal: { manana: MED_INTERNA, tarde: [TRAUMATOLOGIA, CLAUSURA] },
      alterno: { manana: OFTALMOLOGIA, tarde: NONE },
    },
  },
];

/** Localiza dónde se presenta una especialidad (para enlazar desde las fichas). */
export function findSpecialtySlot(specialtyId: string) {
  for (const [dayIndex, d] of AGENDA.entries()) {
    for (const salon of ["principal", "alterno"] as Salon[]) {
      for (const turno of ["manana", "tarde"] as Turno[]) {
        const sessionData = d.salones[salon][turno];
        const sessions = Array.isArray(sessionData) ? sessionData : [sessionData];
        if (sessions.some((s) => s.specialtyId === specialtyId)) {
          return { dayIndex, salon, turno, day: d.day, weekday: d.weekday };
        }
      }
    }
  }
  return undefined;
}
