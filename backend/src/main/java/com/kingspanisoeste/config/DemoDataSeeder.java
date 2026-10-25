package com.kingspanisoeste.config;

import com.kingspanisoeste.auth.entity.UserEntity;
import com.kingspanisoeste.auth.entity.enums.ApproverLevel;
import com.kingspanisoeste.auth.repository.UserRepository;
import com.kingspanisoeste.budget.entity.CostCenterEntity;
import com.kingspanisoeste.budget.entity.MonthlyBudgetEntity;
import com.kingspanisoeste.budget.repository.CostCenterRepository;
import com.kingspanisoeste.budget.repository.MonthlyBudgetRepository;
import com.kingspanisoeste.purchaserequest.dto.CreatePurchaseRequestDTO;
import com.kingspanisoeste.purchaserequest.dto.RequestItemDTO;
import com.kingspanisoeste.purchaserequest.dto.SubmitPurchaseRequestDTO;
import com.kingspanisoeste.purchaserequest.entity.ApprovalStepEntity;
import com.kingspanisoeste.purchaserequest.entity.PurchaseRequestEntity;
import com.kingspanisoeste.purchaserequest.entity.RequestVersionEntity;
import com.kingspanisoeste.purchaserequest.entity.enums.ApprovalRequiredLevel;
import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseCategory;
import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseRequestStatus;
import com.kingspanisoeste.purchaserequest.repository.ApprovalStepRepository;
import com.kingspanisoeste.purchaserequest.repository.PurchaseRequestRepository;
import com.kingspanisoeste.purchaserequest.repository.RequestVersionRepository;
import com.kingspanisoeste.purchaserequest.service.ApprovalService;
import com.kingspanisoeste.purchaserequest.service.PurchaseRequestService;
import com.kingspanisoeste.purchaserequest.service.SubmitPurchaseRequestService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;

