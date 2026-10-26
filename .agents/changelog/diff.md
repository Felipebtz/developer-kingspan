# AI Agent Changelog

> This file is written **automatically** by `.agents/hooks/ai-log.sh` (repository hooks for
> Claude Code and Cursor; explicit commands for every other agent — see `AGENTS.md`).
>
> Purpose: let the evaluators distinguish the candidate's own work from work delegated to AI.
>
> - **Append-only.** Never edit, reorder or delete existing entries. This is audited from the git history.
> - **All entries must be written in English.**
> - Never write secrets or personal data here.

---

## Entry format

One block per agent turn, one row per changed file:

```
---
### Turn YYYY-MM-DD HH:MM:SS ±HHMM · <Agent>
- **Source**: hook | command | manual
- **Session**: <agent session id or n/a>
- **Prompt**: <user prompt, truncated, secrets masked>
- **Summary**: <one-line summary written by the agent>

| File | Change | Additions | Removals |
|---|---|---|---|
| `relative/path/to/file` | created / modified / deleted | +N | -N |
```

`Source: manual` is only for entries appended by hand when the logger cannot run.

---

## Change log

<!-- AI agent entries will be inserted below this line -->

---
### Turn 2026-10-24 22:19:36 -0300 · Codex
- **Source**: manual
- **Session**: n/a
- **Prompt**: Run Gate A.1 minimal baseline fixes and verify Maven, Docker, and Flyway.
- **Summary**: Added missing imports required to compile the purchase request baseline.

| File | Change | Additions | Removals |
|---|---|---|---|
| `backend/src/main/java/com/kingspanisoeste/purchaserequest/repository/PurchaseRequestAuditRepository.java` | modified | +8 | -0 |
| `backend/src/main/java/com/kingspanisoeste/purchaserequest/dto/SubmitPurchaseRequestDTO.java` | modified | +3 | -0 |

---
### Turn 2026-10-24 22:58:27 -0300 · Codex
- **Source**: manual
- **Session**: n/a
- **Prompt**: Run Gate A.2 final backend stabilization and validate the isolated PostgreSQL database.
- **Summary**: Added a Jackson 2 compatibility bean and validated tests, authentication, idempotency, and isolated PostgreSQL migrations.

| File | Change | Additions | Removals |
|---|---|---|---|
| `backend/src/main/java/com/kingspanisoeste/config/Jackson2Config.java` | created | +19 | -0 |

---
### Turn 2026-10-24 23:27:19 -0300 · Codex
- **Source**: manual
- **Session**: n/a
- **Prompt**: Implement Gates B and C with approval decisions, transactional budget consumption, REST endpoints, and PostgreSQL validation.
- **Summary**: Implemented transactional approval decisions, sequential authorization, budget locking, REST endpoints, and validated concurrency on PostgreSQL.

| File | Change | Additions | Removals |
|---|---|---|---|
| `backend/src/main/java/com/kingspanisoeste/budget/entity/MonthlyBudgetEntity.java` | modified | +22 | -0 |
| `backend/src/main/java/com/kingspanisoeste/budget/repository/MonthlyBudgetRepository.java` | modified | +22 | -5 |
| `backend/src/main/java/com/kingspanisoeste/budget/service/BudgetService.java` | created | +53 | -0 |
| `backend/src/main/java/com/kingspanisoeste/purchaserequest/controller/ApprovalController.java` | created | +95 | -0 |
| `backend/src/main/java/com/kingspanisoeste/purchaserequest/domain/PurchaseRequestPolicy.java` | modified | +176 | -0 |
| `backend/src/main/java/com/kingspanisoeste/purchaserequest/dto/ApprovalDecisionDTO.java` | created | +9 | -0 |
| `backend/src/main/java/com/kingspanisoeste/purchaserequest/dto/CancelPurchaseRequestDTO.java` | created | +8 | -0 |
| `backend/src/main/java/com/kingspanisoeste/purchaserequest/entity/PurchaseRequestAuditEntity.java` | modified | +60 | -0 |
| `backend/src/main/java/com/kingspanisoeste/purchaserequest/entity/PurchaseRequestEntity.java` | modified | +45 | -0 |
| `backend/src/main/java/com/kingspanisoeste/purchaserequest/repository/ApprovalStepRepository.java` | modified | +6 | -0 |
| `backend/src/main/java/com/kingspanisoeste/purchaserequest/repository/PurchaseRequestRepository.java` | modified | +11 | -0 |
| `backend/src/main/java/com/kingspanisoeste/purchaserequest/service/ApprovalService.java` | created | +349 | -0 |
| `backend/src/main/java/com/kingspanisoeste/purchaserequest/service/PurchaseRequestAuditService.java` | modified | +30 | -0 |
| `backend/src/main/java/com/kingspanisoeste/shared/exception/GlobalExceptionHandler.java` | modified | +25 | -1 |

