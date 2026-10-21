# Otalogia — sistemas, dados e IA

Portfólio em React + TypeScript + Vite, com Tailwind CSS 4 e estrutura compatível com shadcn/ui. Posicionamento: soluções tecnológicas para a operação e o marketing de empresas de serviços.

## Desenvolvimento

Node.js 22 recomendado.

```sh
npm install
npm run dev
npm run build
```

O build executa a verificação TypeScript antes de gerar `dist/`. A Vercel usa `vercel.json`: raiz do repositório, preset Vite, instalação `npm install`, build `npm run build`, saída `dist`.

## Estrutura e shadcn

- `components/ui/`: componentes reutilizáveis, incluindo `agentic-factory-3d.tsx`, `wave-grid.tsx` e `button.tsx`.
- `styles/globals.css`: Tailwind, identidade visual e responsividade.
- `styles/machine.css`: estilos isolados da máquina 3D.
- `lib/machine-scene.ts`: cena procedural sequencial da operação da Otalogia.
- `lib/use-motion.ts`: Lenis e GSAP ScrollTrigger.
- `App.tsx`: conteúdo, serviços, filtros de BI e integração.

`components.json` define `@/components/ui` como caminho padrão. Essa convenção permite que o CLI encontre componentes, aliases e estilos sem espalhar arquivos pela aplicação. Tailwind e TypeScript já estão configurados; não é necessário recriar o projeto. Para adicionar componentes: `npx shadcn@latest add <componente>`.

## Animações

Lenis controla rolagem suave e sincroniza com o ticker GSAP. GSAP anima título, entradas de seções, paralaxe e progresso. Framer Motion controla menu, transição dos serviços e gráfico. Nenhuma propriedade do mesmo elemento é controlada por duas bibliotecas. O grid 3D da hero adapta franky-adl/3d-wave-grid: cubos instanciados, ondas de cursor calculadas por GLSL, paleta preta, roxa, azul e laranja. São 40×40 cubos no desktop e 24×24 em telas menores, com rastro limitado e renderização suspensa fora da tela. Em movimento reduzido, a onda é estática. A cena 3D é carregada sob demanda; pausada inicialmente com movimento reduzido, com limite de pixel ratio e suspensão fora da tela. Rodas e toque preservam a rolagem da página.

O laboratório e o dashboard são demonstrações. Os dados de BI são fictícios. Não há automação real conectada, coleta de informações, API de IA ou credenciais no site.

## Créditos

A máquina é adaptada de [Agentic 3D Templates](https://github.com/eugeneshilow/agentic-3d-templates), por Eugeneshilow / vibecoding.tech, a partir do componente solicitado. O original permite uso em projetos pessoais e comerciais, mas não redistribuição ou revenda como template. Este repositório é o site específico da Otalogia, não um template redistribuível. Crédito visual preservado.

O grid da hero adapta [franky-adl/3d-wave-grid](https://github.com/franky-adl/3d-wave-grid), sob licença MIT. Texto integral em `THIRD_PARTY_NOTICES.md`.



## Laboratório: sequência e movimento

Ordem única: Dados → IA aplicada → Sistemas → Integrações → Resultados. As estações usam, respectivamente, discos de banco de dados, chip com rede neural, rack de servidores, hub com conexões ortogonais e monitor com indicadores. A geometria da antiga fábrica de vídeos foi substituída.

A cena usa movimento cinemático restrito à pista, não um motor de corpos rígidos: um único pacote, corredor frontal separado das estações, aceleração/desaceleração quintica e câmera com mola criticamente amortecida. O retorno do pacote ao início ocorre somente quando invisível. Os estados de pausa, seleção, expansão e movimento reduzido preservam as distâncias de segurança.

Verificação: `node --experimental-strip-types --test tests/*.test.mjs` (Node 22+) testa ordem, envelopes de segurança, deslocamento sem retorno visível, continuidade de velocidade e estabilidade da mola entre 30 e 120 fps. A CI também verifica TypeScript e build Vite.
