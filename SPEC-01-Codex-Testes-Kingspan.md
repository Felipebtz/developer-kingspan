# SPEC 01 — Testes rigorosos, integração e validação do PostgreSQL

**Projeto:** Kingspan ISOESTE — desafio Fullstack Pleno  
**Destino:** Codex executando no clone local da branch `teste-pleno`  
**Escopo:** `backend/` e, se estritamente necessário, scripts de verificação em `docs/`; sem refatoração ampla.  
**Fonte normativa:** README.md protegido, especialmente seções 2, 3, 4, 5.1–5.4, 9 e 10.  
**Meta:** seis classes unitárias e duas classes de integração. Nenhum teste artificialmente verde.

## 0. Instrução obrigatória ao agente Codex

> Trabalhe no repositório real, não em exemplos isolados. Primeiro leia `README.md`, `AGENTS.md` e as instruções de agentes pertinentes, `backend/pom.xml`, entities, DTOs, repositories, services, políticas, validators, migrations Flyway e testes existentes. Identifique os nomes e as assinaturas reais **antes** de escrever cada teste. Execute testes e Docker de fato; não declare sucesso sem log e exit code 0. Preserve o código de produção sempre que possível. Se identificar defeito real, registre teste reproduzível primeiro e faça a menor correção segura, sem mudar regras do desafio. Se algum módulo do fluxo estiver ausente, registre como BLOCKED/RED, em vez de simular uma funcionalidade inexistente ou alterar os testes para passar. Continue até obter o máximo de validação possível sem esconder pendências.

### 0.1 Proteções inegociáveis

