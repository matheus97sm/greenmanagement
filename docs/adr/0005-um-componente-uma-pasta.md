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

A lógica que não precisa de React (filtrar, ordenar, montar a linha do tempo, calcular permissões) vai para `utils.ts`, e o `index.tsx` fica só com a interface. Quando um componente tem uma peça interna repetida e pesada, ela vira um arquivo irmão (por exemplo `row.tsx`, memorizada).

## Consequências

- O `index.tsx` fica curto e cada arquivo tem um assunto.
- Há mais arquivos. Por isso a regra é "só o que precisa": um componente de 20 linhas não ganha `types.ts` vazio.
- Os testes ficam ao lado do que testam, então apagar um componente apaga seus testes.

## Regras

- Um componente por pasta, com `index.tsx` como entrada.
- Tipos em `types.ts`, valores fixos em `enums.ts` e `constants.ts`, funções puras em `utils.ts`.
- Testes com o sufixo `.unit.test.ts` ou `.unit.test.tsx` (este último quando renderiza).
- Não criar arquivo vazio só para seguir o padrão.

## Como é verificado

Por revisão. Os componentes soltos que existem em `src/components` (Badges, AppHeader, AppLayout, Stat, ColorSchemeToggle) são uma dívida conhecida e não servem de exemplo. Os novos seguem esta ADR.
