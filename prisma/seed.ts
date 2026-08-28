import { PrismaClient, Role, Org, ConversationStatus } from "@prisma/client";
import { hashPassword } from "../lib/passwords";
import type { TalentSchool } from "../lib/talent";

const prisma = new PrismaClient();

// Misma contraseña para todas las cuentas de demo/seed — debe coincidir con
// TEST_PASSWORD en e2e/helpers.ts, que loguea contra estas mismas cuentas.
const SEED_PASSWORD = "TestPass123!";

async function main() {
  const passwordHash = await hashPassword(SEED_PASSWORD);
  const cohort = await prisma.cohort.upsert({
    where: { id: "seed-cohort-2026-1" },
    update: {},
    create: {
      id: "seed-cohort-2026-1",
      name: "Cohorte 2026-1",
      isActive: true,
    },
  });

  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, guestModeEnabled: false },
  });

  // Cuentas de demo, tratadas como si ya hubieran consentido y con
  // contraseña ya puesta — no pasan por el flujo real de /invite/[token]
  // (ver SPEC-onboarding.md). Puesto tanto en `create` como en `update`:
  // mismo aprendizaje que el bug ya documentado de `update: {}` que dejaba
  // nombres desactualizados al re-correr el seed sobre datos existentes.
  const consent = {
    consentDataProcessingAt: new Date(),
    consentDirectoryAt: new Date(),
    passwordHash,
  };

  const fakeUsers: Array<{
    email: string;
    name: string;
    role: Role;
    org?: Org;
  }> = [
    { email: "admin@demo.board", name: "Admin Demo", role: Role.ADMIN },
    { email: "emprendedor@demo.board", name: "Ana Gómez", role: Role.EMPRENDEDOR },
    { email: "empleable@demo.board", name: "Carlos Ruiz", role: Role.EMPLEABLE },
    { email: "eafit@demo.board", name: "Equipo EAFIT (Demo)", role: Role.INSTITUCION, org: Org.EAFIT },
    { email: "andi@demo.board", name: "Equipo ANDI (Demo)", role: Role.INSTITUCION, org: Org.ANDI },
  ];

  const userIds: Record<string, string> = {};
  for (const user of fakeUsers) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, org: user.org, ...consent },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        org: user.org,
        cohortId: cohort.id,
        ...consent,
      },
    });
    userIds[user.email] = created.id;
  }

  console.log(`Seed base: cohorte "${cohort.name}" + ${fakeUsers.length} usuarios ficticios.`);

  // --- Empresas (ruta de emprendimiento) ---------------------------------

  type CompanySeed = {
    email: string;
    name: string;
    ownerName: string;
    tagline: string;
    sector: string;
    description: string;
    purpose: string;
    values: string;
    valueProp: string;
    founders: { name: string; bio: string }[];
    website?: string;
    contactLink?: string;
    contactLinkPublic?: boolean;
  };

  const companies: CompanySeed[] = [
    {
      email: "emprendedor@demo.board",
      name: "Café Sereno",
      ownerName: "Ana Gómez",
      tagline: "Café de origen, tostado en pequeños lotes en Antioquia",
      sector: "Alimentos y bebidas",
      description:
        "Compramos café directo a caficultores de Jardín y Andes (Antioquia), pagando entre 20% y 40% más que el precio de bolsa, y tostamos en lotes pequeños para conservar el perfil de cada finca.",
      purpose: "Que cada caficultor reciba un precio justo por su trabajo, sin intermediarios.",
      values: "Trazabilidad, comercio justo, calidad sobre volumen.",
      valueProp:
        "Café 100% trazable: sabes exactamente qué finca, qué caficultor y qué proceso hay detrás de cada bolsa.",
      founders: [
        { name: "Ana Gómez", bio: "Ingeniera agrónoma, creció en una finca cafetera en Jardín, Antioquia." },
      ],
      website: "https://cafesereno.co",
      contactLink: "https://wa.me/573001112233",
      contactLinkPublic: true,
    },
    {
      email: "emprendedor2@demo.board",
      name: "Rutas Verdes",
      ownerName: "Julián Restrepo",
      tagline: "Última milla en bicicleta para restaurantes y mercados de barrio",
      sector: "Logística",
      description:
        "Operamos una flota de bicicletas de carga eléctricas para llevar pedidos de mercados y restaurantes locales en Medellín, sin emisiones y con tiempos de entrega menores a 30 minutos en el centro y el poblado.",
      purpose: "Reducir la dependencia de moto-carga contaminante en el centro de la ciudad.",
      values: "Cero emisiones, puntualidad, trato justo al repartidor.",
      valueProp: "Entregas más rápidas que una moto en hora pico, sin generar contaminación.",
      founders: [
        { name: "Julián Restrepo", bio: "Ex-gerente de operaciones en una app de domicilios, 6 años en logística urbana." },
        { name: "Camila Vargas", bio: "Diseñadora industrial, diseñó el sistema de carga de las bicicletas." },
      ],
      contactLinkPublic: false,
    },
    {
      email: "emprendedor3@demo.board",
      name: "Nido",
      ownerName: "Laura Sánchez",
      tagline: "Coworking con cuidado infantil incluido",
      sector: "Servicios / bienestar laboral",
      description:
        "Un espacio de trabajo compartido en Laureles donde los padres pueden trabajar mientras sus hijos están en una sala de cuidado supervisada, a pocos metros, con actividades pensadas por edad.",
      purpose: "Que ser madre o padre no signifique elegir entre trabajar y estar presente.",
      values: "Flexibilidad real, comunidad, cero culpa.",
      valueProp: "El único coworking de Medellín donde no tienes que elegir entre la reunión y el niño enfermo en casa.",
      founders: [
        { name: "Laura Sánchez", bio: "Madre de dos hijos, dejó su cargo corporativo para resolver el problema que vivió ella misma." },
      ],
      website: "https://nido.com.co",
    },
    {
      email: "emprendedor4@demo.board",
      name: "Textil Circular",
      ownerName: "Andrés Peña",
      tagline: "Ropa hecha con textiles industriales que nadie más quiere",
      sector: "Moda sostenible",
      description:
        "Recolectamos retazos y excedentes de las fábricas textiles de confección en el Valle de Aburrá y los transformamos en prendas de edición limitada, evitando que terminen en relleno sanitario.",
      purpose: "Demostrar que la moda sostenible puede ser deseable, no solo responsable.",
      values: "Cero desperdicio, diseño primero, transparencia de origen.",
      valueProp: "Cada prenda es única — literalmente no se puede repetir el mismo retazo dos veces.",
      founders: [
        { name: "Andrés Peña", bio: "Diseñador de modas, trabajó 4 años en control de calidad de una textilera grande antes de independizarse." },
      ],
      contactLink: "https://instagram.com/textilcircular",
      contactLinkPublic: true,
    },
    {
      email: "emprendedor5@demo.board",
      name: "Studio Claro",
      ownerName: "Mariana Ossa",
      tagline: "Arquitectura para renovar apartamentos pequeños sin obras eternas",
      sector: "Arquitectura y diseño",
      description:
        "Renovamos apartamentos de menos de 70m² en Medellín con un proceso estandarizado de 6 semanas: diseño, cotización cerrada y ejecución con un solo equipo de obra, sin sorpresas de presupuesto.",
      purpose: "Que renovar la casa no sea un proceso de un año y mil dolores de cabeza.",
      values: "Presupuesto cerrado, tiempos cumplidos, diseño que sí funciona en espacios chicos.",
      valueProp: "Precio y fecha de entrega fijos desde el primer día — no hay 'imprevistos' que inflen la cotización.",
      founders: [
        { name: "Mariana Ossa", bio: "Arquitecta, especializada en interiorismo de espacios reducidos." },
      ],
    },
    {
      email: "emprendedor6@demo.board",
      name: "Vitral Salud",
      ownerName: "Esteban Londoño",
      tagline: "Terapia psicológica online para profesionales jóvenes",
      sector: "Salud mental",
      description:
        "Plataforma de videoconsulta con psicólogos clínicos verificados, con planes mensuales pensados para el bolsillo de alguien que recién empieza a trabajar, no para pago por sesión suelta.",
      purpose: "Que buscar ayuda psicológica no dependa de tener un buen seguro o mucho ahorro.",
      values: "Confidencialidad, precios honestos, sin lista de espera.",
      valueProp: "Primera cita en menos de 48 horas, con un plan mensual más barato que una sesión particular suelta.",
      founders: [
        { name: "Esteban Londoño", bio: "Psicólogo clínico, trabajó en salud ocupacional antes de fundar Vitral." },
      ],
      contactLinkPublic: false,
    },
    {
      email: "emprendedor7@demo.board",
      name: "Peso Justo",
      ownerName: "Daniela Marín",
      tagline: "Microcréditos para vendedores informales, sin trámites de banco",
      sector: "Fintech",
      description:
        "Damos microcréditos de bajo monto a vendedores de plaza de mercado y tiendas de barrio evaluados con historial de ventas real (no historial crediticio formal), con desembolso el mismo día.",
      purpose: "Que un vendedor informal pueda crecer su negocio sin caer en el gota a gota.",
      values: "Transparencia total en tasas, evaluación humana, respeto por el cliente.",
      valueProp: "Aprobación en 24 horas evaluando ventas reales, no un puntaje de central de riesgo.",
      founders: [
        { name: "Daniela Marín", bio: "Economista, trabajó 5 años en microfinanzas en una ONG antes de fundar Peso Justo." },
        { name: "Felipe Cardona", bio: "Ingeniero de sistemas, construyó el modelo de evaluación de riesgo." },
      ],
      website: "https://pesojusto.co",
    },
  ];

  for (const c of companies) {
    if (!userIds[c.email]) {
      const u = await prisma.user.upsert({
        where: { email: c.email },
        update: { ...consent },
        create: {
          email: c.email,
          name: c.ownerName,
          role: Role.EMPRENDEDOR,
          cohortId: cohort.id,
          ...consent,
        },
      });
      userIds[c.email] = u.id;
    }
    await prisma.company.upsert({
      where: { ownerId: userIds[c.email] },
      update: {},
      create: {
        ownerId: userIds[c.email],
        cohortId: cohort.id,
        name: c.name,
        tagline: c.tagline,
        sector: c.sector,
        description: c.description,
        purpose: c.purpose,
        values: c.values,
        valueProp: c.valueProp,
        founders: c.founders,
        website: c.website,
        contactLink: c.contactLink,
        contactLinkPublic: c.contactLinkPublic ?? false,
      },
    });
  }

  console.log(`Seed empresas: ${companies.length} empresas ficticias.`);

  // --- Perfiles de talento (ruta de empleabilidad) -----------------------

  type TalentSeed = {
    email: string;
    name: string;
    headline: string;
    school: TalentSchool;
    experienceYears: number;
    postgraduates?: string;
    experienceAreas: string;
    motivations?: string;
    isEmployed: boolean;
    isSeekingWork: boolean;
    employmentStatusVisible?: boolean;
    linkedinUrl: string;
    contactLink?: string;
    contactLinkPublic?: boolean;
  };

  const talents: TalentSeed[] = [
    {
      email: "empleable@demo.board",
      name: "Carlos Ruiz",
      headline: "Analista de datos",
      school: "Ingeniería",
      experienceYears: 4,
      postgraduates: "Especialización en Ciencia de Datos, Universidad EAFIT",
      experienceAreas: "Analítica de retail, dashboards en Power BI, modelos de demanda",
      motivations: "Busca un rol remoto o híbrido en analítica, idealmente en retail o consumo masivo.",
      isEmployed: false,
      isSeekingWork: true,
      linkedinUrl: "https://linkedin.com/in/carlos-ruiz-demo",
    },
    {
      email: "empleable2@demo.board",
      name: "Valentina Correa",
      headline: "Especialista en marketing digital",
      school: "Comunicación",
      experienceYears: 3,
      postgraduates: "Diplomado en Growth Marketing",
      experienceAreas: "Pauta en Meta e Instagram Ads, email marketing, SEO básico",
      motivations: "Le interesa marketing para marcas de consumo o e-commerce en crecimiento.",
      isEmployed: true,
      isSeekingWork: true,
      employmentStatusVisible: false,
      linkedinUrl: "https://linkedin.com/in/valentina-correa-demo",
    },
    {
      email: "empleable3@demo.board",
      name: "Santiago Ochoa",
      headline: "Ingeniero industrial, recién graduado",
      school: "Ingeniería",
      experienceYears: 0,
      experienceAreas: "Mejora de procesos, logística, prácticas en manufactura",
      motivations: "Su primer empleo formal — abierto a logística, operaciones o cadena de suministro.",
      isEmployed: false,
      isSeekingWork: true,
      linkedinUrl: "https://linkedin.com/in/santiago-ochoa-demo",
      contactLink: "https://wa.me/573009876543",
      contactLinkPublic: true,
    },
    {
      email: "empleable4@demo.board",
      name: "Isabella Muñoz",
      headline: "Diseñadora UX/UI",
      school: "Arquitectura y Diseño",
      experienceYears: 5,
      postgraduates: "Maestría en Diseño de Experiencia de Usuario",
      experienceAreas: "Investigación de usuarios, prototipado en Figma, design systems",
      motivations: "Busca proyectos freelance mientras encuentra un rol de tiempo completo en producto.",
      isEmployed: false,
      isSeekingWork: true,
      linkedinUrl: "https://linkedin.com/in/isabella-munoz-demo",
    },
    {
      email: "empleable5@demo.board",
      name: "Juan Pablo Zapata",
      headline: "Analista financiero",
      school: "Economía y Finanzas",
      experienceYears: 6,
      postgraduates: "Especialización en Finanzas Corporativas",
      experienceAreas: "Modelos financieros, presupuesto, análisis de inversión",
      motivations: "Interesado en banca de inversión o finanzas corporativas en empresas medianas.",
      isEmployed: true,
      isSeekingWork: false,
      linkedinUrl: "https://linkedin.com/in/juanpablo-zapata-demo",
    },
    {
      email: "empleable6@demo.board",
      name: "Daniela Higuita",
      headline: "Desarrolladora backend (Node.js, Python)",
      school: "Ingeniería",
      experienceYears: 2,
      experienceAreas: "APIs REST, bases de datos relacionales, integración con pasarelas de pago",
      motivations: "Busca un equipo de producto donde pueda crecer técnicamente, remoto de preferencia.",
      isEmployed: false,
      isSeekingWork: true,
      linkedinUrl: "https://linkedin.com/in/daniela-higuita-demo",
      contactLinkPublic: false,
    },
    {
      email: "empleable7@demo.board",
      name: "Miguel Ángel Torres",
      headline: "Profesional en Gestión Humana",
      school: "Administración",
      experienceYears: 8,
      postgraduates: "Especialización en Gerencia del Talento Humano",
      experienceAreas: "Selección, formación, clima organizacional",
      motivations: "Le interesa liderar procesos de talento en empresas en crecimiento acelerado.",
      isEmployed: true,
      isSeekingWork: true,
      employmentStatusVisible: false,
      linkedinUrl: "https://linkedin.com/in/miguelangel-torres-demo",
    },
    {
      email: "empleable8@demo.board",
      name: "Paula Andrea Restrepo",
      headline: "Ingeniera civil, gestión de proyectos",
      school: "Ingeniería",
      experienceYears: 10,
      postgraduates: "PMP en curso",
      experienceAreas: "Interventoría de obra, cronogramas, control de costos",
      motivations: "Busca dar el salto a un rol de coordinación de proyectos, no solo obra.",
      isEmployed: false,
      isSeekingWork: true,
      linkedinUrl: "https://linkedin.com/in/paula-restrepo-demo",
    },
    {
      email: "empleable9@demo.board",
      name: "Tomás Vélez",
      headline: "Community manager bilingüe (español/inglés)",
      school: "Comunicación",
      experienceYears: 1,
      experienceAreas: "Redes sociales, redacción de contenido, atención al cliente en redes",
      motivations: "Abierto a trabajo remoto para marcas internacionales o agencias.",
      isEmployed: false,
      isSeekingWork: true,
      linkedinUrl: "https://linkedin.com/in/tomas-velez-demo",
      contactLink: "https://wa.me/573001239876",
      contactLinkPublic: true,
    },
  ];

  for (const t of talents) {
    if (!userIds[t.email]) {
      const u = await prisma.user.upsert({
        where: { email: t.email },
        update: { ...consent },
        create: {
          email: t.email,
          name: t.name,
          role: Role.EMPLEABLE,
          cohortId: cohort.id,
          ...consent,
        },
      });
      userIds[t.email] = u.id;
    }
    await prisma.talentProfile.upsert({
      where: { ownerId: userIds[t.email] },
      // A diferencia del resto del registro (sin tocar, por si la persona ya
      // lo editó desde /perfil), experienceYears/school son campos nuevos que
      // nadie pudo haber editado todavía — se actualizan igual en un re-seed
      // para que las filas ya creadas antes de esta migración dejen de tener
      // el valor de relleno (0 / "Otra") de la migración.
      update: { experienceYears: t.experienceYears, school: t.school },
      create: {
        ownerId: userIds[t.email],
        cohortId: cohort.id,
        headline: t.headline,
        school: t.school,
        experienceYears: t.experienceYears,
        postgraduates: t.postgraduates,
        experienceAreas: t.experienceAreas,
        motivations: t.motivations,
        isEmployed: t.isEmployed,
        isSeekingWork: t.isSeekingWork,
        employmentStatusVisible: t.employmentStatusVisible ?? true,
        linkedinUrl: t.linkedinUrl,
        contactLink: t.contactLink,
        contactLinkPublic: t.contactLinkPublic ?? false,
      },
    });
  }

  console.log(`Seed talento: ${talents.length} perfiles ficticios.`);

  // --- Conversaciones (mensajería) ----------------------------------------

  type ConversationSeed = {
    fromEmail: string;
    toEmail: string;
    status: ConversationStatus;
    messages: { fromEmail: string; body: string }[];
  };

  const conversationSeeds: ConversationSeed[] = [
    {
      // Pendiente: Julián (Rutas Verdes) le escribió a Carlos, sin respuesta todavía.
      fromEmail: "emprendedor2@demo.board",
      toEmail: "empleable@demo.board",
      status: ConversationStatus.PENDING,
      messages: [
        {
          fromEmail: "emprendedor2@demo.board",
          body: "Hola Carlos, vi tu perfil de analítica — en Rutas Verdes estamos buscando a alguien para modelar demanda de entregas. ¿Te interesaría charlar?",
        },
      ],
    },
    {
      // Aceptada, con intercambio: Laura (Nido) e Isabella (UX) ya se pusieron de acuerdo.
      fromEmail: "emprendedor3@demo.board",
      toEmail: "empleable4@demo.board",
      status: ConversationStatus.ACCEPTED,
      messages: [
        {
          fromEmail: "emprendedor3@demo.board",
          body: "Hola Isabella, me encantó tu portafolio. Estamos por rediseñar la app de reservas de Nido, ¿tienes disponibilidad para un proyecto freelance corto?",
        },
        {
          fromEmail: "empleable4@demo.board",
          body: "¡Hola Laura! Sí, tengo disponibilidad desde la próxima semana. ¿Me cuentas más del alcance?",
        },
        {
          fromEmail: "emprendedor3@demo.board",
          body: "Perfecto, te escribo esta semana con el brief completo. ¡Gracias!",
        },
      ],
    },
    {
      // Rechazada: no todas las solicitudes se aceptan.
      fromEmail: "emprendedor6@demo.board",
      toEmail: "empleable7@demo.board",
      status: ConversationStatus.DECLINED,
      messages: [
        {
          fromEmail: "emprendedor6@demo.board",
          body: "Hola Miguel, ¿estarías interesado en apoyarnos con selección de personal en Vitral Salud?",
        },
      ],
    },
    {
      // Institución también inicia y sostiene conversaciones (decisión ya
      // tomada en CAPABILITY-MAP.md) — EAFIT recomendando a Santiago.
      fromEmail: "eafit@demo.board",
      toEmail: "empleable3@demo.board",
      status: ConversationStatus.ACCEPTED,
      messages: [
        {
          fromEmail: "eafit@demo.board",
          body: "Hola Santiago, desde EAFIT te queremos poner en contacto con una empresa aliada que busca un perfil como el tuyo en logística. ¿Te gustaría que te recomendemos?",
        },
        {
          fromEmail: "empleable3@demo.board",
          body: "¡Hola! Sí, claro, muchas gracias por pensar en mí.",
        },
      ],
    },
  ];

  for (const conv of conversationSeeds) {
    const initiatorId = userIds[conv.fromEmail];
    const recipientId = userIds[conv.toEmail];
    if (!initiatorId || !recipientId) continue;

    const conversation = await prisma.conversation.upsert({
      where: { initiatorId_recipientId: { initiatorId, recipientId } },
      update: {},
      create: { initiatorId, recipientId, status: conv.status },
    });

    const existingMessages = await prisma.message.count({
      where: { conversationId: conversation.id },
    });
    if (existingMessages === 0) {
      for (let i = 0; i < conv.messages.length; i++) {
        const m = conv.messages[i];
        // Deja el último mensaje sin leer (salvo que la conversación esté
        // rechazada) para que el badge de "no leído" se vea en el demo.
        const isLastUnread = i === conv.messages.length - 1 && conv.status !== ConversationStatus.DECLINED;
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: userIds[m.fromEmail],
            body: m.body,
            readAt: isLastUnread ? null : new Date(),
          },
        });
      }
    }
  }

  console.log(`Seed mensajería: ${conversationSeeds.length} conversaciones ficticias.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
