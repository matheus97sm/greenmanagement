# ADR 0011: Regras de negócio em funções puras no domínio

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

As regras de SLA, de ordenação da lista, de carga da equipe e de atividade da semana precisam dar o mesmo resultado no servidor simulado e na tela, e precisam ser fáceis de testar com casos concretos. Regra dentro de componente se testa montando a interface, e regra duplicada entre servidor e tela acaba divergindo.

## Decisão

As regras vivem em `src/domain` como funções puras: recebem os dados e o instante de referência (`now`) como parâmetros e devolvem um resultado, sem ler estado global, relógio ou DOM.

| Módulo                    | O que decide                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `sla.ts`                  | Dois prazos por chamado, relógio pausado em "aguardando cliente", estado do prazo e a ordem da lista em três faixas |
| `rules.ts`                | Como atribuição, mensagem e mudança de status alteram o chamado, e a renovação do SLA na reabertura                 |
| `status.ts`               | Transições permitidas, rótulos, cores e prioridades                                                                 |
| `workload.ts`             | Carga de cada consultor, chamados em risco, fila sem responsável e quem está ocioso ou sobrecarregado               |
| `week.ts` e `activity.ts` | A semana de trabalho e o tempo sem chamado (ver [ADR 0013](0013-semana-e-tempo-sem-chamado.md))                     |
| `search.ts`               | A busca de chamados                                                                                                 |

O servidor simulado e o store usam as mesmas funções (`applyAssignment`, `applyStatusChange`, `applyMessage`, `renewSla`).

## Consequências

- Cada regra se testa com poucas linhas e dados reais, sem renderizar nada.
- Uma regra muda em um lugar só.
- Com um backend real, o servidor é a autoridade e a tela passa a só exibir. As funções de exibição (ordem, risco, carga) continuam úteis no cliente, e as de escrita viram contrato entre os dois lados.

## Regras

- Lógica de negócio nova entra em `domain/` como função pura com testes.
- Funções do domínio recebem `now` por parâmetro. Nunca leem a hora.
- O domínio não importa nada fora de `domain/`.
- Servidor e tela chamam a mesma função, sem reimplementar a regra.

## Como é verificado

Por `src/architecture.test.ts` (o domínio só importa o domínio) e pelos testes de cada módulo em `src/domain`. O restante, como não pôr regra em componente, é revisão.
