# ADR 0020: Marcas de leitura guardadas por pessoa

- **Status:** Aceita
- **Registrada em:** 2026-11-16

## Contexto

A cliente "volta ao sistema quando recebe aviso de que há novidade". O contador de mensagens não lidas só contava o que chegava com a tela aberta, porque o ponto de partida era o instante em que o store foi carregado. Quem saía e voltava no dia seguinte não via nada de novo, mesmo com respostas da equipe esperando.

## Decisão

Cada pessoa guarda, no navegador, a última vez que abriu cada chamado (`greenmanagement.read.<id da pessoa>` no `localStorage`, um mapa de chamado para data):

- `store/readMarks.ts` lê, grava e observa as marcas. Leitura e escrita são protegidas por `try/catch`, e um texto que não seja um mapa de datas é ignorado.
- Ao carregar o retrato, `ticketsStore.load` recebe as marcas e as restaura depois do retrato (`restoreRead`), só para chamados que a pessoa ainda vê. Uma marca feita nesta sessão vale mais que uma restaurada. Se o store foi reiniciado enquanto carregava, as marcas não são aplicadas.
- A ligação em tempo real grava as marcas sempre que elas mudam (e só quando elas mudam, não a cada evento) e **para de gravar antes de limpar o store**, para que a limpeza do fim da sessão não apague o que foi guardado.
- Um chamado sem marca conta como lido até o carregamento. Só mensagens de outras pessoas contam como não lidas.

Abrir um chamado marca como lido (`markRead`, por `store/actions`, [ADR 0009](0009-estado-dirigido-por-eventos.md)). Para a conversa mostrar "Novo" nas mensagens que a pessoa ainda não viu, o ponto de corte é guardado **quando a conversa abre**, antes de a marca ser atualizada, e não muda enquanto ela está aberta.

## Consequências

- A cliente (e a consultora, que usa o mesmo contador) vê o que chegou enquanto estava fora.
- As marcas ficam no navegador, não na conta. Em outro navegador ou aparelho a pessoa começa sem marcas. Com um backend real, elas iriam para o servidor.
- Várias abas gravam no mesmo lugar, e a última a gravar vence. É aceitável para o que isso mede.

## Regras

- Nada fora de `src/store` lê ou grava as marcas diretamente.
- Quem para de gravar as marcas o faz antes de reiniciar o store.
- Marcas de chamados que a pessoa não vê mais não são guardadas.

## Como é verificado

Por `src/store/readMarks.test.ts` (leitura, gravação, observação, armazenamento recusado), pelos testes de `restoreRead` e de `load` em `ticketsStore.test.ts` e pelos testes de integração do cliente (sair, receber uma mensagem, voltar, ver "1 nova" e "Novo", e deixar de ver depois de ler).
