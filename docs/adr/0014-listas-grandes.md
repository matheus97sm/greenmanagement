# ADR 0014: Listas grandes: virtualizar e memorizar

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

O tenant tem 620 chamados, e a visão do gestor chegou a desenhar 200 linhas de uma vez, cada uma com cerca de oito componentes. Marcar um chamado levava cerca de 2 segundos: cada clique redesenhava a página inteira, inclusive todas as linhas, o quadro da equipe e o resumo. Digitar na busca e trocar de aba tinham o mesmo custo.

## Decisão

Listas que podem ter centenas de itens seguem quatro regras:

1. **Virtualizar.** Só as linhas perto da área visível entram no DOM (TanStack Virtual), como já fazia a lista da consultora.
2. **Limitar.** O painel do gestor mostra os 100 chamados mais urgentes e avisa quando há mais. Selecionar tudo vale para o que está na lista.
3. **Memorizar a linha.** Cada linha é um componente com `memo`, que recebe seus dados já calculados (`useMemo` na lista) e um booleano para o que muda por linha (`selected`, `locked`). Marcar um chamado redesenha só a linha dele.
4. **Callbacks estáveis.** Funções passadas às linhas e a blocos pesados (quadro, resumo) usam `useCallback` e atualizações funcionais de estado (`setX(atual => ...)`), para não quebrarem o `memo`.

Medida em ambiente de teste: um clique foi de cerca de 250 ms para cerca de 12 ms, e a digitação na busca de cerca de 260 ms para cerca de 40 ms.

## Consequências

- A tela continua rápida mesmo com listas longas e muitos eventos chegando.
- A lista virtualizada não tem todas as linhas no DOM, então testes e buscas por texto só enxergam as visíveis. Os testes usam a busca da própria página ou um contador de resultados.
- O código tem um pouco mais de peça (memo, callbacks estáveis), o que se paga só onde a lista é longa.

## Regras

- Lista com mais de algumas dezenas de itens é virtualizada.
- A linha de uma lista longa é um componente `memo` com props estáveis.
- Não otimizar sem medir. Meça o antes e o depois, e deixe um teste que impeça a regressão.
- Estado que muda por interação (seleção, foco) não pode forçar a lista inteira a redesenhar.

## Como é verificado

Pelo teste que marca um chamado e confere que só uma linha foi redesenhada (`ticket-queue/index.unit.test.tsx`), que falha se o `memo` for removido. O restante é revisão.
