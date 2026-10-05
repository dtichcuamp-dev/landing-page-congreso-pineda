import type { Turno } from "./pricing";

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
  salones: Record<Salon, Record<Turno, Session>>;
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
  title: "Acto Inaugural",
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
  note: "Horarios de las ponencias por confirmar.",
  talks: [
    t(undefined, "Historia clínica como método diagnóstico eficaz", "Dra. Isbel González"),
    t(undefined, "Anticoagulación en casos especiales", "Dra. Yedalith Pernalete"),
    t(undefined, "Neuroinfecciones y encefalitis autoinmune: del LCR al tratamiento empírico", "Dr. José Mejías"),
    t(undefined, "Síndromes paraneoplásicos: la pista sistémica del cáncer oculto", "Dra. María Estefanía Fernández"),
    t(undefined, "El eje cardiorrenometabólico: prescripción orientada al riesgo organocéntrico", "Dra. Indira Acosta"),
    t(undefined, "Obesidad sarcopénica y fenotipificación de la composición corporal", "Dr. Ludwig Rivero"),
    t(undefined, "Preeclampsia: una misma tensión arterial, 2 fenotipos", "Dr. Ángel Echenique"),
    t(undefined, "Vasculitis sistémicas: del síndrome a la interpretación serológica", "Dra. Gabriela Caldera"),
  ],
};

const ENFERMERIA: Session = {
  specialtyId: "enfermeria",
  title: "Enfermería",
  talks: [
    t("2:00 p. m.", "Apertura"),
    t("2:20 p. m.", "Neumoprotección en el neonato ventilado", "Lcda. Yilbexy Rodríguez / Lcda. Fabiana Sánchez"),
    t("2:50 p. m.", "De la cama a la bipedestación: fisioterapia, osteomuscular y estabilidad hemodinámica", "Lcdo. Alberto Pargas"),
    brk("3:20 p. m.", "Coffee break"),
    t("3:45 p. m.", "Ronda de preguntas y respuestas"),
    t("4:00 p. m.", "Rol de Enfermería en la humanización de los usuarios en el área de Emergencia General", "Lcda. Maurimar Escalona"),
    t("4:30 p. m.", "Ronda de preguntas y respuestas"),
    t("5:00 p. m.", "Aplicación de los códigos en el área de triaje de Emergencia General", "Lcda. María Celeste Sánchez"),
  ],
};

const NEUROCIRUGIA: Session = {
  specialtyId: "neurocirugia",
  title: "Neurocirugía",
  talks: [
    cer("2:00 p. m.", "Palabras de bienvenida e instalación", "Dr. Williams Arrieche, Jefe del Servicio"),
    cer("2:15 p. m.", "Palabras de apertura", "Dr. Kenny Mejías, Jefe de Residentes"),
    t("2:30 p. m.", "Abordaje endoscópico de columna: «Curva de aprendizaje»", "Dr. Williams Gutiérrez"),
    t("2:50 p. m.", "Abordaje retrosigmoideo", "Dr. Daher"),
    t("3:10 p. m.", "Nuevos conceptos en disrrafismo espinal", "Dra. Cobos"),
    t("3:30 p. m.", "Ablación cerebral en patologías psiquiátricas (trastornos de agresividad)", "Dr. Juan Abud"),
    t("3:50 p. m.", "Monitoreo neurológico multimodal para la predicción diagnóstica de isquemia en los clipajes de aneurismas cerebrales", "Dra. Thair Moreno"),
    t("4:10 p. m.", "Foro de preguntas y respuestas · Panel interactivo con todos los ponentes"),
    cer("4:40 p. m.", "Clausura"),
  ],
};

