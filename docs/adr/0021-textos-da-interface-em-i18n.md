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
import { Language } from "@/i18n";

export const locales = {
  [Language.PtBr]: { takingCare: "{{name}} está cuidando do seu chamado" },
  [Language.EnUs]: { takingCare: "{{name}} is taking care of your ticket" },
};
```

O componente usa assim:

```tsx
const translate = useTranslate(locales);
translate("takingCare", { name });
```

- As chaves de idioma são os membros do enum `Language`, nunca textos soltos ([ADR 0008](0008-enums.md)). O `en-US` é conferido contra o `pt-BR` pelo compilador, então um idioma sem chave ou com chave a mais não compila.
- Plural usa as chaves `_one` e `_other` (`tickets_one`, `tickets_other`) e o parâmetro `count`; a chave passada a `translate` é `tickets`.
- O componente lê com `useTranslate(locales)`, que devolve a função `translate`. A chave de `translate` é tipada com as chaves daquele `locales.ts`.
- `i18next` cuida da interpolação, do plural e do idioma ativo. O resto do código só conhece `useTranslate` e `useLanguage`, de `src/i18n`, que não importa a tela, o store nem o servidor.
- Frases são sempre inteiras, com interpolação (`{{name}}`). Nunca se monta uma frase juntando pedaços.

**Textos de mais de um componente** sobem para `src/i18n`. Os nomes dos enums de domínio (status, prioridade, perfil e papel) ficam em `src/i18n/labels` e saem de `useLabels()`; o domínio guarda só as cores e as regras. Assim o domínio continua sem depender de React nem de i18n ([ADR 0002](0002-camadas-e-dependencias.md)). Um enum que pertence a um só componente (a etapa do cliente, o impacto) guarda um `Record<Enum, chave>` no `constants.ts` dele, e o componente traduz.

**Funções puras não escrevem frases.** Uma função de `utils.ts` devolve enums, chaves ou números, ou recebe a função `translate` por parâmetro. O tipo dela é `Translate<(typeof locales)[Language.PtBr]>`. Fora do React (o store), `translatorFor(locales)` faz o papel de `useTranslate`.

**O servidor simulado devolve códigos, não frases.** Um `ApiError` leva um `ApiErrorCode` (`TicketTakenByPerson`) e os valores que a frase precisa (`name`), e `translateError` (`src/i18n/errors`) o traduz quando o store mostra a notificação. Isso também aproxima o servidor simulado de um backend real. Um erro de programador (`throw new Error(...)`) não é texto de interface, fica em inglês e não é traduzido.

**Datas e números** usam o `Intl` com o idioma escolhido, com uma exceção: as datas da cliente seguem o fuso e o `locale` do cadastro dela ([ADR 0018](0018-visao-do-cliente-sem-termos-internos.md)). O idioma da interface é escolha dela, mas o formato da data não muda.

**Conteúdo não é interface.** Títulos de chamado, mensagens, nomes de categoria e de pessoas vêm do `dados.json` em português e não são traduzidos. Uma tela em inglês pode mostrar um chamado em português, e isso é esperado. O mesmo vale para o motivo que o servidor simulado grava sozinho no histórico ("Assumido para atendimento", "Cliente respondeu"): é dado gravado, como os motivos do `dados.json`. O nome do produto e os nomes das três pessoas de demonstração também não são traduzidos.

**Plural em português.** A regra de plural do `pt-BR` trata zero como singular ("0 chamado"). Onde o texto original diz "0 chamados", a tradução tem a chave `_zero`.

## Consequências

- Trocar ou acrescentar um idioma é editar `locales.ts`, sem tocar na lógica.
- Quem altera um componente vê os textos dele na mesma pasta.
- Toda tela tem uma camada a mais para ler (`translate("chave")` no lugar da frase), e escrever um texto novo custa um passo.
- Os testes que procuram texto rodam em `pt-BR`, o idioma padrão. Os testes de troca de idioma são separados.
- Acrescentar um terceiro idioma pede uma chave nova em cada `locales.ts`, e o compilador aponta o que falta.

## Regras

- Texto de interface nunca em literal no JSX, em atributos de texto nem em notificações.
- Todo componente ou página com texto tem `locales.ts` na própria pasta, com `pt-BR` e `en-US`.
- Nome de enum de domínio vem de `useLabels()`; texto usado por mais de um componente vai para `src/i18n`.
- Função pura não escreve frase: devolve chave, enum ou número, ou recebe `translate`.
- Frases inteiras com interpolação, nunca concatenadas.
- O domínio e o servidor não importam i18n nem escrevem frases para a tela: usam enums, chaves e códigos.
- Dados do `dados.json` não são traduzidos.

## Como é verificado

Pelo compilador (paridade e chaves tipadas) e por `src/architecture.test.ts` ("interface text"). Ele lê o código com um analisador (`src/test-literals.ts`) e falha, listando arquivo e linha, quando acha texto escrito em JSX, em atributos como `label` e `placeholder`, em propriedades como `title` e `message` ou em frases soltas, fora de um `locales.ts`. As exceções são os nomes do produto e das pessoas de demonstração e os motivos que o servidor grava. Cada pasta com `locales.ts` tem um teste que confere o texto em inglês, e `src/i18n` tem testes da troca de idioma, dos rótulos e dos erros.
