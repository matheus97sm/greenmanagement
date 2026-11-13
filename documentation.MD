Material disponível em: https://we.tl/t-U60rZz5bQaTjUbAr

Estamos reescrevendo do zero o nosso sistema de gestão de serviços de TI (ITSM). O sistema atual tem muitos anos; o novo é um projeto greenfield, com melhorias de produto e de arquitetura, e está em fase de homologação.
O novo sistema vai para produção no começo do ano que vem e será mantido e evoluído por este time ao longo dos próximos anos. Leve isso em conta ao escolher versões de frameworks e bibliotecas: preferimos o que terá suporte durante esse período ao que acabou de ser lançado.
Este teste pede uma fatia pequena desse sistema: a área de chamados, vista por quem a usa. O objetivo não é cobrir funcionalidade nem produzir identidade visual; é ver como você decide o que aparece na tela, quando, e para quem.

Quem usa o sistema
O sistema é um só. Três perfis o usam, com rotinas bem diferentes. O que segue é como o dia deles acontece hoje, no sistema antigo:

- Marina, consultora. Chega às 8h30 com uns 40 chamados atribuídos a ela e mais a fila do grupo dela, que ninguém pegou ainda. A primeira coisa que ela faz é decidir qual atender. Ela fica na tela o dia inteiro, alternando entre chamados: responde ao cliente, registra o que fez, muda o status, pega o próximo. Enquanto ela escreve uma resposta, chegam mensagens em outros chamados dela, e às vezes no mesmo. Ela deixa anotações internas para colegas que o cliente não deve ver. Reclama que no sistema antigo perde tempo procurando o chamado que está prestes a estourar o prazo.

- Ricardo, gestor. Tem 12 consultores na equipe. Começa o dia olhando a fila de todos: quem está sobrecarregado, quem está sem nada, quais chamados vão estourar o SLA nas próximas horas. Redistribui chamados quando alguém falta. Raramente abre a conversa de um chamado; quando abre, é porque o cliente escalou. No fim da semana olha quanto tempo cada consultor ficou sem chamado atribuído. Diz que o sistema antigo mostra tudo e por isso não mostra nada.

- Helena, cliente. Trabalha em Lisboa, numa empresa que contrata o suporte. Abre um chamado quando algo quebra; três ou quatro por ano. Quer saber se alguém pegou o chamado dela e quando terá uma resposta. Volta ao sistema quando recebe aviso de que há novidade, e quer entender o que aconteceu sem ter que ler tudo de novo. Não sabe o que é categoria, grupo de atendimento ou prioridade interna, e não deveria precisar saber. Às vezes abre um chamado novo que é o mesmo problema de um que já está fechado.

O que você vai construir
A área de chamados do sistema, em React. O que ela precisa permitir:

1. Abrir um chamado.
2. Encontrar um chamado e ver o que está acontecendo com ele: a conversa, o status, quem está atendendo, o prazo.
3. Pegar um chamado para atender.
4. Trocar mensagens no chamado.
5. Mudar o status de um chamado, registrando o motivo. Um chamado fechado pode ser reaberto.
6. Acompanhar a situação de um grupo de consultores.
   Tudo isso acontece em tempo real: enquanto alguém usa a tela, outras pessoas abrem chamados, respondem e mudam status, e a tela precisa refletir isso.
   Não há design, protótipo ou guia visual. Use a biblioteca de componentes que quiser, ou nenhuma. Não estamos avaliando identidade visual.
   O que não estiver especificado aqui fica a seu critério.

Dados e eventos
No link do material você recebe o arquivo dados.json, com chamados, mensagens, histórico de status, usuários, grupos de atendimento e prazos de SLA. São dados realistas de um tenant: volume, tamanhos e situações como se encontram em produção.
Assuma que, no sistema real, esses dados vêm de uma API e as mudanças chegam por WebSocket, no formato abaixo. Não existe backend neste teste; como você simula a API e a chegada de eventos é decisão sua.

Eventos
• Tipo: chamado.aberto | Quando: Um chamado foi criado | Payload: O chamado completo
• Tipo: chamado.atribuido | Quando: Um chamado ganhou ou trocou de responsável | Payload: chamado_id, consultor_id
• Tipo: mensagem.adicionada | Quando: Uma mensagem foi adicionada a um chamado | Payload: A mensagem completa, com chamado_id
• Tipo: status.alterado | Quando: O status de um chamado mudou | Payload: chamado_id, de, para, motivo, usuario_id
Todo evento tem id (UUID), tipo, ocorrido_em (UTC) e payload. Um mesmo evento pode ser entregue mais de uma vez.

Entrega
• Um repositório git privado (GitHub ou similar), com o histórico de commits preservado. Adicione o usuário "brunopujoniseidor" como colaborador com acesso de leitura e nos avise. Se preferir não usar um serviço, envie um git bundle do repositório.
• Um README dizendo como rodar e como ver a tela como cada um dos perfis.
• O que mais você achar que vale a pena deixar escrito.
