# ADR 0010: A visibilidade é decidida no servidor

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

Cada perfil só pode ver parte dos dados: o cliente vê só os próprios chamados e **nunca** as notas internas, o consultor vê o grupo dele e o que lhe foi atribuído, o gestor vê os grupos que gere. Esconder um dado na tela não o protege, porque ele já chegou ao navegador.

## Decisão

O filtro fica em `src/server/visibility.ts` e vale em dois pontos: no carregamento inicial (`scopedSnapshot`) e em cada evento enviado pelo socket (`eventFor`). O que um perfil não pode ver nunca chega ao store dele.

- Cliente: chamados em que é o solicitante; sem mensagens internas; entre os usuários, só ele mesmo como cliente.
- Consultor: chamados do próprio grupo ou atribuídos a ele.
- Gestor: chamados dos grupos que gere.

## Consequências

- Não existe a possibilidade de um componente "esquecer" de esconder uma nota interna.
- A regra é testável sem interface.
- Com um backend real, essa responsabilidade é do servidor, e a tela não muda.

## Regras

- Nenhum componente decide se um dado é visível a um perfil. Se o dado está no store, o perfil pode vê-lo.
- Toda função nova que entrega dados (carga ou evento) passa pelo filtro de visibilidade.
- Mudança de regra de visibilidade vem com teste em `visibility.test.ts`.

## Como é verificado

Por `src/server/visibility.test.ts` e pelo teste de integração de troca de usuário, que confere que o store de cada perfil tem só a fatia que ele pode ver e que um carregamento atrasado do usuário anterior não vaza para o próximo.
