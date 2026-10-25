# backend e arquitetura

Quando peguei o escopo do projeto de inicio pensei em usar um arquitetura de microsservico mas consideranto a curva de complexidade que o teste iria tomar, seguir pela a arquietura monolitica modular. Onde explico melhor no .md Trocadearquitetura

diante a arquitetura monolitica modular, para facilitar a migração e até mesmo pensando em escalabilidade, separei por respectivas responsabilidade cada pasta. 

de inicio com o versionamento do banco de dados, por outro momento com a construção de arquitetura de pasta, dividio por implementações como autenticação, costcenter, orcamento e pedido de aprovação, dentro de cada pasta presevei as suas respectivas regras de negocio, seguindo a risca o que estava sendo passado no teste e no README. 

Com as regra usei uma abordagem DDD mas também a metodologia TDD para garantir que estivessemos indo para a cereja do bolo que a conclusão do desafio sem regressão, usei essa abordagem até mesmo pensando em futuro proximo de uso de agentes ou o uso da inteligencia artificial dividos em spec como foi hoje

visando ali resolver um dos principais gargalos da ia que é a perca de contexto e também a garantia que ela não iria regredir o aplicando as tarefas.

creio que é bacana destacar alguns trade-ofs gerados, mas que em qualquer outra decisão também teria, Edsger Dijkstra  cita " Se depurar é o processo de remover bugs, então programar deve ser o processo de colocá-los."

então é com essa mentalidade que trabalhamos que refatora é o processo mais precioso da programação, pois ele faz você enxergar e enxergar e entender coisas novas, arquiteutura nova, bugs escondigos, depurar coisas novas, assim por diante.

quero destacar também em pilares cada decisão tomada. 

Primeiro de tudo usei o metódo dividir e conquista. Então com pequenos passo a passo a gente vai construido, assim como um engenheiro em tijolo e tijolo...

E os meus tijolo foi justamente quebrar problemas em pequenos problemas e pequenas soluções algoritmicas. Então como eu já tinha em mente o que eu queria, após afiar bastante o machado, tava na hora de começar a marretar, de inicio crie um erd, a cardialidade dele e dividi no principais blocos: usuarios, centros da empresa e jwt, essa foi a minha primeira missão garantir o funcionamento correto das role, da emissão do token jwt usando a versão mais recente do spring security .

Então, como eu sabia que iria dividir em entidades, repositry, dtos, controllers e serivce e cobrindo a identidade de cada um ficou facil de começar  a implatação.

Então nos primeiro commit foi a construção da autenticação, do jwt, dos roles e os seus testes e também o orçamento, apos ligar os service d eautenticação , register, login , parti para o roles e nos role tomei a decisão pelo o tempo e pelo o escopo incial de RBAC que Controla o acesso a APIs, páginas web e recursos de aplicação. Suporta autorização baseada em unções e em permissões.Fornece segurança em nível de método e URL.
 um modelo de autorização onde permissões de acesso são atribuídas a papéis, e os usuários são designados a esses papéis. Os usuários herdam permissões com base no papel atribuído.

 eu poderia ter usado uma abordagem mais complexa porém de inicio o PBAC não serviria tão bem por causa da sua intergração , apesar de pensando em escabilidade, precisão seria um dos melhores. 

 usando o rbac eu escrevi teste mais especifico para cada papel cobrindo regras e controle.


 creio que de autenticação um pouco da solução foi essa.
hmm, bom é o usuário é criado como SOLICITANTE em PENDING_APPROVAL. Sua ativação ou promoção é uma operação administrativa. 

O ADMIN inicial é criado pelo mecanismo de bootstrap, evitando depender de cadastro público para obter privilégio administrativo.

Depois de concluir a base de autenticação, usuários e centros de custo, comecei a trabalhar no coração do desafio, né que é  o fluxo de solicitações de compra.

Essa foi uma das partes mais importantes do projeto, porque envolve toda uma regra 