const IMAGENES: Session = {
  specialtyId: "imagenes",
  title: "Diagnóstico por Imágenes",
  theme: "Imágenes que salvan vidas: desafíos multidisciplinarios en el área de emergencia",
  talks: [
    t("8:30 a. m.", "Bienvenida y apertura"),
    t("9:00 a. m.", "Traumatismo craneoencefálico: claves radiológicas en la toma de decisión quirúrgica vs. expectante", "Dra. Maruja Hidalgo y Dr. Ygnacio Ramírez"),
    t("9:30 a. m.", "Evaluación radiológica de la pelvis traumática: signos de inestabilidad e impacto en la conducta quirúrgica", "Dr. Douglas García y Dr. Alejandro Orduz"),
    t("10:00 a. m.", "Ecografía pulmonar en emergencias: diagnóstico rápido a la cabecera del paciente", "Dra. María Gonzales y Dra. Karla Tamayo"),
    t("10:30 a. m.", "Algoritmo imagenológico en la embarazada", "Dr. Carlos Roa"),
    brk("10:30 – 10:50 a. m."),
    t("10:50 a. m.", "Trauma abdominal agudo: triage imagenológico eficiente entre Eco FAST y TC", "Dra. Laura Prado y Dr. Richard Oropeza"),
    t("11:20 a. m.", "Intervencionismo y emergencia: accesos vasculares ecoguiados para un procedimiento seguro", "Dr. Nelson Garcías"),
    t("12:00 m.", "Cierre"),
  ],
};

const ANESTESIOLOGIA: Session = {
  specialtyId: "anestesiologia",
  title: "Anestesiología",
  theme: "Desafíos críticos en anestesiología y reanimación",
  moderator: "Dr. Revilla",
  talks: [
    cer("2:00 p. m.", "Palabras de bienvenida", "Dr. Alonzo García y Dra. Cayama"),
    t("2:20 p. m.", "Mutaciones mitocondriales y su impacto en la sociedad venezolana", "Dra. Metzi Navas"),
    t("2:50 p. m.", "Uso de análogos de GLP-1: dilemas y repercusiones en el acto anestésico (Ozempic)", "Dr. Berrios"),
    t("3:20 p. m.", "Actualización en manejo hemodinámico avanzado", "Dra. Quiroz / Dr. Pablo Herrera"),
    brk("3:45 p. m.", "Coffee break"),
    t("4:25 p. m.", "Opciones prácticas en dolor oncológico: rompiendo la dependencia de la elastomérica", "Dra. Verónica Rodríguez"),
    t("4:55 p. m.", "Manejo de emergencia masiva y evento catastrófico", "Dr. Salazar"),
    cer("5:20 p. m.", "Cierre"),
  ],
};

const GINECO: Session = {
  specialtyId: "ginecobstetricia",
  title: "Ginecobstetricia",
  talks: [
    t("8:30 a. m.", "Apertura"),
    t("8:55 a. m.", "Utilidad de la histerosonografía como método diagnóstico de patologías endometriales en pacientes con sangrado uterino anormal", "Dra. Sofía Brito"),
    t("9:20 a. m.", "Actualización en menopausia y climaterio", "Dra. Katiuska Ríos"),
    t("9:45 a. m.", "Enfermedad trofoblástica gestacional", "Dra. Sunangela Escalona"),
    t("10:10 a. m.", "Manejo de la embarazada con patología de tiroides", "Dr. Miguel Vargas"),
    brk("10:30 a. m."),
    t("11:00 a. m.", "Tema por confirmar", "Dr. Héctor Quiroga", true),
    t("11:25 a. m.", "Fenotipos hemodinámicos de preeclampsia", "Dr. Miguel Vargas"),
    t("11:50 a. m.", "Simuladores de preeclampsia", "Dra. Alexandra Rivero"),
    cer("12:30 p. m.", "Premiación: Mejor Adjunto y Mejor Residente"),
  ],
};

const CIRUGIA_PLASTICA: Session = {
  specialtyId: "cirugia-plastica",
  title: "Cirugía Plástica",
  theme: "Rol de la Cirugía Plástica y Reconstructiva en el tratamiento integral del cáncer de mama",
  talks: [
    t("8:30 a. m.", "Apertura y bienvenida"),
    t("9:00 a. m.", "Papel del mastólogo en el tratamiento del cáncer de mama", "Dr. Pernalete"),
    t("9:40 a. m.", "Opciones reconstructivas que brindan confort a las pacientes con patología de cáncer de mama", "Dra. Isturiz"),
    brk("10:10 a. m.", "Coffee break"),
    t("10:40 a. m.", "Complicaciones del colgajo miocutáneo dorsal ancho", "Dr. García Orangel"),
    t("11:20 a. m.", "Reconstrucción del complejo areola-pezón (CAP)", "Dra. Solórzano"),
    t("12:00 m.", "Ronda de preguntas y respuestas"),
    cer("12:40 p. m.", "Acto de clausura: mejor adjunto, mejor residente y mejor servicio"),
  ],
};

