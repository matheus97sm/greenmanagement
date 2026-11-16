# ADR 0005: Um componente, uma pasta

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

Um componente que acumula tipos, enums, constantes, funções auxiliares e testes no mesmo arquivo cresce até ficar difícil de ler e de testar. Misturar tudo também esconde o que é lógica pura (fácil de testar) do que é interface.

## Decisão

Cada componente vive em uma pasta própria, e só entram os arquivos de que ele precisa:

```
components/list/
  index.tsx              o componente
  types.ts               props e tipos
  enums.ts               valores fixos do componente
  constants.ts           números e textos fixos
  utils.ts               funções puras
  index.unit.test.tsx    testa o que se vê
  utils.unit.test.ts     testa as funções puras
```

A lógica que não precisa de React (filtrar, ordenar, montar a linha do tempo, calcular permissões, juntar dados para uma linha) vai para `utils.ts`, e o `index.tsx` fica só com a interface. Vale também para a página: o `index.tsx` de uma página guarda estado e liga as peças, e as decisões (o que mostrar, qual seleção sobrevive, como um clique muda o foco) ficam no `utils.ts` dela, com teste. Quando um componente tem uma peça interna repetida e pesada, ela vira um arquivo irmão (por exemplo `row.tsx`, memorizada).

## Consequências

- O `index.tsx` fica curto e cada arquivo tem um assunto.
- Há mais arquivos. Por isso a regra é "só o que precisa": um componente de 20 linhas não ganha `types.ts` vazio.
- Os testes ficam ao lado do que testam, então apagar um componente apaga seus testes.

## Regras

- Um componente por pasta, com `index.tsx` como entrada.
- Tipos em `types.ts`, valores fixos em `enums.ts` e `constants.ts`, funções puras em `utils.ts`.
- Testes com o sufixo `.unit.test.ts` ou `.unit.test.tsx` (este último quando renderiza).
- Props e demais tipos nunca são declarados dentro de um arquivo `.tsx`: vão para `types.ts`.
- Não criar arquivo vazio só para seguir o padrão.

## Como é verificado

Por `src/architecture.test.ts` ("components"): nenhum componente fica solto em `src/components`, toda pasta de componente tem `index.tsx` e um teste unitário, e nenhum `.tsx` de componente ou página declara `interface` ou `type`. Manter a lógica em `utils.ts` é revisão.