Seguindo a mesma estratégia de dividir e conquistar, separei o módulo purchaserequest em responsabilidades menores.

responsável por coordenar a criação e a edição das solicitaçõ então seguindo ali conforme descrito toa solicitação nasce em forma draft , isso permite que o solicitante informe os itens, edite, preco etc. Então nessa parte foquei em policy e domino para evitar que o service ficasse gigante com if e else então separei a responsabilidade em   calcular valores, decidir permissões e executar todas as regras diretamente.

um dos pontos e cenarios que o desafio mais tocou foi idempotência  que são os pesadelos em producação quis ir maias afundo pensando na questão do  race conditional  considerei um problema bastante comum em aplicações reai  o usuário cria uma solicitação, o servidor processa normalmente, mas a conexão cai antes de o frontend receber a resposta.

plementei o controle de idempotência utilizando a Idempotency-Key.

A implementação considera o usuário, a chave da operação e um hash do payload.O registro da idempotência possui um prazo de validade de 24 horas e participa da operação transacional.rincipal decisão foi não permitir que qualquer endpoint alterasse livremente o status.

Cada transição precisa respeitar o estado atual, o papel do usuário, a propriedade da solicitação e as regras de aprovação.

isso impede situações como editar uma solicitação já aprovada, aprovar uma solicitação cancelada ou enviar novamente um pedido rejeitado.

então o maximo que pude para utlizar uma máquina de estados, definindo quais transições são válidas e quem pode executá-las.

no ciclo de vida da solicitação

dividido em aprovação do servico assim que um usuário clicasse em aprovar  garantir que a aprovação respeitasse a sequência definida pelo negócio.

então para isso usei uma cadeia especifica que uma aprova e outra executa 

para isso já comecei a considerar o uso agentico, e dividir o seu uso em spec micro passos e testes justamente para a cadeia especifica de regras determinada por valor e categoria, etnão essa segregação de funçoes em que um suario nao aprova a própria  slicitação, nem aprovar duas etapas de uma mesma versão.

sistema também precisa verificar o centro de custo, o nível de aprovação, a etapa atual, quem criou a solicitação e quem já participou das decisões anteriores.

essa abordagem complementa o RBAC com regras contextuais de domínio.

cenário importante que toquei  quando uma solicitação é devolvida para ajustes.

nesse caso, a solicitação passa para CHANGES_REQUESTED, permitindo que o responsável faça as correções.

Depois das aprovações, cheguei a uma parte em que a consistência transacional seguindo para a parte indispensável que é o orçamento mensal 

O orçamento está vinculado a um centro de custo e a uma competência.

onde sua regra principal é que o valor de uma solicitação somente é consumido quando a última etapa da cadeia de aprovação é concluída.

portanto, aprovar uma etapa intermediária não deve reduzir o orçamento.

Para organizar essa responsabilidade, utilizei o módulo budget, com suas entidades, repositórios e o Service.

O saldo disponível é determinado pela diferença entre o valor alocado e o consumido.

nisso já percebi em um cenario problematico duas solicitações de R$ 8.000 tentando consumir um orçamento com apenas R$ 10.000 disponíveis. ambas consultarem o saldo antes de qualquer atualização e forem aprovadas sem controle de concorrência, o sistema poderá comprometer R$ 16.000.

então isso é um problema classico de concorrencia que acontece  muito para tratá-lo, trabalhei com transações de banco de dados e o controle de concorrência sobre a solicitação e proteção da operação de consumo do orçamento.

no fluxo de aprovação, utilizei o lockVersion para identificar operações baseadas em uma versão desatualizada do registro.

dessa forma duas decisões simultâneas sobre a mesma etapa não podem ser aceitas como se ambas fossem a primeira.

quando exite conflito a api devolve 409

ja quando o saldo disponível não é suficiente, a operação retorna 422, com o código BUDGET_EXCEEDED.

A preocupação central foi manter a aprovação final e o consumo financeiro dentro de uma operação consistente.

