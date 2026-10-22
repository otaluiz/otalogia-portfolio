export type Project = {
  id: string
  title: string
  category: string
  description: string
  cover: string
  coverAlt: string
  url?: string
}

// Temporary editorial images. Replace cover and coverAlt when the project images are uploaded.
export const projects: Project[] = [
  {
    id: 'portfolio',
    title: 'Otalogia Portfolio',
    category: 'WEB · EXPERIÊNCIA 3D',
    description: 'Portfólio da Otalogia desenvolvido em React e TypeScript. Combina um laboratório 3D interativo, apresentação dos serviços e animações de navegação com GSAP e Lenis.',
    cover: '/images/projects/portfolio.svg',
    coverAlt: 'Imagem provisória do projeto Otalogia Portfolio',
    url: 'https://github.com/otaluiz/otalogia-portfolio',
  },
  {
    id: 'post',
    title: 'Otalogia Post',
    category: 'DESIGN · AUTOMAÇÃO',
    description: 'Motor de composição e renderização de carrosséis com o design system da Otalogia. Organiza tema, conteúdo e metadados para transformar roteiros em peças visuais consistentes.',
    cover: '/images/projects/post.svg',
    coverAlt: 'Imagem provisória do projeto Otalogia Post',
    url: 'https://github.com/otaluiz/otalogia-post',
  },
  {
    id: 'publisher',
    title: 'Instagram Publisher',
    category: 'INTEGRAÇÕES · CONTEÚDO',
    description: 'Fluxo de publicação programada de conteúdo da Otalogia: organização da fila, preparação dos arquivos e integração com a API oficial do Instagram.',
    cover: '/images/projects/publisher.svg',
    coverAlt: 'Imagem provisória do projeto Instagram Publisher',
  },
]
