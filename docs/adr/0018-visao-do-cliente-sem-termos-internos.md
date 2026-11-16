# ADR 0018: A visão do cliente não mostra termos internos

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

O enunciado descreve a cliente (Helena, em Lisboa) assim: abre três ou quatro chamados por ano, quer saber se alguém pegou o chamado e quando terá resposta, volta quando recebe um aviso de novidade e quer entender o que aconteceu sem ler tudo de novo. E diz que ela "não sabe o que é categoria, grupo de atendimento ou prioridade interna, e não deveria precisar saber".

A tela da consultora, reaproveitada, mostraria exatamente isso: prioridade, grupo, categoria, selos de SLA e os motivos que a equipe escreve ao mudar um status.

## Decisão

A página do cliente (`src/pages/customer/tickets`) é própria e fala a língua dela:

- **Estado em palavras comuns.** O status interno vira uma etapa (`CustomerStage`, em `domain/customer.ts`): Recebido, Atribuído, Em atendimento, Aguardando você, Resolvido e Encerrado. Só "Aguardando você" usa a cor de aviso.
- **Um resumo antes da conversa.** Uma frase diz o que está acontecendo ("Marina Almeida está cuidando do seu chamado"), quem cuida, a previsão e a última atualização, e uma lista curta mostra o que já aconteceu (aberto, assumido, aguardando resposta, resolvido, reaberto).
- **Previsão em data, no fuso dela.** Enquanto ninguém respondeu, a primeira resposta prevista; depois, a solução prevista; nada enquanto a equipe espera por ela. Se a data já passou, a tela diz isso. As datas usam o `zoneinfo` e o `locale` do cadastro, inclusive o horário de verão de Lisboa.
- **Nunca aparecem** categoria, grupo, prioridade, SLA, o motivo que a equipe escreveu numa mudança de status nem notas internas. A lista de eventos usa frases fixas, sem o texto do motivo.
- **Abrir um chamado sem jargão.** Ela escolhe o assunto (o nome da categoria, que já é comum: "Rede e VPN", "E-mail") e responde "Quanto isso atrapalha o seu trabalho?" em quatro opções. A resposta vira a prioridade internamente (toda a empresa parada, crítica; não consigo trabalhar, alta; atrapalha, média; pode esperar, baixa).
- **Chamado encerrado não recebe mensagem.** O servidor recusa mensagem de cliente em chamado resolvido ou fechado, e a tela troca a caixa de resposta por "Reabrir chamado" (ver [ADR 0019](0019-chamados-parecidos-e-reabertura.md)).
- **O que é novo se vê.** Chamado com mensagem nova aparece com "N novas" e sobe na lista, e dentro dele as mensagens da equipe ainda não vistas levam "Novo" (ver [ADR 0020](0020-marcas-de-leitura.md)).

Os componentes compartilhados entram por propriedades ([ADR 0006](0006-componentes-compartilhados.md)): a caixa de resposta esconde a nota interna (`allowNotes`) e a mensagem aceita o destaque "Novo" (`highlight`).

## Consequências

- A cliente vê um produto pensado para ela, e a equipe continua com a visão completa.
- Há duas telas de conversa (a da equipe e a do cliente), que repetem um pouco de estrutura e compartilham a bolha de mensagem e a caixa de resposta.
- Mapear impacto em prioridade esconde uma decisão de negócio na tela. A tabela está em um lugar só (`new-ticket-modal/constants.ts`) e é fácil de ajustar.
- A previsão é o prazo interno de SLA mostrado como data. Se ele passar a ser um compromisso que a empresa não quer divulgar, muda-se só o resumo.

## Regras

- Nada de categoria, grupo, prioridade, SLA, motivo de status ou nota interna na página do cliente, nem em texto, nem em tooltip.
- O estado do chamado para o cliente sai de `stageOf` e `nextExpectation`, nunca de `STATUS_LABEL`.
- Um texto novo na página do cliente é escrito para quem não conhece o sistema.
- Tudo o que o cliente pode fazer num chamado passa pelas regras do servidor (só o dele, só enquanto está em andamento, ou reabrir).

## Como é verificado

Pelos testes dos componentes do cliente, que conferem a ausência dos termos internos (`Prioridade`, nomes de grupo, nomes de categoria, motivos), pelos testes de `domain/customer.ts` e pelos testes de integração do cliente. A visibilidade das notas internas é garantida pela [ADR 0010](0010-visibilidade-no-servidor.md).