se não for possível consumir o orçamento, a solicitação não deve ser marcada como aprovada.PRONTO!

esse cenário foi importante testar, escrevi test para isso executei testes HTTP com PostgreSQL real, incluindo condições de corrida.

seguindo a lógica:

1.Duas aprovações simultâneas na mesma etapa uma operação concluída e outra recusada com 409.

2.Duas solicitações disputando o mesmo orçamento uma aprovação concluída e outra recusada com 422.

3.Aprovação sequencial NÍVEL 1  NÍVEL 2  ADMIN.
4.
Orçamento consumido somente na decisão final.

5.Autoaprovação e aprovador repetido recusados.

6.Solicitação devolvida, editada e reenviada como nova versão.

7.rejeição e cancelamento respeitando os estados permitidos.

# Frontend 

Para o frontend, utilizei Next.js, React, TypeScript e Redux para o gerenciamento do estado de autenticação.

Minha intenção foi manter a mesma separação de responsabilidades utilizada no backend.

O frontend deve ser responsável por apresentar as informações, coletar os dados do usuário e executar as ações disponibilizadas pela API. com isso uma consitencia legal visal (já tinha algo semi pronto) fui remodelando em cia disso com base na nossa solução 


dividi em pastas o front também , escrevi seus teste também . com isso temos os 

# Trade-offs 

nenhuma arquitetura elimina todos os problemas né, então cada decisão transfere complexidade para alguma parte do sistema.

de começo , considerei microsserviços, mas optei pelo monólito modular porque precisava preservar a consistência transacional, evitar uma comunicação distribuída desnecessária  para o momento e manter o  executável dentro do prazo.

essa escolha simplificou as operações envolvendo aprovação e orçamento, embora mantenha os módulos dentro de uma mesma aplicação e de um mesmo ambiente de implantação.

outro trade-off foi utilizar JWT stateless com validade curta, sem implementar inicialmente uma infraestrutura completa de refresh token e revogação.

também optei por políticas de domínio explícitas em vez de introduzir um mecanismo mais complexo de autorização baseada em políticas.

essas escolhas não impedem uma evolução futura, mas reconhecem que complexidade também possui custo de desenvolvimento e operação

com mais tempo, eu priorizaria a ampliação dos testes end-to-end, E2E, observabilidade, revisão da estratégia de revogação de tokens, mecanismos de notificação e evolução das ferramentas administrativas.

# Considerações finais

até o momento as 2:40 da madrugada de sabado, estou feliz em ter participado, em está concorrendo a vaga, creio que o sacrificio o esforço e dedicação ela sobressai a qualquer outro fator para um gerente, agradeço pela a comunicação paciencia e a flexibilidade no tempo ai, ganhei umas 3 horinhas para ajustar o restante. 

então foi um desafio que me fez pensar, arquitetar, discutir comigo kk, e estudar, fazia um tempinho que não mechia no spring security mas logo, fui autodidata ali, já buscando referencia, documetação, implemtação e adaptando para a realidade. 

isso mexe comigo que é a chama que todo programador tem que ter, ser apaixonado por desafio, compelixidade, mas principalmetne ufa, resolvi. 

é gostaria de ter caprichado mais no front, claro que melhoria ali components, designer ystem, responsividae.

referente ao full stack testes e2e seria muito bom de ser aplicado.

no backend teria feito algumas complexidades e incrementação a mais como o uso de mensageria, disparos de notiificação um rag para ser treiando o setores e suas necessidades para que isso pudesse gera insights de compras dentro da empresa , materias etc, para o admin.

todavia,é compreender quais invariantes do negócio precisam ser preservadas, quais falhas são possíveis e como demonstrar que o sistema continua consistente diante delas.

Minha estratégia foi dividir problemas maiores em partes menores, estabelecer responsabilidades e validar cada entrega antes de avançar.

O resultado foi uma solução construída em torno das regras de negócio, com decisões arquiteturais que posso explicar, testar e evoluir sem depender de abstrações desnecessárias.