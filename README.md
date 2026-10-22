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

## Projetos e transições entre seções

A seção `#projetos` usa um carrossel em hélice 3D, com navegação por botões, setas do teclado e gesto horizontal. Cada projeto abre um diálogo nativo com foco contido, fechamento por Escape e restauração do foco. `lib/projects.ts` concentra título, categoria, descrição, capa, texto alternativo (`coverAlt`) e link público opcional. As capas SVG são composições editoriais da Otalogia. Os projetos iniciais são Portfolio, Post e Instagram Publisher; o publicador não expõe um link para seu repositório privado.

Até o envio das imagens dos projetos, o carrossel e os detalhes exibem capas provisórias com texto alternativo descritivo. Para substituir uma capa, adicione a imagem em `public/images/projects/` e atualize `cover` e `coverAlt` em `lib/projects.ts`. Os detalhes exibem apenas imagem e descrição, sem player de vídeo.

`lib/section-transition.ts` implementa `sectionTransition01(scopeOrConfig?, config?)`, integrado ao lifecycle React em `usePageMotion`. O sistema reutiliza GSAP e Lenis já presentes no projeto. Os blocos precisam ser irmãos adjacentes no fluxo vertical:

- `#inicio`: `data-st-01="parallax"`, distância 300 e overlay preto até 0.5, para dar profundidade à entrada dos indicadores.
- `#processo`: `data-st-01="pin"`, para manter as etapas enquanto a apresentação entra.
- `#contato`: `data-st-01="reveal"`, distância 240 e overlay até 0.5, para revelar a chamada final.

Os modos foram escolhidos a partir da estrutura existente. `data-st-y`, `data-st-opacity` (limitado a 0–1) e `data-st-overlay` podem ser ajustados nos elementos. `pin` ignora a distância. O primeiro bloco não pode revelar; o último não pode fixar nem fazer parallax. Defaults globais ficam em `DEFAULT_CONFIG` na função. O modo móvel padrão `simplify`, até 768px, converte parallax em pin e remove deslocamento de reveal. `same` preserva os movimentos e `disable` desativa as transições com movimento vertical. Movimento reduzido desativa a coreografia e o Lenis, preservando a navegação nativa. Overlays, estilos, triggers, ticker e observadores são limpos ao desmontar ou mudar as media queries. Não envolver os blocos em um ancestral com overflow que impeça `position: sticky`.

Revisão visual: verificar hero sem bordas arredondadas em toda a largura, ondas e piso brancos, títulos completos nas folhas abertas, profundidade da hélice e transições Processo → Sobre → Contato. Conferir também 390px, navegação por teclado, Escape e preferência de movimento reduzido.

Testes de navegação e lifecycle (Playwright, dependência de desenvolvimento):

```sh
npx playwright install chromium
npm run test:browser
# Ou use um Chromium já instalado:
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
```

Esses testes verificam âncoras Lenis em Strict Mode, abertura e fechamento do diálogo, restauração de foco, resize, movimento reduzido e regras de borda/configuração das transições. Desativam WebGL para isolar asserções de layout do desempenho da GPU; a aparência das cenas 3D deve ser revisada separadamente com WebGL habilitado.
