# ADR 0015: Estratégia de testes

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

Testes unitários de cada peça não pegam o que acontece quando as peças trabalham juntas: o store que continuava com os dados do usuário anterior depois de sair, e o carregamento atrasado de uma pessoa que vazava mensagens (inclusive notas internas) para a próxima, só apareceram quando o app inteiro foi exercitado. Ao mesmo tempo, subir o app em todo teste é lento. Precisamos dos dois níveis, cada um pegando o que o outro não pega.

## Decisão

Três níveis, todos com Vitest, jsdom e Testing Library:

1. **Domínio e servidor.** Funções puras e regras: SLA, ordenação, carga, atividade, permissões, transições e visibilidade. Ficam ao lado do código (`*.test.ts`).
2. **Componentes.** Um arquivo por componente (`index.unit.test.tsx`) e um por módulo de funções (`utils.unit.test.ts`). Quando o componente chama a API simulada, `@/store/actions` é substituído por um mock.
3. **Integração.** Em `src/integration/*.integration.test.tsx`, sobem o app de verdade (roteador com guardas, login, store, API simulada, socket e visibilidade). Só mudam duas coisas: o simulador de atividade fica desligado, e o gerador de números aleatórios é determinístico (`resetWorld`). Nos testes de resposta, o socket entrega cada evento duas vezes.

Os testes usam os **dados reais** (`dados.json`, por `src/test-data.ts`). `loadStoreAs(usuário)` carrega o store como aquele usuário o veria. Testes de integração esperam de verdade (latência simulada), então têm um limite de tempo maior (20 s) que o dos unitários.

Um erro encontrado vira um teste que o reproduz, e o teste só vale se falhar sem a correção: remove-se a correção, confere-se que o teste quebra, e a correção volta.

## Consequências

- Os erros de integração acima foram achados e ficaram cobertos.
- A suíte completa leva cerca de um minuto e meio. Os testes de integração rodam à parte com `npm run test:integration`.
- Os testes dependem do conteúdo do `dados.json` (por exemplo, "Thiago tem 75 chamados"). Se os dados mudarem, os testes precisam acompanhar.

## Regras

- Comportamento novo vem com teste no nível certo: regra no domínio, interface no componente, fluxo entre telas na integração.
- Todo erro corrigido ganha um teste de regressão que falha sem a correção.
- Não vale mockar o que o teste quer provar. A integração não mocka o store nem o socket (só duplica os eventos).
- Todo módulo com lógica tem teste ao lado: `*.test.ts` para funções e hooks, `*.unit.test.tsx` para componentes. Toda pasta de componente tem pelo menos um teste unitário.
- Nomes de testes em inglês, descrevendo o comportamento (`it("shows ...")`).
- Para lista longa, testar o que a pessoa vê (busca, contadores), lembrando que só as linhas visíveis estão no DOM ([ADR 0014](0014-listas-grandes.md)).

## Como é verificado

Pela própria suíte (`npm test` roda tudo e `npm run test:integration` só a integração) e por `src/architecture.test.ts`, que exige um teste unitário em toda pasta de componente. Que um módulo de lógica tenha teste é revisão.
