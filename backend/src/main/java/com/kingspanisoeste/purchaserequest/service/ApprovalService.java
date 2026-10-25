package com.kingspanisoeste.purchaserequest.service;

import com.kingspanisoeste.auth.entity.UserEntity;
import com.kingspanisoeste.auth.repository.UserRepository;
import com.kingspanisoeste.budget.service.BudgetService;
import com.kingspanisoeste.purchaserequest.domain.PurchaseRequestPolicy;
import com.kingspanisoeste.purchaserequest.entity.ApprovalStepEntity;
import com.kingspanisoeste.purchaserequest.entity.PurchaseRequestEntity;
import com.kingspanisoeste.purchaserequest.entity.RequestVersionEntity;
import com.kingspanisoeste.purchaserequest.entity.enums.ApprovalStepStatus;
import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseRequestStatus;
import com.kingspanisoeste.purchaserequest.repository.ApprovalStepRepository;
import com.kingspanisoeste.purchaserequest.repository.PurchaseRequestRepository;
import com.kingspanisoeste.purchaserequest.repository.RequestVersionRepository;
import com.kingspanisoeste.shared.exception.BusinessException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

@Service
public class ApprovalService {

    private final PurchaseRequestRepository requestRepository;
    private final RequestVersionRepository versionRepository;
    private final ApprovalStepRepository stepRepository;
    private final UserRepository userRepository;
    private final PurchaseRequestPolicy policy;
    private final BudgetService budgetService;
    private final PurchaseRequestAuditService auditService;

    public ApprovalService(
        PurchaseRequestRepository requestRepository,
        RequestVersionRepository versionRepository,
        ApprovalStepRepository stepRepository,
        UserRepository userRepository,
        PurchaseRequestPolicy policy,
        BudgetService budgetService,
        PurchaseRequestAuditService auditService
    ) {
        this.requestRepository = requestRepository;
        this.versionRepository = versionRepository;
        this.stepRepository = stepRepository;
        this.userRepository = userRepository;
        this.policy = policy;
        this.budgetService = budgetService;
        this.auditService = auditService;
    }

    @Transactional
    public void approve(
        Long requestId,
        Long lockVersion,
        String comment,
        Long actorId,
        String tracingId
    ) {
        DecisionContext context = loadDecisionContext(
            requestId,
            lockVersion,
            actorId,
            true
        );

        ApprovalStepEntity currentStep = context.currentStep();
        ApprovalStepEntity nextStep = findNextStep(
            context.steps(),
            currentStep
        );

        if (nextStep == null) {
            budgetService.consumeForFinalApproval(context.version());
        }

        currentStep.approve(actorId, Instant.now());

        PurchaseRequestStatus newStatus;
        String action;
        if (nextStep == null) {
            context.request().markApproved();
            newStatus = PurchaseRequestStatus.APPROVED;
            action = "REQUEST_APPROVED";
        } else {
            nextStep.activate();
            context.request().markApprovalProgress();
            newStatus = PurchaseRequestStatus.PENDING_APPROVAL;
            action = "STEP_APPROVED";
        }

        requestRepository.saveAndFlush(context.request());
        recordDecision(context, action, newStatus, tracingId, normalize(comment));
    }

    @Transactional
    public void reject(
        Long requestId,
        Long lockVersion,
        String comment,
        Long actorId,
        String tracingId
    ) {
        DecisionContext context = loadDecisionContext(
            requestId,
            lockVersion,
            actorId,
            false
        );
        policy.requireDecisionComment(comment);

        context.currentStep().reject(actorId, Instant.now());
        cancelRemainingSteps(context.steps(), context.currentStep());
        context.request().markRejected();
        requestRepository.saveAndFlush(context.request());
        recordDecision(
            context,
            "REQUEST_REJECTED",
            PurchaseRequestStatus.REJECTED,
            tracingId,
            comment.trim()
        );
    }

    @Transactional
    public void requestChanges(
        Long requestId,
        Long lockVersion,
        String comment,
        Long actorId,
        String tracingId
    ) {
        DecisionContext context = loadDecisionContext(
            requestId,
            lockVersion,
            actorId,
            false
        );
        policy.requireDecisionComment(comment);

        context.currentStep().requestChanges(actorId, Instant.now());
        cancelRemainingSteps(context.steps(), context.currentStep());
        context.request().markChangesRequested();
        requestRepository.saveAndFlush(context.request());
        recordDecision(
            context,
            "CHANGES_REQUESTED",
            PurchaseRequestStatus.CHANGES_REQUESTED,
            tracingId,
            comment.trim()
        );
    }

    @Transactional
    public void cancel(
        Long requestId,
        Long lockVersion,
        Long actorId,
        String tracingId
    ) {
        PurchaseRequestEntity request = findRequestForUpdate(requestId);
        UserEntity actor = findActor(actorId);

        policy.requireCancelAccess(request, actor);
        requireCurrentLock(request, lockVersion);
        policy.requireCancelableState(request);

        PurchaseRequestStatus previousStatus = request.getStatus();
        if (request.getCurrentVersion() > 0) {
            RequestVersionEntity version = findCurrentVersion(request);
            stepRepository.findByRequestVersionIdOrderByStepOrderAsc(version.getId())
                .stream()
                .filter(step -> step.getStatus() == ApprovalStepStatus.WAITING
                    || step.getStatus() == ApprovalStepStatus.PENDING)
                .forEach(ApprovalStepEntity::cancel);
        }

        request.markCancelled();
        requestRepository.saveAndFlush(request);
        auditService.record(
            request,
            actor.getId(),
            actor.getRole().name(),
            "REQUEST_CANCELLED",
            previousStatus,
            PurchaseRequestStatus.CANCELLED,
            request.getCurrentVersion(),
            tracingId,
            "Solicitação cancelada."
        );
    }

