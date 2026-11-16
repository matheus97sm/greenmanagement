# Green Management

Reescrita do sistema de gestão de serviços de TI (ITSM), focada na área de chamados. É um projeto de estudo: roda 100% no navegador, **sem backend**. A API e os eventos em tempo real (WebSocket) serão simulados no próprio front-end.

> **Estado atual:** login, API/WebSocket simulados com o `dados.json` real e as visões da **Marina (consultora)** e do **Ricardo (gestor)**, com a página semanal da equipe. A visão da Helena (cliente) ainda não foi feita.

## Tecnologias

- [React](https://react.dev/) 19 + TypeScript
- [Vite](https://vite.dev/) (SPA, sem SSR)
- [Mantine](https://mantine.dev/) (componentes de interface) + [Tabler Icons](https://tabler.io/icons)
- [React Router](https://reactrouter.com/) (rotas)
- [TanStack Query](https://tanstack.com/query) e [TanStack Virtual](https://tanstack.com/virtual) (dados e listas grandes — ainda não usados)
- [idb](https://github.com/jakearchibald/idb) (IndexedDB, para a API simulada — ainda não usado)
- [Vitest](https://vitest.dev/) + Testing Library (testes)
- [oxlint](https://oxc.rs/docs/guide/usage/linter) (lint)

## Pré-requisitos

- [Node.js](https://nodejs.org/) em versão recente (desenvolvido com Node 26; versões LTS atuais também devem funcionar)
- npm (já vem com o Node)

## Como rodar

```bash
# 1. Instalar as dependências
npm install

# 2. Subir o servidor de desenvolvimento
npm run dev
```

Abra o endereço mostrado no terminal (normalmente <http://localhost:5173>).

## Scripts

| Comando                    | O que faz                                          |
| -------------------------- | -------------------------------------------------- |
| `npm run dev`              | Servidor de desenvolvimento com recarga automática |
| `npm run build`            | Checagem de tipos (`tsc`) e build de produção      |
| `npm run preview`          | Serve o build de produção localmente               |
| `npm run lint`             | Executa o oxlint                                   |
| `npm test`                 | Executa os testes com Vitest (modo watch)          |
| `npm run test:integration` | Executa só os testes de integração                 |
| `npm run format`           | Formata o código com o Prettier                    |
| `npm run format:check`     | Verifica a formatação sem alterar arquivos         |

Para rodar os testes uma única vez (por exemplo, em CI): `npx vitest run`.

## Como ver a tela como cada perfil

O login é **simulado** (não há backend nem segurança real). Os três usuários usam a mesma senha:

**Senha de todos: `senha123`**

| Perfil                      | E-mail                               | Perfil nos dados |
| --------------------------- | ------------------------------------ | ---------------- |
| Marina Almeida (consultora) | `marina.almeida@suporte.example`     | consultor        |
| Ricardo Monteiro (gestor)   | `ricardo.monteiro@suporte.example`   | gestor           |
| Helena Fernandes (cliente)  | `helena.fernandes@lusitania.example` | cliente          |

São as pessoas do brief, como aparecem no `dados.json`.

Na tela de login, clicar em um dos usuários da seção "Usuários de demonstração" preenche e-mail e senha automaticamente.

Para trocar de perfil, clique no ícone de sair no cabeçalho e entre com outro usuário.

## Como testar manualmente

### Login

1. Acesse `/`: deve aparecer a tela de login.
2. Entre com uma senha errada: deve aparecer "E-mail ou senha inválidos."
3. Entre com um dos usuários acima: você é levado à página do seu perfil (`/consultant/tickets`, `/manager/tickets` ou `/customer/tickets`).
4. Recarregue a página: a sessão continua (fica salva no `localStorage`).
5. Clique em sair: volta ao login. Acessar qualquer página deslogado também redireciona para `/`.
6. Logado como um perfil, tente abrir a página de outro (por exemplo, a Marina em `/manager/tickets`): você é redirecionado para a página do seu próprio perfil, sem a outra página chegar a aparecer.

### Visão da Marina (`marina.almeida@suporte.example`, em `/consultant/tickets`)

1. **Lista:** a aba "Meus" mostra os 42 chamados dela e a aba "Fila do grupo" mostra os 35 chamados abertos e sem responsável da Infraestrutura. Há busca (número, título, cliente ou empresa) e filtro de status. A ordem segue três faixas, e dentro de cada uma vale a prioridade (crítica, alta, média, baixa) e depois o prazo mais antigo: (1) **estourados**; (2) **vencem em menos de 4h**; (3) **o resto**. Chamados com o relógio pausado (aguardando cliente) vêm depois, e os resolvidos ou fechados por último. Assim, um chamado crítico estourado há 1h aparece antes de um de prioridade baixa estourado há 300h, e um de prioridade baixa que vence em 1h não fica atrás de um médio que só vence amanhã. O prazo exibido é o relógio que vence primeiro: a primeira resposta, enquanto ninguém respondeu, ou a resolução. A ordem é recalculada a cada 30 segundos, então um chamado sobe sozinho quando entra em uma faixa mais urgente.
2. **Pegar um chamado:** na fila, abra um chamado e clique em "Pegar chamado". Ele passa para "Meus".
3. **Responder:** em um chamado seu, escreva e envie (Ctrl+Enter). Ligue "Nota interna" para uma nota que o cliente não vê (fica em amarelo).
4. **Rascunho:** comece a escrever, troque de chamado e volte: o texto continua lá.
5. **Mudar status:** "Alterar status" exige um motivo, que aparece na conversa. Em chamado resolvido ou fechado, "Reabrir" também exige motivo.
6. **Tempo real:** deixe a tela aberta. A cada poucos segundos chegam respostas de clientes (aparece um contador de não lidas na lista), chamados novos na fila, colegas pegando chamados da fila e notas internas. Se você tentar pegar um chamado que um colega acabou de pegar, aparece um aviso de erro.
7. **Eventos repetidos:** o socket simulado reenvia alguns eventos; nada deve aparecer duplicado.

### Visão do Ricardo (`ricardo.monteiro@suporte.example`, em `/manager/tickets`)

A tela do gestor não é uma lista de chamados: ela mostra **a equipe e onde agir**. O Ricardo gere os dois grupos (Infraestrutura e Aplicações) e vê os 12 consultores.

1. **Resumo:** chamados ativos, prazos estourados, chamados que vencem em menos de 4h, chamados sem responsável e consultores sem chamados;
2. **Quadro da equipe:** um cartão por consultor, separado por grupo, com a carga (barra proporcional ao consultor mais ocupado) e os alertas dele: estourados, em risco e aguardando cliente. Quem precisa de atenção vem primeiro: quem está **sem chamados** e quem está **sobrecarregado** (a partir de 1,5x a média do próprio grupo, porque os grupos têm volumes diferentes). Chamados em "aguardando cliente" contam na carga, mas não como risco, porque o prazo está pausado;
3. **Painel de chamados:** começa em "Em risco" (estourados e que vencem em menos de 4h, de toda a equipe, na mesma ordem da Marina). "Sem responsável" mostra a fila, e há um filtro por grupo. Clicar em um consultor no quadro mostra **tudo o que ele carrega**; clicar de novo volta;
4. **Redistribuir:** marque um ou vários chamados (há "Selecionar todos") e clique em "Redistribuir". A lista de destinos mostra só os consultores do grupo dos chamados, do menos ao mais carregado, com a carga de cada um. Serve para cobrir quem faltou ou entregar a fila a quem está parado. Chamados de grupos diferentes não são redistribuídos juntos, e resolvidos ou fechados não podem ser movidos;
5. **Limite da lista:** o painel mostra os 100 chamados mais urgentes e avisa quando há mais. A lista só desenha as linhas visíveis, então continua leve. Cada linha mostra o grupo do chamado;
6. **Um grupo por vez:** ao marcar um chamado, os chamados de outro grupo ficam desabilitados, porque só dá para redistribuir para consultores do mesmo grupo. "Selecionar todos" marca só os chamados do grupo do primeiro da lista (ou do grupo já escolhido) e diz qual é o grupo quando a lista mistura os dois;
7. **Conversa (escalonamento):** clique no título de um chamado para abrir a conversa ao lado da lista. O endereço muda para `/manager/tickets/<id>`, então o link pode ser enviado a alguém e abre direto na conversa. O gestor lê tudo, responde ao cliente, deixa nota interna para o consultor, altera o status (com motivo, e pode reabrir) e redistribui o chamado dali mesmo. Ele não "pega" chamado, porque a atribuição é feita pela redistribuição. Cada mensagem mostra quem escreveu: um selo **Cliente** (azul), **Consultor** (verde) ou **Gestor** (violeta), com a borda lateral na mesma cor e o fundo azul claro nas mensagens do cliente. Notas internas continuam em amarelo. Vale também para a Marina. O rascunho de resposta fica guardado ao trocar de chamado;
8. **Busca:** o campo acima da lista procura entre **todos** os chamados (inclusive resolvidos e fechados, que o cliente pode escalar), por número, título, cliente ou empresa. Respeita o filtro de grupo. Enquanto há busca, as abas ficam desativadas;
9. **Tempo real:** o quadro e o resumo acompanham os eventos (chamados pegos, abertos, prazos que estouram) sem recarregar.

### Semana da equipe (Ricardo, em `/manager/dashboard`)

Página própria, acessível pelo cabeçalho ("Equipe e chamados" e "Semana da equipe"). Responde à pergunta do fim da semana: quanto tempo cada consultor ficou sem chamado e o que fez.

- **Tempo sem chamado:** é o expediente (segunda a sexta, das 8h às 18h, horário de Brasília) em que o consultor não teve nenhum chamado **ativo** atribuído. Chamado em "aguardando cliente" conta como atribuído, porque o consultor ainda é o dono dele. Vários chamados ao mesmo tempo não contam em dobro. Trabalho fora do expediente não reduz o tempo ocioso;
- **Como é calculado:** a partir do histórico de atribuições e de status de cada chamado (`src/domain/activity.ts`). O consultor "tem" um chamado desde a atribuição até ele ser resolvido ou fechado, e volta a ter se ele for reaberto. Uma redistribuição passa o chamado de um consultor para o outro naquele instante;
- **Semana:** começa na segunda-feira à meia-noite de Brasília. A semana atual conta só até agora (às 10h de terça são 12h de expediente). Dá para escolher as 8 últimas semanas;
- **Tabela:** uma linha por consultor, com o tempo sem chamado e a parcela do expediente, as horas ociosas de cada dia (o fundo fica mais forte quanto maior a ociosidade; "–" para dias que ainda não aconteceram), os chamados atribuídos e resolvidos na semana, as respostas ao cliente (notas internas não contam) e a carga de agora (com os estourados). Dá para filtrar por grupo e ordenar por tempo sem chamado, resolvidos, atribuídos, respostas ou nome;
- **Resumo:** horas sem chamado da equipe, ociosidade da equipe, atribuídos, resolvidos e quem ficou mais tempo parado;
- **Tempo real:** a carga de cada um acompanha os eventos. As horas da semana são recalculadas a cada 30 segundos;
- **Atenção ao dado:** o `dados.json` concentra a atividade nos últimos dias. Semanas mais antigas aparecem com muita ociosidade porque quase nenhum chamado tinha sido atribuído ainda. Isso é o que o histórico diz, não um erro de cálculo.

## Como funciona o "backend" simulado

Não existe backend. O que seria o servidor fica em `src/server` e roda no navegador:

- `db.ts` carrega o `dados.json` (como um primeiro `GET` da API; o arquivo é servido como asset separado, fora do bundle) e o mantém em memória;
- `visibility.ts` decide **o que cada perfil pode ver**: o cliente só recebe os próprios chamados e nunca as notas internas; o consultor recebe o grupo dele e o que lhe foi atribuído; o gestor recebe os grupos que gere. Vale para o carregamento inicial e para cada evento;
- `ops.ts` tem as regras de negócio (permissões, transições de status, relógio do SLA) e publica eventos;
- `api.ts` expõe essas operações como chamadas assíncronas com latência;
- `socket.ts` simula o WebSocket: atraso variável e entrega duplicada de alguns eventos, filtrando por quem está ouvindo;
- `simulator.ts` gera a atividade de outras pessoas, usando textos reais do arquivo.

No lado da tela, `src/store/ticketsStore.ts` aplica os eventos (`chamado.aberto`, `chamado.atribuido`, `mensagem.adicionada`, `status.alterado`) de forma idempotente: ignora eventos repetidos e não deixa um evento antigo sobrescrever um mais novo. As regras que alteram o chamado (`src/domain/rules.ts`) são as mesmas no servidor e na tela. Para trocar o simulador por um backend real, basta substituir `src/server` e a ligação em `src/store/realtime.ts`.

### Relógio simulado

O `dados.json` está congelado em `meta.agora` (03/11/2026 13:00 UTC). A tela parte desse instante e o relógio segue em tempo real a partir dele (`src/lib/clock.ts`). Sem isso, qualquer prazo pareceria estourado há dias. Datas são exibidas no fuso e no idioma do usuário (`zoneinfo`/`locale` do cadastro).

### Regras de SLA

- Cada chamado tem dois prazos: **primeira resposta** (`prazo_primeira_resposta`, até a equipe responder ao cliente) e **resolução** (`prazo_resolucao`). O prazo exibido e usado na ordenação é o que vence primeiro entre os pendentes;
- `aguardando_cliente` pausa o relógio (`sla_pausado`): o tempo restante fica congelado. Quando o cliente responde, o chamado volta a "em atendimento" e o prazo de resolução é empurrado pelo tempo que ficou parado;
- resolvido e fechado encerram o SLA. O que vale é o `status`, não `resolvido_em`/`fechado_em`, que continuam preenchidos em chamados reabertos;
- **reabertura:** reabrir um chamado **fechado** renova o SLA, e os dois prazos passam a contar da reabertura (e a primeira resposta volta a ser exigida). Reabrir um chamado **resolvido** não renova nada, porque o cliente nunca confirmou que o problema acabou, e os prazos originais continuam valendo. O `dados.json` traz um chamado reaberto a partir de fechado (#10611) com os prazos antigos; ao carregar, ele é recalculado pela mesma regra;
- o estado é crítico abaixo de 1h e de atenção abaixo de 4h (limites escolhidos por nós).

### Pontos do `dados.json` que merecem atenção

- um chamado (#10609) tem 1500 mensagens; a conversa mostra só as 100 mais recentes e permite carregar as anteriores;
- o histórico pode estar incompleto (#10265): o `status` do chamado é a fonte da verdade;
- há um chamado atribuído a um consultor de outro grupo (#10608): ele aparece em "Meus" da Marina;
- há clientes com o mesmo nome em empresas diferentes (e um e-mail repetido): a empresa é exibida junto do nome;
- mensagens internas só existem de consultores, e nunca são enviadas a clientes.

## Decisões de arquitetura

As decisões que moldam o projeto (camadas, organização de páginas e componentes, rotas, estado em tempo real, visibilidade, testes, estilo) estão registradas como ADRs em [`docs/adr`](docs/adr/README.md). Leia o índice antes de criar uma página, um componente ou uma regra nova, e escreva uma ADR nova quando uma decisão mudar.

Parte das regras é conferida por `src/architecture.test.ts`, que roda com os demais testes: o domínio não importa React nem outras camadas, páginas e componentes não falam com o servidor, uma página não importa outra página, a hora só vem do relógio simulado e o código de produção não tem comentários.

## Padrão de código

O estilo é definido pelo [Prettier](https://prettier.io/) (`.prettierrc.json`) e pelo `.editorconfig`:

- ponto e vírgula no fim das instruções;
- aspas duplas;
- vírgula final (trailing comma) em listas e objetos multilinha;
- indentação de 2 espaços e linhas de até 80 colunas;
- fim de linha LF.

Rode `npm run format` antes de commitar e `npm run format:check` para validar. No VS Code, instale a extensão Prettier e ative "Format on Save".

## Estrutura

```
src/
  main.tsx       providers (Mantine, Auth) e o roteador
  routes.tsx     rotas e guardas (loaders) por perfil
  paths.ts       página inicial de cada perfil
  auth/          usuários de demonstração, sessão, contexto e o enum Role
  pages/         uma pasta por perfil e, dentro dela, uma pasta por página
    login/
    consultant/tickets/   visão da Marina (a página e seus components/)
    manager/tickets/      visão do Ricardo (resumo, quadro da equipe, painel, conversa e redistribuição)
    manager/dashboard/    semana da equipe (tempo sem chamado e produção por consultor)
    customer/tickets/     visão da Helena (a fazer)
  components/    cabeçalho, layout, badges, tema claro/escuro e a conversa do chamado (usados por mais de um perfil)
  domain/        enums, tipos, status, SLA, carga da equipe e regras que alteram o chamado (sem React)
  lib/           relógio simulado e formatação
  server/        "backend" simulado (dados, regras, API, socket, simulador)
  store/         estado da tela, ações, ligação em tempo real e o enum LoadStatus
  integration/   testes que exercitam o app inteiro (login, resposta, troca de usuário, visão do gestor, conversa escalonada, semana da equipe)
  test-*.ts(x)   configuração e utilitários de teste
```

### Convenção para páginas

Cada página é uma pasta em `pages/<perfil>/<página>/`, e o `index.tsx` é a própria página. O que só ela usa vive dentro dela, e **cada componente é uma pasta** dentro de `components/`:

```
pages/consultant/tickets/
  index.tsx                  a página
  index.unit.test.tsx
  components/
    list/
      index.tsx              o componente (só a interface)
      types.ts               props e tipos
      enums.ts               enums que só este componente usa
      constants.ts           constantes
      utils.ts               funções puras, testáveis sem renderizar nada
      index.unit.test.tsx
      utils.unit.test.ts
```

Só entram os arquivos que o componente precisa. Quando um perfil ganhar outra página (`pages/consultant/reports/`), nada se mistura. O que mais de uma página usa sobe para `components/`.

### Enums, imports e testes

- **Enums no lugar de textos soltos:** todo conjunto fechado de valores (status, prioridade, perfis, tipos de evento, abas, estados de carregamento...) é um `enum`, para um erro de digitação virar erro de compilação e o editor completar o nome. Os enums de domínio ficam em `src/domain/enums.ts` e mantêm o valor que vem da API (por exemplo, `Status.InProgress` vale `"em_atendimento"`), então os dados e os eventos continuam iguais. Enums de um componente ficam no `enums.ts` dele. Por causa dos enums, o `erasableSyntaxOnly` do template do Vite está desligado no `tsconfig.app.json`.
- **Imports:** dentro da mesma página, caminhos relativos (`./types`, `../composer`). Para qualquer outro módulo de `src/`, o alias `@/` (por exemplo, `@/domain/enums`).
- **Testes:** ficam ao lado do que testam, com o sufixo `.unit.test.ts` (ou `.tsx`, quando renderizam). Rodam com Vitest em jsdom e Testing Library. `src/test-utils.tsx` tem `renderWithProviders`/`renderRoutes` (Mantine, autenticação e roteador) e `loadStoreAs(usuário)`, que carrega o store com os dados reais como aquele usuário os veria. Os componentes que chamam a API simulada têm `@/store/actions` substituído por um mock.
- **Testes de integração:** ficam em `src/integration/*.integration.test.tsx` e sobem o app de verdade (roteador com guardas, login, store, API simulada, socket e filtro de visibilidade), trocando só o que atrapalharia: o simulador de atividade fica desligado, o gerador de números aleatórios é determinístico (`resetWorld`) e, nos testes de resposta, o socket entrega cada evento duas vezes, como o brief permite. Cobrem: do login até a página do perfil, a resposta a um chamado sem duplicar a mensagem, a troca de usuário sem vazar dados e a visão do gestor (redistribuir chamados e acompanhar o quadro em tempo real), a conversa aberta pelo gestor e a página da semana da equipe. Rodam com `npm run test:integration`; levam de menos de 1 a uns 5 segundos cada, por causa da latência simulada e da espera para o socket entregar tudo. Como esperam de verdade, têm um limite de tempo maior que o dos testes unitários.

### Rotas e guardas

As URLs seguem `/<perfil>/tickets` (`consultant`, `manager`, `customer`). As guardas rodam como `loader` do React Router, **antes** de a página renderizar:

- sem sessão, qualquer rota redireciona para `/`;
- logado, `/` e rotas desconhecidas redirecionam para a página do próprio perfil;
- um perfil que abre a área de outro é redirecionado para a sua.

Isso é conveniência de interface: o controle de acesso de verdade pertence ao servidor.

## Dados

O `dados.json` (620 chamados, 3381 mensagens, 1558 entradas de histórico, 48 usuários, 2 grupos, 8 categorias e a tabela de SLA) fica na raiz do repositório e é carregado pela API simulada. As mudanças feitas na tela (e a atividade simulada) vivem só em memória: recarregar a página volta ao estado original do arquivo.