const CIRUGIA_GENERAL: Session = {
  specialtyId: "cirugia-general",
  title: "Cirugía General",
  theme: "El bisturí digital: la imagenología en manos del cirujano",
  note: "Ponentes por confirmar.",
  talks: [
    t("2:00 p. m.", "Apertura"),
    t("2:20 p. m.", "Imágenes en el postoperatorio complicado: abordaje tomográfico en el diagnóstico, clasificación y conducta de fístulas y fugas anastomóticas", undefined, true),
    t("2:50 p. m.", "Planificación tomográfica de la pared abdominal compleja: volumetría, pérdida de dominio y mapas anatómicos para la separación de componentes", undefined, true),
    t("3:20 p. m.", "Navegando la vía biliar: colangiografía intraoperatoria vs. colangiorresonancia preoperatoria", undefined, true),
    brk("3:45 p. m.", "Coffee break"),
    t("4:00 p. m.", "Evaluación RM de alta resolución en adenocarcinoma rectal: correlación preoperatoria del mesorrecto y el margen de resección circunferencial (CRM)", undefined, true),
    t("4:30 p. m.", "El cirujano explorando el cuello: mapeo ecográfico preoperatorio para patología tiroidea, marcaje de incisiones y evaluación de adenopatías", undefined, true),
    t("5:00 p. m.", "Imágenes para decidir en el trauma torácico: de la radiografía simple en el shock room a la TC volumétrica", undefined, true),
    t("5:30 p. m.", "Radiología intervencionista vista desde el bisturí: ¿drenaje percutáneo suficiente o reintervención?", undefined, true),
    cer("5:40 p. m.", "Cierre"),
  ],
};

const DERMATOLOGIA: Session = {
  specialtyId: "dermatologia",
  title: "Dermatología",
  theme: "Dermatitis atópica de la A hasta la Z",
  talks: [
    t("8:30 a. m.", "Dermatitis atópica: generalidades", "Dra. Graciela María González Padilla"),
    t("8:50 a. m.", "Microbiota cutánea y su relación con las infecciones en el paciente atópico", "Dr. Karim Moukhallalele Saman"),
    t("9:10 a. m.", "Cuidado de la piel del paciente atópico", "Dra. Julia Rothe de Arocha"),
    t("9:30 a. m.", "Manejo de la dermatitis atópica en el adulto", "Dra. María Graciete Nunes Contreras"),
    t("9:50 a. m.", "Queratosis pilaris", "Dr. José Luis Narváez Villarroel"),
    t("10:10 a. m.", "La esfera psicológica del paciente atópico y sus familiares", "Lcda. en Psicología María Valentina Perdomo"),
    t("10:30 a. m.", "La nutrición del paciente atópico como parte del abordaje integral", "Lcda. en Nutrición Jenny Arrellano Quintero"),
    t("11:10 a. m.", "¿La ecografía cutánea en el paciente atópico es diferente?", "Dra. Claudia Beatriz González Ditta"),
    cer("11:30 a. m.", "Cierre y entrega de premios"),
  ],
};

const ORL: Session = {
  specialtyId: "orl",
  title: "ORL",
  talks: [
    cer("2:00 p. m.", "Palabras de bienvenida e instalación", "Dra. Elvymar Carmona, Jefe del Servicio de ORL"),
    cer("2:30 p. m.", "Palabras de apertura", "Dra. Yaselin Soler, Coordinadora de Postgrado de ORL"),
    t("3:00 p. m.", "Diagnóstico del vértigo agudo en la emergencia: valor clínico y aplicación del protocolo HINTS", "Dra. Alexandra Hagovian"),
    t("3:30 p. m.", "Impacto funcional de las maniobras quirúrgicas en rinoplastia", "Dra. María Jesús Rojas"),
    brk("3:30 – 3:45 p. m.", "Coffee break"),
    t("3:50 p. m.", "Angina de Ludwig: hasta dónde llega el otorrinolaringólogo", "Dr. Adrián Mast"),
    t("4:20 p. m.", "Esenciales en el manejo de la patología laríngea", "Dra. Leicy Carrasco"),
    cer("4:40 p. m.", "Clausura"),
  ],
};

