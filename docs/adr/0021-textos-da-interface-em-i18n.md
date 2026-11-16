# ADR 0021: Textos da interface em i18n, ao lado de quem os usa

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

O sistema atende pessoas em lugares diferentes, e a interface estava escrita em português dentro dos componentes. Trocar o idioma exigiria caçar frases pelo código, e nada impedia um texto novo de nascer solto em um componente. As frases também eram montadas em pedaços ("Marina Almeida" + " está cuidando do seu chamado"), o que não funciona quando a ordem das palavras muda de um idioma para outro.

## Decisão

A interface fala **português do Brasil (`pt-BR`)** e **inglês dos Estados Unidos (`en-US`)**, e o usuário escolhe por um botão com bandeira no cabeçalho, ao lado do tema. O padrão é `pt-BR`. A escolha fica no `localStorage` (com `try/catch`) e o `lang` do `<html>` acompanha.

**Nenhum texto da interface é escrito direto no código.** Texto de tela, `placeholder`, `label`, `title`, `aria-label`, mensagens de notificação e de erro vêm sempre da tradução.

**Os textos ficam ao lado de quem os usa.** Cada pasta de componente ou de página que mostra texto tem um `locales.ts` com os dois idiomas lado a lado:

```ts
export const locales = {
  "pt-BR": { takingCare: "{{name}} está cuidando do seu chamado" },
  "en-US": { takingCare: "{{name}} is taking care of your ticket" },
} as const;
```

- O `en-US` é conferido contra o `pt-BR` pelo compilador, então um idioma sem chave ou com chave a mais não compila.
- O componente lê com `useTranslate(locales)`, que devolve a função `translate`. A chave de `translate` é tipada com as chaves daquele `locales.ts`.
- `i18next` cuida da interpolação, do plural e do idioma ativo. O resto do código só conhece `useTranslate`.
- Frases são sempre inteiras, com interpolação (`{{name}}`). Nunca se monta uma frase juntando pedaços.

**Textos de mais de um componente** ficam em `src/i18n/common/locales.ts` ("Salvar", "Cancelar", "Voltar"). Os textos dos enums de domínio (status, prioridade, perfil, etapa do cliente) ficam em `src/i18n/enums/locales.ts`, e o domínio guarda só a chave de cada valor. Assim o domínio continua sem depender de React nem de i18n ([ADR 0002](0002-camadas-e-dependencias.md)).

**O servidor simulado devolve códigos, não frases.** Um `ApiError` leva um código (`ticket.alreadyTaken`), e a tela que mostra o erro o traduz. Isso também aproxima o servidor simulado de um backend real.

**Datas e números** usam o `Intl` com o idioma escolhido, com uma exceção: as datas da cliente seguem o fuso e o `locale` do cadastro dela ([ADR 0018](0018-visao-do-cliente-sem-termos-internos.md)). O idioma da interface é escolha dela, mas o formato da data não muda.

**Conteúdo não é interface.** Títulos de chamado, mensagens, nomes de categoria e de pessoas vêm do `dados.json` em português e não são traduzidos. Uma tela em inglês pode mostrar um chamado em português, e isso é esperado.

## Consequências

- Trocar ou acrescentar um idioma é editar `locales.ts`, sem tocar na lógica.
- Quem altera um componente vê os textos dele na mesma pasta.
- Toda tela tem uma camada a mais para ler (`translate("chave")` no lugar da frase), e escrever um texto novo custa um passo.
- Os testes que procuram texto rodam em `pt-BR`, o idioma padrão. Os testes de troca de idioma são separados.
- Acrescentar um terceiro idioma pede uma chave nova em cada `locales.ts`, e o compilador aponta o que falta.

## Regras

- Texto de interface nunca em literal no JSX, em atributos de texto nem em notificações.
- Todo componente ou página com texto tem `locales.ts` na própria pasta, com `pt-BR` e `en-US`.
- Texto usado por mais de um componente vai para `src/i18n/common`. Texto de enum vai para `src/i18n/enums`.
- Frases inteiras com interpolação, nunca concatenadas.
- O domínio e o servidor não importam i18n nem escrevem frases para a tela: usam enums, chaves e códigos.
- Dados do `dados.json` não são traduzidos.

## Como é verificado

Pelo compilador (paridade e chaves tipadas) e por `src/architecture.test.ts`, que falha se encontrar texto literal em JSX, em atributos de texto e em notificações, ou uma pasta com texto sem `locales.ts`. Um teste confere a troca de idioma na tela.
