# ADR 0016: Estilo de código e idioma

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

Estilo e idioma sem regra viram discussão em toda revisão e deixam o código irregular. O projeto também começou com nomes em português (`ConsultorWorkspace`, `ChamadosPage`) misturados ao inglês, e com comentários que repetiam o que o código já dizia.

## Decisão

**Formatação.** O Prettier decide (`.prettierrc.json` e `.editorconfig`): ponto e vírgula no fim das instruções, aspas duplas, vírgula final em listas e objetos multilinha, indentação de 2 espaços, linhas de até 80 colunas e fim de linha LF. `npm run format` formata e `npm run format:check` valida.

**Sem comentários no código.** Um comentário que explica o que o código faz indica um nome ruim ou uma função grande demais, e se desatualiza. O porquê das decisões vive nas ADRs, no README e nas mensagens de commit.

**Idioma.**

- Identificadores, nomes de pastas e arquivos, mensagens de commit e nomes de testes em **inglês**.
- Textos da interface, README e ADRs em **português do Brasil**.
- Os campos que vêm do `dados.json` e os valores dos enums da API continuam em português (`chamado_id`, `em_atendimento`), porque são o contrato com a API.

**Imports.** Dentro de uma página, caminhos relativos. Para qualquer outro módulo de `src/`, o alias `@/` (por exemplo, `@/domain/enums`).

**Commits.** Prefixo convencional (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`) seguido de uma frase no imperativo, e um corpo que explica o porquê quando não é óbvio.

## Consequências

- O código tem uma cara só, e a revisão não gasta tempo com estilo.
- Sem comentários, a clareza depende de nomes bons e de funções pequenas. Essa disciplina é o custo.
- Quem lê o código precisa saber que os campos da API são em português por contrato.

## Regras

- Rode `npm run format` antes de commitar.
- Não escreva comentários no código de produção. Se algo precisa de explicação, renomeie, extraia uma função ou registre o porquê numa ADR.
- Nomes novos em inglês. Textos da interface em português.
- Alias `@/` fora da página, relativo dentro dela.

## Como é verificado

O `format:check` confere a formatação. O teste `src/architecture.test.ts` ("code style") falha se aparecer uma linha de comentário em código de produção. O idioma e os imports são revisão.
