# Decisões de arquitetura (ADRs)

Cada arquivo desta pasta registra **uma decisão** que moldou o projeto: o problema, o que foi escolhido, o que isso custa e o que quem for mexer no código precisa seguir. O objetivo é manter a arquitetura constante: quem chega depois (ou nós mesmos, daqui a meses) não precisa adivinhar por que as coisas são assim.

## Como usar

- **Antes de criar algo novo** (página, componente, regra, dependência), leia os ADRs do assunto. Eles dizem onde o código vai e o que ele pode importar.
- **Para mudar uma regra**, não edite um ADR aceito. Escreva um novo a partir do [modelo](0000-modelo.md), explique o que mudou e marque o antigo como _Substituída pela ADR XXXX_. O histórico fica no repositório.
- **Para registrar uma decisão nova**, copie o modelo, use o próximo número e acrescente a linha na tabela abaixo. Decisões pequenas e reversíveis não precisam de ADR. As que afetam vários lugares do código, ou que alguém vai querer desfazer sem saber o porquê, precisam.

## O que é verificado automaticamente

Parte das regras é conferida por `src/architecture.test.ts`, que roda junto com os outros testes (`npm test`). Ele falha se, por exemplo, o domínio importar React, uma página importar outra página, aparecer um comentário no código, um componente ficar solto fora de uma pasta ou sem teste, um tipo for declarado dentro de um `.tsx`, uma página importar o objeto `ticketsStore` ou o valor de um enum aparecer como string solta. As ADRs indicam em **Como é verificado** quando a regra está nesse teste e quando depende de revisão.

## Índice

| ADR                                                  | Decisão                                                | Status |
| ---------------------------------------------------- | ------------------------------------------------------ | ------ |
| [0001](0001-registrar-decisoes.md)                   | Registrar as decisões de arquitetura                   | Aceita |
| [0002](0002-camadas-e-dependencias.md)               | Camadas e a direção das dependências                   | Aceita |
| [0003](0003-servidor-simulado-como-adaptador.md)     | O servidor simulado é um adaptador                     | Aceita |
| [0004](0004-paginas-por-perfil.md)                   | Uma pasta por perfil e por página                      | Aceita |
| [0005](0005-um-componente-uma-pasta.md)              | Um componente, uma pasta                               | Aceita |
| [0006](0006-componentes-compartilhados.md)           | Componentes compartilhados sobem para `src/components` | Aceita |
| [0007](0007-rotas-e-guardas.md)                      | Rotas por perfil com guardas antes de renderizar       | Aceita |
| [0008](0008-enums.md)                                | Enums no lugar de textos soltos                        | Aceita |
| [0009](0009-estado-dirigido-por-eventos.md)          | Estado da tela dirigido por eventos                    | Aceita |
| [0010](0010-visibilidade-no-servidor.md)             | A visibilidade é decidida no servidor                  | Aceita |
| [0011](0011-regras-no-dominio.md)                    | Regras de negócio em funções puras no domínio          | Aceita |
| [0012](0012-relogio-simulado.md)                     | Relógio simulado                                       | Aceita |
| [0013](0013-semana-e-tempo-sem-chamado.md)           | Semana de trabalho e tempo sem chamado                 | Aceita |
| [0014](0014-listas-grandes.md)                       | Listas grandes: virtualizar e memorizar                | Aceita |
| [0015](0015-estrategia-de-testes.md)                 | Estratégia de testes                                   | Aceita |
| [0016](0016-estilo-e-idioma.md)                      | Estilo de código e idioma                              | Aceita |
| [0017](0017-stack.md)                                | Stack e versões                                        | Aceita |
| [0018](0018-visao-do-cliente-sem-termos-internos.md) | A visão do cliente não mostra termos internos          | Aceita |
| [0020](0020-marcas-de-leitura.md)                    | Marcas de leitura guardadas por pessoa                 | Aceita |
