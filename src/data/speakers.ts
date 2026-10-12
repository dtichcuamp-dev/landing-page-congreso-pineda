export interface FeaturedSpeaker {
  id: string;
  name: string;
  role: string;
  specialty: string;
  specialtyId: string;
  talkTitle: string;
  dayLabel: string;
  time: string;
  salon: string;
  image: string;
  bio?: string;
  flipHorizontal?: boolean;
}

export const FEATURED_SPEAKERS: FeaturedSpeaker[] = [
  {
    id: "jesus-fernandez",
    name: "Dr. Jesús Fernández Tang",
    role: "Cirujano General · Urólogo",
    specialty: "Urología",
    specialtyId: "urologia",
    talkTitle: "Urología de transición: el puente entre dos mundos",
    dayLabel: "Lunes 02 de noviembre",
    time: "2:50 – 3:00 p. m.",
    salon: "Salón Alterno",
    image: "/images/speakers/speaker-5.jpg",
    bio: "Especialista del Servicio de Urología del HCUAMP. Experto en patología urológica reconstructiva y transicional.",
  },
  {
    id: "hugo-cifuentes",
    name: "Dr. Hugo Cifuentes Díaz",
    role: "Especialista en Otorrinolaringología · UCLA Medicina",
    specialty: "Otorrinolaringología (ORL)",
    specialtyId: "orl",
    talkTitle: "Claves para el abordaje seguro de los senos paranasales",
    dayLabel: "Jueves 05 de noviembre",
    time: "4:20 – 4:40 p. m.",
    salon: "Salón Alterno",
    image: "/images/speakers/speaker-4.jpg",
    bio: "Docente universitario y especialista en cirugía rinosinusal y base de cráneo anterior.",
  },
  {
    id: "christian-araujo",
    name: "Dr. Christian Araujo Castillo",
    role: "Cirujano General · Residente de Urología (R3)",
    specialty: "Urología",
    specialtyId: "urologia",
    talkTitle: "Estética Masculina",
    dayLabel: "Lunes 02 de noviembre",
    time: "4:50 – 5:00 p. m.",
    salon: "Salón Alterno",
    image: "/images/speakers/speaker-2.jpg",
    bio: "Cirujano en formación de alta especialidad urológica y reconstructiva en el HCUAMP.",
  },
  {
    id: "medicina-interna-dr",
    name: "Dr. José Mejías",
    role: "Especialista en Medicina Interna",
    specialty: "Medicina Interna",
    specialtyId: "medicina-interna",
    talkTitle: "Neuroinfecciones y encefalitis autoinmune: del LCR a tratamiento empírico",
    dayLabel: "Viernes 06 de noviembre",
    time: "9:30 – 9:50 a. m.",
    salon: "Salón Principal",
    image: "/images/speakers/speaker-3.jpg",
    bio: "Médico internista del HCUAMP, abocado al diagnóstico avanzado en patologías neuroinfecciosas y autoinmunes.",
    flipHorizontal: true,
  },
  {
    id: "ramon-aguilar",
    name: "Dr. Ramón Aguilar",
    role: "Docente y Facultativo Médico",
    specialty: "Sesión Inaugural · Medicina",
    specialtyId: "medicina-interna",
    talkTitle: "Semblanza del Dr. Juan Alberto Olivares",
    dayLabel: "Lunes 02 de noviembre",
    time: "10:30 – 11:00 a. m.",
    salon: "Salón Principal",
    image: "/images/speakers/speaker-1.jpg",
    bio: "Reconocido profesor y referente clínico en la docencia de postgrado médico del estado Lara.",
  },
];
