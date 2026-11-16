# ADR 0022: Nomes que dizem o que são

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

Um nome como `t`, `e` ou `x` obriga quem lê a procurar a declaração para saber o que ele guarda. Com a tradução, `t` poderia ser um chamado, um texto, um tempo ou a função de tradução. O código já tinha dezenas de parâmetros de callback com uma letra só (`(t) =>`, `(e) =>`).

## Decisão

Todo identificador diz o que é: constante, função, variável, parâmetro, parâmetro de callback e hook.

- `ticket`, não `t`; `event`, não `e`; `translate`, não `t`; `consultant`, não `c`.
- Funções dizem o que fazem (`riskTickets`, `unassignedTickets`), e booleanos soam como pergunta (`isLocked`, `hasTickets`).
- Exceções fechadas: `_` (parâmetro que não se usa) e os nomes que fazem parte do contrato com a API ou são uma sigla de domínio (`id`, `ms`, `at`, `to`, `de`, o membro `Ok` de um enum). Nomes de propriedade de objetos de dados e de tokens de biblioteca (`sm`, `md`, `x`, `y`) não entram na regra.
- Vale também para os testes.

## Consequências

- O código se lê sem ir procurar declarações, e o diff de revisão fica mais claro.
- Callbacks ficam mais longos (`tickets.filter((ticket) => ...)`), e linhas podem quebrar mais no Prettier. É um custo pequeno.

## Regras

- Nada de nome de uma ou duas letras, nem abreviação que não seja uma sigla do domínio.
- O parâmetro de um callback leva o nome do que ele representa.

## Como é verificado

Pela regra `id-length` do oxlint (mínimo de 3 caracteres para variáveis, funções e parâmetros, com as exceções acima), que roda no `npm run lint`. O nome ser bom, e não só longo, é revisão.
