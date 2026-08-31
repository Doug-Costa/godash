import { PrismaClient, ProductCategory, ProductSubType } from '@prisma/client';

const prisma = new PrismaClient();

interface CourseSeed {
  code: number;
  name: string;
  category: ProductCategory;
  subType: ProductSubType;
  specialty: string;
  aliases: string[];
}

const COURSES_DATA: CourseSeed[] = [
  {
    code: 23,
    name: 'Excelência na Ortodontia',
    category: 'CURSO',
    subType: 'EXCELENCIA',
    specialty: 'ORTODONTIA',
    aliases: ['23', 'EXCELENCIA NA ORTODONTIA', 'EXCELENCIA ORTODONTIA', 'CURSO EXCELENCIA NA ORTODONTIA']
  },
  {
    code: 26,
    name: 'Aperfeiçoamento em Cirurgia de Dentes Retidos',
    category: 'CURSO',
    subType: 'APERFEICOAMENTO',
    specialty: 'CIRURGIA_BUCOMAXILO',
    aliases: ['26', 'APERFEIÇOAMENTO EM CIRURGIA DE DENTES RETIDOS', 'CIRURGIA DE DENTES RETIDOS', 'DENTES RETIDOS']
  },
  {
    code: 27,
    name: 'Aperfeiçoamento em Dentística Restauradora',
    category: 'CURSO',
    subType: 'APERFEICOAMENTO',
    specialty: 'DENTISTICA_ESTETICA',
    aliases: ['27', 'APERFEIÇOAMENTO EM DENTISTICA RESTAURADORA', 'APERFEICOAMENTO EM DENTISTICA RESTAURADORA', 'DENTISTICA RESTAURADORA']
  },
  {
    code: 28,
    name: 'Aperfeiçoamento em DTM e Dor Orofacial',
    category: 'CURSO',
    subType: 'APERFEICOAMENTO',
    specialty: 'DTM_DOR_OROFACIAL',
    aliases: ['28', '85', 'APERFEIÇOAMENTO EM DTM', 'APERFEICOAMENTO EM DTM', 'DTM']
  },
  {
    code: 34,
    name: 'Imersão em Cirurgias Plásticas Periodontais e Periimplantares',
    category: 'CURSO',
    subType: 'IMERSAO',
    specialty: 'PERIODONTIA',
    aliases: ['34', 'IMERSAO EM CIRURGIA PLASTICA PERIODONTAL E PERIIMPLANTAR', 'CIRURGIAS PLASTICAS PERIODONTAIS', 'PLASTICA PERIODONTAL']
  },
  {
    code: 42,
    name: 'Especialização em Implantodontia',
    category: 'CURSO',
    subType: 'ESPECIALIZACAO',
    specialty: 'IMPLANTODONTIA',
    aliases: ['42', 'ESPECIALIZAÇÃO EM IMPLANTODONTIA', 'ESPECIALIZACAO EM IMPLANTODONTIA', 'IMPLANTODONTIA']
  },
  {
    code: 43,
    name: 'Especialização em Prótese Dentária',
    category: 'CURSO',
    subType: 'ESPECIALIZACAO',
    specialty: 'PROTESE_DENTARIA',
    aliases: ['43', 'ESPECIALIZAÇÃO EM PROTESE', 'ESPECIALIZACAO EM PROTESE', 'PROTESE DENTARIA']
  },
  {
    code: 44,
    name: 'Especialização em Endodontia',
    category: 'CURSO',
    subType: 'ESPECIALIZACAO',
    specialty: 'ENDODONTIA',
    aliases: ['44', '48', 'ESPECIALIZAÇÃO ENDODONTIA', 'ESPECIALIZACAO EM ENDODONTIA', 'ESPECIALZAÇAO ENDODONTIA', 'ENDODONTIA']
  },
  {
    code: 45,
    name: 'Especialização em Ortodontia',
    category: 'CURSO',
    subType: 'ESPECIALIZACAO',
    specialty: 'ORTODONTIA',
    aliases: ['45', 'ESPECIALIZAÇÃO EM ORTODONTIA', 'ESPECIALIZACAO EM ORTODONTIA', 'ORTODONTIA']
  },
  {
    code: 51,
    name: 'Excelência na Estética',
    category: 'CURSO',
    subType: 'EXCELENCIA',
    specialty: 'DENTISTICA_ESTETICA',
    aliases: ['51', 'EXCELENCIA NA ESTETICA', 'ESTETICA DENTAL']
  },
  {
    code: 52,
    name: 'Excelência na Implantodontia',
    category: 'CURSO',
    subType: 'EXCELENCIA',
    specialty: 'IMPLANTODONTIA',
    aliases: ['52', 'EXCELÊNCIA NA IMPLANTODONTIA', 'EXCELENCIA NA IMPLANTODONTIA']
  },
  {
    code: 58,
    name: 'Imersão em DTM para Ortodontistas',
    category: 'CURSO',
    subType: 'IMERSAO',
    specialty: 'DTM_DOR_OROFACIAL',
    aliases: ['58', 'IMERSAO EM DTM PARA ORTODONTISTAS', 'DTM PARA ORTODONTISTAS']
  },
  {
    code: 60,
    name: 'Imersão em Laminados Cerâmicos Clínico',
    category: 'CURSO',
    subType: 'IMERSAO',
    specialty: 'DENTISTICA_ESTETICA',
    aliases: ['60', 'IMERSAO EM LAMINADOS CERAMICOS CLINICO', 'IMERSAO EM LAMINADO CERAMICOS', 'LAMINADOS CERAMICOS']
  },
  {
    code: 62,
    name: 'Imersão em Mecânica Ortodôntica',
    category: 'CURSO',
    subType: 'IMERSAO',
    specialty: 'ORTODONTIA',
    aliases: ['62', 'IMERSAO EM MECANICA ORTODONTICA', 'IMERSAO EM MACANICA ORTODONTICA', 'MECANICA ORTODONTICA']
  },
  {
    code: 65,
    name: 'Imersão em Mini-Implantes Extrarradiculares',
    category: 'CURSO',
    subType: 'IMERSAO',
    specialty: 'ORTODONTIA',
    aliases: ['65', 'IMERSÃO EM MINI-IMPLANTES EXTRARRADICULARES', 'IMERSAO EM MINI-IMPLANTES EXTRARRADICULARES', 'MINI IMPLANTES EXTRARRADICULARES']
  },
  {
    code: 68,
    name: 'Aperfeiçoamento em Ortodontia Avançada',
    category: 'CURSO',
    subType: 'APERFEICOAMENTO',
    specialty: 'ORTODONTIA',
    aliases: ['68', 'APERFEIÇOAMENTO EM ORTODONTIA AVANÇADA', 'ORTODONTIA AVANÇADA']
  },
  {
    code: 72,
    name: 'Excelência em DTM',
    category: 'CURSO',
    subType: 'EXCELENCIA',
    specialty: 'DTM_DOR_OROFACIAL',
    aliases: ['72', 'EXCELENCIA EM DTM', 'EXCELENCIA DTM']
  },
  {
    code: 73,
    name: 'Excelência na Endodontia',
    category: 'CURSO',
    subType: 'EXCELENCIA',
    specialty: 'ENDODONTIA',
    aliases: ['73', 'EXCELENCIA NA ENDODONTIA', 'EXCELENCIA ENDODONTIA']
  },
  {
    code: 74,
    name: 'Aperfeiçoamento em Estética Vermelha e Branca',
    category: 'CURSO',
    subType: 'APERFEICOAMENTO',
    specialty: 'DENTISTICA_ESTETICA',
    aliases: ['74', 'APERFEIÇOAMENTO EM ESTETICA VERMELHA E BRANCA', 'ESTETICA VERMELHA E BRANCA']
  },
  {
    code: 75,
    name: 'Aperfeiçoamento em Prótese sobre Implante',
    category: 'CURSO',
    subType: 'APERFEICOAMENTO',
    specialty: 'PROTESE_DENTARIA',
    aliases: ['75', 'APERFEIÇOAMENTO EM PROTESE SOBRE IMPLANTE', 'APERFEIÇOAMENTO EM PROTESE SOBRE IMPLANTES', 'PROTESE SOBRE IMPLANTE']
  },
  {
    code: 76,
    name: 'Aperfeiçoamento Master em Reabilitação Estética e Funcional',
    category: 'CURSO',
    subType: 'APERFEICOAMENTO',
    specialty: 'PROTESE_DENTARIA',
    aliases: ['76', 'APERFEIÇOAMENTO EM MASTER EM REABILITAÇAO ESTETICA E FUNCIONAL', 'REABILITAÇÃO ESTETICA E FUNCIONAL']
  },
  {
    code: 77,
    name: 'Imersão em Correção de Sorriso Gengival e Recobrimento Radicular',
    category: 'CURSO',
    subType: 'IMERSAO',
    specialty: 'PERIODONTIA',
    aliases: ['77', 'IMERSÃO EM CORREÇÃO DE SORRISO GENGIVAL E RECOBRIMENTO RADICULAR', 'SORRISO GENGIVAL']
  },
  {
    code: 78,
    name: 'Curso Online Agnesia',
    category: 'CURSO',
    subType: 'ONLINE',
    specialty: 'ORTODONTIA',
    aliases: ['78', 'CURSO ONLINE AGNESIA', 'AGNESIA', 'IMERSAO EM DIAGNÓSTICO EM ORTODONTIA AVANÇADA']
  },
  {
    code: 79,
    name: 'Imersão em Osseodensificação e Endoday',
    category: 'CURSO',
    subType: 'IMERSAO',
    specialty: 'IMPLANTODONTIA',
    aliases: ['79', 'IMERSAO EM OSSEODENSIFICAÇÃO', 'IMERSAO EM ENDODAY', 'ENDODAY', 'OSSEODENSIFICAÇÃO']
  },
  {
    code: 80,
    name: 'Mentoria do Sono / Odontologia do Sono',
    category: 'CURSO',
    subType: 'IMERSAO',
    specialty: 'DTM_DOR_OROFACIAL',
    aliases: ['80', 'MENTORIA DO SONO', 'IMERSÃO EM ODONTOLOGIA DO SONO', 'ODONTOLOGIA DO SONO', 'CURSO MENTORIA DO SONO']
  },
  {
    code: 81,
    name: 'Imersão em Cannabis Medicinal na Odontologia',
    category: 'CURSO',
    subType: 'IMERSAO',
    specialty: 'TERAPIAS_INTEGRATIVAS',
    aliases: ['81', 'IMERSAO EM CANNABIS', 'CANNABIS', 'CANABIDIOL']
  },
  {
    code: 82,
    name: 'Imersão em MARPE - Expansão Maxilar Ancorada em Mini-Implantes',
    category: 'CURSO',
    subType: 'IMERSAO',
    specialty: 'ORTODONTIA',
    aliases: ['82', 'IMERSÃO EM MARPE - EXPANSÃO MAXILAR ANCORADA EM MINI-IMPLANTES', 'IMERSAO EM PLANEJAMENTO REABILITADOR - OCLUSÃO E ESTÉTICA', 'MARPE']
  },
  {
    code: 84,
    name: 'Especialização em Harmonização Orofacial',
    category: 'CURSO',
    subType: 'ESPECIALIZACAO',
    specialty: 'HARMONIZACAO_FACIAL',
    aliases: ['84', 'ESPECIALIZAÇÃO EM HARMONIZAÇÃO', 'ESPECIALIZAÇÃO EM HARMONIZAÇÃO HOROFACIL', 'HARMONIZACAO OROFACIAL']
  },
  {
    code: 88,
    name: 'Imersão em Toxina Botulínica e Botox',
    category: 'CURSO',
    subType: 'IMERSAO',
    specialty: 'HARMONIZACAO_FACIAL',
    aliases: ['88', 'TOXINA BOTULINICA', 'IMERSÃO EM TOXINA', 'BOTOX']
  },
  {
    code: 90,
    name: 'Excelência em Alinhadores',
    category: 'CURSO',
    subType: 'EXCELENCIA',
    specialty: 'ORTODONTIA',
    aliases: ['90', 'EXCELENCIA EM ALINHADORES', 'ALINHADORES', 'EXCELENCIA ALINHADORES']
  },
  {
    code: 92,
    name: 'Imersão em Documentação Audiovisual',
    category: 'CURSO',
    subType: 'IMERSAO',
    specialty: 'GESTAO_MARKETING',
    aliases: ['92', 'IMERSÃO EM DOCUMENTAÇÃO AUDIOVISUAL', 'DOCUMENTACAO AUDIOVISUAL']
  },
  {
    code: 94,
    name: 'Excelência em Harmonização Facial',
    category: 'CURSO',
    subType: 'EXCELENCIA',
    specialty: 'HARMONIZACAO_FACIAL',
    aliases: ['94', 'EXCELENCIA EM HARMONIZAÇÃO FACIAL', 'EXCELENCIA EM HARMONIZAÇÃO', 'EXCELENCIA EM HARMONIZACAO']
  },
  {
    code: 96,
    name: 'Curso Online - Diagnóstico em Ortodontia',
    category: 'CURSO',
    subType: 'ONLINE',
    specialty: 'ORTODONTIA',
    aliases: ['96', 'CURSO ONLINE - DIAGNOSTICO EM ORTODONTIA', 'DIAGNOSTICO EM ORTODONTIA ONLINE']
  },
  {
    code: 97,
    name: 'Imersão em Soluções Restauradoras em Dentes Posteriores e Labial',
    category: 'CURSO',
    subType: 'IMERSAO',
    specialty: 'DENTISTICA_ESTETICA',
    aliases: ['97', 'IMERSÃO EM SOLUÇÕES RESTAURADORAS EM DENTES POSTERIORES', 'IMERSÃO EM ESCULTURA E SIMETRIA LABIAL', 'ESTETICA E COSMETICOS']
  },
  {
    code: 98,
    name: 'Especialização em Dentística Restauradora',
    category: 'CURSO',
    subType: 'ESPECIALIZACAO',
    specialty: 'DENTISTICA_ESTETICA',
    aliases: ['98', 'ESPECIALIZAÇÃO EM DENTISTICA RESTAURADOURA', 'ESPECIALIZAÇÃO EM DENTISTICA RESTAURADORA']
  },
  {
    code: 99,
    name: 'Imersão em Enxertos Ósseos',
    category: 'CURSO',
    subType: 'IMERSAO',
    specialty: 'IMPLANTODONTIA',
    aliases: ['99', 'IMERSAO EM ENXERTOS OSSEOS', 'ENXERTOS OSSEOS']
  },
  {
    code: 100,
    name: 'Imersão em APM',
    category: 'CURSO',
    subType: 'IMERSAO',
    specialty: 'ORTODONTIA',
    aliases: ['100', 'IMERSÃO EM APM', 'APM']
  }
];