---
### Turn 2026-10-24 23:41:46 -0300 · Codex
- **Source**: manual
- **Session**: n/a
- **Prompt**: Complete SPEC 07 by adding the six required unit test suites and focused approval and budget tests.
- **Summary**: Added six required purchase request unit test suites plus focused approval and budget service tests.

| File | Change | Additions | Removals |
|---|---|---|---|
| `backend/src/test/java/com/kingspanisoeste/budget/service/BudgetServiceTest.java` | created | +99 | -0 |
| `backend/src/test/java/com/kingspanisoeste/purchaserequest/domain/ApprovalFlowFactoryTest.java` | created | +71 | -0 |
| `backend/src/test/java/com/kingspanisoeste/purchaserequest/domain/PurchaseAmountCalculatorTest.java` | created | +68 | -0 |
| `backend/src/test/java/com/kingspanisoeste/purchaserequest/domain/PurchaseRequestPolicyTest.java` | created | +141 | -0 |
| `backend/src/test/java/com/kingspanisoeste/purchaserequest/domain/PurchaseRequestValidatorTest.java` | created | +115 | -0 |
| `backend/src/test/java/com/kingspanisoeste/purchaserequest/service/ApprovalServiceTest.java` | created | +151 | -0 |
| `backend/src/test/java/com/kingspanisoeste/purchaserequest/service/PurchaseRequestServiceTest.java` | created | +214 | -0 |
| `backend/src/test/java/com/kingspanisoeste/purchaserequest/service/SubmitPurchaseRequestServiceTest.java` | created | +181 | -0 |

---
### Turn 2026-10-25 01:50:51 -0300 · Codex
- **Source**: manual
- **Session**: n/a
- **Prompt**: Complete frontend JWT authentication integration, fix TypeScript and Redux session bootstrap, and validate the production build.
- **Summary**: Centralized session storage, fixed typed Redux authentication bootstrap, guarded password recovery parameters, and completed production validation.

| File | Change | Additions | Removals |
|---|---|---|---|
| `frontend/lib/redux/auth/session.ts` | created | +1 | -0 |
| `frontend/lib/redux/hooks.ts` | modified | +3 | -2 |
| `frontend/lib/redux/ApiAuthBootstrap.tsx` | modified | +2 | -3 |
| `frontend/lib/redux/StoreProvider.tsx` | modified | +4 | -5 |
| `frontend/app/(auth)/login/page.tsx` | modified | +2 | -4 |
| `frontend/app/(auth)/forgot-password/otp/page.tsx` | modified | +17 | -3 |
| `frontend/app/(auth)/forgot-password/reset-password/page.tsx` | modified | +11 | -2 |
| `frontend/app/layout.tsx` | modified | +2 | -1 |

---
### Turn 2026-10-25 02:08:26 -0300 · Codex
- **Source**: manual
- **Session**: n/a
- **Prompt**: Validate the frontend JWT flow against the real backend and complete browser interoperability.
- **Summary**: Enabled narrowly scoped configurable CORS for the frontend and validated login, session identity, and unauthorized handling against PostgreSQL.

| File | Change | Additions | Removals |
|---|---|---|---|
| `backend/src/main/java/com/kingspanisoeste/security/SecurityConfig.java` | modified | +31 | -1 |

---
### Turn 2026-10-25 02:21:20 -0300 · Codex
- **Source**: manual
- **Session**: n/a
- **Prompt**: Resume and finish the real JWT authentication validation.
- **Summary**: Removed the embedded JWT fallback, decoded the configured Base64 secret, and supplied an isolated test-only key for the Spring context test.

| File | Change | Additions | Removals |
|---|---|---|---|
| `backend/src/main/java/com/kingspanisoeste/security/SecurityConfig.java` | modified | +4 | -3 |
| `backend/src/test/java/com/kingspanisoeste/KingspanApplicationTests.java` | modified | +1 | -1 |

