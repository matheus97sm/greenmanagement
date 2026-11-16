# ADR 0006: Componentes compartilhados sobem para `src/components`

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

A conversa de um chamado nasceu na página da consultora. Quando o gestor precisou abrir a conversa de um chamado escalonado, havia duas saídas ruins: copiar o componente ou importá-lo de dentro da página da consultora. A primeira duplica regra, a segunda cria dependência entre páginas. O componente também tinha regras da consultora embutidas (só quem atende responde, só quem atende muda o status), e o gestor precisa de outras.

## Decisão

Um componente usado por duas ou mais páginas sobe para `src/components`, na forma de pasta (ver [ADR 0005](0005-um-componente-uma-pasta.md)). Foi o caso de `ticket-detail`, `composer`, `message-bubble` e `status-modal`.

Para servir perfis diferentes, o componente compartilhado segue três regras:

1. **O que cada perfil pode fazer sai de uma função pura.** `permissionsFor(...)` em `ticket-detail/utils.ts` recebe o chamado, o perfil e o usuário e devolve `canTake`, `canReply` e `canChangeStatus`. O componente não espalha `if (perfil === ...)`.
2. **A página que hospeda acrescenta o que é só dela por um espaço reservado.** A conversa recebe `extraActions`, e a página do gestor usa isso para pôr o botão "Redistribuir".
3. **A interface mostra de quem é cada coisa.** Toda mensagem tem um selo com o perfil do autor (Cliente, Consultor, Gestor), borda lateral na mesma cor, e o fundo azul claro nas mensagens do cliente.

## Consequências

- A consultora e o gestor veem a mesma conversa, com ações diferentes, sem duplicar código.
- Mudar uma regra de permissão é mudar uma função com testes.
- O componente compartilhado conhece todos os perfis que o usam. Se isso crescer demais, é sinal de que ele deve ser dividido.

## Regras

- Dois usos, ou mais, de um componente: ele sobe para `src/components`. Um uso só: fica na página.
- Um componente em `src/components` nunca importa de `src/pages`.
- Permissões do componente saem de uma função pura testada, não de condicionais soltas.
- Comportamento específico de uma página entra por propriedade (`extraActions` ou equivalente), não por um `if` no componente.

## Como é verificado

Por `src/architecture.test.ts`: nenhum componente compartilhado importa uma página, e a regra de pasta por componente ([ADR 0005](0005-um-componente-uma-pasta.md)) vale para `src/components`. O restante é revisão.
