# ADR 0013: Semana de trabalho e tempo sem chamado

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

O gestor "no fim da semana olha quanto tempo cada consultor ficou sem chamado atribuído". O enunciado não define o que é "sem chamado" nem o que é uma semana. Os horários do `dados.json` se espalham pelas 24 horas, então contar horas corridas faria noites e fins de semana contarem como ociosidade, o que não diz nada sobre a equipe.

## Decisão

- **Semana:** começa na segunda-feira à meia-noite no horário de Brasília (UTC−3, sem horário de verão). A semana atual conta só até agora. A página oferece as 8 últimas semanas.
- **Expediente:** segunda a sexta, das 8h às 18h, horário de Brasília. Só esse tempo entra na conta.
- **Tempo sem chamado:** o expediente em que o consultor não tem **nenhum chamado ativo** atribuído. Um chamado é ativo enquanto não está resolvido nem fechado, e "aguardando cliente" conta como ativo, porque o consultor continua sendo o dono dele.
- **Período de posse:** o consultor tem o chamado desde a atribuição até ele ser resolvido ou fechado, volta a ter se ele for reaberto, e o perde no instante de uma redistribuição. Vários chamados ao mesmo tempo não contam em dobro, e trabalho fora do expediente não reduz o tempo ocioso.
- **Origem dos dados:** o histórico de atribuições e de status de cada chamado.

As constantes (`WORKDAY_START_HOUR`, `WORKDAY_END_HOUR`, `UTC_OFFSET_HOURS`) ficam em `src/domain/week.ts`, e a conta em `src/domain/activity.ts`.

## Consequências

- O número significa algo para a gestão: horas úteis sem trabalho.
- O `dados.json` concentra a atividade nos últimos dias, então semanas antigas aparecem muito ociosas porque quase nenhum chamado tinha sido atribuído ainda. É o que o histórico diz.
- Se o horário de verão voltar ou houver consultores em outros fusos, `week.ts` precisa mudar (hoje o fuso é uma constante).

## Regras

- A definição de "ocioso" mora em `domain/activity.ts` e na página ela é explicada em texto, para ninguém ler um número sem saber o que ele mede.
- Mudar o expediente ou o fuso é mudar `week.ts` e atualizar esta ADR.

## Como é verificado

Por `src/domain/week.test.ts` e `src/domain/activity.test.ts` (posse, reabertura, redistribuição, sobreposição, fora do expediente) e pelos testes da página e de integração do painel semanal.
