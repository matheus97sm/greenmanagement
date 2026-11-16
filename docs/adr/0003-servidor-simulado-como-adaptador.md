# ADR 0003: O servidor simulado é um adaptador

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

O enunciado pede uma tela em tempo real, mas não há backend: a API e o WebSocket precisam ser simulados, e o enunciado diz que "um mesmo evento pode ser entregue mais de uma vez". A simulação deve ser fiel o bastante para exercitar os problemas reais (latência, repetição, atraso, permissões) e fácil de trocar.

## Decisão

Tudo o que seria o servidor fica em `src/server` e roda no navegador:

- `db.ts` carrega o `dados.json` como um primeiro `GET` e o mantém em memória;
- `ops.ts` aplica as regras de negócio (permissões, transições, relógio do SLA) e publica eventos;
- `api.ts` expõe as operações como chamadas assíncronas, com latência de 120 a 400 ms (e de 300 a 600 ms para o carregamento inicial);
- `socket.ts` entrega cada evento com atraso de 80 a 350 ms e repete cerca de 12% deles entre 400 ms e 1,5 s depois;
- `visibility.ts` filtra o que cada perfil pode ver (ver [ADR 0010](0010-visibilidade-no-servidor.md));
- `simulator.ts` gera a atividade de outras pessoas.

A tela só conhece o servidor por `store/actions.ts` (pedidos) e `store/realtime.ts` (eventos). Para usar um backend real, substitui-se `src/server` e esses dois arquivos.

## Consequências

- A simulação é desligável e substituível sem tocar nas páginas.
- Os testes de integração usam a mesma simulação, com o simulador de atividade desligado.
- O servidor simulado é mais simples do que um real: não há concorrência de verdade nem persistência.

## Regras

- Nada fora de `src/store` importa de `src/server`.
- `src/server` não importa React, store, páginas nem componentes.
- Uma regra de negócio nova entra em `domain/` e é usada pelo `ops.ts`, nunca duplicada nele.

## Como é verificado

Por `src/architecture.test.ts` ("layers"): o servidor não importa a tela nem o store, e páginas e componentes não importam o servidor.
