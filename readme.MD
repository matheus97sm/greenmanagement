# Green Management

Reescrita do sistema de gestão de serviços de TI (ITSM), focada na área de chamados. É um projeto de estudo: roda 100% no navegador, **sem backend**. A API e os eventos em tempo real (WebSocket) serão simulados no próprio front-end.

> **Estado atual:** estrutura do projeto, tela de login e layout autenticado (cabeçalho com saída). A área de chamados (`/chamados`) ainda é um espaço reservado.

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

Para rodar os testes uma única vez (por exemplo, em CI): `npx vitest run`. Ainda não há testes escritos.

## Como ver a tela como cada perfil

O login é **simulado** (não há backend nem segurança real). Os três usuários usam a mesma senha:

**Senha de todos: `senha123`**

| Perfil              | E-mail                         | Papel     |
| ------------------- | ------------------------------ | --------- |
| Marina (consultora) | `marina@greenmanagement.test`  | consultor |
| Ricardo (gestor)    | `ricardo@greenmanagement.test` | gestor    |
| Helena (cliente)    | `helena@cliente.test`          | cliente   |

Na tela de login, clicar em um dos usuários da seção "Usuários de demonstração" preenche e-mail e senha automaticamente.

Para trocar de perfil, clique no ícone de sair no cabeçalho e entre com outro usuário.

## Como testar manualmente o que existe hoje

1. Acesse `/`: deve aparecer a tela de login.
2. Entre com uma senha errada: deve aparecer "E-mail ou senha inválidos."
3. Entre com um dos usuários acima: você é levado a `/chamados` e o cabeçalho mostra seu nome e perfil.
4. Recarregue a página: a sessão continua (fica salva no `localStorage`).
5. Acesse `/` estando logado: você é redirecionado para `/chamados`.
6. Clique em sair: volta ao login. Acessar `/chamados` deslogado também redireciona para `/`.

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
  auth/         usuários de demonstração, contexto e provedor de autenticação
  components/   cabeçalho e layout das páginas autenticadas
  pages/        LoginPage e ChamadosPage
  App.tsx       definição das rotas
  main.tsx      providers (Mantine, Router, Auth)
```

## Dados

O brief prevê um arquivo `dados.json` (chamados, mensagens, histórico de status, usuários, grupos e SLAs). Ele ainda não foi adicionado ao projeto. Quando for, ficará versionado dentro do repositório e alimentará a API simulada.
