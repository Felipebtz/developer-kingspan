
package com.kingspanisoeste.purchaserequest.service;

import com.kingspanisoeste.purchaserequest.entity.PurchaseRequestAuditEntity;
import com.kingspanisoeste.purchaserequest.entity.PurchaseRequestEntity;
import com.kingspanisoeste.purchaserequest.entity.enums.PurchaseRequestStatus;
import com.kingspanisoeste.purchaserequest.entity.enums.ApprovalRequiredLevel;
import com.kingspanisoeste.purchaserequest.repository.PurchaseRequestAuditRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Service
public class PurchaseRequestAuditService {

    private final PurchaseRequestAuditRepository auditRepository;

    public PurchaseRequestAuditService(
        PurchaseRequestAuditRepository auditRepository
    ) {
        this.auditRepository = auditRepository;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void record(
        PurchaseRequestEntity request,
        Long actorId,
        String actorRole,
        String action,
        PurchaseRequestStatus previousStatus,
        PurchaseRequestStatus newStatus,
        Integer versionNumber,
        String requestId,
        String comments
    ) {
        record(
            request,
            actorId,
            actorRole,
            action,
            previousStatus,
            newStatus,
            versionNumber,
            null,
            null,
            requestId,
            comments
        );
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void record(
        PurchaseRequestEntity request,
        Long actorId,
        String actorRole,
        String action,
        PurchaseRequestStatus previousStatus,
        PurchaseRequestStatus newStatus,
        Integer versionNumber,
        Integer stepOrder,
        ApprovalRequiredLevel requiredLevel,
        String requestId,
        String comments
    ) {
        Objects.requireNonNull(request);

        if (request.getId() == null) {
            throw new IllegalStateException(
                "A solicitação precisa estar persistida."
            );
        }

        if (actorRole == null || actorRole.isBlank()) {
            throw new IllegalArgumentException(
                "O papel do ator é obrigatório."
            );
        }

        if (action == null || action.isBlank()) {
            throw new IllegalArgumentException(
                "A ação de auditoria é obrigatória."
            );
        }

        String traceId = requestId;

        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString();
        }

        PurchaseRequestAuditEntity event =
            new PurchaseRequestAuditEntity(
                request.getId(),
                actorId,
                actorRole,
                action,
                previousStatus,
                newStatus,
                versionNumber,
                stepOrder,
                requiredLevel,
                traceId,
                comments,
                Instant.now()
            );

        auditRepository.save(event);
    }
}