1. **Não alterar** `README.md` da raiz, `.gitignore` da raiz, `.gitattributes`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.claude/settings.json`, `.cursor/`, `.githooks/`, `setup.sh` ou `.agents/` (salvo acrescentar entradas pelo mecanismo de registro autorizado). **Não editar/apagar linhas existentes** de `.agents/changelog/diff.md`.
2. **Não contornar hooks**: nunca usar `--no-verify`, `SKIP=`, substituir `core.hooksPath`, instalar Husky/Lefthook ou commitar pela interface web. Se o clone não estiver preparado, executar `./setup.sh` pelo Git Bash conforme o README, sem editar o script.
3. **Registrar o uso da IA** conforme os hooks/instruções existentes; nunca afirmar que código gerado pelo Codex foi escrito integralmente à mão. `AI_USAGE.md` deve ser o relato verdadeiro e pessoal do candidato: não inventar experiência ou atribuições e não sobrescrever uma versão já redigida pelo candidato.
4. **Preservar segurança e dados**: não inserir credenciais reais em código, testes, logs ou commit; não apontar testes destrutivos para DB compartilhado; não usar `docker compose down -v`, `docker volume rm`, `docker system prune`, `DROP`, `TRUNCATE`, `DELETE` para preparar ambiente sem confirmação explícita de que é DB de teste descartável. Não executar Flyway `repair` ou alterar migrations já aplicadas para fazer testes passarem; criar nova migration se uma correção legítima for necessária.
5. **Sem regressão**: não remover testes antigos; não enfraquecer assertions nem ignorar falhas (`@Disabled`, `@Ignore`, exceções engolidas, `-DskipTests`, `-Dmaven.test.skip=true`). Não trocar `@Transactional`/`@Version`/constraints apenas para silenciar um teste. Evitar mocks de classes finais sem necessidade.
6. **Tecnologia real:** Java 17, Spring Boot/Spring Framework conforme `pom.xml`, Maven Wrapper, JUnit 5, Mockito, PostgreSQL real para testes de integração. Usar `HttpStatus.UNPROCESSABLE_CONTENT` no código que usar essa constante, não API depreciada. Não criar `RequestIdempotencyService` redundante: a idempotência atual está em `PurchaseRequestService` e `RequestIdempotencyEntity`.
7. **Sem dados falsos**: não registrar `BUILD SUCCESS`, status de Docker, migrations criadas ou testes passados se não houver execução real. Registrar falhas e por que não foi possível validar.
8. **Não efetuar commits/push automaticamente** sem orientação do usuário; preparar relatório de arquivos alterados e comando de commit seguro após CI verde.

## 1. Inventário obrigatório ANTES de codificar

Executar na raiz do repositório, em PowerShell, guardando a saída:

```powershell
pwd
git status --short
git branch --show-current
Get-ChildItem .\backend\src\test\java -Recurse -Filter '*Test.java' | Select-Object -ExpandProperty FullName
Get-ChildItem .\backend\src\main\resources\db\migration -ErrorAction SilentlyContinue
Get-Content .\backend\pom.xml | Select-String 'surefire|failsafe|testcontainers|postgresql|spring-boot'
```

- Verificar a **branch `teste-pleno`** e o estado inicial do working tree; não sobrescrever mudanças preexistentes.
- Ler `UserEntity`: campo `costCenterEntity` e `getCostCenterId()` via `costCenterEntity.getId()`; `CostCenterEntity` usa `getStatus() == CostCenterStatus.ACTIVE`, **não `isActive()`**.
- Ler `RequestIdempotencyEntity`: construtor `(userId, key, hash, Instant)`, `matchesPayload`, `isCompleted`, `complete(..., JsonNode)`, resposta `JsonNode`; não inventar setters.
- Ler `ApprovalFlowFactory.generateSteps(RequestVersionEntity)`, que retorna `List<ApprovalStepEntity>`; **não usar `generateLevels()`**.
- Confirmar `PurchaseRequestStatus` real (ex.: DRAFT, CHANGES_REQUESTED, PENDING_APPROVAL, APPROVED, REJECTED, CANCELLED) e nomes reais de DTOs, métodos e campos.
- Verificar se ApprovalService, orçamento, inbox, reject/cancel/request-changes, versões e histórico já estão implementados. **Não pressupor existência**.
- Identificar mapeamento real do `lockVersion`: `@Version` no campo de concorrência, incrementos efetivos sob `saveAndFlush`, e separação de `currentVersion`.
- Fazer inventário de `pom.xml` para Maven Surefire/Failsafe e testes já existentes: `UserServiceTest`, `AdminUserServiceTest`, testes Spring/Testcontainers. Comparar as regras com o README antes de escolher assertions.
- As classes sugeridas abaixo são o teto de **oito arquivos novos**, não uma obrigação de renomear arquivos pré-existentes. Reutilizar os existentes e evitar duplicação.

## 2. Matriz de testes — seis unitários

Testes independentes do DB com JUnit 5/Mockito. Padrão Arrange/Act/Assert, nomes em português (`deve...`, `naoDeve...`), argumentos bem definidos. Verificar **estado e interações**, não apenas `assertNotNull`; `verify(..., never())` quando não deve persistir. Não mockar método sob teste.

### U01 — `domain/ApprovalFlowFactoryTest.java` [P0]

Fonte: `ApprovalFlowFactory.generateSteps(version)`; usar mock de `RequestVersionEntity` apenas como entrada ou criar snapshot real se o construtor comportar.

- `R$ 1.000,00 / EQUIPMENT` => sequência exata `[NIVEL_1]`.
- `R$ 1.000,01 / EQUIPMENT` => `[NIVEL_1, NIVEL_2]`.
- `R$ 10.000,00 / SERVICES` => `[NIVEL_1, NIVEL_2]`.
- `R$ 10.000,01 / SUPPLIES` => `[NIVEL_1, NIVEL_2, ADMIN]`.
- `R$ 500,00 / SOFTWARE` => `[NIVEL_1, ADMIN]`.
- `R$ 5.000,00 / SOFTWARE` => `[NIVEL_1, NIVEL_2, ADMIN]`.
- `R$ 20.000,00 / SOFTWARE` => `[NIVEL_1, NIVEL_2, ADMIN]`, ADMIN sem duplicação.
- Todas as etapas com `stepOrder` 1..N; apenas a primeira `PENDING` e demais `WAITING` (comparar enums reais do repo).
- Não alterar os limites `>` para `>=` ou arredondar antes da escolha da cadeia.

### U02 — `domain/PurchaseAmountCalculatorTest.java` [P0]

- `3 × 49.90 = 149.70`, múltiplos itens e soma correta, precisão `BigDecimal`.
- Zero e negativos para quantidade/preço são rejeitados na **camada realmente responsável** (entity/DTO/validator, sem duplicar validação fictícia no calculator).
- `unitPrice` de BRL com escala monetária definida pela implementação; `BigDecimal` sem `double`.
- Payload que tente fornecer `totalAmount`/subtotal deve ser ignorado ou rejeitado conforme DTO: backend jamais confia no valor do cliente.
- Retorno com lista vazia: validar comportamento real do calculator e regra distinta da submissão (rascunho pode existir incompleto se assim definido).

### U03 — `domain/PurchaseRequestPolicyTest.java` [P0]

- Dono pode editar DRAFT e CHANGES_REQUESTED; terceiro não pode.
- PENDING_APPROVAL/APPROVED/REJECTED/CANCELLED não editáveis.
- Só dono submete DRAFT ou reenvia CHANGES_REQUESTED; PENDING e estados finais não submetem.
- `allowedActions` não pode anunciar ações que a política negaria.
- Papel SOLICITANTE não aprova; aprovador do outro centro não aprova; ADMIN e níveis conforme README, somente se essas regras residirem nesta classe (do contrário testar no serviço específico existente).
- Autoaprovação proibida e mesma pessoa não aprova duas etapas da versão; testar na camada real que valida isso.
- Sem permissão: diferenciar 403 para ação de papel, 404 para recurso fora do escopo e 422 para regra de negócio, conforme ADR/README.

### U04 — `domain/PurchaseRequestValidatorTest.java` [P1]

- Submissão rejeita itens ausentes/vazios, quantidade <= 0, preço <= 0, campos obrigatórios, categoria inválida, e `neededBy` presente não futura; testar no nível em que a validação é aplicada.
- Data futura é aceita; data ausente é permitida.
- Os checks na **submissão** não devem impedir um DRAFT deliberadamente incompleto quando o contrato permitir.
- Não depender da data fixa do calendário: `LocalDate.now(ZoneId.of("America/Sao_Paulo")).plusDays(30)`; se código permite, Clock fixo para fronteiras.
- Erros de parsing de enum JSON normalmente são do controller (`400`), não atribuir artificialmente ao domain validator.

### U05 — `service/PurchaseRequestServiceTest.java` [P0]

- Criação como DRAFT, `currentVersion=0`, itens e total recalculados, auditoria invocada uma vez, usuário e centro resolvidos corretamente.
- Centro inexistente/inativo => 422; user inexistente => 404.
- ADMIN global precisa informar costCenterId; SOLICITANTE e APROVADOR não podem alterar arbitrariamente o próprio centro de custo via payload.
- Idempotency-Key ausente => executa criação; inválida/vazia => 400; primeira chave => entidade reservada/completada.
- Mesmo usuário, chave e payload => replay do mesmo DTO sem `save` nem nova auditoria; payload divergente => 409; PROCESSING => conflito controlado. Chaves idênticas de usuários distintos são independentes.
- `JsonNode` deve ser recuperado com `objectMapper.treeToValue`, não `readValue(JsonNode)` ou comparação `"COMPLETED".equals(enum)`.
- Edita apenas quando permitido, substitui itens e recalcula total; lockVersion divergente => 409 sem persistência/auditoria.
- Visibilidade: DRAFT privado ao dono mesmo para APROVADOR; APROVADOR vê publicadas do centro; outro centro 404; ADMIN vê todas; autor vê as próprias.
- Não usar mocks para provar UNIQUE/rollback: reservar isso aos IT.

### U06 — `service/SubmitPurchaseRequestServiceTest.java` [P0]

- ID inexistente => 404, sem snapshot ou audit.
- Não dono => sem submissão.
- LockVersion desatualizado => 409, sem persistir versões/steps.
- `validateForSubmission` falha => nenhum save/snapshot/step/evento.
- DRAFT válido => chama `markSubmitted`, versionRepository, `approvalFlowFactory.generateSteps(snapshot)`, `approvalStepRepository.saveAll`, uma auditoria; ordem e status coerentes.
- CHANGES_REQUESTED => nextVersion incrementada, evento `REQUEST_RESUBMITTED`.
- Nova submissão de PENDING_APPROVAL/APPROVED/REJECTED/CANCELLED => bloqueada.
- Falha de persistência => não afirmar rollback com Mockito: verificar com integração de verdade.
- Não usar método inventado `generateLevels`.

## 3. Matriz de integração — duas classes com PostgreSQL real

**Obrigatório:** usar Testcontainers PostgreSQL ou banco isolado de testes do Compose; Flyway real executa as migrations; Hibernate em modo `validate` como produção, se configurado. Não substituir PostgreSQL por H2. Evitar usar dados ou portas do banco da aplicação de desenvolvimento para testes que criam/modificam registros. Identificadores e UUIDs únicos por teste. Após cada cenário consultar as tabelas e verificar ausência de registros parciais. Não desabilitar constraints ou `@Transactional`.

### I01 — `integration/PurchaseRequestIntegrationTest.java` [P0]

Separar em métodos `@Test` bem nomeados (não uma sequência gigantesca dependente da ordem):

1. **Criação:** autenticação adequada ou serviço + DB; um DRAFT, itens corretos, total recalculado, auditoria `REQUEST_CREATED`; sem `request_versions` antes da submissão.
2. **Idempotência:** 2 POST com mesmo usuário/chave/payload => 201/mesmo ID/body, exatamente 1 `purchase_requests`, itens e evento; mesma chave + payload distinto => 409; outra chave ou outro usuário => nova operação. Confirmar `request_idempotency` COMPLETED com JSONB e TTL >= 24 horas. Verificar caso de key expirada/limpeza apenas se comportamento implementado, sem inventar semântica.
3. **Submissão:** DRAFT válido => PENDING_APPROVAL, `currentVersion=1`, snapshot imutável, version items, etapas corretas e apenas primeira pendente, evento e nenhuma alteração de orçamento.
4. **Fluxo completo > R$ 10.000:** NIVEL_1 por aprovador A, NIVEL_2 por aprovador B, ADMIN por C; status APPROVED; orçamento debitado **somente na última etapa, exatamente uma vez**; sequência e auditoria registradas.
5. **Segregação:** aprovador não aprova solicitação própria; mesmo aprovador não aprova duas etapas da mesma versão; nível e centro precisam ser corretos; rejeitar com code específico e nenhum estado parcial.
6. **Insuficiência de saldo:** último approve retorna 422 `BUDGET_EXCEEDED`; status permanece PENDING_APPROVAL, etapa atual continua pendente, valor consumido não muda; mês sem orçamento também saldo zero.
7. **Devolução e v2:** v1 submetida → devolução com comentário >=10 → editar → reenvio → v2 nova e corrente; v1 e itens antigos imutáveis; cadeia v2 recalculada, aprovações da v1 não herdadas; verificar competência no fuso America/Sao_Paulo, inclusive fronteira mensal quando possível via clock controlado.
8. **Auditoria/transação:** erro forçado no meio da submissão não deixa pedido parcial, snapshot, etapas ou evento adicional; trilha de evento contém ator, role, from/to, version, etapa, timestamp UTC e `X-Request-Id` conforme schema implementado.
9. **Visibilidade e listagem:** DRAFT só autor; APROVADOR somente seu centro e estados visíveis; ADMIN tudo; paginação/filtros e envelope da resposta conformes README. Se contratos ainda não implementados, documentar FAIL/PENDING sem afirmar que passou.

**Contrato**: assert HTTP 201/200/204 conforme endpoint, 400/401/403/404/409/422 conforme README; erros `application/problem+json` com `code`, `detail`, etc. `allowedActions` deve corresponder à permissão efetiva.

**NÃO inventar endpoints**: se `/approve`, `/reject`, `/request-changes`, `/cancel`, `/versions` ou `/history` não existem, teste deve revelar a lacuna; não transformar teste de integração em mock só para ficar verde. Reportar como bloqueio para fechamento do backend.

### I02 — `integration/PurchaseRequestConcurrencyIT.java` [P0, eliminador de falsa confiança]

1. **Mesma etapa, dois aprovadores concorrentes**: dois usuários elegíveis, mesmo `lockVersion`, início coordenado por `CountDownLatch`/`CyclicBarrier` e transações **independentes** (não uma única transação do teste); exatamente um commit/aprovação; segundo retorna HTTP 409; estado final da etapa aprovado uma única vez; trilha e avanço sem duplicidade.
2. **Orçamento disputado**: duas solicitações distintas de R$ 8.000 na última etapa; único saldo disponível de R$ 10.000; duas transações iniciadas juntas; exatamente uma aprovação final e a outra 422 `BUDGET_EXCEEDED`; consumed cresce apenas R$ 8.000 e nunca supera allocated; sem lost update.
3. **Repetir várias rodadas** com dados isolados para reduzir falso positivo de concorrência; sem sleeps como única sincronização. Usar `ExecutorService` com timeouts e fechamento correto; não esconder exceções de futures.
4. **Locks:** conferir se o mecanismo real usa `@Version` ou bloqueio pessimista no fluxo adequado, inclusive na atualização do orçamento. Não usar somente um if de lockVersion, que pode sofrer race entre leitura e escrita.
5. Se requisito de 409/422 não funcionar, registrar os dois resultados e corrigir mínimo de produção após teste vermelho. Não trocar as expectativas para 500/200 ou marcar como ignorado.

## 4. Exigências técnicas para não produzir testes falsos

- JUnit 5 + Mockito em unitários; sem `@SpringBootTest` desnecessário em todo teste.
- `@Transactional` em casos com DB **não pode fazer o teste inteiro rodar numa única transação**, ocultando concorrência/commit real. Para testes de dois threads usar transações independentes e barreira de sincronização.
- `@Version` é diferente de `currentVersion`: comparar ambos nos asserts. O lock deve ser atualizado em alterações; a versão da solicitação muda apenas no reenvio, após a primeira submissão sair de 0 para 1.
- Testar as bordas monetárias 1000.00, 1000.01, 10000.00, 10000.01 e SOFTWARE.
- Checar `HttpStatus.UNPROCESSABLE_CONTENT` onde aplicável e códigos `BusinessException.getCode()` reais; `NoSuchMethodError`/classes não existentes não são solução.
- Se o projeto não tem idempotência de approve (diferencial, não obrigatória), não exigi-la como se fosse parte do contrato; **concorrência/409 continua obrigatória**.
- Comparar montantes monetários com `BigDecimal.compareTo()` quando a escala não importa, mas assegurar persistência com precisão DECIMAL apropriada.
- Mockito não prova constraints SQL, dirty checking, JSONB, FK, unique ou rollback: esses pontos pertencem aos IT.
- `@Disabled`, `Assumptions.assumeTrue()` ou skip por ausência de Docker nunca podem ser confundidos com suíte verde; reportar ambiente bloqueado.
- Evitar nomes inventados de `CostCenterEntity.isActive()`, `generateLevels()`, getters ou enums. Reusar `CostCenterStatus.ACTIVE`, `CostCenterEntity.getId()` e API de domínio existente.
- Não criar segunda camada idempotente sem prova de necessidade; comportamento concorrente do `saveAndFlush` pode marcar transação para rollback. Se houver falha, corrigir fronteira transacional com teste real primeiro.

## 5. Maven: garantir que as oito classes realmente executam

Inspecionar `backend/pom.xml`. O Surefire roda `*Test.java` tipicamente em `test`; `*IT.java` costuma exigir **Maven Failsafe** nas fases `integration-test`/`verify`. Configurar Failsafe em `backend/pom.xml` **apenas se não houver equivalente**, usando versões gerenciadas/compatíveis do projeto, sem quebrar plugins existentes. Alternativa fundamentada: nome `PurchaseRequestConcurrencyTest.java` se a convenção atual executar todos os testes em Surefire (registrar escolha). Na entrega, `mvnw.cmd clean verify` deve executar ambas as categorias.

Comandos a partir da raiz:

```powershell
cd .\backend
.\mvnw.cmd -version
.\mvnw.cmd clean compile
.\mvnw.cmd '-Dtest=ApprovalFlowFactoryTest,PurchaseAmountCalculatorTest,PurchaseRequestPolicyTest,PurchaseRequestValidatorTest,PurchaseRequestServiceTest,SubmitPurchaseRequestServiceTest' test
.\mvnw.cmd clean verify
```

`-Dtest=...` em aspas simples é seguro em PowerShell. Confirmar nos relatórios `backend/target/surefire-reports/` e, quando Failsafe utilizado, `backend/target/failsafe-reports/` que **a concorrência IT realmente rodou**. Se Maven Wrapper inexistente, registrar e escolher `mvn` somente se instalado; não inventar executável.

## 6. Docker Compose — validação real, segura, sem destruir volume

**Executar no Windows PowerShell da raiz do projeto**, após confirmar que Docker Desktop está iniciado e que `docker-compose.yml` da raiz existe. Verificar que os serviços e variáveis corretos são os do projeto (não adivinhar o nome do serviço ou DB):

```powershell
cd 'D:\xampp\htdocs\kingspan-isoeste-teste\developer-kingspan'
docker version
docker info
docker compose version
docker compose config --services
docker compose config --quiet
docker compose ps
docker compose up -d --build
docker compose ps
docker compose logs --tail=150
```

Notas:
- Se `docker compose config --quiet` falhar por env, criar/ajustar arquivo local `.env` usando `.env.example` e **segredos de desenvolvimento**; não commitar `.env`. Não usar tokens reais em logs.
- Não assumir service `postgres` ou `backend`; identificar via `docker compose config --services`.
- Se compose raiz não sobe backend/frontend, registrar lacuna e corrigir apenas configuração permitida, sem alterar arquivos protegidos. O README exige `docker compose up --build` para subir banco, backend e frontend, executar migrations e seed automaticamente.
- `docker compose up -d --build` sobe em background e permite seguir os logs; para validação textual do contrato também rodar `docker compose up --build` se necessário após estabilizar, sem alterar volumes.
- Se houver erro, mostrar `docker compose logs --tail=200 <serviço>` e corrigir causa raiz; não apagar volumes nem fazer `Flyway repair` automaticamente.

## 7. PostgreSQL e Flyway — conferência somente leitura

Identificar **serviço do banco** via `docker compose config --services`. Nos exemplos abaixo, substituir `postgres` caso o nome real seja diferente. Os comandos usam variáveis dentro do container; verificar se `POSTGRES_USER` e `POSTGRES_DB` estão definidas nele, senão usar os nomes definidos no Compose local. Executar em PowerShell, usando o arquivo `SPEC-07-Validacao-Postgres.sql` fornecido junto com esta SPEC (colocar na raiz local do clone, sem alterar o README). No comando abaixo, `postgres` é **apenas exemplo**; substitua pelo nome encontrado em `docker compose config --services`:

```powershell
# Rodar da raiz; esta conferência não altera nenhum dado
Get-Content -Raw .\SPEC-07-Validacao-Postgres.sql | docker compose exec -T postgres sh -lc 'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Se `POSTGRES_USER`/`POSTGRES_DB` não estiverem disponíveis dentro do container, conferir `.env.example`/Compose, obter o nome do banco e usuário de **teste** e usar os valores reais. Se falhar, verificar a causa e registrar o erro; não mudar para uma conexão de produção. O SQL anexo inclui consultas ao Flyway, tabelas, índices, constraints e invariantes de integridade. Para inspeção interativa, use `docker compose exec <servico_db> sh` e execute `psql` dentro do container.

