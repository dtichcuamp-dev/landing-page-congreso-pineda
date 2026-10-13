export interface HonoreeMilestone {
  year: string;
  title: string;
  institution: string;
  description: string;
  badge?: string;
}

export interface HonoreeLeadership {
  period: string;
  role: string;
  service: string;
  isCurrent?: boolean;
}

export interface HonoreeAward {
  title: string;
  event: string;
  description: string;
  year?: string;
  highlight?: boolean;
}

export interface HonoreeSociety {
  name: string;
  acronyms?: string[];
  since: string;
  scope: string;
}

export const HONOREE = {
  name: "Dr. Samir Saba Kahwati",
  prefix: "Homenajeado de Honor",
  eyebrow: "Homenaje",
  tagline: "Maestro de la Ginecología y Obstetricia, Formador de Generaciones y Cirujano Insigne del HCUAMP",
  birthDate: "20 de mayo de 1952",
  birthPlace: "Aleppo, Siria",
  arrivalVenezuela: "1957",
  earlyEducation: [
    { level: "Educación Primaria", school: "Escuela Pública Ciudad de Maracay" },
    { level: "Educación Secundaria", school: "Colegio San Vicente de Paúl (Barquisimeto)" },
  ],
  quote:
    "Más de 40 años dedicados con profunda vocación, rigor científico y entrega humana a la salud materna, la docencia médica universitaria y el engrandecimiento del Hospital Central Universitario Dr. Antonio María Pineda.",
  
  milestones: [
    {
      year: "1982",
      title: "Médico Cirujano",
      institution: "Universidad Centroccidental Lisandro Alvarado (UCLA)",
      description: "Graduado con honores en la Promoción 11 de Médicos Cirujanos de la UCLA.",
      badge: "Promoción 11 UCLA",
    },
    {
      year: "1982 – 1984",
      title: "Internado Rotatorio",
      institution: "HCUAMP · Hospital de Sarare",
      description: "Dos años de formación clínica y quirúrgica integral al servicio de la región.",
      badge: "2 años de internado",
    },
    {
      year: "1984 – 1985",
      title: "Residente Asistencial de GyO",
      institution: 'Hospital Central Universitario "Dr. Antonio María Pineda"',
      description: "Residencia asistencial en el servicio de Ginecología y Obstetricia.",
      badge: "Residente GyO",
    },
    {
      year: "1985 – 1988",
      title: "Residencia de Posgrado en GyO",
      institution: "UCLA · HCUAMP",
      description: "Especialización de posgrado en Ginecología y Obstetricia culminada con máxima excelencia académica.",
      badge: "Especialista GyO",
    },
    {
      year: "1988 – Presente",
      title: "Especialista y Docente Universitario",
      institution: "HCUAMP · UCLA",
      description: "Inicia formalmente como especialista adjunto de GyO en el HCUAMP y docente universitario en la UCLA, liderando la formación de cientos de médicos y especialistas.",
      badge: "Especialista y Docente",
    },
  ] as HonoreeMilestone[],

  leadership: [
    {
      period: "1994 – 1998",
      role: "Jefe de Servicio",
      service: "Servicio GO3 (Ginecología y Obstetricia)",
    },
    {
      period: "1998",
      role: "Coordinador General de Pregrado",
      service: "Departamento de Ginecología y Obstetricia (UCLA / HCUAMP)",
    },
    {
      period: "1999 – 2000",
      role: "Jefe de Servicio",
      service: "Servicio GO2 (Ginecología y Obstetricia)",
    },
    {
      period: "2000 – 2006",
      role: "Jefe de Servicio",
      service: "Servicio de Ginecología",
    },
    {
      period: "2006 – Actualidad",
      role: "Jefe de Servicio",
      service: "Servicio GO4 (Ginecología y Obstetricia)",
      isCurrent: true,
    },
  ] as HonoreeLeadership[],

  awards: [
    {
      title: 'Premio "Dr. Pablo Acosta Ortiz"',
      event: "I Congreso Pineda (2001)",
      description: "Otorgado al Servicio de Ginecología por ser el servicio más destacado de todo el hospital bajo su liderazgo.",
      highlight: true,
    },
    {
      title: 'Premio "Dr. Antonio María Pineda"',
      event: "I Congreso Pineda (2001)",
      description: 'Conferido al mejor trabajo de índole médico realizado en el estado Lara, titulado: "Prueba de trabajo de parto en cesareada anterior".',
      highlight: true,
    },
    {
      title: 'Premio "Dr. Octavio Seijas"',
      event: "Lapso 1990 – 1991",
      description: "Al Médico Adjunto de mejor actuación durante el periodo en el Departamento de Ginecología y Obstetricia del HCUAMP.",
    },
    {
      title: "Placa de Reconocimiento como Trabajador Insigne",
      event: "Julio de 1998",
      description: "Por su incansable entrega, probidad profesional y destacada labor institucional al servicio de la salud pública.",
    },
  ] as HonoreeAward[],

  societies: [
    {
      name: "Colegio de Médicos del Estado Lara",
      since: "Desde junio de 1982",
      scope: "Gremial y Profesional",
    },
    {
      name: "Sociedad de Obstetricia y Ginecología de Venezuela (SOGV), FLASOG y FIGO",
      acronyms: ["SOGV", "FLASOG", "FIGO"],
      since: "Miembro activo desde julio de 1989",
      scope: "Sociedad Nacional, Latinoamericana e Internacional",
    },
    {
      name: "Asociación de Profesores de la UCLA (APUCLA, antigua APUCO)",
      acronyms: ["APUCLA"],
      since: "Miembro activo desde 1990",
      scope: "Académico y Docente Universitario",
    },
    {
      name: "Sociedad Venezolana de Ultrasonido en Medicina (AVUM)",
      acronyms: ["AVUM"],
      since: "Miembro activo desde 1991",
      scope: "Científico y Diagnóstico por Ultrasonido",
    },
  ] as HonoreeSociety[],
};
