# contexto 
de inicio considerei uma arquitetura de microsserviços para separar autenticação, orçamento, solicitações e processamento de eventos em aplicações independentes.

Mas depois de colocar minha cabeça no travesseiro e refletir sobre o escopo

A abordagem ofereceria benefícios potenciais, como implantação independente, escalabilidade seletiva e isolamento operacional. Entretanto, também exigiria resolver problemas adicionais de comunicação distribuída, consistência entre bancos, falhas parciais, observabilidade e versionamento dos contratos de rede.

Diante do escopo e do prazo do desafio, decidi priorizar a implementação correta das regras de negócio antes de introduzir distribuição física.

Adotar um Monólito Modular, desenvolvido em Java 17 e Spring Boot, com PostgreSQL como banco de dados transacional e módulos organizados por responsabilidades de negócio.

auth

Identidade, registro, autenticação JWT, usuários e permissões

budget

Centros de custo, orçamentos mensais e operações financeiras

purchaserequest

Solicitações, itens, versões, estados e cadeia de aprovação

shared

Configurações e mecanismos técnicos compartilhados

Cada módulo será responsável por suas regras, modelos de domínio e persistência.

As interações entre módulos ocorrerão por interfaces públicas de aplicação e contratos explícitos, evitando o acesso direto às implementações internas de outros módulos.

O compartilhamento de um banco PostgreSQL não significa compartilhamento irrestrito de suas tabelas. A propriedade dos dados continuará definida pelos limites de cada módulo.

A aprovação final de uma solicitação envolve múltiplas alterações que precisam ser confirmadas ou revertidas conjuntamente:

Validar o aprovador, a etapa atual e a versão esperada da solicitação.

Registrar a decisão de aprovação.

Verificar e consumir o orçamento da competência correspondente.

Atualizar o estado da solicitação.

Persistir o histórico obrigatório da operação.

No monólito modular, essas alterações podem ser coordenadas por uma única transação ACID no PostgreSQL.

Em uma arquitetura de microsserviços com bancos independentes, o mesmo fluxo exigiria estratégias adicionais de coordenação distribuída, compensação ou consistência eventual, dependendo das garantias necessárias.

Essa complexidade não agrega valor proporcional ao escopo atual.

O sistema deverá permanecer consistente diante de operações simultâneas.

A implementação utilizará mecanismos como:

Controle de versão para detectar alterações concorrentes em solicitações.

Bloqueio transacional quando necessário para serializar operações sobre uma solicitação.

Atualizações condicionais e atômicas para consumo de orçamento.

Constraints e índices únicos no PostgreSQL para garantir integridade.

Testes de integração e concorrência com PostgreSQL real.

A escolha pelo monólito não é considerada, isoladamente, uma solução para race conditions. Ela simplifica a coordenação transacional, enquanto os mecanismos de persistência fornecem as garantias efetivas.

Uma única unidade implantável reduz os componentes operacionais necessários à primeira entrega.

O ambiente poderá ser reproduzido com Docker Compose, concentrando configuração, inicialização, logs, depuração e execução dos testes.

O projeto não precisará inicialmente de service discovery, API gateway interno, comunicação entre serviços ou infraestrutura obrigatória de mensageria.

Isso reduz pontos de falha e permite dedicar maior esforço à qualidade das regras de negócio, à segurança e à cobertura automatizada.
Os módulos terão contratos públicos, responsabilidades específicas e dependências controladas.

Essa organização cria condições melhores para extrair funcionalidades para serviços independentes no futuro, caso exista necessidade demonstrada.

Entretanto, essa extração não será considerada automática: exigirá definir novos limites transacionais, propriedade física dos dados, contratos de rede e estratégias de consistência.

Microsserviços

Benefícios: escalabilidade seletiva, implantação independente, isolamento de falhas entre processos e maior autonomia por serviço quando acompanhada de limites claros de domínio e equipes adequadas.

Custos: comunicação de rede, observabilidade distribuída, falhas parciais, coordenação de operações entre bancos, evolução de contratos e infraestrutura operacional adicional.

Decisão: não adotados neste estágio, pois os benefícios não justificam a complexidade adicional para o problema e o prazo atuais.

Monólito modular

Benefícios: consistência transacional local, implantação simplificada, chamadas internas eficientes, depuração centralizada e separação lógica de responsabilidades.

Custos: implantação conjunta dos módulos, escalabilidade predominantemente da aplicação como um todo e maior necessidade de disciplina para manter os limites internos.

Decisão: alternativa selecionada.

Consequências e trade-offs

A solução será entregue como uma aplicação única.

Isso implica que alterações em um módulo normalmente exigirão reconstrução e implantação da aplicação completa. A escalabilidade independente de módulos específicos não estará disponível inicialmente.

O banco compartilhado poderá representar um ponto de contenção conforme a carga aumentar. Por isso, o desenho das transações, dos índices, do pool de conexões e dos bloqueios precisará ser monitorado.

Em contrapartida, a aplicação poderá ser replicada horizontalmente, desde que suas instâncias permaneçam stateless e compartilhem mecanismos consistentes de persistência e autenticação.

Também será necessário evitar que a facilidade de chamadas internas evolua para acoplamento indevido entre módulos.

Uma migração parcial para microsserviços poderá ser considerada quando houver evidências concretas de:

Necessidade de escalar componentes de maneira significativamente diferente.

Frequências de implantação independentes que gerem gargalos operacionais.

Requisitos distintos de disponibilidade, isolamento ou desempenho.

Crescimento organizacional que justifique autonomia de equipes por domínio.

Integrações ou cargas assíncronas que se beneficiem claramente de execução isolada.

A extração deverá começar preferencialmente por funcionalidades com limites transacionais bem definidos e baixo acoplamento ao núcleo financeiro.