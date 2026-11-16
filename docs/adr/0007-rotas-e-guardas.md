# ADR 0007: Rotas por perfil com guardas antes de renderizar

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

Três perfis usam o mesmo sistema, e cada um só pode ver a própria área. Verificar o acesso dentro de cada página faz a tela do outro perfil aparecer por um instante antes do redirecionamento, e obriga a repetir a verificação em toda página nova.

## Decisão

As rotas são `/<perfil>/<página>` (`/consultant/tickets`, `/manager/tickets`, `/manager/dashboard`, `/customer/tickets`) e usam o roteador de dados do React Router (`createBrowserRouter`). As guardas são `loader`s, que rodam **antes** de a página renderizar:

- `/` (login): quem já tem sessão vai direto para a página do próprio perfil;
- cada área de perfil exige sessão e o perfil certo. Quem entra na área de outro é levado à página do seu próprio perfil, sem a outra chegar a aparecer;
- qualquer caminho desconhecido leva à página do perfil, ou ao login sem sessão;
- a página do gestor aceita um `id` opcional (`/manager/tickets/:id?`), que abre a conversa daquele chamado. O endereço pode ser compartilhado.

A autenticação é simulada: os três usuários de demonstração compartilham uma senha, a sessão é o id do usuário no `localStorage` (`greenmanagement.session`) e leituras e escritas dele são protegidas por `try/catch`. Isso serve ao estudo e não é segurança.

Quem monta o ambiente de tempo real é o `AppLayout`: ao entrar um usuário, ele inicia a ligação em tempo real e, ao sair, a encerra e limpa o store (ver [ADR 0009](0009-estado-dirigido-por-eventos.md)).

## Consequências

- Nenhuma página precisa se preocupar com quem pode vê-la.
- Uma página nova é um filho de `profileRoute(perfil, ...)` em `routes.tsx`.
- O guarda confia na sessão local. Com um backend real, o servidor passa a ser quem autoriza.

## Regras

- O controle de acesso mora no `loader` da rota, nunca dentro de uma página.
- Páginas novas entram em `profileRoute` e usam o prefixo do perfil.
- A página inicial de cada perfil vem de `homePath(role)` em `src/paths.ts`.
- Estado que precisa sobreviver a uma navegação ou ser compartilhado por link vai na URL.

## Como é verificado

Por `src/routes.test.ts` (acesso de cada perfil, redirecionamentos e rotas do gestor) e pelo teste de integração de login.
