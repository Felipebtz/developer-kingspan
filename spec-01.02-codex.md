(Kingspan ISOESTE)
Situação: especificação para implementação incremental pelo Codex; não é declaração de funcionalidade pronta.
Base: README.md original do desafio (fonte de verdade), estado real do repositório na branch teste-pleno e classes existentes.
Objetivo: completar o fluxo DRAFT → PENDING_APPROVAL → APPROVED e a ramificação PENDING_APPROVAL → CHANGES_REQUESTED → edição → reenvio v2, com integridade transacional, autorização, concorrência, orçamento e auditoria.
Stack: Java 17, Spring Boot / Spring Security Resource Server, JPA, Flyway, PostgreSQL, JUnit 5, Mockito, Testcontainers. Monólito modular.
0. Regras inegociáveis antes de codificar
1. Ler README.md, AGENTS.md, backend/pom.xml, todas as migrations Flyway e as implementações reais das entidades, DTOs, enums, services e repositories. Arquivos que aparecem nas capturas são pistas, não contratos de métodos.
2. Confirmar git branch --show-current = teste-pleno e git status --short; preservar alterações pré-existentes. Inventariar endpoints efetivamente existentes antes de adicionar outros. Não declarar implementado o que apenas existe no enunciado.
3. Cumprir o registro de IA exigido pelo repositório. No Windows, usar explicitamente o Git Bash se o bash padrão cair no WSL. Não modificar arquivos protegidos, hooks, .agents/changelog/diff.md (append-only), scripts de setup ou migrations já aplicadas. Não utilizar --no-verify.
4. Não recriar PurchaseRequestEntity, RequestVersionEntity, ApprovalStepEntity, MonthlyBudgetEntity, PurchaseRequestAuditEntity, ApprovalFlowFactory, SubmitPurchaseRequestService, PurchaseRequestService, repositories ou enums existentes. Adaptar-se a eles, com modificações mínimas e justificadas.
5. Não alterar as regras para fazer os testes passarem. Não usar Thread.sleep como mecanismo de sincronização de concorrência. Não substituir PostgreSQL por H2. Não eliminar testes antigos. Não simular fluxos ausentes por meio de mocks em testes que se dizem de integração.
6. Spring 7: para 422, usar HttpStatus.UNPROCESSABLE_CONTENT, não UNPROCESSABLE_ENTITY. Manter código Java compacto, nomes claros e sem abstrações vazias.
7. Não criar microsserviços, Kafka, RabbitMQ, Saga, notifications, frontend nem dashboard nesta SPEC. Não fazer commit/push sem autorização expressa.
8. Toda transição sensível usa identidade de Jwt validado pelo servidor (sub, role, costCenterId, approverLevel); nunca confiar em X-User-Id ou papel informado livremente pelo cliente.
9. Se faltar código/assinatura/migration, relatar o bloqueio; não inventar fields/constructors. Se ocorrer falha de ferramenta, tentar alternativa segura e informar a evidência, sem afirmar execução bem-sucedida.
1. Inventário e ponto de partida
Nas capturas e no código já discutido há:
- auth/: UserEntity (costCenterEntity), JWT, UserRole e ApproverLevel, autenticação e gerenciamento de usuários.
- budget/entity/: CostCenterEntity e MonthlyBudgetEntity; budget/repository/ já existe, mas verificar suas assinaturas.
- purchaserequest/entity/: PurchaseRequestEntity, RequestVersionEntity, ApprovalStepEntity, PurchaseRequestAuditEntity, RequestIdempotencyEntity e enums de categoria, status, nível e estado da etapa.
- purchaserequest/repository/: ApprovalStepRepository, PurchaseRequestAuditRepository, PurchaseRequestRepository, RequestIdempotencyRepository, RequestVersionRepository (conferir package/caminhos efetivos).
- purchaserequest/service/: PurchaseRequestService, SubmitPurchaseRequestService, PurchaseRequestAuditService.
- ApprovalFlowFactory.generateSteps(snapshot) já gera sequência por categoria e valor. Reutilizá-lo; não recriar generateLevels nem outra factory.
Diagnóstico a confirmar no disco pelo Codex: faltam o processamento das decisões (approve/reject/request-changes/cancel), consumo transacional de orçamento, inbox, consultas de versões/histórico; não supor que nenhum deles exista sem rg e leitura do código. Verificar se lockVersion possui @Version e se as operações realmente incrementam a revisão.
Entregáveis de código — mínimos e condicionais
Local	Ação proposta	Responsabilidade
purchaserequest/service/ApprovalService.java	Criar se ausente	Orquestrar approve, reject, requestChanges; na mesma transação; também cancel se mantiver o service enxuto
purchaserequest/controller/ApprovalController.java	Criar se ausente	Expor decisões com DTOs validados e JWT
purchaserequest/service/ApprovalInboxService.java	Criar se ausente	Consultar somente etapas pendentes elegíveis
budget/service/BudgetService.java	Criar se ausente	Consumir saldo sob lock; não abrir transação independente
budget/repository/MonthlyBudgetRepository.java	Completar se existir	Query de busca com PESSIMISTIC_WRITE para (cost_center_id, competence)
purchaserequest/domain/PurchaseRequestPolicy.java	Estender com cuidado	Políticas de permissão e segregação, reutilizadas por serviço e allowedActions
purchaserequest/entity/*	Modificar só quando necessário	Transições de domínio e @Version sem setters arbitrários ou duplicação de estados
purchaserequest/repository/*	Completar	Consultas às etapas por versão, decisões anteriores, versões e auditoria
purchaserequest/controller/PurchaseRequestController.java	Completar	Rotas de versions/history/cancel se não existirem; manter outras rotas
DTOs de decisão e consulta	Criar o mínimo	lockVersion obrigatório; comentário opcional no approve e obrigatório em reject/request-changes


Não inventar o mapeamento JPA: UserEntity tem costCenterEntity, não um atributo próprio costCenterId; CostCenterEntity usa getStatus() == CostCenterStatus.ACTIVE, e seu ID é getId().
2. Regras de domínio obrigatórias
2.1 Estados e ações
Estado de origem	Ação	Estado de destino	Observações
DRAFT	submit	PENDING_APPROVAL	Dono, dados válidos, gera v1 e cadeia
PENDING_APPROVAL	approve intermediário	PENDING_APPROVAL	Fecha etapa atual e ativa a seguinte
PENDING_APPROVAL	approve final	APPROVED	Na mesma transação consome orçamento
PENDING_APPROVAL	reject	REJECTED	Comentário >= 10 caracteres
PENDING_APPROVAL	request-changes	CHANGES_REQUESTED	Comentário >= 10 caracteres
CHANGES_REQUESTED	edit + submit	PENDING_APPROVAL	Dono edita e reenvia; cria nova versão e etapas do zero
DRAFT / PENDING_APPROVAL / CHANGES_REQUESTED	cancel	CANCELLED	Dono ou ADMIN; exige lockVersion
APPROVED / REJECTED / CANCELLED	qualquer transição	bloqueada	Finalidade imutável


Cada transição exige lockVersion atual; currentVersion identifica snapshot de submissão, não deve ser confundida com o lock otimista.
2.2 Geração e execução da cadeia
- Valor <= R$ 1.000,00: NIVEL_1.
- Valor entre R$ 1.000,01 e R$ 10.000,00: NIVEL_1 → NIVEL_2.
- Valor > R$ 10.000,00: NIVEL_1 → NIVEL_2 → ADMIN.
- SOFTWARE: sempre termina em ADMIN sem duplicá-lo (mesmo quando abaixo de R$ 1.000).
- Somente a etapa inicial é acionável. As demais aguardam. Ao aprovar uma etapa intermediária, ativar somente a próxima.
- Nunca pular etapas nem permitir duas pendentes na mesma versão. As etapas são da versão do pedido; reenvio cria novas etapas, sem herdar votos.
- Se não existe aprovador elegível, a etapa fica pendente — nunca avança automaticamente nem gera 422 por essa razão.
2.3 Elegibilidade, autorização e segregação
- NIVEL_1: APROVADOR NIVEL_1 ou NIVEL_2 do mesmo centro de custo, ou ADMIN.
- NIVEL_2: APROVADOR NIVEL_2 do mesmo centro de custo, ou ADMIN.
- ADMIN: somente ADMIN.
- Ninguém aprova a própria solicitação, inclusive ADMIN.
- A mesma pessoa não aprova duas etapas da mesma versão, independentemente do nível ou papel.
- Um SOLICITANTE não aprova. APROVADOR de outro centro de custo não aprova. Não confiar em claim stale sem decidir a fonte de verdade: confirmar status ACTIVE e dados atuais do usuário quando pertinente, e documentar a decisão.
- Comentário para approve é opcional; para reject/request-changes é obrigatório e possui no mínimo 10 caracteres válidos após trim().
- allowedActions deve usar a mesma policy que a execução real. Um autor de solicitação submetida não pode receber APPROVE para pedido próprio. Tokens ausentes/inválidos retornam 401.
- Visibilidade ambígua do README: ele diz ADMIN vê tudo e também DRAFT só pelo dono. Não expandir visibilidade sem ADR; registrar decisão e testá-la. CHANGES_REQUESTED tem de ser explicitamente tratado.
3. Concorrência e transações
3.1 Duas decisões para a mesma solicitação
- PurchaseRequestEntity.lockVersion deve ser @Version (confirmar no código real). O campo precisa incrementar em toda transição, mesmo que o status continue PENDING_APPROVAL após aprovar uma etapa intermediária.
- Opções válidas: modificar a linha da solicitação ou aplicar OPTIMISTIC_FORCE_INCREMENT no lock da entidade. Simples if (Objects.equals(...)) não é suficiente.
- Em colisão, somente uma decisão e um evento são confirmados; concorrente recebe 409 CONCURRENT_MODIFICATION. Tratar falhas otimistas inclusive no flush/commit no handler global, sem retornar 500 genérico.
- Não tentar suprimir DataIntegrityViolationException dentro de uma transação PostgreSQL abortada para continuar usando a mesma conexão.
3.2 Concorrência do orçamento
- Usar monthly_budgets existente e o relacionamento real de MonthlyBudgetEntity, sem criar tabela duplicada.
- Competência = primeiro dia do mês da submissão da versão atual, calculado em America/Sao_Paulo; usar snapshot competenceDate, quando disponível. Não usar mês da aprovação ou o relógio atual.
- Saldo = allocated - consumed; mês sem orçamento equivale a zero.
- Em aprovação final: obter monthly_budgets da competência com @Lock(PESSIMISTIC_WRITE) / SELECT ... FOR UPDATE, validar saldo, consumir valor, mudar status da etapa e do pedido, gravar auditoria, tudo na mesma transação.
- Saldo insuficiente: 422 BUDGET_EXCEEDED, pedido continua PENDING_APPROVAL, etapa ainda pendente e orçamento inalterado.
- Não permitir saldo negativo, gasto duplicado ou aprovação parcial. Não usar REQUIRES_NEW no consumo de orçamento nem na auditoria.
- Orçamento definido abaixo do já consumido é rejeitado com 422 BUDGET_BELOW_CONSUMED na rota administrativa correspondente (se estiver neste ciclo).
- Bloqueios devem seguir ordem consistente: primeiro solicitação/etapa, depois orçamento; transações diferentes de orçamento devem disputar a mesma linha, sem consulta solta fora do lock.
3.3 Auditoria e snapshots
- PurchaseRequestAuditService participa da mesma transação (idealmente MANDATORY, se já estiver assim). Um rollback não deixa evento órfão.
- Cada decisão contém ator, papel, ação, status anterior/novo, etapa, versão, comentário, UTC e X-Request-Id (examinar entidade para confirmar o que já existe e completar apenas o necessário).
- Histórico append-only, nunca apagar/modificar evento anterior; não alterar os snapshots antigos da versão 1 ao gerar versão 2.
- Não mudar migrations Flyway já aplicadas; se uma coluna/constraint nova for necessária, criar nova migration e explicar necessidade. Respeitar índices únicos existentes.
4. Contrato HTTP mínimo desta SPEC
Método	Rota	Contrato
POST	/requests/{id}/approve	Body { "lockVersion": 3, "comment": "De acordo" } (comentário opcional)
POST	/requests/{id}/reject	Body { "lockVersion": 3, "comment": "Justificativa com 10 ou mais caracteres" }
POST	/requests/{id}/request-changes	Mesmo body de reject
POST	/requests/{id}/cancel	Body { "lockVersion": 3 }
GET	/approvals/inbox	Lista paginada só do escopo e da etapa atual elegível
GET	/requests/{id}/versions	Versões da solicitação, em escopo autorizado
GET	/requests/{id}/versions/{n}	Snapshot histórico imutável da versão n
GET	/requests/{id}/history	Linha do tempo autorizada
GET/PUT	/cost-centers/{id}/budgets/{yyyy-mm}	Consultar/definir orçamento; PUT restrito a ADMIN, se ainda não implementado


Segurança e erros: autenticação 401; sem visibilidade 404; papel proibido 403; lockVersion divergente 409; regra de negócio 422 com code específico. Manter formato application/problem+json RFC 9457 com type, title, status, detail, code e errors[] quando validação de campo. Sucessos podem ser 200 ou 204, mas padronizar e documentar. Gerar/propagar X-Request-Id para log, resposta e auditoria.

Ordem obrigatória: autenticação → existência/visibilidade → papel → concorrência → regras de estado/nível/segregação/comentário/orçamento, de acordo com o README; evitar vazar dados por códigos/erros.
5. Plano incremental de implementação (gates)
GATE A — Auditoria do código real e baseline (sem implementar o domínio)
1. git status --short, branch, rg de classes/endpoints, migrations e testes; relatar o que existe e não existe.
2. Inspecionar ApprovalStepEntity e ApprovalStepStatus, métodos de decisão, RequestVersionEntity e sua competência, MonthlyBudgetEntity, PurchaseRequestEntity.lockVersion, a assinatura de PurchaseRequestAuditService.record() e GlobalExceptionHandler.
3. Identificar quais classes/DTOs realmente precisam nascer e anotar pontos de compatibilidade.
4. Executar build/testes anteriores por um Maven funcional. Se wrapper PowerShell ou WSL falhar, tentar Git Bash com cache gravável autorizado; não modificar wrapper nem remover hooks.
5. Apresentar relatório GATE A antes de avançar: comandos, baseline, entidades e decisões de modelagem. Não mascarar compilação que já falhava antes.
GATE B — Decisões e auditoria (sem orçamento final inicialmente)
1. Implementar/estender policy: elegibilidade, segregação, visibilidade, allowedActions e validações de comentários.
2. Implementar approve intermediário, reject, request-changes e cancel; transição explícita nas entidades, sem setters arbitrários.
3. Criar controllers/DTOs mínimos, validações @Valid e tratamento consistente dos códigos HTTP.
4. Testar sequência com 2 etapas, rejeição e devolução, lockVersion e rollback. A aprovação final só é concluída após GATE C; não liberar caminho que ignore orçamento.
5. Registrar relatório de mudanças e testes. Não modificar código fora da área sem motivo.
GATE C — Orçamento final transacional
1. Usar repository de orçamento real com PESSIMISTIC_WRITE por centro de custo e competência.
2. Consumir somente na última etapa, dentro da transação de aprovação; rollback absoluto se saldo insuficiente.
3. Garantir 422 BUDGET_EXCEEDED, saldo >= 0, sem consumo duplo e mês sem orçamento = saldo zero.
4. Testes com PostgreSQL: aprovação final suficiente/insuficiente, duas solicitações competindo pelo mesmo saldo.
GATE D — Inbox, versões, histórico e contrato
1. Implementar inbox respeitando nível, centro, etapa atual, segregação e ausência de aprovador elegível (continua pendente).
2. Expor versões/histórico consultáveis e imutáveis; evitar N+1 em listagem e assegurar visibilidade.
3. Completar allowedActions, problem+json, paginação, X-Request-Id e rotas de orçamento ADMIN estritamente necessárias.
4. Fazer smoke end-to-end no Postman e validar as tabelas reais por SQL somente leitura.
GATE E — Regressão + evidências
1. Executar toda a suíte antiga e nova. Se testes *IT dependem do Failsafe, garantir que mvn verify os execute; provar por relatórios Surefire/Failsafe.
2. Confirmar Docker Compose, logs, Flyway, seed e banco; não rodar docker compose down -v, flyway repair, flyway clean ou apagar volumes.
3. Entregar tabela PASS/FAIL/BLOCKED, evidências dos comandos e consultas, arquivos alterados, pendências e git diff --stat.
4. Não fazer commit, push ou alterar arquivos protegidos sem autorização.
6. Testes mínimos necessários (não multiplicar classes sem motivo)
Unitários (preferir arquivos existentes onde couber):
- ApprovalFlowFactoryTest: bordas R$ 1.000, R$ 1.000,01, R$ 10.000 e R$ 10.000,01; SOFTWARE com ADMIN único, primeiro PENDING, ordem correta.
- PurchaseRequestPolicyTest: NIVEL_2 pode NIVEL_1, NIVEL_1 não pode NIVEL_2, ADMIN somente na etapa ADMIN, não autoaprovação, não aprovador repetido, outro centro, estados finais.
- ApprovalServiceTest: approve intermediário, rejeição e devolução com comentário, cancelamento, estado inválido, lockVersion antigo, falha de auditoria reverte, ausência de próximo passo elegível mantém pendente.
- BudgetServiceTest: saldo suficiente/igual/insuficiente, mês sem orçamento, competência correta, falha sem consumir.
- Preservar PurchaseRequestServiceTest e SubmitPurchaseRequestServiceTest, se já existentes, e não enfraquecer asserts.
Integração (PostgreSQL real via Testcontainers ou compose):
- ApprovalFlowIT: DRAFT → submit v1 → NIVEL_1 → NIVEL_2 → ADMIN → APPROVED; snapshots, etapas, auditoria, lockVersion, saldo consumido exatamente uma vez.
- ApprovalFlowIT: rejeição e request-changes → editar → resubmeter v2, v1 intacta, etapas recalculadas e aprovações não herdadas.
- ApprovalFlowIT: 422 orçamento insuficiente mantendo solicitação pendente; autoaprovação e repetição de aprovador recusadas sem mutação.
- ApprovalConcurrencyIT: duas decisões simultâneas da mesma etapa com o mesmo lock → uma confirmação, outra 409, uma auditoria/etapa.
- BudgetConcurrencyIT: duas solicitações distintas de R$ 8.000 disputam saldo R$ 10.000 → uma finaliza, outra 422, consumido R$ 8.000 e disponível R$ 2.000; sem saldo negativo.
- PurchaseRequestIdempotencyIT existente/condicional: mesmo user + key + payload retorna mesmo ID/201, payload diferente 409; duas criações simultâneas não persistem duplicados.
Não criar 10 classes se puder agrupar: as últimas integrações podem residir em PurchaseRequestIntegrationTest e PurchaseRequestConcurrencyIT; só separar se tornar a suíte mais estável e legível. Cobertura de fluxo > quantidade de arquivos.
Testes negativos de API obrigatórios
Caso	Esperado
Token ausente/inválido	401
SOLICITANTE tenta aprovar	403
Aprovar ID invisível	404
Mesmo lockVersion desatualizado	409
Aprovador de nível insuficiente	422 APPROVER_NOT_ELIGIBLE
Aprovar própria compra	422 SELF_APPROVAL_FORBIDDEN
Mesmo aprovador em duas etapas da versão	422 DUPLICATE_APPROVER
Rejeitar/devolver sem comentário válido	422 COMMENT_REQUIRED
Saldo insuficiente / sem mês orçado	422 BUDGET_EXCEEDED
Aprovar estado terminal	422 INVALID_TRANSITION
Sem aprovador elegível no sistema	Mantém PENDING, inbox vazia daquele usuário


7. Roteiro mínimo Postman e conferência de banco
Criar Environment baseUrl, tokenSolicitante, tokenNivel1, tokenNivel2, tokenAdmin, requestId, lockVersion.
1. Login de cada papel (token vem de /auth/login); não usar header de usuário/papel.
2. Solicitante faz POST /requests com 3 itens totalizando > R$ 10.000, chave UUID e X-Request-Id.
3. POST /requests/{id}/submit com lockVersion atual → PENDING_APPROVAL, v1 e três etapas.
4. Aprovador NIVEL_1: GET detalhe/Inbox; aprova. GET novamente e captura novo lockVersion.
5. Aprovador NIVEL_2: aprova a etapa seguinte. GET novamente, verifica orçamento ainda intocado.
6. ADMIN: aprova etapa final. GET detalhamento + orçamento → APPROVED, consumido uma vez.
7. Criar outro pedido: enviar → devolver com comentário >= 10 → editar → reenviar v2 → consultar v1/v2/histórico.
8. Exercitar 401, 403, 404, 409, 422, self-approval, duplicate approver, sem orçamento e comentário curto.
SQL de conferência (somente leitura; ajustar nomes reais antes de rodar):
SELECT installed_rank, version, description, success FROM flyway_schema_history ORDER BY installed_rank;
SELECT id, status, current_version, lock_version, total_amount, submitted_at FROM purchase_requests ORDER BY id DESC LIMIT 20;
SELECT purchase_request_id, version_number, total_amount, competence_date FROM request_versions ORDER BY purchase_request_id, version_number;
SELECT request_version_id, step_order, required_level, status, approver_id FROM approval_steps ORDER BY request_version_id, step_order;
SELECT * FROM monthly_budgets ORDER BY cost_center_id, competence DESC;
SELECT * FROM request_idempotency ORDER BY created_at DESC LIMIT 20;
Checar ainda que não há múltiplas etapas PENDING na mesma versão, aprovador repetido na versão e orçamento com consumido > alocado. Usar consultas sobre as colunas reais vistas nas migrations.
8. Comandos de execução (PowerShell, somente após inventário)
# Na raiz do repositório
git branch --show-current
git status --short
docker info
docker compose config --services
docker compose config --quiet

# Subir serviços existentes sem apagar volumes
docker compose up -d --build
docker compose ps
docker compose logs --tail=150

# No backend, usar wrapper funcional (o Codex já encontrou problema no mvnw.cmd)
cd backend
.\mvnw.cmd clean verify
Se mvnw.cmd falhar por ambiente, o Codex deve executar pelo Git Bash explicitamente, usando cache/Home gravável e autorizado. Confirmar o diretório atual, configurações reais da wrapper e permissões; não inventar sucesso nem editar wrapper protegido para desviar o problema. Failsafe pode requerer configuração no pom.xml para que *IT entre no verify.

SQL no container: descobrir o nome real por docker compose config --services, bem como POSTGRES_USER e POSTGRES_DB; não presumir serviço chamado postgres. Só executar SELECT e conferir o resultado com os testes.
9. Contrato de saída do Codex — obrigatório por gate
Ao terminar cada gate, responder com:
1. Gate executado e o que estava realmente implementado antes de começar.
2. Arquivos modificados/criados (nomes exatos), motivação, eventuais migrations novas.
3. Comandos executados e respectivos códigos de saída; número de testes executados/aprovados/falhos/ignorados, mais nomes dos testes que falharam.
4. Evidências de rollback, lockVersion, versões e consumo de orçamento (quando aplicáveis).
5. Problemas de ambiente versus defeitos de código claramente separados.
6. Lista objetiva de bloqueios para o próximo gate. git status --short, git diff --stat.
7. Nunca declarar "backend pronto", "CI verde" ou "concorrência garantida" sem teste real comprovando.
Ordem de entrega: começar somente com GATE A e apresentar o inventário/baseline para revisão. Após aprovarmos esse mapa, executar GATE B, depois C, D e E. Implementar alterações menores antes de construir uma camada nova inteira.
10. Critério de aceite final
A SPEC 07.1 só estará concluída quando o fluxo real (> R$ 10.000) passar por NIVEL_1 → NIVEL_2 → ADMIN e consumir orçamento exatamente uma vez; quando devolução e reenvio preservarem v1; quando permissão, comentário, status e concorrência tiverem testes automatizados com PostgreSQL; quando auditoria e X-Request-Id forem rastreáveis; quando os endpoints necessários responderem o contrato HTTP; e quando a suíte antiga continuar verde. Itens não implementados ou testes bloqueados devem ser apresentados como pendências, nunca como aprovação tácita.