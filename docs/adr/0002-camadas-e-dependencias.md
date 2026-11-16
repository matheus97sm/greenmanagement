# ADR 0002: Camadas e a direção das dependências

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

O sistema real terá um backend, e as regras de SLA, ordenação e carga da equipe precisam valer igual no servidor (aqui simulado) e na tela. Se uma regra morar dentro de um componente, ela não pode ser reaproveitada nem testada sem montar a interface. Se as camadas se importarem em qualquer direção, trocar a simulação por um backend real passa a mexer em tudo.

## Decisão

O código se organiza em camadas, e cada uma só pode depender das que estão abaixo dela:

```
pages/ e components/   React + Mantine: desenham a tela e disparam ações
        ↓
store/                 estado da tela, ações e ligação em tempo real
        ↓
domain/                regras puras, sem React e sem I/O

server/ (simulado)     adaptador: fala com o store por api e socket e reaproveita o domain
lib/                   utilitários sem regra de negócio (relógio simulado, formatação)
```

O que cada camada pode importar:

| Camada        | Pode importar                                  | Não pode importar                                     |
| ------------- | ---------------------------------------------- | ----------------------------------------------------- |
| `domain/`     | só `domain/`                                   | React, Mantine, store, server, lib, pages, components |
| `server/`     | `domain/`, `lib/`, `server/` e o `dados.json`  | React, store, pages, components                       |
| `store/`      | `domain/`, `lib/`, `server/`, React            | pages, components, hooks, router, `@mantine/core`     |
| `lib/`        | outros utilitários                             | store, server, pages, components                      |
| `components/` | store, domain, lib, hooks, auth                | pages, server                                         |
| `pages/`      | store, domain, lib, hooks, auth, `components/` | server, outras páginas                                |

## Consequências

- O domínio roda em qualquer ambiente (navegador, teste, Node) e se testa com funções puras.
- A tela nunca fala com o servidor direto. Tudo passa pelo store, então um backend real entra em um ponto só.
- Há um custo de cerimônia: uma regra nova precisa ser pensada como função do domínio antes de aparecer na tela.

## Regras

- Regra de negócio mora em `domain/` (ou no servidor, quando é autoridade). Componente só apresenta.
- Uma camada de cima nunca é importada por uma de baixo.
- Páginas e componentes usam `@/store/...`, nunca `@/server/...`.

## Como é verificado

Por `src/architecture.test.ts` (seção "layers"), que lê os imports de cada arquivo de produção e falha com a lista dos que violam.
