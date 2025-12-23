/**
 * SCRIPT DE CARGA DE PROCESSOS DE NEGÓCIO - BROWSER CONSOLE
 * VERSÃO CORRIGIDA - Campos compatíveis com interface ProcessoNegocio
 */

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     CARGA DE PROCESSOS DE NEGÓCIO - VERSÃO CORRIGIDA      ║');
console.log('╚════════════════════════════════════════════════════════════╝');

const processosData = [
  {
    id: "admn-00001",
    identificacao: "ADMN-00001",
    descricao: "Gestão de Contratos Administrativos",
    areaResponsavel: "Administração",
    nivelMaturidade: "Inicial",
    frequencia: "Ad-Hoc",
    duracaoMedia: 8,
    complexidade: "Média",
    normas: [
      {
        id: "norma-iso9001-001",
        nome: "ISO 9001",
        tipo: "Norma Técnica",
        descricao: "Sistema de Gestão da Qualidade",
        itemNorma: "Cláusula 8.4",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      },
      {
        id: "norma-lei8666-001",
        nome: "Lei nº 8.666/93",
        tipo: "Norma Reguladora",
        descricao: "Lei de Licitações e Contratos",
        itemNorma: "Art. 54 a 88",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      }
    ]
  },
  {
    id: "fina-00001",
    identificacao: "FINA-00001",
    descricao: "Controle de Contas a Pagar",
    areaResponsavel: "Financeiro",
    nivelMaturidade: "Inicial",
    frequencia: "Ad-Hoc",
    duracaoMedia: 8,
    complexidade: "Média",
    normas: [
      {
        id: "norma-ifrs9-001",
        nome: "IFRS 9",
        tipo: "Regulamentação Internacional",
        descricao: "Instrumentos Financeiros",
        itemNorma: "Seção 5.5",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      },
      {
        id: "norma-bacen-001",
        nome: "Resolução BACEN nº 4.557",
        tipo: "Norma Reguladora",
        descricao: "Gerenciamento de riscos",
        itemNorma: "Capítulo III",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      }
    ]
  },
  {
    id: "tech-00001",
    identificacao: "TECH-00001",
    descricao: "Desenvolvimento de Software",
    areaResponsavel: "Tecnologia da Informação",
    nivelMaturidade: "Inicial",
    frequencia: "Ad-Hoc",
    duracaoMedia: 8,
    complexidade: "Média",
    normas: [
      {
        id: "norma-iso27001-001",
        nome: "ISO/IEC 27001",
        tipo: "Norma Técnica",
        descricao: "Segurança da Informação",
        itemNorma: "Anexo A.14",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      },
      {
        id: "norma-gdpr-001",
        nome: "GDPR",
        tipo: "Regulamentação Internacional",
        descricao: "Proteção de Dados - UE",
        itemNorma: "Art. 25",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      }
    ]
  },
  {
    id: "saude-00001",
    identificacao: "SAUDE-00001",
    descricao: "Atendimento Ambulatorial",
    areaResponsavel: "Saúde",
    nivelMaturidade: "Inicial",
    frequencia: "Ad-Hoc",
    duracaoMedia: 8,
    complexidade: "Média",
    normas: [
      {
        id: "norma-nr32-001",
        nome: "NR-32",
        tipo: "Norma Reguladora",
        descricao: "Segurança em serviços de saúde",
        itemNorma: "Item 32.2",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      },
      {
        id: "norma-anvisa-001",
        nome: "ANVISA RDC nº 301/2019",
        tipo: "Norma Reguladora",
        descricao: "Boas Práticas de Fabricação",
        itemNorma: "Capítulo 5",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      },
      {
        id: "norma-iec62304-001",
        nome: "IEC 62304",
        tipo: "Norma Técnica",
        descricao: "Software para dispositivos médicos",
        itemNorma: "Seção 5.1",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Não Obrigatória",
        status: "Ativo"
      }
    ]
  },
  {
    id: "elet-00001",
    identificacao: "ELET-00001",
    descricao: "Manutenção de Infraestrutura Elétrica",
    areaResponsavel: "Engenharia",
    nivelMaturidade: "Inicial",
    frequencia: "Ad-Hoc",
    duracaoMedia: 8,
    complexidade: "Média",
    normas: [
      {
        id: "norma-nr10-001",
        nome: "NR-10",
        tipo: "Norma Reguladora",
        descricao: "Segurança em eletricidade",
        itemNorma: "Item 10.2",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      },
      {
        id: "norma-nbr5410-001",
        nome: "ABNT NBR 5410",
        tipo: "Norma Técnica",
        descricao: "Instalações elétricas de baixa tensão",
        itemNorma: "Seção 5",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      }
    ]
  },
  {
    id: "aces-00001",
    identificacao: "ACES-00001",
    descricao: "Adequação de Acessibilidade",
    areaResponsavel: "Obras e Infraestrutura",
    nivelMaturidade: "Inicial",
    frequencia: "Ad-Hoc",
    duracaoMedia: 8,
    complexidade: "Média",
    normas: [
      {
        id: "norma-nbr9050-001",
        nome: "ABNT NBR 9050",
        tipo: "Norma Técnica",
        descricao: "Acessibilidade a edificações",
        itemNorma: "Seção 4",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      },
      {
        id: "norma-lei13146-001",
        nome: "Lei nº 13.146/2015",
        tipo: "Norma Reguladora",
        descricao: "Lei Brasileira de Inclusão",
        itemNorma: "Título III",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      }
    ]
  },
  {
    id: "come-00001",
    identificacao: "COME-00001",
    descricao: "Importação e Exportação de Produtos",
    areaResponsavel: "Comercial",
    nivelMaturidade: "Inicial",
    frequencia: "Ad-Hoc",
    duracaoMedia: 8,
    complexidade: "Média",
    normas: [
      {
        id: "norma-omc-001",
        nome: "Acordos da OMC (WTO)",
        tipo: "Regulamentação Internacional",
        descricao: "Regras de comércio internacional",
        itemNorma: "GATT Artigo XI",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      },
      {
        id: "norma-regaduaneiro-001",
        nome: "Regulamento Aduaneiro",
        tipo: "Norma Reguladora",
        descricao: "Decreto nº 6.759/2009",
        itemNorma: "Título II",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      }
    ]
  },
  {
    id: "banc-00001",
    identificacao: "BANC-00001",
    descricao: "Gestão de Riscos Financeiros",
    areaResponsavel: "Compliance Bancário",
    nivelMaturidade: "Inicial",
    frequencia: "Ad-Hoc",
    duracaoMedia: 8,
    complexidade: "Média",
    normas: [
      {
        id: "norma-basel3-001",
        nome: "Basel III",
        tipo: "Regulamentação Internacional",
        descricao: "Adequação de capital e liquidez",
        itemNorma: "Pilar 1",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      },
      {
        id: "norma-cmn-001",
        nome: "Resolução CMN nº 4.557/2017",
        tipo: "Norma Reguladora",
        descricao: "Gerenciamento de riscos e capital",
        itemNorma: "Art. 3º",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      }
    ]
  },
  {
    id: "cont-00001",
    identificacao: "CONT-00001",
    descricao: "Elaboração de Demonstrações Financeiras",
    areaResponsavel: "Contabilidade",
    nivelMaturidade: "Inicial",
    frequencia: "Ad-Hoc",
    duracaoMedia: 8,
    complexidade: "Média",
    normas: [
      {
        id: "norma-ifrs15-001",
        nome: "IFRS 15",
        tipo: "Regulamentação Internacional",
        descricao: "Receita de Contratos com Clientes",
        itemNorma: "Parágrafo 31",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      },
      {
        id: "norma-cpc00-001",
        nome: "CPC 00 (R2)",
        tipo: "Norma Técnica",
        descricao: "Estrutura Conceitual para Relatório Financeiro",
        itemNorma: "Capítulo 4",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      }
    ]
  },
  {
    id: "segu-00001",
    identificacao: "SEGU-00001",
    descricao: "Gestão de Incidentes de Segurança",
    areaResponsavel: "Segurança da Informação",
    nivelMaturidade: "Inicial",
    frequencia: "Ad-Hoc",
    duracaoMedia: 8,
    complexidade: "Média",
    normas: [
      {
        id: "norma-iso27001-002",
        nome: "ISO/IEC 27001",
        tipo: "Norma Técnica",
        descricao: "Gestão de Incidentes",
        itemNorma: "Anexo A.16",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      },
      {
        id: "norma-lgpd-001",
        nome: "LGPD - Lei nº 13.709/2018",
        tipo: "Norma Reguladora",
        descricao: "Comunicação de incidentes",
        itemNorma: "Art. 48",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      },
      {
        id: "norma-gdpr-002",
        nome: "GDPR",
        tipo: "Regulamentação Internacional",
        descricao: "Notificação de violação",
        itemNorma: "Art. 33",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      }
    ]
  }
];

// Salvar no localStorage
try {
  localStorage.setItem('processos-negocio', JSON.stringify(processosData));
  
  console.log('%c✓ SUCESSO!', 'color: green; font-weight: bold; font-size: 16px;');
  console.log(`\n✓ ${processosData.length} processos carregados`);
  console.log(`✓ ${processosData.flatMap(p => p.normas).length} normas cadastradas\n`);
  
  processosData.forEach(p => {
    console.log(`  • ${p.identificacao} - ${p.descricao}`);
  });
  
  console.log('%c\n⚠ Recarregue a página (F5) agora!', 'color: orange; font-weight: bold; font-size: 14px;');
  
} catch (error) {
  console.error('%c✗ ERRO:', 'color: red; font-weight: bold;', error);
}
