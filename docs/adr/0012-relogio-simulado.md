# ADR 0012: Relógio simulado

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

O `dados.json` está congelado em `meta.agora` (3 de novembro de 2026, 13:00 UTC), e o enunciado diz para considerar esse instante como "agora" nos prazos. Com o relógio real, todo prazo pareceria estourado há dias, e nenhuma tela teria o comportamento que o enunciado descreve.

## Decisão

Todo o código lê o tempo por `src/lib/clock.ts`. Ao carregar o retrato, o relógio é ancorado em `meta.agora` e passa a andar em tempo real a partir dali (`now()` e `nowIso()`). `useNow` (em `src/hooks`) devolve esse instante e o atualiza a cada 30 segundos, o que reordena e recalcula a tela sozinha.

Datas são exibidas no fuso e no idioma do usuário (`zoneinfo` e `locale` do cadastro).

## Consequências

- Os prazos, a ordem da lista e o tempo da semana fazem sentido logo ao abrir a tela.
- Os testes ancoram o relógio no mesmo instante e ficam determinísticos.
- Quem ler `Date.now()` no código vê um valor diferente do da tela, por isso a regra abaixo existe.

## Regras

- `Date.now()` e `new Date()` sem argumento só aparecem em `src/lib/clock.ts`.
- Lógica que depende de tempo recebe `now` por parâmetro (ver [ADR 0011](0011-regras-no-dominio.md)). Componentes obtêm o valor com `useNow`.
- Para trocar o relógio por um real, muda-se só `clock.ts`.

## Como é verificado

Por `src/architecture.test.ts` ("time"): falha se `Date.now()` ou `new Date()` aparecer fora do relógio.
