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
  video?: { src: string; width: number; height: number }
}

// Website screenshots and original Reel covers are stored locally for the gallery.
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
  {
    id: 'reel-soled-cuiaba',
    title: 'Soled Cuiabá — Campanha em vídeo',
    category: 'EDIÇÃO DE VÍDEO · CAMPANHA',
    description: 'Edição de vídeo para a campanha da Soled Cuiabá, em parceria com a agência Idea Lab. Trabalho editado por Otalogia e publicado no Instagram, reunindo comunicação de marca e motion graphics.',
    cover: '/images/projects/reel-Db4Jz4Jg20H.jpg',
    coverAlt: 'Capa do vídeo da Soled Cuiabá com painel de LED, céu azul e elementos gráficos',
    coverWidth: 361,
    coverHeight: 640,
    url: 'https://www.instagram.com/reel/Db4Jz4Jg20H/',
    video: { src: '/videos/projects/Db4Jz4Jg20H.mp4', width: 720, height: 1280 },
  },
  {
    id: 'reel-shape-mt',
    title: 'Shape MT — Edição de Reel',
    category: 'EDIÇÃO DE VÍDEO · REEL',
    description: 'Edição de vídeo vertical para a Shape MT, publicada por Otalogia no Instagram. O trabalho combina cortes estratégicos, motion, legendas dinâmicas e efeitos sonoros para apresentar o conteúdo com ritmo e clareza.',
    cover: '/images/projects/reel-DdJYirDqJOc.jpg',
    coverAlt: 'Capa do Reel da Shape MT com apresentador ao ar livre e legendas sobrepostas',
    coverWidth: 361,
    coverHeight: 640,
    url: 'https://www.instagram.com/reel/DdJYirDqJOc/',
    video: { src: '/videos/projects/DdJYirDqJOc.mp4', width: 720, height: 1280 },
  },
  {
    id: 'reel-motion-sound-design',
    title: 'Edição dinâmica — Motion e sound design',
    category: 'EDIÇÃO DE VÍDEO · MOTION DESIGN',
    description: 'Vídeo editado e publicado por Otalogia no Instagram, com cortes precisos, motion, sound design e transições. Uma edição construída em torno do ritmo e da atenção em cada momento do conteúdo.',
    cover: '/images/projects/reel-DeJ6i5ACMsm.jpg',
    coverAlt: 'Capa de vídeo com apresentador à mesa, imagens sobrepostas e legendas',
    coverWidth: 360,
    coverHeight: 640,
    url: 'https://www.instagram.com/reel/DeJ6i5ACMsm/',
    video: { src: '/videos/projects/DeJ6i5ACMsm.mp4', width: 720, height: 1280 },
  },
]
