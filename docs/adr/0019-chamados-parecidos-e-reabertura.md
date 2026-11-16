# ADR 0019: Chamados parecidos e reabertura em vez de duplicata

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

O enunciado diz que a cliente "às vezes abre um chamado novo que é o mesmo problema de um que já está fechado", e o requisito 5 diz que um chamado fechado pode ser reaberto. No `dados.json` isso aparece nos chamados da Helena: o #10612 ("VPN não liga a partir de casa", fechado) e o #10614 ("VPN não liga a partir de casa (outra vez)", aberto, sem responsável). A duplicata faz a equipe perder o histórico do primeiro e conta um prazo novo para um problema antigo.

## Decisão

**Avisar antes de duplicar.** Enquanto ela escreve o resumo e a descrição de um chamado novo, a tela mostra os chamados dela que se parecem (`similarTickets`, em `domain/similarity.ts`):

- compara palavras, sem acento e sem maiúsculas, ignorando palavras comuns e as de menos de três letras;
- usa só o título dos chamados antigos e o resumo mais a descrição do texto novo, porque as descrições antigas do `dados.json` são genéricas;
- exige pelo menos duas palavras em comum e que o texto novo cubra 60% das palavras do título antigo;
- mostra no máximo três, do mais parecido para o menos, e desempata pelo mais recente.

O aviso não impede nada: ela pode abrir o chamado novo mesmo assim. Cada sugestão leva ao chamado antigo ("Abrir esse chamado"), onde ela vê o andamento ou reabre.

**Reabrir é uma operação do cliente.** `reopenTicket` (servidor) aceita só o dono de um chamado resolvido ou fechado, exige o motivo ("Conte o que continua errado.") e faz duas coisas: muda o status para "em atendimento" com o motivo `Reaberto: ...` no histórico, e registra o texto dela como mensagem na conversa. O chamado fica com o mesmo consultor. As regras de SLA já existentes valem: reabrir um chamado fechado renova os prazos, e reabrir um resolvido não.

## Consequências

- A equipe recebe a história inteira no mesmo chamado em vez de dois soltos.
- A semelhança por palavras é simples e falha em sinônimos ("não conecta" não encontra "não liga"). O custo de errar é baixo, porque o aviso não bloqueia.
- O aviso só enxerga os chamados que ela vê. Isso é o certo, e vem da visibilidade ([ADR 0010](0010-visibilidade-no-servidor.md)).

## Regras

- A decisão de "parecido" fica em `domain/similarity.ts`, com testes sobre os chamados reais, e não em um componente.
- O aviso sugere, nunca bloqueia.
- Só o dono reabre, só chamado resolvido ou fechado, sempre com motivo, e o motivo vira mensagem.
- Cliente não escreve em chamado encerrado: para voltar a escrever, reabre.

## Como é verificado

Por `src/domain/similarity.test.ts`, `src/server/ops.reopen.test.ts` e pelos testes do formulário de novo chamado e do teste de integração do cliente (aviso de problema repetido, que não cria duplicata, e reabertura com a mensagem aparecendo uma vez).
