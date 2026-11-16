# ADR 0009: Estado da tela dirigido por eventos

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

O enunciado diz que tudo acontece em tempo real, que as mudanças chegam por WebSocket e que **um mesmo evento pode ser entregue mais de uma vez**. Além disso, um evento pode chegar antes do chamado a que se refere, e um evento antigo pode chegar depois de um mais novo. A tela precisa continuar correta, sem duplicar mensagens nem voltar a um estado anterior.

## Decisão

O estado da tela vive em um store próprio (`src/store/ticketsStore.ts`), lido com `useSyncExternalStore`, sem biblioteca de estado. Ele carrega um retrato (`snapshot`) do que o perfil pode ver e depois aplica eventos por um redutor com estas garantias:

- **Idempotência:** o `id` de cada evento é guardado, e um evento já visto é ignorado.
- **Ordem:** um evento de status ou de atribuição mais antigo que o estado atual não sobrescreve o mais novo (`statusAt` e `assignedAt`).
- **Órfãos:** um evento de um chamado que ainda não chegou fica em espera e é aplicado quando o chamado aparece.
- **Sessão:** ao terminar a sessão o store é limpo (`reset`), e uma resposta de carregamento pedida antes da limpeza é descartada (contador de geração). Sem isso, os dados de uma pessoa vazariam para a próxima.

As ações do usuário (`store/actions.ts`) aplicam os eventos devolvidos pela API. O socket entrega os mesmos eventos de novo, e a idempotência cuida de que nada apareça duas vezes.

## Consequências

- Mensagens, status e atribuições nunca duplicam nem regridem, mesmo com repetição, atraso e fora de ordem.
- O comportamento está explícito e testado, em vez de escondido numa biblioteca.
- O custo é manter esse código. Com um backend real, os dados de requisição (listas, filtros, paginação) podem ir para uma biblioteca como TanStack Query, e o store ficaria só com o tempo real.

## Regras

- Estado derivado de evento passa pelo redutor, nunca por uma atualização feita direto na tela.
- Todo evento novo precisa ser idempotente e tratar chamado desconhecido.
- Ao terminar a sessão, o store é limpo.
- Componentes leem o estado por `useTickets` (e por seletores exportados pelo store, como `unreadCount`) e mudam o estado por `store/actions.ts` (inclusive `markRead`). Nunca importam o objeto `ticketsStore`.

## Como é verificado

Por `src/store/ticketsStore.test.ts` (repetição, ordem, órfãos, geração), `src/store/actions.test.ts` e pelos testes de integração de resposta com evento duplicado e de troca de usuário. O teste `src/architecture.test.ts` ("the store") falha se uma página ou um componente importar `ticketsStore`.
