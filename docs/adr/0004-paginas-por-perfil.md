# ADR 0004: Uma pasta por perfil e por página

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

O sistema é um só, com três perfis que o usam de forma muito diferente: a consultora trabalha em chamados, o gestor trabalha em pessoas e risco, e a cliente quer saber se alguém pegou o chamado dela. A primeira organização do projeto era por funcionalidade (uma pasta "features"), o que escondia essa diferença e prometia uma bagunça a cada página nova. Também havia nomes em português nas pastas.

## Decisão

As páginas ficam em `src/pages/<perfil>/<página>/`, com nomes em inglês:

```
src/pages/
  login/
  consultant/tickets/
  manager/tickets/
  manager/dashboard/
  customer/tickets/
```

A pasta da página é a própria página: `index.tsx` é a página e os componentes que só ela usa ficam em `components/`. A URL segue `/<perfil>/<página>`, e a rota decide qual página montar (ver [ADR 0007](0007-rotas-e-guardas.md)).

Cada perfil tem a própria pasta porque as telas respondem a perguntas diferentes. Juntar a consultora e o gestor numa tela só, controlada por permissões, deixaria as duas piores.

## Consequências

- Um perfil novo é uma pasta e uma rota, sem tocar nos outros.
- Duas páginas de perfis diferentes podem repetir um pouco de estrutura. Isso é aceito até que algo seja de fato compartilhado (ver [ADR 0006](0006-componentes-compartilhados.md)).
- Com muitos perfis parecidos, esta divisão deixa de compensar. Nesse caso o caminho é um perfil virar um conjunto de permissões sobre uma página só, o que pede uma nova ADR.

## Regras

- Uma página nunca importa de outra página. O que as duas precisam sobe para `src/components`.
- Dentro de uma página, os imports são relativos (`./types`, `./components/list`). Para qualquer outro módulo de `src/`, usa-se `@/`.
- Nomes de pastas e arquivos em inglês.
- Perfis com telas muito parecidas pedem uma discussão antes de ganhar uma pasta nova.

## Como é verificado

Por `src/architecture.test.ts` ("pages and shared components"): nenhum arquivo de uma página importa de outra. O restante é revisão.
