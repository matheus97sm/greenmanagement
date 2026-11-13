# Green Management

Reescrita do sistema de gestão de serviços de TI (ITSM), focada na área de chamados. É um projeto de estudo: roda 100% no navegador, **sem backend**. A API e os eventos em tempo real (WebSocket) serão simulados no próprio front-end.

> **Estado atual:** login, API/WebSocket simulados com o `dados.json` real e a visão da **Marina (consultora)**. As visões do Ricardo (gestor) e da Helena (cliente) ainda não foram feitas.

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

| Comando                | O que faz                                          |
| ---------------------- | -------------------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento com recarga automática |
| `npm run build`        | Checagem de tipos (`tsc`) e build de produção      |
| `npm run preview`      | Serve o build de produção localmente               |
| `npm run lint`         | Executa o oxlint                                   |
| `npm test`             | Executa os testes com Vitest (modo watch)          |
| `npm run format`       | Formata o código com o Prettier                    |
| `npm run format:check` | Verifica a formatação sem alterar arquivos         |

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
  main.tsx      providers (Mantine, Auth) e o roteador
  routes.tsx    rotas e guardas (loaders) por perfil
  paths.ts      página inicial de cada perfil
  auth/         usuários de demonstração, sessão e contexto de autenticação
  pages/        uma pasta por perfil e, dentro dela, uma pasta por página
    login/                 tela de login (única página sem perfil)
    consultant/tickets/    visão da Marina: lista, detalhe, composer e modal de status
    manager/tickets/       visão do Ricardo (a fazer)
    customer/tickets/      visão da Helena (a fazer)
  components/   cabeçalho, layout autenticado e badges (usados por mais de um perfil)
  domain/       tipos, status, SLA e regras que alteram o chamado (sem React)
  lib/          relógio simulado e formatação
  server/       "backend" simulado (dados, regras, API, socket, simulador)
  store/        estado da tela, ações e ligação em tempo real
```

### Convenção para páginas

Cada página fica em `pages/<perfil>/<página>/`, com a página e os componentes que só ela usa dentro da própria pasta (por exemplo, `pages/consultant/tickets/`). Assim, quando um perfil ganhar outra página (`pages/consultant/reports/`), nada se mistura. Só o que mais de uma página usa sobe para `components/`.

### Rotas e guardas

As URLs seguem `/<perfil>/tickets` (`consultant`, `manager`, `customer`). As guardas rodam como `loader` do React Router, **antes** de a página renderizar:

- sem sessão, qualquer rota redireciona para `/`;
- logado, `/` e rotas desconhecidas redirecionam para a página do próprio perfil;
- um perfil que abre a área de outro é redirecionado para a sua.

Isso é conveniência de interface: o controle de acesso de verdade pertence ao servidor.

## Dados

O `dados.json` (620 chamados, 3381 mensagens, 1558 entradas de histórico, 48 usuários, 2 grupos, 8 categorias e a tabela de SLA) fica na raiz do repositório e é carregado pela API simulada. As mudanças feitas na tela (e a atividade simulada) vivem só em memória: recarregar a página volta ao estado original do arquivo.
