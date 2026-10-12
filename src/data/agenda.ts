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
  title: "Ginecoobstetricia",
  talks: [
    t("8:30 a. m.", "Apertura"),
    t("8:55 a. m.", "Utilidad de la histerosonografía como método diagnóstico de patologías endometriales en pacientes con sangrado uterino anormal", "Dra. Sofía Brito"),
    t("9:20 a. m.", "Actualización en menopausia y climaterio", "Dra. Katiuska Ríos"),
    t("9:45 a. m.", "Enfermedad trofoblástica gestacional", "Dra. Sunangela Escalona"),
    t("10:10 a. m.", "Manejo de la embarazada con patología de tiroides", "Dr. Miguel Vargas"),
    brk("10:30 a. m.", "Coffee Break · Receso"),
    t("11:00 a. m.", "Tema por confirmar", "Dr. Héctor Quiroga", true),
    t("11:25 a. m.", "Fenotipos hemodinámicos de preeclampsia", "Dr. Miguel Vargas"),
    t("11:50 a. m.", "Simuladores de preeclampsia", "Dra. Alexandra Rivero"),
    cer("12:30 p. m.", "Premiación: Mejor Adjunto y Mejor Residente"),
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

// ── Sesiones estructuradas según el cronograma oficial ─────────
const NONE: Session = { title: "Sin actividad", kind: "none" };

const EMERGENCIA: Session = {
  specialtyId: "emergencia",
  title: "Emergencia",
  note: "Horarios de las ponencias por confirmar.",
  talks: [
    t(undefined, "Triage avanzado y reanimación en trauma severo", undefined, true),
    t(undefined, "Sepsis y shock séptico: protocolo de la primera hora", undefined, true),
    t(undefined, "Manejo del síndrome coronario agudo en la emergencia", undefined, true),
    t(undefined, "Estatus epiléptico y emergencias neurológicas agudas", undefined, true),
    t(undefined, "Vía aérea difícil en la sala de emergencia", undefined, true),
    t(undefined, "Cetoacidosis diabética y crisis hiperosmolar", undefined, true),
    t(undefined, "Intoxicaciones agudas de mayor prevalencia regional", undefined, true),
  ],
};

const REHABILITACION: Session = {
  specialtyId: "rehabilitacion",
  title: "Medicina Física y Rehabilitación",
  hours: "2:00 – 4:00 p. m. (14:00 - 16:00)",
  note: "Horarios de las ponencias por confirmar.",
  talks: [
    t("2:00 p. m.", "Intervención precoz de rehabilitación en el paciente hospitalizado", undefined, true),
    t("2:40 p. m.", "Manejo integral del dolor musculoesquelético crónico", undefined, true),
    t("3:20 p. m.", "Rehabilitación neurofuncional post-evento cerebrovascular", undefined, true),
  ],
};

const SALUD_MENTAL: Session = {
  specialtyId: "salud-mental",
  title: "Salud Mental",
  hours: "4:00 – 6:00 p. m. (16:00 - 18:00)",
  note: "Horarios de las ponencias por confirmar.",
  talks: [
    t("4:00 p. m.", "Abordaje interdisciplinario en crisis y urgencias psiquiátricas", undefined, true),
    t("4:40 p. m.", "Impacto neuropsiquiátrico en pacientes post-quirúrgicos y crónicos", undefined, true),
    t("5:20 p. m.", "Salud mental del personal de salud: prevención del síndrome de burnout", undefined, true),
  ],
};

const GASTROENTEROLOGIA: Session = {
  specialtyId: "gastroenterologia",
  title: "Gastroenterología",
  note: "Horarios de las ponencias por confirmar.",
  talks: [
    t(undefined, "Hemorragia digestiva superior: abordaje endoscópico urgente", undefined, true),
    t(undefined, "Enfermedades inflamatorias intestinales: diagnóstico y retos terapéuticos", undefined, true),
    t(undefined, "Enfoque actual del paciente con cirrosis y sus complicaciones", undefined, true),
    t(undefined, "Lesiones premalignas gástricas y tamizaje de cáncer", undefined, true),
    t(undefined, "Actualización en pancreatitis aguda biliar", undefined, true),
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
  hours: "2:00 – 6:00 p. m. (14:00 - 18:00)",
  note: "Horarios de las ponencias por confirmar.",
  talks: [
    t(undefined, "Fracturas complejas de pelvis y acetábulo: principios de fijación", undefined, true),
    t(undefined, "Control de daños en ortopedia y politraumatismo", undefined, true),
    t(undefined, "Infecciones periprotésicas y osteomielitis: estrategias actuales", undefined, true),
    t(undefined, "Lesiones multiligamentarias de rodilla en el paciente joven", undefined, true),
    t(undefined, "Artroplastia primaria vs. rescate en fracturas del adulto mayor", undefined, true),
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