Consultar tabelas que efetivamente existem. Esperadas pelo domínio/migrations previamente compartilhadas: `users`, `cost_centers`, `monthly_budgets`, `purchase_requests`, `request_items`, `request_versions`, `request_version_items`, `approval_steps`, `request_idempotency`, e a tabela de auditoria com **nome real obtido via código/migration**. Não inventar o nome da tabela de eventos.

SQL de inspeção (somente leitura):

```sql
SELECT installed_rank, version, description, success FROM flyway_schema_history ORDER BY installed_rank;
SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
SELECT conrelid::regclass AS tabela, conname AS constraint, contype
FROM pg_constraint WHERE connamespace='public'::regnamespace ORDER BY 1,2;
SELECT id, requester_id, cost_center_id, status, current_version, lock_version, total_amount
FROM purchase_requests ORDER BY id DESC LIMIT 20;
SELECT id, purchase_request_id, version_number, total_amount
FROM request_versions ORDER BY id DESC LIMIT 20;
SELECT request_version_id, step_order, required_level, status, approver_id
FROM approval_steps ORDER BY request_version_id DESC, step_order LIMIT 30;
SELECT user_id, idempotency_key, processing_status, purchase_request_id, response_status,
       response_body IS NOT NULL AS has_response, created_at, expires_at
FROM request_idempotency ORDER BY id DESC LIMIT 20;
SELECT request_version_id, COUNT(*) AS pending_count
FROM approval_steps WHERE status='PENDING' GROUP BY request_version_id HAVING COUNT(*) > 1;
SELECT request_version_id, approver_id, COUNT(*) AS approvals
FROM approval_steps WHERE status='APPROVED' AND approver_id IS NOT NULL
GROUP BY request_version_id, approver_id HAVING COUNT(*) > 1;
SELECT cost_center_id, competence, allocated, consumed
FROM monthly_budgets WHERE consumed < 0 OR consumed > allocated;
```

