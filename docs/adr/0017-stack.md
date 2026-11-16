# ADR 0017: Stack e versões

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

O enunciado pede apenas React, e deixa o resto da stack livre. Pede também que a escolha de versões leve em conta que o sistema será mantido por anos: o que terá suporte nesse período é preferível ao que acabou de ser lançado. Não há backend, então a stack é só de front-end.

## Decisão

| Área                                | Escolha                                                                                      |
| ----------------------------------- | -------------------------------------------------------------------------------------------- |
| Build e servidor de desenvolvimento | Vite 8                                                                                       |
| Interface                           | React 19 com TypeScript 7                                                                    |
| Componentes                         | Mantine 9 (com `@mantine/notifications`) e ícones `@tabler/icons-react`                      |
| Rotas                               | React Router 8, com roteador de dados (`createBrowserRouter`) e `loader`s                    |
| Listas longas                       | TanStack Virtual                                                                             |
| Estado da tela                      | Store próprio sobre `useSyncExternalStore` ([ADR 0009](0009-estado-dirigido-por-eventos.md)) |
| Testes                              | Vitest 5, jsdom e Testing Library ([ADR 0015](0015-estrategia-de-testes.md))                 |
| Formatação e lint                   | Prettier e oxlint                                                                            |

Alguns pontos de comportamento:

- Biblioteca de componentes: o enunciado permite qualquer uma e não avalia identidade visual, então não compensa montar componentes básicos do zero. O Mantine foi a escolha do projeto.
- Tema claro por padrão, com um botão no cabeçalho para alternar para o escuro. O Mantine guarda a escolha.
- Não há biblioteca de estado nem de busca de dados. O enunciado exige tratar eventos repetidos, fora de ordem e atrasados, e isso precisa estar explícito.

## Consequências

- Poucas dependências de runtime.
- Escolher um framework de componentes amarra a aparência a ele. Trocar é caro.

## Pontos em aberto

- **Dependências instaladas e não usadas:** `@tanstack/react-query` e `idb` constam no `package.json` desde o início e nenhum arquivo as importa. Devem ser removidas ou adotadas. O candidato natural para o React Query é a busca de dados quando existir um backend real.
- **Versões:** são as estáveis mais recentes. Antes de ir para produção, vale conferir o ciclo de suporte de cada uma (React, Vite, TypeScript, Mantine, React Router), já que o enunciado pede preferir o que terá suporte longo.

## Regras

- Dependência nova de runtime pede uma justificativa e, se mudar a forma de organizar o código, uma ADR.
- Usar a biblioteca de componentes antes de escrever um componente básico do zero.
- Não adicionar dependência que não seja usada: se for instalada, é para ser importada.

## Como é verificado

Por revisão do `package.json` a cada dependência nova.