function normalizeWithSpaces(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCompact(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

async function main() {
  console.log('🌱 Semeando Catálogo de Cursos Reais da Dental Press com Especialidades...');

  let createdCount = 0;
  let aliasCount = 0;

  for (const course of COURSES_DATA) {
    // 1. Upsert Product
    const product = await prisma.product.upsert({
      where: { id: `course_${course.code}` },
      update: {
        name: course.name,
        category: course.category,
        subType: course.subType,
        specialty: course.specialty,
        isActive: true
      },
      create: {
        id: `course_${course.code}`,
        name: course.name,
        category: course.category,
        subType: course.subType,
        specialty: course.specialty,
        isActive: true
      }
    });

    createdCount++;

    // 2. Upsert Aliases
    const allAliases = [
      ...course.aliases,
      course.name,
      String(course.code)
    ];

    for (const rawAlias of allAliases) {
      const normSpaces = normalizeWithSpaces(rawAlias);
      const normCompact = normalizeCompact(rawAlias);

      const targets = [normSpaces, normCompact].filter(Boolean);

      for (const normalizedValue of targets) {
        try {
          await prisma.productAlias.upsert({
            where: { normalizedValue },
            update: {
              productId: product.id,
              rawValue: rawAlias
            },
            create: {
              productId: product.id,
              rawValue: rawAlias,
              normalizedValue
            }
          });
          aliasCount++;
        } catch (err) {
          // Ignora duplicados no mesmo lote
        }
      }
    }
  }

  console.log(`✅ Sucesso: ${createdCount} Cursos Oficiais e ${aliasCount} Aliases de Reconhecimento foram cadastrados!`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