**Atenção:** a consulta de `monthly_budgets` pressupõe colunas `competence`, `allocated`, `consumed`, conforme o modelo relatado; conferir nomes via `information_schema.columns` antes. `approval_steps` pode usar outro enum para o status pendente; confirmar primeiro. As três últimas consultas precisam retornar **zero linhas** quando o domínio está íntegro; falha de SQL por coluna inexistente pede ajuste da consulta, não da entidade sem investigação.

Conferir migrations de `Flyway` com `success=true`, PK/FK/UNIQUE, CHECK para itens e orçamento, unique `(user_id,idempotency_key)` e unique da etapa por versão. Conferir registros efetivos de testes funcionais criados no banco de desenvolvimento. Os testes Testcontainers executam em um PostgreSQL efêmero **distinto** do Compose local, portanto suas linhas podem não aparecer no Compose — isso é esperado.

## 8. Verificação manual HTTP (Postman ou curl)

Com tokens verdadeiros de seed/de teste (não commitar):

1. POST `/auth/login`, GET `/auth/me` para SOLICITANTE, APROVADOR NIVEL_1, NIVEL_2, ADMIN.
2. POST `/requests` com `Idempotency-Key` estável, `X-Request-Id` e itens de R$ 13.500 => 201, DRAFT, total servidor, currentVersion=0.
3. Mesmo POST/chave => 201, **mesmo id/response**; alterar payload mesma chave => 409; outra chave => novo id. Confirmar no DB.
4. GET `/requests/{id}` como dono => 200; como estranho/outro centro => 404; ADMIN => 200.
5. PUT `/requests/{id}` com lockVersion atual => 200, novo total e lockVersion; lock antigo => 409 sem overwrite.
6. POST `/requests/{id}/submit` com lock atual => 204 (contrato do controller atual), versão 1, chain, um audit; repetir => 409/422 conforme ordem de verificação.
7. Se endpoints existem: inbox, aprovações na sequência NIVEL_1 → NIVEL_2 → ADMIN, orçamento consumido uma vez; autores/níveis errados proibidos; rejeição/devolução comentários >=10; v1→v2; orçamento insuficiente 422.
8. Verificar JWT ausente/expirado => 401, visibilidade => 404, ação por papel => 403, lock => 409, negócio => 422, erros `application/problem+json` com `code` e `errors[]` quando validação.
9. GET `/requests?page=0&size=20&sort=createdAt,desc` e filtros `status`, `category`, `costCenterId`, `createdFrom`, `createdTo`; confirmar contrato pedido pelo README (`data`, `page`, `size`, `totalElements`, `totalPages`). Se ainda retorna `content`, registrar desvio e corrigir se parte do escopo possível.

