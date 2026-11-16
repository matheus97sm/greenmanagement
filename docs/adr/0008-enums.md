# ADR 0008: Enums no lugar de textos soltos

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

Status, prioridade, perfil e tipo de evento aparecem em dezenas de lugares. Com strings soltas (`"em_atendimento"`), um erro de digitação passa pelo compilador e só aparece em execução, e o editor não ajuda a completar.

## Decisão

Todo conjunto fechado de valores é um `enum` do TypeScript, cujo valor é **o mesmo texto que vem da API** (por exemplo, `Status.InProgress` vale `"em_atendimento"`). Assim os dados e os eventos continuam iguais.

- Enums de domínio ficam em `src/domain/enums.ts` (`Status`, `Priority`, `Profile`, `EventType`, `HistoryType`, `SlaKind`, `SlaClock`, `LoadLevel`).
- Enums de autenticação ficam em `src/auth/enums.ts` e os do store em `src/store/enums.ts`.
- Enums de um componente ficam no `enums.ts` da pasta dele (abas, filtros, tipo de foco, ordenação).
- Rótulos e cores de um enum vivem em `Record<Enum, ...>`, então acrescentar um valor obriga o compilador a pedir o rótulo e a cor dele.

Por causa dos enums, o `erasableSyntaxOnly` do template do Vite está desligado em `tsconfig.app.json`.

## Consequências

- Erro de digitação vira erro de compilação, e o editor completa os nomes.
- Os campos que vêm do `dados.json` continuam em português (`chamado_id`, `prioridade`), porque são o contrato com a API. Só os nomes que **nós** damos são em inglês.
- Enums ocupam mais linhas que uniões de strings. Aceito pelo ganho em clareza.

## Regras

- Um valor de um conjunto fechado nunca aparece como string solta no código.
- O valor do enum é o texto da API.
- Mapas de rótulo e de cor usam `Record<Enum, ...>`.
- Enum de componente fica na pasta do componente, enum compartilhado no módulo da camada dele.

## Como é verificado

Pelo compilador (`tsc`) para o uso de enums e de `Record`. A regra de não usar strings soltas depende de revisão.