---
### Turn 2026-10-25 03:56:08 -0300 · Codex
- **Source**: manual
- **Session**: n/a
- **Prompt**: Implement SPEC INFRA-01 with Docker Compose, demo seed, health checks, CI, tests, and isolated smoke validation.
- **Summary**: Added a reproducible three-service Docker environment, idempotent demo data, request tracing, frontend quality gates, CI coverage, and validated the real API against isolated PostgreSQL.

| File | Change | Additions | Removals |
|---|---|---|---|
| `.env.example` | created | +13 | -0 |
| `.github/workflows/ci.yml` | modified | +54 | -0 |
| `docker-compose.yml` | created | +78 | -0 |
| `backend/.dockerignore` | created | +6 | -0 |
| `backend/Dockerfile` | created | +13 | -0 |
| `backend/README.md` | created | +30 | -0 |
| `backend/src/main/java/com/kingspanisoeste/budget/repository/CostCenterRepository.java` | modified | +4 | -4 |
| `backend/src/main/java/com/kingspanisoeste/budget/repository/MonthlyBudgetRepository.java` | modified | +5 | -0 |
| `backend/src/main/java/com/kingspanisoeste/config/DemoDataSeeder.java` | created | +356 | -0 |
| `backend/src/main/java/com/kingspanisoeste/config/RequestIdFilter.java` | created | +38 | -0 |
| `backend/src/main/java/com/kingspanisoeste/purchaserequest/repository/PurchaseRequestRepository.java` | modified | +2 | -0 |
| `backend/src/main/java/com/kingspanisoeste/security/SecurityConfig.java` | modified | +1 | -0 |
| `backend/src/main/resources/application.properties` | modified | +5 | -0 |
| `backend/src/test/java/com/kingspanisoeste/config/RequestIdFilterTest.java` | created | +34 | -0 |
| `frontend/.dockerignore` | created | +6 | -0 |
| `frontend/Dockerfile` | created | +23 | -0 |
| `frontend/README.md` | modified | +25 | -36 |
| `frontend/app/(auth)/forgot-password/otp/page.tsx` | modified | +0 | -1 |
| `frontend/app/dashboard/approvals/page.tsx` | modified | +3 | -9 |
| `frontend/app/dashboard/requests/[id]/edit/page.tsx` | modified | +3 | -16 |
| `frontend/app/dashboard/requests/[id]/page.tsx` | modified | +50 | -38 |
| `frontend/app/dashboard/requests/new/page.tsx` | modified | +4 | -1 |
| `frontend/hooks/use-mobile.ts` | modified | +9 | -12 |
| `frontend/next.config.ts` | modified | +1 | -0 |
| `frontend/package.json` | modified | +4 | -1 |

---
### Turn 2026-10-25 16:04:12 -0300 · Codex
- **Source**: command
- **Session**: n/a
- **Prompt**: n/a
- **Summary**: Fix frontend request action imports and duplicate status type import

| File | Change | Additions | Removals |
|---|---|---|---|
| `backend/src/main/java/com/kingspanisoeste/budget/dto/CostCenterResponseDTO.java` | created | +0 | -0 |
| `backend/src/main/java/com/kingspanisoeste/budget/dto/CreateCostCenterDTO.java` | created | +0 | -0 |
| `backend/src/main/java/com/kingspanisoeste/budget/dto/CreateMonthlyBudgetDTO.java` | modified | +9 | -0 |
| `backend/src/main/java/com/kingspanisoeste/budget/dto/MonthlyBudgetResponseDTO.java` | created | +13 | -0 |
| `backend/src/main/java/com/kingspanisoeste/budget/dto/UpdateMonthlyBudgetDTO.java` | created | +7 | -0 |
| `frontend/app/dashboard/requests/[id]/edit/page.tsx` | modified | +1 | -1 |
| `frontend/app/dashboard/requests/[id]/page.tsx` | modified | +1 | -1 |
| `frontend/app/dashboard/requests/new/page.tsx` | modified | +1 | -1 |
| `frontend/app/dashboard/requests/page.tsx` | modified | +0 | -1 |
| `frontend/tsconfig.tsbuildinfo` | modified | +1 | -1 |

---
### Turn 2026-10-25 16:12:29 -0300 · Codex
- **Source**: command
- **Session**: n/a
- **Prompt**: n/a
- **Summary**: Add the missing List import to MonthlyBudgetRepository and verify compilation

| File | Change | Additions | Removals |
|---|---|---|---|
| `backend/src/main/java/com/kingspanisoeste/budget/repository/MonthlyBudgetRepository.java` | modified | +1 | -0 |

