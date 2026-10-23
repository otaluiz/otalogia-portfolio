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

A seção `#projetos` usa a galeria esférica do Atelier UI / Codrops, adaptada em `components/atelier/`. Arrastar gira a esfera; selecionar aproxima uma imagem. A esfera completa fica centralizada e gira lentamente, exibindo somente as imagens, sem cards, preenchimento preto ou bordas ao redor. O primeiro clique entra na galeria imersiva sem selecionar projeto; dentro dela, outro clique escolhe uma imagem. “Voltar ao globo” restaura a visão externa e a rotação suave. A descrição e o link aparecem abaixo com transição somente depois de selecionar um projeto, com navegação pelos oito projetos em botões acessíveis. A cena carrega sob demanda ao se aproximar da seção. Sem WebGL ou com movimento reduzido, a imagem original substitui a esfera e os mesmos controles continuam disponíveis.

`lib/projects.ts` reúne cinco projetos web e três trabalhos de edição de vídeo, com títulos, descrições, textos alternativos e links públicos. As capas e os vídeos dos Reels enviados pelo usuário são arquivos locais, obtidos das publicações originais. Os vídeos mantêm H.264/AAC e são carregados somente ao reproduzir, com controles nativos e link para o Instagram. A seção mantém o fluxo normal da página em todas as larguras.

`lib/section-transition.ts` implementa `sectionTransition01(scopeOrConfig?, config?)`, integrado ao lifecycle React em `usePageMotion`. O sistema reutiliza GSAP e Lenis já presentes no projeto. Os blocos precisam ser irmãos adjacentes no fluxo vertical:

- `#inicio`: visual original em card, grade roxa/laranja e parallax sutil apenas no fundo. Sem overlay de transição sobre a hero.
- `#processo` e `#sobre`: fluxo normal, sem fixação nem sobreposição durante a rolagem.
- `#contato`: `data-st-01="reveal"`, distância 240 e overlay até 0.5, para revelar a chamada final no fluxo normal, sem sticky.

Os modos foram escolhidos a partir da estrutura existente. `data-st-y`, `data-st-opacity` (limitado a 0–1) e `data-st-overlay` podem ser ajustados nos elementos. `pin` ignora a distância. O primeiro bloco não pode revelar; o último não pode fixar nem fazer parallax. Defaults globais ficam em `DEFAULT_CONFIG` na função. O modo móvel padrão `simplify`, até 768px, converte parallax em pin e remove deslocamento de reveal. `same` preserva os movimentos e `disable` desativa as transições com movimento vertical. Movimento reduzido desativa a coreografia e o Lenis, preservando a navegação nativa. Overlays, estilos, triggers, ticker e observadores são limpos ao desmontar ou mudar as media queries. O reveal mantém a posição relativa e anima apenas durante a entrada da seção; isso evita que o contato apareça atrás do restante da página.

Revisão visual: verificar hero com o formato e as cores originais, piso do laboratório translúcido com bordas de vidro, títulos completos nas folhas abertas, galeria esférica e descrições e sequência Processo → Laboratório → Projetos → Sobre → Contato. Conferir também 390px, navegação por teclado, Escape e preferência de movimento reduzido.

Testes de navegação e lifecycle (Playwright, dependência de desenvolvimento):

```sh
npx playwright install chromium
npm run test:browser
# Ou use um Chromium já instalado:
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
```

Os testes verificam âncoras, resize, movimento reduzido, transições, indicadores e ordem das seções. `visual-fixes.spec.ts` verifica que os três títulos das pastas estão expostos, que todos os projetos têm imagem, descrição e link no desktop e no celular, e que o laboratório não tem contêiner com corte. `atelier-gallery.spec.ts` exercita a galeria real com WebGL por software.


Indicadores, serviços e projetos usam superfícies glass com gradiente translúcido, borda e backdrop blur. A linha dos indicadores não tem fundo sólido. Os indicadores animam de zero aos valores publicados ao entrar na tela; rótulos acessíveis mantêm os valores finais sem anúncios a cada quadro, e movimento reduzido mostra diretamente os valores finais. No mobile, a esfera continua centralizada e a descrição aparece somente após a seleção, sem rolagem horizontal da página.


O laboratório inicia em **Acompanhar processo**, com órbita suave em torno do produto em movimento. Clicar em uma etapa posiciona o produto naquele ponto e continua o ciclo, atualizando as funções e a etapa selecionada. As legendas 3D usam sprites voltados à câmera e as funções também permanecem em texto abaixo da cena. O piso usa material físico translúcido com contorno de vidro; apenas os controles de acompanhamento e pausa permanecem. A preferência por movimento reduzido mantém o processo inicialmente pausado. `tests/browser/laboratory.spec.ts` valida a cena com WebGL por software, separado dos testes de layout que desativam WebGL.

O laboratório permite zoom com scroll, rotação ao arrastar e deslocamento com o botão direito. A interação assume a câmera até selecionar “Acompanhar processo”. A seção Sobre e seu card de texto têm fundo transparente.

“Acompanhar etapas” no laboratório segue o produto continuamente, de estação em estação, mostrando a função atual sem pausar nem exigir cliques adicionais. Após Resultados, continua em Dados. “Pausar” interrompe somente quando solicitado e “Reproduzir” retoma o acompanhamento. “Acompanhar processo” retorna à visão geral. Movimento reduzido mantém o processo parado até uma reprodução explícita.
