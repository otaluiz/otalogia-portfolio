export type Project = {
  id: string
  title: string
  category: string
  description: string
  cover: string
  coverAlt: string
  coverWidth: number
  coverHeight: number
  coverFocus?: number
  url: string
}

// Screenshots supplied by the user; original pixels preserved in the local PNG assets.
export const projects: Project[] = [
  {
    id: 'aidea-lab',
    title: 'Aidea Lab',
    category: 'WEBSITE · PRESENÇA DIGITAL',
    description: 'Website da Aidea Lab que apresenta a união entre criatividade humana e inteligência artificial. A experiência combina identidade visual em azul, elemento 3D e navegação por serviços, projetos e contato.',
    cover: '/images/projects/aidea-lab.png',
    coverFocus: .3,
    coverAlt: 'Página inicial da Aidea Lab, com apresentação de criação e tecnologia e frasco 3D violeta',
    coverWidth: 1920,
    coverHeight: 951,
    url: 'https://aidealab.com.br/#hero',
  },
  {
    id: 'crm',
    title: 'CRM WhatsApp',
    category: 'CRM · VENDAS E RELACIONAMENTO',
    description: 'CRM WhatsApp com funil visual de vendas, organizado de Novo Lead a Fechado Ganho. A interface apresenta indicadores de negociações, valor do funil e ticket médio, além de áreas para mensagens, contatos, transmissões, automações, fluxos e agentes de IA.',
    cover: '/images/projects/crm.png',
    coverFocus: 0,
    coverAlt: 'Funil de vendas do CRM WhatsApp, com etapas de Novo Lead a Fechado Ganho',
    coverWidth: 1920,
    coverHeight: 946,
    url: 'https://crm-api-tfa2.vercel.app/dashboard',
  },
  {
    id: 'crm-manut',
    title: 'Pulso — Gestão de Manutenção',
    category: 'SISTEMA WEB · ANÁLISES',
    description: 'Sistema web de gestão de manutenção com painel de inteligência analítica. A interface reúne indicadores de OEE, disponibilidade, MTBF e MTTR, análises de confiabilidade e detecção de anomalias, além de áreas para manutenções, agenda, equipamentos e equipe técnica.',
    cover: '/images/projects/crm-manut.png',
    coverFocus: 0,
    coverAlt: 'Painel analítico do Pulso, com indicadores de manutenção, confiabilidade e anomalias',
    coverWidth: 1920,
    coverHeight: 995,
    url: 'https://crm-manut.vercel.app/analises',
  },
  {
    id: 'shape-mt',
    title: 'Shape MT',
    category: 'WEB · EXPERIÊNCIA DIGITAL',
    description: 'Website da Shape MT voltado à apresentação de suplementação, saúde e cuidado. A página organiza informações sobre a jornada de atendimento, avaliação médica, depoimentos e triagem, com acesso ao contato pelo WhatsApp.',
    cover: '/images/projects/shape-mt.png',
    coverFocus: .25,
    coverAlt: 'Página inicial da Shape MT, com apresentação de saúde e suplementação em verde',
    coverWidth: 1920,
    coverHeight: 949,
    url: 'https://shapemt.vercel.app/',
  },
  {
    id: 'hora-da-chipa',
    title: 'Hora da Chipa',
    category: 'WEBSITE · MARCA',
    description: 'Website da Hora da Chipa com identidade visual em amarelo e navegação direta para produtos, congelados, apresentação da marca e contato. Uma vitrine digital que aproxima a marca de seus clientes.',
    cover: '/images/projects/hora-da-chipa.png',
    coverFocus: .5,
    coverAlt: 'Página inicial amarela da Hora da Chipa, com identidade da marca e acesso aos produtos',
    coverWidth: 1920,
    coverHeight: 893,
    url: 'https://horadachipa.com.br/',
  },
]