Usar IDs e lockVersion **lidos da API**, não presumir números fixos.

## 9. Ordem e critério de parada

Fase A: inventário → baseline `clean compile` e testes antigos (conservar relatório).  
Fase B: seis unitários (P0 primeiro, depois U04) → executar e corrigir falhas reais.  
Fase C: I01 com PostgreSQL real para fluxos já implementados; não inventar implementação para passar.  
Fase D: I02 de concorrência quando existem approve + budget transacionais.  
Fase E: `clean verify` completo, Docker Compose, Flyway, SQL read-only, Postman.  
Fase F: `git status --short`, `git diff --check`, conferir arquivos protegidos e scripts/hooks, relatórios de teste e CI.

**Gate da SPEC 07:** nenhum teste legado regrediu; seis unitários + dois arquivos de integração identificados e efetivamente executados (sendo IT via Failsafe se mantido); código de produção minimamente alterado; schema migrado sem repair; estados/valores/versões/auditoria/concorrência corretos; comandos e logs reproduzíveis. **Se approve/orçamento inexistentes, gate NÃO concluído**: marcar BLOCKED e indicar trabalho de backend, mesmo com todos os testes disponíveis verdes.

## 10. Relatório obrigatório do Codex após executar

Produza resposta objetiva e verificável:

```text
SPEC 07 — RELATÓRIO
Branch e commit HEAD:
Arquivos criados/alterados (e motivo):
Testes existentes ANTES: executados / sucesso / falhas:
Unitários novos: nome | quantidade | passou/falhou/pendente:
Integração real: nome | quantidade | passou/falhou/pendente:
ConcurrencyIT: executado pelo Maven? (como foi comprovado):
Maven commands e exit codes:
Docker Compose: serviços e status (docker compose ps):
Flyway: versões aplicadas, success e falhas:
Tabelas esperadas: presentes/ausentes; constraints críticas:
Queries de integridade: nº de linhas inválidas:
Postman: endpoint, perfil, HTTP real e resultado:
Débitos técnicos/bloqueios (não ocultar):
Alterações em arquivos protegidos: nenhuma, comprovar git diff:
Hooks e registro de IA: seguir instruções, sem bypass:
Próxima correção mínima recomendada:
```