@Component
@ConditionalOnProperty(
    prefix = "app.demo-seed",
    name = "enabled",
    havingValue = "true"
)
public class DemoDataSeeder implements CommandLineRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(DemoDataSeeder.class);
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("America/Sao_Paulo");

    private final UserRepository userRepository;
    private final CostCenterRepository costCenterRepository;
    private final MonthlyBudgetRepository budgetRepository;
    private final PurchaseRequestRepository requestRepository;
    private final RequestVersionRepository versionRepository;
    private final ApprovalStepRepository stepRepository;
    private final PasswordEncoder passwordEncoder;
    private final PurchaseRequestService requestService;
    private final SubmitPurchaseRequestService submitService;
    private final ApprovalService approvalService;

    @Value("${app.demo-seed.password}")
    private String demoPassword;

    public DemoDataSeeder(
        UserRepository userRepository,
        CostCenterRepository costCenterRepository,
        MonthlyBudgetRepository budgetRepository,
        PurchaseRequestRepository requestRepository,
        RequestVersionRepository versionRepository,
        ApprovalStepRepository stepRepository,
        PasswordEncoder passwordEncoder,
        PurchaseRequestService requestService,
        SubmitPurchaseRequestService submitService,
        ApprovalService approvalService
    ) {
        this.userRepository = userRepository;
        this.costCenterRepository = costCenterRepository;
        this.budgetRepository = budgetRepository;
        this.requestRepository = requestRepository;
        this.versionRepository = versionRepository;
        this.stepRepository = stepRepository;
        this.passwordEncoder = passwordEncoder;
        this.requestService = requestService;
        this.submitService = submitService;
        this.approvalService = approvalService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (demoPassword == null || demoPassword.length() < 8) {
            throw new IllegalStateException("DEMO_SEED_PASSWORD deve possuir pelo menos 8 caracteres.");
        }

        CostCenterEntity operations = ensureCostCenter(
            "DEMO-OPERACOES",
            "Operações",
            "Centro de custo com saldo para demonstrar o fluxo completo."
        );
        CostCenterEntity projects = ensureCostCenter(
            "DEMO-PROJETOS",
            "Projetos",
            "Centro de custo com orçamento quase esgotado."
        );

        ensureBudget(operations, new BigDecimal("100000.00"), BigDecimal.ZERO);
        ensureBudget(projects, new BigDecimal("10000.00"), new BigDecimal("9000.00"));

        String passwordHash = passwordEncoder.encode(demoPassword);
        UserEntity requesterOperations = ensureRequester(
            "Solicitante Operações", "solicitante.operacoes@demo.local", passwordHash, operations
        );
        UserEntity levelOneOperations = ensureApprover(
            "Aprovador N1 Operações", "aprovador.n1.operacoes@demo.local", passwordHash,
            operations, ApproverLevel.NIVEL_1
        );
        UserEntity levelTwoOperations = ensureApprover(
            "Aprovador N2 Operações", "aprovador.n2.operacoes@demo.local", passwordHash,
            operations, ApproverLevel.NIVEL_2
        );
        UserEntity requesterProjects = ensureRequester(
            "Solicitante Projetos", "solicitante.projetos@demo.local", passwordHash, projects
        );
        UserEntity levelOneProjects = ensureApprover(
            "Aprovador N1 Projetos", "aprovador.n1.projetos@demo.local", passwordHash,
            projects, ApproverLevel.NIVEL_1
        );
        UserEntity levelTwoProjects = ensureApprover(
            "Aprovador N2 Projetos", "aprovador.n2.projetos@demo.local", passwordHash,
            projects, ApproverLevel.NIVEL_2
        );
        UserEntity primaryAdmin = ensureAdmin(
            "Administrador Principal", "admin.principal@demo.local", passwordHash
        );
        ensureAdmin("Administrador Reserva", "admin.reserva@demo.local", passwordHash);

        ensureDraft(requesterOperations, operations, "[DEMO] Rascunho de equipamentos", new BigDecimal("500.00"));
        ensurePending(requesterOperations, operations, "[DEMO] Serviços aguardando aprovação", new BigDecimal("2500.00"));
        ensureChangesRequested(
            requesterOperations,
            levelOneOperations,
            operations,
            "[DEMO] Ajustes solicitados",
            new BigDecimal("750.00")
        );
        ensureApproved(
            requesterOperations,
            levelOneOperations,
            levelTwoOperations,
            primaryAdmin,
            operations,
            "[DEMO] Compra aprovada com três níveis",
            new BigDecimal("15000.00")
        );
        ensureBudgetExceededScenario(
            requesterProjects,
            levelOneProjects,
            levelTwoProjects,
            projects,
            "[DEMO] Aprovação bloqueada por orçamento",
            new BigDecimal("8000.00")
        );

        LOGGER.info(
            "Demo seed ready: costCenters={}, users={}, requests={}",
            costCenterRepository.count(),
            userRepository.count(),
            requestRepository.count()
        );
    }

    private CostCenterEntity ensureCostCenter(String code, String name, String description) {
        return costCenterRepository.findByCode(code)
            .orElseGet(() -> costCenterRepository.save(new CostCenterEntity(code, name, description)));
    }

    private void ensureBudget(
        CostCenterEntity costCenter,
        BigDecimal allocated,
        BigDecimal consumed
    ) {
        LocalDate competence = YearMonth.now(BUSINESS_ZONE).atDay(1);
        if (budgetRepository.findByCostCenterIdAndCompetence(costCenter.getId(), competence).isPresent()) {
            return;
        }

        MonthlyBudgetEntity budget = new MonthlyBudgetEntity(
            costCenter,
            YearMonth.from(competence),
            allocated
        );
        if (consumed.signum() > 0) {
            budget.consume(consumed);
        }
        budgetRepository.save(budget);
    }

    private UserEntity ensureRequester(
        String name,
        String email,
        String passwordHash,
        CostCenterEntity costCenter
    ) {
        return userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            UserEntity user = new UserEntity(name, email, passwordHash, costCenter);
            user.registrationApprove();
            return userRepository.save(user);
        });
    }

    private UserEntity ensureApprover(
        String name,
        String email,
        String passwordHash,
        CostCenterEntity costCenter,
        ApproverLevel level
    ) {
        return userRepository.findByEmailIgnoreCase(email)
            .orElseGet(() -> userRepository.save(
                new UserEntity(name, email, passwordHash, costCenter, level)
            ));
    }

    private UserEntity ensureAdmin(String name, String email, String passwordHash) {
        return userRepository.findByEmailIgnoreCase(email)
            .orElseGet(() -> userRepository.save(UserEntity.createAdmin(name, email, passwordHash)));
    }

    private PurchaseRequestEntity ensureDraft(
        UserEntity requester,
        CostCenterEntity costCenter,
        String title,
        BigDecimal amount
    ) {
        return requestRepository.findByTitle(title)
            .orElseGet(() -> createDraft(requester, costCenter, title, amount));
    }

    private void ensurePending(
        UserEntity requester,
        CostCenterEntity costCenter,
        String title,
        BigDecimal amount
    ) {
        PurchaseRequestEntity request = ensureDraft(requester, costCenter, title, amount);
        submitIfDraft(request, requester);
    }

    private void ensureChangesRequested(
        UserEntity requester,
        UserEntity approver,
        CostCenterEntity costCenter,
        String title,
        BigDecimal amount
    ) {
        PurchaseRequestEntity request = ensureDraft(requester, costCenter, title, amount);
        request = submitIfDraft(request, requester);
        if (request.getStatus() == PurchaseRequestStatus.PENDING_APPROVAL) {
            approvalService.requestChanges(
                request.getId(),
                request.getLockVersion(),
                "Ajustar os detalhes desta solicitação.",
                approver.getId(),
                "demo-seed-changes"
            );
        }
    }

    private void ensureApproved(
        UserEntity requester,
        UserEntity levelOne,
        UserEntity levelTwo,
        UserEntity admin,
        CostCenterEntity costCenter,
        String title,
        BigDecimal amount
    ) {
        PurchaseRequestEntity request = ensureDraft(requester, costCenter, title, amount);
        request = submitIfDraft(request, requester);

        while (request.getStatus() == PurchaseRequestStatus.PENDING_APPROVAL) {
            ApprovalStepEntity step = currentStep(request);
            UserEntity actor = switch (step.getRequiredLevel()) {
                case NIVEL_1 -> levelOne;
                case NIVEL_2 -> levelTwo;
                case ADMIN -> admin;
            };
            approvalService.approve(
                request.getId(),
                request.getLockVersion(),
                "Aprovação automática do ambiente demonstrativo.",
                actor.getId(),
                "demo-seed-approved"
            );
            request = reload(request.getId());
        }
    }

    private void ensureBudgetExceededScenario(
        UserEntity requester,
        UserEntity levelOne,
        UserEntity levelTwo,
        CostCenterEntity costCenter,
        String title,
        BigDecimal amount
    ) {
        PurchaseRequestEntity request = ensureDraft(requester, costCenter, title, amount);
        request = submitIfDraft(request, requester);
        if (request.getStatus() != PurchaseRequestStatus.PENDING_APPROVAL) {
            return;
        }

        ApprovalStepEntity step = currentStep(request);
        if (step.getRequiredLevel() == ApprovalRequiredLevel.NIVEL_1) {
            approvalService.approve(
                request.getId(),
                request.getLockVersion(),
                "Primeira etapa aprovada para demonstrar saldo insuficiente.",
                levelOne.getId(),
                "demo-seed-budget"
            );
        }

        // NIVEL_2 permanece pendente. A decisão com levelTwo resulta em BUDGET_EXCEEDED.
        if (levelTwo.getId() == null) {
            throw new IllegalStateException("Aprovador NIVEL_2 demonstrativo não persistido.");
        }
    }

    private PurchaseRequestEntity createDraft(
        UserEntity requester,
        CostCenterEntity costCenter,
        String title,
        BigDecimal amount
    ) {
        CreatePurchaseRequestDTO dto = new CreatePurchaseRequestDTO(
            costCenter.getId(),
            title,
            "Dados fictícios criados exclusivamente para demonstração local.",
            PurchaseCategory.EQUIPMENT,
            LocalDate.now(BUSINESS_ZONE).plusDays(30),
            List.of(new RequestItemDTO(null, title, 1, amount, null))
        );

        Long id = requestService.createDraft(
            dto,
            requester.getId(),
            "SOLICITANTE",
            "demo-seed-create",
            null,
            null
        ).id();
        return reload(id);
    }

    private PurchaseRequestEntity submitIfDraft(
        PurchaseRequestEntity request,
        UserEntity requester
    ) {
        if (request.getStatus() == PurchaseRequestStatus.DRAFT) {
            submitService.submitRequest(
                request.getId(),
                new SubmitPurchaseRequestDTO(request.getLockVersion()),
                requester.getId(),
                "SOLICITANTE",
                "demo-seed-submit"
            );
        }
        return reload(request.getId());
    }

    private ApprovalStepEntity currentStep(PurchaseRequestEntity request) {
        RequestVersionEntity version = versionRepository
            .findByPurchaseRequestIdAndVersionNumber(request.getId(), request.getCurrentVersion())
            .orElseThrow(() -> new IllegalStateException("Versão demonstrativa não encontrada."));
        return stepRepository.findByRequestVersionIdOrderByStepOrderAsc(version.getId())
            .stream()
            .filter(ApprovalStepEntity::isPending)
            .findFirst()
            .orElseThrow(() -> new IllegalStateException("Etapa demonstrativa pendente não encontrada."));
    }

    private PurchaseRequestEntity reload(Long requestId) {
        return requestRepository.findById(requestId)
            .orElseThrow(() -> new IllegalStateException("Solicitação demonstrativa não encontrada."));
    }
}
