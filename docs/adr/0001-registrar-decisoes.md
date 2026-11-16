# ADR 0001: Registrar as decisões de arquitetura

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

O projeto foi montado em etapas, com várias decisões tomadas em conversa (onde ficam as páginas, como o estado reage a eventos repetidos, quem decide o que cada perfil vê). Sem registro, o motivo some e as regras se desfazem aos poucos: alguém importa uma página dentro de outra, coloca uma regra de negócio num componente, escreve uma string solta no lugar de um enum.

## Decisão

Cada decisão que afeta vários lugares do código vira um arquivo curto em `docs/adr/`, no formato do [modelo](0000-modelo.md): contexto, decisão, consequências, regras e como é verificado. Os arquivos são numerados e nunca reescritos depois de aceitos. Uma mudança de rumo vira uma nova ADR que substitui a anterior.

As regras que podem ser conferidas por máquina ficam em `src/architecture.test.ts`. As demais dependem de revisão e estão marcadas como tal em cada ADR.

## Consequências

- Quem chega ao projeto lê o índice e entende a forma do código em poucos minutos.
- Mudar uma regra exige escrever o porquê, o que dá um momento para perguntar se a mudança vale a pena.
- Há um custo de manutenção: uma decisão tomada e não registrada continua valendo só por memória.

## Regras

- Toda mudança que contradiz uma ADR aceita traz uma ADR nova no mesmo pull request.
- Ao aceitar uma ADR nova, acrescente a linha na tabela de `docs/adr/README.md`.
- ADRs são escritas em português, como o restante da documentação.

## Como é verificado

Por revisão. O índice e o teste de arquitetura reduzem o risco, mas não substituem a leitura.