Se possível anexar trechos úteis de `target/surefire-reports`, `target/failsafe-reports`, `docker compose ps`, Flyway e consultas SQL, **sem segredos, tokens ou senhas**. Não apresentar resultados não executados como aprovados.

---

### Referência rápida de negócio

- Papéis SOLICITANTE/APROVADOR/ADMIN; NIVEL_2 pode decidir NIVEL_1; ADMIN decide ADMIN; jamais aprovar a própria compra ou duas etapas da mesma versão.
- ≤ R$1.000: N1; R$1.000,01–R$10.000: N1→N2; >R$10.000: N1→N2→ADMIN; SOFTWARE força ADMIN no fim, uma única vez.
- DRAFT → submit → PENDING_APPROVAL; return changes → CHANGES_REQUESTED → edit/re-submit → nova versão; APPROVED/REJECTED/CANCELLED finais.
- `lockVersion` controla concorrência em toda transição; `currentVersion` acompanha snapshot da solicitação.
- Orçamento debitado **apenas na última aprovação**, na competência mensal do envio da versão atual no fuso `America/Sao_Paulo`; sem orçamento = saldo zero.
- Idempotência do POST /requests por par `(userId, Idempotency-Key)`, mesmo payload/mesma resposta, no mínimo 24 horas.
- Append-only auditoria com identidade, ação, status, etapa, versão, instante UTC, comentário e requestId.
