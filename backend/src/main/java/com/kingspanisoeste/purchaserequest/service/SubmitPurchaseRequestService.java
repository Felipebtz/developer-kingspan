
package com.kingspanisoeste.purchaserequest.service;

import com.kingspanisoeste.purchaserequest.domain.ApprovalFlowFactory;
import com.kingspanisoeste.purchaserequest.domain.PurchaseRequestPolicy;
import com.kingspanisoeste.purchaserequest.domain.PurchaseRequestValidator;
import com.kingspanisoeste.purchaserequest.dto.SubmitPurchaseRequestDTO;
import com.kingspanisoeste.purchaserequest.entity.ApprovalStepEntity;
import com.kingspanisoeste.purchaserequest.entity.PurchaseRequestEntity;
import com.kingspanisoeste.purchaserequest.entity.RequestVersionEntity;
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
public class SubmitPurchaseRequestService {

    private final PurchaseRequestRepository requestRepository;
    private final RequestVersionRepository versionRepository;
    private final ApprovalStepRepository approvalStepRepository;
    private final PurchaseRequestPolicy policy;
    private final PurchaseRequestValidator validator;
    private final ApprovalFlowFactory approvalFlowFactory;
    private final PurchaseRequestAuditService auditService;

    public SubmitPurchaseRequestService(
            PurchaseRequestRepository requestRepository,
            RequestVersionRepository versionRepository,
            ApprovalStepRepository approvalStepRepository,
            PurchaseRequestPolicy policy,
            PurchaseRequestValidator validator,
            ApprovalFlowFactory approvalFlowFactory,
            PurchaseRequestAuditService auditService) {

        this.requestRepository = requestRepository;
        this.versionRepository = versionRepository;
        this.approvalStepRepository = approvalStepRepository;
        this.policy = policy;
        this.validator = validator;
        this.approvalFlowFactory = approvalFlowFactory;
        this.auditService = auditService;
    }

    @Transactional
    public void submitRequest(Long requestId, SubmitPurchaseRequestDTO dto, Long userId, String role, String tracingId) {

        PurchaseRequestEntity request = requestRepository.findById(requestId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "REQUEST_NOT_FOUND", "Solicitação não encontrada."));

        policy.requireSubmitPermission(request, userId);

        if (!Objects.equals(request.getLockVersion(), dto.lockVersion())) {
            throw new BusinessException(HttpStatus.CONFLICT, "CONCURRENT_MODIFICATION", "Versão de concorrência desatualizada.");
        }

        validator.validateForSubmission(request);

        PurchaseRequestStatus previousStatus = request.getStatus();
        int nextVersion = request.getCurrentVersion() + 1;
        Instant submittedAt = Instant.now();

        RequestVersionEntity snapshot = new RequestVersionEntity(request, nextVersion, userId, submittedAt);

        request.markSubmitted(nextVersion, submittedAt);
        requestRepository.saveAndFlush(request);
        versionRepository.saveAndFlush(snapshot);

        List<ApprovalStepEntity> steps = approvalFlowFactory.generateSteps(snapshot);

        if (steps.isEmpty()) {
            throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "APPROVAL_FLOW_EMPTY", "Não foi possível definir o fluxo de aprovação.");
        }

        approvalStepRepository.saveAll(steps);

        String action = nextVersion == 1 ? "REQUEST_SUBMITTED" : "REQUEST_RESUBMITTED";

        auditService.record(
                request, userId, role != null ? role : "SOLICITANTE",
                action, previousStatus, PurchaseRequestStatus.PENDING_APPROVAL,
                nextVersion, tracingId, "Solicitação submetida para aprovação."
        );
    }
}