    private DecisionContext loadDecisionContext(
        Long requestId,
        Long lockVersion,
        Long actorId,
        boolean checkDuplicateApproval
    ) {
        PurchaseRequestEntity request = findRequestForUpdate(requestId);
        UserEntity actor = findActor(actorId);

        policy.requireDecisionAccess(request, actor);
        requireCurrentLock(request, lockVersion);

        if (request.getStatus() != PurchaseRequestStatus.PENDING_APPROVAL) {
            throw new BusinessException(
                HttpStatus.UNPROCESSABLE_CONTENT,
                "INVALID_TRANSITION",
                "A solicitação não está pendente de aprovação."
            );
        }

        RequestVersionEntity version = findCurrentVersion(request);
        List<ApprovalStepEntity> steps =
            stepRepository.findByRequestVersionIdOrderByStepOrderAsc(version.getId());
        ApprovalStepEntity currentStep = steps.stream()
            .filter(ApprovalStepEntity::isPending)
            .findFirst()
            .orElseThrow(() -> new BusinessException(
                HttpStatus.UNPROCESSABLE_CONTENT,
                "APPROVAL_STEP_NOT_FOUND",
                "Não existe etapa pendente para esta solicitação."
            ));

        boolean alreadyApproved = checkDuplicateApproval
            && stepRepository.existsByRequestVersionIdAndApproverIdAndStatus(
                version.getId(),
                actorId,
                ApprovalStepStatus.APPROVED
            );

        policy.requireDecisionRules(
            request,
            currentStep,
            actor,
            alreadyApproved
        );

        return new DecisionContext(
            request,
            version,
            currentStep,
            steps,
            actor
        );
    }

    private PurchaseRequestEntity findRequestForUpdate(Long requestId) {
        return requestRepository.findByIdForUpdate(requestId)
            .orElseThrow(() -> new BusinessException(
                HttpStatus.NOT_FOUND,
                "REQUEST_NOT_FOUND",
                "Solicitação não encontrada."
            ));
    }

    private UserEntity findActor(Long actorId) {
        return userRepository.findById(actorId)
            .orElseThrow(() -> new BusinessException(
                HttpStatus.UNAUTHORIZED,
                "INVALID_SESSION",
                "Usuário autenticado não encontrado."
            ));
    }

    private RequestVersionEntity findCurrentVersion(
        PurchaseRequestEntity request
    ) {
        return versionRepository.findByPurchaseRequestIdAndVersionNumber(
                request.getId(),
                request.getCurrentVersion())
            .orElseThrow(() -> new BusinessException(
                HttpStatus.UNPROCESSABLE_CONTENT,
                "REQUEST_VERSION_NOT_FOUND",
                "A versão atual da solicitação não foi encontrada."
            ));
    }

    private void requireCurrentLock(
        PurchaseRequestEntity request,
        Long lockVersion
    ) {
        if (!Objects.equals(request.getLockVersion(), lockVersion)) {
            throw new BusinessException(
                HttpStatus.CONFLICT,
                "CONCURRENT_MODIFICATION",
                "Versão de concorrência desatualizada."
            );
        }
    }

    private ApprovalStepEntity findNextStep(
        List<ApprovalStepEntity> steps,
        ApprovalStepEntity currentStep
    ) {
        return steps.stream()
            .filter(step -> step.getStepOrder() > currentStep.getStepOrder())
            .filter(step -> step.getStatus() == ApprovalStepStatus.WAITING)
            .findFirst()
            .orElse(null);
    }

    private void cancelRemainingSteps(
        List<ApprovalStepEntity> steps,
        ApprovalStepEntity currentStep
    ) {
        steps.stream()
            .filter(step -> step != currentStep)
            .filter(step -> step.getStatus() == ApprovalStepStatus.WAITING
                || step.getStatus() == ApprovalStepStatus.PENDING)
            .forEach(ApprovalStepEntity::cancel);
    }

    private void recordDecision(
        DecisionContext context,
        String action,
        PurchaseRequestStatus newStatus,
        String tracingId,
        String comment
    ) {
        auditService.record(
            context.request(),
            context.actor().getId(),
            context.actor().getRole().name(),
            action,
            PurchaseRequestStatus.PENDING_APPROVAL,
            newStatus,
            context.version().getVersionNumber(),
            context.currentStep().getStepOrder(),
            context.currentStep().getRequiredLevel(),
            tracingId,
            comment
        );
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record DecisionContext(
        PurchaseRequestEntity request,
        RequestVersionEntity version,
        ApprovalStepEntity currentStep,
        List<ApprovalStepEntity> steps,
        UserEntity actor
    ) {}
}