---
### Turn 2026-10-25 20:23:11 -0300 · Codex
- **Source**: command
- **Session**: n/a
- **Prompt**: n/a
- **Summary**: Integrated approval inbox with real API eligibility and validated Maria approval flow

| File | Change | Additions | Removals |
|---|---|---|---|
| `backend/src/main/java/com/kingspanisoeste/purchaserequest/controller/ApprovalInboxController.java` | created | +36 | -0 |
| `backend/src/main/java/com/kingspanisoeste/purchaserequest/domain/PurchaseRequestPolicy.java` | modified | +32 | -2 |
| `backend/src/main/java/com/kingspanisoeste/purchaserequest/repository/PurchaseRequestRepository.java` | modified | +84 | -0 |
| `backend/src/main/java/com/kingspanisoeste/purchaserequest/service/PurchaseRequestService.java` | modified | +104 | -13 |
| `backend/src/test/java/com/kingspanisoeste/purchaserequest/domain/PurchaseRequestPolicyTest.java` | modified | +56 | -1 |
| `backend/src/test/java/com/kingspanisoeste/purchaserequest/service/PurchaseRequestServiceTest.java` | modified | +6 | -0 |
| `frontend/app/dashboard/approvals/page.tsx` | modified | +7 | -18 |
| `frontend/lib/api/approvals.ts` | modified | +16 | -2 |
| `frontend/lib/tests/approvals.test.ts` | created | +76 | -0 |

---
### Turn 2026-10-25 20:56:03 -0300 · Codex
- **Source**: command
- **Session**: n/a
- **Prompt**: n/a
- **Summary**: Separate owned request filtering from role visibility and approval eligibility, with backend and frontend regression tests

| File | Change | Additions | Removals |
|---|---|---|---|
| `backend/src/main/java/com/kingspanisoeste/purchaserequest/controller/PurchaseRequestController.java` | modified | +5 | -2 |
| `backend/src/main/java/com/kingspanisoeste/purchaserequest/service/PurchaseRequestService.java` | modified | +8 | -2 |
| `backend/src/test/java/com/kingspanisoeste/purchaserequest/controller/PurchaseRequestControllerTest.java` | created | +42 | -0 |
| `backend/src/test/java/com/kingspanisoeste/purchaserequest/domain/PurchaseRequestPolicyTest.java` | modified | +38 | -0 |
| `backend/src/test/java/com/kingspanisoeste/purchaserequest/service/PurchaseRequestServiceTest.java` | modified | +45 | -0 |
| `frontend/app/dashboard/requests/page.tsx` | modified | +1 | -1 |
| `frontend/lib/api/requests.ts` | modified | +7 | -2 |
| `frontend/lib/hooks/useRequests.ts` | modified | +7 | -5 |
| `frontend/lib/tests/requests.test.ts` | created | +40 | -0 |

---
### Turn 2026-10-25 21:09:14 -0300 · Codex
- **Source**: command
- **Session**: n/a
- **Prompt**: n/a
- **Summary**: Add regression coverage preserving approval inbox eligibility independently from owned request filtering

| File | Change | Additions | Removals |
|---|---|---|---|
| `backend/src/test/java/com/kingspanisoeste/purchaserequest/service/PurchaseRequestServiceTest.java` | modified | +36 | -0 |

---
### Turn 2026-10-25 21:20:13 -0300 · Codex
- **Source**: command
- **Session**: n/a
- **Prompt**: n/a
- **Summary**: Add a separate approver cost-center request listing while keeping owned requests and approval inbox distinct

| File | Change | Additions | Removals |
|---|---|---|---|
| `frontend/app/dashboard/requests/cost-center/page.tsx` | created | +12 | -0 |
| `frontend/app/dashboard/requests/page.tsx` | modified | +8 | -320 |
| `frontend/components/AppSidebar.tsx` | modified | +6 | -0 |
| `frontend/components/RequestsListPage.tsx` | created | +252 | -0 |
| `frontend/lib/tests/requests.test.ts` | modified | +15 | -1 |

---
### Turn 2026-10-25 21:31:28 -0300 · Codex
- **Source**: command
- **Session**: n/a
- **Prompt**: n/a
- **Summary**: Add and verify regression coverage allowing an eligible Maria approver to approve request 2 at the NIVEL_1 step

| File | Change | Additions | Removals |
|---|---|---|---|
| `backend/src/test/java/com/kingspanisoeste/purchaserequest/service/ApprovalServiceTest.java` | modified | +61 | -0 |