const UROLOGIA: Session = {
  specialtyId: "urologia",
  title: "Urología",
  theme: "Uroinnovación: de la evidencia a la práctica",
  moderator: "Dra. Gabriela Santiago / Dr. Víctor Contreras",
  note: "Horarios de las ponencias por confirmar.",
  talks: [
    cer(undefined, "Palabras de bienvenida", "Dra. Yngrid Pacheco"),
    t(undefined, "ELUTAX-3: un dispositivo innovador para estenosis de vías urinarias", "Dr. Narciel Sáez / Dr. Joseph Sáez"),
    t(undefined, "Urología de transición: el puente entre dos mundos", "Dr. Jesús Fernández Tang"),
    t(undefined, "Cáncer de próstata oligometastásico", "Dr. Adelino Andrade"),
    t(undefined, "Disfunción eréctil, ¿cómo abordarla?", "Dra. Soli Molina"),
    t(undefined, "Nuevas tecnologías en urología", "Dr. Manuel Castro"),
    t(undefined, "Estética masculina", "Dr. Christian Araujo"),
  ],
};

const OFTALMOLOGIA: Session = {
  specialtyId: "oftalmologia",
  title: "Oftalmología",
  talks: [
    t("8:30 a. m.", "Apertura"),
    t("8:50 a. m.", "Revelaciones de la retina: diagnóstico temprano y salud sistémica", "Dra. Carla Rojas"),
    t("9:15 a. m.", "Glaucoma al día: avances diagnósticos y abordajes de última generación", "Dra. Aura Álvarez"),
    t("9:40 a. m.", "Utilidad de la campimetría automatizada en el diagnóstico de la enfermedad neurológica", "Dr. Edwin Martínez"),
    t("10:05 a. m.", "Estrabismo infantil: ¿cuándo intervenir quirúrgicamente frente al tratamiento óptico?", "Dra. Karina Zambrano"),
    brk("10:25 – 10:55 a. m."),
    t("11:00 a. m.", "Avances y controversias en el manejo quirúrgico del trauma ocular y las fracturas orbitarias", "Dra. Laurent Dumont"),
    t("11:25 a. m.", "Fronteras en la emergencia ocular: de la sospecha al quirófano", "Dra. Daniela Díaz"),
    t("11:50 a. m.", "Situación actual de la cirugía de cataratas en el HCUAMP y perspectivas para el futuro", "Dr. Rafael Asuaje"),
    cer("12:30 p. m.", "Premiación: Mejor Adjunto y Mejor Residente"),
  ],
};

// ── Sesiones sin documento de programa (solo distribución oficial) ─────────
const basic = (specialtyId: string, title: string): Session => ({ specialtyId, title });
const NONE: Session = { title: "Sin actividad", kind: "none" };

export const AGENDA: DaySchedule[] = [
  {
    id: "2026-11-02", day: 2, weekday: "Lunes",
    salones: {
      principal: { manana: INAUGURAL, tarde: MED_INTERNA },
      alterno: { manana: NONE, tarde: ENFERMERIA },
    },
  },
  {
    id: "2026-11-03", day: 3, weekday: "Martes",
    salones: {
      principal: { manana: basic("emergencia", "Emergencia y UCI"), tarde: NEUROCIRUGIA },
      alterno: { manana: IMAGENES, tarde: basic("rehabilitacion", "Rehabilitación") },
    },
  },
  {
    id: "2026-11-04", day: 4, weekday: "Miércoles",
    salones: {
      principal: { manana: GINECO, tarde: ANESTESIOLOGIA },
      alterno: { manana: basic("gastroenterologia", "Gastroenterología"), tarde: basic("cardiologia", "Cardiología") },
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
      principal: {
        manana: UROLOGIA,
        tarde: { specialtyId: "traumatologia", title: "Traumatología y Acto de Clausura" },
      },
      alterno: {
        manana: OFTALMOLOGIA,
        tarde: { title: "Premios de Pósters", kind: "ceremony" },
      },
    },
  },
];

/** Localiza dónde se presenta una especialidad (para enlazar desde las fichas). */
export function findSpecialtySlot(specialtyId: string) {
  for (const [dayIndex, d] of AGENDA.entries()) {
    for (const salon of ["principal", "alterno"] as Salon[]) {
      for (const turno of ["manana", "tarde"] as Turno[]) {
        if (d.salones[salon][turno].specialtyId === specialtyId) {
          return { dayIndex, salon, turno, day: d.day, weekday: d.weekday };
        }
      }
    }
  }
  return undefined;
}
